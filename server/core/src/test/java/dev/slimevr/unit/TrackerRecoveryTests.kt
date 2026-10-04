package dev.slimevr.unit

import com.google.flatbuffers.FlatBufferBuilder
import dev.slimevr.VRServer
import dev.slimevr.config.ConfigManager
import dev.slimevr.tracking.trackers.Tracker
import dev.slimevr.tracking.trackers.TrackerPosition
import dev.slimevr.tracking.trackers.TrackerRecoveryState
import dev.slimevr.tracking.trackers.TrackerStatus
import dev.slimevr.tracking.trackers.udp.IMUType
import io.github.axisangles.ktmath.Quaternion
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import solarxr_protocol.data_feed.tracker.TrackerRecovery
import solarxr_protocol.data_feed.tracker.TrackerRecoveryReason
import kotlin.math.PI
import dev.slimevr.tracking.trackers.TrackerRecoveryReason as RecoveryReason
import solarxr_protocol.data_feed.tracker.TrackerRecoveryState as ProtocolRecoveryState

class TrackerRecoveryTests {
	@Test
	fun `valid rotation restores timed out and disconnected status`() {
		val configManager = ConfigManager("test-config.yml")
		configManager.loadConfig()
		configManager.vrConfig.vrcOSC.enabled = false
		configManager.vrConfig.vrcOSC.oscqueryEnabled = false
		VRServer(configManager = configManager)
		val tracker = makeTracker(99, TrackerPosition.CHEST)
		tracker.setRotation(Quaternion.IDENTITY)
		tracker.dataTick()

		tracker.status = TrackerStatus.TIMED_OUT
		tracker.dataTick()
		assertEquals(TrackerStatus.OK, tracker.status)

		tracker.status = TrackerStatus.DISCONNECTED
		tracker.dataTick()
		assertEquals(TrackerStatus.OK, tracker.status)
	}

	@Test
	fun `recovery protocol payload round trips`() {
		val fbb = FlatBufferBuilder(64)
		val offset = TrackerRecovery.createTrackerRecovery(
			fbb,
			ProtocolRecoveryState.WAITING_FOR_STILLNESS,
			0.75f,
			0.8f,
			TrackerRecoveryReason.TRACKER_MOVING,
		)
		fbb.finish(offset)

		val recovery = TrackerRecovery.getRootAsTrackerRecovery(fbb.dataBuffer())
		assertEquals(ProtocolRecoveryState.WAITING_FOR_STILLNESS, recovery.state())
		assertEquals(0.75f, recovery.progress())
		assertEquals(0.8f, recovery.confidence())
		assertEquals(TrackerRecoveryReason.TRACKER_MOVING, recovery.reason())
	}

	@Test
	fun `timed out tracker follows body yaw and realigns after stillness`() {
		val configManager = ConfigManager("test-config.yml")
		configManager.loadConfig()
		configManager.vrConfig.vrcOSC.enabled = false
		configManager.vrConfig.vrcOSC.oscqueryEnabled = false
		val server = VRServer(configManager = configManager)

		val head = makeTracker(100, TrackerPosition.HEAD, isHmd = true)
		val hip = makeTracker(101, TrackerPosition.HIP)
		val thigh = makeTracker(102, TrackerPosition.LEFT_UPPER_LEG)
		val trackerField = VRServer::class.java.getDeclaredField("trackers")
		trackerField.isAccessible = true
		@Suppress("UNCHECKED_CAST")
		val trackers = trackerField.get(server) as MutableList<Tracker>
		trackers.addAll(listOf(head, hip, thigh))

		listOf(head, hip, thigh).forEach {
			it.setRotation(Quaternion.IDENTITY)
			it.status = TrackerStatus.OK
			it.dataTick()
		}

		val start = System.currentTimeMillis()
		thigh.recovery.tick(start + 800, 800)
		thigh.recovery.tick(start + 3600, 3600)
		assertEquals(TrackerRecoveryState.COMPENSATING, thigh.recovery.state)

		val turn = Quaternion.rotationAroundYAxis((PI / 2.0).toFloat())
		head.setRotation(turn)
		hip.setRotation(turn)
		thigh.recovery.tick(start + 3610, 3610)
		val compensatedYaw = TrackerTestUtils.yaw(thigh.getRotation())
		thigh.setRotation(Quaternion.IDENTITY)
		thigh.recovery.onRotationSample(thigh.getRotationBase(), 3600, start + 3620)
		for (elapsed in 3640L..5160L step 20L) {
			thigh.recovery.onRotationSample(thigh.getRotationBase(), 20, start + elapsed)
		}
		thigh.recovery.tick(start + 5180, 20)
		assertEquals(TrackerRecoveryState.BLENDING, thigh.recovery.state)
		val measuredConfidence = thigh.recovery.confidence
		thigh.recovery.tick(start + 5700, 20)

		assertEquals(TrackerRecoveryState.NONE, thigh.recovery.state)
		assertEquals(measuredConfidence, thigh.recovery.confidence)
		assertTrue(absAngle(TrackerTestUtils.yaw(thigh.getRotation()), compensatedYaw) < 0.05f)
	}

	@Test
	fun `long gap without references holds pose until full reset`() {
		val configManager = ConfigManager("test-config.yml")
		configManager.loadConfig()
		configManager.vrConfig.vrcOSC.enabled = false
		configManager.vrConfig.vrcOSC.oscqueryEnabled = false
		val server = VRServer(configManager = configManager)
		val thigh = makeTracker(103, TrackerPosition.RIGHT_UPPER_LEG)
		val trackerField = VRServer::class.java.getDeclaredField("trackers")
		trackerField.isAccessible = true
		@Suppress("UNCHECKED_CAST")
		val trackers = trackerField.get(server) as MutableList<Tracker>
		trackers.add(thigh)

		thigh.setRotation(Quaternion.IDENTITY)
		thigh.status = TrackerStatus.OK
		thigh.dataTick()
		val heldYaw = TrackerTestUtils.yaw(thigh.getRotation())

		val start = System.currentTimeMillis()
		thigh.recovery.tick(start + 800, 800)
		thigh.recovery.tick(start + 3600, 3600)
		assertEquals(TrackerRecoveryState.COMPENSATING, thigh.recovery.state)

		val rawTurn = Quaternion.rotationAroundYAxis((PI / 2.0).toFloat())
		thigh.setRotation(rawTurn)
		thigh.recovery.onRotationSample(rawTurn, 3600, start + 3610)
		assertEquals(TrackerRecoveryState.NEEDS_RESET, thigh.recovery.state)
		assertEquals(RecoveryReason.NO_REFERENCE, thigh.recovery.reason)
		assertTrue(thigh.needReset)
		assertEquals(0f, thigh.recovery.confidence)
		assertTrue(absAngle(TrackerTestUtils.yaw(thigh.getRotation()), heldYaw) < 0.001f)

		thigh.recovery.tick(start + 4200, 20)
		thigh.recovery.onRotationSample(rawTurn, 3600, start + 4210)
		thigh.resetsHandler.resetYaw(Quaternion.IDENTITY)
		thigh.resetsHandler.resetMounting(Quaternion.IDENTITY)
		assertEquals(TrackerRecoveryState.NEEDS_RESET, thigh.recovery.state)
		assertTrue(thigh.needReset)
		assertTrue(absAngle(TrackerTestUtils.yaw(thigh.getRotation()), heldYaw) < 0.001f)

		configManager.vrConfig.resetsConfig.deadTrackerRecoveryEnabled = false
		thigh.recovery.tick(start + 4300, 20)
		thigh.recovery.onRotationSample(rawTurn, 20, start + 4310)
		assertEquals(TrackerRecoveryState.NEEDS_RESET, thigh.recovery.state)
		configManager.vrConfig.resetsConfig.deadTrackerRecoveryEnabled = true
		thigh.trackerPosition = TrackerPosition.LEFT_UPPER_LEG
		assertEquals(TrackerRecoveryState.NEEDS_RESET, thigh.recovery.state)
		assertTrue(thigh.needReset)

		thigh.resetsHandler.resetFull(Quaternion.IDENTITY)
		assertEquals(TrackerRecoveryState.NONE, thigh.recovery.state)
		assertTrue(!thigh.needReset)
	}

	@Test
	fun `short gap blends without a reset or references`() {
		val configManager = ConfigManager("test-config.yml")
		configManager.loadConfig()
		configManager.vrConfig.vrcOSC.enabled = false
		configManager.vrConfig.vrcOSC.oscqueryEnabled = false
		VRServer(configManager = configManager)
		val thigh = makeTracker(107, TrackerPosition.LEFT_UPPER_LEG)
		thigh.setRotation(Quaternion.IDENTITY)
		thigh.status = TrackerStatus.OK
		thigh.dataTick()

		val start = System.currentTimeMillis()
		thigh.recovery.tick(start + 800, 800)
		assertEquals(TrackerRecoveryState.BRIDGING_GAP, thigh.recovery.state)
		val rawTurn = Quaternion.rotationAroundYAxis((PI / 6.0).toFloat())
		thigh.setRotation(rawTurn)
		thigh.recovery.onRotationSample(thigh.getRotationBase(), 900, start + 900)
		assertEquals(TrackerRecoveryState.BLENDING, thigh.recovery.state)
		assertTrue(!thigh.needReset)
		thigh.recovery.tick(start + 1500, 20)
		assertEquals(TrackerRecoveryState.NONE, thigh.recovery.state)
		assertEquals(0.85f, thigh.recovery.confidence)
	}

	@Test
	fun `disagreeing references require a full reset`() {
		val (thigh, start) = longGapWithReferences(90f, -90f)
		val heldYaw = TrackerTestUtils.yaw(thigh.getRotation())
		thigh.recovery.onRotationSample(thigh.getRotationBase(), 3600, start + 3620)

		assertEquals(TrackerRecoveryState.NEEDS_RESET, thigh.recovery.state)
		assertEquals(RecoveryReason.REFERENCE_DISAGREEMENT, thigh.recovery.reason)
		assertTrue(thigh.needReset)
		assertTrue(absAngle(TrackerTestUtils.yaw(thigh.getRotation()), heldYaw) < 0.001f)
	}

	@Test
	fun `low confidence references require a full reset`() {
		val (thigh, start) = longGapWithReferences(0f, 8f)
		thigh.recovery.onRotationSample(thigh.getRotationBase(), 3600, start + 3620)

		assertEquals(TrackerRecoveryState.NEEDS_RESET, thigh.recovery.state)
		assertEquals(RecoveryReason.REFERENCE_DISAGREEMENT, thigh.recovery.reason)
		assertEquals(0f, thigh.recovery.confidence)
		assertTrue(thigh.needReset)
	}

	@Test
	fun `validated reference confidence survives blend completion`() {
		val (thigh, start) = longGapWithReferences(90f, 92f)
		thigh.recovery.onRotationSample(thigh.getRotationBase(), 3600, start + 3620)
		for (elapsed in 3640L..5160L step 20L) {
			thigh.recovery.onRotationSample(thigh.getRotationBase(), 20, start + elapsed)
		}
		thigh.recovery.tick(start + 5180, 20)
		assertEquals(TrackerRecoveryState.BLENDING, thigh.recovery.state)
		val confidence = thigh.recovery.confidence
		assertTrue(confidence in 0.75f..<1f)
		thigh.recovery.tick(start + 5700, 20)
		assertEquals(TrackerRecoveryState.NONE, thigh.recovery.state)
		assertEquals(confidence, thigh.recovery.confidence)
		assertTrue(!thigh.needReset)
	}

	@Test
	fun `torso tracker recovers from two torso references without an HMD`() {
		val configManager = ConfigManager("test-config.yml")
		configManager.loadConfig()
		configManager.vrConfig.vrcOSC.enabled = false
		configManager.vrConfig.vrcOSC.oscqueryEnabled = false
		val server = VRServer(configManager = configManager)

		val chest = makeTracker(104, TrackerPosition.CHEST)
		val hip = makeTracker(105, TrackerPosition.HIP)
		val waist = makeTracker(106, TrackerPosition.WAIST)
		val trackerField = VRServer::class.java.getDeclaredField("trackers")
		trackerField.isAccessible = true
		@Suppress("UNCHECKED_CAST")
		val trackers = trackerField.get(server) as MutableList<Tracker>
		trackers.addAll(listOf(chest, hip, waist))

		listOf(chest, hip, waist).forEach {
			it.setRotation(Quaternion.IDENTITY)
			it.status = TrackerStatus.OK
			it.dataTick()
		}

		val start = System.currentTimeMillis()
		chest.recovery.tick(start + 800, 800)
		chest.recovery.tick(start + 3600, 3600)
		assertEquals(TrackerRecoveryState.COMPENSATING, chest.recovery.state)

		val turn = Quaternion.rotationAroundYAxis((PI / 2.0).toFloat())
		hip.setRotation(turn)
		waist.setRotation(turn)
		chest.recovery.tick(start + 3610, 3610)
		val compensatedYaw = TrackerTestUtils.yaw(chest.getRotation())
		chest.setRotation(Quaternion.IDENTITY)
		chest.recovery.onRotationSample(chest.getRotationBase(), 3600, start + 3620)
		for (elapsed in 3640L..5160L step 20L) {
			chest.recovery.onRotationSample(chest.getRotationBase(), 20, start + elapsed)
		}
		chest.recovery.tick(start + 5180, 20)

		assertEquals(TrackerRecoveryState.BLENDING, chest.recovery.state)
		chest.recovery.tick(start + 5700, 20)
		assertEquals(TrackerRecoveryState.NONE, chest.recovery.state)
		assertTrue(
			absAngle(TrackerTestUtils.yaw(chest.getRotation()), compensatedYaw) < 0.05f,
			"actual=${TrackerTestUtils.yaw(chest.getRotation())} expected=$compensatedYaw",
		)
	}

	private fun longGapWithReferences(headYawDegrees: Float, hipYawDegrees: Float): Pair<Tracker, Long> {
		val configManager = ConfigManager("test-config.yml")
		configManager.loadConfig()
		configManager.vrConfig.vrcOSC.enabled = false
		configManager.vrConfig.vrcOSC.oscqueryEnabled = false
		val server = VRServer(configManager = configManager)
		val head = makeTracker(108, TrackerPosition.HEAD, isHmd = true)
		val hip = makeTracker(109, TrackerPosition.HIP)
		val thigh = makeTracker(110, TrackerPosition.LEFT_UPPER_LEG)
		val trackerField = VRServer::class.java.getDeclaredField("trackers")
		trackerField.isAccessible = true
		@Suppress("UNCHECKED_CAST")
		val trackers = trackerField.get(server) as MutableList<Tracker>
		trackers.addAll(listOf(head, hip, thigh))
		listOf(head, hip, thigh).forEach {
			it.setRotation(Quaternion.IDENTITY)
			it.status = TrackerStatus.OK
			it.dataTick()
		}
		val start = System.currentTimeMillis()
		thigh.recovery.tick(start + 800, 800)
		thigh.recovery.tick(start + 3600, 3600)
		head.setRotation(Quaternion.rotationAroundYAxis(Math.toRadians(headYawDegrees.toDouble()).toFloat()))
		hip.setRotation(Quaternion.rotationAroundYAxis(Math.toRadians(hipYawDegrees.toDouble()).toFloat()))
		thigh.recovery.tick(start + 3610, 3610)
		return thigh to start
	}

	private fun makeTracker(id: Int, position: TrackerPosition, isHmd: Boolean = false) = Tracker(
		device = null,
		id = id,
		name = "recovery-$id",
		trackerPosition = position,
		trackerNum = id,
		hasPosition = isHmd,
		hasRotation = true,
		userEditable = true,
		isComputed = isHmd,
		imuType = if (isHmd) null else IMUType.BMI160,
		usesTimeout = true,
		allowReset = !isHmd,
		allowMounting = !isHmd,
		trackRotDirection = false,
		isHmd = isHmd,
	)

	private fun absAngle(a: Float, b: Float): Float {
		var delta = a - b
		while (delta > PI) delta -= (2.0 * PI).toFloat()
		while (delta < -PI) delta += (2.0 * PI).toFloat()
		return kotlin.math.abs(delta)
	}
}

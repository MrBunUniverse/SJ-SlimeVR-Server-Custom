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
import solarxr_protocol.data_feed.tracker.TrackerRecoveryState as ProtocolRecoveryState
import kotlin.math.PI

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
		thigh.recovery.tick(start + 5700, 20)

		assertEquals(TrackerRecoveryState.NONE, thigh.recovery.state)
		assertTrue(absAngle(TrackerTestUtils.yaw(thigh.getRotation()), compensatedYaw) < 0.05f)
	}

	@Test
	fun `long gap without enough references resumes without requiring full reset`() {
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

		val start = System.currentTimeMillis()
		thigh.recovery.tick(start + 800, 800)
		thigh.recovery.tick(start + 3600, 3600)
		assertEquals(TrackerRecoveryState.COMPENSATING, thigh.recovery.state)

		thigh.needReset = true
		thigh.recovery.onRotationSample(Quaternion.IDENTITY, 3600, start + 3610)
		assertEquals(TrackerRecoveryState.BLENDING, thigh.recovery.state)
		assertTrue(!thigh.needReset)

		thigh.recovery.tick(start + 4200, 20)
		assertEquals(TrackerRecoveryState.NONE, thigh.recovery.state)
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

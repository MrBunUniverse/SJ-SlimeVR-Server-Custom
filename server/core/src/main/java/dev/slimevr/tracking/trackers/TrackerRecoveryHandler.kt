package dev.slimevr.tracking.trackers

import dev.slimevr.VRServer
import io.eiren.util.logging.LogManager
import io.github.axisangles.ktmath.EulerOrder
import io.github.axisangles.ktmath.Quaternion
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.sin

enum class TrackerRecoveryState(val id: Int) {
	NONE(0),
	BRIDGING_GAP(1),
	COMPENSATING(2),
	WAITING_FOR_STILLNESS(3),
	VALIDATING(4),
	BLENDING(5),
	NEEDS_RESET(6),
}

enum class TrackerRecoveryReason(val id: Int) {
	NONE(0),
	TRACKER_OFFLINE(1),
	TRACKER_MOVING(2),
	POOR_PACKET_RATE(3),
	NO_REFERENCE(4),
	REFERENCE_DISAGREEMENT(5),
	ROLE_OR_MOUNTING_CHANGED(6),
	INVALID_ROTATION(7),
}

class TrackerRecoveryHandler(private val tracker: Tracker) {
	companion object {
		// Wi-Fi jitter is normally tens of milliseconds. Do not start freezing an
		// IMU pose until a gap is clearly longer than a normal transport hiccup.
		private const val BRIDGE_AFTER_MS = 750L
		private const val COMPENSATE_AFTER_MS = 3500L
		private const val STILL_TIME_MS = 1500L
		private const val BLEND_TIME_MS = 500L
		private const val SNAPSHOT_INTERVAL_MS = 50L
		private const val MAX_SAMPLE_GAP_MS = 250L
		private const val MAX_STILL_ANGLE_RAD = 2f * PI.toFloat() / 180f
		private const val MAX_REFERENCE_DISAGREEMENT_RAD = 12f * PI.toFloat() / 180f
	}

	@Volatile
	var state = TrackerRecoveryState.NONE
		private set
	@Volatile
	var reason = TrackerRecoveryReason.NONE
		private set
	@Volatile
	var progress = 0f
		private set
	@Volatile
	var confidence = 0f
		private set

	private var hasBaseline = false
	private var lastGoodRotation = Quaternion.IDENTITY
	private var fallbackRotation = Quaternion.IDENTITY
	private var lastSampleRotation = Quaternion.IDENTITY
	private var stableSince = 0L
	private var blendStartedAt = 0L
	private var nextSnapshotAt = 0L
	private var baselineIntervalMs = 20f
	private var snapshotHardwareId: String? = null
	private var snapshotPosition: TrackerPosition? = null
	private var snapshotMounting = Quaternion.IDENTITY
	private val anchorYawOffsets = LinkedHashMap<Tracker, Float>()
	private var primaryAnchor: Tracker? = null
	private var primaryAnchorYaw = 0f

	val activeForSkeleton: Boolean
		get() = state != TrackerRecoveryState.NONE

	private fun enabled(): Boolean =
		VRServer.instanceInitialized &&
			VRServer.instance.configManager.vrConfig.resetsConfig.deadTrackerRecoveryEnabled &&
			tracker.isImu() && tracker.trackerPosition != null && !tracker.isHmd && !tracker.isComputed

	@Synchronized
	fun onRotationSample(rotation: Quaternion, gapMs: Long, now: Long): Boolean {
		if (!enabled()) {
			state = TrackerRecoveryState.NONE
			return false
		}

		if (!isFinite(rotation)) {
			requireFullReset(TrackerRecoveryReason.INVALID_ROTATION)
			return true
		}

		if (!hasBaseline) {
			hasBaseline = true
			lastGoodRotation = rotation
			fallbackRotation = rotation
			lastSampleRotation = rotation
			return false
		}

		if (state == TrackerRecoveryState.BRIDGING_GAP && gapMs < COMPENSATE_AFTER_MS) {
			fallbackRotation = fallbackRotation.interpR(rotation, 0.5f)
			startBlend(now, 0.85f)
			lastSampleRotation = rotation
			return true
		}

		if (state == TrackerRecoveryState.COMPENSATING || gapMs >= COMPENSATE_AFTER_MS) {
			if (!configurationStillMatchesSnapshot()) {
				requireFullReset(TrackerRecoveryReason.ROLE_OR_MOUNTING_CHANGED)
				return true
			}
			if (!hasEnoughLiveReferences()) {
				resumeWithoutReferences(now, rotation)
				lastSampleRotation = rotation
				return true
			}
			state = TrackerRecoveryState.WAITING_FOR_STILLNESS
			reason = TrackerRecoveryReason.TRACKER_MOVING
			progress = 0f
			confidence = 0f
			stableSince = now
		}

		if (state == TrackerRecoveryState.WAITING_FOR_STILLNESS) {
			val sampleAngle = angleBetween(lastSampleRotation, rotation)
			val cadenceLimit = max(MAX_SAMPLE_GAP_MS.toFloat(), baselineIntervalMs * 2f).toLong()
			if (gapMs > cadenceLimit) {
				stableSince = now
				reason = TrackerRecoveryReason.POOR_PACKET_RATE
			} else if (sampleAngle > MAX_STILL_ANGLE_RAD) {
				stableSince = now
				reason = TrackerRecoveryReason.TRACKER_MOVING
			} else {
				reason = TrackerRecoveryReason.NONE
				progress = ((now - stableSince).toFloat() / STILL_TIME_MS).coerceIn(0f, 1f)
				if (now - stableSince >= STILL_TIME_MS) state = TrackerRecoveryState.VALIDATING
			}
		}

		if (state == TrackerRecoveryState.NONE && gapMs in 1..<1000) {
			baselineIntervalMs = baselineIntervalMs * 0.95f + gapMs * 0.05f
			lastGoodRotation = rotation
		}
		lastSampleRotation = rotation
		return state != TrackerRecoveryState.NONE
	}

	@Synchronized
	fun tick(now: Long, sampleAgeMs: Long) {
		if (!enabled()) {
			cancel()
			return
		}

		when (state) {
			TrackerRecoveryState.NONE -> {
				if (hasBaseline && sampleAgeMs >= BRIDGE_AFTER_MS) beginGap(now)
				else if (hasBaseline && now >= nextSnapshotAt) captureSnapshot(now)
			}
			TrackerRecoveryState.BRIDGING_GAP -> {
				updateFallbackFromAnchor()
				progress = ((sampleAgeMs - BRIDGE_AFTER_MS).toFloat() / (COMPENSATE_AFTER_MS - BRIDGE_AFTER_MS)).coerceIn(0f, 1f)
				if (sampleAgeMs >= COMPENSATE_AFTER_MS) {
					state = TrackerRecoveryState.COMPENSATING
					reason = TrackerRecoveryReason.TRACKER_OFFLINE
					progress = 1f
					LogManager.warning("[TrackerRecovery] Compensating ${tracker.displayName} after ${sampleAgeMs}ms without rotation data")
				}
			}
			TrackerRecoveryState.COMPENSATING,
			TrackerRecoveryState.WAITING_FOR_STILLNESS,
			TrackerRecoveryState.VALIDATING,
			TrackerRecoveryState.NEEDS_RESET,
			-> {
				updateFallbackFromAnchor()
				if (state == TrackerRecoveryState.VALIDATING) validateAndApply(now)
			}
			TrackerRecoveryState.BLENDING -> {
				progress = ((now - blendStartedAt).toFloat() / BLEND_TIME_MS).coerceIn(0f, 1f)
				if (progress >= 1f) {
					state = TrackerRecoveryState.NONE
					reason = TrackerRecoveryReason.NONE
					confidence = 1f
					tracker.status = TrackerStatus.OK
					captureSnapshot(now)
					LogManager.info("[TrackerRecovery] ${tracker.displayName} recovery blend completed")
				}
			}
		}
	}

	@Synchronized
	fun applyTo(rotation: Quaternion): Quaternion = when (state) {
		TrackerRecoveryState.NONE -> rotation
		TrackerRecoveryState.BLENDING -> fallbackRotation.interpR(rotation, progress)
		else -> fallbackRotation
	}

	@Synchronized
	fun cancel() {
		val wasActive = state != TrackerRecoveryState.NONE
		state = TrackerRecoveryState.NONE
		reason = TrackerRecoveryReason.NONE
		progress = 0f
		confidence = 0f
		stableSince = 0L
		anchorYawOffsets.clear()
		primaryAnchor = null
		if (wasActive && tracker.status == TrackerStatus.BUSY) tracker.status = TrackerStatus.OK
	}

	private fun beginGap(now: Long) {
		captureSnapshot(now)
		fallbackRotation = lastGoodRotation
		state = TrackerRecoveryState.BRIDGING_GAP
		reason = TrackerRecoveryReason.TRACKER_OFFLINE
		progress = 0f
		confidence = 0.25f
	}

	private fun captureSnapshot(now: Long) {
		if (!VRServer.instanceInitialized) return
		lastGoodRotation = tracker.getRotationBase()
		fallbackRotation = lastGoodRotation
		snapshotHardwareId = tracker.device?.hardwareIdentifier
		snapshotPosition = tracker.trackerPosition
		snapshotMounting = tracker.resetsHandler.mountingOrientation
		anchorYawOffsets.clear()
		val trackerYaw = yaw(lastGoodRotation)
		val anchors = candidateAnchors()
		for (anchor in anchors) {
			anchorYawOffsets[anchor] = wrapAngle(trackerYaw - yaw(anchor.getRotation()))
		}
		primaryAnchor = anchors.firstOrNull()
		primaryAnchorYaw = primaryAnchor?.let { yaw(it.getRotation()) } ?: 0f
		nextSnapshotAt = now + SNAPSHOT_INTERVAL_MS
	}

	private fun candidateAnchors(): List<Tracker> {
		val position = tracker.trackerPosition
		val preferred = preferredAnchorPositions(position)
		return VRServer.instance.allTrackers
			.asSequence()
			.filter { it !== tracker && !it.isInternal && it.hasRotation && it.status.sendData && !it.recovery.activeForSkeleton && it.trackerPosition in preferred }
			.sortedBy { preferred.indexOf(it.trackerPosition) }
			.take(4)
			.toList()
	}

	private fun preferredAnchorPositions(position: TrackerPosition?): List<TrackerPosition> = when (position) {
		TrackerPosition.LEFT_FOOT -> listOf(TrackerPosition.LEFT_LOWER_LEG, TrackerPosition.LEFT_UPPER_LEG, TrackerPosition.HIP, TrackerPosition.HEAD)
		TrackerPosition.RIGHT_FOOT -> listOf(TrackerPosition.RIGHT_LOWER_LEG, TrackerPosition.RIGHT_UPPER_LEG, TrackerPosition.HIP, TrackerPosition.HEAD)
		TrackerPosition.LEFT_LOWER_LEG -> listOf(TrackerPosition.LEFT_UPPER_LEG, TrackerPosition.LEFT_FOOT, TrackerPosition.HIP, TrackerPosition.HEAD)
		TrackerPosition.RIGHT_LOWER_LEG -> listOf(TrackerPosition.RIGHT_UPPER_LEG, TrackerPosition.RIGHT_FOOT, TrackerPosition.HIP, TrackerPosition.HEAD)
		TrackerPosition.LEFT_UPPER_LEG -> listOf(TrackerPosition.HIP, TrackerPosition.WAIST, TrackerPosition.LEFT_LOWER_LEG, TrackerPosition.HEAD)
		TrackerPosition.RIGHT_UPPER_LEG -> listOf(TrackerPosition.HIP, TrackerPosition.WAIST, TrackerPosition.RIGHT_LOWER_LEG, TrackerPosition.HEAD)
		TrackerPosition.LEFT_HAND, TrackerPosition.LEFT_LOWER_ARM -> listOf(TrackerPosition.LEFT_UPPER_ARM, TrackerPosition.UPPER_CHEST, TrackerPosition.CHEST, TrackerPosition.HEAD)
		TrackerPosition.RIGHT_HAND, TrackerPosition.RIGHT_LOWER_ARM -> listOf(TrackerPosition.RIGHT_UPPER_ARM, TrackerPosition.UPPER_CHEST, TrackerPosition.CHEST, TrackerPosition.HEAD)
		TrackerPosition.LEFT_UPPER_ARM, TrackerPosition.LEFT_SHOULDER -> listOf(TrackerPosition.UPPER_CHEST, TrackerPosition.CHEST, TrackerPosition.LEFT_LOWER_ARM, TrackerPosition.HEAD)
		TrackerPosition.RIGHT_UPPER_ARM, TrackerPosition.RIGHT_SHOULDER -> listOf(TrackerPosition.UPPER_CHEST, TrackerPosition.CHEST, TrackerPosition.RIGHT_LOWER_ARM, TrackerPosition.HEAD)
		else -> listOf(TrackerPosition.HEAD, TrackerPosition.UPPER_CHEST, TrackerPosition.CHEST, TrackerPosition.WAIST, TrackerPosition.HIP)
	}

	private fun updateFallbackFromAnchor() {
		val anchor = primaryAnchor ?: return
		if (!anchor.status.sendData) return
		val delta = wrapAngle(yaw(anchor.getRotation()) - primaryAnchorYaw)
		fallbackRotation = Quaternion.rotationAroundYAxis(delta) * lastGoodRotation
	}

	private fun validateAndApply(now: Long) {
		if (!configurationStillMatchesSnapshot()) {
			requireFullReset(TrackerRecoveryReason.ROLE_OR_MOUNTING_CHANGED)
			return
		}

		val liveCandidates = anchorYawOffsets.mapNotNull { (anchor, offset) ->
			if (anchor.status.sendData && !anchor.recovery.activeForSkeleton) wrapAngle(yaw(anchor.getRotation()) + offset) else null
		}
		val hasHead = anchorYawOffsets.keys.any { it.trackerPosition == TrackerPosition.HEAD && it.status.sendData }
		if (!hasHead || liveCandidates.size < 2) {
			resumeWithoutReferences(now, tracker.getRotationBase())
			return
		}

		val desiredYaw = circularMean(liveCandidates)
		val disagreement = liveCandidates.maxOf { abs(wrapAngle(it - desiredYaw)) }
		if (disagreement > MAX_REFERENCE_DISAGREEMENT_RAD) {
			resumeWithoutReferences(now, tracker.getRotationBase())
			return
		}

		val currentRotation = tracker.getRotationBase()
		if (!isFinite(currentRotation)) {
			requireFullReset(TrackerRecoveryReason.INVALID_ROTATION)
			return
		}
		val correction = wrapAngle(desiredYaw - yaw(currentRotation))
		tracker.resetsHandler.recoveryYawFix = Quaternion.rotationAroundYAxis(correction)
		tracker.needReset = false
		tracker.resetFilteringQuats(fallbackRotation)
		confidence = (1f - disagreement / MAX_REFERENCE_DISAGREEMENT_RAD).coerceIn(0f, 1f)
		startBlend(now, confidence)
		LogManager.info("[TrackerRecovery] ${tracker.displayName} aligned with ${liveCandidates.size} references, yaw=${Math.toDegrees(correction.toDouble()).toInt()}deg, confidence=${"%.2f".format(confidence)}")
		VRServer.instance.vrcOSCHandler.sendTrackerRecoveryNotification(tracker, true)
	}

	private fun startBlend(now: Long, recoveryConfidence: Float) {
		state = TrackerRecoveryState.BLENDING
		reason = TrackerRecoveryReason.NONE
		progress = 0f
		confidence = recoveryConfidence
		blendStartedAt = now
		tracker.status = TrackerStatus.BUSY
	}

	private fun hasEnoughLiveReferences(): Boolean {
		val liveAnchors = anchorYawOffsets.keys.filter { it.status.sendData && !it.recovery.activeForSkeleton }
		return liveAnchors.any { it.trackerPosition == TrackerPosition.HEAD } && liveAnchors.size >= 2
	}

	private fun configurationStillMatchesSnapshot(): Boolean =
		snapshotHardwareId == tracker.device?.hardwareIdentifier &&
			snapshotPosition == tracker.trackerPosition &&
			snapshotMounting == tracker.resetsHandler.mountingOrientation

	private fun resumeWithoutReferences(now: Long, rotation: Quaternion) {
		if (!isFinite(rotation)) {
			requireFullReset(TrackerRecoveryReason.INVALID_ROTATION)
			return
		}
		fallbackRotation = fallbackRotation.interpR(rotation, 0.35f)
		lastGoodRotation = rotation
		tracker.needReset = false
		LogManager.info("[TrackerRecovery] ${tracker.displayName} resumed without enough stable references; blending raw IMU data")
		startBlend(now, 0.45f)
	}

	private fun requireFullReset(failure: TrackerRecoveryReason) {
		state = TrackerRecoveryState.NEEDS_RESET
		reason = failure
		progress = 0f
		confidence = 0f
		tracker.needReset = true
		if (VRServer.instanceInitialized) {
			LogManager.warning("[TrackerRecovery] ${tracker.displayName} needs reset: $failure")
			VRServer.instance.vrcOSCHandler.sendTrackerRecoveryNotification(tracker, false)
		}
	}

	private fun yaw(rotation: Quaternion): Float = rotation.toEulerAngles(EulerOrder.YZX).y

	private fun circularMean(values: List<Float>): Float = atan2(
		values.sumOf { sin(it.toDouble()) }.toFloat(),
		values.sumOf { cos(it.toDouble()) }.toFloat(),
	)

	private fun wrapAngle(value: Float): Float {
		var result = value
		while (result > PI) result -= (2.0 * PI).toFloat()
		while (result < -PI) result += (2.0 * PI).toFloat()
		return result
	}

	private fun angleBetween(a: Quaternion, b: Quaternion): Float {
		val dot = abs(a.w * b.w + a.x * b.x + a.y * b.y + a.z * b.z).coerceIn(0f, 1f)
		return 2f * kotlin.math.acos(dot)
	}

	private fun isFinite(rotation: Quaternion): Boolean =
		rotation.w.isFinite() && rotation.x.isFinite() && rotation.y.isFinite() && rotation.z.isFinite()
}

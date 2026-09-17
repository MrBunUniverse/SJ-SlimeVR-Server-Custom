package dev.slimevr.filtering

import com.jme3.system.NanoTimer
import dev.slimevr.VRServer
import io.github.axisangles.ktmath.Quaternion
import io.github.axisangles.ktmath.Quaternion.Companion.IDENTITY

// influences the range of smoothFactor.
private const val SMOOTH_MULTIPLIER = 42f
private const val SMOOTH_MIN = 11f

// influences the range of predictFactor
private const val PREDICT_MULTIPLIER = 15f
private const val PREDICT_MIN = 10f

// how many past rotations are used for prediction.
private const val PREDICT_BUFFER = 6

class QuaternionMovingAverage(
	val type: TrackerFilters,
	var amount: Float = 0f,
	initialRotation: Quaternion = IDENTITY,
) {
	var filteredQuaternion = IDENTITY
	var filteringImpact = 0f
	private var smoothFactor = 0f
	private var predictFactor = 0f
	private var rotBuffer: CircularArrayList<Quaternion>? = null
	private var latestQuaternion = IDENTITY
	private var smoothingQuaternion = IDENTITY
	private val fpsTimer = if (VRServer.instanceInitialized) VRServer.instance.fpsTimer else NanoTimer()
	private var timeSinceUpdate = 0f

	init {
		// amount should range from 0 to 1.
		// GUI should clamp it from 0.01 (1%) or 0.1 (10%)
		// to 1 (100%).
		amount = amount.coerceAtLeast(0f)
		if (type == TrackerFilters.SMOOTHING || type == TrackerFilters.ADAPTIVE_HYBRID) {
			// lower smoothFactor = more smoothing
			smoothFactor = SMOOTH_MULTIPLIER * (1 - amount.coerceAtMost(1f)) + SMOOTH_MIN
			// Totally a hack
			if (amount > 1) {
				smoothFactor /= amount
			}
		}
		if (type == TrackerFilters.PREDICTION || type == TrackerFilters.ADAPTIVE_HYBRID) {
			// higher predictFactor = more prediction
			predictFactor = PREDICT_MULTIPLIER * amount + PREDICT_MIN
			rotBuffer = CircularArrayList(PREDICT_BUFFER)
		}

		// We have no reference at the start, so just use the initial rotation
		resetQuats(initialRotation, initialRotation)
	}

	private var lastPacketTime = 0L
	private var packetIntervalMs = 16f
	private var currentAngularVelocity = 0f

	// Runs at up to 1000hz. We use a timer to make it framerate-independent
	// since it runs a bit below 1000hz in practice.
	@Synchronized
	fun update() {
		if (type == TrackerFilters.PREDICTION) {
			val rotBuf = rotBuffer
			if (rotBuf != null && rotBuf.isNotEmpty()) {
				// Applies the past rotations to the current rotation
				val predictRot = rotBuf.fold(latestQuaternion) { buf, rot -> buf * rot }

				// Calculate how much to slerp
				// Limit slerp by a reasonable amount so low TPS doesn't break tracking
				val amt = (predictFactor * fpsTimer.timePerFrame).coerceAtMost(1f)

				// Slerps the target rotation to that predicted rotation by amt
				filteredQuaternion = filteredQuaternion.interpQ(predictRot, amt)
			}
		} else if (type == TrackerFilters.SMOOTHING) {
			// Make it framerate-independent
			timeSinceUpdate += fpsTimer.timePerFrame

			// Calculate the slerp factor based off the smoothFactor and smoothingCounter
			// limit to 1 to not overshoot
			val amt = (smoothFactor * timeSinceUpdate).coerceAtMost(1f)

			// Smooth towards the target rotation by the slerp factor
			filteredQuaternion = smoothingQuaternion.interpQ(latestQuaternion, amt)
		} else if (type == TrackerFilters.ADAPTIVE_HYBRID) {
			timeSinceUpdate += fpsTimer.timePerFrame
			val rotBuf = rotBuffer

			// Compute dynamic prediction if buffer exists
			val predictedTarget = if (rotBuf != null && rotBuf.isNotEmpty()) {
				rotBuf.fold(latestQuaternion) { buf, rot -> buf * rot }
			} else {
				latestQuaternion
			}

			// Motion intensity: 0.0 (dead still) to 1.0 (moving fast)
			// Thresholds: stillness below 0.15 rad/s, full prediction above 0.70 rad/s
			val motionRatio = ((currentAngularVelocity - 0.15f) / 0.55f).coerceIn(0f, 1f)

			// Network lag spike detection: if packet arrived with > 45ms gap, damp prediction to prevent overshooting
			val networkHealthFactor = if (packetIntervalMs > 45f) {
				(1f - ((packetIntervalMs - 45f) / 55f)).coerceIn(0.15f, 1.0f)
			} else {
				1.0f
			}

			// Effective prediction weight blended by motion and network health
			val effectivePredictionWeight = motionRatio * networkHealthFactor

			// Blend the target orientation between raw latest and predicted
			val dynamicTarget = latestQuaternion.interpQ(predictedTarget, effectivePredictionWeight)

			// Adaptive smoothing factor: heavier when still, faster tracking when in motion
			val dynamicSmoothFactor = smoothFactor * (1.0f + effectivePredictionWeight * 1.8f)
			val amt = (dynamicSmoothFactor * timeSinceUpdate).coerceAtMost(1f)

			filteredQuaternion = smoothingQuaternion.interpQ(dynamicTarget, amt)
		}

		filteringImpact = latestQuaternion.angleToR(filteredQuaternion)
	}

	@Synchronized
	fun addQuaternion(q: Quaternion) {
		val now = System.currentTimeMillis()
		if (lastPacketTime > 0L) {
			val delta = (now - lastPacketTime).toFloat().coerceIn(1f, 500f)
			// Exponential moving average of packet arrival interval
			packetIntervalMs = packetIntervalMs * 0.8f + delta * 0.2f
		}
		lastPacketTime = now

		val oldQ = latestQuaternion
		val newQ = q.twinNearest(oldQ)
		latestQuaternion = newQ

		// Calculate angular velocity in rad/sec
		val angleDelta = oldQ.angleToR(newQ)
		val dt = (fpsTimer.timePerFrame).coerceIn(0.001f, 0.1f)
		currentAngularVelocity = currentAngularVelocity * 0.6f + (angleDelta / dt) * 0.4f

		if (type == TrackerFilters.PREDICTION || type == TrackerFilters.ADAPTIVE_HYBRID) {
			val rotBuf = rotBuffer
			if (rotBuf != null) {
				if (rotBuf.size == rotBuf.capacity()) {
					rotBuf.removeLast()
				}
				// Gets and stores the rotation between the last 2 quaternions
				rotBuf.add(oldQ.inv().times(newQ))
			}
		}

		if (type == TrackerFilters.SMOOTHING || type == TrackerFilters.ADAPTIVE_HYBRID) {
			timeSinceUpdate = 0f
			smoothingQuaternion = filteredQuaternion
		} else if (type == TrackerFilters.NONE) {
			// No filtering; just keep track of rotations (for going over 180 degrees)
			filteredQuaternion = newQ
		}
	}

	/**
	 * Aligns the quaternion space of [q] to the [reference] and sets the latest
	 * [filteredQuaternion] immediately
	 */
	@Synchronized
	fun resetQuats(q: Quaternion, reference: Quaternion) {
		// Assume a rotation within 180 degrees of the reference
		// TODO: Currently the reference is the headset, this restricts all trackers to
		//  have at most a 180 degree rotation from the HMD during a reset, we can
		//  probably do better using a hierarchy
		val rot = q.twinNearest(reference)
		rotBuffer?.clear()
		latestQuaternion = rot
		filteredQuaternion = rot
		addQuaternion(rot)
	}
}

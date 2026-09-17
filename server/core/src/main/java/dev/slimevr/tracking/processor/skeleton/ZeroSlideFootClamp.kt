package dev.slimevr.tracking.processor.skeleton

import com.jme3.math.FastMath
import io.github.axisangles.ktmath.Quaternion
import io.github.axisangles.ktmath.Vector3
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.sqrt

enum class StanceState {
	SWING,
	STANCE_LOCKED,
	RELEASE_BLEND,
}

data class FootClampOutput(
	val leftFootPosition: Vector3,
	val rightFootPosition: Vector3,
	val leftState: StanceState,
	val rightState: StanceState,
)

/**
 * ZeroSlideFootClamp:
 * High-precision stance-phase contact detector and 3-axis ground spatial anchor.
 * Eliminates lateral sliding ("ice skating") and floor penetration during stance phase.
 */
class ZeroSlideFootClamp(private val skeleton: HumanSkeleton?) {

	companion object {
		// Kinematic and impact thresholds
		const val CONTACT_PROXIMITY_MAX = 0.045f // 4.5 cm from floor plane
		const val STANCE_VELOCITY_MAX = 0.18f // 18 cm/s horizontal speed threshold
		const val STANCE_ANGULAR_VEL_MAX = 1.8f // 1.8 rad/s angular stillness threshold
		const val JERK_IMPACT_THRESHOLD = 10.0f // m/s^3 heel-strike impact detection
		const val LIFT_VELOCITY_THRESHOLD = 0.15f // m/s upward velocity to initiate toe-off
		const val LIFT_HEIGHT_THRESHOLD = 0.025f // 2.5 cm above floor to release
		const val BREAKOUT_STRIDE_BASE = 0.24f // 24 cm horizontal stride breakout limit
		const val RELEASE_BLEND_DURATION = 0.040f // 40ms cosine ease-out release
		const val MIN_DT = 0.001f
		const val MAX_DT = 0.1f
	}

	class FootState {
		var state: StanceState = StanceState.SWING
		var anchorPosition: Vector3 = Vector3.NULL
		var clampedPosition: Vector3 = Vector3.NULL

		var prevRawPosition: Vector3 = Vector3.NULL
		var prevRawRotation: Quaternion = Quaternion.IDENTITY
		var prevAccelerationMag: Float = 0f

		var velocity: Vector3 = Vector3.NULL
		var horizontalSpeed: Float = 0f
		var angularVelocity: Float = 0f
		var jerk: Float = 0f

		var releaseTimer: Float = 0f
		var framesInStance: Int = 0
		var initialized: Boolean = false

		fun reset() {
			state = StanceState.SWING
			anchorPosition = Vector3.NULL
			clampedPosition = Vector3.NULL
			prevRawPosition = Vector3.NULL
			prevRawRotation = Quaternion.IDENTITY
			prevAccelerationMag = 0f
			velocity = Vector3.NULL
			horizontalSpeed = 0f
			angularVelocity = 0f
			jerk = 0f
			releaseTimer = 0f
			framesInStance = 0
			initialized = false
		}
	}

	val leftFoot = FootState()
	val rightFoot = FootState()
	private var lastTimestampNs: Long = 0L

	fun reset() {
		leftFoot.reset()
		rightFoot.reset()
		lastTimestampNs = 0L
	}

	fun update(
		leftRawPos: Vector3,
		rightRawPos: Vector3,
		leftRawRot: Quaternion,
		rightRawRot: Quaternion,
		leftAccel: Vector3,
		rightAccel: Vector3,
		floorLevel: Float,
		footLength: Float,
		leftSoleOffset: Float,
		rightSoleOffset: Float,
		isStanding: Boolean,
		strength: Float,
		overrideDt: Float? = null,
	): FootClampOutput {
		val now = System.nanoTime()
		val dt: Float = if (overrideDt != null) {
			FastMath.clamp(overrideDt, MIN_DT, MAX_DT)
		} else if (lastTimestampNs == 0L) {
			0.01f
		} else {
			val elapsed = (now - lastTimestampNs) / 1_000_000_000.0f
			FastMath.clamp(elapsed, MIN_DT, MAX_DT)
		}
		lastTimestampNs = now

		// If strength is virtually 0 or user is not standing, bypass clamp smoothly
		if (strength <= 0.05f || !isStanding) {
			leftFoot.state = StanceState.SWING
			rightFoot.state = StanceState.SWING
			leftFoot.prevRawPosition = leftRawPos
			leftFoot.prevRawRotation = leftRawRot
			rightFoot.prevRawPosition = rightRawPos
			rightFoot.prevRawRotation = rightRawRot
			return FootClampOutput(
				leftRawPos,
				rightRawPos,
				StanceState.SWING,
				StanceState.SWING,
			)
		}

		val leftSoleY = floorLevel + footLength * leftSoleOffset
		val rightSoleY = floorLevel + footLength * rightSoleOffset

		updateKinematics(leftFoot, leftRawPos, leftRawRot, leftAccel, dt)
		updateKinematics(rightFoot, rightRawPos, rightRawRot, rightAccel, dt)

		// Evaluate and solve stance per foot
		solveFootState(leftFoot, leftRawPos, leftSoleY, strength, dt)
		solveFootState(rightFoot, rightRawPos, rightSoleY, strength, dt)

		// Post-solve: If both feet are in stance and one is taking a distant step, arbitrate release
		arbitrateDualStance(leftFoot, rightFoot, leftRawPos, rightRawPos)

		val leftClamped = blendOutputPosition(leftFoot, leftRawPos, strength)
		val rightClamped = blendOutputPosition(rightFoot, rightRawPos, strength)

		return FootClampOutput(
			leftClamped,
			rightClamped,
			leftFoot.state,
			rightFoot.state,
		)
	}

	private fun updateKinematics(
		foot: FootState,
		rawPos: Vector3,
		rawRot: Quaternion,
		accel: Vector3,
		dt: Float,
	) {
		if (!foot.initialized) {
			foot.prevRawPosition = rawPos
			foot.prevRawRotation = rawRot
			foot.prevAccelerationMag = accel.len()
			foot.initialized = true
			foot.velocity = Vector3.NULL
			foot.horizontalSpeed = 0f
			foot.angularVelocity = 0f
			foot.jerk = 0f
			return
		}

		foot.velocity = (rawPos - foot.prevRawPosition) * (1.0f / dt)
		val vx = foot.velocity.x
		val vz = foot.velocity.z
		foot.horizontalSpeed = sqrt(vx * vx + vz * vz)

		val angleDeltaRad = rawRot.angleToR(foot.prevRawRotation)
		foot.angularVelocity = angleDeltaRad / dt

		val accelMag = accel.len()
		foot.jerk = abs(accelMag - foot.prevAccelerationMag) / dt

		foot.prevRawPosition = rawPos
		foot.prevRawRotation = rawRot
		foot.prevAccelerationMag = accelMag
	}

	private fun solveFootState(
		foot: FootState,
		rawPos: Vector3,
		soleY: Float,
		strength: Float,
		dt: Float,
	) {
		val distToGround = rawPos.y - soleY

		when (foot.state) {
			StanceState.SWING -> {
				// Check for touchdown / stance engagement
				val inProximity = distToGround <= CONTACT_PROXIMITY_MAX
				val isNotRising = foot.velocity.y < 0.08f
				val isSlow = foot.horizontalSpeed < (STANCE_VELOCITY_MAX * (0.8f + 0.4f * strength))
				val isOrientationStill = foot.angularVelocity < (STANCE_ANGULAR_VEL_MAX * (0.8f + 0.4f * strength))
				val isImpact = foot.jerk > JERK_IMPACT_THRESHOLD && foot.horizontalSpeed < 0.28f

				if (inProximity && isNotRising && ((isSlow && isOrientationStill) || isImpact)) {
					foot.state = StanceState.STANCE_LOCKED
					// Rigid anchor at touchdown point, vertical clamped flush with sole level
					foot.anchorPosition = Vector3(rawPos.x, max(rawPos.y, soleY), rawPos.z)
					foot.clampedPosition = foot.anchorPosition
					foot.framesInStance = 0
					foot.releaseTimer = 0f
				} else {
					foot.clampedPosition = rawPos
				}
			}

			StanceState.STANCE_LOCKED -> {
				foot.framesInStance++

				// Update vertical anchor flush to ground so floor penetration is strictly prevented
				val targetY = max(rawPos.y, soleY)
				foot.anchorPosition = Vector3(foot.anchorPosition.x, targetY, foot.anchorPosition.z)

				// Breakout conditions
				val dx = rawPos.x - foot.anchorPosition.x
				val dz = rawPos.z - foot.anchorPosition.z
				val horizontalBreakoutDist = sqrt(dx * dx + dz * dz)

				val breakoutThreshold = BREAKOUT_STRIDE_BASE * (1.15f - 0.25f * strength)
				val isDeliberateStep = horizontalBreakoutDist > breakoutThreshold
				val isDeliberateLift = foot.velocity.y > LIFT_VELOCITY_THRESHOLD && distToGround > LIFT_HEIGHT_THRESHOLD
				val isViolentRotate = foot.angularVelocity > (STANCE_ANGULAR_VEL_MAX * 2.2f)

				if (isDeliberateStep || isDeliberateLift || isViolentRotate) {
					foot.state = StanceState.RELEASE_BLEND
					foot.releaseTimer = 0f
				} else {
					// Firmly hold anchor
					foot.clampedPosition = foot.anchorPosition
				}
			}

			StanceState.RELEASE_BLEND -> {
				foot.releaseTimer += dt
				val progress = FastMath.clamp(foot.releaseTimer / RELEASE_BLEND_DURATION, 0.0f, 1.0f)
				// Cosine ease-out curve from 0.0 to 1.0
				val smoothT = 0.5f * (1.0f - cos(progress * FastMath.PI))
				foot.clampedPosition = foot.anchorPosition * (1.0f - smoothT) + rawPos * smoothT

				if (progress >= 1.0f) {
					foot.state = StanceState.SWING
					foot.clampedPosition = rawPos
				}
			}
		}
	}

	private fun arbitrateDualStance(
		left: FootState,
		right: FootState,
		leftRaw: Vector3,
		rightRaw: Vector3,
	) {
		// If both feet are in stance locked, that is completely valid (standing still or dual support).
		// Only arbitrate release if one foot has traveled significantly away from its anchor (> 15cm)
		// and has high kinetic energy relative to the resting foot.
		if (left.state == StanceState.STANCE_LOCKED && right.state == StanceState.STANCE_LOCKED) {
			val leftDx = leftRaw.x - left.anchorPosition.x
			val leftDz = leftRaw.z - left.anchorPosition.z
			val leftHozDist = sqrt(leftDx * leftDx + leftDz * leftDz)

			val rightDx = rightRaw.x - right.anchorPosition.x
			val rightDz = rightRaw.z - right.anchorPosition.z
			val rightHozDist = sqrt(rightDx * rightDx + rightDz * rightDz)

			val leftKinetic = left.horizontalSpeed * left.horizontalSpeed + left.angularVelocity * 0.05f
			val rightKinetic = right.horizontalSpeed * right.horizontalSpeed + right.angularVelocity * 0.05f

			if (leftHozDist > 0.15f && leftKinetic > 0.25f && leftKinetic > rightKinetic * 2.0f) {
				left.state = StanceState.RELEASE_BLEND
				left.releaseTimer = 0f
			} else if (rightHozDist > 0.15f && rightKinetic > 0.25f && rightKinetic > leftKinetic * 2.0f) {
				right.state = StanceState.RELEASE_BLEND
				right.releaseTimer = 0f
			}
		}
	}

	private fun blendOutputPosition(
		foot: FootState,
		rawPos: Vector3,
		strength: Float,
	): Vector3 {
		return when (foot.state) {
			StanceState.SWING -> rawPos
			StanceState.STANCE_LOCKED -> {
				if (strength >= 0.95f) {
					foot.clampedPosition
				} else {
					// Interpolate between raw and firmly clamped based on user strength slider
					val factor = FastMath.clamp(strength, 0.0f, 1.0f)
					rawPos * (1.0f - factor) + foot.clampedPosition * factor
				}
			}
			StanceState.RELEASE_BLEND -> foot.clampedPosition
		}
	}
}

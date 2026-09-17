package dev.slimevr.unit

import dev.slimevr.tracking.processor.skeleton.StanceState
import dev.slimevr.tracking.processor.skeleton.ZeroSlideFootClamp
import io.github.axisangles.ktmath.Quaternion
import io.github.axisangles.ktmath.Vector3
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class ZeroSlideFootClampTests {

	private lateinit var clamp: ZeroSlideFootClamp

	@BeforeEach
	fun setup() {
		clamp = ZeroSlideFootClamp(null)
	}

	@Test
	fun testFootEntersStanceAndLocksTranslation() {
		val floorLevel = 0.0f
		val footLength = 0.15f
		val initialPos = Vector3(0.1f, 0.02f, 0.5f)
		val rot = Quaternion.IDENTITY
		val accel = Vector3(0f, 0f, 0f)

		// Frame 1: Initial position initialization (dt = 0.01s)
		clamp.update(
			leftRawPos = initialPos,
			rightRawPos = Vector3(-0.1f, 0.02f, 0.5f),
			leftRawRot = rot,
			rightRawRot = rot,
			leftAccel = accel,
			rightAccel = accel,
			floorLevel = floorLevel,
			footLength = footLength,
			leftSoleOffset = 0f,
			rightSoleOffset = 0f,
			isStanding = true,
			strength = 1.0f,
			overrideDt = 0.01f,
		)

		// Frame 2: Still near ground -> Enters STANCE_LOCKED
		val res2 = clamp.update(
			leftRawPos = initialPos,
			rightRawPos = Vector3(-0.1f, 0.02f, 0.5f),
			leftRawRot = rot,
			rightRawRot = rot,
			leftAccel = accel,
			rightAccel = accel,
			floorLevel = floorLevel,
			footLength = footLength,
			leftSoleOffset = 0f,
			rightSoleOffset = 0f,
			isStanding = true,
			strength = 1.0f,
			overrideDt = 0.01f,
		)

		assertEquals(StanceState.STANCE_LOCKED, res2.leftState)

		// Frame 3: Simulate raw sensor drift / slide of 3 cm horizontally
		val driftedRawPos = Vector3(0.13f, 0.02f, 0.52f)
		val res3 = clamp.update(
			leftRawPos = driftedRawPos,
			rightRawPos = Vector3(-0.1f, 0.02f, 0.5f),
			leftRawRot = rot,
			rightRawRot = rot,
			leftAccel = accel,
			rightAccel = accel,
			floorLevel = floorLevel,
			footLength = footLength,
			leftSoleOffset = 0f,
			rightSoleOffset = 0f,
			isStanding = true,
			strength = 1.0f,
			overrideDt = 0.01f,
		)

		// Verification: The foot must NOT slide! It must remain clamped to the initial touchdown X and Z
		assertEquals(StanceState.STANCE_LOCKED, res3.leftState)
		assertEquals(initialPos.x, res3.leftFootPosition.x, 0.0001f, "Foot X slid during stance!")
		assertEquals(initialPos.z, res3.leftFootPosition.z, 0.0001f, "Foot Z slid during stance!")
	}

	@Test
	fun testZeroFloorPenetration() {
		val floorLevel = 0.0f
		val footLength = 0.15f
		val startPos = Vector3(0.1f, 0.01f, 0.0f)
		val rot = Quaternion.IDENTITY
		val accel = Vector3(0f, 0f, 0f)

		// Frame 1 & 2: establish lock at floor
		clamp.update(
			leftRawPos = startPos,
			rightRawPos = Vector3(-0.1f, 0.01f, 0.0f),
			leftRawRot = rot,
			rightRawRot = rot,
			leftAccel = accel,
			rightAccel = accel,
			floorLevel = floorLevel,
			footLength = footLength,
			leftSoleOffset = 0f,
			rightSoleOffset = 0f,
			isStanding = true,
			strength = 1.0f,
			overrideDt = 0.01f,
		)

		clamp.update(
			leftRawPos = startPos,
			rightRawPos = Vector3(-0.1f, 0.01f, 0.0f),
			leftRawRot = rot,
			rightRawRot = rot,
			leftAccel = accel,
			rightAccel = accel,
			floorLevel = floorLevel,
			footLength = footLength,
			leftSoleOffset = 0f,
			rightSoleOffset = 0f,
			isStanding = true,
			strength = 1.0f,
			overrideDt = 0.01f,
		)

		// Frame 3: Knee flex causes raw foot position to penetrate into floor (y = -0.06m)
		val penetratingPos = Vector3(0.1f, -0.06f, 0.0f)
		val res = clamp.update(
			leftRawPos = penetratingPos,
			rightRawPos = Vector3(-0.1f, 0.01f, 0.0f),
			leftRawRot = rot,
			rightRawRot = rot,
			leftAccel = accel,
			rightAccel = accel,
			floorLevel = floorLevel,
			footLength = footLength,
			leftSoleOffset = 0f,
			rightSoleOffset = 0f,
			isStanding = true,
			strength = 1.0f,
			overrideDt = 0.01f,
		)

		// Verification: The foot must be clamped flush with the floor, strictly preventing ground penetration
		assertTrue(res.leftFootPosition.y >= floorLevel, "Foot penetrated the ground plane! Y was ${res.leftFootPosition.y}")
	}

	@Test
	fun testBreakoutOnDeliberateStep() {
		val floorLevel = 0.0f
		val footLength = 0.15f
		val startPos = Vector3(0.1f, 0.01f, 0.0f)
		val rot = Quaternion.IDENTITY
		val accel = Vector3(0f, 0f, 0f)

		// Lock foot
		clamp.update(startPos, startPos, rot, rot, accel, accel, floorLevel, footLength, 0f, 0f, true, 1.0f, 0.01f)
		val lockRes = clamp.update(startPos, startPos, rot, rot, accel, accel, floorLevel, footLength, 0f, 0f, true, 1.0f, 0.01f)
		assertEquals(StanceState.STANCE_LOCKED, lockRes.leftState)

		// User takes a large forward step (displacement > 30cm)
		val steppedPos = Vector3(0.1f, 0.01f, 0.35f)
		val stepRes = clamp.update(steppedPos, startPos, rot, rot, accel, accel, floorLevel, footLength, 0f, 0f, true, 1.0f, 0.01f)

		// Breakout must trigger
		assertEquals(StanceState.RELEASE_BLEND, stepRes.leftState, "Foot failed to initiate breakout release on forward step!")
	}

	@Test
	fun testLiftOffOnUpwardVelocity() {
		val floorLevel = 0.0f
		val footLength = 0.15f
		val startPos = Vector3(0.1f, 0.01f, 0.0f)
		val rot = Quaternion.IDENTITY
		val accel = Vector3(0f, 0f, 0f)

		// Lock foot
		clamp.update(startPos, startPos, rot, rot, accel, accel, floorLevel, footLength, 0f, 0f, true, 1.0f, 0.01f)
		clamp.update(startPos, startPos, rot, rot, accel, accel, floorLevel, footLength, 0f, 0f, true, 1.0f, 0.01f)

		// Foot lifts upward with vertical velocity
		val liftedPos = Vector3(0.1f, 0.06f, 0.0f)
		val liftRes = clamp.update(liftedPos, startPos, rot, rot, accel, accel, floorLevel, footLength, 0f, 0f, true, 1.0f, 0.01f)

		// Lift release must trigger
		assertEquals(StanceState.RELEASE_BLEND, liftRes.leftState, "Foot failed to release when lifted upward!")
	}

	@Test
	fun testBypassWhenNotStanding() {
		val floorLevel = 0.0f
		val footLength = 0.15f
		val pos = Vector3(0.1f, 0.01f, 0.0f)
		val rot = Quaternion.IDENTITY
		val accel = Vector3(0f, 0f, 0f)

		val res = clamp.update(
			leftRawPos = pos,
			rightRawPos = pos,
			leftRawRot = rot,
			rightRawRot = rot,
			leftAccel = accel,
			rightAccel = accel,
			floorLevel = floorLevel,
			footLength = footLength,
			leftSoleOffset = 0f,
			rightSoleOffset = 0f,
			isStanding = false, // User is sitting or lying down
			strength = 1.0f,
			overrideDt = 0.01f,
		)

		assertEquals(StanceState.SWING, res.leftState)
		assertEquals(pos.x, res.leftFootPosition.x, 0.0001f)
		assertEquals(pos.y, res.leftFootPosition.y, 0.0001f)
		assertEquals(pos.z, res.leftFootPosition.z, 0.0001f)
	}
}

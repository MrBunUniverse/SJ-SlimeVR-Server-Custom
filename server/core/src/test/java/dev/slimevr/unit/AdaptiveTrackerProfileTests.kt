package dev.slimevr.unit

import dev.slimevr.config.config
import dev.slimevr.tracking.telemetry.TrackerTelemetryLogger
import dev.slimevr.tracking.trackers.Tracker
import dev.slimevr.tracking.trackers.TrackerPosition
import dev.slimevr.tracking.trackers.TrackerStatus
import dev.slimevr.tracking.trackers.udp.IMUType
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class AdaptiveTrackerProfileTests {

	private fun createImuTracker(imu: IMUType = IMUType.UNKNOWN): Tracker {
		return Tracker(
			device = null,
			id = 1,
			name = "TestTracker",
			trackerPosition = TrackerPosition.CHEST,
			trackerNum = 0,
			hasPosition = false,
			hasRotation = true,
			isComputed = false,
			imuType = imu,
			allowReset = true,
			allowMounting = true,
			isHmd = false,
			trackRotDirection = false,
		).apply { status = TrackerStatus.OK }
	}

	@Test
	fun `test MPU6050 preset seeds 4_5 deg per min`() {
		val tracker = createImuTracker()
		tracker.config.imuProfileOverride = "mpu6050"
		tracker.resetsHandler.readAdaptiveProfile(tracker.config)

		assertEquals(4.5f, tracker.config.learnedDriftRateDegPerMin, 0.001f)
		assertTrue(tracker.resetsHandler.compensateDrift)
	}

	@Test
	fun `test BMI160 preset seeds 3_15 deg per min`() {
		val tracker = createImuTracker()
		tracker.config.imuProfileOverride = "bmi160"
		tracker.resetsHandler.readAdaptiveProfile(tracker.config)

		assertEquals(3.15f, tracker.config.learnedDriftRateDegPerMin, 0.001f)
		assertTrue(tracker.resetsHandler.compensateDrift)
	}

	@Test
	fun `test LSM6_ICM preset seeds 0_85 deg per min`() {
		val tracker = createImuTracker()
		tracker.config.imuProfileOverride = "lsm6_icm"
		tracker.resetsHandler.readAdaptiveProfile(tracker.config)

		assertEquals(0.85f, tracker.config.learnedDriftRateDegPerMin, 0.001f)
		assertTrue(tracker.resetsHandler.compensateDrift)
	}

	@Test
	fun `test BNO085 preset disables drift compensation`() {
		val tracker = createImuTracker(IMUType.BNO085)
		tracker.config.imuProfileOverride = "bno085"
		tracker.resetsHandler.readAdaptiveProfile(tracker.config)

		assertEquals(0.0f, tracker.config.learnedDriftRateDegPerMin, 0.001f)
		assertFalse(tracker.resetsHandler.compensateDrift)
	}

	@Test
	fun `test resetLearnedDrift clears learned drift`() {
		val tracker = createImuTracker()
		tracker.config.imuProfileOverride = "mpu6050"
		tracker.resetsHandler.readAdaptiveProfile(tracker.config)
		assertEquals(4.5f, tracker.config.learnedDriftRateDegPerMin, 0.001f)

		tracker.resetsHandler.resetLearnedDrift()
		assertEquals(0.0f, tracker.config.learnedDriftRateDegPerMin, 0.001f)
		assertEquals(0, tracker.config.totalDriftObservations)
	}

	@Test
	fun `test telemetry logger start and stop`() {
		val dir = TrackerTelemetryLogger.getTelemetryDirectory()
		assertTrue(dir.exists())

		val file = TrackerTelemetryLogger.startSession()
		assertTrue(TrackerTelemetryLogger.isRecording())
		assertTrue(file != null && file.exists())

		val stopped = TrackerTelemetryLogger.stopSession()
		assertEquals(file, stopped)
		assertFalse(TrackerTelemetryLogger.isRecording())
	}
}

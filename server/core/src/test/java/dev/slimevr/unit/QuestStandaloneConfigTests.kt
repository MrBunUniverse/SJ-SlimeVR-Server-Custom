package dev.slimevr.unit

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory
import dev.slimevr.config.QuestStandaloneConfig
import dev.slimevr.config.RecenterBehavior
import dev.slimevr.config.TrackingProfileType
import dev.slimevr.config.VRConfig
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class QuestStandaloneConfigTests {

	@Test
	fun `test default quest standalone config values`() {
		val config = QuestStandaloneConfig()
		assertTrue(config.enabled)
		assertEquals(TrackingProfileType.STANDING, config.activeProfile)
		assertTrue(config.floorAnchorEnabled)
		assertEquals(0.0f, config.floorHeight)
		assertEquals(0.5f, config.correctionStrength)
		assertEquals(0.0f, config.hmdVerticalOffset)
		assertEquals(RecenterBehavior.REANCHOR_ON_FULL_RESET, config.recenterBehavior)
		assertTrue(config.crouchCompensationEnabled)
		assertEquals(0.5f, config.crouchCompensationStrength)
		assertTrue(config.skeletonConstraintsEnabled)

		// Test default profiles exist
		assertTrue(config.profiles.containsKey("STANDING"))
		assertTrue(config.profiles.containsKey("CROUCHING"))
		assertTrue(config.profiles.containsKey("SITTING"))
		assertTrue(config.profiles.containsKey("CUSTOM"))

		val standingProfile = config.profiles["STANDING"]
		assertNotNull(standingProfile)
		assertTrue(standingProfile!!.floorAnchorEnabled)
		assertEquals(0.5f, standingProfile.correctionStrength)
	}

	@Test
	fun `test serialization and migration compatibility`() {
		val mapper = ObjectMapper(YAMLFactory())
		val vrConfig = VRConfig()

		val yamlString = mapper.writeValueAsString(vrConfig)
		assertNotNull(yamlString)
		assertTrue(yamlString.contains("questStandalone:"))

		// Test deserialization into fresh instance
		val deserialized = mapper.readValue(yamlString, VRConfig::class.java)
		assertNotNull(deserialized.questStandalone)
		assertTrue(deserialized.questStandalone.floorAnchorEnabled)
		assertEquals(0.5f, deserialized.questStandalone.correctionStrength)
	}
}

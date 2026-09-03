package dev.slimevr.unit

import com.google.flatbuffers.FlatBufferBuilder
import com.illposed.osc.OSCMessage
import com.illposed.osc.OSCMessageEvent
import dev.slimevr.VRServer
import dev.slimevr.config.VRConfig
import dev.slimevr.osc.VRCOSCHandler
import dev.slimevr.protocol.rpc.settings.RPCSettingsHandler
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import solarxr_protocol.rpc.ChangeSettingsRequest
import solarxr_protocol.rpc.RpcMessage
import solarxr_protocol.rpc.RpcMessageHeader
import solarxr_protocol.rpc.settings.ModelSettings
import solarxr_protocol.rpc.settings.SkeletonHeight
import solarxr_protocol.rpc.settings.SkeletonHeightT
import java.net.InetSocketAddress

class QuestAutoDetectionAndRpcTests {

	@Test
	fun `test flatbuffer skeletonHeight oscRate serialization and deserialization`() {
		val fbb = FlatBufferBuilder(64)
		val heightOffset = SkeletonHeight.createSkeletonHeight(fbb, 1.75f, 0.05f, 90)
		fbb.finish(heightOffset)

		val deserialized = SkeletonHeight.getRootAsSkeletonHeight(fbb.dataBuffer())
		assertTrue(deserialized.hasOscRate())
		assertEquals(90, deserialized.oscRate())
		assertEquals(1.75f, deserialized.hmdHeight())
		assertEquals(0.05f, deserialized.floorHeight())

		// Test unpack / pack with SkeletonHeightT
		val unpacked = deserialized.unpack()
		assertEquals(90, unpacked.oscRate)
		assertEquals(1.75f, unpacked.hmdHeight)
		assertEquals(0.05f, unpacked.floorHeight)

		val fbb2 = FlatBufferBuilder(64)
		unpacked.oscRate = 50
		val offset2 = SkeletonHeight.pack(fbb2, unpacked)
		fbb2.finish(offset2)

		val deserialized2 = SkeletonHeight.getRootAsSkeletonHeight(fbb2.dataBuffer())
		assertEquals(50, deserialized2.oscRate())
	}

	@Test
	fun `test VRCOSCHandler auto-detects inbound Quest IP on message receive`() {
		val configManager = dev.slimevr.config.ConfigManager("test-config.yml")
		configManager.loadConfig()
		val vrServer = VRServer(configManager = configManager)
		val vrcOscHandler = vrServer.vrcOSCHandler
		vrServer.configManager.vrConfig.vrcOSC.enabled = true
		vrcOscHandler.updateOscSender(9000, "127.0.0.1")
		assertEquals("127.0.0.1", vrcOscHandler.address.hostAddress)

		// Create an OSC message event from an inbound Quest socket address
		val questSenderAddress = InetSocketAddress("192.168.1.188", 9001)
		val oscMessage = OSCMessage("/tracking/vrsystem/head/pose", listOf(0f, 1.5f, 0f, 0f, 0f, 0f))
		val event = OSCMessageEvent(questSenderAddress, null, oscMessage)

		// Invoke handleReceivedMessage
		val handleMethod = VRCOSCHandler::class.java.getDeclaredMethod("handleReceivedMessage", OSCMessageEvent::class.java)
		handleMethod.isAccessible = true
		handleMethod.invoke(vrcOscHandler, event)

		// Verify that the sender address has automatically updated to the Quest IP
		assertEquals("192.168.1.188", vrcOscHandler.address.hostAddress)
		assertEquals("192.168.1.188", vrServer.configManager.vrConfig.vrcOSC.address)
	}

	@Test
	fun `test RPCSettingsHandler updates questStandalone oscRate from skeletonHeight`() {
		val configManager = dev.slimevr.config.ConfigManager("test-config.yml")
		configManager.loadConfig()
		val vrServer = VRServer(configManager = configManager)
		vrServer.configManager.vrConfig.questStandalone.oscRate = 60

		val fbb = FlatBufferBuilder(256)
		val heightOffset = SkeletonHeight.createSkeletonHeight(fbb, 0f, 0f, 90)
		ModelSettings.startModelSettings(fbb)
		ModelSettings.addSkeletonHeight(fbb, heightOffset)
		val modelOffset = ModelSettings.endModelSettings(fbb)

		ChangeSettingsRequest.startChangeSettingsRequest(fbb)
		ChangeSettingsRequest.addModelSettings(fbb, modelOffset)
		val changeReqOffset = ChangeSettingsRequest.endChangeSettingsRequest(fbb)

		RpcMessageHeader.startRpcMessageHeader(fbb)
		RpcMessageHeader.addMessageType(fbb, RpcMessage.ChangeSettingsRequest)
		RpcMessageHeader.addMessage(fbb, changeReqOffset)
		val headerOffset = RpcMessageHeader.endRpcMessageHeader(fbb)
		fbb.finish(headerOffset)

		val header = RpcMessageHeader.getRootAsRpcMessageHeader(fbb.dataBuffer())
		val rpcSettingsHandler = RPCSettingsHandler(vrServer.protocolAPI.rpcHandler, vrServer.protocolAPI)
		rpcSettingsHandler.onChangeSettingsRequest(null, header)

		assertEquals(90, vrServer.configManager.vrConfig.questStandalone.oscRate)
	}
}

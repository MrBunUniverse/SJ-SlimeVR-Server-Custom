import SwiftUI
import SceneKit

public struct SkeletonVisualizer3DView: View {
    @ObservedObject public var client: SlimeVRClient
    
    public init(client: SlimeVRClient) {
        self.client = client
    }
    
    public var body: some View {
        ZStack(alignment: .topTrailing) {
            SceneKitView(floorOffset: client.config.floorHeight)
                .frame(height: 240)
                .cornerRadius(18)
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .strokeBorder(Color.white.opacity(0.1), lineWidth: 1)
                )
            
            // HUD Overlay controls
            HStack(spacing: 6) {
                Image(systemName: "cube.transparent")
                    .font(.system(size: 11))
                Text("Interactive 3D Skeleton (Drag to Orbit)")
                    .font(.system(size: 10, weight: .semibold))
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(.ultraThinMaterial)
            .cornerRadius(8)
            .padding(10)
        }
    }
}

struct SceneKitView: NSViewRepresentable {
    var floorOffset: Float
    
    func makeNSView(context: Context) -> SCNView {
        let scnView = SCNView()
        let scene = SCNScene()
        scnView.scene = scene
        scnView.allowsCameraControl = true
        scnView.autoenablesDefaultLighting = true
        scnView.backgroundColor = NSColor(white: 0.05, alpha: 0.8)
        
        // Camera Node
        let cameraNode = SCNNode()
        cameraNode.camera = SCNCamera()
        cameraNode.position = SCNVector3(x: 0, y: 1.2, z: 2.8)
        scene.rootNode.addChildNode(cameraNode)
        
        // Floor Grid
        let floorGeometry = SCNFloor()
        floorGeometry.reflectivity = 0.08
        let floorNode = SCNNode(geometry: floorGeometry)
        floorNode.position = SCNVector3(0, floorOffset, 0)
        scene.rootNode.addChildNode(floorNode)
        
        // Build Human Skeleton Joints & Bones
        let skeletonNode = SCNNode()
        skeletonNode.name = "skeleton"
        
        // Joints: Head, Chest, Waist, Left Hip, Right Hip, Left Knee, Right Knee, Left Foot, Right Foot
        let jointColor = NSColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0)
        let boneColor = NSColor(white: 0.85, alpha: 0.9)
        
        let head = createSphere(radius: 0.10, color: jointColor, pos: SCNVector3(0, 1.65, 0))
        let chest = createSphere(radius: 0.08, color: jointColor, pos: SCNVector3(0, 1.35, 0))
        let waist = createSphere(radius: 0.07, color: jointColor, pos: SCNVector3(0, 1.05, 0))
        let leftHip = createSphere(radius: 0.06, color: jointColor, pos: SCNVector3(-0.14, 0.92, 0))
        let rightHip = createSphere(radius: 0.06, color: jointColor, pos: SCNVector3(0.14, 0.92, 0))
        let leftKnee = createSphere(radius: 0.06, color: jointColor, pos: SCNVector3(-0.14, 0.50, 0))
        let rightKnee = createSphere(radius: 0.06, color: jointColor, pos: SCNVector3(0.14, 0.50, 0))
        let leftFoot = createSphere(radius: 0.05, color: jointColor, pos: SCNVector3(-0.14, 0.06 + floorOffset, 0))
        let rightFoot = createSphere(radius: 0.05, color: jointColor, pos: SCNVector3(0.14, 0.06 + floorOffset, 0))
        
        skeletonNode.addChildNode(head)
        skeletonNode.addChildNode(chest)
        skeletonNode.addChildNode(waist)
        skeletonNode.addChildNode(leftHip)
        skeletonNode.addChildNode(rightHip)
        skeletonNode.addChildNode(leftKnee)
        skeletonNode.addChildNode(rightKnee)
        skeletonNode.addChildNode(leftFoot)
        skeletonNode.addChildNode(rightFoot)
        
        // Connecting Bones
        addCylinder(from: head.position, to: chest.position, in: skeletonNode, color: boneColor)
        addCylinder(from: chest.position, to: waist.position, in: skeletonNode, color: boneColor)
        addCylinder(from: waist.position, to: leftHip.position, in: skeletonNode, color: boneColor)
        addCylinder(from: waist.position, to: rightHip.position, in: skeletonNode, color: boneColor)
        addCylinder(from: leftHip.position, to: leftKnee.position, in: skeletonNode, color: boneColor)
        addCylinder(from: rightHip.position, to: rightKnee.position, in: skeletonNode, color: boneColor)
        addCylinder(from: leftKnee.position, to: leftFoot.position, in: skeletonNode, color: boneColor)
        addCylinder(from: rightKnee.position, to: rightFoot.position, in: skeletonNode, color: boneColor)
        
        scene.rootNode.addChildNode(skeletonNode)
        return scnView
    }
    
    func updateNSView(_ nsView: SCNView, context: Context) {
        // Dynamic floor offset updates
        if let floor = nsView.scene?.rootNode.childNode(withName: "floor", recursively: true) {
            floor.position = SCNVector3(0, floorOffset, 0)
        }
    }
    
    private func createSphere(radius: CGFloat, color: NSColor, pos: SCNVector3) -> SCNNode {
        let sphere = SCNSphere(radius: radius)
        sphere.firstMaterial?.diffuse.contents = color
        let node = SCNNode(geometry: sphere)
        node.position = pos
        return node
    }
    
    private func addCylinder(from start: SCNVector3, to end: SCNVector3, in parent: SCNNode, color: NSColor) {
        let vector = SCNVector3(end.x - start.x, end.y - start.y, end.z - start.z)
        let distance = sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z)
        let cylinder = SCNCylinder(radius: 0.02, height: CGFloat(distance))
        cylinder.firstMaterial?.diffuse.contents = color
        let node = SCNNode(geometry: cylinder)
        node.position = SCNVector3((start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2)
        node.eulerAngles = SCNVector3(CGFloat.pi / 2, acos(CGFloat(vector.z / distance)), atan2(CGFloat(vector.y), CGFloat(vector.x)))
        parent.addChildNode(node)
    }
}

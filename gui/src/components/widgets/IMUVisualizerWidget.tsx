import { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { TrackerDataT, TrackerStatus } from 'solarxr-protocol';
import { useTracker } from '@/hooks/tracker';
import { Typography } from '@/components/commons/Typography';
import { formatVector3 } from '@/utils/formatting';
import {
  AmbientLight,
  ArrowHelper,
  AxesHelper,
  DoubleSide,
  Euler,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  Scene,
  SpotLight,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Button } from '@/components/commons/Button';
import { QuatObject } from '@/maths/quaternion';
import { useLocalization } from '@fluent/react';
import { Vector3Object, Vector3FromVec3fT } from '@/maths/vector3';
import { ErrorBoundary } from 'react-error-boundary';
import { StayAlignedInfo } from '@/components/stay-aligned/StayAlignedInfo';
import { useAtomValue } from 'jotai';
import { demoModeAtom } from '@/store/demo-trackers';

const GROUND_COLOR = '#3C3832';
const MODEL_SCALE = 6.5;
const CANVAS_HEIGHT = 200;

// Three.js context - isolated from React
type IMUVisualizerContext = {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  trackerGroup: Group;
  accelArrow: ArrowHelper;
  magArrow: ArrowHelper;
  animationId: number | null;
  render: () => void;
  update: (quat: QuatObject, vec: Vector3Object, mag: Vector3Object) => void;
  dispose: () => void;
};

async function initializeIMUVisualizer(
  canvas: HTMLCanvasElement,
  modelPath: string,
  height = CANVAS_HEIGHT
): Promise<IMUVisualizerContext> {
  const scene = new Scene();

  const width = canvas.clientWidth || canvas.parentElement?.clientWidth || 200;

  const camera = new PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(0, 0, height < 150 ? 4.8 : 7);

  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'low-power',
    stencil: false,
  });
  renderer.setSize(width, height);

  const ambientLight = new AmbientLight(0xffffff, 0.5 * Math.PI);
  scene.add(ambientLight);

  const spotLight = new SpotLight(0xffffff, 4000);
  spotLight.position.set(20, 20, 20);
  spotLight.angle = 0.09;
  spotLight.penumbra = 1;
  scene.add(spotLight);

  const trackerGroup = new Group();
  scene.add(trackerGroup);

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(modelPath);
  const modelGroup = new Group();
  modelGroup.scale.setScalar(height < 150 ? 6.5 : MODEL_SCALE);
  modelGroup.rotation.x = Math.PI / 2;
  modelGroup.add(gltf.scene);
  trackerGroup.add(modelGroup);

  const axesHelper = new AxesHelper(height < 150 ? 3.2 : 10);
  trackerGroup.add(axesHelper);

  const accelArrow = new ArrowHelper(
    new Vector3(0, 1, 0),
    new Vector3(0, 0, 0),
    1,
    0x00ffff
  );
  scene.add(accelArrow);

  const magArrow = new ArrowHelper(
    new Vector3(0, 1, 0),
    new Vector3(0, 0, 0),
    1,
    0xff00ff
  );
  scene.add(magArrow);

  const groundGeometry = new PlaneGeometry(50, 50, 10, 10);
  const groundMaterial = new MeshBasicMaterial({
    wireframe: true,
    color: GROUND_COLOR,
    transparent: true,
    opacity: 0.2,
    side: DoubleSide,
  });
  const ground = new Mesh(groundGeometry, groundMaterial);
  ground.position.set(0, height < 150 ? -1.6 : -3, 0);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const renderScene = () => {
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  };

  // Initial render
  renderScene();

  const update = (quat: QuatObject, vec: Vector3Object, mag: Vector3Object) => {
    trackerGroup.quaternion.set(quat.x, quat.y, quat.z, quat.w);

    const accelVec = Vector3FromVec3fT(vec);
    const accelLength = accelVec.length();
    if (accelLength > 0) {
      accelArrow.setDirection(accelVec.normalize());
      accelArrow.setLength(Math.sqrt(accelLength) * 2);
    }

    const magVec = Vector3FromVec3fT(mag);
    const magLen = magVec.length();
    const magMag = Math.sqrt(magLen / 100);
    if (magLen > 0) {
      if (magArrow.parent === null) scene.add(magArrow);

      const magDir = magVec.clone().normalize();
      magArrow.position.copy(magDir.clone().multiplyScalar(-magMag));
      magArrow.setDirection(magDir);
      magArrow.setLength(2 * magMag);
    } else {
      magArrow.removeFromParent();
    }
    renderScene();
  };

  const dispose = () => {
    trackerGroup.traverse((child) => {
      if ('geometry' in child && child.geometry)
        (child.geometry as any).dispose();
      if ('material' in child && child.material) {
        const mat = child.material as any;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
    renderer.dispose();
    groundGeometry.dispose();
    groundMaterial.dispose();
    scene.clear();
  };

  return {
    scene,
    camera,
    renderer,
    trackerGroup,
    accelArrow,
    magArrow,
    animationId: null,
    render: renderScene,
    update,
    dispose,
  };
}

export function IMUVisualizerCanvas({
  quat,
  vec,
  mag,
  model,
  height = CANVAS_HEIGHT,
  className,
  animateDemo = false,
  demoPhase = 0,
}: {
  quat: QuatObject;
  vec: Vector3Object;
  mag: Vector3Object;
  model: string;
  height?: number;
  className?: string;
  animateDemo?: boolean;
  demoPhase?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<IMUVisualizerContext | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let mounted = true;

    initializeIMUVisualizer(canvasRef.current, model, height)
      .then((ctx) => {
        if (mounted) {
          contextRef.current = ctx;
          ctx.update(quat, vec, mag);
        } else {
          ctx.dispose();
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
        }
      });

    return () => {
      mounted = false;
      contextRef.current?.dispose();
      contextRef.current = null;
    };
  }, [model, height]);

  useEffect(() => {
    if (!animateDemo) {
      contextRef.current?.update(quat, vec, mag);
    }
  }, [quat, vec, mag, animateDemo]);

  // Realistic IMU simulation: natural human pose shifts, micro-tremors, sensor noise, and linear accel kicks
  useEffect(() => {
    if (!animateDemo) return;

    let animId: number;
    const euler = new Euler();
    const demoQuat = new Quaternion();
    const accelVec = new Vector3();

    const loop = () => {
      const ctx = contextRef.current;
      if (ctx) {
        const now = performance.now();
        const t = now * 0.001;

        // 1. Natural human body motion cadence (multi-frequency harmonic shifts)
        const primaryShift = Math.sin(t * 0.75 + demoPhase) * 0.38;
        const secondaryShift = Math.cos(t * 1.35 + demoPhase * 1.6) * 0.18;
        const bodyYaw =
          Math.sin(t * 0.45 + demoPhase) * 0.55 +
          Math.cos(t * 0.9 + demoPhase * 0.8) * 0.22;

        // 2. Realistic physiological micro-tremor (8-12 Hz muscle tremor characteristic of real IMUs strapped to a limb)
        const tremorFrequency1 =
          Math.sin(now * 0.055 + demoPhase * 3.7) * 0.012;
        const tremorFrequency2 =
          Math.cos(now * 0.072 + demoPhase * 5.1) * 0.008;

        // 3. Real sensor quantization / micro-jitter (white noise flutter typical of BMI160 / ICM-42688 sensors)
        const imuNoisePitch = (Math.random() - 0.5) * 0.006;
        const imuNoiseRoll = (Math.random() - 0.5) * 0.006;
        const imuNoiseYaw = (Math.random() - 0.5) * 0.008;

        // Combine for organic, alive IMU movement
        const pitch = primaryShift + tremorFrequency1 + imuNoisePitch;
        const yaw = bodyYaw + tremorFrequency2 + imuNoiseYaw;
        const roll = secondaryShift + tremorFrequency1 * 0.8 + imuNoiseRoll;

        euler.set(pitch, yaw, roll);
        demoQuat.setFromEuler(euler);
        ctx.trackerGroup.quaternion.copy(demoQuat);

        // 4. Slight physical inertia translation (tracker bouncing subtly on strap/fabric rather than rigid floating)
        const microPosX =
          Math.sin(t * 1.5 + demoPhase) * 0.04 + (Math.random() - 0.5) * 0.005;
        const microPosY =
          Math.cos(t * 1.8 + demoPhase) * 0.05 + (Math.random() - 0.5) * 0.005;
        const microPosZ = Math.sin(t * 1.1 + demoPhase) * 0.03;
        ctx.trackerGroup.position.set(microPosX, microPosY, microPosZ);

        // 5. Dynamic acceleration arrow reacting to directional velocity kicks
        if (ctx.accelArrow) {
          const accelLength =
            1.2 +
            Math.abs(Math.sin(t * 1.5 + demoPhase)) * 1.4 +
            Math.random() * 0.15;
          accelVec
            .set(
              Math.sin(t * 1.5 + demoPhase) * 0.6,
              1.0 + Math.cos(t * 1.8 + demoPhase) * 0.4,
              Math.cos(t * 1.1 + demoPhase) * 0.5
            )
            .normalize();
          ctx.accelArrow.setDirection(accelVec);
          ctx.accelArrow.setLength(accelLength);
        }

        ctx.render();
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      if (contextRef.current?.trackerGroup) {
        contextRef.current.trackerGroup.position.set(0, 0, 0);
      }
    };
  }, [animateDemo, demoPhase]);

  if (error) {
    throw error;
  }

  return (
    <canvas
      ref={canvasRef}
      className={className ?? 'container'}
      style={{
        width: '100%',
        height: height,
        background: 'transparent',
      }}
    />
  );
}

export function CardIMUVisualizer({
  tracker,
  height = 100,
}: {
  tracker: TrackerDataT;
  height?: number;
}) {
  const isDemo = useAtomValue(demoModeAtom);
  const isExtension = useMemo(
    () => (tracker.trackerId?.trackerNum ?? 0) > 0,
    [tracker]
  );

  const isDisconnected = tracker.status === TrackerStatus.DISCONNECTED;
  const isDead =
    (tracker as any).device?.hardwareStatus?.batteryPctEstimate === 0 &&
    !isDisconnected;
  const animateDemo = isDemo && !isDisconnected && !isDead;

  const phase = useMemo(() => {
    const id = Number(tracker.trackerId?.deviceId?.id ?? 1);
    const trackerNum = Number(tracker.trackerId?.trackerNum ?? 0);
    return id * 1.35 + trackerNum * 2.1;
  }, [tracker.trackerId?.deviceId?.id, tracker.trackerId?.trackerNum]);

  const quat = useMemo(
    () =>
      tracker?.rotationIdentityAdjusted ||
      tracker?.rotation || { x: 0, y: 0, z: 0, w: 1 },
    [tracker?.rotationIdentityAdjusted, tracker?.rotation]
  );

  const vec = useMemo(
    () =>
      tracker?.linearAcceleration ||
      tracker?.rawAcceleration || { x: 0, y: 0, z: 0 },
    [tracker?.linearAcceleration, tracker?.rawAcceleration]
  );

  const mag = useMemo(
    () => tracker?.rawMagneticVector || { x: 0, y: 0, z: 0 },
    [tracker?.rawMagneticVector]
  );

  const model = useMemo(
    () => (isExtension ? '/models/extension.gltf' : '/models/tracker.gltf'),
    [isExtension]
  );

  return (
    <ErrorBoundary
      fallback={
        <div className="text-[11px] text-background-30 select-none">
          3D Preview unavailable
        </div>
      }
    >
      <IMUVisualizerCanvas
        quat={quat}
        vec={vec}
        mag={mag}
        model={model}
        height={height}
        animateDemo={animateDemo}
        demoPhase={phase}
      />
    </ErrorBoundary>
  );
}

export function IMUVisualizerWidget({ tracker }: { tracker: TrackerDataT }) {
  const { l10n } = useLocalization();
  const [enabled, setEnabled] = useState(false);
  const [isTrackingDataCollapsed, setIsTrackingDataCollapsed] = useState(() => {
    return (
      localStorage.getItem('slimevr-tracker-trackingdata-collapsed') === 'true'
    );
  });
  const isDemo = useAtomValue(demoModeAtom);
  const isExtension = useMemo(
    () => (tracker.trackerId?.trackerNum ?? 0) > 0,
    [tracker]
  );

  const isDisconnected = tracker.status === TrackerStatus.DISCONNECTED;
  const isDead =
    (tracker as any).device?.hardwareStatus?.batteryPctEstimate === 0 &&
    !isDisconnected;
  const animateDemo = isDemo && !isDisconnected && !isDead;

  const phase = useMemo(() => {
    const id = Number(tracker.trackerId?.deviceId?.id ?? 1);
    const trackerNum = Number(tracker.trackerId?.trackerNum ?? 0);
    return id * 1.35 + trackerNum * 2.1;
  }, [tracker.trackerId?.deviceId?.id, tracker.trackerId?.trackerNum]);

  useEffect(() => {
    const state = localStorage.getItem('modelPreview');
    if (state) setEnabled(state === 'true');
  }, []);

  const { useRawRotationEulerDegrees, useIdentAdjRotationEulerDegrees } =
    useTracker(tracker);

  const rotationRaw = useRawRotationEulerDegrees();
  const rotationIdent = useIdentAdjRotationEulerDegrees() || rotationRaw;

  const quat = useMemo(
    () =>
      tracker?.rotationIdentityAdjusted ||
      tracker?.rotation || { x: 0, y: 0, z: 0, w: 1 },
    [tracker?.rotationIdentityAdjusted, tracker?.rotation]
  );

  const vec = useMemo(
    () =>
      tracker?.linearAcceleration ||
      tracker?.rawAcceleration || { x: 0, y: 0, z: 0 },
    [tracker?.linearAcceleration, tracker?.rawAcceleration]
  );

  const mag = useMemo(
    () => tracker?.rawMagneticVector || { x: 0, y: 0, z: 0 },
    [tracker?.rawMagneticVector]
  );

  const model = useMemo(
    () => (isExtension ? '/models/extension.gltf' : '/models/tracker.gltf'),
    [isExtension]
  );

  return (
    <div className="bg-background-70 flex flex-col p-3 rounded-lg gap-2">
      <div
        className="flex items-center justify-between cursor-pointer select-none py-0.5"
        onClick={() => {
          setIsTrackingDataCollapsed(!isTrackingDataCollapsed);
          localStorage.setItem(
            'slimevr-tracker-trackingdata-collapsed',
            String(!isTrackingDataCollapsed)
          );
        }}
      >
        <Typography variant="section-title">
          {l10n.getString('widget-imu_visualizer')}
        </Typography>
        <button
          type="button"
          className="text-background-30 hover:text-background-10 transition-colors p-0.5 rounded cursor-pointer"
          aria-label={
            isTrackingDataCollapsed
              ? 'Expand Tracking Data'
              : 'Collapse Tracking Data'
          }
        >
          <svg
            className={classNames(
              'w-4 h-4 transition-transform duration-200',
              isTrackingDataCollapsed ? '-rotate-90' : 'rotate-0'
            )}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {!isTrackingDataCollapsed && (
        <>
          {tracker.position && (
            <div className="flex justify-between">
              <Typography>
                {l10n.getString('widget-imu_visualizer-position')}
              </Typography>
              <Typography>{formatVector3(tracker.position, 2)}</Typography>
            </div>
          )}

          <div className="flex justify-between">
            <Typography>
              {l10n.getString('widget-imu_visualizer-rotation_raw')}
            </Typography>
            <Typography>{formatVector3(rotationRaw, 2)}</Typography>
          </div>

          <div className="flex justify-between">
            <Typography>
              {l10n.getString('widget-imu_visualizer-rotation_preview')}
            </Typography>
            <Typography>{formatVector3(rotationIdent, 2)}</Typography>
          </div>

          {tracker.linearAcceleration && (
            <div className="flex justify-between">
              <Typography>
                {l10n.getString('widget-imu_visualizer-acceleration')}
              </Typography>
              <Typography>
                {formatVector3(tracker.linearAcceleration, 1)}
              </Typography>
            </div>
          )}

          {tracker.rawMagneticVector && (
            <div className="flex justify-between">
              <Typography>
                {l10n.getString('tracker-infos-magnetometer')}
              </Typography>
              <Typography>
                {formatVector3(tracker.rawMagneticVector, 1)}
              </Typography>
            </div>
          )}

          {!!tracker.stayAligned && (
            <div className="flex justify-between">
              <Typography>
                {l10n.getString('widget-imu_visualizer-stay_aligned')}
              </Typography>
              <StayAlignedInfo color="primary" tracker={tracker} />
            </div>
          )}

          {!enabled && (
            <Button
              variant="secondary"
              onClick={() => {
                setEnabled(true);
                localStorage.setItem('modelPreview', 'true');
              }}
            >
              {l10n.getString('widget-imu_visualizer-preview')}
            </Button>
          )}
          {enabled && (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setEnabled(false);
                  localStorage.setItem('modelPreview', 'false');
                }}
              >
                {l10n.getString('widget-imu_visualizer-hide')}
              </Button>
              <ErrorBoundary
                fallback={
                  <Typography color="primary" textAlign="text-center">
                    {l10n.getString('tips-failed_webgl')}
                  </Typography>
                }
              >
                <IMUVisualizerCanvas
                  quat={quat}
                  vec={vec}
                  mag={mag}
                  model={model}
                  animateDemo={animateDemo}
                  demoPhase={phase}
                />
              </ErrorBoundary>
            </>
          )}
        </>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useWebsocketAPI } from '@/hooks/websocket-api';
import { useAtomValue, useAtom } from 'jotai';
import {
  assignedTrackersAtom,
  unassignedTrackersAtom,
  hasRealTrackersAtom,
  active3DTrackerKeysAtom,
  showSidebarAtom,
  cardMorphOriginAtom,
  CardMorphOrigin,
} from '@/store/app-store';
import { useSidebarPushAnimation } from '@/hooks/sidebar-animation';
import { useCollapsibleHeight } from '@/hooks/collapsible-height';
import { demoModeAtom, toggleDemoModeAtom } from '@/store/demo-trackers';
import { useTracker } from '@/hooks/tracker';
import { BodyPartIcon } from '@/components/commons/BodyPartIcon';
import { SlimeVRIcon } from '@/components/commons/icon/SimevrIcon';
import { CardIMUVisualizer } from '@/components/widgets/IMUVisualizerWidget';
import {
  TrackerDataT,
  DeviceDataT,
  TrackerStatus as TrackerStatusEnum,
} from 'solarxr-protocol';
import classNames from 'classnames';

export function ClaudeTrackerWindowCard({
  tracker,
  device,
  onClick,
}: {
  tracker: TrackerDataT;
  device?: DeviceDataT;
  onClick?: (origin: CardMorphOrigin) => void;
}) {
  const { useName, useVelocity } = useTracker(tracker);
  const trackerName = useName();
  const velocity = useVelocity();
  const isDemo = useAtomValue(demoModeAtom);

  const batteryPct = device?.hardwareStatus?.batteryPctEstimate;
  const batteryVoltage = device?.hardwareStatus?.batteryVoltage;

  // Demo motion simulation: active trackers cycle motion naturally for demonstration
  const [demoMoving, setDemoMoving] = useState(false);
  const [active3DKeys, setActive3DKeys] = useAtom(active3DTrackerKeysAtom);
  const trackerKey = tracker.trackerId
    ? `${tracker.trackerId.deviceId?.id ?? device?.id?.id ?? 'd'}:${tracker.trackerId.trackerNum ?? 0}`
    : `${tracker.info?.bodyPart ?? 'unknown'}`;
  const show3D = active3DKeys.includes(trackerKey);

  const toggle3D = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActive3DKeys((prev) =>
      prev.includes(trackerKey)
        ? prev.filter((k) => k !== trackerKey)
        : [...prev, trackerKey]
    );
  };

  useEffect(() => {
    if (
      !isDemo ||
      tracker.status === TrackerStatusEnum.DISCONNECTED ||
      (batteryPct != null && batteryPct <= 0)
    ) {
      setDemoMoving(false);
      return;
    }

    const offset = (Number(tracker.trackerId?.deviceId?.id ?? 1) * 700) % 3500;
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const timeoutId = setTimeout(() => {
      if (!isMounted) return;
      intervalId = setInterval(() => {
        if (!isMounted) return;
        setDemoMoving(true);
        setTimeout(() => {
          if (isMounted) setDemoMoving(false);
        }, 2400);
      }, 4400);
    }, offset);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isDemo, tracker.status, tracker.trackerId?.deviceId?.id, batteryPct]);

  const isMoving = velocity > 0.18 || demoMoving;
  const isDisconnected = tracker.status === TrackerStatusEnum.DISCONNECTED;

  const ping = device?.hardwareStatus?.ping;

  // Format top-right window tag: show 0% when offline/dead, exact % when connected
  let tag = 'Active';
  if (isDisconnected) {
    tag = '0%';
  } else if (batteryPct != null) {
    tag = `${Math.round(batteryPct)}%`;
  } else if (batteryVoltage != null && batteryVoltage > 0) {
    tag = `${batteryVoltage.toFixed(1)}V`;
  }

  // Format subtitle description: voltage, ping latency, and connection status
  const descItems: string[] = [];
  if (batteryVoltage != null && batteryVoltage > 0) {
    descItems.push(`${batteryVoltage.toFixed(1)}V`);
  }
  if (isDisconnected) {
    descItems.push('Sensor offline');
  } else {
    if (ping != null && ping > 0) {
      descItems.push(`${ping}ms ping`);
    }
    descItems.push('Connected · Steady');
  }

  const getBallColors = (): [string, string, string] => {
    if (isDisconnected || batteryPct == null) {
      return isDisconnected
        ? ['bg-[#8E8E93]', 'bg-[#8E8E93]', 'bg-[#8E8E93]']
        : ['bg-[#28C840]', 'bg-[#28C840]', 'bg-[#28C840]'];
    }
    if (batteryPct >= 90)
      return ['bg-[#28C840]', 'bg-[#28C840]', 'bg-[#28C840]'];
    if (batteryPct >= 80)
      return ['bg-[#28C840]', 'bg-[#28C840]', 'bg-[#FEBC2E]'];
    if (batteryPct >= 60)
      return ['bg-[#28C840]', 'bg-[#28C840]', 'bg-[#FF5F56]'];
    if (batteryPct >= 40)
      return ['bg-[#28C840]', 'bg-[#FEBC2E]', 'bg-[#FF5F56]'];
    if (batteryPct >= 20)
      return ['bg-[#FEBC2E]', 'bg-[#FF5F56]', 'bg-[#FF5F56]'];
    if (batteryPct > 0) return ['bg-[#FF5F56]', 'bg-[#FF5F56]', 'bg-[#FF5F56]'];
    return ['bg-[#8B1E1E]', 'bg-[#8B1E1E]', 'bg-[#8B1E1E]'];
  };

  const [ball1, ball2, ball3] = getBallColors();

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const origin: CardMorphOrigin = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      borderRadius:
        window.getComputedStyle(e.currentTarget).borderRadius || '12px',
      trackerIdKey: `${device?.id?.id ?? 'dev'}_${tracker.trackerId?.trackerNum ?? 0}`,
    };
    onClick?.(origin);
  };

  return (
    <div
      onClick={handleCardClick}
      className={classNames(
        'home-tracker-card group relative flex flex-col rounded-[12px] overflow-hidden bg-white dark:bg-[#1B1915] border transition-[border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer select-none hover:-translate-y-0.5 active:scale-[0.985] active:duration-150',
        isMoving
          ? 'border-[#D97757] animate-tracker-motion'
          : 'border-black/[0.08] dark:border-white/[0.08] hover:border-black/[0.2] dark:hover:border-white/[0.2] shadow-xs hover:shadow-lg'
      )}
    >
      {/* Card Header Banner with Mock Window & Contour Lines */}
      <div className="home-tracker-card__banner relative h-30 sm:h-32 w-full bg-[#F4F1E8] dark:bg-[#14120F] border-b border-black/[0.06] dark:border-white/[0.06] overflow-hidden flex flex-col justify-between p-2.5 select-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
        {/* Subtle Curved Topographic Contours with Motion Dynamic Waves */}
        <svg
          className={classNames(
            'tracker-accent-stroke tracker-card-contours absolute inset-0 w-full h-full pointer-events-none stroke-[#D97757] transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
            show3D ? 'opacity-0' : isMoving ? 'opacity-40' : 'opacity-20'
          )}
          viewBox="0 0 300 120"
          fill="none"
        >
          <path
            d="M-20 20 C 60 80, 140 -20, 220 50 C 260 90, 310 30, 340 70"
            strokeWidth="1.2"
          >
            <animate
              attributeName="d"
              dur="8s"
              repeatCount="indefinite"
              values="M-20 20 C 60 80, 140 -20, 220 50 C 260 90, 310 30, 340 70;M-20 28 C 60 48, 140 14, 220 62 C 260 102, 310 16, 340 58;M-20 20 C 60 80, 140 -20, 220 50 C 260 90, 310 30, 340 70"
            />
          </path>
          <path
            d="M-30 60 C 50 110, 130 10, 210 80 C 250 110, 300 60, 330 90"
            strokeWidth="1"
            opacity="0.6"
          >
            <animate
              attributeName="d"
              dur="10s"
              begin="-3s"
              repeatCount="indefinite"
              values="M-30 60 C 50 110, 130 10, 210 80 C 250 110, 300 60, 330 90;M-30 52 C 50 86, 130 30, 210 96 C 250 116, 300 44, 330 78;M-30 60 C 50 110, 130 10, 210 80 C 250 110, 300 60, 330 90"
            />
          </path>
          <path
            d="M-10 -10 C 70 40, 150 -50, 230 20 C 270 50, 320 0, 350 40"
            strokeWidth="0.8"
            opacity="0.4"
          >
            <animate
              attributeName="d"
              dur="12s"
              begin="-6s"
              repeatCount="indefinite"
              values="M-10 -10 C 70 40, 150 -50, 230 20 C 270 50, 320 0, 350 40;M-10 -2 C 70 18, 150 -26, 230 32 C 270 68, 320 -14, 350 28;M-10 -10 C 70 40, 150 -50, 230 20 C 270 50, 320 0, 350 40"
            />
          </path>
        </svg>

        {/* Card controls */}
        <div className="relative z-10 flex items-center justify-between">
          <div
            className="flex items-center gap-1.5"
            title={
              isDisconnected
                ? 'Disconnected'
                : batteryPct != null
                  ? `Battery: ${Math.round(batteryPct)}%`
                  : 'Active'
            }
          >
            <span
              className={classNames(
                'w-2 h-2 rounded-full transition-colors duration-300',
                ball1
              )}
            />
            <span
              className={classNames(
                'w-2 h-2 rounded-full transition-colors duration-300',
                ball2
              )}
            />
            <span
              className={classNames(
                'w-2 h-2 rounded-full transition-colors duration-300',
                ball3
              )}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggle3D}
              className={classNames(
                'px-1.5 py-0.5 rounded text-[9.5px] font-mono font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.95] cursor-pointer select-none flex items-center gap-1 border',
                show3D
                  ? 'tracker-accent-fill bg-[#D97757] border-[#D97757] text-white shadow-xs'
                  : 'bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] border-black/[0.08] dark:border-white/[0.08] text-background-30 hover:text-background-10'
              )}
              title={show3D ? 'Hide 3D realtime view' : 'Show 3D realtime view'}
            >
              <svg
                className="w-3 h-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <span>3D</span>
            </button>
            <span className="text-[10px] font-mono font-medium text-background-30 tracking-wide">
              {tag}
            </span>
          </div>
        </div>

        {/* Main Graphic / 3D Realtime IMU Render Area */}
        <div className="relative z-10 w-full flex-grow flex items-center overflow-hidden">
          {show3D ? (
            <div className="w-full h-full flex items-center justify-between">
              {/* Tracker body icon shifted smoothly to the left */}
              <div
                className={classNames(
                  'tracker-accent shrink-0 pl-1.5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] text-[#D97757] fill-[#D97757]',
                  isMoving
                    ? 'scale-[1.05] drop-shadow-[0_2px_8px_rgba(217,119,87,0.35)]'
                    : 'opacity-85'
                )}
              >
                <BodyPartIcon bodyPart={tracker.info?.bodyPart} width={34} />
              </div>

              {/* Realtime 3D Render filling the remaining ~80% of the banner */}
              <div className="flex-grow h-full w-full relative flex items-center justify-center pointer-events-none">
                <CardIMUVisualizer tracker={tracker} height={105} />
              </div>
            </div>
          ) : (
            /* Centered Graphic Icon - Limb Silhouette with Movement Pulse */
            <div
              className={classNames(
                'tracker-accent w-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] text-[#D97757] fill-[#D97757]',
                isMoving
                  ? 'scale-[1.06] -translate-y-0.5 drop-shadow-[0_2px_10px_rgba(217,119,87,0.35)]'
                  : 'group-hover:scale-105'
              )}
            >
              <BodyPartIcon bodyPart={tracker.info?.bodyPart} width={46} />
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-grow justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-serif text-[14.5px] sm:text-[15px] font-normal tracking-tight transition-colors truncate text-background-10 group-hover:text-accent-background-20">
              {trackerName}
            </h3>
            {isDisconnected ? (
              <span className="px-1.5 py-0.5 rounded-[5px] text-[9.5px] font-mono font-medium uppercase shrink-0 bg-black/[0.04] dark:bg-white/[0.04] text-background-40 border border-black/[0.06] dark:border-white/[0.06]">
                Offline
              </span>
            ) : (
              <span
                className={classNames(
                  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] text-[10.5px] font-mono font-medium shrink-0 border transition-colors',
                  ping == null || ping <= 40
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : ping <= 90
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                )}
                title={ping != null ? `Ping latency: ${ping}ms` : 'Connected'}
              >
                <span
                  className={classNames(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    ping == null || ping <= 40
                      ? 'bg-emerald-500'
                      : ping <= 90
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                  )}
                />
                {ping != null ? `${ping}ms` : 'Connected'}
              </span>
            )}
          </div>
          <p className="mt-1 text-[11.5px] leading-snug text-background-30 font-sans truncate">
            {descItems.join(' · ')}
          </p>
        </div>
      </div>
    </div>
  );
}

const FULL_HERO_TITLE = 'Welcome to SirJameSlimeVR';

function ExpandedHeroBanner({
  showSidebar,
  isCollapsed = false,
}: {
  showSidebar?: boolean;
  isCollapsed?: boolean;
}) {
  const [logoVisible, setLogoVisible] = useState(false);
  const [typedChars, setTypedChars] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [descVisible, setDescVisible] = useState(false);
  const [btn1Visible, setBtn1Visible] = useState(false);
  const [btn2Visible, setBtn2Visible] = useState(false);

  useEffect(() => {
    if (!isCollapsed) {
      setLogoVisible(true);
      setTypedChars(FULL_HERO_TITLE.length);
      setCursorVisible(false);
      setDescVisible(true);
      setBtn1Visible(true);
      setBtn2Visible(true);
      return;
    }

    const closeResetTimer = setTimeout(() => {
      setLogoVisible(false);
      setTypedChars(0);
      setCursorVisible(false);
      setDescVisible(false);
      setBtn1Visible(false);
      setBtn2Visible(false);
    }, 500);

    return () => clearTimeout(closeResetTimer);
  }, [isCollapsed]);

  return (
    <div
      className={classNames(
        'relative w-full flex flex-col items-center justify-center text-center liquid-glass-tab-panel',
        showSidebar ? 'py-8 sm:py-10 px-4' : 'py-12 sm:py-16 px-6'
      )}
    >
      {/* Subtle Background Blueprint Gridlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-15 animate-grid-drift"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(140, 130, 118, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(140, 130, 118, 0.12) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Gently Breathing Plain SlimeVR Logo - No Pill, No Glow */}
      <div
        className={classNames(
          'relative z-10 mb-4 flex items-center justify-center transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]',
          logoVisible
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-90 pointer-events-none'
        )}
      >
        <div className="animate-slime-breathe flex items-center justify-center">
          <SlimeVRIcon
            width={48}
            height={28}
            className="home-accent home-hero-logo"
          />
        </div>
      </div>

      {/* Editorial Serif Heading with Terminal Typing Animation */}
      <h1 className="relative z-10 font-serif text-[30px] sm:text-[36px] font-normal tracking-tight text-background-10 max-w-[680px] min-h-[44px] flex items-center justify-center">
        <span>{FULL_HERO_TITLE.slice(0, typedChars)}</span>
        {cursorVisible && (
          <span
            className="home-accent-fill inline-block w-[3px] sm:w-[3.5px] h-[0.78em] bg-[#D97757] ml-1.5 align-middle animate-terminal-cursor select-none rounded-[0.5px]"
            aria-hidden="true"
          />
        )}
      </h1>

      {/* Editorial Subtitle with Smooth Fade-in */}
      <p
        className={classNames(
          'relative z-10 mt-2.5 text-[13.5px] sm:text-[14px] text-background-30 max-w-[540px] leading-relaxed font-sans transition-all duration-700 ease-out',
          descVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-2 pointer-events-none'
        )}
      >
        Real-time full-body tracking server for VR. Stream low-latency spatial
        motion to VRChat, SteamVR, and standalone headsets with precision.
      </p>

      {/* Action Buttons: 1-by-1 Staggered Entrance */}
      <div className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-2.5">
        <NavLink
          to="/onboarding/trackers-assign"
          className={classNames(
            'px-4 py-2 rounded-[8px] bg-[#14120E] text-[#FAF9F5] dark:bg-[#FAF9F5] dark:text-[#14120E] font-medium text-[13px] hover:opacity-90 shadow-sm transition-all duration-500 ease-out active:scale-[0.98] select-none',
            btn1Visible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2.5 pointer-events-none'
          )}
        >
          Assign Trackers
        </NavLink>
        <NavLink
          to="/settings/trackers"
          className={classNames(
            'px-4 py-2 rounded-[8px] bg-[#EBE8DF] hover:bg-[#DFDBD0] text-[#14120E] dark:bg-[#262421] dark:hover:bg-[#322F2B] dark:text-[#FAF9F5] border border-black/[0.08] dark:border-white/[0.08] font-medium text-[13px] transition-all duration-500 ease-out active:scale-[0.98] select-none',
            btn2Visible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2.5 pointer-events-none'
          )}
        >
          All settings
        </NavLink>
      </div>
    </div>
  );
}

export function HomeEmptyState({
  viewSwitchKey = null,
  cardLayoutTransitionKey = null,
  suppressGridEntrance = false,
}: {
  viewSwitchKey?: number | null;
  cardLayoutTransitionKey?: number | null;
  suppressGridEntrance?: boolean;
}) {
  const { isConnected } = useWebsocketAPI();
  const assignedTrackers = useAtomValue(assignedTrackersAtom);
  const unassignedTrackers = useAtomValue(unassignedTrackersAtom);
  const demoMode = useAtomValue(demoModeAtom);
  const hasRealTrackers = useAtomValue(hasRealTrackersAtom);
  const showSidebar = useAtomValue(showSidebarAtom);
  const [, toggleDemoMode] = useAtom(toggleDemoModeAtom);
  const allTrackers = [...assignedTrackers, ...unassignedTrackers];
  const navigate = useNavigate();
  const cardLayoutTransitionSeen = useRef(cardLayoutTransitionKey != null);
  if (cardLayoutTransitionKey != null) {
    cardLayoutTransitionSeen.current = true;
  }

  const heroTabAnim = useSidebarPushAnimation(2);
  const trackersTabAnim = useSidebarPushAnimation(3);
  const cardTransitionKey =
    cardLayoutTransitionKey ??
    (trackersTabAnim.animKey > 0 ? trackersTabAnim.animKey : null);

  const [showGuide, setShowGuide] = useState(() => {
    const saved = localStorage.getItem('slimevr-show-tracker-guide');
    return saved !== null ? saved === 'true' : true;
  });

  const [isHeroCollapsed, setIsHeroCollapsed] = useState(true);
  const heroPanel = useCollapsibleHeight(!isHeroCollapsed);

  const toggleHeroCollapse = () => {
    setIsHeroCollapsed((prev) => !prev);
  };

  const toggleGuide = () => {
    setShowGuide((prev) => {
      const next = !prev;
      localStorage.setItem('slimevr-show-tracker-guide', String(next));
      return next;
    });
  };

  const [, setCardMorphOrigin] = useAtom(cardMorphOriginAtom);

  const [growingCard, setGrowingCard] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
    borderRadius: string;
    phase: 'start' | 'expanding';
  } | null>(null);

  const sendToSettings = (tracker: TrackerDataT, origin?: CardMorphOrigin) => {
    if (origin) {
      setCardMorphOrigin(origin);
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (prefersReducedMotion || !origin) {
      navigate(
        `/tracker/${tracker.trackerId?.trackerNum}/${tracker.trackerId?.deviceId?.id}`
      );
      return;
    }

    setGrowingCard({
      top: origin.top,
      left: origin.left,
      width: origin.width,
      height: origin.height,
      borderRadius: origin.borderRadius || '12px',
      phase: 'start',
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setGrowingCard((prev) =>
          prev
            ? {
                ...prev,
                top: 0,
                left: 0,
                width: window.innerWidth,
                height: window.innerHeight,
                borderRadius: '0px',
                phase: 'expanding',
              }
            : null
        );
      });
    });

    setTimeout(() => {
      navigate(
        `/tracker/${tracker.trackerId?.trackerNum}/${tracker.trackerId?.deviceId?.id}`
      );
    }, 280);

    setTimeout(() => {
      setGrowingCard(null);
    }, 450);
  };

  const toolsCards = [
    {
      title: 'Tracker Assignment',
      description:
        'Map and assign IMU sensors to limbs. Supports lower-body, core, and 10+ full-body sets with instant live previews.',
      to: '/onboarding/trackers-assign',
      tag: 'body.ts',
      icon: (
        <svg
          className="w-9 h-9 stroke-[#D97757]"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="4" r="2.5" />
          <path d="M12 7v7" />
          <path d="M9 10l3-1 3 1" />
          <path d="M9 20l3-6 3 6" />
          <circle cx="12" cy="7.5" r="1" fill="#D97757" />
          <circle cx="9" cy="20" r="1" fill="#D97757" />
          <circle cx="15" cy="20" r="1" fill="#D97757" />
        </svg>
      ),
    },
    {
      title: 'Wi-Fi Provisioning',
      description:
        'Pair wireless trackers over your local 2.4GHz network with fast UDP broadcast discovery and IP diagnostics.',
      to: '/onboarding/wifi-creds',
      tag: 'wifi.config',
      icon: (
        <svg
          className="w-9 h-9 stroke-[#D97757]"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <circle cx="12" cy="20" r="1.5" fill="#D97757" />
        </svg>
      ),
    },
    {
      title: 'Mounting Calibration',
      description:
        'Calibrate physical IMU sensor yaw, roll, and pitch orientations for natural avatar pose kinematics.',
      to: '/onboarding/mounting/choose',
      tag: 'imu.align',
      icon: (
        <svg
          className="w-9 h-9 stroke-[#D97757]"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="8" />
          <line x1="12" y1="4" x2="12" y2="8" />
          <line x1="12" y1="16" x2="12" y2="20" />
          <line x1="4" y1="12" x2="8" y2="12" />
          <line x1="16" y1="12" x2="20" y2="12" />
          <circle cx="12" cy="12" r="2.5" fill="#D97757" />
        </svg>
      ),
    },
    {
      title: 'Body Proportions',
      description:
        'Fine-tune torso, limb lengths, and foot measurements manually or calibrate automatically using AutoBone AI.',
      to: '/onboarding/body-proportions/auto',
      tag: 'autobone.calc',
      icon: (
        <svg
          className="w-9 h-9 stroke-[#D97757]"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12h20" />
          <path d="M6 7v10" />
          <path d="M12 5v14" />
          <path d="M18 7v10" />
          <circle cx="12" cy="5" r="1.5" fill="#D97757" />
          <circle cx="12" cy="19" r="1.5" fill="#D97757" />
        </svg>
      ),
    },
    {
      title: 'Quest & VRChat OSC',
      description:
        'Direct low-latency spatial motion streaming to Meta Quest standalone headset or SteamVR PC over port 9000.',
      to: '/settings/osc/vrchat',
      tag: 'osc.stream',
      icon: (
        <svg
          className="w-9 h-9 stroke-[#D97757]"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="7" width="18" height="10" rx="3" />
          <circle cx="8.5" cy="12" r="2" />
          <circle cx="15.5" cy="12" r="2" />
          <path d="M11 12h2" />
        </svg>
      ),
    },
    {
      title: 'Serial Diagnostics',
      description:
        'Inspect real-time sensor packets, flash tracker firmware over USB, and monitor developer console logs.',
      to: '/settings/serial',
      tag: 'tty.usb',
      icon: (
        <svg
          className="w-9 h-9 stroke-[#D97757]"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
          <circle cx="17" cy="7" r="1.5" fill="#D97757" />
        </svg>
      ),
    },
  ];

  const viewContentMotion = (depth: number): React.CSSProperties | undefined =>
    viewSwitchKey == null
      ? undefined
      : ({
          '--view-content-amp': Math.pow(0.72, depth).toFixed(3),
          '--view-content-delay': `${depth * 45}ms`,
        } as React.CSSProperties);

  return (
    <div className="home-workspace w-full flex-grow flex flex-col select-none min-h-full">
      {/* SPLIT 1: Top Hero Section with Apple Liquid Glass Collapsible Banner */}
      <div
        style={heroTabAnim.style}
        className={classNames(
          'w-full flex flex-col select-none liquid-glass-tab-strip',
          heroTabAnim.className
        )}
      >
        <div
          role="button"
          tabIndex={0}
          aria-expanded={!isHeroCollapsed}
          aria-controls="hero-introduction"
          onClick={toggleHeroCollapse}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggleHeroCollapse();
            }
          }}
          className={classNames(
            'w-full py-2.5 flex items-center justify-between cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D97757]/60',
            showSidebar ? 'px-3.5 sm:px-4' : 'px-4 sm:px-6'
          )}
          title={isHeroCollapsed ? 'Open introduction' : 'Close introduction'}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-nowrap overflow-hidden">
            <div className="animate-slime-breathe flex items-center shrink-0">
              <SlimeVRIcon
                width={22}
                height={13}
                className="home-accent block shrink-0"
              />
            </div>
            <span className="font-serif text-[13.5px] text-background-10 font-normal whitespace-nowrap shrink-0">
              SirJamesSlimeVR
            </span>
            <span
              className={classNames(
                'text-[11px] text-background-30 whitespace-nowrap truncate',
                showSidebar ? 'hidden md:inline' : 'hidden sm:inline'
              )}
            >
              · Real-time full-body tracking
            </span>
          </div>
        </div>

        {/* Collapsible Expanded Hero Content with Cinematic Liquid Glass Animation */}
        <div
          id="hero-introduction"
          ref={heroPanel.ref}
          style={heroPanel.style}
          onTransitionEnd={heroPanel.onTransitionEnd}
          className={classNames(
            'collapsible-tab-grid',
            !isHeroCollapsed
              ? 'collapsible-tab-grid-expanded'
              : 'collapsible-tab-grid-collapsed'
          )}
        >
          <div className="overflow-hidden min-h-0 border-t border-white/[0.025]">
            <div className="collapsible-tab-content">
              <ExpandedHeroBanner
                showSidebar={showSidebar}
                isCollapsed={isHeroCollapsed}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SPLIT 2: Trackers Cards Grid Section (Deeper Obsidian Surface extending to screen bottom) */}
      <div
        className={classNames(
          'home-tracker-surface w-full flex-grow min-h-full flex flex-col justify-between items-center bg-[#EFECE2] dark:bg-[#12110E]',
          showSidebar ? 'py-6 sm:py-10 px-3.5 sm:px-4' : 'py-10 sm:py-14 px-6'
        )}
      >
        <div className="w-full max-w-[980px] flex flex-col items-center">
          {/* Section Heading: "Trackers" with Live Count and Demo Switch */}
          <div
            style={{
              ...trackersTabAnim.style,
              ...viewContentMotion(0),
            }}
            className={classNames(
              'w-full max-w-[980px] mb-6 flex items-end justify-between',
              viewSwitchKey != null && 'animate-view-content-settle',
              trackersTabAnim.className
            )}
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-[22px] sm:text-[24px] font-normal tracking-tight text-background-10">
                  Trackers
                </h2>
                {demoMode && !hasRealTrackers && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wide bg-[#D97757]/15 text-[#D97757] border border-[#D97757]/30 animate-pulse">
                    DEMO MODE
                  </span>
                )}
              </div>
              {allTrackers.length > 0 && (
                <span className="text-[12px] font-mono font-medium text-background-30 mt-0.5">
                  {allTrackers.length} Active
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {!hasRealTrackers && (
                <>
                  {!demoMode && (
                    <button
                      type="button"
                      onClick={toggleGuide}
                      className={classNames(
                        'text-[11.5px] px-2.5 py-1 rounded-md border transition-all cursor-pointer select-none font-medium flex items-center gap-1.5',
                        showGuide
                          ? 'bg-[#D97757]/15 border-[#D97757]/40 text-[#D97757]'
                          : 'bg-black/[0.04] dark:bg-white/[0.04] border-black/[0.08] dark:border-white/[0.08] text-background-30 hover:text-background-10'
                      )}
                      title={
                        showGuide
                          ? 'Hide tracker connecting guide'
                          : 'Show tracker connecting guide'
                      }
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>Guide</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={toggleDemoMode}
                    className={classNames(
                      'text-[11.5px] px-2.5 py-1 rounded-md border transition-all cursor-pointer select-none font-medium',
                      demoMode
                        ? 'bg-[#D97757]/15 border-[#D97757]/40 text-[#D97757]'
                        : 'bg-black/[0.04] dark:bg-white/[0.04] border-black/[0.08] dark:border-white/[0.08] text-background-30 hover:text-background-10'
                    )}
                    title="Toggle simulated tracker demo mode"
                  >
                    {demoMode ? 'Exit Demo' : 'Simulate Demo Trackers'}
                  </button>
                </>
              )}
            </div>
          </div>

          {allTrackers.length > 0 ? (
            /* Live Connected Trackers Rendered As Claude Window Cards */
            <div
              className={classNames(
                'grid gap-5 sm:gap-6 w-full max-w-[980px]',
                'grid-cols-2'
              )}
            >
              {allTrackers.map(({ tracker, device }, idx) => {
                const cols = 2;
                const col = idx % cols;
                const row = Math.floor(idx / cols);

                const isCardLayoutTransition = cardTransitionKey != null;
                const suppressInitialEntrance =
                  suppressGridEntrance || cardLayoutTransitionSeen.current;
                const animClass = isCardLayoutTransition
                  ? 'animate-tracker-layout-enter'
                  : suppressInitialEntrance
                    ? ''
                    : 'animate-tracker-grid-enter';
                const animStyle: React.CSSProperties = {
                  '--tracker-bounce': Math.pow(0.78, row).toFixed(3),
                  animationDelay: isCardLayoutTransition
                    ? '0ms'
                    : `${row * 80 + col * 35}ms`,
                } as React.CSSProperties;

                return (
                  <div
                    key={`${device?.id?.id ?? 'dev'}_${tracker.trackerId?.trackerNum ?? idx}_${idx}_${cardTransitionKey ?? 'initial'}`}
                    style={animStyle}
                    className={classNames('w-full', animClass)}
                  >
                    <ClaudeTrackerWindowCard
                      tracker={tracker}
                      device={device}
                      onClick={(origin) => sendToSettings(tracker, origin)}
                    />
                  </div>
                );
              })}
            </div>
          ) : showGuide ? (
            /* 0 Trackers Connected State: Setup Tools Grid Guide */
            <>
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 max-w-[980px] w-full text-left"
                style={viewContentMotion(1)}
              >
                <p className="text-[13px] text-background-30 font-sans">
                  No trackers currently connected. Turn on your trackers nearby,
                  activate{' '}
                  <button
                    type="button"
                    onClick={toggleDemoMode}
                    className="text-[#D97757] underline font-medium cursor-pointer"
                  >
                    Demo Mode
                  </button>{' '}
                  to simulate connected hardware, or use the setup tools below:
                </p>
              </div>
              <div
                className={classNames(
                  'grid gap-5 sm:gap-6 w-full max-w-[980px]',
                  'grid-cols-2'
                )}
              >
                {toolsCards.map((card, idx) => {
                  const cols = 2;
                  const col = idx % cols;
                  const row = Math.floor(idx / cols);

                  const isCardLayoutTransition = cardTransitionKey != null;
                  const suppressInitialEntrance =
                    suppressGridEntrance || cardLayoutTransitionSeen.current;
                  const animClass: string | undefined = isCardLayoutTransition
                    ? 'animate-tracker-layout-enter'
                    : suppressInitialEntrance
                      ? undefined
                      : 'animate-tracker-grid-enter';
                  const animStyle: React.CSSProperties | undefined =
                    isCardLayoutTransition
                      ? ({
                          '--tracker-bounce': Math.pow(0.78, row).toFixed(3),
                          animationDelay: '0ms',
                        } as React.CSSProperties)
                      : suppressInitialEntrance
                        ? undefined
                        : ({
                            '--tracker-bounce': Math.pow(0.78, row).toFixed(3),
                            animationDelay: `${row * 80 + col * 35}ms`,
                          } as React.CSSProperties);

                  return (
                    <NavLink
                      key={`${card.title}_${cardTransitionKey ?? 'initial'}`}
                      to={card.to}
                      style={animStyle}
                      className={classNames(
                        'home-tracker-card group flex flex-col rounded-[12px] overflow-hidden bg-white dark:bg-[#1B1915] border border-black/[0.08] dark:border-white/[0.08] hover:border-black/[0.2] dark:hover:border-white/[0.2] shadow-xs hover:shadow-lg transition-[border-color,box-shadow,transform] duration-200 cursor-pointer hover:-translate-y-0.5',
                        animClass
                      )}
                    >
                      {/* Card Header Banner with Mock Window & Contour Lines */}
                      <div className="home-tracker-card__banner relative h-24 sm:h-25 w-full bg-[#F4F1E8] dark:bg-[#14120F] border-b border-black/[0.06] dark:border-white/[0.06] overflow-hidden flex flex-col justify-between p-2.5 select-none">
                        {/* Subtle Curved Topographic Contours */}
                        <svg
                          className="guide-card-contours absolute inset-0 w-full h-full opacity-[0.38] pointer-events-none stroke-[#D97757]"
                          viewBox="0 0 300 120"
                          fill="none"
                        >
                          <path
                            d="M-20 20 C 60 80, 140 -20, 220 50 C 260 90, 310 30, 340 70"
                            strokeWidth="1.2"
                          >
                            <animate
                              attributeName="d"
                              dur="8s"
                              repeatCount="indefinite"
                              values="M-20 20 C 60 80, 140 -20, 220 50 C 260 90, 310 30, 340 70;M-20 28 C 60 48, 140 14, 220 62 C 260 102, 310 16, 340 58;M-20 20 C 60 80, 140 -20, 220 50 C 260 90, 310 30, 340 70"
                            />
                          </path>
                          <path
                            d="M-30 60 C 50 110, 130 10, 210 80 C 250 110, 300 60, 330 90"
                            strokeWidth="1"
                            opacity="0.6"
                          >
                            <animate
                              attributeName="d"
                              dur="10s"
                              begin="-3s"
                              repeatCount="indefinite"
                              values="M-30 60 C 50 110, 130 10, 210 80 C 250 110, 300 60, 330 90;M-30 52 C 50 86, 130 30, 210 96 C 250 116, 300 44, 330 78;M-30 60 C 50 110, 130 10, 210 80 C 250 110, 300 60, 330 90"
                            />
                          </path>
                          <path
                            d="M-10 -10 C 70 40, 150 -50, 230 20 C 270 50, 320 0, 350 40"
                            strokeWidth="0.8"
                            opacity="0.4"
                          >
                            <animate
                              attributeName="d"
                              dur="12s"
                              begin="-6s"
                              repeatCount="indefinite"
                              values="M-10 -10 C 70 40, 150 -50, 230 20 C 270 50, 320 0, 350 40;M-10 -2 C 70 18, 150 -26, 230 32 C 270 68, 320 -14, 350 28;M-10 -10 C 70 40, 150 -50, 230 20 C 270 50, 320 0, 350 40"
                            />
                          </path>
                        </svg>

                        {/* Card tag */}
                        <div className="relative z-10 flex items-center justify-end">
                          <span className="text-[10px] font-mono font-medium text-background-30 tracking-wide">
                            {card.tag}
                          </span>
                        </div>

                        {/* Centered Graphic Icon */}
                        <div className="relative z-10 flex items-center justify-center flex-grow group-hover:scale-110 transition-transform duration-200">
                          {card.icon}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-3 sm:p-3.5 flex flex-col flex-grow justify-between">
                        <div>
                          <h3 className="font-serif text-[14.5px] sm:text-[15px] font-normal tracking-tight text-background-10 group-hover:text-accent-background-20 transition-colors truncate">
                            {card.title}
                          </h3>
                          <p className="mt-1 text-[11.5px] leading-snug text-background-30 font-sans line-clamp-2">
                            {card.description}
                          </p>
                        </div>
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            </>
          ) : (
            /* Clean Canvas Mode: Calm, Uncluttered Workspace Ready for Incoming Trackers */
            <div className="relative overflow-hidden w-full max-w-[980px] py-16 sm:py-20 px-6 rounded-[14px] border border-dashed border-black/[0.12] dark:border-white/[0.1] bg-black/[0.015] dark:bg-white/[0.015] flex flex-col items-center justify-center text-center select-none transition-all">
              {/* Double Heartbeat Beacon with SlimeVR Logo */}
              <div className="relative mb-4 flex items-center justify-center">
                {/* Full-window ethereal ripple shockwaves (strictly clipped inside dashed window) */}
                <span
                  className="absolute w-28 h-28 rounded-full border border-[#D97757]/10 dark:border-[#D97757]/15 pointer-events-none animate-heartbeat-window-wave-1"
                  aria-hidden="true"
                />
                <span
                  className="absolute w-28 h-28 rounded-full border border-[#D97757]/8 dark:border-[#D97757]/12 pointer-events-none animate-heartbeat-window-wave-2"
                  aria-hidden="true"
                />

                {/* Double Heartbeat Ping Rings */}
                <span
                  className="absolute w-12 h-12 rounded-full bg-[#D97757]/15 dark:bg-[#D97757]/18 border border-[#D97757]/20 dark:border-[#D97757]/25 pointer-events-none animate-heartbeat-ping-1"
                  aria-hidden="true"
                />
                <span
                  className="absolute w-12 h-12 rounded-full bg-[#D97757]/10 dark:bg-[#D97757]/14 border border-[#D97757]/15 dark:border-[#D97757]/20 pointer-events-none animate-heartbeat-ping-2"
                  aria-hidden="true"
                />
                <span className="relative w-11 h-11 rounded-full bg-[#D97757]/10 dark:bg-[#D97757]/20 border border-[#D97757]/30 flex items-center justify-center text-[#D97757] animate-heartbeat-badge">
                  <svg
                    width="22"
                    height="14"
                    viewBox="0 0 49 29"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-[#D97757]"
                  >
                    <path
                      d="M2 26.996C10.44 25.59 29.16 23.1571 46.509 26.9091C46.509 26.9091 48.89 -0.199966 35.761 2.14503"
                      stroke="currentColor"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M7.52161 15.0107L12.3649 9.20459L17.5044 13.9572"
                      stroke="currentColor"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M27.9463 14.1436L33.7269 9.27075L37.9592 14.846"
                      stroke="currentColor"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M15.5684 27.2709C18.4755 26.4347 20.8185 25.6874 22.6541 23.4164C24.4415 25.6388 26.6174 26.48 29.7418 27.2555"
                      stroke="currentColor"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </div>

              <h3 className="font-serif text-[18px] sm:text-[19px] font-normal text-background-10 tracking-tight animate-heartbeat-text-1">
                Waiting for Tracker
              </h3>
              <p className="mt-2 text-[12.5px] sm:text-[13px] text-background-30 max-w-[380px] leading-relaxed font-sans animate-heartbeat-text-2">
                Power on your trackers nearby to connect.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Server Status Bar */}
        <div className="w-full max-w-[980px] mt-auto pt-8 pb-2 flex items-center justify-between border-t border-black/[0.08] dark:border-white/[0.06] text-[11.5px] text-background-30 font-medium">
          <div className="flex items-center gap-2">
            <span
              className={classNames(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-[#30D158]' : 'bg-[#FF453A]'
              )}
            />
            <span>
              {isConnected
                ? 'Server Online · Standalone OSC Ready'
                : 'Server Offline'}
            </span>
          </div>
        </div>
      </div>

      {growingCard && (
        <div
          className="fixed pointer-events-none z-[9999] will-change-[top,left,width,height,border-radius,box-shadow]"
          style={{
            top: growingCard.top,
            left: growingCard.left,
            width: growingCard.width,
            height: growingCard.height,
            borderRadius: growingCard.borderRadius,
            backgroundColor: 'rgb(var(--background-80))',
            boxShadow:
              growingCard.phase === 'start'
                ? '0 12px 36px rgba(0, 0, 0, 0.22)'
                : '0 0 0 rgba(0, 0, 0, 0)',
            transition:
              growingCard.phase === 'expanding'
                ? 'top 320ms cubic-bezier(0.2, 0.95, 0.3, 1), left 320ms cubic-bezier(0.2, 0.95, 0.3, 1), width 320ms cubic-bezier(0.2, 0.95, 0.3, 1), height 320ms cubic-bezier(0.2, 0.95, 0.3, 1), border-radius 320ms cubic-bezier(0.2, 0.95, 0.3, 1), box-shadow 320ms cubic-bezier(0.2, 0.95, 0.3, 1)'
                : 'none',
          }}
        />
      )}
    </div>
  );
}

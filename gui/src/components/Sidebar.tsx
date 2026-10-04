import { useTrackingChecklist } from '@/hooks/tracking-checklist';
import { TrackingChecklist } from './tracking-checklist/TrackingChecklist';
import {
  PreviewContext,
  SkeletonVisualizerWidget,
} from './widgets/SkeletonVisualizerWidget';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { Typography } from './commons/Typography';
import { useLocaleConfig } from '@/i18n/config';
import { useWebsocketAPI } from '@/hooks/websocket-api';
import {
  RpcMessage,
  SkeletonConfigRequestT,
  SkeletonConfigResponseT,
} from 'solarxr-protocol';
import { Tooltip } from './commons/Tooltip';
import { Vector3 } from 'three';
import { RecordIcon } from './commons/icon/RecordIcon';
import { PauseIcon } from './commons/icon/PauseIcon';
import { HumanIcon } from './commons/icon/HumanIcon';
import { EyeIcon } from './commons/icon/EyeIcon';
import { useConfig } from '@/hooks/config';
import { useBHV } from '@/hooks/bvh';
import { usePauseTracking } from '@/hooks/pause-tracking';
import { PlayIcon } from './commons/icon/PlayIcon';
import { Rotate360Icon } from './commons/icon/Rotate360Icon';
import { useLocalization } from '@fluent/react';

export function PreviewControls({
  open,
  isOrbiting = false,
  onToggleOrbit,
}: {
  open: boolean;
  isOrbiting?: boolean;
  onToggleOrbit?: () => void;
}) {
  const [userHeight, setUserHeight] = useState('');
  const { l10n } = useLocalization();
  const { currentLocales } = useLocaleConfig();
  const { useRPCPacket, sendRPCPacket } = useWebsocketAPI();

  const {
    state: bvhState,
    toggle: toggleBVH,
    available: bvhAvailable,
  } = useBHV();
  const { paused, toggle: toggleTracking } = usePauseTracking();

  const { cmFormat } = useMemo(() => {
    const cmFormat = Intl.NumberFormat(currentLocales, {
      style: 'unit',
      unit: 'centimeter',
      maximumFractionDigits: 1,
    });
    return { cmFormat };
  }, [currentLocales]);
  useRPCPacket(
    RpcMessage.SkeletonConfigResponse,
    (data: SkeletonConfigResponseT) => {
      if (data.userHeight)
        setUserHeight(cmFormat.format((data.userHeight * 100) / 0.936));
    }
  );

  useEffect(() => {
    sendRPCPacket(
      RpcMessage.SkeletonConfigRequest,
      new SkeletonConfigRequestT()
    );
  }, []);

  return (
    <>
      <Tooltip
        preferedDirection="bottom"
        content={
          <Typography id="onboarding-manual_proportions-estimated_height" />
        }
      >
        <div
          className={classNames(
            'h-10 bg-background-60 p-4 flex items-center rounded-lg justify-center cursor-help w-fit top-2 left-2 absolute',
            {
              'opacity-0': !open,
              'opacity-100': open,
            }
          )}
        >
          <Typography variant="section-title">{userHeight}</Typography>
        </div>
      </Tooltip>
      <div className="absolute bottom-0 w-full px-2 pb-3 flex justify-center">
        <div className="flex max-w-full flex-wrap justify-center bg-background-80 bg-opacity-70 rounded-lg gap-1 px-2 py-1.5 items-center fill-background-10">
          {bvhAvailable && (
            <button
              type="button"
              aria-label={l10n.getString(
                bvhState === 'idle'
                  ? 'bvh-start_recording'
                  : 'bvh-stop_recording'
              )}
              aria-pressed={bvhState !== 'idle'}
              title={l10n.getString(
                bvhState === 'idle'
                  ? 'bvh-start_recording'
                  : 'bvh-stop_recording'
              )}
              className={classNames(
                'flex min-h-10 items-center justify-center gap-1.5 rounded-full px-2.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-background-20',
                bvhState !== 'idle'
                  ? 'bg-status-critical/20 text-status-critical'
                  : 'hover:bg-background-60'
              )}
              onClick={() => toggleBVH()}
            >
              {bvhState === 'idle' && <RecordIcon width={17} />}
              {bvhState !== 'idle' && (
                <div className="w-3.5 h-3.5 rounded-full bg-status-critical animate-pulse" />
              )}
              <span>
                {l10n.getString(
                  bvhState === 'idle'
                    ? 'bvh-start_recording'
                    : 'bvh-stop_recording'
                )}
              </span>
            </button>
          )}
          <button
            type="button"
            aria-label={l10n.getString(
              paused ? 'tracking-paused' : 'tracking-unpaused'
            )}
            aria-pressed={paused}
            title={l10n.getString(
              paused ? 'tracking-paused' : 'tracking-unpaused'
            )}
            className={classNames(
              'flex min-h-10 items-center justify-center gap-1.5 rounded-full px-2.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-background-20',
              paused
                ? 'bg-accent-background-20/20 text-accent-background-10'
                : 'bg-background-60 hover:bg-background-50'
            )}
            onClick={() => toggleTracking()}
          >
            {!paused && <PauseIcon width={19} />}
            {paused && <PlayIcon width={19} />}
            <span>
              {l10n.getString(paused ? 'tracking-paused' : 'tracking-unpaused')}
            </span>
          </button>
          {onToggleOrbit && (
            <button
              type="button"
              aria-label={l10n.getString(
                isOrbiting ? 'preview-auto_orbit_stop' : 'preview-auto_orbit'
              )}
              aria-pressed={isOrbiting}
              title={l10n.getString(
                isOrbiting ? 'preview-auto_orbit_stop' : 'preview-auto_orbit'
              )}
              className={classNames(
                'flex min-h-10 items-center justify-center gap-1.5 rounded-full px-2.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-background-20',
                isOrbiting
                  ? 'bg-accent-background-20/20 text-accent-background-10'
                  : 'hover:bg-background-60 text-background-10'
              )}
              onClick={() => onToggleOrbit()}
            >
              <div
                className={classNames('flex items-center justify-center', {
                  'animate-[spin_4s_linear_infinite]': isOrbiting,
                })}
              >
                <Rotate360Icon width={17} />
              </div>
              <span>
                {l10n.getString(
                  isOrbiting ? 'preview-auto_orbit_stop' : 'preview-auto_orbit'
                )}
              </span>
            </button>
          )}
          <button
            type="button"
            disabled
            aria-label={l10n.getString('preview-mocap_mode_soon')}
            title={l10n.getString('preview-mocap_mode_soon')}
            className="flex min-h-10 items-center justify-center rounded-full px-2.5 text-background-40 opacity-60 cursor-not-allowed"
          >
            <HumanIcon width={17} />
          </button>
        </div>
      </div>
    </>
  );
}

function PreviewSection({
  open,
  onResetPreviewWidth,
}: {
  open: boolean;
  onResetPreviewWidth?: () => void;
}) {
  const { l10n } = useLocalization();
  const { config, setConfig } = useConfig();
  const [renderDisabled, setRenderDisabled] = useState(
    !config?.skeletonPreview
  );
  const disabledRender = renderDisabled || !open;
  const [isOrbiting, setIsOrbiting] = useState(false);
  const previewContextRef = useRef<PreviewContext | null>(null);

  const toggleRender = () => {
    setConfig({ skeletonPreview: renderDisabled });
  };

  const handleToggleOrbit = () => {
    if (!previewContextRef.current) return;
    const newState = previewContextRef.current.toggleAutoOrbit();
    setIsOrbiting(newState);
  };

  useLayoutEffect(() => {
    // need useLayoutEffect to make sure that the state is corect before the first render of the skeleton
    setRenderDisabled(!config?.skeletonPreview);
  }, [config]);

  return (
    <div
      className={classNames(
        'transition-opacity duration-500 delay-500 h-full relative',
        {
          'opacity-0': !open,
          'opacity-100': open,
        }
      )}
    >
      <SkeletonVisualizerWidget
        disabled={disabledRender}
        toggleDisabled={() => toggleRender()}
        onInit={(context) => {
          previewContextRef.current = context;
          context.addView({
            left: 0,
            bottom: 0,
            width: 1,
            height: 1,
            position: new Vector3(3, 2.5, -3),
            onHeightChange(v, newHeight) {
              v.controls.target.set(0, newHeight / 2.2, 0.1);
              const scale = Math.max(1, newHeight) / 1.3;
              v.camera.zoom = 1 / scale;
            },
          });
        }}
      />
      <div className="absolute right-2 top-2 z-20 flex items-center gap-1">
        <button
          type="button"
          aria-label={l10n.getString(
            renderDisabled ? 'preview-enable_render' : 'preview-disable_render'
          )}
          aria-pressed={!renderDisabled}
          title={l10n.getString(
            renderDisabled ? 'preview-enable_render' : 'preview-disable_render'
          )}
          className="flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-full bg-background-60 fill-background-10 hover:bg-background-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-background-20"
          onClick={() => toggleRender()}
        >
          <EyeIcon width={18} closed={!renderDisabled} />
        </button>
        {onResetPreviewWidth && (
          <button
            type="button"
            aria-label={l10n.getString('home-reset-preview-width')}
            title={l10n.getString('home-reset-preview-width')}
            className="flex min-h-9 min-w-9 items-center justify-center rounded-full bg-background-60 text-background-20 transition-colors hover:bg-background-50 hover:text-background-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-background-20"
            onClick={onResetPreviewWidth}
          >
            <Rotate360Icon width={16} />
          </button>
        )}
      </div>
      <PreviewControls
        open={open}
        isOrbiting={isOrbiting}
        onToggleOrbit={handleToggleOrbit}
      />
    </div>
  );
}

export function Sidebar({
  onResetPreviewWidth,
}: {
  onResetPreviewWidth?: () => void;
}) {
  const { completion } = useTrackingChecklist();
  const [closed, setClosed] = useState(true);
  const [closing, setClosing] = useState(false);

  const closedHight = '90px';
  const checklistSize = closed ? closedHight : 'calc(100% - 16px)';
  const previewSize = closed ? `calc(100% - ${closedHight} - 24px)` : '0%';

  const toggleClosed = () => setClosed((closed) => !closed);

  useLayoutEffect(() => {
    setClosing(true);
    const ref = setTimeout(() => setClosing(false), 1000);
    return () => {
      clearTimeout(ref);
      setClosing(false);
    };
  }, [closed]);

  useEffect(() => {
    if (completion === 'complete') {
      setClosed(true);
    } else if (completion === 'incomplete') {
      setClosed(false);
    }
  }, [completion]);

  return (
    <div
      className="flex h-full min-h-0 flex-col px-1"
      aria-label="Skeleton detail drawer"
    >
      <div
        className="transition-[height] duration-500 rounded-xl mb-1 glass-panel overflow-clip border border-white/10"
        style={{ height: checklistSize }}
      >
        <TrackingChecklist
          closed={closed}
          closing={closing}
          toggleClosed={toggleClosed}
        />
      </div>
      <div
        className="transition-[height] duration-500 rounded-xl my-1 glass-panel overflow-clip border border-white/10 min-h-0"
        style={{ height: previewSize }}
      >
        <PreviewSection
          open={closed}
          onResetPreviewWidth={onResetPreviewWidth}
        />
      </div>
    </div>
  );
}

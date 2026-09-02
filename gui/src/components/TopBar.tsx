import { ReactNode, useContext, useEffect, useState } from 'react';
import { NavLink, useMatch } from 'react-router-dom';
import {
  RpcMessage,
  ServerInfosRequestT,
  ServerInfosResponseT,
  TrackerStatus,
} from 'solarxr-protocol';
import { useWebsocketAPI } from '@/hooks/websocket-api';
import { CloseIcon } from './commons/icon/CloseIcon';
import { MaximiseIcon } from './commons/icon/MaximiseIcon';
import { MinimiseIcon } from './commons/icon/MinimiseIcon';
import { SlimeVRIcon } from './commons/icon/SimevrIcon';
import { ProgressBar } from './commons/ProgressBar';
import { Typography } from './commons/Typography';
import { DownloadIcon } from './commons/icon/DownloadIcon';
import { DOCS_SITE, GH_REPO, VersionContext } from '@/App';
import classNames from 'classnames';
import { useBreakpoint } from '@/hooks/breakpoint';
import { TrackersStillOnModal } from './TrackersStillOnModal';
import { useConfig } from '@/hooks/config';
import { TrayOrExitModal } from './TrayOrExitModal';
import { useAtomValue } from 'jotai';
import { connectedIMUTrackersAtom } from '@/store/app-store';
import { useElectron } from '@/hooks/electron';
import { openUrl } from '@/hooks/crossplatform';
import { HomeIcon } from './commons/icon/HomeIcon';
import { HumanIcon } from './commons/icon/HumanIcon';
import { SkiIcon } from './commons/icon/SkiIcon';
import { RulerIcon } from './commons/icon/RulerIcon';
import { WifiIcon } from './commons/icon/WifiIcon';
import { GearIcon } from './commons/icon/GearIcon';
import { Tooltip } from './commons/Tooltip';
import { useLocalization } from '@fluent/react';
import { useOperatingMode } from '@/hooks/operating-mode';

export function VersionTag() {
  return (
    <div
      style={{ WebkitAppRegion: 'no-drag' } as any}
      className={classNames(
        'flex items-center justify-center text-[11px] font-mono font-medium',
        'text-background-20 hover:text-background-10 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg',
        'px-2.5 py-0.5 select-text cursor-pointer transition-colors shadow-sm'
      )}
      onClick={() => {
        const url = `https://github.com/${GH_REPO}/releases`;
        openUrl(url);
      }}
    >
      {(__VERSION_TAG__ || __COMMIT_HASH__) + (__GIT_CLEAN__ ? '' : '-dirty')}
    </div>
  );
}

function TopBarNavButton({
  to,
  children,
  match,
  state = {},
  icon,
}: {
  to: string;
  children: ReactNode;
  match?: string;
  state?: any;
  icon: ReactNode;
}) {
  const doesMatch = useMatch({
    path: match || to,
  });

  return (
    <Tooltip
      preferedDirection="bottom"
      spacing={6}
      content={<Typography className="text-[11.5px] font-medium whitespace-nowrap">{children}</Typography>}
    >
      <NavLink
        to={to}
        state={state}
        style={{ WebkitAppRegion: 'no-drag' } as any}
        className={classNames(
          'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-[0.92] select-none cursor-pointer',
          {
            'bg-accent-background-30 text-white shadow-sm border border-accent-background-20/40':
              doesMatch,
            'hover:bg-white/15 text-background-20 hover:text-background-10 border border-transparent':
              !doesMatch,
          }
        )}
      >
        <div
          className={classNames('scale-95 flex items-center justify-center transition-colors', {
            'fill-white text-white': doesMatch,
            'fill-background-30 text-background-30 group-hover:text-background-10': !doesMatch,
          })}
        >
          {icon}
        </div>
      </NavLink>
    </Tooltip>
  );
}

export function TopBarNav() {
  const { l10n } = useLocalization();

  return (
    <div
      style={{ WebkitAppRegion: 'no-drag' } as any}
      className="flex items-center gap-1 p-0.5 rounded-xl bg-background-70/70 border border-white/10 shadow-inner"
    >
      <TopBarNavButton to="/" icon={<HomeIcon />}>
        {l10n.getString('navbar-home')}
      </TopBarNavButton>
      <TopBarNavButton
        to="/onboarding/trackers-assign"
        state={{ alonePage: true }}
        icon={<HumanIcon />}
      >
        {l10n.getString('navbar-trackers_assign')}
      </TopBarNavButton>
      <TopBarNavButton
        to="/onboarding/mounting/choose"
        match="/onboarding/mounting/*"
        state={{ alonePage: true }}
        icon={<SkiIcon />}
      >
        {l10n.getString('navbar-mounting')}
      </TopBarNavButton>
      <TopBarNavButton
        to="/onboarding/body-proportions/scaled"
        match="/onboarding/body-proportions/*"
        state={{ alonePage: true }}
        icon={<RulerIcon />}
      >
        {l10n.getString('navbar-body_proportions')}
      </TopBarNavButton>
      <TopBarNavButton
        to="/onboarding/wifi-creds"
        icon={<WifiIcon value={1} disabled variant="navbar" />}
        state={{ alonePage: true }}
      >
        {l10n.getString('navbar-connect_trackers')}
      </TopBarNavButton>
      <div className="w-[1px] h-3.5 bg-background-50/40 mx-0.5" />
      <TopBarNavButton
        to="/settings/trackers"
        match="/settings/*"
        state={{ scrollTo: 'steamvr' }}
        icon={<GearIcon />}
      >
        {l10n.getString('navbar-settings')}
      </TopBarNavButton>
    </div>
  );
}

export function TopBar({
  progress,
}: {
  children?: ReactNode;
  progress?: number;
}) {
  const electron = useElectron();
  const { isMobile } = useBreakpoint('mobile');
  const { useRPCPacket, sendRPCPacket } = useWebsocketAPI();
  const connectedIMUTrackers = useAtomValue(connectedIMUTrackersAtom);
  const { config, setConfig, saveConfig } = useConfig();
  const { isQuestStandalone, toggleMode } = useOperatingMode();
  const version = useContext(VersionContext);
  const [localIp, setLocalIp] = useState<string | null>(null);
  const [showTrayOrExitModal, setShowTrayOrExitModal] = useState(false);
  const [showConnectedTrackersWarning, setConnectedTrackerWarning] =
    useState(false);

  const closeApp = async () => {
    if (!electron.isElectron) return;
    await saveConfig();
    electron.api.close();
  };

  const tryCloseApp = async (dontTray = false) => {
    if (!electron.isElectron) throw 'no electron';

    if (config?.useTray === null) {
      setShowTrayOrExitModal(true);
      return;
    }

    if (config?.useTray && !dontTray) {
      electron.api.hide();
    } else if (
      config?.connectedTrackersWarning &&
      connectedIMUTrackers.filter(
        (t) => t.tracker.status !== TrackerStatus.TIMED_OUT
      ).length > 0
    ) {
      setConnectedTrackerWarning(true);
    } else {
      await closeApp();
    }
  };

  useEffect(() => {
    sendRPCPacket(RpcMessage.ServerInfosRequest, new ServerInfosRequestT());
  }, []);

  useRPCPacket(
    RpcMessage.ServerInfosResponse,
    ({ localIp }: ServerInfosResponseT) => {
      if (localIp) setLocalIp(localIp.toString());
    }
  );

  const isMac =
    (electron.isElectron && electron.data()?.os?.type === 'macos') ||
    (typeof navigator !== 'undefined' && /Mac|Macintosh/i.test(navigator.userAgent));

  return (
    <>
      <div className="flex gap-0 flex-col">
        <div className="h-[2px]" />
        <div
          className={classNames(
            'flex items-center justify-between gap-3 h-[44px] z-40 glass-panel-strong border-b border-background-50/20 px-3 select-none',
            isMac ? 'pl-[108px]' : 'pl-3'
          )}
          style={{ WebkitAppRegion: 'drag' } as any}
          data-electron-drag-region
        >
          {/* Left Brand & Quest IP Area */}
          <div
            className="flex items-center gap-2.5 z-40 shrink-0"
            style={{ WebkitAppRegion: 'drag' } as any}
            data-electron-drag-region
          >
            {!isMobile && (
              <NavLink
                to="/"
                style={{ WebkitAppRegion: 'no-drag' } as any}
                className="flex justify-around flex-col select-none opacity-90 hover:opacity-100 transition-opacity"
              >
                <SlimeVRIcon />
              </NavLink>
            )}
            {!isMobile && (
              <div
                className="flex justify-around flex-col"
                style={{ WebkitAppRegion: 'drag' } as any}
                data-electron-drag-region
              >
                <Typography
                  bold
                  variant="standard"
                  className="font-semibold tracking-tight text-[13px]"
                >
                  SirJame SlimeVR
                </Typography>
              </div>
            )}
            <VersionTag />
            {localIp && (
              <Tooltip
                preferedDirection="bottom"
                spacing={6}
                content={<Typography className="text-[11px] font-medium">Click to copy Quest OSC IP: {localIp}</Typography>}
              >
                <div
                  style={{ WebkitAppRegion: 'no-drag' } as any}
                  className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-accent-background-10 bg-accent-background-30/20 hover:bg-accent-background-30/30 border border-accent-background-20/30 rounded-lg px-2 py-0.5 cursor-pointer transition-colors shadow-sm select-text"
                  onClick={() => {
                    navigator.clipboard.writeText(localIp);
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-background-20 animate-pulse" />
                  <span>{localIp}</span>
                </div>
              </Tooltip>
            )}

            {/* macOS Style Standalone Toggle Switch */}
            <Tooltip
              preferedDirection="bottom"
              spacing={6}
              content={
                <Typography className="text-[11px] font-medium">
                  {isQuestStandalone
                    ? 'Standalone Mode: Enabled (VRChat OSC & OSCQuery)'
                    : 'Standalone Mode: Disabled (SteamVR PCVR)'}
                </Typography>
              }
            >
              <button
                type="button"
                style={{ WebkitAppRegion: 'no-drag' } as any}
                onClick={toggleMode}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg hover:bg-white/10 text-[11.5px] font-medium text-background-10 transition-colors select-none cursor-pointer active:scale-95"
              >
                <span className="font-semibold text-[11.5px] text-background-20">Standalone</span>
                <div
                  className={classNames(
                    'w-6 h-3.5 rounded-full transition-colors relative flex items-center shadow-inner',
                    isQuestStandalone ? 'bg-emerald-500' : 'bg-white/20'
                  )}
                >
                  <div
                    className={classNames(
                      'w-2.5 h-2.5 rounded-full bg-white shadow-sm transition-transform duration-150',
                      isQuestStandalone ? 'translate-x-3' : 'translate-x-0.5'
                    )}
                  />
                </div>
              </button>
            </Tooltip>

            {version && electron.isElectron && (
              <div
                style={{ WebkitAppRegion: 'no-drag' } as any}
                className="cursor-pointer"
                onClick={() => {
                  const url =
                    electron.data().os.type === 'windows'
                      ? 'https://slimevr.dev/download'
                      : `https://github.com/${GH_REPO}/releases/latest`;
                  openUrl(url);
                }}
              >
                <DownloadIcon />
              </div>
            )}
          </div>

          {/* Center Navigation Switcher (Desktop - Compact Icon Segment surrounded by draggable space) */}
          {!isMobile && (
            <div
              className="flex items-center justify-center flex-grow h-full z-40"
              style={{ WebkitAppRegion: 'drag' } as any}
              data-electron-drag-region
            >
              <TopBarNav />
            </div>
          )}

          {/* Right Window Controls (Windows / Linux) */}
          <div
            className="flex justify-end items-center px-1 gap-1.5 z-40 shrink-0 h-full"
            style={{ WebkitAppRegion: 'drag' } as any}
            data-electron-drag-region
          >
            {electron.isElectron && !isMac && (
              <div style={{ WebkitAppRegion: 'no-drag' } as any} className="flex items-center gap-1">
                <div
                  className="flex items-center justify-center hover:bg-background-60 rounded-full w-7 h-7 cursor-pointer"
                  onClick={() => electron.api.minimize()}
                >
                  <MinimiseIcon />
                </div>
                <div
                  className="flex items-center justify-center hover:bg-background-60 rounded-full w-7 h-7 cursor-pointer"
                  onClick={() => electron.api.toggleMaximize()}
                >
                  <MaximiseIcon />
                </div>
                <div
                  className="flex items-center justify-center hover:bg-background-60 rounded-full w-7 h-7 cursor-pointer"
                  onClick={() => tryCloseApp()}
                >
                  <CloseIcon />
                </div>
              </div>
            )}
          </div>
        </div>
        {isMobile && progress !== undefined && (
          <div className="flex gap-2 px-2 h-6 mb-2 justify-center flex-col border-b border-accent-background-30">
            <ProgressBar progress={progress} height={3} parts={3} />
          </div>
        )}
      </div>
      {electron.isElectron && (
        <TrayOrExitModal
          isOpen={showTrayOrExitModal}
          accept={async (useTray) => {
            await setConfig({ useTray });
            setShowTrayOrExitModal(false);

            // Doing this in here just in case config doesn't get updated in time
            if (useTray) {
              electron.api.minimize();
              // await invoke('update_tray_text');
            } else if (
              config?.connectedTrackersWarning &&
              connectedIMUTrackers.filter(
                (t) => t.tracker.status !== TrackerStatus.TIMED_OUT
              ).length > 0
            ) {
              setConnectedTrackerWarning(true);
            } else {
              await closeApp();
            }
          }}
          cancel={() => setShowTrayOrExitModal(false)}
        />
      )}
      <TrackersStillOnModal
        isOpen={showConnectedTrackersWarning}
        accept={() => closeApp()}
        cancel={() => {
          setConnectedTrackerWarning(false);
        }}
      />
    </>
  );
}

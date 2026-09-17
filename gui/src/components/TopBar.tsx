import {
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  FormEvent,
} from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  RpcMessage,
  ServerInfosRequestT,
  ServerInfosResponseT,
  ChangeSettingsRequestT,
  SettingsRequestT,
  SettingsResponseT,
  VRCOSCSettingsT,
  OSCSettingsT,
  HeartbeatRequestT,
  TrackerStatus as TrackerStatusEnum,
  BodyPart,
} from 'solarxr-protocol';
import { useWebsocketAPI } from '@/hooks/websocket-api';
import { CloseIcon } from './commons/icon/CloseIcon';
import { MaximiseIcon } from './commons/icon/MaximiseIcon';
import { MinimiseIcon } from './commons/icon/MinimiseIcon';
import { SlimeVRIcon } from './commons/icon/SimevrIcon';
import { ProgressBar } from './commons/ProgressBar';
import { Typography } from './commons/Typography';
import { DownloadIcon } from './commons/icon/DownloadIcon';
import { GH_REPO, VersionContext } from '@/App';
import classNames from 'classnames';
import { useBreakpoint } from '@/hooks/breakpoint';
import { TrackersStillOnModal } from './TrackersStillOnModal';
import { useConfig } from '@/hooks/config';
import { TrayOrExitModal } from './TrayOrExitModal';
import { useAtomValue } from 'jotai';
import { connectedIMUCountAtom, flatTrackersAtom } from '@/store/app-store';
import { demoModeAtom } from '@/store/demo-trackers';
import { useElectron } from '@/hooks/electron';
import { openUrl } from '@/hooks/crossplatform';
import { Tooltip } from './commons/Tooltip';
import { useOperatingMode } from '@/hooks/operating-mode';
import { useFakeBpm, BpmPresetId } from '@/hooks/fake-bpm';
import {
  useSpeechDictation,
  SUPPORTED_LANGUAGES,
  DictationFormat,
  DictationActivation,
} from '@/hooks/use-speech-dictation';
import './ChatboxDropdown.scss';

export function QuestTargetIPPill() {
  const { sendRPCPacket, useRPCPacket } = useWebsocketAPI();
  const [questIp, setQuestIp] = useState<string>('192.168.0.106');
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    sendRPCPacket(RpcMessage.SettingsRequest, new SettingsRequestT());
  }, []);

  useRPCPacket(RpcMessage.SettingsResponse, (settings: SettingsResponseT) => {
    if (settings.vrcOsc?.oscSettings?.address) {
      setQuestIp(settings.vrcOsc.oscSettings.address.toString());
    }
  });

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue(questIp);
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const handleSave = () => {
    const trimmed = inputValue.trim();
    if (trimmed && trimmed !== questIp) {
      setQuestIp(trimmed);
      const settings = new ChangeSettingsRequestT();
      const vrcOsc = new VRCOSCSettingsT();
      const oscSettings = new OSCSettingsT();
      oscSettings.enabled = true;
      oscSettings.address = trimmed;
      oscSettings.portOut = 9000;
      oscSettings.portIn = 9001;
      vrcOsc.oscSettings = oscSettings;
      vrcOsc.oscqueryEnabled = true;
      settings.vrcOsc = vrcOsc;
      sendRPCPacket(RpcMessage.ChangeSettingsRequest, settings);

      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div
        style={{ WebkitAppRegion: 'no-drag' } as any}
        className="flex items-center gap-1 bg-background-80 border border-emerald-500/50 rounded-lg px-1.5 py-0.5 shadow-md"
      >
        <span className="text-[10px] uppercase font-bold text-emerald-300">
          Quest:
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="w-28 bg-transparent text-[11px] font-mono font-semibold text-background-10 focus:outline-none border-b border-emerald-400 px-1 py-0"
          placeholder="192.168.0.xxx"
        />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-white font-medium hover:bg-emerald-400 transition-colors cursor-pointer"
        >
          Set
        </button>
      </div>
    );
  }

  return (
    <Tooltip
      preferedDirection="bottom"
      spacing={6}
      content={
        <Typography className="text-[11px] font-medium">
          Click to change Quest / VRChat target network address (Currently:{' '}
          {questIp})
        </Typography>
      }
    >
      <div
        style={{ WebkitAppRegion: 'no-drag' } as any}
        onClick={handleStartEdit}
        className={classNames(
          'apple-interactive flex items-center gap-1.5 text-[11px] tnum font-medium rounded-[8px] px-2.5 py-1 cursor-pointer select-none',
          saved
            ? 'border-emerald-500/40 text-emerald-300'
            : 'text-background-20 hover:text-background-10'
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] shrink-0" />
        <span className="text-[10px] uppercase font-semibold text-background-30 tracking-wide">
          Quest:
        </span>
        <span className="font-medium text-background-10">{questIp}</span>
      </div>
    </Tooltip>
  );
}

export function RefreshTrackersButton() {
  const { sendRPCPacket } = useWebsocketAPI();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (refreshing) return;
    setRefreshing(true);
    sendRPCPacket(RpcMessage.HeartbeatRequest, new HeartbeatRequestT());
    setTimeout(() => {
      setRefreshing(false);
    }, 1200);
  };

  return (
    <Tooltip
      preferedDirection="bottom"
      spacing={6}
      content={
        <Typography className="text-[11px] font-medium">
          Scan for Trackers: Broadcast discovery probe without resetting
          calibrations
        </Typography>
      }
    >
      <button
        type="button"
        style={{ WebkitAppRegion: 'no-drag' } as any}
        onClick={handleRefresh}
        disabled={refreshing}
        className={classNames(
          'apple-interactive flex items-center gap-1.5 text-[11px] tnum font-medium rounded-[8px] px-2.5 py-1 cursor-pointer select-none',
          refreshing
            ? 'border-[#D97757]/50 text-[#EB8E70]'
            : 'text-background-20 hover:text-background-10'
        )}
      >
        <svg
          className={classNames(
            'w-3.5 h-3.5',
            refreshing && 'animate-spin text-[#D97757]'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span>{refreshing ? 'Scanning...' : 'Scan'}</span>
      </button>
    </Tooltip>
  );
}

export function VersionTag() {
  return (
    <div
      style={{ WebkitAppRegion: 'no-drag' } as any}
      className="apple-interactive flex items-center justify-center text-[10px] tnum font-medium text-background-30 hover:text-background-10 rounded-[6px] px-2 py-0.5 select-text cursor-pointer"
      onClick={() => {
        const url = `https://github.com/${GH_REPO}/releases`;
        openUrl(url);
      }}
    >
      {(__VERSION_TAG__ || __COMMIT_HASH__) + (__GIT_CLEAN__ ? '' : '-dirty')}
    </div>
  );
}

function getShortTrackerName(
  name: string | Uint8Array,
  bodyPart?: BodyPart,
  compact = false
): string {
  if (bodyPart != null) {
    switch (bodyPart) {
      case BodyPart.HEAD:
        return 'HMD';
      case BodyPart.NECK:
        return compact ? 'N' : 'Neck';
      case BodyPart.CHEST:
        return compact ? 'Ch' : 'Chest';
      case BodyPart.WAIST:
      case BodyPart.HIP:
        return compact ? 'W' : 'Waist';
      case BodyPart.LEFT_UPPER_LEG:
        return compact ? 'LTh' : 'L-Thigh';
      case BodyPart.RIGHT_UPPER_LEG:
        return compact ? 'RTh' : 'R-Thigh';
      case BodyPart.LEFT_LOWER_LEG:
        return compact ? 'LK' : 'L-Knee';
      case BodyPart.RIGHT_LOWER_LEG:
        return compact ? 'RK' : 'R-Knee';
      case BodyPart.LEFT_FOOT:
        return compact ? 'LF' : 'L-Foot';
      case BodyPart.RIGHT_FOOT:
        return compact ? 'RF' : 'R-Foot';
      case BodyPart.LEFT_LOWER_ARM:
        return compact ? 'LA' : 'L-Arm';
      case BodyPart.RIGHT_LOWER_ARM:
        return compact ? 'RA' : 'R-Arm';
      case BodyPart.LEFT_UPPER_ARM:
        return compact ? 'LS' : 'L-Shldr';
      case BodyPart.RIGHT_UPPER_ARM:
        return compact ? 'RS' : 'R-Shldr';
      case BodyPart.LEFT_HAND:
        return compact ? 'LH' : 'L-Hand';
      case BodyPart.RIGHT_HAND:
        return compact ? 'RH' : 'R-Hand';
    }
  }
  const str = typeof name === 'string' ? name : name.toString();
  const clean = str
    .replace(/\s*Tracker\s*/gi, '')
    .replace(/\s*\/\s*Hip/gi, '')
    .replace(/\s*\(Dead\)/gi, '')
    .replace(/\s*\(Offline\)/gi, '')
    .trim();
  if (compact && clean.length > 5) {
    return clean.slice(0, 4);
  }
  return clean || 'Trk';
}

type BroadcastMode = 'pinned' | 'music' | 'bpm' | 'dictate';

const broadcastModes: BroadcastMode[] = ['dictate', 'pinned', 'music', 'bpm'];

export function ChatboxDropdown({ dock = false }: { dock?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<BroadcastMode>('dictate');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [message, setMessage] = useState('');
  const [sentMessageFeedback, setSentMessageFeedback] = useState(false);
  const fakeBpm = useFakeBpm();
  const [selectedBpmPresetAnim, setSelectedBpmPresetAnim] = useState<{
    id: string;
    key: number;
  } | null>(null);

  const handleBpmPresetClick = (id: BpmPresetId) => {
    fakeBpm.setPresetId(id);
    setSelectedBpmPresetAnim((prev) => ({
      id,
      key: (prev?.key ?? 0) + 1,
    }));
  };
  const [appleMusicInfo, setAppleMusicInfo] = useState<{
    running: boolean;
    playing: boolean;
    track?: string;
    artist?: string;
    album?: string;
    pos?: number;
    dur?: number;
    formatted?: string;
  }>({ running: false, playing: false });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const electron = useElectron();
  const { sendRPCPacket, useRPCPacket } = useWebsocketAPI();

  const [targetIp, setTargetIp] = useState<string>('192.168.0.106');
  const [isEditingIp, setIsEditingIp] = useState(false);
  const [inputIpValue, setInputIpValue] = useState('');

  useEffect(() => {
    sendRPCPacket(RpcMessage.SettingsRequest, new SettingsRequestT());
  }, []);

  useRPCPacket(RpcMessage.SettingsResponse, (settings: SettingsResponseT) => {
    if (settings.vrcOsc?.oscSettings?.address) {
      setTargetIp(settings.vrcOsc.oscSettings.address.toString());
    }
  });

  const saveTargetIp = (newIp: string) => {
    const trimmed = newIp.trim();
    if (trimmed && trimmed !== targetIp) {
      setTargetIp(trimmed);
      const settings = new ChangeSettingsRequestT();
      const vrcOsc = new VRCOSCSettingsT();
      const oscSettings = new OSCSettingsT();
      oscSettings.enabled = true;
      oscSettings.address = trimmed;
      oscSettings.portOut = 9000;
      oscSettings.portIn = 9001;
      vrcOsc.oscSettings = oscSettings;
      vrcOsc.oscqueryEnabled = true;
      settings.vrcOsc = vrcOsc;
      sendRPCPacket(RpcMessage.ChangeSettingsRequest, settings);
    }
    setIsEditingIp(false);
  };

  const {
    floorAnchor,
    setChatboxEnabled,
    setChatboxOnlyMode,
    setChatboxCustomPinnedEnabled,
    setChatboxCustomPinnedText,
    setChatboxAppleMusicEnabled,
    sendChatboxCustomMessage,
  } = useOperatingMode();

  const dictation = useSpeechDictation((msg) => {
    sendChatboxCustomMessage(msg);
  });

  const isDemoMode = useAtomValue(demoModeAtom);
  const flatTrackers = useAtomValue(flatTrackersAtom);

  // Connected active trackers count & list
  const trackerSummaries = useMemo(() => {
    return flatTrackers.map(({ tracker, device }) => {
      const isConnected =
        tracker.status === TrackerStatusEnum.OK ||
        tracker.status === TrackerStatusEnum.BUSY;
      const batteryPct = device?.hardwareStatus?.batteryPctEstimate;
      const batteryVoltage = device?.hardwareStatus?.batteryVoltage;

      let displayBattery = '—';
      if (!isConnected) {
        displayBattery = 'Offline';
      } else if (batteryPct != null) {
        displayBattery = `${Math.round(batteryPct)}%`;
      } else if (batteryVoltage != null && batteryVoltage > 0) {
        displayBattery = `${batteryVoltage.toFixed(1)}V`;
      } else {
        displayBattery = 'Active';
      }

      return {
        id: tracker.trackerId?.trackerNum ?? 0,
        name:
          tracker.info?.customName?.toString() ||
          tracker.info?.displayName?.toString() ||
          'Tracker',
        bodyPart: tracker.info?.bodyPart,
        isConnected,
        batteryPct,
        displayBattery,
      };
    });
  }, [flatTrackers]);

  const connectedCount = trackerSummaries.filter((t) => t.isConnected).length;
  const avgBattery = useMemo(() => {
    const activeWithBattery = trackerSummaries.filter(
      (t) => t.isConnected && t.batteryPct != null
    );
    if (activeWithBattery.length === 0) return null;
    const sum = activeWithBattery.reduce(
      (acc, t) => acc + (t.batteryPct || 0),
      0
    );
    return Math.round(sum / activeWithBattery.length);
  }, [trackerSummaries]);
  const getBatterySummaryText = useCallback(
    (compact = false) => {
      const activeTrackers = trackerSummaries.filter((t) => t.isConnected);
      if (activeTrackers.length === 0) return '';
      const parts = activeTrackers.map((t) => {
        const shortName = getShortTrackerName(t.name, t.bodyPart, compact);
        return `${shortName}:${t.displayBattery}`;
      });
      return `🔋 ${parts.join(' ')}`;
    },
    [trackerSummaries]
  );

  // Poll Apple Music state when in music mode or when streaming is active
  useEffect(() => {
    let isSubscribed = true;
    const pollMusic = async () => {
      if (electron.isElectron && electron.api.getAppleMusic) {
        try {
          const res = await electron.api.getAppleMusic();
          if (isSubscribed) setAppleMusicInfo(res);
        } catch {
          // ignore
        }
      }
    };

    pollMusic();
    const interval = setInterval(pollMusic, 2500);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [electron]);

  // Combined chatbox broadcast message generator
  const getCombinedBroadcastMessage = useCallback(
    (forceIncludeBattery = false) => {
      const stickyEnabled = floorAnchor.chatboxCustomPinnedEnabled;
      const musicEnabled = floorAnchor.chatboxAppleMusicEnabled;
      const batteryEnabled =
        !floorAnchor.chatboxOnlyMode &&
        (floorAnchor.chatboxEnabled || forceIncludeBattery);

      const stickyText = floorAnchor.chatboxCustomPinnedText?.trim();
      const musicText =
        appleMusicInfo.playing && appleMusicInfo.formatted
          ? `♫ ${appleMusicInfo.formatted}`
          : '';
      const bpmText =
        fakeBpm.enabled && fakeBpm.formattedBpmText
          ? fakeBpm.formattedBpmText
          : '';

      const lines: string[] = [];
      if (stickyEnabled && stickyText) {
        lines.push(stickyText);
      }
      if (musicEnabled && musicText) {
        lines.push(musicText);
      }
      if (bpmText) {
        lines.push(bpmText);
      }
      if (batteryEnabled) {
        let battLine = getBatterySummaryText(false);
        const testCombined = [...lines, battLine].filter(Boolean).join('\n');
        if (testCombined.length > 140) {
          battLine = getBatterySummaryText(true);
        }
        if (battLine) {
          lines.push(battLine);
        }
      }

      let result = lines.join('\n');
      if (result.length > 144) {
        result = result.slice(0, 144);
      }
      return result;
    },
    [
      floorAnchor.chatboxCustomPinnedEnabled,
      floorAnchor.chatboxAppleMusicEnabled,
      floorAnchor.chatboxEnabled,
      floorAnchor.chatboxOnlyMode,
      floorAnchor.chatboxCustomPinnedText,
      appleMusicInfo.playing,
      appleMusicInfo.formatted,
      fakeBpm.enabled,
      fakeBpm.formattedBpmText,
      getBatterySummaryText,
    ]
  );

  const lastBroadcastMsgRef = useRef<string>('');
  const broadcastMsgGetterRef = useRef(getCombinedBroadcastMessage);
  broadcastMsgGetterRef.current = getCombinedBroadcastMessage;

  const isBroadcastingActive =
    floorAnchor.chatboxCustomPinnedEnabled ||
    floorAnchor.chatboxAppleMusicEnabled ||
    (!floorAnchor.chatboxOnlyMode && floorAnchor.chatboxEnabled) ||
    fakeBpm.enabled;

  // Single unified periodic broadcaster (adapts interval when BPM active for natural 2-3s cadence)
  useEffect(() => {
    if (!isBroadcastingActive) {
      lastBroadcastMsgRef.current = '';
      return;
    }

    const broadcast = () => {
      const msg = broadcastMsgGetterRef.current();
      if (msg) {
        sendChatboxCustomMessage(msg);
        lastBroadcastMsgRef.current = msg;
      }
    };

    broadcast();
    const intervalMs = fakeBpm.enabled ? 2800 : 5000;
    const timer = setInterval(broadcast, intervalMs);
    return () => clearInterval(timer);
  }, [isBroadcastingActive, fakeBpm.enabled, sendChatboxCustomMessage]);

  // Immediately send updated message when text, track, BPM, or play state changes
  useEffect(() => {
    if (!isBroadcastingActive) return;
    const msg = getCombinedBroadcastMessage();
    if (msg && msg !== lastBroadcastMsgRef.current) {
      sendChatboxCustomMessage(msg);
      lastBroadcastMsgRef.current = msg;
    }
  }, [
    isBroadcastingActive,
    floorAnchor.chatboxCustomPinnedText,
    appleMusicInfo.track,
    appleMusicInfo.playing,
    appleMusicInfo.formatted,
    fakeBpm.formattedBpmText,
    trackerSummaries,
    getCombinedBroadcastMessage,
    sendChatboxCustomMessage,
  ]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSendMessage = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim()) return;

    sendChatboxCustomMessage(message.trim());
    setMessage('');
    setSentMessageFeedback(true);
    setTimeout(() => {
      setSentMessageFeedback(false);
    }, 1800);
  };

  const focusBroadcastTab = (mode: BroadcastMode) => {
    setActiveMode(mode);
    document.getElementById(`broadcast-tab-${mode}`)?.focus();
  };

  const handleBroadcastTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    mode: BroadcastMode
  ) => {
    const currentIndex = broadcastModes.indexOf(mode);
    let nextMode: BroadcastMode | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextMode = broadcastModes[(currentIndex + 1) % broadcastModes.length];
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextMode =
        broadcastModes[
          (currentIndex - 1 + broadcastModes.length) % broadcastModes.length
        ];
    } else if (event.key === 'Home') {
      nextMode = broadcastModes[0];
    } else if (event.key === 'End') {
      nextMode = broadcastModes[broadcastModes.length - 1];
    }

    if (nextMode) {
      event.preventDefault();
      focusBroadcastTab(nextMode);
    }
  };

  return (
    <div
      ref={dropdownRef}
      style={{ WebkitAppRegion: 'no-drag' } as any}
      className={classNames(
        'chatbox-control relative flex items-center',
        dock && 'chatbox-control--dock'
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={classNames(
          dock
            ? 'relative flex min-w-[62px] flex-col items-center justify-center gap-1 rounded-[14px] px-3 py-2 text-[10px] font-medium leading-none tracking-tight transition-[background-color,color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-background-20 focus-visible:ring-offset-2 focus-visible:ring-offset-background-80'
            : 'relative flex items-center gap-1.5 px-2.5 py-1 text-[13.5px] font-semibold tracking-tight rounded-[8px] transition-all select-none cursor-pointer',
          isOpen
            ? dock
              ? 'bg-background-60 text-accent-background-20 shadow-xs'
              : 'bg-[#262421] text-white shadow-xs'
            : floorAnchor.chatboxEnabled
              ? dock
                ? 'text-accent-background-20 hover:bg-background-60/70'
                : 'text-background-10 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
              : dock
                ? 'text-background-30 hover:bg-background-60/70 hover:text-background-10'
                : 'text-background-10/70 hover:text-background-10 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
        )}
        title="VRChat Broadcast & Telemetry HUD"
      >
        {/* Chat bubble icon */}
        <svg
          className={classNames(
            dock ? 'h-6 w-6' : 'h-3.5 w-3.5',
            'opacity-90 stroke-[2.2]'
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>

        <span>Broadcast</span>

        {/* Live broadcasting / Compact Chat-Only indicator */}
        {floorAnchor.chatboxOnlyMode ? (
          dock ? (
            <span
              className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-accent-background-20 animate-pulse"
              title="Chat-Only Mode Active (FBT Trackers Muted)"
            />
          ) : (
            <span
              className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#0A84FF]/25 text-[#5AC8FA] border border-[#0A84FF]/35 tracking-tight leading-none shrink-0"
              title="Chat-Only Mode Active (FBT Trackers Muted)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#5AC8FA] animate-pulse" />
              Only
            </span>
          )
        ) : floorAnchor.chatboxEnabled ||
          floorAnchor.chatboxCustomPinnedEnabled ||
          floorAnchor.chatboxAppleMusicEnabled ||
          fakeBpm.enabled ? (
          <span
            className={classNames(
              'w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse',
              dock && 'absolute right-2.5 top-2'
            )}
            title="Chatbox broadcasting active"
          />
        ) : (
          !dock && (
            <span className="text-[11px] font-bold opacity-80 leading-none transition-transform duration-150 text-background-10/70">
              {isOpen ? '▴' : '⌄'}
            </span>
          )
        )}

        {isOpen && !dock && (
          <span className="absolute bottom-[-6px] left-2.5 right-2.5 h-[2.5px] bg-[#D97757] rounded-full shadow-[0_1px_6px_rgba(217,119,87,0.4)]" />
        )}
      </button>

      {isOpen && (
        <div
          style={{ WebkitAppRegion: 'no-drag' } as any}
          className="chatbox-panel"
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !isEditingIp) {
              setIsOpen(false);
              dropdownRef.current?.querySelector('button')?.focus();
            }
          }}
        >
          {/* Header */}
          <div className="chatbox-header flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="chatbox-title text-[14px] font-semibold text-white tracking-tight">
                Broadcast HUD
              </span>
              <div className="flex items-center gap-1.5 text-[10.5px] whitespace-nowrap">
                <span
                  className={classNames(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    floorAnchor.chatboxOnlyMode
                      ? 'bg-[#5AC8FA] animate-pulse'
                      : floorAnchor.chatboxEnabled || isBroadcastingActive
                        ? 'bg-[#30D158] animate-pulse'
                        : 'bg-white/20'
                  )}
                />
                <span className="text-[#A09E96] font-medium">
                  {floorAnchor.chatboxOnlyMode
                    ? 'Chat Only'
                    : floorAnchor.chatboxEnabled || isBroadcastingActive
                      ? 'Live'
                      : 'Standby'}
                </span>
              </div>
            </div>

            {/* Target IP Pill */}
            <div className="chatbox-target shrink-0">
              {isEditingIp ? (
                <div className="flex items-center gap-1 bg-black/60 border border-[#0A84FF] rounded-md px-1.5 py-0.5 shadow-xs">
                  <input
                    type="text"
                    value={inputIpValue}
                    onChange={(e) => setInputIpValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveTargetIp(inputIpValue);
                      if (e.key === 'Escape') setIsEditingIp(false);
                    }}
                    onBlur={() => saveTargetIp(inputIpValue)}
                    autoFocus
                    placeholder="192.168.0.106"
                    className="w-24 bg-transparent text-white text-[10px] focus:outline-none font-mono"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setInputIpValue(targetIp);
                    setIsEditingIp(true);
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10.5px] bg-white/[0.05] hover:bg-white/[0.1] text-[#A09E96] hover:text-white transition-colors cursor-pointer border border-white/[0.06] whitespace-nowrap"
                  title="Click to edit Quest OSC target IP address"
                >
                  <span className="opacity-60">Target:</span>
                  <span className="font-mono text-white">{targetIp}:9000</span>
                  <span className="text-[9px] opacity-60 ml-0.5">✎</span>
                </button>
              )}
            </div>
          </div>

          {/* Hero Live In-Game Chatbox Bubble Preview */}
          <div className="chatbox-hero-bubble flex flex-col gap-1.5 p-3 rounded-[12px] bg-black/50 border border-white/[0.08] shadow-inner">
            <div className="flex items-center justify-between text-[10px] font-semibold text-[#A09E96]">
              <span className="uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Live In-Game Preview
              </span>
              <span className="font-mono text-[9px] text-[#A09E96]">
                {
                  (
                    getCombinedBroadcastMessage(floorAnchor.chatboxEnabled) ||
                    ''
                  ).length
                }
                /144
              </span>
            </div>
            <div className="text-[12px] font-mono text-white whitespace-pre-wrap break-words bg-black/40 p-2.5 rounded-[8px] border border-white/[0.06] min-h-[44px] flex items-center">
              {getCombinedBroadcastMessage(floorAnchor.chatboxEnabled) || (
                <span className="text-[#66645E] italic text-[11px]">
                  No broadcast active (Speak in Voice mode, or enable Sticky /
                  Music / BPM)
                </span>
              )}
            </div>
          </div>

          {/* Four peer broadcast modes: tabs, not action buttons. */}
          <div
            className="chatbox-tabs flex p-1 bg-black/40 border border-white/[0.08] rounded-[10px] gap-1"
            role="tablist"
            aria-orientation="horizontal"
            aria-label="Broadcast modes"
          >
            <button
              type="button"
              id="broadcast-tab-dictate"
              role="tab"
              aria-controls="broadcast-panel-dictate"
              aria-selected={activeMode === 'dictate'}
              tabIndex={activeMode === 'dictate' ? 0 : -1}
              onKeyDown={(event) => handleBroadcastTabKeyDown(event, 'dictate')}
              onClick={() => setActiveMode('dictate')}
              className={classNames(
                'flex-1 py-1.5 rounded-[7px] text-[11.5px] font-medium transition-all select-none cursor-pointer text-center flex items-center justify-center gap-1.5',
                activeMode === 'dictate'
                  ? 'bg-white/[0.12] text-white shadow-xs'
                  : 'text-[#A09E96] hover:text-white'
              )}
            >
              <span>Voice</span>
              {dictation.isListening && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-pulse" />
              )}
            </button>
            <button
              type="button"
              id="broadcast-tab-pinned"
              role="tab"
              aria-controls="broadcast-panel-pinned"
              aria-selected={activeMode === 'pinned'}
              tabIndex={activeMode === 'pinned' ? 0 : -1}
              onKeyDown={(event) => handleBroadcastTabKeyDown(event, 'pinned')}
              onClick={() => setActiveMode('pinned')}
              className={classNames(
                'flex-1 py-1.5 rounded-[7px] text-[11.5px] font-medium transition-all select-none cursor-pointer text-center flex items-center justify-center gap-1.5',
                activeMode === 'pinned'
                  ? 'bg-white/[0.12] text-white shadow-xs'
                  : 'text-[#A09E96] hover:text-white'
              )}
            >
              <span>Sticky</span>
              {floorAnchor.chatboxCustomPinnedEnabled && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]" />
              )}
            </button>
            <button
              type="button"
              id="broadcast-tab-music"
              role="tab"
              aria-controls="broadcast-panel-music"
              aria-selected={activeMode === 'music'}
              tabIndex={activeMode === 'music' ? 0 : -1}
              onKeyDown={(event) => handleBroadcastTabKeyDown(event, 'music')}
              onClick={() => setActiveMode('music')}
              className={classNames(
                'flex-1 py-1.5 rounded-[7px] text-[11.5px] font-medium transition-all select-none cursor-pointer text-center flex items-center justify-center gap-1.5',
                activeMode === 'music'
                  ? 'bg-white/[0.12] text-white shadow-xs'
                  : 'text-[#A09E96] hover:text-white'
              )}
            >
              <span>Music</span>
              {floorAnchor.chatboxAppleMusicEnabled && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
              )}
            </button>
            <button
              type="button"
              id="broadcast-tab-bpm"
              role="tab"
              aria-controls="broadcast-panel-bpm"
              aria-selected={activeMode === 'bpm'}
              tabIndex={activeMode === 'bpm' ? 0 : -1}
              onKeyDown={(event) => handleBroadcastTabKeyDown(event, 'bpm')}
              onClick={() => setActiveMode('bpm')}
              className={classNames(
                'flex-1 py-1.5 rounded-[7px] text-[11.5px] font-medium transition-all select-none cursor-pointer text-center flex items-center justify-center gap-1.5',
                activeMode === 'bpm'
                  ? 'bg-white/[0.12] text-white shadow-xs'
                  : 'text-[#A09E96] hover:text-white'
              )}
            >
              <span>BPM</span>
              {fakeBpm.enabled && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] animate-pulse" />
              )}
            </button>
          </div>

          {/* Active Mode Panes */}

          {/* Mode 1: Voice Dictation & Real-Time Translation */}
          {activeMode === 'dictate' && (
            <div
              id="broadcast-panel-dictate"
              role="tabpanel"
              aria-labelledby="broadcast-tab-dictate"
              className="chatbox-mode flex flex-col gap-2.5"
            >
              {/* Cloud Engine Header Badge */}
              <div className="chatbox-engine flex items-center justify-between p-2 rounded-[8px] bg-[#0A84FF]/10 border border-[#0A84FF]/25">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0A84FF] shadow-xs animate-pulse" />
                  <span className="text-[11.5px] font-semibold text-white">
                    Cloud Whisper Engine
                  </span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded font-semibold bg-[#0A84FF]/20 text-[#5AC8FA] border border-[#0A84FF]/30">
                  Whisper v3 Turbo
                </span>
              </div>

              {/* Cloud API Key Drawer */}
              <div className="chatbox-key-card p-2.5 rounded-[10px] bg-black/40 border border-white/[0.08] flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="uppercase font-semibold text-[#A09E96] tracking-wide">
                    Groq API Key
                  </span>
                  <button
                    type="button"
                    onClick={() => openUrl('https://console.groq.com/keys')}
                    className="text-[#0A84FF] hover:underline cursor-pointer font-medium"
                  >
                    Get Free Key
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type={showApiKeyInput ? 'text' : 'password'}
                    value={dictation.settings.groqApiKey}
                    onChange={(e) => dictation.setGroqApiKey(e.target.value)}
                    placeholder="gsk_..."
                    className="flex-grow px-2.5 py-1 rounded-[7px] bg-black/60 border border-[#484640] text-white text-[11px] font-mono focus:outline-none focus:border-[#0A84FF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                    className="px-2.5 py-1 rounded-[7px] bg-white/[0.06] hover:bg-white/[0.1] text-[10.5px] text-[#C4C2BC] cursor-pointer"
                  >
                    {showApiKeyInput ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Apple Inset Settings Group */}
              <div className="chatbox-settings-group rounded-[10px] bg-black/40 border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
                {/* Row 1: Microphone Input Device */}
                <div className="flex items-center justify-between p-2.5">
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-[11.5px] font-medium text-white truncate">
                      Microphone
                    </span>
                    <span className="text-[9.5px] text-[#A09E96] truncate">
                      Audio input source
                    </span>
                  </div>
                  <select
                    value={dictation.settings.inputDeviceId || 'default'}
                    onChange={(e) => dictation.setInputDeviceId(e.target.value)}
                    onFocus={() => dictation.refreshDevices()}
                    className="bg-black/60 text-white border border-[#484640] rounded-[7px] px-2.5 py-1 text-[11px] focus:outline-none focus:border-[#0A84FF] cursor-pointer max-w-[190px] truncate"
                  >
                    <option value="default">Default Microphone</option>
                    {dictation.availableDevices.map((dev) => (
                      <option key={dev.deviceId} value={dev.deviceId}>
                        {dev.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row 2: Target Language */}
                <div className="flex items-center justify-between p-2.5">
                  <div className="flex flex-col">
                    <span className="text-[11.5px] font-medium text-white">
                      Translate Speech
                    </span>
                    <span className="text-[9.5px] text-[#A09E96]">
                      Target output language
                    </span>
                  </div>
                  <select
                    value={dictation.settings.targetLanguage}
                    onChange={(e) =>
                      dictation.setTargetLanguage(e.target.value)
                    }
                    className="bg-black/60 text-white border border-[#484640] rounded-[7px] px-2.5 py-1 text-[11px] focus:outline-none focus:border-[#0A84FF] cursor-pointer"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row 2: Format & Activation */}
                <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
                  <div className="flex flex-col gap-1 p-2.5">
                    <span className="text-[9.5px] uppercase font-semibold text-[#A09E96] tracking-wide">
                      Format
                    </span>
                    <select
                      value={dictation.settings.format}
                      onChange={(e) =>
                        dictation.setFormat(e.target.value as DictationFormat)
                      }
                      className="bg-black/60 text-white border border-[#484640] rounded-[6px] px-2 py-1 text-[10.5px] focus:outline-none focus:border-[#0A84FF] cursor-pointer"
                    >
                      <option value="translation_only">Translation Only</option>
                      <option value="bilingual">Bilingual</option>
                      <option value="original_only">Original Voice</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 p-2.5">
                    <span className="text-[9.5px] uppercase font-semibold text-[#A09E96] tracking-wide">
                      Activation
                    </span>
                    <select
                      value={dictation.settings.activationMode}
                      onChange={(e) =>
                        dictation.setActivationMode(
                          e.target.value as DictationActivation
                        )
                      }
                      className="bg-black/60 text-white border border-[#484640] rounded-[6px] px-2 py-1 text-[10.5px] focus:outline-none focus:border-[#0A84FF] cursor-pointer"
                    >
                      <option value="toggle">Toggle (Click)</option>
                      <option value="ptt">Push-to-Talk</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Auto-Send Switch */}
                <div className="flex items-center justify-between p-2.5">
                  <div className="flex flex-col">
                    <span className="text-[11.5px] font-medium text-white">
                      Auto-Send to Chatbox
                    </span>
                    <span className="text-[9.5px] text-[#A09E96]">
                      Broadcasts automatically on voice pause
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={dictation.settings.autoSend}
                    onClick={() =>
                      dictation.setAutoSend(!dictation.settings.autoSend)
                    }
                    className={classNames(
                      'ios-switch w-[34px] h-[18px] rounded-full p-[2px] transition-colors duration-200 relative flex items-center border border-[#484640] cursor-pointer',
                      dictation.settings.autoSend
                        ? 'bg-[#0A84FF]'
                        : 'bg-white/10'
                    )}
                  >
                    <div
                      className={classNames(
                        'w-[14px] h-[14px] rounded-full bg-white shadow-xs transition-transform duration-150',
                        dictation.settings.autoSend
                          ? 'translate-x-[16px]'
                          : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Minimal Live VU Audio Meter */}
              <div className="chatbox-meter p-2.5 rounded-[10px] bg-black/40 border border-white/[0.08] flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-[#A09E96] font-medium flex items-center gap-2">
                    <span
                      className={classNames(
                        'w-2 h-2 rounded-full transition-colors',
                        dictation.isListening
                          ? 'bg-[#30D158] animate-pulse'
                          : dictation.isProcessing
                            ? 'bg-amber-400 animate-spin'
                            : 'bg-[#66645E]'
                      )}
                    />
                    {dictation.isListening ? (
                      <span className="text-[#E0DFDC] font-medium">
                        Listening ·{' '}
                        <span className="text-white font-semibold">
                          Cloud Whisper
                        </span>
                      </span>
                    ) : dictation.isProcessing ? (
                      <span className="text-amber-300 font-medium">
                        Transcribing with Whisper v3...
                      </span>
                    ) : (
                      <span>Microphone Standby (Cloud Whisper)</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[8.5px] font-semibold uppercase tracking-wider bg-[#0A84FF]/15 text-[#5AC8FA] border border-[#0A84FF]/30">
                      Whisper v3
                    </span>
                    <span className="font-mono text-[9.5px] text-[#A09E96]">
                      {dictation.audioLevel}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-1 bg-black/60 rounded-full overflow-hidden border border-white/[0.04]">
                  <div
                    className={classNames(
                      'h-full transition-all duration-75 rounded-full',
                      dictation.audioLevel > 60
                        ? 'bg-amber-400'
                        : dictation.audioLevel > 20
                          ? 'bg-[#30D158]'
                          : 'bg-[#0A84FF]'
                    )}
                    style={{ width: `${dictation.audioLevel}%` }}
                  />
                </div>
              </div>

              {/* Error Notice */}
              {dictation.error && (
                <div className="p-2.5 rounded-[8px] bg-red-500/15 border border-red-500/30 text-red-300 text-[11px]">
                  {dictation.error}
                </div>
              )}

              {/* Primary Action Button */}
              {dictation.settings.activationMode === 'ptt' ? (
                <button
                  type="button"
                  onMouseDown={() => dictation.startListening()}
                  onMouseUp={() => dictation.stopListening()}
                  onTouchStart={() => dictation.startListening()}
                  onTouchEnd={() => dictation.stopListening()}
                  className={classNames(
                    'w-full py-2.5 rounded-[10px] font-semibold text-[12px] flex items-center justify-center gap-2 transition-all select-none cursor-pointer shadow-md',
                    dictation.isListening
                      ? 'bg-[#FF3B30] hover:bg-[#D70015] text-white ring-2 ring-red-400/40 scale-[0.99]'
                      : 'bg-[#0A84FF] hover:bg-[#0071E3] text-white'
                  )}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                  <span>
                    {dictation.isListening
                      ? 'Release to Send (Cloud Whisper)'
                      : 'Hold to Speak (Cloud Whisper)'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  style={{ WebkitAppRegion: 'no-drag' } as any}
                  onClick={() => dictation.toggleListening()}
                  className={classNames(
                    'w-full py-2.5 rounded-[10px] font-semibold text-[12px] flex items-center justify-center gap-2 transition-all select-none cursor-pointer shadow-md',
                    dictation.isListening
                      ? 'bg-[#FF3B30] hover:bg-[#D70015] text-white ring-2 ring-red-400/40'
                      : 'bg-[#0A84FF] hover:bg-[#0071E3] text-white'
                  )}
                >
                  {dictation.isListening ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                  )}
                  <span>
                    {dictation.isListening
                      ? 'Stop Listening (Cloud Whisper)'
                      : 'Start Dictation (Cloud Whisper)'}
                  </span>
                </button>
              )}

              {/* Live Output Card */}
              {(dictation.finalTranscript ||
                dictation.interimTranscript ||
                dictation.translatedText) && (
                <div className="p-2.5 rounded-[10px] bg-black/50 border border-white/[0.08] flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[10px] text-[#A09E96]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold uppercase tracking-wide">
                        Recognized Speech
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/[0.06] text-[#A09E96] font-mono">
                        Whisper v3
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (dictation.translatedText) {
                          setChatboxCustomPinnedText(dictation.translatedText);
                          setChatboxCustomPinnedEnabled(true);
                        }
                      }}
                      className="text-[#30D158] hover:underline cursor-pointer font-medium flex items-center gap-1"
                    >
                      <span>Pin as Sticky</span>
                    </button>
                  </div>
                  <div className="text-[11.5px] text-[#E0DFDC] bg-black/40 p-2.5 rounded-[8px] border border-white/[0.04]">
                    {dictation.finalTranscript ||
                      dictation.interimTranscript ||
                      '—'}
                  </div>

                  {dictation.translatedText &&
                    dictation.settings.targetLanguage !== 'none' && (
                      <>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                          Translation (
                          {dictation.settings.targetLanguage.toUpperCase()})
                        </span>
                        <div className="text-[12px] font-medium text-emerald-300 bg-emerald-950/20 p-2.5 rounded-[8px] border border-emerald-500/20">
                          {dictation.translatedText}
                        </div>
                      </>
                    )}

                  <div className="flex items-center justify-end gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => dictation.sendCurrentPreview()}
                      className="px-3 py-1 rounded-[7px] bg-[#0A84FF] hover:bg-[#0071E3] text-white font-medium text-[11px] cursor-pointer"
                    >
                      Send to Chatbox
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Sticky Design / Status Text */}
          {activeMode === 'pinned' && (
            <div
              id="broadcast-panel-pinned"
              role="tabpanel"
              aria-labelledby="broadcast-tab-pinned"
              className="chatbox-mode flex flex-col gap-2.5"
            >
              <div className="chatbox-feature-toggle flex items-center justify-between p-2.5 rounded-[10px] bg-black/40 border border-white/[0.08]">
                <div className="flex flex-col">
                  <span className="text-[11.5px] font-medium text-white">
                    Sticky Status Text
                  </span>
                  <span className="text-[9.5px] text-[#A09E96]">
                    Persistent text above avatar
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setChatboxCustomPinnedEnabled(
                      !floorAnchor.chatboxCustomPinnedEnabled
                    );
                  }}
                  className={classNames(
                    'ios-switch w-[34px] h-[18px] rounded-full p-[2px] transition-colors duration-200 relative flex items-center border border-[#484640] cursor-pointer',
                    floorAnchor.chatboxCustomPinnedEnabled
                      ? 'bg-[#30D158]'
                      : 'bg-white/10'
                  )}
                  title="Keep this message displayed permanently in VRChat"
                  role="switch"
                  aria-checked={floorAnchor.chatboxCustomPinnedEnabled}
                  aria-label="Sticky status text"
                >
                  <div
                    className={classNames(
                      'w-[14px] h-[14px] rounded-full bg-white shadow-xs transition-transform duration-150',
                      floorAnchor.chatboxCustomPinnedEnabled
                        ? 'translate-x-[16px]'
                        : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  value={floorAnchor.chatboxCustomPinnedText}
                  onChange={(e) => setChatboxCustomPinnedText(e.target.value)}
                  placeholder="Write your status..."
                  aria-label="Sticky status message"
                  maxLength={140}
                  className="w-full px-2.5 py-2 rounded-[8px] bg-black/40 border border-[#484640] text-white placeholder-[#787670] text-[12px] focus:outline-none focus:ring-0 focus:border-[#0A84FF] focus-visible:outline-none transition-colors"
                />
                <div className="flex items-center justify-between text-[10px] text-[#A09E96]">
                  <span>Repeats periodically in VRChat</span>
                  {floorAnchor.chatboxCustomPinnedEnabled && (
                    <span className="text-[#30D158] font-medium">Active</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mode 3: Apple Music Live Now Playing */}
          {activeMode === 'music' && (
            <div
              id="broadcast-panel-music"
              role="tabpanel"
              aria-labelledby="broadcast-tab-music"
              className="chatbox-mode flex flex-col gap-2.5"
            >
              <div className="chatbox-feature-toggle flex items-center justify-between p-2.5 rounded-[10px] bg-black/40 border border-white/[0.08]">
                <div className="flex flex-col">
                  <span className="text-[11.5px] font-medium text-white flex items-center gap-1.5">
                    <span>Apple Music Now Playing</span>
                    {appleMusicInfo?.playing && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#FA2D48]/20 text-[#FA2D48] border border-[#FA2D48]/30">
                        Playing
                      </span>
                    )}
                  </span>
                  <span className="text-[9.5px] text-[#A09E96]">
                    Live song &amp; artist broadcast
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setChatboxAppleMusicEnabled(
                      !floorAnchor.chatboxAppleMusicEnabled
                    );
                  }}
                  className={classNames(
                    'ios-switch w-[34px] h-[18px] rounded-full p-[2px] transition-colors duration-200 relative flex items-center border border-[#484640] cursor-pointer',
                    floorAnchor.chatboxAppleMusicEnabled
                      ? 'bg-[#30D158]'
                      : 'bg-white/10'
                  )}
                  title="Stream current music track to VRChat chatbox"
                  role="switch"
                  aria-checked={floorAnchor.chatboxAppleMusicEnabled}
                  aria-label="Apple music broadcast"
                >
                  <div
                    className={classNames(
                      'w-[14px] h-[14px] rounded-full bg-white shadow-xs transition-transform duration-150',
                      floorAnchor.chatboxAppleMusicEnabled
                        ? 'translate-x-[16px]'
                        : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              {/* Music Widget Card */}
              <div className="chatbox-widget p-3 rounded-[10px] bg-black/40 border border-white/[0.08] flex items-center gap-3">
                <div
                  className={classNames(
                    'w-10 h-10 rounded-[8px] flex items-center justify-center text-lg shrink-0 transition-transform duration-300 select-none',
                    appleMusicInfo.playing
                      ? 'bg-[#FA2D48]/20 border border-[#FA2D48]/40 text-[#FA2D48]'
                      : 'bg-white/[0.04] border border-white/[0.06] text-white/40'
                  )}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
                <div className="flex flex-col min-w-0 flex-grow">
                  <span className="text-[12px] font-medium text-white truncate">
                    {appleMusicInfo.track || 'No track playing'}
                  </span>
                  <span className="text-[10px] text-[#A09E96] truncate">
                    {appleMusicInfo.artist
                      ? `${appleMusicInfo.artist}${appleMusicInfo.album ? ` — ${appleMusicInfo.album}` : ''}`
                      : 'Launch Apple Music on Mac to broadcast'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mode 4: Fake / Simulated BPM Tracker */}
          {activeMode === 'bpm' && (
            <div
              id="broadcast-panel-bpm"
              role="tabpanel"
              aria-labelledby="broadcast-tab-bpm"
              className="chatbox-mode flex flex-col gap-2.5"
            >
              <div className="chatbox-feature-toggle flex items-center justify-between p-2.5 rounded-[10px] bg-black/40 border border-white/[0.08]">
                <div className="flex flex-col">
                  <span className="text-[11.5px] font-medium text-white flex items-center gap-1.5">
                    <span>Simulated Heart Rate</span>
                    {fakeBpm.enabled && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#FF3B30]/20 text-[#FF453A] border border-[#FF3B30]/30 font-medium">
                        Active
                      </span>
                    )}
                  </span>
                  <span className="text-[9.5px] text-[#A09E96]">
                    {fakeBpm.presetId === 'adaptive'
                      ? 'Simulated from live tracker activity'
                      : 'Natural fluctuation (2–3s)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => fakeBpm.setEnabled(!fakeBpm.enabled)}
                  className={classNames(
                    'ios-switch w-[34px] h-[18px] rounded-full p-[2px] transition-colors duration-200 relative flex items-center border border-[#484640] cursor-pointer',
                    fakeBpm.enabled ? 'bg-[#FF3B30]' : 'bg-white/10'
                  )}
                  title="Toggle Fake BPM simulation in Chatbox"
                  role="switch"
                  aria-checked={fakeBpm.enabled}
                  aria-label="Simulated heart rate"
                >
                  <div
                    className={classNames(
                      'w-[14px] h-[14px] rounded-full bg-white shadow-xs transition-transform duration-150',
                      fakeBpm.enabled ? 'translate-x-[16px]' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              {/* Live Heart Widget Card */}
              <div className="chatbox-widget p-2.5 rounded-[10px] bg-black/40 border border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={classNames(
                      'w-9 h-9 rounded-[8px] flex items-center justify-center text-lg shrink-0 transition-transform duration-300 select-none',
                      fakeBpm.enabled
                        ? 'bg-[#FF3B30]/20 border border-[#FF3B30]/40 text-[#FF453A] animate-pulse'
                        : 'bg-white/[0.04] border border-white/[0.06] text-white/40'
                    )}
                  >
                    <svg
                      aria-hidden="true"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                    >
                      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold font-mono tracking-tight text-white">
                        {fakeBpm.enabled
                          ? fakeBpm.available
                            ? fakeBpm.currentBpm
                            : '—'
                          : fakeBpm.preset.base}
                      </span>
                      <span className="text-[10.5px] font-semibold text-[#A09E96]">
                        BPM
                      </span>
                      {fakeBpm.enabled && fakeBpm.delta !== 0 && (
                        <span
                          className={classNames(
                            'text-[9.5px] font-mono font-semibold ml-1',
                            fakeBpm.delta > 0
                              ? 'text-[#FF453A]'
                              : 'text-[#30D158]'
                          )}
                        >
                          {fakeBpm.delta > 0
                            ? `▲ +${fakeBpm.delta}`
                            : `▼ ${fakeBpm.delta}`}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#A09E96]">
                      {fakeBpm.activityLabel}
                    </span>
                  </div>
                </div>

                <span
                  className={classNames(
                    'px-2 py-0.5 rounded text-[9.5px] font-semibold uppercase tracking-wider',
                    fakeBpm.zone === 'resting'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : fakeBpm.zone === 'normal'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : fakeBpm.zone === 'elevated'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  )}
                >
                  {fakeBpm.available ? fakeBpm.zone : 'Paused'}
                </span>
              </div>

              {/* Situation Presets Grid */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-[#A09E96] tracking-wide">
                  <span>Situation Presets</span>
                  <span className="text-[9px] text-[#787670]">
                    Target Range
                  </span>
                </div>

                <div className="chatbox-presets grid grid-cols-3 gap-1.5 overflow-hidden">
                  {fakeBpm.allPresets.map((p, idx) => {
                    const isSelected = fakeBpm.presetId === p.id;
                    const isJustSelected = selectedBpmPresetAnim?.id === p.id;
                    const isOtherBouncing =
                      selectedBpmPresetAnim !== null &&
                      selectedBpmPresetAnim.id !== p.id;
                    const selectedIdx = selectedBpmPresetAnim
                      ? fakeBpm.allPresets.findIndex(
                          (item) => item.id === selectedBpmPresetAnim.id
                        )
                      : -1;
                    const dist =
                      selectedIdx >= 0 ? Math.abs(idx - selectedIdx) : 0;
                    const isLeftOfSelected =
                      selectedIdx >= 0 && idx < selectedIdx;
                    const isRightOfSelected =
                      selectedIdx >= 0 && idx > selectedIdx;
                    const bounceDelay = `${(dist * 0.045).toFixed(3)}s`;
                    const bounceAmp = Math.max(0.2, 1 - dist * 0.25);

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          handleBpmPresetClick(p.id as BpmPresetId)
                        }
                        aria-pressed={isSelected}
                        title={p.description}
                        style={
                          isOtherBouncing
                            ? ({
                                '--push-amp': bounceAmp.toFixed(2),
                                animationDelay: bounceDelay,
                              } as React.CSSProperties)
                            : undefined
                        }
                        className={classNames(
                          'flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-[7px] border text-left transition-all cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white',
                          p.id === 'adaptive' && 'col-span-3',
                          isSelected
                            ? 'bg-[#FF3B30]/15 border-[#FF3B30]/50 shadow-xs'
                            : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.07] text-[#C4C2BC]',
                          isJustSelected && 'animate-preset-pop',
                          isOtherBouncing &&
                            isLeftOfSelected &&
                            'animate-preset-push-left',
                          isOtherBouncing &&
                            isRightOfSelected &&
                            'animate-preset-push-right'
                        )}
                      >
                        <span
                          className={classNames(
                            'text-[10.5px] font-medium truncate flex items-center gap-1',
                            isSelected ? 'text-white' : 'text-[#C4C2BC]'
                          )}
                        >
                          {isSelected && <span aria-hidden="true">✓</span>}
                          {p.label}
                        </span>
                        <span className="font-mono text-[9px] text-[#A09E96] shrink-0">
                          {p.min}–{p.max}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Unified Quick-Send Composer (Always Accessible) */}
          <form
            onSubmit={handleSendMessage}
            className="chatbox-composer flex flex-col gap-1.5 pt-2.5 border-t border-white/[0.06]"
          >
            <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-[#A09E96] tracking-wide">
              <span>Quick Message</span>
              <span className="text-[9px] text-[#787670]">
                Direct broadcast
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                ref={inputRef}
                aria-label="One-off message"
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type in-game chat message..."
                maxLength={140}
                className="flex-grow px-2.5 py-1.5 rounded-[8px] bg-black/40 border border-[#484640] text-white placeholder-[#787670] text-[12px] focus:outline-none focus:ring-0 focus:border-[#0A84FF] focus-visible:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className={classNames(
                  'px-3.5 py-1.5 rounded-[8px] font-medium text-[11.5px] transition-all cursor-pointer select-none active:scale-[0.98]',
                  sentMessageFeedback
                    ? 'bg-[#30D158] text-white font-semibold'
                    : message.trim()
                      ? 'bg-[#0A84FF] hover:bg-[#0071E3] text-white'
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                )}
              >
                {sentMessageFeedback ? 'Sent!' : 'Send'}
              </button>
            </div>
          </form>

          {/* Compact Footer Toolbar: Mute Mode + Battery + Tracker Status */}
          <div className="chatbox-footer flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-[10.5px]">
            {/* Chat-Only Mute Toggle */}
            <button
              type="button"
              onClick={() => setChatboxOnlyMode(!floorAnchor.chatboxOnlyMode)}
              className={classNames(
                'px-2.5 py-1 rounded-[7px] font-medium border flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap',
                floorAnchor.chatboxOnlyMode
                  ? 'bg-[#0A84FF]/20 text-[#5AC8FA] border-[#0A84FF]/40'
                  : 'bg-white/[0.04] text-[#A09E96] border-white/[0.06] hover:bg-white/[0.08]'
              )}
              title="Chat-Only Mode suppresses tracker OSC streaming to VRChat"
              aria-pressed={floorAnchor.chatboxOnlyMode}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
              <span className="whitespace-nowrap">
                {floorAnchor.chatboxOnlyMode ? 'FBT Muted' : 'Chat-Only'}
              </span>
            </button>

            {/* Auto Battery Broadcast Toggle */}
            <button
              type="button"
              onClick={() => setChatboxEnabled(!floorAnchor.chatboxEnabled)}
              className={classNames(
                'px-2.5 py-1 rounded-[7px] font-medium border flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap',
                floorAnchor.chatboxEnabled
                  ? 'bg-[#30D158]/20 text-[#30D158] border-[#30D158]/40'
                  : 'bg-white/[0.04] text-[#A09E96] border-white/[0.06] hover:bg-white/[0.08]'
              )}
              title="Toggle automatic periodic tracker battery broadcast (every 30s)"
              aria-pressed={floorAnchor.chatboxEnabled}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
              <span className="whitespace-nowrap">Battery (30s)</span>
            </button>

            {/* Tracker Fleet Summary */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] bg-white/[0.04] border border-white/[0.06] text-[#A09E96] shrink-0 whitespace-nowrap">
              <span className="font-medium text-white whitespace-nowrap">
                {connectedCount} Trackers
              </span>
              {avgBattery != null && (
                <span className="text-[9.5px] text-emerald-400 font-mono whitespace-nowrap">
                  · {avgBattery}%
                </span>
              )}
              {isDemoMode && (
                <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-[#D97757]/25 text-[#D97757] shrink-0">
                  DEMO
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function HardRebootButton() {
  const [rebooting, setRebooting] = useState(false);

  const handleReboot = () => {
    setRebooting(true);
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  return (
    <Tooltip
      preferedDirection="bottom"
      spacing={6}
      content={
        <div className="flex flex-col text-center px-0.5">
          <span className="text-[11.5px] font-semibold text-background-10">
            Hard Reboot App
          </span>
          <span className="text-[10px] text-background-30">
            Reloads GUI without terminal restart
          </span>
        </div>
      }
    >
      <button
        type="button"
        style={{ WebkitAppRegion: 'no-drag' } as any}
        className={classNames(
          'flex items-center justify-center w-7 h-7 rounded-[8px] text-background-30 hover:text-background-10 hover:bg-white/[0.08] active:scale-90 transition-all cursor-pointer select-none',
          rebooting && 'text-accent-background-20'
        )}
        title="Hard Reboot GUI"
        onClick={handleReboot}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={classNames(
            'transition-transform duration-500',
            rebooting ? 'animate-spin' : 'hover:rotate-45'
          )}
        >
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
      </button>
    </Tooltip>
  );
}

export function TopBar({
  progress,
}: {
  children?: ReactNode;
  progress?: number;
}) {
  const electron = useElectron();
  const location = useLocation();
  const { isMobile } = useBreakpoint('mobile');
  const { useRPCPacket, sendRPCPacket } = useWebsocketAPI();
  const connectedIMUCount = useAtomValue(connectedIMUCountAtom);
  const { config, setConfig, saveConfig } = useConfig();
  const { isQuestStandalone, toggleMode } = useOperatingMode();
  const version = useContext(VersionContext);
  const [localIp, setLocalIp] = useState<string | null>(null);
  const [showTrayOrExitModal, setShowTrayOrExitModal] = useState(false);
  const [showConnectedTrackersWarning, setConnectedTrackerWarning] =
    useState(false);
  const [isTelemetryCollapsed, setIsTelemetryCollapsed] = useState(() => {
    const saved = localStorage.getItem('slimevr-topbar-telemetry-collapsed');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleTelemetryCollapse = () => {
    setIsTelemetryCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('slimevr-topbar-telemetry-collapsed', String(next));
      return next;
    });
  };

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
    } else if (config?.connectedTrackersWarning && connectedIMUCount > 0) {
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
    (typeof navigator !== 'undefined' &&
      /Mac|Macintosh/i.test(navigator.userAgent));

  return (
    <>
      <div className="flex gap-0 flex-col">
        <div
          className={classNames(
            'flex items-center justify-between gap-4 h-[46px] z-40 bg-[var(--material-primary)] border-b border-[var(--material-border-subtle)] pr-3 select-none',
            isMac ? 'pl-[116px]' : 'pl-4'
          )}
          style={{ WebkitAppRegion: 'drag' } as any}
          data-electron-drag-region
        >
          {/* Left Brand Area */}
          <div
            className="flex items-center gap-1.5 z-40 shrink-0"
            style={{ WebkitAppRegion: 'drag' } as any}
            data-electron-drag-region
          >
            {!isMobile && (
              <div
                style={{ WebkitAppRegion: 'no-drag' } as any}
                className="flex items-center gap-1 shrink-0"
              >
                <NavLink
                  to="/"
                  onClick={(e) => {
                    if (location.pathname === '/') {
                      e.preventDefault();
                      toggleTelemetryCollapse();
                    }
                  }}
                  className="flex items-center gap-2 select-none hover:opacity-85 transition-opacity cursor-pointer"
                  title="SirJameSlimeVR (Click to toggle controls)"
                >
                  <div className="animate-slime-idle flex items-center justify-center shrink-0">
                    <SlimeVRIcon />
                  </div>
                  <span className="font-serif text-[16px] font-normal tracking-tight text-background-10">
                    SirJameSlimeVR
                  </span>
                </NavLink>

                {/* Collapsible Telemetry Tab Toggle Chevron */}
                <Tooltip
                  preferedDirection="bottom"
                  spacing={6}
                  content={
                    <Typography className="text-[11px] font-medium">
                      {isTelemetryCollapsed
                        ? 'Show network & system controls'
                        : 'Hide network & system controls'}
                    </Typography>
                  }
                >
                  <button
                    type="button"
                    style={{ WebkitAppRegion: 'no-drag' } as any}
                    onClick={toggleTelemetryCollapse}
                    className={classNames(
                      'w-5 h-5 rounded-[6px] flex items-center justify-center text-background-30 hover:text-background-10 hover:bg-white/10 active:scale-90 transition-all cursor-pointer select-none',
                      !isTelemetryCollapsed && 'text-background-10 bg-white/5'
                    )}
                    aria-label="Toggle telemetry bar"
                  >
                    <svg
                      className={classNames(
                        'w-3.5 h-3.5 transition-transform duration-300 ease-out',
                        isTelemetryCollapsed ? 'rotate-0' : 'rotate-180'
                      )}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </Tooltip>
              </div>
            )}

            {/* Collapsible Telemetry & Quick Controls Group */}
            <div
              className={classNames(
                'flex items-center transition-all duration-300 ease-out overflow-hidden',
                isTelemetryCollapsed
                  ? 'max-w-0 opacity-0 pointer-events-none -translate-x-2'
                  : 'max-w-[750px] opacity-100 translate-x-0'
              )}
              style={{ WebkitAppRegion: 'no-drag' } as any}
            >
              <div className="flex items-center gap-2 shrink-0 pl-1">
                <VersionTag />
                {localIp && (
                  <Tooltip
                    preferedDirection="bottom"
                    spacing={6}
                    content={
                      <Typography className="text-[11px] font-medium">
                        Click to copy Mac Host IP: {localIp}
                      </Typography>
                    }
                  >
                    <div
                      style={{ WebkitAppRegion: 'no-drag' } as any}
                      className="apple-interactive flex items-center gap-1.5 text-[11px] tnum font-medium text-background-20 hover:text-background-10 rounded-[8px] px-2 py-0.5 cursor-pointer select-text"
                      onClick={() => {
                        navigator.clipboard.writeText(localIp);
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
                      <span className="text-[10px] uppercase font-semibold text-background-30 tracking-wide">
                        Mac:
                      </span>
                      <span className="font-medium text-background-10">
                        {localIp}
                      </span>
                    </div>
                  </Tooltip>
                )}

                <QuestTargetIPPill />
                <RefreshTrackersButton />

                {/* Authentic macOS Toggle Switch */}
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
                    className="flex items-center gap-2 px-2 py-1 rounded-[8px] hover:bg-white/5 text-[11px] font-medium text-background-20 hover:text-background-10 transition-all select-none cursor-pointer active:scale-[0.98]"
                  >
                    <span className="font-medium text-[11px] tracking-wide">
                      Standalone
                    </span>
                    <div
                      className={classNames(
                        'w-[34px] h-[18px] rounded-full p-[2px] transition-colors duration-200 relative flex items-center border border-white/10',
                        isQuestStandalone ? 'bg-[#30D158]' : 'bg-white/15'
                      )}
                    >
                      <div
                        className={classNames(
                          'w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-mac-spring',
                          isQuestStandalone
                            ? 'translate-x-[16px]'
                            : 'translate-x-0'
                        )}
                      />
                    </div>
                  </button>
                </Tooltip>
              </div>
            </div>

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
            />
          )}

          {/* Right Controls & Window Actions */}
          <div
            className="flex justify-end items-center px-3 gap-2 z-40 shrink-0 h-full"
            style={{ WebkitAppRegion: 'drag' } as any}
            data-electron-drag-region
          >
            <div
              style={{ WebkitAppRegion: 'no-drag' } as any}
              className="flex items-center gap-1.5"
            >
              <HardRebootButton />
            </div>

            {electron.isElectron && !isMac && (
              <div
                style={{ WebkitAppRegion: 'no-drag' } as any}
                className="flex items-center gap-1 ml-1"
              >
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
              connectedIMUCount > 0
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

import classNames from 'classnames';
import { useAtomValue } from 'jotai';
import { assignedTrackersAtom, unassignedTrackersAtom } from '@/store/app-store';
import { useOperatingMode } from '@/hooks/operating-mode';
import { useTrackerPresets } from '@/hooks/presets';
import { Typography } from '@/components/commons/Typography';
import { useState, useEffect } from 'react';
import { RpcMessage, HeartbeatRequestT } from 'solarxr-protocol';
import { useWebsocketAPI } from '@/hooks/websocket-api';

export function QuestDiagnosticsCard() {
  const { sendRPCPacket } = useWebsocketAPI();
  const [refreshingTrackers, setRefreshingTrackers] = useState(false);
  const {
    isQuestStandalone,
    floorAnchor,
    toggleFloorAnchor,
    triggerFloorCalibration,
    adjustFloorHeight,
    setFloorHeight,
    setCorrectionStrength,
    setFootPlantStrength,
    setCrouchCompensation,
    setOscRate,
    selectProfile,
  } = useOperatingMode();

  useEffect(() => {
    const onDelta = (e: CustomEvent<number>) => {
      adjustFloorHeight(e.detail);
    };
    const onReset = () => {
      setFloorHeight(0);
    };
    window.addEventListener('tray-elevation-delta', onDelta as EventListener);
    window.addEventListener('tray-elevation-reset-event', onReset);
    return () => {
      window.removeEventListener('tray-elevation-delta', onDelta as EventListener);
      window.removeEventListener('tray-elevation-reset-event', onReset);
    };
  }, [adjustFloorHeight, setFloorHeight]);
  const assignedTrackers = useAtomValue(assignedTrackersAtom);
  const unassignedTrackers = useAtomValue(unassignedTrackersAtom);
  const { activePreset } = useTrackerPresets();
  const [collapsed, setCollapsed] = useState(false);
  const [calibrating, setCalibrating] = useState(false);

  const handleRefreshTrackers = () => {
    if (refreshingTrackers) return;
    setRefreshingTrackers(true);
    sendRPCPacket(RpcMessage.HeartbeatRequest, new HeartbeatRequestT());
    setTimeout(() => {
      setRefreshingTrackers(false);
    }, 1200);
  };

  const activeAssigned = assignedTrackers.filter(
    ({ tracker }) => tracker.status === 1 || tracker.status === 2
  ).length;

  const handleCalibrate = () => {
    setCalibrating(true);
    triggerFloorCalibration();
    setTimeout(() => {
      setCalibrating(false);
    }, 1200);
  };

  const [showTuning, setShowTuning] = useState(false);

  const profiles = [
    { id: 'STANDING', label: 'Standing', icon: '🧍' },
    { id: 'CROUCHING', label: 'Crouching', icon: '🧘' },
    { id: 'SITTING', label: 'Sitting', icon: '🪑' },
    { id: 'CUSTOM', label: 'Custom', icon: '⚙️' },
  ] as const;

  const rates = [30, 50, 60, 90] as const;

  return (
    <div className="w-full rounded-[24px] glass-panel-strong border border-white/10 p-3.5 flex flex-col gap-3 shadow-lg select-none transition-all">
      {/* Header with Title & Concentric Profile Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/6 pb-2.5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          </span>
          <Typography bold variant="standard" className="text-[13px] font-semibold tracking-mac-subhead text-background-10">
            Quest Telemetry & Floor
          </Typography>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Trackers Button */}
          <button
            type="button"
            onClick={handleRefreshTrackers}
            disabled={refreshingTrackers}
            className={classNames(
              'px-2.5 py-1 rounded-[9px] text-[11.5px] telemetry-numeral font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer select-none active:scale-[0.98] border',
              refreshingTrackers
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'bg-white/5 hover:bg-white/10 text-background-20 hover:text-background-10 border-white/10'
            )}
            title="Scan for trackers without restarting the server or losing calibrations"
          >
            <svg
              className={classNames('w-3 h-3', refreshingTrackers && 'animate-spin text-sky-400')}
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
            <span>{refreshingTrackers ? 'Scanning...' : 'Refresh'}</span>
          </button>

          {/* Profile Switcher: R_outer = 11px, P = 2px, R_inner = 9px */}
          <div className="flex items-center gap-0.5 bg-black/25 p-[2px] rounded-[11px] border border-white/8 backdrop-blur-md">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectProfile(p.id)}
                className={classNames(
                  'px-2.5 py-1 rounded-[9px] text-[11px] font-medium transition-all duration-150 flex items-center gap-1 cursor-pointer select-none active:scale-[0.98]',
                  floorAnchor.activeProfile === p.id
                    ? 'bg-accent-background-30 text-white shadow-sm border border-accent-background-20/50 font-semibold'
                    : 'text-background-30 hover:text-background-10 hover:bg-white/5 border border-transparent'
                )}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 pt-0.5">
        {/* Top 4 Metric Tiles: R_inner = 12px, Outer gap = 8px */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Metric 1: Active Preset */}
          <div className="p-3 rounded-[12px] bg-white/[0.04] border border-white/6 flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-mac-caption font-semibold text-background-30">
              Active Preset
            </span>
            <div className="mt-1 flex flex-col">
              <span className="text-[14px] font-bold text-background-10 tracking-tight truncate">
                {activePreset?.name || 'Custom Preset'}
              </span>
              <span className="text-[11px] telemetry-numeral font-medium text-accent-background-20 mt-0.5">
                {activeAssigned} of {activePreset?.targetCount || 5} active
              </span>
            </div>
          </div>

          {/* Metric 2: Live Tactile Flight / Floor Elevation Scrubber */}
          <div className="p-3 rounded-[12px] bg-white/[0.04] border border-white/6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-mac-caption font-semibold text-background-30">
                  Elevation
                </span>
                {Math.round(floorAnchor.floorOffset * 100) !== 0 && (
                  <button
                    type="button"
                    onClick={() => setFloorHeight(0)}
                    className="text-[9.5px] px-1.5 py-0.5 rounded-[6px] bg-white/10 hover:bg-white/20 text-background-20 transition-colors cursor-pointer active:scale-[0.98]"
                    title="Snap floor back to exact 0cm"
                  >
                    Reset 0
                  </button>
                )}
              </div>
              <span className="text-[12px] telemetry-numeral font-bold text-background-10">
                {floorAnchor.floorOffset >= 0 ? '+' : ''}
                {(floorAnchor.floorOffset * 100).toFixed(0)} cm
              </span>
            </div>

            {/* Scrubber with Micro-Steppers */}
            <div className="mt-2 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustFloorHeight(-1)}
                  className="w-5 h-5 rounded-[6px] bg-white/10 hover:bg-white/20 text-[10px] font-bold text-background-20 flex items-center justify-center transition-all active:scale-[0.96]"
                  title="Lower elevation by 1cm"
                >
                  -1
                </button>
                <div className="relative flex-grow flex items-center">
                  <input
                    type="range"
                    min="-150"
                    max="200"
                    step="1"
                    value={Math.round(floorAnchor.floorOffset * 100)}
                    onChange={(e) => setFloorHeight(parseFloat(e.target.value) / 100)}
                    className="w-full h-1.5 bg-black/40 rounded-full appearance-none cursor-pointer accent-accent-background-20 focus:outline-none"
                  />
                  {/* Centered Magnetic 0cm Detent Marker */}
                  <div
                    className="absolute w-1 h-2.5 bg-white/40 pointer-events-none rounded-full"
                    style={{ left: `${((0 - -150) / 350) * 100}%`, transform: 'translateX(-50%)' }}
                    title="0cm Ground Level"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => adjustFloorHeight(1)}
                  className="w-5 h-5 rounded-[6px] bg-white/10 hover:bg-white/20 text-[10px] font-bold text-background-20 flex items-center justify-center transition-all active:scale-[0.96]"
                  title="Raise elevation by 1cm"
                >
                  +1
                </button>
              </div>
              <div className="flex justify-between text-[9px] telemetry-numeral text-background-30">
                <span>-150cm (Down)</span>
                <span className="font-semibold text-background-20">0cm (Floor)</span>
                <span>+200cm (Fly)</span>
              </div>
            </div>
          </div>

          {/* Metric 3: OSC Output Rate */}
          <div className="p-3 rounded-[12px] bg-white/[0.04] border border-white/6 flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-mac-caption font-semibold text-background-30">
              OSC Output Rate
            </span>
            <div className="mt-2 flex items-center justify-between gap-1">
              {rates.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setOscRate(r)}
                  className={classNames(
                    'flex-1 py-1 rounded-[7px] text-[10.5px] telemetry-numeral font-medium border transition-all active:scale-[0.98]',
                    floorAnchor.oscRate === r
                      ? 'bg-accent-background-30 text-white border-accent-background-20/50 shadow-sm font-semibold'
                      : 'bg-white/5 text-background-30 border-transparent hover:text-background-10 hover:bg-white/10'
                  )}
                >
                  {r}Hz
                </button>
              ))}
            </div>
          </div>

          {/* Metric 4: Floor Anchor & Quick Leveling */}
          <div className="p-3 rounded-[12px] bg-white/[0.04] border border-white/6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-mac-caption font-semibold text-background-30">
                Floor Anchor
              </span>
              <button
                type="button"
                onClick={toggleFloorAnchor}
                className={classNames(
                  'px-2 py-0.5 rounded-[6px] text-[10px] font-semibold border transition-all active:scale-[0.98]',
                  floorAnchor.isAnchored
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                )}
                title="Toggle floor anchor lock"
              >
                {floorAnchor.isAnchored ? 'Locked' : 'Floating'}
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span
                className={classNames(
                  'text-[13px] font-bold tracking-tight transition-colors',
                  calibrating
                    ? 'text-accent-background-20 animate-pulse'
                    : floorAnchor.isAnchored
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                )}
              >
                {calibrating
                  ? 'Calibrating...'
                  : floorAnchor.isAnchored
                  ? 'Floor Locked'
                  : 'Floor Free'}
              </span>
              <button
                type="button"
                onClick={handleCalibrate}
                disabled={calibrating}
                className="px-2.5 py-1 rounded-[8px] bg-white/10 hover:bg-white/15 text-[11px] font-semibold text-background-10 border border-white/10 transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
                title="Calibrate floor level to feet"
              >
                {calibrating ? 'Done' : 'Calibrate Floor'}
              </button>
            </div>
          </div>
        </div>

        {/* Progressive Disclosure: Calibration Tuning Drawer Toggle */}
        <div className="flex justify-center pt-0.5">
          <button
            type="button"
            onClick={() => setShowTuning(!showTuning)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-white/[0.03] hover:bg-white/[0.08] text-[11px] text-background-30 hover:text-background-10 transition-all border border-white/5 active:scale-[0.98]"
          >
            <span>{showTuning ? '▴ Hide Advanced Calibration' : '▾ Advanced Calibration & Leg Tweaks'}</span>
          </button>
        </div>

        {/* Expandable Advanced Tuning Drawer */}
        {showTuning && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-black/25 p-3 rounded-[14px] border border-white/8 transition-all">
            {/* Slider 1: Correction Strength */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-background-30 font-medium">Correction Strength</span>
                <span className="telemetry-numeral font-semibold text-background-10">
                  {Math.round(floorAnchor.correctionStrength * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(floorAnchor.correctionStrength * 100)}
                onChange={(e) => setCorrectionStrength(Number(e.target.value) / 100)}
                className="w-full accent-accent-background-30 cursor-pointer h-1.5 bg-black/40 rounded-full appearance-none focus:outline-none"
              />
            </div>

            {/* Slider 2: Foot Plant Strength */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-background-30 font-medium">Foot Plant Lock</span>
                <span className="telemetry-numeral font-semibold text-background-10">
                  {Math.round(floorAnchor.footPlantStrength * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(floorAnchor.footPlantStrength * 100)}
                onChange={(e) => setFootPlantStrength(Number(e.target.value) / 100)}
                className="w-full accent-accent-background-30 cursor-pointer h-1.5 bg-black/40 rounded-full appearance-none focus:outline-none"
              />
            </div>

            {/* Toggle: Crouch Compensation */}
            <div className="flex items-center justify-between px-1">
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-background-10">Crouch Compensation</span>
                <span className="text-[9.5px] text-background-30">Preserve foot placement</span>
              </div>
              <button
                type="button"
                onClick={() => setCrouchCompensation(!floorAnchor.crouchCompensation)}
                className={classNames(
                  'w-[34px] h-[20px] rounded-full p-[2px] transition-colors duration-200 relative flex items-center border border-white/10 active:scale-[0.98]',
                  floorAnchor.crouchCompensation ? 'bg-emerald-500' : 'bg-white/15'
                )}
              >
                <div
                  className={classNames(
                    'w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-150',
                    floorAnchor.crouchCompensation ? 'translate-x-[14px]' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

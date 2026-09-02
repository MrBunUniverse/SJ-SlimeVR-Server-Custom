import classNames from 'classnames';
import { useAtomValue } from 'jotai';
import { assignedTrackersAtom, unassignedTrackersAtom } from '@/store/app-store';
import { useOperatingMode } from '@/hooks/operating-mode';
import { useTrackerPresets } from '@/hooks/presets';
import { Typography } from '@/components/commons/Typography';
import { useState } from 'react';
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

  const profiles = [
    { id: 'STANDING', label: 'Standing', icon: '🧍' },
    { id: 'CROUCHING', label: 'Crouching', icon: '🧘' },
    { id: 'SITTING', label: 'Sitting', icon: '🪑' },
    { id: 'CUSTOM', label: 'Custom', icon: '⚙️' },
  ] as const;

  const rates = [30, 50, 60, 90] as const;

  return (
    <div className="w-full rounded-2xl glass-panel-strong border border-background-50/20 p-4 flex flex-col gap-3 shadow-lg select-none transition-all">
      {/* Header with Title & Quick Profile Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-500/50" />
          <Typography bold variant="standard" className="text-[14px] tracking-tight">
            Quest Standalone Telemetry & Tracking
          </Typography>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Trackers Button */}
          <button
            type="button"
            onClick={handleRefreshTrackers}
            disabled={refreshingTrackers}
            className={classNames(
              'px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer select-none active:scale-95 border',
              refreshingTrackers
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'bg-background-80/80 hover:bg-white/10 text-background-20 hover:text-background-10 border-white/5'
            )}
            title="Safely re-scan and probe trackers without restarting the server or losing calibrations"
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
            <span>{refreshingTrackers ? 'Refreshing...' : 'Refresh Trackers'}</span>
          </button>

          {/* Profile Switcher Pills */}
          <div className="flex items-center gap-1 bg-background-80/80 p-1 rounded-xl border border-white/5">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectProfile(p.id)}
                className={classNames(
                  'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 flex items-center gap-1 cursor-pointer select-none active:scale-95',
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

      {!collapsed && (
        <div className="flex flex-col gap-2.5 pt-0.5">
          {/* Top 4 Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Metric 1: Active Preset */}
            <div className="p-3 rounded-xl bg-background-70/50 border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-background-30">
                Active Preset
              </span>
              <div className="mt-1 flex flex-col">
                <span className="text-[15px] font-bold text-background-10 tracking-tight truncate">
                  {activePreset?.name || 'Custom Preset'}
                </span>
                <span className="text-[11px] font-medium text-accent-background-20 mt-0.5">
                  {activeAssigned} of {activePreset?.targetCount || 5} active
                </span>
              </div>
            </div>

            {/* Metric 2: Live Flight / Floor Elevation Slider */}
            <div className="p-3 rounded-xl bg-background-70/50 border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-background-30">
                    Floor / Flight
                  </span>
                  {Math.round(floorAnchor.floorOffset * 100) !== 0 && (
                    <button
                      type="button"
                      onClick={() => setFloorHeight(0)}
                      className="text-[9px] px-1 py-0.5 rounded bg-white/10 hover:bg-white/20 text-background-20 transition-colors cursor-pointer active:scale-95"
                      title="Reset floor to 0cm"
                    >
                      Reset 0
                    </button>
                  )}
                </div>
                <span className="text-[11px] font-mono font-bold text-background-10">
                  {floorAnchor.floorOffset >= 0 ? '+' : ''}
                  {(floorAnchor.floorOffset * 100).toFixed(0)} cm
                </span>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                <input
                  type="range"
                  min="-150"
                  max="200"
                  step="1"
                  value={Math.round(floorAnchor.floorOffset * 100)}
                  onChange={(e) => setFloorHeight(parseFloat(e.target.value) / 100)}
                  className="w-full h-1.5 bg-background-60 rounded-lg appearance-none cursor-pointer accent-accent-background-20"
                />
                <div className="flex justify-between text-[9px] text-background-40 font-mono">
                  <span>-150cm (Down)</span>
                  <span>0cm</span>
                  <span>+200cm (Fly)</span>
                </div>
              </div>
            </div>

            {/* Metric 3: OSC Polling Rate */}
            <div className="p-3 rounded-xl bg-background-70/50 border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-background-30">
                OSC Output Rate
              </span>
              <div className="mt-2 flex items-center justify-between gap-1">
                {rates.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setOscRate(r)}
                    className={classNames(
                      'flex-1 py-0.5 rounded-md text-[10px] font-mono font-medium border transition-colors',
                      floorAnchor.oscRate === r
                        ? 'bg-accent-background-30/40 text-accent-background-10 border-accent-background-30'
                        : 'bg-white/5 text-background-30 border-transparent hover:text-background-10'
                    )}
                  >
                    {r}Hz
                  </button>
                ))}
              </div>
            </div>

            {/* Metric 4: Floor Anchor & Calibration */}
            <div className="p-3 rounded-xl bg-background-70/50 border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-background-30">
                  Floor Anchor
                </span>
                <button
                  type="button"
                  onClick={toggleFloorAnchor}
                  className={classNames(
                    'px-1.5 py-0.5 rounded-md text-[10px] font-medium border transition-colors',
                    floorAnchor.isAnchored
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                  )}
                  title="Click to toggle floor locking"
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
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-semibold text-background-10 border border-white/10 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                  title="Recalibrate floor level to headset"
                >
                  {calibrating ? 'Done' : 'Set Floor'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Fine-Tuning Sliders & Crouch Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-background-80/40 p-2.5 rounded-xl border border-white/5">
            {/* Slider 1: Correction Strength */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-background-30 font-medium">Correction Strength</span>
                <span className="font-mono text-background-10">
                  {Math.round(floorAnchor.correctionStrength * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(floorAnchor.correctionStrength * 100)}
                onChange={(e) => setCorrectionStrength(Number(e.target.value) / 100)}
                className="w-full accent-accent-background-30 cursor-pointer h-1.5 bg-background-60 rounded-lg appearance-none"
              />
            </div>

            {/* Slider 2: Foot Plant Strength */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-background-30 font-medium">Foot Plant Lock</span>
                <span className="font-mono text-background-10">
                  {Math.round(floorAnchor.footPlantStrength * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(floorAnchor.footPlantStrength * 100)}
                onChange={(e) => setFootPlantStrength(Number(e.target.value) / 100)}
                className="w-full accent-accent-background-30 cursor-pointer h-1.5 bg-background-60 rounded-lg appearance-none"
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
                  'w-9 h-5 rounded-full transition-colors relative p-0.5 flex items-center border',
                  floorAnchor.crouchCompensation
                    ? 'bg-emerald-500/30 border-emerald-400/50 justify-end'
                    : 'bg-background-60 border-white/10 justify-start'
                )}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

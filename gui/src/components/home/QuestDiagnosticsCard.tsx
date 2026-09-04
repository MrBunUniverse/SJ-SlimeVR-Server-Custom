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

  const [showTuning, setShowTuning] = useState(true);

  const rates = [30, 50, 60, 90] as const;

  return (
    <div className="w-full rounded-[18px] glass-panel-strong border border-white/[0.06] p-3 flex flex-col gap-2.5 select-none transition-all">
      {/* Header with Title & Concentric Vector Profile Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.04] pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#30D158] shrink-0" />
          <Typography bold variant="standard" className="text-[12.5px] font-semibold text-background-10 tracking-tight">
            Quest Standalone Telemetry & Spatial Leveling
          </Typography>
        </div>

        {/* Header Right: Manual Tweaks Toggle */}
        <button
          type="button"
          onClick={() => setShowTuning(!showTuning)}
          className={classNames(
            'px-2.5 py-1 rounded-[8px] text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer select-none active:scale-[0.98]',
            showTuning
              ? 'bg-white/[0.08] text-white font-medium border border-white/[0.08]'
              : 'text-background-20 hover:text-background-10 hover:bg-white/[0.04] border border-transparent'
          )}
        >
          <svg className="w-3 h-3 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          <span>Manual Tweaks</span>
          <span className="text-[9px] opacity-70">{showTuning ? '▴' : '▾'}</span>
        </button>
      </div>

      <div className="flex flex-col gap-2.5 pt-0.5">
        {/* Top 4 Metric Tiles: R_inner = 10px, Outer gap = 8px */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Metric 1: Trackers Assigned */}
          <div className="p-2.5 rounded-[10px] bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between">
            <span className="text-[10px] uppercase font-semibold text-background-30 tracking-wide">
              Trackers Assigned
            </span>
            <div className="mt-1 flex flex-col">
              <span className="text-[13px] font-semibold text-background-10 tracking-tight truncate">
                {activePreset?.name || 'Custom Setup'}
              </span>
              <span className="text-[11px] tnum font-medium text-background-20 mt-0.5">
                {activeAssigned} of {activePreset?.targetCount || 5} active
              </span>
            </div>
          </div>

          {/* Metric 2: Live Tactile Flight / Floor Elevation Scrubber */}
          <div className="p-2.5 rounded-[10px] bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-semibold text-background-30 tracking-wide">
                  Elevation
                </span>
                {Math.round(floorAnchor.floorOffset * 100) !== 0 && (
                  <button
                    type="button"
                    onClick={() => setFloorHeight(0)}
                    className="apple-interactive text-[9px] px-1.5 py-0.5 rounded-[5px] text-background-20 transition-colors cursor-pointer"
                    title="Snap floor back to exact 0cm"
                  >
                    Reset 0
                  </button>
                )}
              </div>
              <span className="text-[12px] tnum font-semibold text-background-10">
                {floorAnchor.floorOffset >= 0 ? '+' : ''}
                {(floorAnchor.floorOffset * 100).toFixed(0)} cm
              </span>
            </div>

            {/* Scrubber with Micro-Steppers */}
            <div className="mt-2 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustFloorHeight(-1)}
                  className="apple-interactive w-5 h-5 rounded-[5px] text-[10px] font-semibold text-background-20 flex items-center justify-center cursor-pointer"
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
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#0A84FF] focus:outline-none"
                  />
                  {/* Centered Magnetic 0cm Detent Marker */}
                  <div
                    className="absolute w-1 h-2 bg-white/40 pointer-events-none rounded-full"
                    style={{ left: `${((0 - -150) / 350) * 100}%`, transform: 'translateX(-50%)' }}
                    title="0cm Ground Level"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => adjustFloorHeight(1)}
                  className="apple-interactive w-5 h-5 rounded-[5px] text-[10px] font-semibold text-background-20 flex items-center justify-center cursor-pointer"
                  title="Raise elevation by 1cm"
                >
                  +1
                </button>
              </div>
              <div className="flex justify-between text-[9px] tnum text-background-30">
                <span>-150cm</span>
                <span className="font-medium text-background-20">0cm</span>
                <span>+200cm</span>
              </div>
            </div>
          </div>

          {/* Metric 3: OSC Output Rate */}
          <div className="p-2.5 rounded-[10px] bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between">
            <span className="text-[10px] uppercase font-semibold text-background-30 tracking-wide">
              OSC Output Rate
            </span>
            <div className="mt-1.5 flex items-center justify-between gap-0.5 p-0.5 rounded-[7px] bg-black/20 border border-white/[0.03]">
              {rates.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setOscRate(r)}
                  className={classNames(
                    'flex-1 py-1 rounded-[5px] text-[10.5px] tnum font-medium transition-all cursor-pointer select-none active:scale-[0.98]',
                    floorAnchor.oscRate === r
                      ? 'bg-white/[0.12] text-white font-semibold shadow-xs'
                      : 'text-background-30 hover:text-background-10 hover:bg-white/[0.03]'
                  )}
                >
                  {r}Hz
                </button>
              ))}
            </div>
          </div>

          {/* Metric 4: Floor Anchor & Leveling */}
          <div className="p-2.5 rounded-[10px] bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold text-background-30 tracking-wide">
                Floor Anchor
              </span>
              <button
                type="button"
                onClick={toggleFloorAnchor}
                className={classNames(
                  'px-2 py-0.5 rounded-full text-[10px] font-medium transition-all active:scale-[0.98] cursor-pointer',
                  floorAnchor.isAnchored
                    ? 'bg-[#30D158]/12 text-[#30D158] border border-[#30D158]/15'
                    : 'bg-amber-500/12 text-amber-300 border border-amber-500/15'
                )}
              >
                {floorAnchor.isAnchored ? 'Locked' : 'Floating'}
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span
                className={classNames(
                  'text-[12px] font-semibold tracking-tight transition-colors',
                  calibrating
                    ? 'text-[#0A84FF] animate-pulse'
                    : floorAnchor.isAnchored
                    ? 'text-[#30D158]'
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
                className="apple-interactive px-2.5 py-1 rounded-[7px] text-[10.5px] font-medium text-background-10 transition-all cursor-pointer disabled:opacity-50"
              >
                {calibrating ? 'Done' : 'Calibrate'}
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Advanced Tuning Drawer */}
        {showTuning && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/15 p-3 rounded-[12px] border border-white/[0.04] transition-all">
            {/* Slider 1: Correction Strength */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-background-30 font-medium">Correction Strength</span>
                <span className="tnum font-semibold text-background-10">
                  {Math.round(floorAnchor.correctionStrength * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(floorAnchor.correctionStrength * 100)}
                onChange={(e) => setCorrectionStrength(Number(e.target.value) / 100)}
                className="w-full accent-[#0A84FF] cursor-pointer h-1 bg-white/10 rounded-full appearance-none focus:outline-none"
              />
            </div>

            {/* Slider 2: Foot Plant Strength */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-background-30 font-medium">Foot Plant Lock</span>
                <span className="tnum font-semibold text-background-10">
                  {Math.round(floorAnchor.footPlantStrength * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(floorAnchor.footPlantStrength * 100)}
                onChange={(e) => setFootPlantStrength(Number(e.target.value) / 100)}
                className="w-full accent-[#0A84FF] cursor-pointer h-1 bg-white/10 rounded-full appearance-none focus:outline-none"
              />
            </div>

            {/* Toggle: Crouch Compensation */}
            <div className="flex items-center justify-between px-1">
              <div className="flex flex-col">
                <span className="text-[10.5px] font-medium text-background-10">Crouch Compensation</span>
                <span className="text-[9px] text-background-30">Preserve foot placement</span>
              </div>
              <button
                type="button"
                onClick={() => setCrouchCompensation(!floorAnchor.crouchCompensation)}
                className={classNames(
                  'w-[34px] h-[18px] rounded-full p-[2px] transition-colors duration-200 relative flex items-center border border-white/[0.06] active:scale-[0.98]',
                  floorAnchor.crouchCompensation ? 'bg-[#30D158]' : 'bg-white/10'
                )}
              >
                <div
                  className={classNames(
                    'w-[14px] h-[14px] rounded-full bg-white shadow-xs transition-transform duration-150',
                    floorAnchor.crouchCompensation ? 'translate-x-[16px]' : 'translate-x-0'
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

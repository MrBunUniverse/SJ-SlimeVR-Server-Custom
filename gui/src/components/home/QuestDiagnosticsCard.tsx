import classNames from 'classnames';
import { useAtomValue } from 'jotai';
import { assignedTrackersAtom, unassignedTrackersAtom } from '@/store/app-store';
import { useOperatingMode } from '@/hooks/operating-mode';
import { useTrackerPresets } from '@/hooks/presets';
import { Typography } from '@/components/commons/Typography';
import { useState } from 'react';

export function QuestDiagnosticsCard() {
  const { isQuestStandalone, floorAnchor, triggerFloorCalibration } = useOperatingMode();
  const assignedTrackers = useAtomValue(assignedTrackersAtom);
  const unassignedTrackers = useAtomValue(unassignedTrackersAtom);
  const { activePreset } = useTrackerPresets();
  const [collapsed, setCollapsed] = useState(false);

  if (!isQuestStandalone) return null;

  const activeAssigned = assignedTrackers.filter(
    ({ tracker }) => tracker.status === 1 || tracker.status === 2
  ).length;

  return (
    <div className="glass-panel rounded-2xl border border-white/10 p-3.5 shadow-lg flex flex-col gap-2.5 transition-all mb-2.5 select-none">
      {/* Apple Pro Header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-background-10 tracking-tight">
                Quest Standalone Telemetry
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active
              </span>
            </div>
            <span className="text-[11px] text-background-30">
              Untethered VRChat OSC & OSCQuery streaming
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-background-30 hover:text-background-10 text-[11px] font-medium transition-colors"
        >
          {collapsed ? 'Show Details' : 'Hide'}
        </button>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-0.5">
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

          {/* Metric 2: HMD & Wrist OSC */}
          <div className="p-3 rounded-xl bg-background-70/50 border border-white/5 flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-background-30">
              HMD & Wrist OSC
            </span>
            <div className="mt-1 flex flex-col">
              <span className="text-[15px] font-bold text-background-10 tracking-tight">
                Listening
              </span>
              <span className="text-[11px] font-medium text-background-30 mt-0.5">
                Port 9001 In · 9000 Out
              </span>
            </div>
          </div>

          {/* Metric 3: OSCQuery Discovery */}
          <div className="p-3 rounded-xl bg-background-70/50 border border-white/5 flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-background-30">
              OSCQuery Discovery
            </span>
            <div className="mt-1 flex flex-col">
              <span className="text-[15px] font-bold text-background-10 tracking-tight">
                Ready
              </span>
              <span className="text-[11px] font-medium text-background-30 mt-0.5">
                HTTP & Zeroconf
              </span>
            </div>
          </div>

          {/* Metric 4: Floor Anchor */}
          <div className="p-3 rounded-xl bg-background-70/50 border border-white/5 flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-background-30">
              Floor Anchor
            </span>
            <div className="mt-1 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-emerald-400 tracking-tight">
                  {floorAnchor.isAnchored ? 'Locked' : 'Floating'}
                </span>
                <span className="text-[11px] font-medium text-background-30 mt-0.5">
                  Offset: {floorAnchor.floorOffset.toFixed(2)}m
                </span>
              </div>
              <button
                type="button"
                onClick={triggerFloorCalibration}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-semibold text-background-10 border border-white/10 transition-all active:scale-95 shadow-sm"
                title="Recalibrate floor level to headset"
              >
                Set Floor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

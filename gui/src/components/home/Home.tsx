import { NavLink, useNavigate } from 'react-router-dom';
import { TrackerDataT } from 'solarxr-protocol';
import { useConfig } from '@/hooks/config';
import { Typography } from '@/components/commons/Typography';
import { TrackerCard } from '@/components/tracker/TrackerCard';
import { TrackersTable } from '@/components/tracker/TrackersTable';
import { HeadsetIcon } from '@/components/commons/icon/HeadsetIcon';
import { useAtomValue } from 'jotai';
import {
  assignedTrackersAtom,
  unassignedTrackersAtom,
} from '@/store/app-store';
import { useTrackingChecklist } from '@/hooks/tracking-checklist';
import { Checklist } from '@/components/commons/icon/ChecklistIcon';
import { useState } from 'react';
import { HomeSettingsModal } from './HomeSettingsModal';
import { LayoutIcon } from '@/components/commons/icon/LayoutIcon';
import { PresetSelector } from './PresetSelector';
import { QuestDiagnosticsPill } from './QuestDiagnosticsPill';
import { HomeEmptyState } from './HomeEmptyState';
import { ResetActionsGroup } from '@/components/Toolbar';

import { QuestDiagnosticsCard } from './QuestDiagnosticsCard';

export function Home() {
  const { config, setConfig } = useConfig();
  const trackers = useAtomValue(assignedTrackersAtom);
  const unassignedTrackers = useAtomValue(unassignedTrackersAtom);
  const { highlightedTrackers } = useTrackingChecklist();
  const navigate = useNavigate();

  const sendToSettings = (tracker: TrackerDataT) => {
    navigate(
      `/tracker/${tracker.trackerId?.trackerNum}/${tracker.trackerId?.deviceId?.id}`
    );
  };

  const settingsOpenState = useState(false);

  const toggleLayout = () => {
    setConfig({
      homeLayout: config?.homeLayout === 'table' ? 'default' : 'table',
    });
  };

  return (
    <div className="relative h-full p-2 flex flex-col">
      <HomeSettingsModal open={settingsOpenState} />
      <NavLink
        to="/vr-mode"
        className="xs:hidden absolute z-50 h-12 w-12 rounded-full bg-accent-background-30 bottom-3 right-3 flex justify-center items-center fill-background-10 shadow-lg"
      >
        <HeadsetIcon />
      </NavLink>
      <NavLink
        to="/checklist"
        className="xs:hidden absolute z-50 h-12 w-12 rounded-full bg-accent-background-30 bottom-[70px] right-3 flex justify-center items-center fill-background-10 shadow-lg"
      >
        <Checklist />
      </NavLink>

      {/* macOS Unified Floating Action Dock */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 mb-2 glass-panel rounded-2xl border border-white/10 shadow-lg">
        {/* Left Section: Presets & Quest Telemetry */}
        <div className="flex items-center gap-2">
          <PresetSelector />
          <QuestDiagnosticsPill />
        </div>

        {/* Center Section: Unified Resets & Calibrations Segment */}
        <div className="flex items-center justify-center">
          <ResetActionsGroup />
        </div>

        {/* Right Section: View Layout Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium glass-pill glass-interactive active:scale-[0.97]"
            title="Toggle between Card and Row view"
          >
            <LayoutIcon size={14} />
            <span>
              {config?.homeLayout === 'table' ? 'Row View' : 'Card View'}
            </span>
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-grow flex flex-col gap-3">
        {/* Live Quest Standalone Telemetry HUD (Quest Mode) */}
        <QuestDiagnosticsCard />

        <div className="flex w-full gap-2 items-center px-3 h-5">
          <Typography
            color="secondary"
            id="toolbar-assigned_trackers"
            vars={{ count: trackers.length }}
            className="text-[12px] font-semibold tracking-tight"
          />
          <div className="bg-background-50/30 h-[1px] rounded-full flex-grow" />
        </div>
        {trackers.length === 0 && <HomeEmptyState />}

        {config?.homeLayout == 'default' && trackers.length > 0 && (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 px-5 my-5">
            {trackers.map(({ tracker, device }, index) => (
              <TrackerCard
                key={index}
                tracker={tracker}
                device={device}
                onClick={() => sendToSettings(tracker)}
                smol
                showUpdates
                interactable
                warning={
                  !!highlightedTrackers?.trackers.find(
                    (t) =>
                      t?.deviceId?.id === tracker.trackerId?.deviceId?.id &&
                      t?.trackerNum === tracker.trackerId?.trackerNum
                  ) && highlightedTrackers.step
                }
              />
            ))}
          </div>
        )}

        {config?.homeLayout === 'table' && trackers.length > 0 && (
          <div className="mx-2 overflow-x-auto">
            <TrackersTable
              flatTrackers={trackers}
              clickedTracker={(tracker) => sendToSettings(tracker)}
            />
          </div>
        )}

        {unassignedTrackers.length > 0 && (
          <>
            <div className="flex w-full gap-2 items-center px-4 h-5">
              <Typography
                color="secondary"
                id="toolbar-unassigned_trackers"
                vars={{ count: unassignedTrackers.length }}
              />
              <div className="bg-background-50 h-[2px] rounded-lg flex-grow" />
            </div>
            {config?.homeLayout == 'default' && (
              <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 px-5 my-3">
                {unassignedTrackers.map(({ tracker, device }, index) => (
                  <TrackerCard
                    key={index}
                    tracker={tracker}
                    device={device}
                    onClick={() => sendToSettings(tracker)}
                    smol
                    showUpdates
                    interactable
                    warning={
                      !!highlightedTrackers?.trackers.find(
                        (t) =>
                          t?.deviceId?.id === tracker.trackerId?.deviceId?.id &&
                          t?.trackerNum === tracker.trackerId?.trackerNum
                      ) && highlightedTrackers.step
                    }
                  />
                ))}
              </div>
            )}
            {config?.homeLayout === 'table' && (
              <div className="mx-2 overflow-x-auto">
                <TrackersTable
                  flatTrackers={unassignedTrackers}
                  clickedTracker={(tracker) => sendToSettings(tracker)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

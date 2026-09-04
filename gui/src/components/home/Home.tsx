import { useNavigate } from 'react-router-dom';
import { TrackerDataT } from 'solarxr-protocol';
import { useConfig } from '@/hooks/config';
import { Typography } from '@/components/commons/Typography';
import { TrackerCard } from '@/components/tracker/TrackerCard';
import { TrackersTable } from '@/components/tracker/TrackersTable';
import { useAtomValue } from 'jotai';
import {
  assignedTrackersAtom,
  unassignedTrackersAtom,
} from '@/store/app-store';
import { useTrackingChecklist } from '@/hooks/tracking-checklist';
import { useState, useRef, useEffect } from 'react';
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollContainerRef.current;
    const fade = fadeRef.current;
    if (!el || !fade) return;

    const onScroll = () => {
      const opacity = Math.min(el.scrollTop / 20, 1);
      fade.style.opacity = String(opacity);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

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
    <div className="relative h-full px-2 pt-3.5 pb-2 flex flex-col">
      <HomeSettingsModal open={settingsOpenState} />

      {/* macOS Docked Command Bar */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 mb-3 glass-panel-primary rounded-[14px] border border-white/[0.08] shadow-md">
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
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleLayout}
            className="apple-interactive flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] text-[11px] font-medium text-background-20 hover:text-background-10 cursor-pointer"
            title="Toggle between Card and Row view"
          >
            <LayoutIcon size={13} />
            <span>
              {config?.homeLayout === 'table' ? 'Row View' : 'Card View'}
            </span>
          </button>
        </div>
      </div>

      {/* Scroll Area Container with Non-blocking Native Momentum & Top Fade Scrim */}
      <div className="relative flex-grow min-h-0 flex flex-col">
        {/* Top Fade Gradient Scrim */}
        <div
          ref={fadeRef}
          className="pointer-events-none absolute top-0 left-0 right-0 h-10 z-20 transition-opacity duration-150 ease-out"
          style={{
            opacity: 0,
            background:
              'linear-gradient(to bottom, rgb(var(--background-80)) 0%, rgba(var(--background-80), 0.8) 40%, rgba(var(--background-80), 0.2) 75%, rgba(var(--background-80), 0) 100%)',
          }}
        />

        <div
          ref={scrollContainerRef}
          className="overflow-y-auto flex-grow flex flex-col gap-3 relative"
        >

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
    </div>
  );
}

import classNames from 'classnames';
import { useAtomValue } from 'jotai';
import { assignedTrackersAtom, showSidebarAtom } from '@/store/app-store';
import { useSidebarPushAnimation } from '@/hooks/sidebar-animation';
import { useCollapsibleHeight } from '@/hooks/collapsible-height';
import { useOperatingMode } from '@/hooks/operating-mode';
import { useTrackerPresets } from '@/hooks/presets';
import { useState, useEffect, useRef } from 'react';

export function QuestDiagnosticsCard() {
  const {
    floorAnchor,
    toggleFloorAnchor,
    triggerFloorCalibration,
    adjustFloorHeight,
    setFloorHeight,
    setCorrectionStrength,
    setFootPlantStrength,
    setCrouchCompensation,
    setOscRate,
    setChatboxEnabled,
    setChatboxOnlyMode,
    triggerChatboxStatus,
  } = useOperatingMode();

  const [isEditingElevation, setIsEditingElevation] = useState(false);
  const [elevationInputVal, setElevationInputVal] = useState('');
  const elevationInputRef = useRef<HTMLInputElement>(null);

  const handleStartEditElevation = () => {
    const currentCm = Math.round(floorAnchor.floorOffset * 100);
    setElevationInputVal(currentCm.toString());
    setIsEditingElevation(true);
  };

  useEffect(() => {
    if (isEditingElevation && elevationInputRef.current) {
      elevationInputRef.current.focus();
      elevationInputRef.current.select();
    }
  }, [isEditingElevation]);

  const handleCommitElevation = () => {
    setIsEditingElevation(false);
    const cleaned = elevationInputVal.trim();
    if (!cleaned) return;
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      const clamped = Math.max(-300, Math.min(300, parsed));
      setFloorHeight(clamped / 100);
    }
  };

  const handleElevationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommitElevation();
    } else if (e.key === 'Escape') {
      setIsEditingElevation(false);
    }
  };

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
      window.removeEventListener(
        'tray-elevation-delta',
        onDelta as EventListener
      );
      window.removeEventListener('tray-elevation-reset-event', onReset);
    };
  }, [adjustFloorHeight, setFloorHeight]);
  const assignedTrackers = useAtomValue(assignedTrackersAtom);
  const { activePreset } = useTrackerPresets();
  const [calibrating, setCalibrating] = useState(false);
  const [chatboxSent, setChatboxSent] = useState(false);

  const handleSendChatbox = () => {
    setChatboxSent(true);
    triggerChatboxStatus();
    setTimeout(() => setChatboxSent(false), 2000);
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

  const showSidebar = useAtomValue(showSidebarAtom);
  const [showTuning, setShowTuning] = useState(true);
  const tuningPanel = useCollapsibleHeight(showTuning);
  const [showCoreControls, setShowCoreControls] = useState(true);
  const corePanel = useCollapsibleHeight(showCoreControls);
  const [showFineTuning, setShowFineTuning] = useState(false);
  const [advancedTab, setAdvancedTab] = useState<'motion' | 'vrchat'>('motion');
  const finePanel = useCollapsibleHeight(showFineTuning);

  const rates = [30, 50, 60, 90] as const;
  const [selectedRateAnim, setSelectedRateAnim] = useState<{
    rate: number;
    key: number;
  } | null>(null);

  const handleRateClick = (r: (typeof rates)[number]) => {
    setOscRate(r);
    setSelectedRateAnim((prev) => ({
      rate: r,
      key: (prev?.key ?? 0) + 1,
    }));
  };

  const sidebarTabAnim = useSidebarPushAnimation(1);

  return (
    <div
      style={sidebarTabAnim.style}
      className={classNames(
        'w-full flex flex-col select-none liquid-glass-tab-strip',
        sidebarTabAnim.className
      )}
    >
      {/* Flush Header Strip matching getting started collapsed tab */}
      <button
        type="button"
        aria-expanded={showTuning}
        aria-controls="quest-telemetry-controls"
        onClick={() => setShowTuning((prev) => !prev)}
        className={classNames(
          'telemetry-strip__toggle w-full cursor-pointer py-1.5 flex items-center justify-between select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D97757]/60',
          showSidebar ? 'px-3.5 sm:px-4' : 'px-4 sm:px-6'
        )}
        title={
          showTuning ? 'Hide telemetry controls' : 'Show telemetry controls'
        }
      >
        <div className="flex items-center gap-2 min-w-0 flex-nowrap overflow-hidden">
          <span className="w-2 h-2 rounded-full bg-[#30D158] shrink-0" />
          <span className="font-serif text-[13.5px] text-background-10 font-normal truncate whitespace-nowrap shrink-0">
            Quest telemetry
          </span>
          <div
            className={classNames(
              'flex items-center gap-1.5 text-[11px] tnum text-background-30 font-sans whitespace-nowrap shrink-0 overflow-hidden transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',
              showTuning
                ? 'opacity-0 max-w-0 pointer-events-none -translate-x-2'
                : 'opacity-100 max-w-[400px] translate-x-0'
            )}
          >
            <span className="text-background-40/60">·</span>
            <span>
              {showSidebar ? '' : 'Floor: '}
              {floorAnchor.floorOffset >= 0 ? '+' : ''}
              {(floorAnchor.floorOffset * 100).toFixed(0)}cm
            </span>
            <span className="text-background-40/60">·</span>
            <span>
              {showSidebar ? '' : 'OSC: '}
              {floorAnchor.oscRate}Hz
            </span>
            <span className="text-background-40/60">·</span>
            <span
              className={
                floorAnchor.isAnchored ? 'text-[#30D158]' : 'text-amber-400'
              }
            >
              {floorAnchor.isAnchored ? 'Locked' : 'Free'}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded Controls Panel with Cinematic Liquid Glass Animation */}
      <div
        id="quest-telemetry-controls"
        ref={tuningPanel.ref}
        style={tuningPanel.style}
        onTransitionEnd={tuningPanel.onTransitionEnd}
        className={classNames(
          'collapsible-tab-grid',
          showTuning
            ? 'collapsible-tab-grid-expanded'
            : 'collapsible-tab-grid-collapsed'
        )}
      >
        <div className="overflow-hidden min-h-0">
          <div
            className={classNames(
              'w-full py-1.5 flex flex-col gap-1.5 border-t border-white/[0.035] liquid-glass-tab-panel collapsible-tab-content',
              showSidebar ? 'px-3.5 sm:px-4' : 'px-4 sm:px-6'
            )}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCoreControls((prev) => !prev)}
                aria-expanded={showCoreControls}
                aria-controls="quest-core-controls"
                className="telemetry-disclosure flex items-center gap-1.5 rounded-[6px] py-0.5 text-left text-[11px] font-semibold text-background-20 transition-colors hover:text-background-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/60"
              >
                <span>Tracking</span>
                <svg
                  className={classNames(
                    'h-3 w-3 transition-transform duration-200',
                    showCoreControls && 'rotate-180'
                  )}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <span className="h-px flex-1 bg-[var(--material-border-subtle)]" />
            </div>

            <div
              id="quest-core-controls"
              ref={corePanel.ref}
              style={corePanel.style}
              onTransitionEnd={corePanel.onTransitionEnd}
              className={classNames(
                'collapsible-tab-grid',
                showCoreControls
                  ? 'collapsible-tab-grid-expanded'
                  : 'collapsible-tab-grid-collapsed'
              )}
            >
              <div className="overflow-hidden min-h-0">
                {/* Top 4 Metric Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 overflow-hidden rounded-[12px] bg-background-70 border border-[var(--material-border-primary)] shadow-xs">
                  {/* Metric 1: Trackers Assigned */}
                  <div
                    className={classNames(
                      'col-span-full p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-stretch border-b border-[var(--material-border-subtle)] transition-[transform,opacity] duration-400 ease-[cubic-bezier(0.22,0.8,0.24,1)] motion-reduce:transition-none motion-reduce:transform-none',
                      showTuning
                        ? 'translate-x-0 opacity-100'
                        : '-translate-x-2 opacity-0'
                    )}
                  >
                    <div className="flex flex-col justify-center gap-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-background-10 font-sans">
                          Trackers assigned
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10.5px] tnum font-medium text-background-20 bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded-[5px]">
                            {activeAssigned} active ·{' '}
                            {activePreset?.targetCount || 5} target
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-[13.5px] font-medium text-background-10 tracking-tight truncate">
                          {activePreset?.name || 'Custom Setup'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center gap-1 border-t border-[var(--material-border-subtle)] pt-1.5 sm:border-t-0 sm:border-l sm:pl-2.5 sm:pt-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-background-10 font-sans">
                          Floor anchor
                        </span>
                        <span
                          className={classNames(
                            'text-[11px] font-semibold',
                            floorAnchor.isAnchored
                              ? 'text-[#30D158]'
                              : 'text-amber-500'
                          )}
                        >
                          {floorAnchor.isAnchored ? 'Locked' : 'Free'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={toggleFloorAnchor}
                          aria-pressed={floorAnchor.isAnchored}
                          className="min-h-7 rounded-[6px] px-1 text-[10px] font-medium text-background-20 hover:text-background-10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/60"
                        >
                          {floorAnchor.isAnchored
                            ? 'Release anchor'
                            : 'Lock anchor'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCalibrate}
                          disabled={calibrating}
                          className="min-h-7 px-3 py-1 rounded-[7px] text-[11px] font-medium bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] border border-black/[0.08] dark:border-white/[0.1] text-background-10 shadow-2xs transition-colors duration-150 active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          {calibrating ? 'Done' : 'Calibrate'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Metric 2: Live Elevation Scrubber */}
                  <div
                    className={classNames(
                      'p-2.5 flex flex-col justify-between border-b border-[var(--material-border-subtle)] sm:border-b-0 sm:border-r transition-[transform,opacity] duration-400 ease-[cubic-bezier(0.22,0.8,0.24,1)] motion-reduce:transition-none motion-reduce:transform-none',
                      showTuning
                        ? 'translate-x-0 opacity-100'
                        : 'translate-x-2 opacity-0'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-background-10 font-sans">
                          Elevation
                        </span>
                        {Math.round(floorAnchor.floorOffset * 100) !== 0 && (
                          <button
                            type="button"
                            onClick={() => setFloorHeight(0)}
                            className="min-h-6 text-[10px] px-2 py-0.5 rounded-[6px] font-medium bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-background-20 hover:text-[#D97757] border border-black/[0.06] dark:border-white/[0.08] transition-all cursor-pointer select-none active:scale-95"
                            title="Snap floor back to exact 0cm"
                          >
                            Reset 0
                          </button>
                        )}
                      </div>
                      {isEditingElevation ? (
                        <div className="flex items-center gap-1">
                          <input
                            ref={elevationInputRef}
                            type="text"
                            value={elevationInputVal}
                            onChange={(e) =>
                              setElevationInputVal(e.target.value)
                            }
                            onBlur={handleCommitElevation}
                            onKeyDown={handleElevationKeyDown}
                            className="w-16 px-1.5 py-0.5 text-[12px] tnum font-semibold text-center text-background-10 bg-black/[0.08] dark:bg-white/[0.12] rounded-[6px] border border-[#D97757] outline-none shadow-xs"
                            placeholder="0"
                            aria-label="Custom Elevation in centimeters"
                          />
                          <span className="text-[11px] font-semibold text-background-30">
                            cm
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleStartEditElevation}
                          className="text-[12.5px] tnum font-semibold text-background-10 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] hover:text-[#D97757] px-2 py-0.5 rounded-[6px] transition-all cursor-text select-none border border-transparent hover:border-black/[0.08] dark:hover:border-white/[0.12] active:scale-95 group flex items-center gap-1"
                          title="Click to type custom elevation in cm"
                        >
                          <span>
                            {floorAnchor.floorOffset >= 0 ? '+' : ''}
                            {(floorAnchor.floorOffset * 100).toFixed(0)} cm
                          </span>
                          <svg
                            className="w-2.5 h-2.5 text-background-30 opacity-0 group-hover:opacity-100 transition-opacity"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Scrubber with Apple Steppers */}
                    <div className="mt-1.5 flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => adjustFloorHeight(-1)}
                          className="h-7 w-7 rounded-[7px] bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] text-[11px] font-semibold text-background-20 hover:text-background-10 flex items-center justify-center border border-black/[0.06] dark:border-white/[0.08] shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/60"
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
                            onChange={(e) =>
                              setFloorHeight(parseFloat(e.target.value) / 100)
                            }
                            className="apple-slider"
                            aria-label="Floor Elevation Offset"
                          />
                          <div
                            className="absolute w-1 h-2.5 bg-black/40 dark:bg-white/40 pointer-events-none rounded-full"
                            style={{
                              left: `${((0 - -150) / 350) * 100}%`,
                              transform: 'translateX(-50%)',
                            }}
                            title="0cm Ground Level"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => adjustFloorHeight(1)}
                          className="h-7 w-7 rounded-[7px] bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] text-[11px] font-semibold text-background-20 hover:text-background-10 flex items-center justify-center border border-black/[0.06] dark:border-white/[0.08] shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/60"
                          title="Raise elevation by 1cm"
                        >
                          +1
                        </button>
                      </div>
                      <div className="flex justify-between text-[9.5px] tnum text-background-30 font-medium">
                        <span>-150cm</span>
                        <span className="font-semibold text-background-20">
                          0cm
                        </span>
                        <span>+200cm</span>
                      </div>
                    </div>
                  </div>

                  {/* Metric 3: OSC Output Rate */}
                  <div
                    className={classNames(
                      'p-2.5 flex flex-col justify-between transition-[transform,opacity] duration-400 ease-[cubic-bezier(0.22,0.8,0.24,1)] motion-reduce:transition-none motion-reduce:transform-none',
                      showTuning
                        ? 'translate-x-0 opacity-100'
                        : '-translate-x-2 opacity-0'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-background-10 font-sans">
                        OSC output rate
                      </span>
                    </div>
                    <div
                      className="mt-1.5 flex items-center justify-between gap-1 p-0.5 rounded-[10px] bg-black/[0.04] dark:bg-black/40 border border-black/[0.06] dark:border-white/[0.08] overflow-hidden"
                      role="group"
                      aria-label="OSC output rate"
                    >
                      {rates.map((r, idx) => {
                        const isSelected = floorAnchor.oscRate === r;
                        const isJustSelected = selectedRateAnim?.rate === r;
                        const isOtherBouncing =
                          selectedRateAnim !== null &&
                          selectedRateAnim.rate !== r;
                        const selectedIdx = selectedRateAnim
                          ? rates.indexOf(
                              selectedRateAnim.rate as (typeof rates)[number]
                            )
                          : -1;
                        const isLeftOfSelected =
                          selectedIdx >= 0 && idx < selectedIdx;
                        const isRightOfSelected =
                          selectedIdx >= 0 && idx > selectedIdx;
                        const distance =
                          selectedIdx >= 0 ? Math.abs(idx - selectedIdx) : 0;
                        const bounceAmp =
                          distance > 0
                            ? Math.max(0.2, Math.pow(0.55, distance - 1))
                            : 1;
                        const bounceDelay = `${Math.max(0, (distance - 1) * 35)}ms`;

                        return (
                          <button
                            key={`${r}_${selectedRateAnim?.key ?? 0}`}
                            type="button"
                            onClick={() => handleRateClick(r)}
                            aria-pressed={isSelected}
                            aria-label={`Set OSC output rate to ${r} hertz`}
                            style={
                              isOtherBouncing
                                ? ({
                                    '--push-amp': bounceAmp.toFixed(2),
                                    animationDelay: bounceDelay,
                                  } as React.CSSProperties)
                                : undefined
                            }
                            className={classNames(
                              'flex-1 py-1.5 rounded-[7px] border border-transparent text-[11px] tnum font-semibold transition-colors duration-150 cursor-pointer select-none active:scale-[0.98]',
                              isSelected
                                ? 'bg-background-50/30 text-accent-background-20 border-accent-background-20/35 shadow-xs'
                                : 'text-background-30 hover:text-background-10 hover:bg-black/[0.02] dark:hover:bg-white/[0.04]',
                              isJustSelected && 'animate-preset-pop',
                              isOtherBouncing &&
                                isLeftOfSelected &&
                                'animate-preset-push-left',
                              isOtherBouncing &&
                                isRightOfSelected &&
                                'animate-preset-push-right'
                            )}
                          >
                            {r}Hz
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFineTuning((prev) => !prev)}
                aria-expanded={showFineTuning}
                aria-controls="quest-fine-tuning"
                className="telemetry-disclosure flex items-center gap-1.5 rounded-[6px] py-0.5 text-left text-[11px] font-semibold text-background-20 transition-colors hover:text-background-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/60"
              >
                <span>Advanced</span>
                <svg
                  className={classNames(
                    'h-3 w-3 transition-transform duration-200',
                    showFineTuning && 'rotate-180'
                  )}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {!showFineTuning && (
                <span className="ml-auto text-[10px] tnum text-background-30">
                  {Math.round(floorAnchor.correctionStrength * 100)}% correction
                  · {Math.round(floorAnchor.footPlantStrength * 100)}% foot lock
                </span>
              )}
              <span className="h-px flex-1 bg-[var(--material-border-subtle)]" />
            </div>

            {/* Advanced Tuning Drawer */}
            <div
              id="quest-fine-tuning"
              ref={finePanel.ref}
              style={finePanel.style}
              onTransitionEnd={finePanel.onTransitionEnd}
              className={classNames(
                'collapsible-tab-grid transition-[transform,opacity] duration-400 ease-[cubic-bezier(0.22,0.8,0.24,1)] motion-reduce:transition-none motion-reduce:transform-none',
                showFineTuning
                  ? 'collapsible-tab-grid-expanded translate-y-0 opacity-100'
                  : 'collapsible-tab-grid-collapsed translate-y-2 opacity-0'
              )}
            >
              <div className="overflow-hidden min-h-0">
                <div className="overflow-hidden rounded-[12px] bg-background-70 border border-[var(--material-border-primary)] shadow-xs transition-[transform,opacity] duration-400 ease-[cubic-bezier(0.22,0.8,0.24,1)] motion-reduce:transition-none motion-reduce:transform-none">
                  <div
                    className="telemetry-tabs grid grid-cols-2 gap-0.5 border-b border-[var(--material-border-subtle)] bg-black/[0.025] p-1 dark:bg-black/20"
                    role="tablist"
                    aria-orientation="horizontal"
                    aria-label="Advanced telemetry settings"
                  >
                    <button
                      type="button"
                      role="tab"
                      id="advanced-telemetry-tab-motion"
                      aria-controls="advanced-telemetry-panel-motion"
                      aria-selected={advancedTab === 'motion'}
                      tabIndex={advancedTab === 'motion' ? 0 : -1}
                      onKeyDown={(event) => {
                        if (
                          event.key === 'ArrowRight' ||
                          event.key === 'ArrowDown'
                        ) {
                          event.preventDefault();
                          setAdvancedTab('vrchat');
                          document
                            .getElementById('advanced-telemetry-tab-vrchat')
                            ?.focus();
                        }
                        if (event.key === 'Home' || event.key === 'End') {
                          event.preventDefault();
                          const nextTab =
                            event.key === 'Home' ? 'motion' : 'vrchat';
                          setAdvancedTab(nextTab);
                          document
                            .getElementById(`advanced-telemetry-tab-${nextTab}`)
                            ?.focus();
                        }
                      }}
                      onClick={() => setAdvancedTab('motion')}
                      className={classNames(
                        'telemetry-tab min-h-7 rounded-[7px] text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/60',
                        advancedTab === 'motion'
                          ? 'bg-white/[0.08] text-background-10 shadow-xs'
                          : 'text-background-30 hover:text-background-10 hover:bg-white/[0.04]'
                      )}
                    >
                      Motion
                    </button>
                    <button
                      type="button"
                      role="tab"
                      id="advanced-telemetry-tab-vrchat"
                      aria-controls="advanced-telemetry-panel-vrchat"
                      aria-selected={advancedTab === 'vrchat'}
                      tabIndex={advancedTab === 'vrchat' ? 0 : -1}
                      onKeyDown={(event) => {
                        if (
                          event.key === 'ArrowLeft' ||
                          event.key === 'ArrowUp'
                        ) {
                          event.preventDefault();
                          setAdvancedTab('motion');
                          document
                            .getElementById('advanced-telemetry-tab-motion')
                            ?.focus();
                        }
                        if (event.key === 'Home' || event.key === 'End') {
                          event.preventDefault();
                          const nextTab =
                            event.key === 'Home' ? 'motion' : 'vrchat';
                          setAdvancedTab(nextTab);
                          document
                            .getElementById(`advanced-telemetry-tab-${nextTab}`)
                            ?.focus();
                        }
                      }}
                      onClick={() => setAdvancedTab('vrchat')}
                      className={classNames(
                        'telemetry-tab min-h-7 rounded-[7px] text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/60',
                        advancedTab === 'vrchat'
                          ? 'bg-white/[0.08] text-background-10 shadow-xs'
                          : 'text-background-30 hover:text-background-10 hover:bg-white/[0.04]'
                      )}
                    >
                      VRChat
                    </button>
                  </div>
                  {/* Card A: Kinematics & Floor Dynamics */}
                  <div
                    id="advanced-telemetry-panel-motion"
                    role="tabpanel"
                    aria-labelledby="advanced-telemetry-tab-motion"
                    className={classNames(
                      'p-2.5 flex flex-col justify-between gap-2',
                      advancedTab !== 'motion' && 'hidden'
                    )}
                  >
                    {/* Slider 1: Correction Strength */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-background-20 font-medium">
                          Correction strength
                        </span>
                        <span className="tnum font-semibold text-[#D97757] text-[11.5px] bg-[#D97757]/10 px-1.5 py-0.5 rounded-[5px]">
                          {Math.round(floorAnchor.correctionStrength * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(floorAnchor.correctionStrength * 100)}
                        onChange={(e) =>
                          setCorrectionStrength(Number(e.target.value) / 100)
                        }
                        className="apple-slider"
                        aria-label="Correction Strength"
                      />
                    </div>

                    {/* Slider 2: Foot Plant Strength */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-background-20 font-medium">
                          Foot plant lock
                        </span>
                        <span className="tnum font-semibold text-[#D97757] text-[11.5px] bg-[#D97757]/10 px-1.5 py-0.5 rounded-[5px]">
                          {Math.round(floorAnchor.footPlantStrength * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(floorAnchor.footPlantStrength * 100)}
                        onChange={(e) =>
                          setFootPlantStrength(Number(e.target.value) / 100)
                        }
                        className="apple-slider"
                        aria-label="Foot Plant Lock"
                      />
                    </div>

                    <div className="h-[1px] bg-black/[0.05] dark:bg-white/[0.06]" />

                    {/* Toggle: Crouch Compensation */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[11.5px] font-medium text-background-10">
                          Crouch compensation
                        </span>
                        <span className="text-[10px] text-background-20">
                          Preserve foot placement when crouching
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setCrouchCompensation(!floorAnchor.crouchCompensation)
                        }
                        className={classNames(
                          'w-[38px] h-[22px] rounded-full p-[2.5px] transition-colors duration-200 relative flex items-center border border-black/[0.08] dark:border-white/[0.1] active:scale-95 cursor-pointer shrink-0',
                          floorAnchor.crouchCompensation
                            ? 'bg-[#30D158]'
                            : 'bg-black/10 dark:bg-white/10'
                        )}
                        aria-label="Toggle Crouch Compensation"
                        aria-pressed={floorAnchor.crouchCompensation}
                      >
                        <div
                          className={classNames(
                            'w-[17px] h-[17px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
                            floorAnchor.crouchCompensation
                              ? 'translate-x-[16px]'
                              : 'translate-x-0'
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Card B: VRChat OSC Telemetry & Social Integration */}
                  <div
                    id="advanced-telemetry-panel-vrchat"
                    role="tabpanel"
                    aria-labelledby="advanced-telemetry-tab-vrchat"
                    className={classNames(
                      'p-2.5 flex flex-col justify-between gap-2',
                      advancedTab !== 'vrchat' && 'hidden'
                    )}
                  >
                    {/* Toggle & Button: VRChat Chatbox Status HUD */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11.5px] font-medium text-background-10">
                          Battery status in chatbox
                        </span>
                        <span className="text-[10px] text-background-20 truncate">
                          Share tracker battery levels in VRChat
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleSendChatbox}
                          className={classNames(
                            'px-2.5 py-1 rounded-[7px] text-[10.5px] font-medium transition-colors duration-150 active:scale-95 cursor-pointer shadow-2xs',
                            chatboxSent
                              ? 'bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30 font-semibold'
                              : 'bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.09] text-background-10 border border-black/[0.08] dark:border-white/[0.1]'
                          )}
                          title="Broadcast current tracker battery levels into VRChat chatbox now"
                        >
                          {chatboxSent ? '✓ Sent!' : 'Send Now'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setChatboxEnabled(!floorAnchor.chatboxEnabled)
                          }
                          className={classNames(
                            'w-[38px] h-[22px] rounded-full p-[2.5px] transition-colors duration-200 relative flex items-center border border-black/[0.08] dark:border-white/[0.1] active:scale-95 cursor-pointer',
                            floorAnchor.chatboxEnabled
                              ? 'bg-[#30D158]'
                              : 'bg-black/10 dark:bg-white/10'
                          )}
                          title="Toggle automatic periodic chatbox battery updates"
                          aria-label="Toggle VRChat Chatbox Battery HUD"
                          aria-pressed={floorAnchor.chatboxEnabled}
                        >
                          <div
                            className={classNames(
                              'w-[17px] h-[17px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
                              floorAnchor.chatboxEnabled
                                ? 'translate-x-[16px]'
                                : 'translate-x-0'
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="h-[1px] bg-black/[0.05] dark:bg-white/[0.06]" />

                    {/* Toggle: Chat-Only Mode (Non-Tracker Playtime) */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11.5px] font-medium text-background-10">
                            Chat-only mode
                          </span>
                          <span
                            className={classNames(
                              'px-1.5 py-0.5 rounded-[5px] text-[9px] font-semibold uppercase tracking-wider',
                              floorAnchor.chatboxOnlyMode
                                ? 'bg-[#0A84FF]/25 text-[#0A84FF] dark:text-[#5AC8FA] border border-[#0A84FF]/30'
                                : 'bg-black/[0.05] dark:bg-white/[0.06] text-background-30'
                            )}
                          >
                            {floorAnchor.chatboxOnlyMode
                              ? 'FBT Muted'
                              : 'Full Body'}
                          </span>
                        </div>
                        <span className="text-[10px] text-background-20 truncate">
                          Mutes tracker OSC; chat bubble stays active
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setChatboxOnlyMode(!floorAnchor.chatboxOnlyMode)
                        }
                        className={classNames(
                          'w-[38px] h-[22px] rounded-full p-[2.5px] transition-colors duration-200 relative flex items-center border border-black/[0.08] dark:border-white/[0.1] active:scale-95 cursor-pointer shrink-0',
                          floorAnchor.chatboxOnlyMode
                            ? 'bg-[#0A84FF]'
                            : 'bg-black/10 dark:bg-white/10'
                        )}
                        title="Toggle Chat-Only Mode (Mutes tracker OSC, keeps chatbox active)"
                        aria-label="Toggle Chat-Only Mode"
                        aria-pressed={floorAnchor.chatboxOnlyMode}
                      >
                        <div
                          className={classNames(
                            'w-[17px] h-[17px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
                            floorAnchor.chatboxOnlyMode
                              ? 'translate-x-[16px]'
                              : 'translate-x-0'
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

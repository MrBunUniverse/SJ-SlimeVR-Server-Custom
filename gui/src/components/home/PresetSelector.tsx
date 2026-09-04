import { useState } from 'react';
import { useTrackerPresets } from '@/hooks/presets';
import { Typography } from '@/components/commons/Typography';
import { BaseModal } from '@/components/commons/BaseModal';
import { Button } from '@/components/commons/Button';
import classNames from 'classnames';

export function PresetSelector() {
  const {
    presets,
    activePreset,
    activePresetId,
    setActivePresetId,
    createPreset,
    duplicatePreset,
    deletePreset,
  } = useTrackerPresets();

  const [isOpen, setIsOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  return (
    <>
      <div className="relative select-none">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={classNames(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150',
            'glass-pill glass-interactive active:scale-[0.97]'
          )}
        >
          <span className="text-accent-background-20 text-[11px]">✦</span>
          <Typography className="text-[12px] font-medium tracking-tight">
            {activePreset.name}
          </Typography>
          <span className="text-background-30 text-[10px] font-normal">▼</span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 top-9 w-64 p-2 z-50 glass-popover rounded-2xl shadow-2xl flex flex-col gap-1 animate-fade-in">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-background-30 uppercase tracking-wider">
                Tracker Presets
              </div>

              {presets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => {
                    setActivePresetId(preset.id);
                    setIsOpen(false);
                  }}
                  className={classNames(
                    'flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 text-[12px]',
                    preset.id === activePresetId
                      ? 'bg-accent-background-30/20 text-accent-background-20 font-semibold border border-accent-background-30/30'
                      : 'hover:bg-background-50/20 text-background-10'
                  )}
                >
                  <div className="flex flex-col">
                    <span className="leading-tight">{preset.name}</span>
                    <span className="text-[10px] text-background-30 font-normal">
                      {preset.description}
                    </span>
                  </div>
                  {preset.id === activePresetId && (
                    <span className="text-accent-background-20 text-xs">✓</span>
                  )}
                </div>
              ))}

              <div className="pt-1.5 mt-1 border-t border-background-50/30 flex justify-between px-2 py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsManageOpen(true);
                  }}
                  className="text-[11px] text-accent-background-20 hover:text-accent-background-10 font-medium tracking-tight"
                >
                  Manage Presets...
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <BaseModal
        isOpen={isManageOpen}
        onRequestClose={() => setIsManageOpen(false)}
        className="max-w-md w-full glass-panel-strong rounded-3xl p-6 shadow-2xl border border-white/15"
      >
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-background-50/30 pb-3">
            <Typography
              variant="section-title"
              className="text-[16px] font-bold tracking-tight"
            >
              Manage Tracker Presets
            </Typography>
            <button
              onClick={() => setIsManageOpen(false)}
              className="text-background-30 hover:text-background-10 text-lg px-2"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between p-3 rounded-xl bg-background-50/20 border border-white/5"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-[13px] text-background-10">
                    {preset.name}
                  </span>
                  <span className="text-[11px] text-background-30">
                    {preset.description} ({preset.targetCount} trackers)
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => duplicatePreset(preset.id)}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-background-50/30 hover:bg-background-50/50 text-background-20 transition-colors"
                  >
                    Duplicate
                  </button>
                  {presets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deletePreset(preset.id)}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-status-critical/20 hover:bg-status-critical/30 text-status-critical transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2 border-t border-background-50/30">
            <input
              type="text"
              placeholder="New preset name..."
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="flex-grow px-3 py-2 rounded-xl bg-background-60/40 border border-white/10 text-[12px] text-background-10 focus:outline-none focus:border-accent-background-20"
            />
            <Button
              variant="primary"
              disabled={!newPresetName.trim()}
              onClick={() => {
                if (newPresetName.trim()) {
                  createPreset(newPresetName.trim(), 'Custom tracker layout', [
                    'waist',
                    'left_foot',
                    'right_foot',
                  ]);
                  setNewPresetName('');
                }
              }}
              className="text-[12px] px-4 py-2"
            >
              + Create
            </Button>
          </div>
        </div>
      </BaseModal>
    </>
  );
}

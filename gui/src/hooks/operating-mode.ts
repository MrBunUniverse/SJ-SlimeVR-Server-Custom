import { atom, useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useMemo } from 'react';

export type OperatingMode = 'quest_standalone' | 'pcvr';

export interface FloorAnchorState {
  isAnchored: boolean;
  floorOffset: number;
  lastCalibrated: number | null;
}

export const operatingModeAtom = atomWithStorage<OperatingMode>(
  'slimevr_operating_mode',
  'quest_standalone'
);

export const floorAnchorStateAtom = atom<FloorAnchorState>({
  isAnchored: true,
  floorOffset: 0,
  lastCalibrated: null,
});

export function useOperatingMode() {
  const [mode, setMode] = useAtom(operatingModeAtom);
  const [floorAnchor, setFloorAnchor] = useAtom(floorAnchorStateAtom);

  const isQuestStandalone = useMemo(() => mode === 'quest_standalone', [mode]);
  const isPCVR = useMemo(() => mode === 'pcvr', [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'quest_standalone' ? 'pcvr' : 'quest_standalone'));
  };

  const triggerFloorCalibration = () => {
    setFloorAnchor({
      isAnchored: true,
      floorOffset: 0,
      lastCalibrated: Date.now(),
    });
  };

  return {
    mode,
    setMode,
    toggleMode,
    isQuestStandalone,
    isPCVR,
    floorAnchor,
    setFloorAnchor,
    triggerFloorCalibration,
  };
}

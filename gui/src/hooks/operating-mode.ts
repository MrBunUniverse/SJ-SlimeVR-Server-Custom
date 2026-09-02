import { atom, useAtom, useAtomValue } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useMemo } from 'react';
import { useWebsocketAPI } from '@/hooks/websocket-api';
import { bonesAtom } from '@/store/app-store';
import {
  RpcMessage,
  LegTweaksTmpChangeT,
  LegTweaksSettingsT,
  ChangeSettingsRequestT,
  ModelSettingsT,
  ModelTogglesT,
  SkeletonResetAllRequestT,
  SkeletonHeightT,
  BodyPart,
} from 'solarxr-protocol';

export type OperatingMode = 'quest_standalone' | 'pcvr';

export type TrackingProfileName = 'STANDING' | 'CROUCHING' | 'SITTING' | 'CUSTOM';

export type RecenterBehaviorMode =
  | 'KEEP_FLOOR'
  | 'REANCHOR_ON_RECENTER'
  | 'REANCHOR_ON_FULL_RESET';

export type AnchorStatus = 'CALIBRATED' | 'LOCKED' | 'FLOATING' | 'STALE';

export interface QuestStandaloneState {
  isAnchored: boolean;
  floorOffset: number; // in meters
  correctionStrength: number; // 0.0 to 1.0
  footPlantStrength: number;
  skatingCorrectionStrength: number;
  crouchCompensation: boolean;
  crouchStrength: number;
  hmdVerticalOffset: number; // in meters
  oscRate: number; // 30, 50, 60, 90 Hz
  recenterBehavior: RecenterBehaviorMode;
  activeProfile: TrackingProfileName;
  lastCalibrated: number | null;
  anchorStatus: AnchorStatus;
}

export const operatingModeAtom = atomWithStorage<OperatingMode>(
  'slimevr_operating_mode',
  'quest_standalone'
);

export const questStandaloneStateAtom = atomWithStorage<QuestStandaloneState>(
  'slimevr_quest_standalone_state_v2',
  {
    isAnchored: true,
    floorOffset: 0.0,
    correctionStrength: 0.5,
    footPlantStrength: 0.5,
    skatingCorrectionStrength: 0.5,
    crouchCompensation: true,
    crouchStrength: 0.5,
    hmdVerticalOffset: 0.0,
    oscRate: 60,
    recenterBehavior: 'REANCHOR_ON_FULL_RESET',
    activeProfile: 'STANDING',
    lastCalibrated: null,
    anchorStatus: 'LOCKED',
  }
);

export function useOperatingMode() {
  const [mode, setMode] = useAtom(operatingModeAtom);
  const [state, setState] = useAtom(questStandaloneStateAtom);
  const { sendRPCPacket } = useWebsocketAPI();
  const bones = useAtomValue(bonesAtom);

  const isQuestStandalone = useMemo(() => mode === 'quest_standalone', [mode]);
  const isPCVR = useMemo(() => mode === 'pcvr', [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'quest_standalone' ? 'pcvr' : 'quest_standalone'));
  };

  const syncToServer = (updates: Partial<QuestStandaloneState>) => {
    const next = { ...state, ...updates };

    // Update LegTweaks runtime & config
    const tempSettings = new LegTweaksTmpChangeT();
    tempSettings.floorClip = next.isAnchored;
    tempSettings.footPlant = next.footPlantStrength > 0.05;
    tempSettings.skatingCorrection = next.skatingCorrectionStrength > 0.05;
    sendRPCPacket(RpcMessage.LegTweaksTmpChange, tempSettings);

    const settingsRequest = new ChangeSettingsRequestT();
    const modelSettings = new ModelSettingsT();
    const toggles = new ModelTogglesT();
    toggles.floorClip = next.isAnchored;
    toggles.footPlant = next.footPlantStrength > 0.05;
    toggles.skatingCorrection = next.skatingCorrectionStrength > 0.05;
    modelSettings.toggles = toggles;

    const legTweaks = new LegTweaksSettingsT();
    legTweaks.correctionStrength = next.correctionStrength;
    modelSettings.legTweaks = legTweaks;

    const skeletonHeight = new SkeletonHeightT();
    skeletonHeight.floorHeight = next.floorOffset;
    modelSettings.skeletonHeight = skeletonHeight;

    settingsRequest.modelSettings = modelSettings;
    sendRPCPacket(RpcMessage.ChangeSettingsRequest, settingsRequest);
  };

  const toggleFloorAnchor = () => {
    const nextState = !state.isAnchored;
    const nextStatus: AnchorStatus = nextState ? 'LOCKED' : 'FLOATING';

    syncToServer({ isAnchored: nextState, anchorStatus: nextStatus });
    setState((prev) => ({
      ...prev,
      isAnchored: nextState,
      anchorStatus: nextStatus,
      lastCalibrated: Date.now(),
    }));
  };

  const setFloorHeight = (heightMeters: number) => {
    const clamped = Math.max(-3.0, Math.min(3.0, heightMeters));
    syncToServer({ floorOffset: clamped });
    setState((prev) => ({
      ...prev,
      floorOffset: clamped,
      anchorStatus: prev.isAnchored ? 'CALIBRATED' : 'FLOATING',
      lastCalibrated: Date.now(),
    }));
  };

  const adjustFloorHeight = (deltaCm: number) => {
    const newOffset = state.floorOffset + deltaCm / 100;
    setFloorHeight(newOffset);
  };

  const triggerFloorCalibration = () => {
    let calculatedOffset = 0;
    const leftFoot = bones.find(
      (b) =>
        b.bodyPart === BodyPart.LEFT_FOOT ||
        b.bodyPart === BodyPart.LEFT_LOWER_LEG
    );
    const rightFoot = bones.find(
      (b) =>
        b.bodyPart === BodyPart.RIGHT_FOOT ||
        b.bodyPart === BodyPart.RIGHT_LOWER_LEG
    );

    if (
      leftFoot?.headPositionG?.y !== undefined &&
      rightFoot?.headPositionG?.y !== undefined
    ) {
      calculatedOffset = Math.min(
        leftFoot.headPositionG.y,
        rightFoot.headPositionG.y
      );
    }

    syncToServer({ isAnchored: true, floorOffset: Math.max(0, calculatedOffset), anchorStatus: 'CALIBRATED' });

    sendRPCPacket(
      RpcMessage.SkeletonResetAllRequest,
      new SkeletonResetAllRequestT()
    );

    setState((prev) => ({
      ...prev,
      isAnchored: true,
      floorOffset: Math.max(0, calculatedOffset),
      anchorStatus: 'CALIBRATED',
      lastCalibrated: Date.now(),
    }));
  };

  const setCorrectionStrength = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    syncToServer({ correctionStrength: clamped });
    setState((prev) => ({ ...prev, correctionStrength: clamped }));
  };

  const setFootPlantStrength = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    syncToServer({ footPlantStrength: clamped });
    setState((prev) => ({ ...prev, footPlantStrength: clamped }));
  };

  const setSkatingCorrectionStrength = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    syncToServer({ skatingCorrectionStrength: clamped });
    setState((prev) => ({ ...prev, skatingCorrectionStrength: clamped }));
  };

  const setCrouchCompensation = (val: boolean) => {
    setState((prev) => ({ ...prev, crouchCompensation: val }));
  };

  const setHmdVerticalOffset = (valMeters: number) => {
    setState((prev) => ({ ...prev, hmdVerticalOffset: valMeters }));
  };

  const setOscRate = (rate: number) => {
    setState((prev) => ({ ...prev, oscRate: rate }));
  };

  const setRecenterBehavior = (mode: RecenterBehaviorMode) => {
    setState((prev) => ({ ...prev, recenterBehavior: mode }));
  };

  const selectProfile = (profile: TrackingProfileName) => {
    let profileSettings: Partial<QuestStandaloneState> = {
      activeProfile: profile,
    };

    if (profile === 'STANDING') {
      profileSettings = {
        activeProfile: 'STANDING',
        isAnchored: true,
        correctionStrength: 0.5,
        footPlantStrength: 0.5,
        skatingCorrectionStrength: 0.5,
        crouchCompensation: true,
        anchorStatus: 'LOCKED',
      };
    } else if (profile === 'CROUCHING') {
      profileSettings = {
        activeProfile: 'CROUCHING',
        isAnchored: true,
        correctionStrength: 0.7,
        footPlantStrength: 0.7,
        skatingCorrectionStrength: 0.3,
        crouchCompensation: true,
        anchorStatus: 'LOCKED',
      };
    } else if (profile === 'SITTING') {
      profileSettings = {
        activeProfile: 'SITTING',
        isAnchored: false,
        correctionStrength: 0.2,
        footPlantStrength: 0.0,
        skatingCorrectionStrength: 0.0,
        crouchCompensation: false,
        anchorStatus: 'FLOATING',
      };
    }

    syncToServer(profileSettings);
    setState((prev) => ({ ...prev, ...profileSettings }));
  };

  const resetToDefaults = () => {
    selectProfile('STANDING');
  };

  return {
    mode,
    isQuestStandalone,
    isPCVR,
    toggleMode,
    floorAnchor: state,
    toggleFloorAnchor,
    triggerFloorCalibration,
    adjustFloorHeight,
    setFloorHeight,
    setCorrectionStrength,
    setFootPlantStrength,
    setSkatingCorrectionStrength,
    setCrouchCompensation,
    setHmdVerticalOffset,
    setOscRate,
    setRecenterBehavior,
    selectProfile,
    resetToDefaults,
  };
}

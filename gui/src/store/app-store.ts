import { atom } from 'jotai';
import {
  BodyPart,
  BoneT,
  DataFeedUpdateT,
  DeviceDataT,
  TrackerDataT,
  TrackerStatus,
} from 'solarxr-protocol';
import { selectAtom } from 'jotai/utils';
import { isEqual } from '@react-hookz/deep-equal';
import { FEET_BODY_PARTS, FINGER_BODY_PARTS } from '@/hooks/body-parts';

import { demoModeAtom, DEMO_TRACKERS_SET } from './demo-trackers';

export interface FlatDeviceTracker {
  device?: DeviceDataT;
  tracker: TrackerDataT;
}

export const ignoredTrackersAtom = atom(new Set<string>());

export const datafeedAtom = atom(new DataFeedUpdateT());

export const bonesAtom = atom<BoneT[]>([]);

export const devicesAtom = selectAtom(
  datafeedAtom,
  (datafeed) => datafeed.devices,
  isEqual
);

export const serverGuardsAtom = selectAtom(
  datafeedAtom,
  (datafeed) => datafeed.serverGuards,
  isEqual
);

export const flatTrackersAtom = atom((get) => {
  const isDemo = get(demoModeAtom);
  const devices = get(devicesAtom);

  const realTrackers = devices.flatMap<FlatDeviceTracker>((device) =>
    device.trackers.map((tracker) => ({ tracker, device }))
  );

  // If demo mode is active and there are no real trackers, return the realistic mock trackers
  if (isDemo && realTrackers.length === 0) {
    return DEMO_TRACKERS_SET;
  }

  return realTrackers;
});

export const hasRealTrackersAtom = atom((get) => {
  const devices = get(devicesAtom);
  return devices.some((device) => device.trackers.length > 0);
});

export const assignedTrackersAtom = atom((get) => {
  const trackers = get(flatTrackersAtom);
  return trackers.filter(({ tracker }) => tracker.info?.bodyPart !== BodyPart.NONE);
});

export const unassignedTrackersAtom = atom((get) => {
  const trackers = get(flatTrackersAtom);
  return trackers.filter(({ tracker }) => tracker.info?.bodyPart === BodyPart.NONE);
});

export const connectedTrackersAtom = atom((get) => {
  const trackers = get(flatTrackersAtom);
  return trackers.filter(
    ({ tracker }) => tracker.status !== TrackerStatus.DISCONNECTED
  );
});

export const connectedIMUTrackersAtom = atom((get) => {
  const trackers = get(connectedTrackersAtom);
  return trackers.filter(({ tracker }) => tracker.info?.isImu);
});

export const connectedIMUCountAtom = selectAtom(
  connectedIMUTrackersAtom,
  (trackers) => trackers.length
);

export const computedTrackersAtom = selectAtom(
  datafeedAtom,
  (datafeed) => datafeed.syntheticTrackers.map((tracker) => ({ tracker })),
  isEqual
);

export const hasHMDTrackerAtom = atom((get) => {
  const trackers = get(flatTrackersAtom);

  return trackers.some(
    (tracker) =>
      tracker.tracker.info?.bodyPart === BodyPart.HEAD &&
      (tracker.tracker.info.isHmd || tracker.tracker.position?.y !== undefined)
  );
});

export const stayAlignedPoseAtom = selectAtom(
  datafeedAtom,
  (datafeed) => datafeed.stayAlignedPose,
  isEqual
);

export const trackerFromIdAtom = ({
  trackerNum,
  deviceId,
}: {
  trackerNum: string | number | undefined;
  deviceId: string | number | undefined;
}) =>
  selectAtom(
    atom((get) =>
      get(flatTrackersAtom).find(
        ({ tracker }) =>
          trackerNum &&
          deviceId &&
          tracker?.trackerId?.trackerNum == trackerNum &&
          tracker?.trackerId?.deviceId?.id == deviceId
      )
    ),
    (a) => a,
    isEqual
  );

export const feetAssignedTrackers = atom((get) =>
  get(assignedTrackersAtom).some(
    (t) => t.tracker.info?.bodyPart && FEET_BODY_PARTS.includes(t.tracker.info.bodyPart)
  )
);

export const fingerAssignedTrackers = atom((get) =>
  get(assignedTrackersAtom).some(
    (t) =>
      t.tracker.info?.bodyPart && FINGER_BODY_PARTS.includes(t.tracker.info.bodyPart)
  )
);

const SIDEBAR_STORAGE_KEY = 'slimevr-show-sidebar';
const initialSidebarState =
  typeof window !== 'undefined'
    ? localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
    : false;

export interface SidebarAnimationState {
  direction: 'left' | 'right';
  key: number;
  timestamp?: number;
}

export const sidebarAnimationAtom = atom<SidebarAnimationState | null>(null);

export interface CollapsibleTabAnimationState {
  direction: 'down' | 'up';
  key: number;
  timestamp: number;
}

export const collapsibleTabAnimationAtom = atom<CollapsibleTabAnimationState | null>(
  null
);

export const triggerCollapsibleTabAnimationAtom = atom(
  null,
  (_get, set, direction: 'down' | 'up') => {
    set(collapsibleTabAnimationAtom, (prev) => ({
      direction,
      key: (prev?.key ?? 0) + 1,
      timestamp: Date.now(),
    }));
  }
);

export interface CardMorphOrigin {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius?: string;
  trackerIdKey?: string;
}

export const cardMorphOriginAtom = atom<CardMorphOrigin | null>(null);

const baseShowSidebarAtom = atom<boolean>(initialSidebarState);

export const showSidebarAtom = atom(
  (get) => get(baseShowSidebarAtom),
  (get, set, update: boolean | ((prev: boolean) => boolean)) => {
    const current = get(baseShowSidebarAtom);
    const next = typeof update === 'function' ? update(current) : update;
    if (current !== next) {
      set(baseShowSidebarAtom, next);
      set(sidebarAnimationAtom, (prev) => ({
        direction: next ? 'left' : 'right',
        key: (prev?.key ?? 0) + 1,
        timestamp: Date.now(),
      }));
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
        } catch {
          // ignore
        }
      }
    }
  }
);

const CARD_3D_STORAGE_KEY = 'slimevr-card-3d-previews';

function getInitialActive3DTrackers(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CARD_3D_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

const baseActive3DTrackersAtom = atom<string[]>(getInitialActive3DTrackers());

export const active3DTrackerKeysAtom = atom(
  (get) => get(baseActive3DTrackersAtom),
  (get, set, update: string[] | ((prev: string[]) => string[])) => {
    const next =
      typeof update === 'function' ? update(get(baseActive3DTrackersAtom)) : update;
    set(baseActive3DTrackersAtom, next);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CARD_3D_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
    }
  }
);

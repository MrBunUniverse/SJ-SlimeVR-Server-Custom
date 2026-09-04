import { Typography } from './commons/Typography';
import classNames from 'classnames';
import { ResetType } from 'solarxr-protocol';
import {
  BODY_PARTS_GROUPS,
  MountingResetGroup,
  ResetBtnStatus,
  useReset,
  UseResetOptions,
} from '@/hooks/reset';
import { Tooltip } from './commons/Tooltip';
import { useAtomValue } from 'jotai';
import { assignedTrackersAtom } from '@/store/app-store';
import { useBreakpoint } from '@/hooks/breakpoint';
import { useMemo } from 'react';
import { ResetButtonIcon } from './home/ResetButton';

const MAINBUTTON_CLASSES = ({ disabled }: { disabled: boolean }) =>
  classNames(
    'relative overflow-clip',
    'flex h-full items-center justify-center gap-1.5 px-3 bg-background-60 rounded-xl fill-background-10 font-semibold tracking-tight text-[12px] aspect-square md:aspect-auto transition-all duration-150',
    {
      'cursor-pointer hover:bg-background-50 active:scale-[0.97] bg-background-60':
        !disabled,
      'cursor-not-allowed bg-background-70 brightness-75': disabled,
    }
  );

function ButtonProgress({
  progress,
  status,
}: {
  progress: number;
  status: ResetBtnStatus;
}) {
  return (
    <div
      className={classNames(
        'absolute top-0 left-0 w-0 h-full bg-accent-background-20 opacity-50'
      )}
      style={{
        width: `${progress * 100}%`,
        transition:
          status === 'counting'
            ? 'width 0.3s cubic-bezier(0.68, -0.8, 0.32, 1.8)'
            : 'width 1s linear',
      }}
    />
  );
}

export function BasicResetButton(options: UseResetOptions & { customName?: string }) {
  const { isMd } = useBreakpoint('md');
  const {
    triggerReset,
    status,
    name: resetName,
    timer,
    progress: resetProress,
    disabled,
    duration,
    error,
  } = useReset(options);

  const progress = status === 'counting' ? resetProress / duration : 0;

  const name = options.customName || resetName;

  const skiReset =
    options.type === ResetType.Mounting && options.group === 'default';

  return (
    <Tooltip
      disabled={!error && isMd}
      content={
        error ? (
          <Typography
            id={error}
            textAlign="text-center"
            color="text-status-critical"
          />
        ) : (
          <Typography textAlign="text-center" id={name} />
        )
      }
      spacing={5}
      preferedDirection={error ? 'bottom' : 'top'}
    >
      <button
        type="button"
        disabled={disabled}
        className={classNames(
          'relative overflow-clip h-[34px] px-3 rounded-xl flex items-center justify-center gap-1.5 font-semibold text-[12px] transition-all duration-150',
          {
            'cursor-pointer glass-interactive bg-background-60/80 hover:bg-background-50 active:scale-[0.97] fill-background-10 text-background-10 border border-white/10':
              !disabled,
            'cursor-not-allowed bg-background-70/40 text-background-30 fill-background-30 brightness-75':
              disabled,
          }
        )}
        style={{
          animationIterationCount: 1,
        }}
        onClick={() => !disabled && triggerReset()}
      >
        <div
          className={classNames('scale-90', {
            'animate-spin-ccw': !skiReset && status === 'finished',
            'animate-skiing': skiReset && status === 'finished',
            'opacity-0': status === 'counting',
          })}
          style={{
            animationIterationCount: 1,
          }}
        >
          <ResetButtonIcon {...options} />
        </div>

        <div
          className={classNames('hidden md:block relative', {
            'opacity-0': status === 'counting',
          })}
        >
          <Typography
            textAlign="text-center"
            className="text-[11.5px] font-semibold tracking-tight whitespace-nowrap"
            id={name}
          />
        </div>

        <ButtonProgress progress={progress} status={status} />
        <div
          className={classNames(
            {
              'opacity-0': status !== 'counting',
              'animate-timer-tick': status === 'counting',
            },
            'absolute inset-0 flex items-center justify-center'
          )}
        >
          <Typography className="text-[12px] font-bold" textAlign="text-center">
            {timer}
          </Typography>
        </div>
      </button>
    </Tooltip>
  );
}

export function ResetActionsGroup() {
  const assignedTrackers = useAtomValue(assignedTrackersAtom);

  const { groupVisibility } = useMemo(() => {
    const groupVisibility = Object.keys(BODY_PARTS_GROUPS)
      .filter((k) => ['fingers'].includes(k))
      .reduce(
        (curr, key) => {
          const group = key as MountingResetGroup;
          curr[group] = assignedTrackers.some(
            ({ tracker }) =>
              tracker.info?.bodyPart &&
              BODY_PARTS_GROUPS[group].includes(tracker.info?.bodyPart)
          );

          return curr;
        },
        {} as Record<MountingResetGroup, boolean>
      );

    return {
      groupVisibility,
    };
  }, [assignedTrackers]);

  return (
    <div className="flex items-center gap-1.5 p-1 glass-panel-strong rounded-2xl border border-white/10 shadow-inner">
      <BasicResetButton type={ResetType.Full} />
      <BasicResetButton type={ResetType.Yaw} />
      <div className="w-[1px] h-4 bg-background-50/40 mx-0.5" />
      <BasicResetButton
        type={ResetType.Mounting}
        group={'default'}
        customName="toolbar-mounting_calibration-default"
      />
      <BasicResetButton
        type={ResetType.Mounting}
        group={'feet'}
        customName="toolbar-mounting_calibration-feet"
      />
      {groupVisibility['fingers'] && (
        <BasicResetButton
          type={ResetType.Mounting}
          group={'fingers'}
          customName="toolbar-mounting_calibration-fingers"
        />
      )}
    </div>
  );
}

export function Toolbar() {
  return null;
}

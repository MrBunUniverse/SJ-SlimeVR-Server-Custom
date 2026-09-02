import classNames from 'classnames';
import { useMemo } from 'react';
import { TrackerStatus as TrackerStatusEnum } from 'solarxr-protocol';
import { Typography } from '@/components/commons/Typography';
import { useLocalization } from '@fluent/react';

const statusLabelMap: { [key: number]: string } = {
  [TrackerStatusEnum.NONE]: 'tracker-status-none',
  [TrackerStatusEnum.BUSY]: 'tracker-status-busy',
  [TrackerStatusEnum.ERROR]: 'tracker-status-error',
  [TrackerStatusEnum.DISCONNECTED]: 'tracker-status-disconnected',
  [TrackerStatusEnum.OCCLUDED]: 'tracker-status-occluded',
  [TrackerStatusEnum.OK]: 'tracker-status-ok',
  [TrackerStatusEnum.TIMED_OUT]: 'tracker-status-timed_out',
};

const statusClassMap: { [key: number]: string } = {
  [TrackerStatusEnum.NONE]: 'bg-background-30',
  [TrackerStatusEnum.BUSY]: 'bg-status-warning',
  [TrackerStatusEnum.ERROR]: 'bg-status-critical',
  [TrackerStatusEnum.DISCONNECTED]: 'bg-background-30',
  [TrackerStatusEnum.OCCLUDED]: 'bg-status-warning',
  [TrackerStatusEnum.OK]: 'bg-status-success',
  [TrackerStatusEnum.TIMED_OUT]: 'bg-status-warning',
};

export function TrackerStatus({ status }: { status: number }) {
  const { l10n } = useLocalization();

  const statusClass = useMemo(() => statusClassMap[status], [status]);
  const statusLabel = useMemo(() => statusLabelMap[status], [status]);

  return (
    <div className="flex items-center gap-1.5 glass-pill px-2 py-0.5 text-[11px] font-medium">
      <div
        className={classNames('w-1.5 h-1.5 rounded-full shrink-0', statusClass)}
      />
      <Typography
        whitespace="whitespace-nowrap"
        className="text-[11px] leading-tight"
      >
        {l10n.getString(statusLabel)}
      </Typography>
    </div>
  );
}

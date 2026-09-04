import { useState } from 'react';
import { useWebsocketAPI } from '@/hooks/websocket-api';
import { useAtomValue } from 'jotai';
import {
  assignedTrackersAtom,
  connectedIMUTrackersAtom,
} from '@/store/app-store';
import { Typography } from '@/components/commons/Typography';
import { NavLink } from 'react-router-dom';
import classNames from 'classnames';

export function QuestDiagnosticsPill() {
  const { isConnected } = useWebsocketAPI();
  const assignedTrackers = useAtomValue(assignedTrackersAtom);
  const connectedTrackers = useAtomValue(connectedIMUTrackersAtom);
  const [isOpen, setIsOpen] = useState(false);

  const isHealthy = isConnected && connectedTrackers.length > 0;

  return (
    <div className="relative select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={classNames(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150',
          'glass-pill glass-interactive active:scale-[0.97]'
        )}
      >
        <div
          className={classNames(
            'w-2 h-2 rounded-full shrink-0',
            isConnected
              ? isHealthy
                ? 'bg-status-success'
                : 'bg-status-warning'
              : 'bg-status-critical'
          )}
        />
        <Typography className="text-[12px] font-medium tracking-tight">
          {isConnected
            ? `${connectedTrackers.length} Trackers Active`
            : 'Backend Disconnected'}
        </Typography>
        <span className="text-background-30 text-[10px] font-normal">▼</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-9 w-72 p-3.5 z-50 glass-popover rounded-2xl shadow-2xl flex flex-col gap-2.5 animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-background-50/30">
              <Typography
                bold
                className="text-[13px] font-semibold tracking-tight text-background-10"
              >
                System Diagnostics
              </Typography>
              <div className="flex items-center gap-1.5">
                <div
                  className={classNames(
                    'w-2 h-2 rounded-full',
                    isConnected ? 'bg-status-success' : 'bg-status-critical'
                  )}
                />
                <span className="text-[11px] text-background-20">
                  {isConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-[12px]">
              <div className="flex justify-between items-center py-1">
                <span className="text-background-30">Quest / VRChat OSC:</span>
                <span className="font-medium text-background-10">
                  {isConnected ? 'Ready / Port 9000' : 'Unavailable'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-background-30">Assigned Trackers:</span>
                <span className="font-semibold text-background-10">
                  {assignedTrackers.length}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-background-30">Active Hardware:</span>
                <span className="font-semibold text-background-10">
                  {connectedTrackers.length} Devices
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-background-50/30 flex justify-between items-center">
              <NavLink
                to="/settings/osc/vrchat"
                className="text-[11px] text-accent-background-20 hover:text-accent-background-10 font-medium tracking-tight"
                onClick={() => setIsOpen(false)}
              >
                OSC Settings →
              </NavLink>
              <NavLink
                to="/settings/serial"
                className="text-[11px] text-background-30 hover:text-background-10"
                onClick={() => setIsOpen(false)}
              >
                Serial Monitor
              </NavLink>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

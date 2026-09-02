import { NavLink } from 'react-router-dom';
import { Typography } from '@/components/commons/Typography';
import { Button } from '@/components/commons/Button';
import { SlimeVRIcon } from '@/components/commons/icon/SimevrIcon';
import { WifiIcon } from '@/components/commons/icon/WifiIcon';
import { useLocalization } from '@fluent/react';
import { useWebsocketAPI } from '@/hooks/websocket-api';
import classNames from 'classnames';

export function HomeEmptyState() {
  const { l10n } = useLocalization();
  const { isConnected } = useWebsocketAPI();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 my-auto max-w-md mx-auto text-center glass-panel rounded-3xl border border-white/10 shadow-2xl">
      <div className="relative mb-5 flex items-center justify-center">
        <div className="absolute w-20 h-20 bg-accent-background-30/15 rounded-full blur-lg" />
        <div className="relative p-4 rounded-2xl glass-panel-strong border border-white/15">
          <SlimeVRIcon />
        </div>
      </div>

      <Typography
        variant="main-title"
        className="text-[18px] font-bold tracking-tight text-background-10 mb-1.5"
      >
        {l10n.getString('home-no_trackers') || 'No Trackers Connected'}
      </Typography>

      <Typography
        variant="standard"
        color="secondary"
        className="text-[12px] leading-relaxed mb-6 max-w-xs"
      >
        Turn on your SlimeVR trackers or configure Wi-Fi credentials to start
        full-body tracking.
      </Typography>

      <div className="flex flex-col gap-2.5 w-full max-w-xs">
        <NavLink to="/onboarding/wifi-creds" className="w-full">
          <Button
            variant="primary"
            className="w-full justify-center gap-2 py-2.5 rounded-xl shadow-md"
          >
            <WifiIcon value={1} disabled={false} />
            <span>Connect Trackers (Wi-Fi)</span>
          </Button>
        </NavLink>

        <NavLink to="/onboarding/trackers-assign" className="w-full">
          <Button
            variant="secondary"
            className="w-full justify-center py-2.5 rounded-xl"
          >
            <span>Interactive Setup Guide</span>
          </Button>
        </NavLink>
      </div>

      <div className="mt-6 pt-4 border-t border-background-50/30 w-full flex items-center justify-center gap-2 text-[11px] text-background-30">
        <div
          className={classNames(
            'w-2 h-2 rounded-full',
            isConnected ? 'bg-status-success' : 'bg-status-critical'
          )}
        />
        <span>
          {isConnected ? 'SlimeVR Server Online' : 'SlimeVR Server Offline'}
        </span>
      </div>
    </div>
  );
}

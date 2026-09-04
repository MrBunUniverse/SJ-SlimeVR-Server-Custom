import { NavLink } from 'react-router-dom';
import { SlimeVRIcon } from '@/components/commons/icon/SimevrIcon';
import { useLocalization } from '@fluent/react';
import { useWebsocketAPI } from '@/hooks/websocket-api';
import classNames from 'classnames';

export function HomeEmptyState() {
  const { l10n } = useLocalization();
  const { isConnected } = useWebsocketAPI();

  return (
    <div className="relative overflow-hidden flex flex-col items-center justify-center my-auto mx-auto w-full max-w-[420px] px-8 py-7 text-center rounded-[28px] bg-[#1c1c1e]/90 backdrop-blur-3xl border border-white/[0.12] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.65)] select-none transition-all">
      {/* Ambient Internal Glow: Strictly clipped inside the window */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-40 bg-[#BF5AF2]/16 rounded-full blur-3xl pointer-events-none" />

      {/* Safe Space Content Column with Unified Margins */}
      <div className="relative z-10 w-full max-w-[290px] flex flex-col items-center">
        {/* Floating Product Emblem */}
        <div className="relative w-14 h-14 rounded-[18px] bg-gradient-to-b from-white/[0.14] to-white/[0.04] border border-white/[0.16] shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_8px_20px_-4px_rgba(0,0,0,0.45)] flex items-center justify-center">
          <SlimeVRIcon />
        </div>

        {/* Title & Subtitle with Generous Breathing Room */}
        <h2 className="mt-3.5 text-[18px] font-semibold tracking-tight text-white">
          {l10n.getString('home-no_trackers') || 'SlimeVR Trackers'}
        </h2>
        <p className="mt-1.5 mb-5 text-[12.5px] leading-relaxed text-[#9898A4] font-normal text-center">
          Turn on your trackers nearby to connect, or configure Wi-Fi credentials.
        </p>

        {/* Primary Action Button */}
        <NavLink to="/onboarding/wifi-creds" className="w-full">
          <button
            type="button"
            className="w-full h-10 rounded-full bg-white hover:bg-[#f2f2f7] active:scale-[0.98] text-black font-semibold text-[13.5px] tracking-tight shadow-sm transition-all flex items-center justify-center cursor-pointer"
          >
            <span>Connect via Wi-Fi</span>
          </button>
        </NavLink>

        {/* Secondary Action Link */}
        <NavLink
          to="/onboarding/trackers-assign"
          className="mt-2.5 text-[12px] font-medium text-[#0A84FF] hover:text-[#409CFF] transition-colors py-0.5 cursor-pointer"
        >
          Setup Guide →
        </NavLink>

        {/* Minimal Safe-area Status Capsule */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10.5px] text-[#8e8e93]">
          <span
            className={classNames(
              'w-1.5 h-1.5 rounded-full',
              isConnected ? 'bg-[#30D158]' : 'bg-[#FF453A]'
            )}
          />
          <span>{isConnected ? 'Server Online' : 'Server Offline'}</span>
        </div>
      </div>
    </div>
  );
}

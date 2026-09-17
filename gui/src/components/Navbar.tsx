import { useLocalization } from '@fluent/react';
import classNames from 'classnames';
import { ReactNode } from 'react';
import { NavLink, useMatch } from 'react-router-dom';
import { useBreakpoint } from '@/hooks/breakpoint';
import { HomeIcon } from './commons/icon/HomeIcon';
import { RemoteIcon } from './commons/icon/RemoteIcon';
import { HumanIcon } from './commons/icon/HumanIcon';
import { GearIcon } from './commons/icon/GearIcon';
import { ChatboxDropdown } from './TopBar';

export function NavButton({
  to,
  children,
  match,
  state = {},
  icon,
}: {
  to: string;
  children: ReactNode;
  match?: string;
  state?: any;
  icon: ReactNode;
}) {
  const doesMatch = useMatch({ path: match || to, end: !match });

  return (
    <NavLink
      to={to}
      state={state}
      aria-current={doesMatch ? 'page' : undefined}
      className={classNames(
        'group flex min-w-[62px] flex-col items-center justify-center gap-1 rounded-[14px] px-3 py-2 text-[10px] font-medium leading-none tracking-tight transition-[background-color,color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-background-20 focus-visible:ring-offset-2 focus-visible:ring-offset-background-80',
        doesMatch
          ? 'bg-accent-background-20/18 text-accent-background-10'
          : 'text-background-30 hover:bg-background-60/70 hover:text-background-10'
      )}
    >
      <span
        className={classNames(
          'flex h-6 w-6 items-center justify-center transition-colors',
          doesMatch
            ? 'fill-accent-background-10 text-accent-background-10'
            : 'fill-background-30 text-background-30 group-hover:fill-background-10 group-hover:text-background-10'
        )}
      >
        {icon}
      </span>
      <span className="whitespace-nowrap">{children}</span>
    </NavLink>
  );
}

export function MainLinks() {
  const { l10n } = useLocalization();

  return (
    <>
      <NavButton to="/" icon={<HomeIcon />}>
        {l10n.getString('navbar-home')}
      </NavButton>
      <NavButton to="/remote" icon={<RemoteIcon />}>
        {l10n.getString('navbar-remote')}
      </NavButton>
      <NavButton
        to="/onboarding/home"
        match="/onboarding/*"
        icon={<HumanIcon />}
      >
        {l10n.getString('navbar-onboarding')}
      </NavButton>
      <NavButton
        to="/settings/trackers"
        match="/settings/*"
        icon={<GearIcon />}
      >
        {l10n.getString('navbar-settings')}
      </NavButton>
      <ChatboxDropdown dock />
    </>
  );
}

export function Navbar() {
  const { isMobile } = useBreakpoint('mobile');

  return (
    <nav
      aria-label="Primary navigation"
      className={classNames(
        'floating-dock fixed left-1/2 z-[60] -translate-x-1/2',
        isMobile ? 'bottom-2 max-w-[calc(100vw-1rem)]' : 'bottom-4'
      )}
    >
      <div className="floating-dock__surface flex items-center gap-1">
        <MainLinks />
      </div>
    </nav>
  );
}

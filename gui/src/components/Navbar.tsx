import { useLocalization } from '@fluent/react';
import classNames from 'classnames';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useMatch } from 'react-router-dom';
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
        'floating-dock__item group flex min-w-[62px] flex-col items-center justify-center gap-1 rounded-[12px] px-2.5 py-1.5 text-[10px] font-medium leading-none tracking-tight transition-[background-color,color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-background-20 focus-visible:ring-offset-2 focus-visible:ring-offset-background-80',
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

type DockPosition = 'left' | 'center' | 'right';

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
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isSettings = location.pathname.startsWith('/settings');
  const dockPosition: DockPosition =
    isSettings && !isMobile ? 'right' : 'center';
  const previousDockPosition = useRef<DockPosition | null>(null);
  const [dockMotion, setDockMotion] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    const previous = previousDockPosition.current;
    previousDockPosition.current = dockPosition;

    if (previous == null || previous === dockPosition) return;

    const positionValue = (position: DockPosition) =>
      position === 'left' ? -1 : position === 'right' ? 1 : 0;
    const direction =
      positionValue(dockPosition) > positionValue(previous) ? 'right' : 'left';

    setDockMotion(direction);
    const timeout = window.setTimeout(() => setDockMotion(null), 560);
    return () => window.clearTimeout(timeout);
  }, [dockPosition]);

  return (
    <nav
      aria-label="Primary navigation"
      className={classNames(
        'floating-dock fixed left-1/2 z-[60] -translate-x-1/2',
        isHome && 'floating-dock--home',
        isSettings && !isMobile && 'floating-dock--settings',
        isMobile ? 'bottom-2 max-w-[calc(100vw-1rem)]' : 'bottom-4'
      )}
    >
      <div
        className={classNames(
          'floating-dock__surface flex items-center gap-1 p-1',
          dockMotion === 'left' && 'floating-dock__surface--motion-left',
          dockMotion === 'right' && 'floating-dock__surface--motion-right'
        )}
      >
        <MainLinks />
      </div>
    </nav>
  );
}

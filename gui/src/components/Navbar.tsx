import { useLocalization } from '@fluent/react';
import classnames from 'classnames';
import { ReactNode } from 'react';
import { NavLink, useMatch } from 'react-router-dom';
import { HumanIcon } from './commons/icon/HumanIcon';
import { RulerIcon } from './commons/icon/RulerIcon';
import { useBreakpoint } from '@/hooks/breakpoint';
import { HomeIcon } from './commons/icon/HomeIcon';
import { SkiIcon } from './commons/icon/SkiIcon';
import { WifiIcon } from './commons/icon/WifiIcon';
import { RemoteIcon } from './commons/icon/RemoteIcon';
import { Tooltip } from './commons/Tooltip';
import { Typography } from './commons/Typography';

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
  const doesMatch = useMatch({
    path: match || to,
  });

  return (
    <Tooltip
      preferedDirection="right"
      spacing={8}
      content={
        <Typography className="text-[12px] font-medium whitespace-nowrap">
          {children}
        </Typography>
      }
    >
      <NavLink
        to={to}
        state={state}
        className={classnames(
          'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 active:scale-[0.92]',
          {
            'bg-accent-background-30/30 text-accent-background-20 shadow-sm border border-accent-background-20/40':
              doesMatch,
            'hover:bg-white/10 text-background-20 hover:text-background-10 border border-transparent':
              !doesMatch,
          }
        )}
      >
        <div
          className={classnames(
            'scale-100 transition-colors flex items-center justify-center',
            {
              'fill-accent-background-20 text-accent-background-20': doesMatch,
              'fill-background-30 text-background-30 group-hover:fill-background-10 group-hover:text-background-10':
                !doesMatch,
            }
          )}
        >
          {icon}
        </div>
      </NavLink>
    </Tooltip>
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
        Remote
      </NavButton>
      <NavButton
        to="/onboarding/trackers-assign"
        state={{ alonePage: true }}
        icon={<HumanIcon />}
      >
        {l10n.getString('navbar-trackers_assign')}
      </NavButton>
      <NavButton
        to="/onboarding/mounting/choose"
        match="/onboarding/mounting/*"
        state={{ alonePage: true }}
        icon={<SkiIcon />}
      >
        {l10n.getString('navbar-mounting')}
      </NavButton>
      <NavButton
        to="/onboarding/body-proportions/scaled"
        match="/onboarding/body-proportions/*"
        state={{ alonePage: true }}
        icon={<RulerIcon />}
      >
        {l10n.getString('navbar-body_proportions')}
      </NavButton>
      <NavButton
        to="/onboarding/wifi-creds"
        icon={<WifiIcon value={1} disabled variant="navbar" />}
        state={{ alonePage: true }}
      >
        {l10n.getString('navbar-connect_trackers')}
      </NavButton>
    </>
  );
}

export function Navbar() {
  const { isMobile } = useBreakpoint('mobile');

  if (isMobile) {
    return (
      <div className="flex flex-row justify-around px-2 pt-2 bg-background-80 gap-2">
        <MainLinks />
      </div>
    );
  }

  return null;
}

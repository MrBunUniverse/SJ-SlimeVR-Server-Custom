import { useLayoutEffect } from 'react';
import { useConfig } from './hooks/config';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

export function AppLayout() {
  const { config, setConfig } = useConfig();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    if (!config) return;
    if (config.theme !== undefined) {
      // Light mode is intentionally removed; migrate legacy configs to the
      // default dark Slime theme before applying the document theme.
      const theme = config.theme === 'light' ? 'slime' : config.theme;
      document.documentElement.dataset.theme = theme;
      if (config.theme === 'light') void setConfig({ theme });
    }

    const bgStyle = localStorage.getItem('slimevr-bg-style') || 'grid';
    document.documentElement.dataset.bgStyle = bgStyle;

    if (config.fonts !== undefined) {
      document.documentElement.style.setProperty(
        '--font-name',
        config.fonts.map((x) => `"${x}"`).join(',')
      );
    }

    if (config.textSize !== undefined) {
      document.documentElement.style.setProperty(
        '--font-size',
        `${config.textSize}rem`
      );
    }
  }, [config, setConfig]);

  useLayoutEffect(() => {
    if (
      config &&
      !config.doneOnboarding &&
      !pathname.startsWith('/onboarding/')
    ) {
      navigate('/onboarding/home');
    }
  }, [config]);

  return (
    <>
      <Outlet />
    </>
  );
}

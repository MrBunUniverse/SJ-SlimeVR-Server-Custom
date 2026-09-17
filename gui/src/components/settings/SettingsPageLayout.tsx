import classNames from 'classnames';
import {
  Children,
  Fragment,
  isValidElement,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';

export function SettingsPageLayout({
  children,
  className,
  ...props
}: {
  children: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const { state } = useLocation();

  useEffect(() => {
    const typedState: { scrollTo: string } = state;
    if (!pageRef.current || !typedState || !typedState.scrollTo) {
      return;
    }
    const elem = pageRef.current.querySelector(
      `#${typedState.scrollTo}`
    ) as HTMLElement | null;
    if (elem) {
      elem.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      });
    }
  }, [state]);

  return (
    <div ref={pageRef} className={className} {...props}>
      {children}
    </div>
  );
}

export function SettingsPagePaneLayout({
  children,
  className,
  icon,
  id,
  defaultCollapsed = false,
  ...props
}: {
  children: ReactNode;
  icon: ReactNode;
  id?: string;
  defaultCollapsed?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { state } = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (!id) return defaultCollapsed;
    const saved = localStorage.getItem(`slimevr-settings-pane-${id}-collapsed`);
    return saved !== null ? saved === 'true' : defaultCollapsed;
  });

  // Auto-expand if navigated via scrollTo
  useEffect(() => {
    const typedState: { scrollTo?: string } = state as any;
    if (id && typedState?.scrollTo === id) {
      setIsCollapsed(false);
      localStorage.setItem(`slimevr-settings-pane-${id}-collapsed`, 'false');
    }
  }, [state, id]);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (id) {
        localStorage.setItem(
          `slimevr-settings-pane-${id}-collapsed`,
          String(next)
        );
      }
      return next;
    });
  };

  // Unwrap fragment if needed
  let elements: ReactNode[] = [];
  if (isValidElement(children) && children.type === Fragment) {
    elements = Children.toArray((children.props as any).children);
  } else {
    elements = Children.toArray(children);
  }

  const titleElement = elements[0];
  const bodyElements = elements.slice(1);
  const hasBody = bodyElements.length > 0;

  return (
    <div
      id={id}
      className={classNames(
        'settings-pane bg-background-60/40 dark:bg-white/[0.02] border border-background-50/50 dark:border-white/[0.06] rounded-[18px] p-5 sm:p-6 shadow-2xs backdrop-blur-sm flex flex-col w-full relative scroll-mt-12 mobile:scroll-mt-20 transition-all',
        className
      )}
      {...props}
    >
      {/* Category Header with spacious, non-claustrophobic icon gap */}
      <div
        className={classNames(
          'flex items-center gap-4 sm:gap-5 w-full select-none',
          hasBody && 'cursor-pointer group'
        )}
        onClick={() => {
          if (hasBody) toggleCollapsed();
        }}
      >
        <div className="settings-pane__icon w-10 h-10 bg-accent-background-20/12 border border-accent-background-20/25 flex justify-center items-center rounded-full text-accent-background-20 fill-accent-background-20 shadow-xs shrink-0">
          {icon}
        </div>

        <div className="flex-1 min-w-0 flex items-center">{titleElement}</div>

        {hasBody && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapsed();
            }}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-background-30 hover:text-background-10 group-hover:text-background-10 hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer shrink-0"
            aria-label={isCollapsed ? 'Expand category' : 'Collapse category'}
          >
            <svg
              className={classNames(
                'w-4 h-4 transition-transform duration-300 ease-out',
                isCollapsed
                  ? '-rotate-90 text-background-30'
                  : 'rotate-0 text-background-20'
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}
      </div>

      {/* Top-to-bottom collapsible body */}
      {hasBody && (
        <div
          className={classNames(
            'grid transition-all duration-300 ease-out category-pane-grid',
            isCollapsed
              ? 'grid-rows-[0fr] opacity-0 category-pane-grid-collapsed pointer-events-none'
              : 'grid-rows-[1fr] opacity-100 category-pane-grid-expanded'
          )}
        >
          <div className="overflow-hidden min-h-0">
            <div className="pt-4 flex flex-col w-full min-w-0">
              {bodyElements}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

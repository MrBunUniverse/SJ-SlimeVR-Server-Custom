import classNames from 'classnames';
import React, { ReactNode, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { LoaderIcon, SlimeState } from './icon/LoaderIcon';
import { Localized, LocalizedProps } from '@fluent/react';

function ButtonContent({
  loading,
  icon,
  children,
}: {
  loading: boolean;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div
        className={classNames(
          { 'opacity-0': loading },
          'flex flex-row gap-2 justify-center items-center'
        )}
      >
        {icon && (
          <div className="flex justify-center items-center fill-background-10 w-5">
            {icon}
          </div>
        )}
        {children}
      </div>
      {loading && (
        <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center fill-background-10">
          <LoaderIcon slimeState={SlimeState.JUMPY} />
        </div>
      )}
    </>
  );
}

export type ButtonProps = {
  children?: ReactNode;
  icon?: ReactNode;
  variant: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
  to?: string;
  loading?: boolean;
  rounded?: boolean;
  state?: any;
  id?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  Omit<LocalizedProps, 'id'>;

export function Button({
  children,
  variant,
  disabled,
  to,
  loading = false,
  state = {},
  icon,
  rounded = false,
  attrs,
  id,
  vars,
  elems,
  ...props
}: ButtonProps) {
  const classes = useMemo(() => {
    const variantsMap = {
      primary: classNames({
        'bg-accent-background-30 hover:bg-accent-background-20 text-standard-bold font-semibold tracking-tight text-background-10 active:scale-[0.98] shadow-md hover:shadow-lg transition-all duration-150':
          !disabled,
        'bg-accent-background-40/50 hover:bg-accent-background-40/50 cursor-not-allowed text-accent-background-10/60':
          disabled,
      }),
      secondary: classNames({
        'glass-interactive text-standard-bold font-semibold tracking-tight text-background-10 active:scale-[0.98] shadow-sm':
          !disabled,
        'bg-background-60/40 hover:bg-background-60/40 cursor-not-allowed text-background-40 border border-white/5':
          disabled,
      }),
      tertiary: classNames({
        'bg-background-50/70 hover:bg-background-40/90 text-standard-bold font-medium tracking-tight text-background-10 active:scale-[0.98] border border-white/5 transition-all duration-150':
          !disabled,
        'bg-background-50/30 hover:bg-background-50/30 cursor-not-allowed text-background-40':
          disabled,
      }),
      quaternary: classNames({
        'hover:bg-background-60/50 text-standard-bold font-medium tracking-tight text-background-20 hover:text-background-10 active:scale-[0.98] transition-all duration-150':
          !disabled,
        'cursor-not-allowed text-background-40': disabled,
      }),
    };
    return classNames(
      variantsMap[variant],
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-background-30/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background-80 focus:outline-none text-center relative flex items-center justify-center',
      {
        'rounded-full p-2 text-center min-h-[35px] min-w-[35px] active:scale-[0.96]':
          rounded,
        'rounded-xl px-5 py-2.5': !rounded,
      },
      props.className
    );
  }, [variant, disabled, rounded, props.className]);

  const content = to ? (
    <NavLink
      to={to}
      className={classes}
      state={state}
      onClick={(ev) => {
        if (disabled) {
          ev.preventDefault();
          return;
        }
        if (props.onClick) return props.onClick(ev as any);
      }}
    >
      <ButtonContent icon={icon} loading={loading}>
        {id && (
          <Localized attrs={attrs} vars={vars} elems={elems} id={id}>
            {children}
          </Localized>
        )}
        {!id && children}
      </ButtonContent>
    </NavLink>
  ) : (
    <button type="button" {...props} className={classes} disabled={disabled}>
      <ButtonContent icon={icon} loading={loading}>
        {id && (
          <Localized attrs={attrs} vars={vars} elems={elems} id={id}>
            {children}
          </Localized>
        )}
        {!id && children}
      </ButtonContent>
    </button>
  );

  return content;
}

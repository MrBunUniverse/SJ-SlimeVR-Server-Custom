import classNames from 'classnames';
import { forwardRef, useMemo } from 'react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';

export const CHECKBOX_CLASSES = classNames(
  'bg-background-50/80 border border-white/10 cursor-pointer rounded-lg w-5 h-5 text-accent-background-30 focus:border-accent-background-30 focus:ring-2 focus:ring-accent-background-30/30 focus-visible:outline-none transition-all'
);

export const CheckboxInternal = forwardRef<
  HTMLInputElement,
  {
    disabled?: boolean;
    variant?: 'checkbox' | 'toggle';
    color?: 'primary' | 'secondary' | 'tertiary';
    label?: string;
    outlined?: boolean;
    loading?: boolean;
    name: string;
  } & Partial<React.HTMLProps<HTMLInputElement>>
>(function AppCheckbox(
  {
    variant = 'checkbox',
    color = 'primary',
    outlined = false,
    loading = false,
    disabled = false,
    label,
    onChange,
    checked,
    name,
  },
  ref
) {
  const classes = useMemo(() => {
    const vriantsMap = {
      checkbox: {
        checkbox: classNames(CHECKBOX_CLASSES, {
          'brightness-50 hover:cursor-not-allowed': disabled,
        }),
        toggle: '',
        pin: '',
      },
      toggle: {
        checkbox: classNames('hidden'),
        toggle: classNames(
          'w-10 h-5 rounded-full relative transition-colors duration-200 border border-white/10'
        ),
        pin: classNames(
          'h-3.5 w-3.5 bg-background-10 rounded-full absolute top-[2px] transition-all duration-200 shadow-sm'
        ),
      },
    };
    return vriantsMap[variant];
  }, [variant, disabled]);

  return (
    <div
      className={classNames(
        {
          'rounded-xl': outlined,
          'text-background-40': disabled,
          'text-background-10': !disabled,
          'bg-background-60/80 border border-white/10':
            outlined && color === 'primary',
          'bg-background-70/80 border border-white/10':
            outlined && color === 'secondary',
          'bg-background-50/80 border border-white/10':
            outlined && color === 'tertiary',
        },
        'flex items-center gap-2 w-full'
      )}
    >
      <label
        className={classNames(
          'w-full h-[42px] flex gap-2 items-center text-standard-bold',
          {
            'px-3': outlined,
            'cursor-pointer': !disabled || !loading,
            'cursor-default': disabled || loading,
          }
        )}
      >
        <input
          ref={ref}
          onChange={onChange}
          checked={checked}
          name={name}
          className={classes.checkbox}
          type="checkbox"
          disabled={disabled || loading}
        />
        {variant === 'toggle' && (
          <div
            className={classNames(classes.toggle, {
              'bg-accent-background-30': checked && !disabled && !loading,
              'bg-accent-background-50': checked && disabled,
              'bg-accent-background-30 animate-pulse': loading && !disabled,
              'bg-background-50/80':
                ((!checked && color == 'primary') || color == 'secondary') &&
                !loading,
              'bg-background-40/80':
                !checked && color == 'tertiary' && !loading,
            })}
          >
            <div
              className={classNames(classes.pin, {
                'left-[3px]': !checked && !loading,
                'opacity-0': loading,
                'left-[21px]': checked && !loading,
                'bg-background-30': disabled,
              })}
            />
          </div>
        )}
        {label}
      </label>
    </div>
  );
});

export function CheckBox<T extends FieldValues = FieldValues>({
  label,
  variant = 'checkbox',
  color = 'primary',
  control,
  outlined,
  name,
  loading,
  disabled,
}: {
  label: string;
  control: Control<T>;
  name: FieldPath<T>;
  variant?: 'checkbox' | 'toggle';
  color?: 'primary' | 'secondary' | 'tertiary';
  outlined?: boolean;
  loading?: boolean;
} & React.HTMLProps<HTMLInputElement>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value, ref, name } }) => (
        <CheckboxInternal
          label={label}
          variant={variant}
          color={color}
          outlined={outlined}
          name={name}
          loading={loading}
          disabled={disabled}
          checked={value}
          onChange={onChange}
          ref={ref}
        />
      )}
    />
  );
}

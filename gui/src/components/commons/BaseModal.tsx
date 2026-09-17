import classNames from 'classnames';
import { ReactNode } from 'react';
import ReactModal from 'react-modal';

export function BaseModal({
  children,
  important = false,
  closeable = true,
  ...props
}: {
  isOpen: boolean;
  children: ReactNode;
  appendClasses?: string;
  important?: boolean;
  closeable?: boolean;
} & ReactModal.Props) {
  return (
    <ReactModal
      {...props}
      shouldCloseOnOverlayClick={closeable}
      shouldCloseOnEsc={closeable}
      overlayClassName={
        props.overlayClassName ||
        classNames(
          'fixed top-0 right-0 left-0 bottom-0 flex flex-col justify-center',
          'items-center w-full h-full bg-black/60 dark:bg-black/75 backdrop-blur-sm',
          important ? 'z-50' : 'z-40'
        )
      }
      className={
        props.className ||
        classNames(
          'items-center focus:ring-transparent focus:ring-offset-transparent',
          'focus:outline-transparent outline-none p-6 rounded-[16px] m-3 overflow-hidden',
          'bg-[#FAF9F5] dark:bg-[#1B1915] text-background-10 shadow-2xl border border-black/[0.08] dark:border-white/[0.08] max-w-lg w-full',
          props.appendClasses
        )
      }
    >
      {children}
    </ReactModal>
  );
}

import { useLocalization } from '@fluent/react';
import { BaseModal } from '@/components/commons/BaseModal';
import ReactModal from 'react-modal';
import { useNavigate } from 'react-router-dom';

export function SkipSetupWarningModal({
  isOpen = true,
  onClose,
  accept,
  ...props
}: {
  /**
   * Is the parent/sibling component opened?
   */
  isOpen: boolean;
  /**
   * Function to trigger when the warning hasn't been accepted
   */
  onClose: () => void;
  /**
   * Function when you press `i understand`
   */
  accept: () => void;
} & ReactModal.Props) {
  const { l10n } = useLocalization();
  const navigate = useNavigate();

  return (
    <BaseModal
      isOpen={isOpen}
      shouldCloseOnOverlayClick
      shouldCloseOnEsc
      onRequestClose={onClose}
      className={props.className}
      overlayClassName={props.overlayClassName}
      appendClasses="!p-0 !max-w-[440px] !rounded-[16px] overflow-hidden"
    >
      <div className="flex w-full flex-col select-none bg-[#FAF9F5] dark:bg-[#1B1915] text-background-10">
        {/* Card Header Banner with Mock Window & Contour Lines */}
        <div className="relative h-24 sm:h-25 w-full bg-[#F4F1E8] dark:bg-[#14120F] border-b border-black/[0.06] dark:border-white/[0.06] overflow-hidden flex flex-col justify-between p-3">
          {/* Subtle Curved Topographic Contours */}
          <svg
            className="absolute inset-0 w-full h-full opacity-20 pointer-events-none stroke-[#D97757]"
            viewBox="0 0 300 120"
            fill="none"
          >
            <path
              d="M-20 20 C 60 80, 140 -20, 220 50 C 260 90, 310 30, 340 70"
              strokeWidth="1.2"
            />
            <path
              d="M-30 60 C 50 110, 130 10, 210 80 C 250 110, 300 60, 330 90"
              strokeWidth="1"
              opacity="0.6"
            />
            <path
              d="M-10 -10 C 70 40, 150 -50, 230 20 C 270 50, 320 0, 350 40"
              strokeWidth="0.8"
              opacity="0.4"
            />
          </svg>

          <div className="relative z-10 flex items-center justify-end">
            <span className="text-[10px] font-mono font-medium text-background-30 tracking-wide">
              setup.notice
            </span>
          </div>

          {/* Centered Graphic Icon with Breathing & Glow Animation */}
          <div className="relative z-10 flex items-center justify-center flex-grow">
            <div className="animate-warning-breathe flex items-center justify-center">
              <svg
                className="w-8 h-8 stroke-[#D97757]"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6 flex flex-col gap-3 text-left">
          <div>
            <h3 className="font-serif text-[18px] sm:text-[19px] font-normal tracking-tight text-background-10">
              Initial Setup Required
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-background-30 font-sans">
              The initial calibration is required for good tracking and body
              kinematics. Skipping setup is only advised if your trackers are
              already paired and calibrated.
            </p>
          </div>

          {/* Clean Action Buttons */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                accept();
                navigate('/');
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-[8px] bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.08] dark:hover:bg-white/[0.09] border border-black/[0.08] dark:border-white/[0.08] font-medium text-[13px] text-background-30 hover:text-background-10 transition-all active:scale-95 cursor-pointer"
            >
              {l10n.getString('onboarding-setup_warning-skip')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-[8px] bg-[#D97757] hover:bg-[#C86646] text-white font-medium text-[13px] shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              {l10n.getString('onboarding-setup_warning-cancel')}
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

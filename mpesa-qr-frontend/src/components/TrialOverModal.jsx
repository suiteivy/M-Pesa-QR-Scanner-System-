import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, PhoneCall, ArrowLeft, X } from 'lucide-react';

const TrialOverModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleContactUs = () => {
    if (onClose) onClose();
    navigate('/book-consultation');
  };

  const handleBack = () => {
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="relative w-full max-w-md bg-brand-surface dark:bg-brand-gray rounded-3xl p-6 sm:p-8 shadow-2xl border border-brand-borderLight dark:border-brand-borderDark overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={handleBack}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-brand-light dark:hover:bg-brand-black transition-colors"
        >
          <X className="w-5 h-5 text-content-main dark:text-content-mainDark" />
        </button>

        {/* Top Decorative Gradient */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-status-error via-brand-orange to-status-error" />

        <div className="text-center space-y-4 pt-2">
          {/* Icon Badge */}
          <div className="w-16 h-16 bg-status-errorBg text-status-error rounded-3xl flex items-center justify-center mx-auto border border-status-error/30 shadow-inner">
            <AlertCircle className="w-8 h-8 text-status-error" />
          </div>

          <h2 className="text-2xl font-black uppercase tracking-tight text-content-main dark:text-content-mainDark">
            Free Trial Over
          </h2>

          <p className="text-xs sm:text-sm text-content-muted dark:text-content-mutedDark font-medium leading-relaxed px-2">
            Your 3-day free trial has ended and has already been completed for this device. Please schedule a consultation or create an account to activate your merchant platform.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-8">
          {/* Option 1: Contact Us */}
          <button
            onClick={handleContactUs}
            className="w-full py-3.5 px-5 bg-brand-orange text-zinc-950 hover:bg-brand-orange/90 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-brand-orange/25 flex items-center justify-center gap-2 group active:scale-95"
          >
            <PhoneCall className="w-4 h-4 transition-transform group-hover:scale-110" />
            Contact Us
          </button>

          {/* Option 2: Back */}
          <button
            onClick={handleBack}
            className="w-full py-3.5 px-5 bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark text-content-main dark:text-content-mainDark hover:border-brand-orange/50 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-brand-orange" />
            Back
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-[10px] text-center text-content-muted dark:text-content-mutedDark font-semibold uppercase tracking-wider mt-6">
          MerchantPro QR Scanner System
        </p>
      </div>
    </div>
  );
};

export default TrialOverModal;

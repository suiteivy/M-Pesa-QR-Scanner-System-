import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquareHeart, Home, Clock, Sparkles, X } from 'lucide-react';
import { useFreeTrial } from '../hooks/FreeTrialContext';

// Default Google Form URL — replace with your actual Google Form URL or set REACT_APP_GOOGLE_FORM_URL in .env
const GOOGLE_FORM_URL = process.env.REACT_APP_GOOGLE_FORM_URL || 'https://docs.google.com/forms/d/e/1FAIpQLScdS8WHJ_WW-vAoVjOUTQrJcog4kQo6MZhb3MqC9fOCq3la7g/viewform?usp=sharing&ouid=107779038157328291391';
const GOOGLE_FORM_EMBED_URL = `${GOOGLE_FORM_URL}${GOOGLE_FORM_URL.includes('?') ? '&' : '?'}embedded=true`;

const TrialEndedModal = ({ isOpen, onClose, isExpiredReason = false }) => {
  const navigate = useNavigate();
  const { endTrial } = useFreeTrial();
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  if (!isOpen) return null;

  const handleGiveFeedback = () => {
    setShowFeedbackForm(true);
    void endTrial();
  };

  const handleClose = () => {
    void endTrial();
    if (onClose) onClose();
        navigate('/landing', { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-300">
      <div className={`relative w-full ${showFeedbackForm ? 'max-w-3xl p-3 sm:p-5' : 'max-w-md p-6 sm:p-8'} max-h-[calc(100vh-2rem)] overflow-y-auto bg-brand-surface dark:bg-brand-gray rounded-3xl shadow-2xl border border-brand-borderLight dark:border-brand-borderDark`}>
        
        {/* Top Decorative Gradient */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-orange via-amber-400 to-brand-orange" />

        <button
          type="button"
          onClick={handleClose}
          aria-label="Close and return to landing page"
          title="Close and return to landing page"
          className="absolute top-4 right-4 z-10 p-2 rounded-full text-content-muted dark:text-content-mutedDark hover:bg-brand-light dark:hover:bg-brand-black hover:text-content-main dark:hover:text-content-mainDark transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {showFeedbackForm ? (
          <div className="pt-8">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-content-main dark:text-content-mainDark">
              Share your feedback
            </h2>
            <iframe
              title="MerchantPro trial feedback form"
              src={GOOGLE_FORM_EMBED_URL}
              className="mt-4 block h-[68vh] min-h-[360px] max-h-[680px] w-full rounded-xl border border-brand-borderLight dark:border-brand-borderDark bg-white"
              allowFullScreen
            />
          </div>
        ) : (
          <>
        <div className="text-center space-y-4 pt-2">
          {/* Animated Icon Badge */}
          <div className="w-16 h-16 bg-amber-500/10 dark:bg-amber-500/20 text-brand-orange rounded-3xl flex items-center justify-center mx-auto border border-brand-orange/30 shadow-inner">
            {isExpiredReason ? (
              <Clock className="w-8 h-8 text-brand-orange animate-pulse" />
            ) : (
              <Sparkles className="w-8 h-8 text-brand-orange" />
            )}
          </div>

          <h2 className="text-2xl font-black uppercase tracking-tight text-content-main dark:text-content-mainDark">
            {isExpiredReason ? '3-Day Trial Completed!' : 'Free Trial Ended'}
          </h2>

          <p className="text-xs sm:text-sm text-content-muted dark:text-content-mutedDark font-medium leading-relaxed px-2">
            {isExpiredReason
              ? 'Your 3-day free trial session has ended. We hope you enjoyed exploring the M-Pesa QR Scanner & Merchant Dashboard!'
              : 'Thank you for testing out MerchantPro! What would you like to do next?'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-8">
          {/* Option 1: Show embedded Google Form */}
          <button
            onClick={handleGiveFeedback}
            className="w-full py-3.5 px-5 bg-brand-orange text-zinc-950 hover:bg-brand-orange/90 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-brand-orange/25 flex items-center justify-center gap-2 group active:scale-95"
          >
            <MessageSquareHeart className="w-4 h-4 transition-transform group-hover:scale-110" />
            Give Feedback (Google Form)
          </button>

          {/* Option 2: Return to Home Page */}
          <button
            onClick={handleClose}
            className="w-full py-3.5 px-5 bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark text-content-main dark:text-content-mainDark hover:border-brand-orange/50 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Home className="w-4 h-4 text-brand-orange" />
            Return to Landing Page
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-[10px] text-center text-content-muted dark:text-content-mutedDark font-semibold uppercase tracking-wider mt-6">
          MerchantPro QR Scanner System
        </p>
          </>
        )}
      </div>
    </div>
  );
};

export default TrialEndedModal;

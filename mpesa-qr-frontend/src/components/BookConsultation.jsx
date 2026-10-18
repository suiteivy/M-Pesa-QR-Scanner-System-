import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Mail, Loader2, CheckCircle, AlertCircle, ArrowLeft, Zap, PhoneCall, X } from 'lucide-react';
import ThemeToggle from './ui/Toggle';

const BookConsultation = ({ onClose }) => {
  const navigate = useNavigate();
  const isModal = Boolean(onClose);
  const cardClassName = isModal
    ? 'bg-brand-surface dark:bg-brand-gray border border-brand-borderLight dark:border-brand-borderDark rounded-2xl p-5 sm:p-6 shadow-xl max-w-sm w-full mx-auto relative overflow-hidden'
    : 'bg-brand-surface dark:bg-brand-gray border border-brand-borderLight dark:border-brand-borderDark rounded-[2rem] p-8 md:p-10 shadow-xl max-w-md w-full mx-auto relative overflow-hidden';
  const [formData, setFormData] = useState({ name: '', email: '', date: '', time: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    try {
      const formattedDate = new Date(formData.date).toLocaleDateString('en-KE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const subject = encodeURIComponent(`MerchantPro Demo & Contact Request: ${formData.name}`);
      const body = encodeURIComponent(
        `Hi MerchantPro Team,\n\nI would like to schedule a 1-on-1 consultation and demo of the platform.\n\nHere are my details:\n\n- Name: ${formData.name}\n- Contact Email: ${formData.email}\n- Requested Date: ${formattedDate}\n- Requested Time: ${formData.time}\n\nLooking forward to speaking with you!`
      );

      const mailtoLink = `mailto:mpesaqr@cloudora.live?subject=${subject}&body=${body}`;
      window.location.href = mailtoLink;

      setStatus({ type: 'success', msg: 'Opening your email app...' });
    } catch (err) {
      setStatus({ 
        type: 'error', 
        msg: 'Failed to open email client. Please email us directly at mpesaqr@cloudora.live' 
      });
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={isModal ? 'w-full text-zinc-950 dark:text-white' : 'min-h-screen w-full bg-white dark:bg-brand-black text-zinc-950 dark:text-white transition-colors duration-500 flex flex-col justify-between overflow-x-hidden'}>
      
      {/* Top Header Bar */}
      {!isModal && <nav className="w-full border-b border-zinc-200 dark:border-brand-gray/50 backdrop-blur-xl bg-white/90 dark:bg-brand-black/90 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={() => navigate('/landing')}>
            <div className="bg-brand-orange p-2 rounded-xl shadow-lg shadow-brand-orange/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-zinc-950 fill-current" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic dark:text-white">
              Merchant<span className="text-brand-orange">Pro</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => navigate('/landing')}
              className="h-10 px-4 bg-brand-light dark:bg-brand-gray/80 border border-brand-borderLight dark:border-brand-borderDark text-content-main dark:text-content-mainDark rounded-xl font-black uppercase tracking-widest text-[10px] hover:border-brand-orange transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 text-brand-orange" />
              Back to Landing Page
            </button>
          </div>
        </div>
      </nav>}

      {/* Form Container */}
      <main className={isModal ? 'w-full' : 'flex-1 flex items-center justify-center p-4 md:p-8 my-8'}>
        <div className={cardClassName}>
          {isModal && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close consultation"
              className="absolute top-3 right-3 z-20 p-2 text-content-muted dark:text-content-mutedDark hover:text-content-main dark:hover:text-content-mainDark hover:bg-brand-light dark:hover:bg-brand-black rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          <div className={`text-center relative z-10 ${isModal ? 'mb-5 pt-1' : 'mb-8'}`}>
            <div className={`bg-brand-orange/10 rounded-2xl flex items-center justify-center mx-auto border border-brand-orange/20 ${isModal ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-4'}`}>
              <Calendar className={isModal ? 'w-6 h-6 text-brand-orange' : 'w-8 h-8 text-brand-orange'} />
            </div>
            <h2 className={`${isModal ? 'text-lg' : 'text-2xl'} font-black text-content-main dark:text-content-mainDark uppercase italic tracking-tighter`}>
              Schedule a <span className="text-brand-orange">Consultation</span>
            </h2>
            <p className="text-content-muted dark:text-content-mutedDark text-xs font-bold uppercase tracking-widest mt-2">
              Contact us for a 1-on-1 consultation & demo
            </p>
          </div>

          <form onSubmit={handleSubmit} className={`relative z-10 ${isModal ? 'space-y-3' : 'space-y-5'}`}>
            
            {/* Name & Email */}
            <div className={isModal ? 'space-y-3' : 'space-y-4'}>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-muted" />
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Your Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full ${isModal ? 'h-12 pl-11 rounded-xl' : 'h-14 pl-12 rounded-2xl'} pr-4 bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark text-content-main dark:text-content-mainDark font-medium outline-none focus:border-brand-orange transition-colors`}
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-muted" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Your Business Email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full ${isModal ? 'h-12 pl-11 rounded-xl' : 'h-14 pl-12 rounded-2xl'} pr-4 bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark text-content-main dark:text-content-mainDark font-medium outline-none focus:border-brand-orange transition-colors`}
                />
              </div>
            </div>

            {/* Date & Time Row */}
            <div className={`grid grid-cols-2 ${isModal ? 'gap-3' : 'gap-4'}`}>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-muted" />
                <input
                  type="date"
                  name="date"
                  required
                  min={today}
                  value={formData.date}
                  onChange={handleChange}
                  className={`w-full ${isModal ? 'h-12 pl-10 pr-2 rounded-xl' : 'h-14 pl-12 pr-4 rounded-2xl'} bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark text-content-main dark:text-content-mainDark font-medium outline-none focus:border-brand-orange transition-colors [color-scheme:light] dark:[color-scheme:dark]`}
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-muted" />
                <input
                  type="time"
                  name="time"
                  required
                  value={formData.time}
                  onChange={handleChange}
                  className={`w-full ${isModal ? 'h-12 pl-10 pr-2 rounded-xl' : 'h-14 pl-12 pr-4 rounded-2xl'} bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark text-content-main dark:text-content-mainDark font-medium outline-none focus:border-brand-orange transition-colors [color-scheme:light] dark:[color-scheme:dark]`}
                />
              </div>
            </div>

            {/* Status Messages */}
            {status.msg && (
              <div className={`p-4 rounded-xl flex items-start gap-3 animate-in fade-in ${
                status.type === 'success' ? 'bg-status-successBg text-status-success' : 'bg-status-errorBg text-status-error'
              }`}>
                {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <p className="text-xs font-bold uppercase tracking-wider leading-snug">{status.msg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${isModal ? 'h-12 rounded-xl text-xs' : 'h-14 rounded-2xl text-sm'} bg-brand-orange text-zinc-950 hover:bg-brand-orange/90 font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-brand-orange/20`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Request Consultation'}
            </button>
          </form>

          {/* Ambient Background Glow */}
          {!isModal && <div className="absolute inset-0 bg-brand-orange/10 rounded-[2rem] blur-3xl opacity-30 animate-pulse pointer-events-none" />}

          {/* Direct Phone Contact Information */}
          <div className={`relative z-10 text-center space-y-2 border-t border-brand-borderLight dark:border-brand-borderDark/50 ${isModal ? 'mt-4 pt-3' : 'mt-6 pt-4'}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-content-muted dark:text-content-mutedDark flex items-center justify-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-brand-orange" />
              Direct Line:{' '}
              <a 
                href="tel:+254759585197" 
                className="text-brand-orange hover:text-brand-orangeHover hover:underline transition-colors font-black"
              >
                +254 759 585 197
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      {!isModal && <footer className="py-6 border-t border-zinc-200 dark:border-brand-gray/50 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-content-muted dark:text-content-mutedDark">
          MerchantPro QR Scanner System
        </p>
      </footer>}
    </div>
  );
};

export default BookConsultation;
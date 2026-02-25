import React, { useState } from 'react';
import { Calendar, Clock, User, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const BookConsultation = () => {
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
      // 1. Format the Date nicely for the email body
      const formattedDate = new Date(formData.date).toLocaleDateString('en-KE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // 2. Construct the Email Subject and Body
      // We use encodeURIComponent to ensure spaces and line breaks format correctly in Gmail
      const subject = encodeURIComponent(`MerchantPro Demo Request: ${formData.name}`);
      const body = encodeURIComponent(
        `Hi MerchantPro Team,\n\nI would like to schedule a 1-on-1 consultation and demo of the platform.\n\nHere are my details:\n\n- Name: ${formData.name}\n- Contact Email: ${formData.email}\n- Requested Date: ${formattedDate}\n- Requested Time: ${formData.time}\n\nLooking forward to speaking with you!`
      );

      // 3. Fire the Mailto link
      const mailtoLink = `mailto:cloudoraltd@gmail.com?subject=${subject}&body=${body}`;
      
      // This tells the browser to open the default email app (Gmail, Apple Mail, etc.)
      window.location.href = mailtoLink;

      // 4. Update UI to show success
      setStatus({ type: 'success', msg: 'Opening your email app...' });
      
    } catch (err) {
      setStatus({ 
        type: 'error', 
        msg: 'Failed to open email client. Please email us directly at cloudoraltd@gmail.com' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format to prevent booking in the past
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-brand-surface dark:bg-brand-gray border border-brand-borderLight dark:border-brand-borderDark rounded-[2rem] p-8 md:p-10 shadow-xl max-w-md w-full mx-auto relative overflow-hidden">
      
      <div className="text-center mb-8 relative z-10">
        <div className="bg-brand-orange/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-brand-orange" />
        </div>
        <h2 className="text-2xl font-black text-content-main dark:text-content-mainDark uppercase italic tracking-tighter">
          Book a <span className="text-brand-orange">Demo</span>
        </h2>
        <p className="text-content-muted dark:text-content-mutedDark text-xs font-bold uppercase tracking-widest mt-2">
          Schedule a 1-on-1 consultation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        
        {/* Name & Email */}
        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-muted" />
            <input
              type="text"
              name="name"
              required
              placeholder="Your Full Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full h-14 pl-12 pr-4 bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark rounded-2xl text-content-main dark:text-content-mainDark font-medium outline-none focus:border-brand-orange transition-colors"
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
              className="w-full h-14 pl-12 pr-4 bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark rounded-2xl text-content-main dark:text-content-mainDark font-medium outline-none focus:border-brand-orange transition-colors"
            />
          </div>
        </div>

        {/* Date & Time Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-muted" />
            <input
              type="date"
              name="date"
              required
              min={today}
              value={formData.date}
              onChange={handleChange}
              className="w-full h-14 pl-12 pr-4 bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark rounded-2xl text-content-main dark:text-content-mainDark font-medium outline-none focus:border-brand-orange transition-colors [color-scheme:light] dark:[color-scheme:dark]"
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
              className="w-full h-14 pl-12 pr-4 bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark rounded-2xl text-content-main dark:text-content-mainDark font-medium outline-none focus:border-brand-orange transition-colors [color-scheme:light] dark:[color-scheme:dark]"
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
          className="w-full h-14 bg-brand-buttonBase dark:bg-brand-buttonDark text-brand-buttonText dark:text-brand-buttonTextDark hover:opacity-80 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Request Invite'}
        </button>
      </form>
   {/* Ambient Background Glow */}
<div className="absolute inset-0 bg-brand-orange/10 rounded-[2rem] blur-3xl opacity-30 animate-pulse pointer-events-none" />

{/* Contact Information (Must be relative z-10 to sit above the glow) */}
<div className="relative z-10 mt-6 text-center space-y-2">
  
  <p className="text-[10px] font-bold uppercase tracking-widest text-content-muted dark:text-content-mutedDark">
    or call us at{' '}
    <a 
      href="tel:+254759585197" 
      className="text-brand-orange hover:text-brand-orangeHover hover:underline transition-colors"
    >
      +254759585197
    </a>
  </p>
</div>
    </div>
  );
};

export default BookConsultation;
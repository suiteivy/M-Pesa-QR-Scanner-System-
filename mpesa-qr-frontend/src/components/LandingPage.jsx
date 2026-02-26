import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  Zap,
  Smartphone,
  BarChart3,
  ShieldCheck,
  DollarSign,
  ArrowUpRight,
  ArrowRight,   // <--- NEW IMPORT
  LinkIcon,    // <--- NEW IMPORT (You can replace this with an appropriate icon from lucide-react)
  ScanFace,    // <--- NEW IMPORT (You can replace this with an appropriate icon from lucide-react)
  Menu,
  Check,       // <--- NEW IMPORT
  Utensils,    // <--- NEW IMPORT
  Plus ,        // <--- NEW IMPORT
  Gift         // <--- NEW IMPORT

} from 'lucide-react';



import ThemeToggle from './ui/Toggle';
import Badge from './ui/Badge';
import BookConsultation from './BookConsultation';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showBookConsultation, setShowBookConsultation] = React.useState(false);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

return (
    <div className="min-h-screen w-full bg-brand-light dark:bg-brand-black text-content-main dark:text-content-mainDark transition-colors duration-500 overflow-x-hidden scroll-smooth">

      {/* --- 1. NAVIGATION --- */}
      <nav className="fixed top-0 w-full z-50 border-b border-brand-borderLight dark:border-brand-borderDark backdrop-blur-xl bg-brand-light/90 dark:bg-brand-black/90">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">

          <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={() => scrollToSection('top')}>
            <div className="bg-brand-orange p-2 rounded-xl shadow-lg shadow-brand-orange/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic dark:text-white">
              Merchant<span className="text-brand-orange">Pro</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <button onClick={() => scrollToSection('how-it-works')} className="text-xs font-black uppercase tracking-widest text-content-muted dark:text-content-mutedDark hover:text-brand-orange transition-colors">How it Works</button>
            <button onClick={() => scrollToSection('features')} className="text-xs font-black uppercase tracking-widest text-content-muted dark:text-content-mutedDark hover:text-brand-orange transition-colors">Features</button>
            <button onClick={() => scrollToSection('pricing')} className="text-xs font-black uppercase tracking-widest text-content-muted dark:text-content-mutedDark hover:text-brand-orange transition-colors">Start Free</button>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
      {   /*   <button
              onClick={() => navigate('/login')}
              className="hidden md:block text-xs font-black uppercase tracking-[0.2em] text-content-muted hover:text-brand-orange transition-colors"
            >
              Login
            </button>
 */}
            {/* HCI: Main CTA explicitly states "Free Trial" */}
            <button
              onClick={() => navigate('/login')}
              className="h-10 px-5 md:px-6 bg-brand-orange text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-orange/20 hover:scale-105 active:scale-95 transition-all"
            >
              Demo Trial
            </button>
          </div>
        </div>
      </nav>

      {/* --- 2. THE HERO: FREE TRIAL FOCUS --- */}
      <section id="top" className="relative min-h-[100svh] flex flex-col justify-center pt-20 pb-12 px-4 md:px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">

          {/* HCI: Badge explicitly advertises the trial to remove immediate friction */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-brand-orange/10 text-brand-orange border border-brand-orange/20 animate-in fade-in zoom-in duration-700">
            <Gift className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              10-Day Unrestricted Free Trial
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase italic leading-[0.9] text-zinc-950 dark:text-white animate-in slide-in-from-bottom-12 duration-1000">
            Accept M-Pesa.<br />
            <span className="text-brand-orange">Zero Friction.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-content-muted dark:text-content-mutedDark font-bold text-sm md:text-xl animate-in fade-in duration-1000 delay-300 px-4">
            Turn your phone into a smart payment terminal. Experience the full power of MerchantPro risk-free. No commitment required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 md:pt-6 animate-in zoom-in-95 duration-1000 delay-500">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-12 bg-brand-orange text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-orange/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Start Your Free Trial <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="w-full sm:w-auto h-14 md:h-16 px-8 bg-brand-surface dark:bg-brand-gray text-content-main dark:text-content-mainDark border-2 border-brand-borderLight dark:border-brand-borderDark rounded-2xl font-black uppercase tracking-widest text-xs hover:border-brand-orange transition-all flex items-center justify-center"
            >
              See How It Works
            </button>
          </div>
          
          <p className="text-[10px] font-bold text-content-muted uppercase tracking-widest animate-in fade-in duration-1000 delay-700 mt-4">
            <ShieldCheck className="w-3 h-3 inline pb-0.5 mr-1" /> No M-Pesa deductions during trial
          </p>
        </div>
      </section>

      {/* --- 3. LEARNABILITY: HOW DOES IT WORK? (Unchanged, remains strong) --- */}
      <section id="how-it-works" className="bg-brand-surface dark:bg-brand-gray border-y border-brand-borderLight dark:border-brand-borderDark py-20 md:py-32 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-zinc-950 dark:text-white">
              3 Steps to <span className="text-brand-orange">Get Paid</span>
            </h2>
            <p className="text-content-muted mt-4 font-bold text-sm uppercase tracking-widest">No coding or extra hardware required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-30 z-0" />

            {[
              { step: '01', title: 'Link Your Till', desc: 'Enter your existing Safaricom Till or Paybill number securely.', icon: LinkIcon },
              { step: '02', title: 'Generate QR', desc: 'Type in the amount owed. We instantly generate a unique QR code.', icon: QrCode },
              { step: '03', title: 'Customer Scans', desc: 'The customer scans the code. The M-Pesa PIN prompt appears automatically.', icon: ScanFace }
            ].map((item, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-brand-light dark:bg-brand-black border-4 border-brand-surface dark:border-brand-gray shadow-xl flex items-center justify-center mb-6 group-hover:border-brand-orange transition-colors duration-500">
                  <item.icon className="w-10 h-10 text-brand-orange" />
                </div>
                <Badge variant="secondary" className="mb-4 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">STEP {item.step}</Badge>
                <h3 className="text-xl font-black uppercase italic text-zinc-950 dark:text-white mb-3">{item.title}</h3>
                <p className="text-content-muted dark:text-content-mutedDark text-sm font-medium leading-relaxed max-w-[250px]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 4. FEATURES --- */}
      <section id="features" className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-32">
        <div className="mb-12 text-center md:text-left">
          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-zinc-950 dark:text-white">
            Included in your <span className="text-brand-orange">Trial</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="md:col-span-2 bg-brand-orange text-white shadow-2xl relative overflow-hidden rounded-[2rem] p-8 md:p-12 group">
            <div className="relative z-10">
              <h3 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-[0.9] mb-4">
                Dynamic QR <br /> Generation
              </h3>
              <p className="max-w-md font-bold text-sm leading-relaxed mb-8 opacity-90">
                Stop telling customers your Till number and the amount. Our system embeds the price directly into the QR code. They scan, enter PIN, and you're done.
              </p>
            </div>
            <QrCode className="absolute -right-8 -bottom-8 h-64 w-64 text-black/10 -rotate-12 group-hover:rotate-0 transition-all duration-1000" />
          </div>

          <div className="bg-brand-black border border-brand-borderDark text-white relative overflow-hidden rounded-[2rem] p-8 md:p-12 group">
            <div className="relative z-10">
              <div className="bg-brand-gray w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-brand-orange" />
              </div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-4">
                Live<br />Analytics.
              </h3>
              <p className="text-content-mutedDark font-medium text-sm">
                Track revenue, view success rates, and monitor all your transactions in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 5. REDEFINED PRICING: TRIAL FOCUSED --- */}
  {/* --- 5. REDEFINED PRICING: "PRO" TRIAL FOCUSED --- */}
      <section id="pricing" className="bg-brand-surface dark:bg-brand-gray border-y border-brand-borderLight dark:border-brand-borderDark py-20 md:py-32 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-zinc-950 dark:text-white">
              Try <span className="text-brand-orange">Pro</span> Free.
            </h2>
            <p className="text-content-muted font-bold uppercase tracking-widest mt-4 text-xs">
              Get full access to all premium features for 10 days. No credit card required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch">
            
            {/* 1. THE STAR OF THE SHOW: PRO TRIAL CARD */}
            <div className="bg-brand-orange text-white rounded-[2rem] p-8 md:p-10 relative transform md:-translate-y-4 shadow-2xl shadow-brand-orange/20 border-2 border-brand-orange">
              <div className="absolute top-0 right-0 bg-white text-brand-orange px-4 py-1 rounded-bl-xl rounded-tr-[1.8rem] text-[10px] font-black uppercase tracking-widest shadow-sm">
                Start Here
              </div>
              <h3 className="text-4xl font-black uppercase italic tracking-tighter mb-2">10-Day Pro Trial</h3>
              <p className="text-white/80 font-bold text-xs uppercase tracking-wide mb-8">
                Unrestricted access to the entire platform.
              </p>

              <div className="space-y-5 mb-10">
                {[
                  'Full Pro Plan Access', 
                  'Unlimited QR Generation', 
                  'Live Revenue Analytics', 
                  'Priority Support', 
                  'Zero Commitment'
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="bg-white/20 p-1 rounded-full shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-bold">{feat}</span>
                  </div>
                ))}
              </div>
              
              <button onClick={() => setShowBookConsultation(true)} className="w-full h-16 bg-white text-brand-orange rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-transform shadow-xl">
                Claim Free Trial
              </button>
            </div>

            {/* 2. THE PAID TIER (What happens after) */}
            <div className="bg-brand-light dark:bg-brand-black border-2 border-brand-borderLight dark:border-brand-borderDark rounded-[2rem] p-8 md:p-10 relative flex flex-col justify-between">
              <div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-content-main dark:text-content-mainDark mb-2">Pro Plan</h3>
                <p className="text-content-muted dark:text-content-mutedDark font-bold text-xs uppercase tracking-wide mb-8">
                  After your 10-day trial ends.
                </p>

                <div className="flex items-end gap-2 mb-8">
                  <span className="text-4xl font-black italic tracking-tighter text-content-main dark:text-content-mainDark">KES 1,500</span>
                  <span className="text-xs font-bold text-content-muted uppercase tracking-widest mb-1.5">/ month</span>
                </div>

                <div className="space-y-4 mb-10">
                  {[
                    'Keep all Pro Features', 
                    'AI Revenue Predictions', 
                    'CSV Transaction Exports', 
                    'Optional Menu Add-on (+500/mo)'
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="bg-brand-orange/10 dark:bg-brand-orange/20 p-1 rounded-full shrink-0">
                        <Check className="w-3 h-3 text-brand-orange" />
                      </div>
                      <span className="text-sm font-medium text-content-main dark:text-content-mainDark">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
            {showBookConsultation && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="relative w-full max-w-md">
                  <button 
                    onClick={() => setShowBookConsultation(false)}
                    className="absolute top-4 right-4 z-50 p-2 bg-brand-light/50 dark:bg-brand-black/50 hover:bg-brand-light dark:hover:bg-brand-black rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-content-main dark:text-content-mainDark" />
                  </button>
                  <BookConsultation />
                </div>
              </div>
            )}

      {/* --- FOOTER --- */}
      <footer className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="text-2xl font-black tracking-tighter text-zinc-950 dark:text-white uppercase italic leading-none">
              Merchant<span className="text-brand-orange">Pro</span>
            </div>
            <p className="text-center md:text-left text-[10px] font-bold uppercase tracking-widest text-content-muted leading-relaxed">
              © 2026 • Cloudora Ltd. All rights reserved. <br className="hidden md:block" />
              Designed in Nairobi. Powered by M-Pesa.
            </p>
          </div>

<div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
  {/* Section Label */}
  <p className="text-[10px] font-black uppercase tracking-widest text-content-muted dark:text-content-mutedDark mb-1">
    Support & Contact
  </p>

  {/* Primary Action: Phone */}
  <a
    href="tel:+254759585197"
    className="text-base font-black tracking-widest text-brand-orange hover:text-brand-orangeHover transition-colors"
  >
    +254 759 585 197
  </a>

  {/* Secondary Actions: Emails Stacked */}
  <div className="flex flex-col gap-1.5 items-center md:items-end mt-1">
    <a
      href="mailto:mpesaqr@cloudora.live"
      className="text-xs font-bold tracking-wider text-content-main dark:text-content-mainDark hover:text-brand-orange transition-colors"
    >
      mpesaqr@cloudora.live
    </a>
        <a
      href="mailto:support@cloudora.live"
      className="text-xs font-bold tracking-wider text-content-main dark:text-content-mainDark hover:text-brand-orange transition-colors"
    >
      support@cloudora.live
    </a>
        <a
      href="mailto:contact@cloudora.live"
      className="text-xs font-bold tracking-wider text-content-main dark:text-content-mainDark hover:text-brand-orange transition-colors"
    >
      contact@cloudora.live
    </a>
  </div>
</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

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
  Plus         // <--- NEW IMPORT
} from 'lucide-react';



import ThemeToggle from './ui/Toggle';
import Badge from './ui/Badge';

const LandingPage = () => {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    // 1. GLOBAL CONTAINER
    <div className="min-h-screen w-full bg-white dark:bg-brand-black text-zinc-950 dark:text-white transition-colors duration-500 overflow-x-hidden scroll-smooth">

      {/* --- 1. ORIENTATION: CLEAR NAVIGATION --- */}
      {/* HCI Principle: Always visible navigation provides an 'escape hatch' and site map */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-200 dark:border-brand-gray/50 backdrop-blur-xl bg-white/90 dark:bg-brand-black/90">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">

          {/* Logo / Home Anchor */}
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={() => scrollToSection('top')}>
            <div className="bg-brand-orange p-2 rounded-xl shadow-lg shadow-brand-orange/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-zinc-950 fill-current" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic dark:text-white">
              Merchant<span className="text-brand-orange">Pro</span>
            </span>
          </div>

          {/* Desktop Section Links */}
          <div className="hidden lg:flex items-center gap-8">
            <button onClick={() => scrollToSection('how-it-works')} className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-brand-orange transition-colors">How it Works</button>
            <button onClick={() => scrollToSection('features')} className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-brand-orange transition-colors">Features</button>
            <button onClick={() => scrollToSection('pricing')} className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-brand-orange transition-colors">Pricing</button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => navigate('/login')}
              className="hidden md:block text-xs font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="h-10 px-5 md:px-6 bg-brand-orange text-zinc-950 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-orange/20 hover:scale-105 active:scale-95 transition-all"
            >
              Create Account
            </button>
          </div>
        </div>
      </nav>

      {/* --- 2. THE HERO: WHAT IS THIS? --- */}
      {/* HCI Principle: Value Proposition must be instantly readable without jargon. */}
      {/* --- THE HERO: WHAT IS THIS? --- */}
      <section id="top" className="relative min-h-[100svh] flex flex-col justify-center pt-20 pb-12 px-4 md:px-6 overflow-hidden">
        {/* Tightened the space-y gap slightly so it fits perfectly on smaller screens */}
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-brand-orange/10 text-brand-orange border border-brand-orange/20 animate-in fade-in zoom-in duration-700">
            <Zap className="w-4 h-4 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              The Modern M-Pesa Checkout
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase italic leading-[0.9] text-zinc-950 dark:text-white animate-in slide-in-from-bottom-12 duration-1000">
            Accept M-Pesa.<br />
            <span className="text-brand-orange">Zero Friction.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-zinc-600 dark:text-zinc-400 font-bold text-sm md:text-xl animate-in fade-in duration-1000 delay-300 px-4">
            Turn your phone or tablet into a smart payment terminal. Generate dynamic QR codes that open M-Pesa instantly for your customers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 md:pt-6 animate-in zoom-in-95 duration-1000 delay-500">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-12 bg-brand-orange text-zinc-950 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-orange/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="w-full sm:w-auto h-14 md:h-16 px-8 bg-zinc-100 dark:bg-brand-black text-zinc-950 dark:text-white border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-200 dark:hover:bg-zinc-900 transition-all flex items-center justify-center"
            >
              See How It Works
            </button>
          </div>
        </div>
      </section>

      {/* --- 3. LEARNABILITY: HOW DOES IT WORK? --- */}
      {/* HCI Principle: Build a mental model before asking them to sign up. */}
      <section id="how-it-works" className="bg-zinc-50 dark:bg-brand-black border-y border-zinc-200 dark:border-zinc-800/50 py-20 md:py-32 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-zinc-950 dark:text-white">
              3 Steps to <span className="text-brand-orange">Get Paid</span>
            </h2>
            <p className="text-zinc-500 mt-4 font-bold text-sm uppercase tracking-widest">No coding or extra hardware required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            {/* Connecting Line for Desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-zinc-200 via-brand-orange to-zinc-200 dark:from-zinc-800 dark:via-brand-orange dark:to-zinc-800 z-0" />

            {[
              {
                step: '01', title: 'Link Your Till',
                desc: 'Enter your existing Safaricom Till or Paybill number securely into your dashboard.',
                icon: LinkIcon
              },
              {
                step: '02', title: 'Generate QR',
                desc: 'Type in the amount owed. We instantly generate a unique QR code for that exact transaction.',
                icon: QrCode
              },
              {
                step: '03', title: 'Customer Scans',
                desc: 'The customer scans the code with their phone camera. The M-Pesa PIN prompt appears automatically.',
                icon: ScanFace
              }
            ].map((item, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-white dark:bg-zinc-900 border-4 border-zinc-50 dark:border-brand-black shadow-xl flex items-center justify-center mb-6 group-hover:border-brand-orange transition-colors duration-500">
                  <item.icon className="w-10 h-10 text-brand-orange" />
                </div>
                <Badge variant="secondary" className="mb-4 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">STEP {item.step}</Badge>
                <h3 className="text-xl font-black uppercase italic text-zinc-950 dark:text-white mb-3">{item.title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed max-w-[250px]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 4. FEATURES (Retained Bento Box style but clearer copy) --- */}
      <section id="features" className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-32">
        <div className="mb-12 text-center md:text-left">
          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-zinc-950 dark:text-white">
            Powerful <span className="text-brand-orange">Features</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

          <div className="md:col-span-2 bg-brand-orange text-zinc-950 shadow-2xl relative overflow-hidden rounded-[2rem] p-8 md:p-12 group">
            <div className="relative z-10">
              <h3 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-[0.9] mb-4">
                Dynamic QR <br /> Generation
              </h3>
              <p className="max-w-md font-bold text-sm leading-relaxed mb-8 opacity-80">
                Stop telling customers your Till number and the amount. Our system embeds the price directly into the QR code. They scan, enter PIN, and you're done.
              </p>
            </div>
            <QrCode className="absolute -right-8 -bottom-8 h-64 w-64 text-zinc-950/10 -rotate-12 group-hover:rotate-0 transition-all duration-1000" />
          </div>

          <div className="bg-zinc-950 border border-zinc-800 text-white relative overflow-hidden rounded-[2rem] p-8 md:p-12 group">
            <div className="relative z-10">
              <div className="bg-zinc-800 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-brand-orange" />
              </div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-4">
                Live<br />Analytics.
              </h3>
              <p className="text-zinc-400 font-medium text-sm">
                Track revenue, view success rates, and monitor all your transactions in real-time from any device.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 5. PRICING --- */}
      <section id="pricing" className="bg-zinc-50 dark:bg-brand-black/40 border-y border-zinc-200 dark:border-brand-gray/50 py-20 md:py-32 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-zinc-950 dark:text-white">
              Transparent <span className="text-brand-orange">Pricing</span>
            </h2>
            <p className="text-zinc-500 font-bold uppercase tracking-widest mt-4 text-xs">Start free. Upgrade when you need more power.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-start">
            {/* STARTER */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 md:p-10 relative hover:border-brand-orange/50 transition-colors">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-zinc-950 dark:text-white mb-2">Starter</h3>
              <p className="text-zinc-500 font-bold text-xs uppercase tracking-wide mb-6">10-Day Free Trial</p>

              <div className="space-y-4 mb-10">
                {['Unlimited QR Generation', 'Instant STK Pushes', 'Basic Digital Receipts'].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-brand-orange" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{feat}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/register')} className="w-full h-14 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                Start Trial
              </button>
            </div>

            {/* PRO */}
            <div className="bg-brand-orange text-zinc-950 rounded-[2rem] p-8 md:p-10 relative transform md:-translate-y-4 shadow-2xl shadow-brand-orange/20">
              <div className="absolute top-0 right-0 bg-zinc-950 text-white px-4 py-1 rounded-bl-xl rounded-tr-[2rem] text-[10px] font-black uppercase tracking-widest">
                Most Popular
              </div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Pro</h3>
              <p className="text-zinc-800 font-bold text-xs uppercase tracking-wide mb-6">KES 1,500 / month</p>

              <div className="space-y-4 mb-10">
                {['Everything in Starter', 'AI Revenue Analytics', 'Transaction Export (CSV)', 'Priority Support'].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-zinc-950" />
                    <span className="text-sm font-bold text-zinc-900">{feat}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/register')} className="w-full h-14 bg-zinc-950 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-lg shadow-black/20">
                Upgrade to Pro
              </button>
            </div>

            {/* ADD ON */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 md:p-10 relative hover:border-zinc-400 transition-colors">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-zinc-950 dark:text-white mb-2">Menu Add-on</h3>
              <p className="text-zinc-500 font-bold text-xs uppercase tracking-wide mb-6">+ KES 500 / month</p>

              <div className="space-y-4 mb-10">
                {['Digital QR Menus', 'Inventory Tracking', 'Direct Menu Ordering'].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Plus className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER (Same logic, slightly cleaner layout) --- */}
      <footer className="max-w-7xl mx-auto px-6 py-12 md:py-16 border-t border-zinc-200 dark:border-brand-gray/50">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">

          {/* --- LEFT SIDE: Brand & Copyright (Grouped for Proximity) --- */}
          <div className="flex flex-col items-center md:items-start gap-4">
            {/* Brand Logo */}
            <div className="text-2xl font-black tracking-tighter text-zinc-950 dark:text-white uppercase italic leading-none">
              Merchant<span className="text-brand-orange">Pro</span>
            </div>

            {/* Copyright Data */}
            <p className="text-center md:text-left text-[10px] font-bold uppercase tracking-widest text-zinc-500 leading-relaxed">
              © 2026 • Cloudora Ltd. All rights reserved. <br className="hidden md:block" />
              Designed in Nairobi. Powered by M-Pesa.
            </p>
          </div>

          {/* --- RIGHT SIDE: Actionable Contact Info --- */}
          <div className="flex flex-col items-center md:items-end gap-1.5 text-center md:text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Support
            </p>
            <a
              href="mailto:cloudoraltd@gmail.com"
              className="text-sm md:text-base font-black uppercase tracking-wider text-zinc-950 dark:text-white hover:text-brand-orange dark:hover:text-brand-orange transition-colors"
            >
              cloudoraltd@gmail.com
            </a>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

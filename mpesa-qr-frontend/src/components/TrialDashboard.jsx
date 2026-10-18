import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import TrialEndedModal from './TrialEndedModal';

import {
  BarChart3, Calendar, Download, Filter,
  AlertCircle, Menu, X, QrCode, Activity,
  CreditCard, Smartphone, Clock, ArrowUpRight,
  LogOut, ShieldOff, Sparkles, ShoppingBag, ClipboardList, RefreshCw
} from 'lucide-react';

import ThemeToggle from './ui/Toggle';
import AnalyticsModule from './AnalyticsModule';
import MenuModule from './MenuModule';
import { useFreeTrial } from '../hooks/FreeTrialContext';
import {
  DEMO_MERCHANT,
  DEMO_ANALYTICS,
  DEMO_TRANSACTIONS,
} from '../utility/demoData';

// TrialDashboard is the full dashboard experience shown to a free trial user.
// It is fully self-contained: it does not require a Firebase user or any backend call.
// All data is sourced from demoData.js.
const TrialDashboard = () => {
  const navigate = useNavigate();
  const { timeLeft, timeRemaining, isTrialExpired, hasUsedTrial, startTrial, trialStartTime } = useFreeTrial();

  useEffect(() => {
    if (!trialStartTime && !hasUsedTrial) {
      startTrial();
    }
  }, [trialStartTime, hasUsedTrial, startTrial]);

  const [activeTab, setActiveTab] = useState('overview');
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [period, setPeriod] = useState('week');
  const [status, setStatus] = useState('all');
  const [showEndTrialModal, setShowEndTrialModal] = useState(false);
  const [trialOrders, setTrialOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('trial_orders') || '[]'); } catch { return []; }
  });

  const refreshTrialOrders = () => {
    try { setTrialOrders(JSON.parse(localStorage.getItem('trial_orders') || '[]')); } catch { setTrialOrders([]); }
  };

  useEffect(() => {
    if (isTrialExpired) setShowEndTrialModal(true);
  }, [isTrialExpired]);

  useEffect(() => {
    const handleStorageChange = () => refreshTrialOrders();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  // ── Orders & Transactions Dynamic Calculations ─────────────────────────
  const totalOrdersAmount = trialOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const avgOrderAmount = trialOrders.length > 0 ? Math.round(totalOrdersAmount / trialOrders.length) : 0;

  // Convert customer orders placed in this session into live ledger transactions
  const liveOrderTransactions = trialOrders.map(order => ({
    id: order.id || `ord-${Math.random()}`,
    phoneNumber: order.phoneNumber || 'Customer Order',
    amount: Number(order.total) || 0,
    status: 'success',
    transactionRef: order.transactionRef || (order.id ? `TXN-${String(order.id).replace(/\D/g, '').slice(-6) || 'QR89'}` : 'MPX-ORD'),
    accountRef: order.tableNo && order.tableNo !== 'N/A' ? `Table ${order.tableNo}` : 'QR Menu',
    createdAt: order.createdAt || new Date().toISOString(),
    items: order.items || [],
    isLiveOrder: true,
  }));

  // Combine live customer transactions with demo transactions (newest first)
  const allTransactions = [...liveOrderTransactions, ...DEMO_TRANSACTIONS];

  // Filter based on status selector
  const filteredTransactions = status === 'all'
    ? allTransactions
    : allTransactions.filter(t => t.status === status);

  // Dynamic stats that update automatically when new orders/transactions occur
  const totalTxnCount = DEMO_ANALYTICS.summary.totalTransactions + liveOrderTransactions.length;
  const successfulTxnCount = DEMO_ANALYTICS.statusBreakdown.success + liveOrderTransactions.length;
  const totalRevenueAmount = DEMO_ANALYTICS.summary.totalRevenue + totalOrdersAmount;

  const stats = {
    totalRevenue: totalRevenueAmount,
    totalTransactions: totalTxnCount,
    successfulPayments: successfulTxnCount,
    pendingPayments: DEMO_ANALYTICS.statusBreakdown.pending,
    failedPayments: DEMO_ANALYTICS.statusBreakdown.failed,
    successRate: Math.round((successfulTxnCount / (totalTxnCount || 1)) * 100),
  };

  const formatCurrency = (amount) => `KSH ${parseFloat(amount || 0).toFixed(2)}`;

  const formatDate = (dateData) => {
    if (!dateData) return 'N/A';
    try {
      const date = dateData._seconds
        ? new Date(dateData._seconds * 1000)
        : new Date(dateData);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-KE', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const downloadCSV = () => {
    const headers = ['Date', 'Phone', 'Amount', 'Status', 'Reference'];
    const rows = filteredTransactions.map(t => [
      formatDate(t.createdAt),
      t.phoneNumber || 'N/A',
      t.amount,
      t.status,
      t.transactionRef,
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(c => `"${c}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demo-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const days = timeRemaining?.days ?? 0;
  const hours = String(timeRemaining?.hours ?? 0).padStart(2, '0');
  const minutes = String(timeRemaining?.minutes ?? 0).padStart(2, '0');
  const seconds = String(timeRemaining?.seconds ?? 0).padStart(2, '0');

  return (
    <div className="min-h-screen bg-brand-light dark:bg-brand-black text-content-main dark:text-content-mainDark transition-colors duration-300">

      {/* --- 3-DAY LIVE DIGITAL TIMER BANNER AT TOP OF SCREEN --- */}
      {!isTrialExpired && (
        <div className="bg-gradient-to-r from-brand-black via-zinc-900 to-brand-black border-b border-brand-orange/30 text-white px-4 py-3 shadow-lg z-50 relative">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            
            {/* Title & Pulse Badge */}
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-brand-orange/20 border border-brand-orange/40 rounded-xl text-brand-orange animate-pulse">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-orange flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> 3-Day Free Trial Active
                </p>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                  Full Merchant Features Unlocked
                </p>
              </div>
            </div>

            {/* Live 3-Day Digital Clock Display */}
            <div className="flex items-center gap-1.5 sm:gap-2 font-mono">
              <div className="flex flex-col items-center bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-xl shadow-inner min-w-[44px]">
                <span className="text-sm sm:text-base font-black text-white leading-none">{days}</span>
                <span className="text-[8px] text-zinc-400 font-bold uppercase">Days</span>
              </div>
              <span className="text-brand-orange font-black text-xs sm:text-sm">:</span>
              <div className="flex flex-col items-center bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-xl shadow-inner min-w-[44px]">
                <span className="text-sm sm:text-base font-black text-white leading-none">{hours}</span>
                <span className="text-[8px] text-zinc-400 font-bold uppercase">Hrs</span>
              </div>
              <span className="text-brand-orange font-black text-xs sm:text-sm">:</span>
              <div className="flex flex-col items-center bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-xl shadow-inner min-w-[44px]">
                <span className="text-sm sm:text-base font-black text-white leading-none">{minutes}</span>
                <span className="text-[8px] text-zinc-400 font-bold uppercase">Mins</span>
              </div>
              <span className="text-brand-orange font-black text-xs sm:text-sm">:</span>
              <div className="flex flex-col items-center bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-xl shadow-inner min-w-[44px]">
                <span className="text-sm sm:text-base font-black text-brand-orange leading-none">{seconds}</span>
                <span className="text-[8px] text-zinc-400 font-bold uppercase">Secs</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <button
                onClick={() => navigate('/landing?pricing=true', { state: { returnTo: '/trial' } })}
                className="flex-1 md:flex-none bg-brand-orange text-zinc-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                Upgrade <ArrowUpRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => setShowEndTrialModal(true)}
                className="flex-1 md:flex-none bg-zinc-800 hover:bg-zinc-700 text-status-error px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border border-status-error/30"
              >
                <ShieldOff className="w-3 h-3" /> End Trial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TRIAL EXPIRED BANNER --- */}
      {isTrialExpired && (
        <div className="bg-status-errorBg text-status-error border-b border-status-error/20 px-4 py-3 text-center flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 shadow-md z-40 relative animate-in slide-in-from-top-4">
          <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Your free trial has ended. Sign up to keep your data.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/register')}
              className="flex-1 sm:flex-none bg-status-error text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Calendar className="w-3 h-3" /> Create Account
            </button>
            <button
              onClick={() => navigate('/landing?pricing=true', { state: { returnTo: '/trial' } })}
              className="flex-1 sm:flex-none border border-status-error text-status-error px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-status-errorBg transition-colors flex items-center justify-center gap-2"
            >
              Upgrade
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-brand-surface dark:bg-brand-gray border-b border-brand-borderLight dark:border-brand-borderDark sticky top-0 z-40 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="bg-brand-orange p-2 rounded-xl text-white shadow-sm shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black uppercase italic tracking-tighter leading-none">
                Merchant<span className="text-brand-orange">Pro</span>
              </h1>
              <p className="text-[9px] md:text-[10px] text-content-muted dark:text-content-mutedDark font-bold uppercase tracking-widest mt-0.5">
                {DEMO_MERCHANT.name} | {DEMO_MERCHANT.accountType} &mdash; Demo Mode
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              onClick={() => navigate('/generate-qr')}
              variant="ghost"
              className="text-xs font-bold text-content-muted hover:text-brand-orange"
            >
              <QrCode className="w-4 h-4 mr-2" /> Generate QR
            </Button>
            <Button
              onClick={() => navigate('/payment-scanner')}
              variant="ghost"
              className="text-xs font-bold text-content-muted hover:text-brand-orange"
            >
              <Smartphone className="w-4 h-4 mr-2" /> Scanner
            </Button>
            <div className="w-px h-6 bg-brand-borderLight dark:bg-brand-borderDark mx-2" />
            <ThemeToggle />
            <Button
              onClick={() => setShowEndTrialModal(true)}
              variant="ghost"
              className="text-status-error hover:bg-status-errorBg text-xs font-bold"
            >
              <LogOut className="w-4 h-4 mr-2" /> End Trial
            </Button>
          </div>

          {/* Mobile Navigation Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowNavMenu(!showNavMenu)}
              className="border-brand-borderLight dark:border-brand-borderDark relative z-50 shrink-0"
            >
              {showNavMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {showNavMenu && (
          <div className="md:hidden absolute top-full left-0 w-full bg-brand-surface dark:bg-brand-gray border-b border-brand-borderLight dark:border-brand-borderDark shadow-xl py-4 px-4 flex flex-col gap-3 animate-in slide-in-from-top-2 z-40">
            <Button
              onClick={() => { navigate('/generate-qr'); setShowNavMenu(false); }}
              variant="outline"
              className="w-full justify-start border-brand-borderLight dark:border-brand-borderDark text-sm"
            >
              <QrCode className="w-4 h-4 mr-3 text-brand-orange" /> Generate QR
            </Button>
            <Button
              onClick={() => { navigate('/payment-scanner'); setShowNavMenu(false); }}
              variant="outline"
              className="w-full justify-start border-brand-borderLight dark:border-brand-borderDark text-sm"
            >
              <Smartphone className="w-4 h-4 mr-3 text-brand-orange" /> Payment Scanner
            </Button>
            <div className="h-px w-full bg-brand-borderLight dark:bg-brand-borderDark my-1" />
            <Button
              onClick={() => { setShowEndTrialModal(true); setShowNavMenu(false); }}
              variant="ghost"
              className="w-full justify-start text-status-error hover:bg-status-errorBg text-sm"
            >
              <LogOut className="w-4 h-4 mr-3" /> End Free Trial
            </Button>
          </div>
        )}
      </header>

      {/* DEMO MODE NOTICE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl px-5 py-3 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            Demo mode &mdash; All data shown below is simulated to demonstrate what your live dashboard would look like.
          </p>
        </div>
      </div>

      {/* DASHBOARD CONTENT */}
      <main
        className={`max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6 sm:space-y-8 pb-32 transition-opacity ${
          isTrialExpired ? 'opacity-30 pointer-events-none blur-sm select-none' : 'opacity-100'
        }`}
      >
        {/* Filters Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-brand-surface dark:bg-brand-gray p-4 rounded-2xl border border-brand-borderLight dark:border-brand-borderDark shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:min-w-[140px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark text-sm font-semibold rounded-xl pl-10 pr-8 py-2.5 focus:ring-2 focus:ring-brand-orange outline-none appearance-none"
              >
                <option value="all">All Statuses</option>
                <option value="success">Successful</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <Button
            onClick={downloadCSV}
            className="w-full lg:w-auto flex items-center justify-center font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-sm bg-brand-buttonBase text-brand-buttonText dark:bg-brand-buttonDark dark:!text-brand-buttonTextDark hover:opacity-80"
          >
            <Download className="w-4 h-4 mr-2 shrink-0" /> Export Log
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-brand-orange text-white border-none shadow-lg shadow-brand-orange/20">
            <CardContent className="p-5 sm:p-6">
              <p className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-black tracking-widest mb-2">
                Total Revenue
              </p>
              <div className="text-3xl font-black text-zinc-900 dark:text-white italic tracking-tighter truncate">
                {formatCurrency(stats.totalRevenue)}
              </div>
              <p className="text-emerald-600 text-[10px] mt-2 font-bold uppercase tracking-widest">
                {stats.totalTransactions} Completed Sales
              </p>
            </CardContent>
          </Card>

          <Card className="bg-brand-surface dark:bg-brand-gray border-brand-borderLight dark:border-brand-borderDark shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <p className="text-content-muted dark:text-content-mutedDark text-[10px] uppercase font-black tracking-widest mb-2">
                Success Rate
              </p>
              <div className="text-2xl sm:text-3xl font-black text-content-main dark:text-content-mainDark">
                {stats.successRate}%
              </div>
              <p className="text-status-success text-[10px] mt-2 font-bold uppercase tracking-widest">
                Transaction Health
              </p>
            </CardContent>
          </Card>

          <Card className="bg-brand-surface dark:bg-brand-gray border-brand-borderLight dark:border-brand-borderDark shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <p className="text-content-muted dark:text-content-mutedDark text-[10px] uppercase font-black tracking-widest mb-2">
                Pending
              </p>
              <div className="text-2xl sm:text-3xl font-black text-status-pending">
                {stats.pendingPayments}
              </div>
              <p className="text-content-muted text-[10px] mt-2 font-bold uppercase tracking-widest">
                Awaiting PIN
              </p>
            </CardContent>
          </Card>

          <Card className="bg-brand-surface dark:bg-brand-gray border-brand-borderLight dark:border-brand-borderDark shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <p className="text-content-muted dark:text-content-mutedDark text-[10px] uppercase font-black tracking-widest mb-2">
                Failed
              </p>
              <div className="text-2xl sm:text-3xl font-black text-status-error">
                {stats.failedPayments}
              </div>
              <p className="text-content-muted text-[10px] mt-2 font-bold uppercase tracking-widest">
                Requires Action
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === 'orders') refreshTrialOrders(); }} className="w-full">
          <TabsList className="flex w-full overflow-x-auto bg-brand-light dark:bg-brand-black p-1.5 rounded-2xl border border-brand-borderLight dark:border-brand-borderDark no-scrollbar">
            <TabsTrigger
              value="overview"
              className="flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest data-[state=active]:bg-brand-surface dark:data-[state=active]:bg-brand-gray rounded-xl shadow-sm transition-all whitespace-nowrap px-4"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest data-[state=active]:bg-brand-surface dark:data-[state=active]:bg-brand-gray rounded-xl shadow-sm transition-all whitespace-nowrap px-4"
            >
              Ledger
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest data-[state=active]:bg-brand-surface dark:data-[state=active]:bg-brand-gray rounded-xl shadow-sm transition-all whitespace-nowrap px-4 relative"
            >
              Orders
              {trialOrders.length > 0 && <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{trialOrders.length > 9 ? '9+' : trialOrders.length}</span>}
            </TabsTrigger>
            <TabsTrigger
              value="menu"
              className="flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest data-[state=active]:bg-brand-surface dark:data-[state=active]:bg-brand-gray rounded-xl shadow-sm transition-all whitespace-nowrap px-4"
            >
              Setup Menu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <AnalyticsModule analytics={DEMO_ANALYTICS} isDemo />
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <Card className="bg-brand-surface dark:bg-brand-gray border-brand-borderLight dark:border-brand-borderDark shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="p-4 sm:p-5 border-b border-brand-borderLight dark:border-brand-borderDark bg-brand-light dark:bg-brand-black/50">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-content-muted dark:text-content-mutedDark">
                  <Activity className="w-4 h-4 text-brand-orange" /> Recent Transactions
                  <div className="ml-auto flex items-center gap-2">
                    {liveOrderTransactions.length > 0 && (
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-700/50 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {liveOrderTransactions.length} Live Order{liveOrderTransactions.length > 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold normal-case tracking-normal border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                      {filteredTransactions.length} Total
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filteredTransactions.length > 0 ? (
                  <div className="divide-y divide-brand-borderLight dark:divide-brand-borderDark">
                    {filteredTransactions.slice(0, 15).map((transaction, idx) => {
                      const isSuccess = transaction.status?.toLowerCase() === 'success';
                      return (
                        <div
                          key={transaction.id || idx}
                          className={`p-3 sm:p-5 flex flex-row items-center justify-between hover:bg-brand-light dark:hover:bg-brand-black/30 transition-colors gap-2 ${
                            transaction.isLiveOrder ? 'bg-orange-500/[0.03] dark:bg-orange-500/[0.05]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${isSuccess ? 'bg-status-successBg text-status-success' : 'bg-brand-light text-content-muted dark:bg-brand-black'}`}>
                              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-xs sm:text-sm text-content-main dark:text-content-mainDark truncate">
                                  {transaction.phoneNumber || 'Walk-in Customer'}
                                </p>
                                {transaction.isLiveOrder && (
                                  <span className="bg-orange-500/10 text-brand-orange border border-orange-500/20 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                                    Recent Order
                                  </span>
                                )}
                              </div>
                              <p className="text-[9px] sm:text-[10px] text-content-muted uppercase tracking-widest font-semibold mt-0.5 truncate flex items-center gap-2">
                                <span>{formatDate(transaction.createdAt)}</span>
                                {transaction.transactionRef && (
                                  <span className="font-mono text-zinc-400">· {transaction.transactionRef}</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="font-black text-xs sm:text-base text-content-main dark:text-content-mainDark">
                              KES {Number(transaction.amount).toLocaleString()}
                            </p>
                            <span className={`inline-block mt-1 px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${
                              isSuccess
                                ? 'bg-status-successBg text-status-success border border-status-success/20'
                                : transaction.status === 'pending'
                                ? 'bg-status-pendingBg text-status-pending border border-status-pending/20'
                                : 'bg-status-errorBg text-status-error border border-status-error/20'
                            }`}>
                              {transaction.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 px-6">
                    <p className="text-xs text-content-muted font-bold uppercase tracking-widest">
                      No transactions match this filter.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-6 space-y-4">
            {/* ── Calculated Total Amount & Orders Summary Bar ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-brand-surface dark:bg-brand-gray border-brand-borderLight dark:border-brand-borderDark shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-content-muted dark:text-content-mutedDark mb-1">
                    Total Orders
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-content-main dark:text-content-mainDark">
                    {trialOrders.length}
                  </p>
                  <p className="text-[10px] font-bold text-brand-orange uppercase tracking-wider mt-1">
                    Customer orders count
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-brand-orange text-white border-none shadow-lg shadow-brand-orange/20">
                <CardContent className="p-4 sm:p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/80 mb-1">
                    Total Amount
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-white italic tracking-tight">
                    KES {totalOrdersAmount.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-bold text-white/90 uppercase tracking-wider mt-1">
                    Live orders revenue
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-brand-surface dark:bg-brand-gray border-brand-borderLight dark:border-brand-borderDark shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-content-muted dark:text-content-mutedDark mb-1">
                    Average Order Value
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-content-main dark:text-content-mainDark">
                    KES {avgOrderAmount.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-1">
                    Per order average
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-brand-surface dark:bg-brand-gray border-brand-borderLight dark:border-brand-borderDark shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="p-4 sm:p-5 border-b border-brand-borderLight dark:border-brand-borderDark bg-brand-light dark:bg-brand-black/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-content-muted dark:text-content-mutedDark">
                    <ShoppingBag className="w-4 h-4 text-brand-orange" /> Customer Orders
                    <span className="text-[10px] bg-brand-orange/10 text-brand-orange font-black px-2 py-0.5 rounded-full">
                      {trialOrders.length}
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-brand-orange">
                      Total: KES {totalOrdersAmount.toLocaleString()}
                    </span>
                    <button
                      onClick={refreshTrialOrders}
                      className="text-[10px] font-bold text-brand-orange hover:underline flex items-center gap-1 uppercase tracking-widest cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {trialOrders.length > 0 ? (
                  <div className="divide-y divide-brand-borderLight dark:divide-brand-borderDark">
                    {trialOrders.map((order, idx) => (
                      <div key={order.id || idx} className="p-4 sm:p-5 hover:bg-brand-light dark:hover:bg-brand-black/30 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl shrink-0 bg-status-successBg text-status-success">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-content-main dark:text-content-mainDark">
                                {order.phoneNumber || 'Walk-in'} {order.tableNo && order.tableNo !== 'N/A' ? `· ${order.tableNo}` : ''}
                              </p>
                              <p className="text-[10px] text-content-muted uppercase tracking-widest font-semibold mt-0.5 flex items-center gap-2">
                                <span>{order.createdAt ? new Date(order.createdAt).toLocaleString('en-KE') : 'N/A'}</span>
                                {order.transactionRef && (
                                  <span className="font-mono text-zinc-400">· {order.transactionRef}</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-sm text-content-main dark:text-content-mainDark">KES {Number(order.total).toLocaleString()}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-status-successBg text-status-success border border-status-success/20">
                              {order.status || 'received'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-11 space-y-1">
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex justify-between text-[11px] font-medium text-content-muted">
                              <span>{item.name} × {item.qty}</span>
                              <span>KES {Number(item.subtotal).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 px-6">
                    <div className="bg-brand-light dark:bg-brand-black w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-borderLight dark:border-brand-borderDark">
                      <ClipboardList className="w-7 h-7 text-content-muted" />
                    </div>
                    <h3 className="text-xs font-black text-content-main dark:text-content-mainDark uppercase tracking-widest mb-2">No Orders Yet</h3>
                    <p className="text-[10px] text-content-muted font-medium max-w-[250px] mx-auto">
                      Orders placed by scanning your trial QR menu will appear here in real-time.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu" className="mt-6">
            {/* Menu module in trial mode: show a read-only notice above the editor */}
            <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl px-5 py-3 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                Trial menu edits persist for the duration of your trial session.
              </p>
            </div>
            {/* Pass a dummy merchantId so MenuModule renders without crashing */}
            <MenuModule merchantId="demo-merchant" isDemo />
          </TabsContent>
        </Tabs>
      </main>

      {/* FREE TRIAL ENDED / FEEDBACK MODAL */}
      <TrialEndedModal
        isOpen={showEndTrialModal || isTrialExpired}
        onClose={() => setShowEndTrialModal(false)}
        isExpiredReason={isTrialExpired}
      />

    </div>
  );
};

export default TrialDashboard;

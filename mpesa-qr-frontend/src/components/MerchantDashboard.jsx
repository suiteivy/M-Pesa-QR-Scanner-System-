import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import BookConsultation from './BookConsultation';
import SettingsModule from './Settings';

import {
  BarChart3, RefreshCw, Calendar, Download, Filter,
  AlertCircle, Menu, X, LogOut, QrCode, Activity,
  CreditCard, Smartphone, Clock, ArrowUpRight, Loader2,
  Settings, LayoutDashboard, History, SquareMenu, ShieldCheck
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import MenuModule from './MenuModule';
import ThemeToggle from './ui/Toggle';
import AnalyticsModule from './AnalyticsModule';
import { API_BASE_URL } from '../utility/constants';

const MerchantDashboard = () => {
  const { user, merchantData, logout } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('week');
  const [status, setStatus] = useState('all');
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showBookingModal, setShowBookingModal] = useState(false);

  const formatCurrency = (value) => {
    const num = parseFloat(value || 0);

    if (num >= 1000000000) {
      return `KSH ${(num / 1000000000).toFixed(2)} B`;
    }
    if (num >= 1000000) {
      return `KSH ${(num / 1000000).toFixed(2)} M`;
    }
    if (num >= 10000) {
      return `KSH ${(num / 1000).toFixed(1)} K`;
    }

    return `KSH ${num.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
  };
  const formatDate = (dateData) => {
    if (!dateData) return 'N/A';
    try {
      const date = new Date(dateData);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-KE', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (error) { return 'Invalid Date'; }
  };

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({
        period,
        status,
        includeQRMetrics: 'true',
        limit: '100'
      });

      const response = await axios.get(`${API_BASE_URL}/api/transactions/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (response.data.status === 'success') {
        if (response.data.analytics) setAnalytics(response.data.analytics);
        if (response.data.transactions) setTransactions(response.data.transactions);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      if (err.response?.status === 401) setError('Session expired. Please re-login.');
      else setError(err.response?.data?.error || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
      navigate('/');
    }
  };

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user, status, period]);

  const stats = analytics ? {
    totalRevenue: analytics.summary?.totalRevenue || 0,
    totalTransactions: analytics.summary?.totalTransactions || 0,
    successRate: analytics.summary?.successRate || 0,

    // 🚀 FIXED: Calculate counts from dailySummaries to ignore the status filter
    // This looks at the entire period's data retrieved from the backend
    pendingPayments: analytics.dailySummaries?.reduce((acc, day) => acc + (day.pendingCount || 0), 0) || 0,

    failedPayments: analytics.dailySummaries?.reduce((acc, day) => acc + (day.failedCount || 0), 0) || 0,

  } : {
    totalRevenue: 0,
    totalTransactions: 0,
    successRate: 0,
    pendingPayments: 0,
    failedPayments: 0
  };
  return (
    <div className="min-h-screen bg-brand-light dark:bg-brand-black text-content-main dark:text-content-mainDark transition-colors duration-300">

      {/* HEADER */}
      <header className="bg-brand-surface dark:bg-brand-gray border-b border-brand-borderLight dark:border-brand-borderDark sticky top-0 z-40 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-orange p-2.5 rounded-2xl text-white shadow-lg shadow-brand-orange/20 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black uppercase italic tracking-tighter leading-none">
                Merchant<span className="text-brand-orange">Pro</span>
              </h1>
              <p className="text-[9px] md:text-[10px] text-brand-orange font-black uppercase tracking-widest mt-1 truncate max-w-[150px]">
                {merchantData?.name || 'Authorized Merchant'}
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button onClick={() => navigate('/generate-qr')} variant="ghost" className="text-xs font-bold text-content-muted hover:text-brand-orange px-3">
              <QrCode className="w-4 h-4 mr-2" /> QR Tools
            </Button>
            <div className="w-px h-6 bg-brand-borderLight dark:bg-brand-borderDark mx-1" />
            <ThemeToggle />
            <Button
              onClick={() => setActiveTab('settings')} // 🚀 Switches the main view to Settings
              variant="ghost"
              className={`p-2 transition-all ${activeTab === 'settings' ? 'text-brand-orange bg-brand-orange/10' : 'text-content-muted hover:text-content-main dark:hover:text-white'}`}
            >
              <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'animate-spin-slow' : ''}`} />
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="text-status-error hover:bg-status-error/10 p-2 ml-1">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={() => setShowNavMenu(!showNavMenu)} className="border-brand-borderLight dark:border-brand-borderDark shrink-0">
              {showNavMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {showNavMenu && (
          <div className="md:hidden absolute top-full left-0 w-full bg-brand-surface dark:bg-brand-gray border-b border-brand-borderLight dark:border-brand-borderDark shadow-2xl py-4 px-4 flex flex-col gap-2 animate-in slide-in-from-top-2 z-40">
            <Button onClick={() => { navigate('/generate-qr'); setShowNavMenu(false); }} variant="outline" className="w-full justify-start border-brand-borderLight dark:border-brand-borderDark text-sm py-6">
              <QrCode className="w-5 h-5 mr-3 text-brand-orange" /> QR Management
            </Button>
            <Button onClick={() => { setShowNavMenu(false); }} variant="outline" className="w-full justify-start border-brand-borderLight dark:border-brand-borderDark text-sm py-6">
              <Settings className="w-5 h-5 mr-3 text-content-muted" /> Settings
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-status-error hover:bg-status-error/10 text-sm py-6">
              <LogOut className="w-5 h-5 mr-3" /> Sign Out
            </Button>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6 sm:space-y-8 pb-32">

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* TOTAL VOLUME CARD */}
          <Card className="bg-brand-surface dark:bg-brand-gray border border-brand-borderLight dark:border-brand-borderDark shadow-sm rounded-[2rem] overflow-hidden transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <p className="text-content-muted dark:text-content-mutedDark text-[10px] uppercase font-black tracking-[0.2em] flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-brand-orange" /> Total Volume
                </p>
                {/* 🚀 Visual Accent: Percentage/Badge logic can go here later */}
                <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
              </div>

              <div
                className="font-black italic tracking-tighter leading-none text-content-main dark:text-content-mainDark"
                style={{
                  fontSize: 'clamp(1.5rem, 6vw, 2rem)', // Scaled up slightly for impact
                  minHeight: '2.5rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span className="text-brand-orange mr-1.5 not-italic text-sm">KES</span>
                {formatCurrency(stats.totalRevenue).replace('KSH ', '')}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-brand-borderLight dark:border-brand-borderDark pt-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-content-main dark:text-content-mainDark">
                    {stats.totalTransactions.toLocaleString()} Settled
                  </span>
                  <span className="text-[8px] font-bold uppercase text-content-muted dark:text-content-mutedDark">
                    Audit Verified
                  </span>
                </div>
                <div className="p-2 bg-brand-orangeLight dark:bg-brand-orangeDark rounded-xl">
                  <ArrowUpRight className="w-4 h-4 text-brand-orange" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PENDING CARD */}
          {/* PENDING CARD */}
          <Card
            onClick={() => setStatus('pending')} // 🚀 Clicking switches the ledger to Pending
            className="bg-brand-surface dark:bg-brand-gray border-brand-borderLight dark:border-brand-borderDark shadow-sm rounded-[2rem] cursor-pointer hover:border-status-pending/40 transition-all active:scale-95 group"
          >
            <CardContent className="p-6">
              <p className="text-content-muted text-[10px] uppercase font-black tracking-widest mb-2 flex items-center gap-2">
                <Clock className="w-3 h-3 group-hover:animate-pulse" /> Pending
              </p>
              <div className="text-3xl font-black text-status-pending">
                {stats.pendingPayments}
              </div>
              <p className="text-content-muted text-[10px] mt-2 font-bold uppercase tracking-widest flex justify-between items-center">
                Awaiting Callback
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </CardContent>
          </Card>

          {/* FAILED CARD */}
          <Card
            onClick={() => setStatus('failed')} // 🚀 Clicking switches the ledger to Failed
            className="bg-brand-surface dark:bg-brand-gray border-brand-borderLight dark:border-brand-borderDark shadow-sm rounded-[2rem] cursor-pointer hover:border-status-error/40 transition-all active:scale-95 group"
          >
            <CardContent className="p-6">
              <p className="text-content-muted text-[10px] uppercase font-black tracking-widest mb-2 flex items-center gap-2">
                <AlertCircle className="w-3 h-3 group-hover:shake" /> Action Required
              </p>
              <div className="text-3xl font-black text-status-error">
                {stats.failedPayments}
              </div>
              <p className="text-content-muted text-[10px] mt-2 font-bold uppercase tracking-widest flex justify-between items-center">
                Failed Transactions
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </CardContent>
          </Card>
        </div>
        {/* Filters Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-brand-surface dark:bg-brand-gray p-4 rounded-[2rem] border border-brand-borderLight dark:border-brand-borderDark shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">

            {/* Period Filter */}
            <div className="relative w-full sm:min-w-[160px]">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark text-[11px] font-black uppercase tracking-widest rounded-2xl pl-10 pr-8 py-3 outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all appearance-none cursor-pointer"
              >
                <option value="today">Today</option>
                <option value="week">Rolling Week</option>
                <option value="month">Rolling Month</option>
                <option value="year">Fiscal Year</option>
              </select>
            </div>

            {/* Status Filter */}

          </div>

          {/* Actions */}
        </div>
        {/* TABS NAVIGATION */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full max-w-2xl mx-auto bg-brand-surface dark:bg-brand-gray p-1.5 rounded-[2.5rem] border border-brand-borderLight dark:border-brand-borderDark shadow-sm">
            <TabsTrigger value="overview" className="flex-1 py-3.5 text-[10px] sm:text-xs font-black uppercase tracking-widest data-[state=active]:bg-brand-orange data-[state=active]:text-white rounded-[2rem] transition-all flex items-center justify-center gap-2">
              <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1 py-3.5 text-[10px] sm:text-xs font-black uppercase tracking-widest data-[state=active]:bg-brand-orange data-[state=active]:text-white rounded-[2rem] transition-all flex items-center justify-center gap-2">
              <History className="w-4 h-4" /> <span className="hidden sm:inline">Ledger</span>
            </TabsTrigger>
            <TabsTrigger value="menu" className="...">
              <SquareMenu className="w-4 h-4" /> <span className="hidden sm:inline">Menu Set</span>
            </TabsTrigger>
          </TabsList>


          <TabsContent value="overview" className="mt-8 animate-in fade-in duration-500">
            <AnalyticsModule analytics={analytics} />
          </TabsContent>

          <TabsContent value="transactions" className="mt-8">
            <Card className="bg-brand-surface dark:bg-brand-gray border-brand-borderLight dark:border-brand-borderDark shadow-sm rounded-[2.5rem] overflow-hidden">
              <div className="p-6 border-b border-brand-borderLight dark:border-brand-borderDark flex justify-between items-center bg-brand-light/50 dark:bg-brand-black/20">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-orange" /> Transaction Audit Log
                </h3>
                <div className="relative w-full sm:min-w-[160px]">
                  <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-1/2 bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark text-[11px] font-black uppercase tracking-widest rounded-2xl pl-10 pr-8 py-3 outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">All Channels</option>
                    <option value="success">Settled Only</option>
                    <option value="pending">Pending Only</option>
                    <option value="failed">Failed Only</option>
                  </select>
                </div>
                <Button onClick={() => { }} size="sm" variant="outline" className="text-[10px] font-black uppercase tracking-widest h-12 px-4 rounded-full border-brand-borderLight dark:border-brand-borderDark">
                  <Download className="w-7  mr-2" /> Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-brand-light dark:bg-brand-black/50">
                    <tr>
                      <th className="p-5 text-[10px] font-black uppercase tracking-widest opacity-60">Identity</th>
                      <th className="p-5 text-[10px] font-black uppercase tracking-widest opacity-60">Volume</th>
                      <th className="p-5 text-[10px] font-black uppercase tracking-widest opacity-60">Status</th>
                      <th className="p-5 text-[10px] font-black uppercase tracking-widest opacity-60 text-right">Settled On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-borderLight dark:divide-brand-borderDark">
                    {transactions?.length > 0 ? (
                      transactions.map((t, i) => (
                        <tr key={i} className="hover:bg-brand-light dark:hover:bg-brand-black/30 transition-colors">
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                                <Smartphone className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-bold tracking-tight">{t.phoneNumber || 'Internal Transaction'}</span>
                            </div>
                          </td>
                          <td className="p-5 text-sm font-black text-brand-orange">KES {Number(t.amount).toLocaleString()}</td>
                          <td className="p-5">
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase border ${t.status === 'success'
                              ? 'bg-status-success/10 text-status-success border-status-success/20'
                              : 'bg-status-error/10 text-status-error border-status-error/20'
                              }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="p-5 text-[10px] text-content-muted font-bold text-right uppercase tracking-wider">{formatDate(t.createdAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className="p-20 text-center text-content-muted text-xs font-bold uppercase tracking-widest">No matching records found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="menu" className="mt-8 animate-in fade-in duration-500">
            {user ? <MenuModule merchantId={user.uid} /> : <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-brand-orange w-8 h-8" /></div>}
          </TabsContent>
          {/* --- SETTINGS MODAL OVERLAY --- */}
          {activeTab === 'settings' && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              {/* 1. Backdrop: Blur and Darken */}
              <div
                className="absolute inset-0 bg-brand-black/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={() => setActiveTab('overview')} // Close on backdrop click
              />

              {/* 2. Modal Container */}
              <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-brand-surface dark:bg-brand-gray border border-brand-borderLight dark:border-brand-borderDark rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-400 no-scrollbar">

                {/* 3. Modal Header */}
                <div className="sticky top-0 z-20 bg-brand-surface dark:bg-brand-gray p-6 border-b border-brand-borderLight dark:border-brand-borderDark flex items-center justify-between rounded-t-[2.5rem]">
                  <div className="flex items-center gap-3">
                    {/* Icon Container with tinted brand colors */}
                    <div className="p-2 bg-brand-orangeLight dark:bg-brand-orangeDark rounded-xl">
                      <Settings className="w-5 h-5 text-brand-orange" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-widest text-content-main dark:text-content-mainDark leading-none">
                        System Preferences
                      </h2>
                      <p className="text-[9px] font-bold text-content-muted dark:text-content-mutedDark uppercase tracking-widest mt-1">
                        Merchant Configuration
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setActiveTab('overview')}
                    variant="ghost"
                    className="p-2 rounded-xl text-content-muted hover:text-status-error hover:bg-status-errorBg transition-all group"
                  >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                  </Button>
                </div>

                {/* 4. The Settings Content */}
                <div className="p-6">
                  <SettingsModule />
                </div>
              </div>
            </div>
          )}
        </Tabs>
      </main>

      {showBookingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md">
            <button onClick={() => setShowBookingModal(false)} className="absolute top-4 right-4 z-50 p-2 bg-brand-light/50 dark:bg-brand-black/50 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <BookConsultation />
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantDashboard;
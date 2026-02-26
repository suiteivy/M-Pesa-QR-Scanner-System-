import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import BookConsultation from './BookConsultation';

import {
  BarChart3, RefreshCw, Calendar, Download, Filter,
  AlertCircle, Menu, X, LogOut, QrCode, Activity,
  CreditCard, Smartphone, Clock, ArrowUpRight, Loader2,
  ShieldCheck, CheckCircle2, TrendingUp, Zap
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
  const [lastSynced, setLastSynced] = useState(null);
  const [period, setPeriod] = useState('week');
  const [status, setStatus] = useState('all');
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showBookingModal, setShowBookingModal] = useState(false);

  const isSubscribed = merchantData?.subscription?.active ?? true;

  // --- 1. LOGOUT HANDLER ---
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setError('Failed to logout safely.');
    }
  };

  const formatDate = (dateData) => {
    if (!dateData) return 'N/A';
    try {
      const date = new Date(dateData);
      return date.toLocaleDateString('en-KE', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return 'Invalid Date'; }
  };

  // --- 2. ENHANCED FETCH LOGIC ---
  const fetchAnalytics = useCallback(async () => {
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
        setAnalytics(response.data.analytics);
        setTransactions(response.data.transactions || []);
        setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      if (err.response?.status === 401) setError('Session expired. Please re-login.');
      else setError(err.response?.data?.error || 'Failed to sync production data');
    } finally {
      setLoading(false);
    }
  }, [user, period, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAnalytics();
    }, 500); // Wait 500ms for the user to stop clicking

    return () => clearTimeout(timer);
  }, [period, status, fetchAnalytics]);
  // --- 3. CSV EXPORT LOGIC ---
  const downloadCSV = () => {
    if (!transactions || transactions.length === 0) {
      return alert('No transaction data available for export.');
    }

    const headers = ['Transaction ID', 'Date', 'Phone Number', 'Amount (KES)', 'Status', 'Reference'];
    const rows = transactions.map(t => [
      t.id,
      formatDate(t.createdAt),
      t.phoneNumber || 'N/A',
      t.amount,
      t.status?.toUpperCase(),
      t.transactionRef || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MerchantPro_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 4. DATA CALCULATIONS ---
  const stats = analytics ? {
    totalRevenue: analytics.summary?.totalRevenue || 0,
    totalTransactions: analytics.summary?.totalTransactions || 0,
    successRate: analytics.summary?.successRate || 0,
    avgOrder: analytics.summary?.totalTransactions > 0
      ? (analytics.summary.totalRevenue / analytics.summary.totalTransactions).toFixed(0)
      : 0
  } : { totalRevenue: 0, totalTransactions: 0, successRate: 0, avgOrder: 0 };

  return (
    <div className="min-h-screen bg-brand-light dark:bg-brand-black text-content-main dark:text-content-mainDark font-sans selection:bg-brand-orange/30">

      {/* 5. MODAL SYSTEM */}
      {showBookingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md animate-in zoom-in duration-300">
            <BookConsultation onClose={() => setShowBookingModal(false)} />
          </div>
        </div>
      )}

      {/* SUBSCRIPTION BANNER */}
      {!isSubscribed && (
        <div className="bg-status-error text-white px-4 py-3 text-center flex items-center justify-center gap-4 z-50 sticky top-0 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Account Suspended: Renew Subscription
          </p>
          <Button size="sm" className="bg-white text-status-error hover:bg-zinc-100 font-black px-4 py-1 h-auto text-[10px] rounded-full">RENEW NOW</Button>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-brand-surface dark:bg-brand-gray border-b border-brand-borderLight dark:border-brand-borderDark sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-orange p-2.5 rounded-2xl text-white shadow-lg shadow-brand-orange/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black uppercase italic tracking-tighter leading-none">
                Merchant<span className="text-brand-orange">Pro</span>
              </h1>
              <p className="text-[9px] text-content-muted font-black uppercase tracking-[0.2em] mt-1">Enterprise Analytics</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {lastSynced && (
              <p className="text-[9px] font-black uppercase text-status-success flex items-center gap-1.5 bg-status-success/10 px-3 py-1.5 rounded-full border border-status-success/20">
                <CheckCircle2 className="w-3 h-3" /> Synced {lastSynced}
              </p>
            )}
            <ThemeToggle />
            <Button onClick={fetchAnalytics} disabled={loading} variant="outline" className="text-[10px] font-black uppercase tracking-widest px-6 rounded-xl h-10">
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin text-brand-orange' : ''}`} />
              {loading ? 'Processing' : 'Sync Data'}
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="text-status-error hover:bg-status-error/10 p-2.5 rounded-xl">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          {/* MOBILE MENU TOGGLE */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <button onClick={() => setShowNavMenu(!showNavMenu)} className="p-2 text-content-muted">
              {showNavMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAV MENU */}
      {showNavMenu && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-brand-surface dark:bg-brand-gray border-b border-brand-borderLight dark:border-brand-borderDark z-50 animate-in slide-in-from-top duration-300">
          <div className="p-4 space-y-3">
            <Button onClick={() => { fetchAnalytics(); setShowNavMenu(false); }} className="w-full justify-start text-xs font-bold py-4">
              <RefreshCw className="w-4 h-4 mr-3" /> Manual Sync
            </Button>
            <Button onClick={handleLogout} variant="outline" className="w-full justify-start text-xs font-bold py-4 text-status-error border-status-error/20">
              <LogOut className="w-4 h-4 mr-3" /> Sign Out
            </Button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 space-y-6 pb-32">

        {/* FILTERS & EXPORT */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-brand-surface dark:bg-brand-gray p-4 rounded-[2rem] border border-brand-borderLight dark:border-brand-borderDark shadow-sm">
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full lg:w-44 bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark text-[11px] font-black uppercase tracking-wider rounded-2xl pl-10 pr-4 py-3 outline-none focus:border-brand-orange transition-all appearance-none">
                <option value="today">Today</option>
                <option value="week">Rolling Week</option>
                <option value="month">Rolling Month</option>
              </select>
            </div>

            <div className="relative flex-1 lg:flex-none">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full lg:w-44 bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark text-[11px] font-black uppercase tracking-wider rounded-2xl pl-10 pr-4 py-3 outline-none focus:border-brand-orange transition-all appearance-none">
                <option value="all">All Channels</option>
                <option value="success">Settled</option>
                <option value="pending">Awaiting</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Button onClick={() => setShowBookingModal(true)} variant="outline" className="flex-1 lg:w-auto text-[10px] font-black uppercase tracking-widest px-6 rounded-2xl border-brand-orange text-brand-orange hover:bg-brand-orange/5">
              <ShieldCheck className="w-4 h-4 mr-2" /> Compliance
            </Button>
            <Button onClick={downloadCSV} className="flex-1 lg:w-auto bg-brand-black text-white dark:bg-brand-light dark:text-brand-black font-black text-[10px] uppercase tracking-widest px-8 rounded-2xl hover:opacity-90">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        {/* 6. COMPLETED STATS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="bg-brand-orange text-white border-none shadow-xl rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-7">
              <p className="text-white/70 text-[10px] uppercase font-black tracking-[0.2em] mb-1">Total Revenue</p>
              <div className="text-3xl font-black italic flex items-baseline gap-1.5">
                <span className="text-sm not-italic opacity-60">KES</span>
                {Number(stats.totalRevenue).toLocaleString()}
              </div>
              <div className="mt-5 pt-5 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{stats.totalTransactions} Invoices</span>
                <TrendingUp className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-brand-surface dark:bg-brand-gray border border-brand-borderLight dark:border-brand-borderDark rounded-[2.5rem] shadow-sm">
            <CardContent className="p-7">
              <p className="text-content-muted text-[10px] uppercase font-black tracking-[0.2em] mb-1">Conversion</p>
              <div className="text-3xl font-black italic text-brand-orange">{stats.successRate}%</div>
              <div className="mt-5 pt-5 border-t border-brand-borderLight dark:border-t-white/5 flex items-center justify-between">
                <span className="text-[10px] text-content-muted font-bold uppercase tracking-widest">Success Rate</span>
                <Zap className="w-4 h-4 text-status-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-brand-surface dark:bg-brand-gray border border-brand-borderLight dark:border-brand-borderDark rounded-[2.5rem] shadow-sm">
            <CardContent className="p-7">
              <p className="text-content-muted text-[10px] uppercase font-black tracking-[0.2em] mb-1">Average Ticket</p>
              <div className="text-3xl font-black italic leading-none">
                <span className="text-sm not-italic opacity-40 mr-1">KES</span>
                {Number(stats.avgOrder).toLocaleString()}
              </div>
              <div className="mt-5 pt-5 border-t border-brand-borderLight dark:border-t-white/5 flex items-center justify-between">
                <span className="text-[10px] text-content-muted font-bold uppercase tracking-widest">Per Transaction</span>
                <Activity className="w-4 h-4 text-brand-orange" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-brand-surface dark:bg-brand-gray border border-brand-borderLight dark:border-brand-borderDark rounded-[2.5rem] shadow-sm">
            <CardContent className="p-7">
              <p className="text-content-muted text-[10px] uppercase font-black tracking-[0.2em] mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-status-success animate-pulse" />
                <div className="text-xl font-black uppercase tracking-tighter italic">Operational</div>
              </div>
              <div className="mt-7 pt-5 border-t border-brand-borderLight dark:border-t-white/5 flex items-center justify-between">
                <span className="text-[10px] text-content-muted font-bold uppercase tracking-widest">API Health 100%</span>
                <ShieldCheck className="w-4 h-4 text-status-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TABS ENGINE */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-brand-surface dark:bg-brand-gray p-1.5 rounded-[2rem] border border-brand-borderLight dark:border-brand-borderDark flex max-w-md mx-auto">
            <TabsTrigger value="overview" className="flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-brand-orange data-[state=active]:text-white rounded-[1.5rem] transition-all">Market View</TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-brand-orange data-[state=active]:text-white rounded-[1.5rem] transition-all">Deep Ledger</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loading && !analytics ? (
              <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-brand-orange animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Analyzing Global Data...</p>
              </div>
            ) : (
              <AnalyticsModule analytics={analytics} />
            )}
          </TabsContent>

          <TabsContent value="transactions" className="mt-8">
            <Card className="bg-brand-surface dark:bg-brand-gray border border-brand-borderLight dark:border-brand-borderDark rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-brand-light dark:bg-brand-black/50 border-b border-brand-borderLight dark:border-brand-borderDark">
                    <tr>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest">Client Identity</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest">Gross Volume</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest">Status</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-right">Settlement Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-borderLight dark:divide-brand-borderDark">
                    {transactions.length > 0 ? (
                      transactions.map((t, i) => (
                        <tr key={i} className="hover:bg-brand-light dark:hover:bg-zinc-800/40 transition-colors group">
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange font-black text-[10px]">
                                {t.phoneNumber?.slice(-2) || 'QR'}
                              </div>
                              <span className="text-sm font-bold tracking-tight">{t.phoneNumber || 'Guest Scanner'}</span>
                            </div>
                          </td>
                          <td className="p-6 text-sm font-black text-brand-orange italic">KES {t.amount.toLocaleString()}</td>
                          <td className="p-6">
                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase border ${t.status === 'success'
                                ? 'bg-status-success/10 text-status-success border-status-success/20'
                                : 'bg-status-error/10 text-status-error border-status-error/20'
                              }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="p-6 text-[10px] text-content-muted font-bold text-right uppercase tracking-wider">{formatDate(t.createdAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="p-20 text-center text-content-muted text-[10px] font-black uppercase tracking-widest">No transaction records found for this period</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* FOOTER BAR */}
      <div className="fixed bottom-0 inset-x-0 bg-brand-surface/80 dark:bg-brand-gray/80 backdrop-blur-md border-t border-brand-borderLight dark:border-brand-borderDark py-4 px-6 md:hidden flex justify-around items-center z-40">
        <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center gap-1 ${activeTab === 'overview' ? 'text-brand-orange' : 'text-content-muted'}`}>
          <Activity className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase">Insights</span>
        </button>
        <button onClick={() => setActiveTab('transactions')} className={`flex flex-col items-center gap-1 ${activeTab === 'transactions' ? 'text-brand-orange' : 'text-content-muted'}`}>
          <Clock className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase">Ledger</span>
        </button>
        <button onClick={() => setShowBookingModal(true)} className="flex flex-col items-center gap-1 text-content-muted">
          <Smartphone className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase">Help</span>
        </button>
      </div>

    </div>
  );
};

export default MerchantDashboard;
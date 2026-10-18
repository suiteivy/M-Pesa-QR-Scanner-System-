import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import BookConsultation from './BookConsultation'; 
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

import {
  BarChart3, RefreshCw, Calendar, Download, Filter,
  AlertCircle, Menu, X, LogOut, QrCode, Activity,
  CreditCard, Smartphone, Clock, ArrowUpRight, Loader2,
  ShoppingBag, CheckCircle2, ClipboardList
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import MenuModule from './MenuModule';
import ThemeToggle from './ui/Toggle';
import AnalyticsModule from './AnalyticsModule'; 
import { API_BASE_URL } from '../utility/constants'; 
import PublicQRScanner from './PublicQRScanner';
 // Ensure environment variables are loaded

const MerchantDashboard = () => {
  const { user, merchantData, logout } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('week');
  const [status, setStatus] = useState('all');
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // --- STRICT DEMO CLOCK STATE ---
  const [timeLeft, setTimeLeft] = useState(null);
  const [isDemoExpired, setIsDemoExpired] = useState(false);
  const isdemo = process.env.REACT_APP_NODE_ENV === 'development';

  // This effect always runs but only activates the countdown in development/demo mode.
  // React rules require hooks to be called unconditionally at the top level.
  useEffect(() => {
    if (!isdemo) return;

    let demoStart = localStorage.getItem('demo_start_time');
    if (!demoStart) {
      demoStart = Date.now().toString();
      localStorage.setItem('demo_start_time', demoStart);
    }
    
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const expiryTime = parseInt(demoStart, 10) + ONE_HOUR_MS;

    const interval = setInterval(() => {
      const now = Date.now();
      const difference = expiryTime - now;

      if (difference <= 0) {
        setTimeLeft('00:00');
        setIsDemoExpired(true);
        clearInterval(interval);
      } else {
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isdemo]);

  const formatCurrency = (amount) => `KSH ${parseFloat(amount || 0).toFixed(2)}`;

  const formatDate = (dateData) => {
    if (!dateData) return 'N/A';
    try {
      let date;
      if (typeof dateData === 'object') {
        if (dateData._seconds) date = new Date(dateData._seconds * 1000);
        else if (dateData.seconds) date = new Date(dateData.seconds * 1000);
        else return 'N/A';
      } else {
        date = new Date(dateData);
      }
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-KE', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const downloadCSV = () => {
    if (!analytics?.transactions?.length) return alert('No data to download');
    const headers = ['Date', 'Phone', 'Amount', 'Status', 'Reference'];
    const csvData = analytics.transactions.map(t => [
      formatDate(t.createdAt), t.phoneNumber || 'N/A', t.amount || 0, t.status || 'unknown', t.transactionRef || t.id || 'N/A'
    ]);
    const csvContent = [headers, ...csvData].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    
    try {
      const token = await user.getIdToken();
      
      // 🚀 Reverted: Pass the period natively without custom overrides
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
        console.log('📊 Analytics Data:', response.data.analytics);
        console.log('📊 Transactions Data:', response.data.transactions);
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

  const handleRefresh = () => fetchAnalytics();

  const fetchOrders = async () => {
    if (!user) return;
    setOrdersLoading(true);
    try {
      const ordersRef = collection(db, 'merchants', user.uid, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Orders fetch error:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const formatOrderDate = (ts) => {
    if (!ts) return 'N/A';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return 'N/A'; }
  };

 const handleLogout = async () => {
    if (window.confirm('Are you sure you want to exit the demo?')) {
      // 1. Wait for Firebase to finish logging out
      await logout(); 
      // 2. Clear the demo clock so it restarts if they manually log in again
      // 3. Navigate with a "manual" flag!
      navigate('/', { state: { manualInteractionRequired: true } });
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalytics();
      fetchOrders();
    }
  // The effect will re-run whenever the user logs in,
  // or when the status/period filters are changed by the UI.
  }, [user, status, period]);

  const totalOrdersAmount = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const avgOrderAmount = orders.length > 0 ? Math.round(totalOrdersAmount / orders.length) : 0;

  const orderTransactions = orders.map(order => ({
    id: order.id,
    phoneNumber: order.phoneNumber || 'Customer Order',
    amount: Number(order.total) || 0,
    status: order.status === 'received' ? 'success' : (order.status || 'success'),
    transactionRef: order.transactionRef || (order.id ? `TXN-${String(order.id).slice(-6)}` : 'MPESA-ORD'),
    accountRef: order.tableNo && order.tableNo !== 'N/A' ? `Table ${order.tableNo}` : 'QR Order',
    createdAt: order.createdAt,
    isLiveOrder: true,
  }));

  const allMerchantTransactions = [
    ...orderTransactions,
    ...(transactions || [])
  ];

  const stats = analytics ? {
    totalRevenue: (analytics.summary?.totalRevenue || 0) + totalOrdersAmount,
    totalTransactions: (analytics.summary?.totalTransactions || 0) + orders.length,
    successfulPayments: (transactions?.filter(t => t.status === 'success').length || 0) + orders.length,
    pendingPayments: transactions?.filter(t => t.status === 'pending').length || 0,
    failedPayments: transactions?.filter(t => t.status === 'failed' || t.status === 'error').length || 0,
    successRate: (transactions?.length || 0) + orders.length > 0 
      ? Math.round((((transactions?.filter(t => t.status === 'success').length || 0) + orders.length) / ((transactions?.length || 0) + orders.length)) * 100) 
      : 0
  } : {
    totalRevenue: totalOrdersAmount, 
    totalTransactions: orders.length, 
    successfulPayments: orders.length, 
    pendingPayments: 0, 
    failedPayments: 0, 
    successRate: orders.length > 0 ? 100 : 0
  };

return (
/**
 * Logs the user out of Firebase and clears the demo clock so it restarts
 * if they manually log in again. Also navigates with a "manual" flag.
 * 
 * @returns {Promise<void>} Resolves when the logout process is complete.
 * @throws {Error} If the user cancels the logout confirmation dialog.
 */
    <div className="min-h-screen bg-brand-light dark:bg-brand-black text-content-main dark:text-content-mainDark transition-colors duration-300">

      {/* --- BANNER STATE 1: DEMO ACTIVE --- */}
      {!isDemoExpired && timeLeft && isdemo && (
        <div className="bg-brand-orange text-white px-4 py-3 text-center flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 shadow-md z-50 relative animate-in slide-in-from-top-4">
          <p className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4 animate-pulse" />
            Live Demo Ends In: <span className="font-mono text-sm tracking-tight">{timeLeft}</span>
          </p>
          <button
            onClick={() => setShowBookingModal(true)}
            className="bg-brand-buttonBase dark:bg-brand-buttonDark text-brand-buttonText dark:text-brand-buttonTextDark px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            Schedule Consultation <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* --- BANNER STATE 2: DEMO EXPIRED --- */}
      {isDemoExpired && isdemo && (
        <div className="bg-status-errorBg text-status-error border-b border-status-error/20 px-4 py-3 text-center flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 shadow-md z-40 relative animate-in slide-in-from-top-4">
          <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Demo Session Ended
          </p>
          <button
            onClick={() => setShowBookingModal(true)}
            className="bg-status-error text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-colors shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Calendar className="w-3 h-3" /> Schedule Consultation
          </button>
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
              <p className="text-[9px] md:text-[10px] text-content-muted dark:text-content-mutedDark font-bold uppercase tracking-widest mt-0.5 truncate max-w-[120px] sm:max-w-[150px]">
                ID: {merchantData?.name || 'N/A'} | {merchantData?.accountType || 'Unknown Business'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <Button onClick={() => navigate('/generate-qr')} variant="ghost" className="text-xs font-bold text-content-muted hover:text-brand-orange">
              <QrCode className="w-4 h-4 mr-2" /> Generate QR
            </Button>
            <Button onClick={() => navigate('/payment-scanner')} variant="ghost" className="text-xs font-bold text-content-muted hover:text-brand-orange">
              <Smartphone className="w-4 h-4 mr-2" /> Scanner
            </Button>
            <div className="w-px h-6 bg-brand-borderLight dark:bg-brand-borderDark mx-2" />
            <ThemeToggle />
            <Button onClick={handleRefresh} disabled={loading} variant="outline" className="border-brand-borderLight dark:border-brand-borderDark text-xs font-bold">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin text-brand-orange' : ''}`} />
              {loading ? 'Syncing...' : 'Sync Data'}
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="text-status-error hover:bg-status-errorBg">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile Navigation Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={() => setShowNavMenu(!showNavMenu)} className="border-brand-borderLight dark:border-brand-borderDark relative z-50 shrink-0">
              {showNavMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* --- ADDED: MOBILE DROPDOWN MENU --- */}
        {showNavMenu && (
          <div className="md:hidden absolute top-full left-0 w-full bg-brand-surface dark:bg-brand-gray border-b border-brand-borderLight dark:border-brand-borderDark shadow-xl py-4 px-4 flex flex-col gap-3 animate-in slide-in-from-top-2 z-40">
            <Button onClick={() => { navigate('/generate-qr'); setShowNavMenu(false); }} variant="outline" className="w-full justify-start border-brand-borderLight dark:border-brand-borderDark text-sm">
              <QrCode className="w-4 h-4 mr-3 text-brand-orange" /> Generate QR
            </Button>
            <Button onClick={() => { navigate('/payment-scanner'); setShowNavMenu(false); }} variant="outline" className="w-full justify-start border-brand-borderLight dark:border-brand-borderDark text-sm">
              <Smartphone className="w-4 h-4 mr-3 text-brand-orange" /> Payment Scanner
            </Button>
            <Button onClick={() => { handleRefresh(); setShowNavMenu(false); }} disabled={loading} variant="outline" className="w-full justify-start border-brand-borderLight dark:border-brand-borderDark text-sm">
              <RefreshCw className={`w-4 h-4 mr-3 ${loading ? 'animate-spin text-brand-orange' : 'text-content-muted'}`} /> 
              {loading ? 'Syncing Data...' : 'Sync Data'}
            </Button>
            <div className="h-px w-full bg-brand-borderLight dark:bg-brand-borderDark my-1" />
            <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-status-error hover:bg-status-errorBg text-sm">
              <LogOut className="w-4 h-4 mr-3" /> Exit Demo Sandbox
            </Button>
          </div>
        )}
      </header>

      {/* DASHBOARD CONTENT (Locked completely if demo is expired) */}
      <main className={`max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6 sm:space-y-8 pb-32 transition-opacity ${isDemoExpired ? 'opacity-30 pointer-events-none blur-sm' : 'opacity-100'}`}>
        
        {error && (
          <div className="bg-status-errorBg border-l-4 border-status-error p-4 rounded-r-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-status-error shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-status-error">Sync Error</h3>
              <p className="text-xs text-status-error opacity-80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-brand-surface dark:bg-brand-gray p-4 rounded-2xl border border-brand-borderLight dark:border-brand-borderDark shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:min-w-[140px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark text-sm font-semibold rounded-xl pl-10 pr-8 py-2.5 focus:ring-2 focus:ring-brand-orange outline-none appearance-none">
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="relative w-full sm:min-w-[140px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark text-sm font-semibold rounded-xl pl-10 pr-8 py-2.5 focus:ring-2 focus:ring-brand-orange outline-none appearance-none">
                <option value="all">All Statuses</option>
                <option value="success">Successful</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <Button onClick={downloadCSV} disabled={!transactions || transactions.length === 0} className="w-full lg:w-auto flex items-center justify-center font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-brand-buttonBase text-brand-buttonText dark:bg-brand-buttonDark dark:!text-brand-buttonTextDark hover:opacity-80">
            <Download className="w-4 h-4 mr-2 shrink-0" /> Export Log
          </Button>
        </div>

        {/* --- FIXED: Stats Grid is now 1 col on mobile, 2 on tablet, 4 on desktop --- */}
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
              <p className="text-content-muted dark:text-content-mutedDark text-[10px] uppercase font-black tracking-widest mb-2">Success Rate</p>
              <div className="text-2xl sm:text-3xl font-black text-content-main dark:text-content-mainDark">{stats.successRate}%</div>
              <p className="text-status-success text-[10px] mt-2 font-bold uppercase tracking-widest">Transaction Health</p>
            </CardContent>
          </Card>

          <Card className="bg-brand-surface dark:bg-brand-gray border-brand-borderLight dark:border-brand-borderDark shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <p className="text-content-muted dark:text-content-mutedDark text-[10px] uppercase font-black tracking-widest mb-2">Pending</p>
              <div className="text-2xl sm:text-3xl font-black text-status-pending">{stats.pendingPayments}</div>
              <p className="text-content-muted text-[10px] mt-2 font-bold uppercase tracking-widest">Awaiting PIN</p>
            </CardContent>
          </Card>

          <Card className="bg-brand-surface dark:bg-brand-gray border-brand-borderLight dark:border-brand-borderDark shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <p className="text-content-muted dark:text-content-mutedDark text-[10px] uppercase font-black tracking-widest mb-2">Failed</p>
              <div className="text-2xl sm:text-3xl font-black text-status-error">{stats.failedPayments}</div>
              <p className="text-content-muted text-[10px] mt-2 font-bold uppercase tracking-widest">Requires Action</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === 'orders') fetchOrders(); }} className="w-full">
          <TabsList className="flex w-full overflow-x-auto bg-brand-light dark:bg-brand-black p-1.5 rounded-2xl border border-brand-borderLight dark:border-brand-borderDark no-scrollbar">
            <TabsTrigger value="overview" className="flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest data-[state=active]:bg-brand-surface dark:data-[state=active]:bg-brand-gray rounded-xl shadow-sm transition-all whitespace-nowrap px-4">Overview</TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest data-[state=active]:bg-brand-surface dark:data-[state=active]:bg-brand-gray rounded-xl shadow-sm transition-all whitespace-nowrap px-4">Ledger</TabsTrigger>
            <TabsTrigger value="orders" className="flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest data-[state=active]:bg-brand-surface dark:data-[state=active]:bg-brand-gray rounded-xl shadow-sm transition-all whitespace-nowrap px-4 relative">
              Orders
              {orders.length > 0 && <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{orders.length > 9 ? '9+' : orders.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest data-[state=active]:bg-brand-surface dark:data-[state=active]:bg-brand-gray rounded-xl shadow-sm transition-all whitespace-nowrap px-4">Setup Menu</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
             <AnalyticsModule analytics={analytics} />
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <Card className="bg-brand-surface dark:bg-brand-gray border-brand-borderLight dark:border-brand-borderDark shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="p-4 sm:p-5 border-b border-brand-borderLight dark:border-brand-borderDark bg-brand-light dark:bg-brand-black/50">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-content-muted dark:text-content-mutedDark">
                  <Activity className="w-4 h-4 text-brand-orange" /> Recent Transactions
                  {orderTransactions.length > 0 && (
                    <span className="ml-auto text-[9px] text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-700/50 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {orderTransactions.length} Live Order{orderTransactions.length > 1 ? 's' : ''}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {allMerchantTransactions && allMerchantTransactions.length > 0 ? (
                  <div className="divide-y divide-brand-borderLight dark:divide-brand-borderDark">
                    {allMerchantTransactions.slice(0, 15).map((transaction, idx) => {
                      const isSuccess = transaction.status?.toLowerCase() === 'success' || transaction.status === 'received';
                      return (
                        <div key={transaction.id || idx} className={`p-3 sm:p-5 flex flex-row items-center justify-between hover:bg-brand-light dark:hover:bg-brand-black/30 transition-colors gap-2 ${transaction.isLiveOrder ? 'bg-orange-500/[0.03] dark:bg-orange-500/[0.05]' : ''}`}>
                          
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${isSuccess ? 'bg-status-successBg text-status-success' : 'bg-brand-light text-content-muted dark:bg-brand-black'}`}>
                              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-xs sm:text-sm text-content-main dark:text-content-mainDark truncate">
                                  {transaction.phoneNumber || transaction.accountRef || 'Walk-in Customer'}
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
                              isSuccess ? 'bg-status-successBg text-status-success border border-status-success/20' :
                              transaction.status === 'pending' ? 'bg-status-pendingBg text-status-pending border border-status-pending/20' :
                              'bg-status-errorBg text-status-error border border-status-error/20'
                            }`}>
                              {transaction.status || 'UNKNOWN'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 sm:py-20 px-4 sm:px-6">
                    <div className="bg-brand-light dark:bg-brand-black w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-borderLight dark:border-brand-borderDark">
                      <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-content-muted" />
                    </div>
                    <h3 className="text-sm font-bold text-content-main dark:text-content-mainDark">No Transactions Yet</h3>
                    <p className="text-xs text-content-muted max-w-xs mx-auto mt-1">Customer payments and menu orders will appear here in real-time.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-6 space-y-4">
            {/* ── Summary Metrics for Orders ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-brand-surface dark:bg-brand-gray border-brand-borderLight dark:border-brand-borderDark shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-content-muted dark:text-content-mutedDark mb-1">
                    Total Orders
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-content-main dark:text-content-mainDark">
                    {orders.length}
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
                    All-time orders volume
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
                      {orders.length}
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-brand-orange">
                      Total: KES {totalOrdersAmount.toLocaleString()}
                    </span>
                    <button onClick={fetchOrders} disabled={ordersLoading} className="text-[10px] font-bold text-brand-orange hover:underline flex items-center gap-1 uppercase tracking-widest cursor-pointer">
                      <RefreshCw className={`w-3 h-3 ${ordersLoading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand-orange" /></div>
                ) : orders.length > 0 ? (
                  <div className="divide-y divide-brand-borderLight dark:divide-brand-borderDark">
                    {orders.map((order) => (
                      <div key={order.id} className="p-4 sm:p-5 hover:bg-brand-light dark:hover:bg-brand-black/30 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl shrink-0 ${order.status === 'received' ? 'bg-status-successBg text-status-success' : 'bg-brand-light text-content-muted dark:bg-brand-black'}`}>
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-content-main dark:text-content-mainDark">
                                {order.phoneNumber || 'Walk-in'} {order.tableNo && order.tableNo !== 'N/A' ? `· ${order.tableNo}` : ''}
                              </p>
                              <p className="text-[10px] text-content-muted uppercase tracking-widest font-semibold mt-0.5">{formatOrderDate(order.createdAt)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-sm text-content-main dark:text-content-mainDark">KES {Number(order.total).toLocaleString()}</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                              order.status === 'received' ? 'bg-status-successBg text-status-success border border-status-success/20' : 'bg-status-pendingBg text-status-pending border border-status-pending/20'
                            }`}>{order.status}</span>
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
                  <div className="text-center py-16 sm:py-20 px-4">
                    <div className="bg-brand-light dark:bg-brand-black w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-borderLight dark:border-brand-borderDark">
                      <ClipboardList className="w-7 h-7 text-content-muted" />
                    </div>
                    <h3 className="text-xs font-black text-content-main dark:text-content-mainDark uppercase tracking-widest mb-2">No Orders Yet</h3>
                    <p className="text-[10px] text-content-muted font-medium max-w-[240px] mx-auto">
                      Orders placed by customers via your QR menu will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu" className="mt-6">
            {user ? <MenuModule merchantId={user.uid} /> : <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-brand-orange" /></div>}
          </TabsContent>
        </Tabs>
      </main>

      {/* --- MODAL OVERLAY: Book Consultation --- */}
      {showBookingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="relative w-full max-w-md">
            <BookConsultation onClose={() => setShowBookingModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantDashboard;
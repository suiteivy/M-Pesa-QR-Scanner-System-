import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';

import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
  RefreshCw,
  Calendar,
  Download,
  Filter,
  Search,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Menu,
  X,
  LogOut,
  Home,
  QrCode,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Activity,
  CreditCard,
  Smartphone,
  Settings,
  ArrowRight,
  UtensilsCrossed,
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid,
  ResponsiveContainer, ComposedChart, Line, Area
} from 'recharts';
import MenuModule from './MenuModule';
import { useSubscription } from '../hooks/SubscriptionProvider';
import SubscriptionShield from '../hooks/SubscriptionShield';
import ThemeToggle from './ui/Toggle';
import AnalyticsModule from './AnalyticsModule'; // <--- IMPORT IT
// Add API_BASE_URL to the list
import { API_BASE_URL, API_ENDPOINTS, formatUIDate } from '../utility/constants'; // Adjust path if needed (e.g. '../utils/constants')

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
  const [showDebug, setShowDebug] = useState(false);
  const [debugData, setDebugData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { tier, isValid, status: subStatus, menuEnabled, loading: subLoading } = useSubscription();
  const [isLineChart, setIsLineChart] = useState(false);
  const [dailyData, setDailyData] = useState([]);

  const formatCurrency = (amount) => {
    return `KSH ${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateData) => {

    if (!dateData) return 'N/A';

    try {
      let date;

      // 1. Is it a raw Firestore Object? (Check for _seconds or seconds)
      if (typeof dateData === 'object') {
        if (dateData._seconds) {
          date = new Date(dateData._seconds * 1000);
        } else if (dateData.seconds) {
          date = new Date(dateData.seconds * 1000);
        } else {
          return 'N/A'; // It's an object, but not a date
        }
      }
      // 2. Is it an ISO String or Timestamp Number?
      else {
        date = new Date(dateData);
      }

      // 3. The REAL validation check (catches the NaN issue)
      if (isNaN(date.getTime())) {
        console.error("Parsed date is invalid:", dateData);
        return 'Invalid Date';
      }

      // 4. Format for Kenya locale
      return date.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

    } catch (error) {
      console.error("Format error:", error);
      return 'Invalid Date';
    }
  };

  const formatTransactionDate = (dateData) => {
    if (!dateData) return 'N/A';
    try {
      let date;
      if (typeof dateData === 'object' && dateData._seconds) {
        // Multiply by 1000 to convert Firestore seconds to JS milliseconds
        date = new Date(dateData._seconds * 1000);
      } else {
        date = new Date(dateData);
      }

      if (isNaN(date.getTime())) return 'Invalid Date';

      return date.toLocaleDateString('en-KE', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };
  const getStatusBadge = (status) => {
    const variants = {
      success: 'success',
      pending: 'warning',
      failed: 'error',
      error: 'error'
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </Badge>
    );
  };

  const downloadCSV = () => {
    if (!analytics?.transactions?.length) {
      alert('No data to download');
      return;
    }

    const headers = ['Date', 'Phone', 'Amount', 'Status', 'Reference'];
    const csvData = analytics.transactions.map(t => [
      formatDate(t.createdAt),
      t.phoneNumber || 'N/A',
      t.amount || 0,
      t.status || 'unknown',
      t.transactionRef || t.id || 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };





  const fetchAnalytics = async () => {
    // 1. Bulletproof Auth Check
    // Instead of localStorage, we check the 'user' object from useAuth()
    if (!user) {
      console.warn("Analytics fetch blocked: No user object found.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 2. GET A FRESH TOKEN
      // This is the most important change. It ensures the token is never 'undefined'
      const token = await user.getIdToken();

      // Defensive handling for query params
      const currentStatus = status || 'all';
      const currentPeriod = period || 'week';

      const params = new URLSearchParams({
        period: currentPeriod,
        status: currentStatus,
        includeQRMetrics: 'true',
        limit: '100'
      });

      // 3. EXECUTE REQUEST
      const response = await axios.get(
        `${API_BASE_URL}/api/transactions/analytics?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      console.log('Raw API Response:', response.data);

      // 4. DATA PROCESSING
      if (response.data.status === 'success') {

        // A. Extract and set the Analytics Object (for your charts/cards)
        if (response.data.analytics) {
          const analyticsData = response.data.analytics;
          setAnalytics(analyticsData);

          if (typeof processChartData === 'function') {
            processChartData(analyticsData);
          }
        }

        // B. Extract and set the Transactions Array (for your list/table)
        // This is the missing piece that fixes the blank list issue!
        if (response.data.transactions) {
          setTransactions(response.data.transactions);
        } else {
          setTransactions([]); // Safe fallback
        }

      }
    } catch (err) {
      console.error('Analytics fetch error:', err);

      // Handle 401 specifically to help you debug auth issues
      if (err.response?.status === 401) {
        setError('Session expired or unauthorized. Please re-login.');
      } else {
        const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to fetch analytics data';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDebugInfo = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/transactions/debug`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      if (response.data.status === 'success') {
        setDebugData(response.data.debug);
      }
    } catch (err) {
      console.error('Debug fetch error:', err);
    }
  };

  const handleRefresh = () => {
    fetchAnalytics();
    if (showDebug) {
      fetchDebugInfo();
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const handleNavigateToQRGenerator = () => {
    navigate('/generate-qr');
  };

  const handleNavigateToScanner = () => {
    navigate('/payment-scanner');
  };

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, status, period]); // Refetch when user logs in or filters change

  useEffect(() => {
    if (showDebug && !debugData) {
      fetchDebugInfo();
    }
  }, [showDebug]);

  // Calculate stats
  const stats = analytics ? {
    totalRevenue: analytics.summary?.totalRevenue || 0,
    totalTransactions: analytics.summary?.totalTransactions || 0,
    successfulPayments: analytics.summary?.successfulTransactions || 0,
    pendingPayments: analytics.summary?.pendingTransactions || 0,
    failedPayments: analytics.summary?.failedTransactions || 0,
    successRate: analytics.summary?.successRate || 0
  } : {
    totalRevenue: 0,
    totalTransactions: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    successRate: 0
  };

  // Add dailyData for chart



  // --- CHART DATA PROCESSOR ---
  const processChartData = (analyticsData) => {
    if (!analyticsData || !analyticsData.dailySummaries) return;

    // 1. Map API Data (totalRevenue -> revenue) & Sort Chronologically
    const rawHistory = analyticsData.dailySummaries.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-KE', { weekday: 'short' }), // e.g., "Mon"
      fullDate: day.date,
      revenue: day.totalRevenue, // <--- Mapping fixed here
      prediction: null // Real days have no prediction
    })).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

    // 2. Get the last real data point (The Anchor)
    const lastRealPoint = rawHistory[rawHistory.length - 1];

    // 3. Prepare the "Future" Point based on backend prediction
    if (analyticsData.insights && analyticsData.insights.prediction) {
      const predictedAmount = analyticsData.insights.prediction.nextDayRevenue;

      // ANCHOR TRICK: Add a point that exists in BOTH lines to connect them
      // We modify the last real point to start the prediction line
      if (lastRealPoint) {
        lastRealPoint.prediction = lastRealPoint.revenue;
      }

      // Add the future point
      rawHistory.push({
        date: 'Tomorrow',
        revenue: null, // Solid line stops
        prediction: predictedAmount // Dotted line continues
      });
    }

    setDailyData(rawHistory);
  };



  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-white transition-colors duration-300">

      {/* --- HEURISTIC: Visibility of System Status (Global Alerts) --- */}
      {!isValid && !subLoading && (
        <div className="bg-red-600 text-white px-4 py-3 text-center flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 shadow-md z-50 relative">
          <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Subscription {subStatus === 'EXPIRED' ? 'Expired' : 'Inactive'} — Core Features Restricted
          </p>
          <button
            onClick={() => navigate('/upgrade')}
            className="bg-white text-red-600 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-colors shadow-sm"
          >
            Renew Subscription
          </button>
        </div>
      )}

      {/* --- HEURISTIC: Recognition rather than Recall (Sticky, Clear Navigation) --- */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">

          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-xl text-white shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black uppercase italic tracking-tighter leading-none">
                Merchant<span className="text-orange-600">Pro</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 truncate max-w-[150px]">
                {merchantData?.name || 'Dashboard'}
              </p>
            </div>
          </div>

          {/* Desktop/Tablet Quick Actions (Exposed for Efficiency) */}
          <div className="hidden md:flex items-center gap-3">
            <Button onClick={() => navigate('/generate-qr')} variant="ghost" className="text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-orange-600">
              <QrCode className="w-4 h-4 mr-2" /> Generate QR
            </Button>
            <Button onClick={() => navigate('/payment-scanner')} variant="ghost" className="text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-orange-600">
              <Smartphone className="w-4 h-4 mr-2" /> Scanner
            </Button>
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-2" /> {/* Divider */}
            <ThemeToggle />
            <Button
              onClick={handleRefresh}
              disabled={loading}
              variant="outline"
              className="border-zinc-200 dark:border-zinc-700 text-xs font-bold"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin text-orange-600' : ''}`} />
              {loading ? 'Syncing...' : 'Sync Data'}
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile Menu Toggle (User Control & Freedom) */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowNavMenu(!showNavMenu)}
              className="border-zinc-200 dark:border-zinc-700 relative z-50"
            >
              {showNavMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown Menu with Backdrop */}
        {showNavMenu && (
          <>
            <div
              className="fixed inset-0 bg-zinc-950/20 dark:bg-zinc-950/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setShowNavMenu(false)}
            />
            <div className="absolute top-full left-0 right-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-xl z-50 md:hidden animate-in slide-in-from-top-2">
              <div className="p-4 flex flex-col gap-2">
                <Button onClick={() => { setShowNavMenu(false); navigate('/generate-qr'); }} variant="ghost" className="justify-start w-full text-sm">
                  <QrCode className="w-5 h-5 mr-3 text-orange-600" /> Generate QR
                </Button>
                <Button onClick={() => { setShowNavMenu(false); navigate('/payment-scanner'); }} variant="ghost" className="justify-start w-full text-sm">
                  <Smartphone className="w-5 h-5 mr-3 text-orange-600" /> QR Scanner
                </Button>
                <Button onClick={() => { setShowNavMenu(false); handleRefresh(); }} disabled={loading} variant="ghost" className="justify-start w-full text-sm">
                  <RefreshCw className={`w-5 h-5 mr-3 ${loading ? 'animate-spin text-orange-600' : 'text-zinc-500'}`} /> Sync Data
                </Button>
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2" />
                <Button onClick={() => { setShowNavMenu(false); handleLogout(); }} variant="ghost" className="justify-start w-full text-sm text-red-600 hover:text-red-700">
                  <LogOut className="w-5 h-5 mr-3" /> Logout
                </Button>
              </div>
            </div>
          </>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-8 pb-32">

        {/* HEURISTIC: Error Diagnosis & Recovery */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-red-800 dark:text-red-400">Sync Error</h3>
              <p className="text-xs text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        <SubscriptionShield requiredTier="CORE" featureName="Real-time Stats">

          {/* HEURISTIC: Efficiency of Use (Filters & Actions grouped) */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:flex-none min-w-[140px]">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm font-semibold rounded-xl pl-10 pr-8 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none appearance-none"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              <div className="relative flex-1 sm:flex-none min-w-[140px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm font-semibold rounded-xl pl-10 pr-8 py-2.5 focus:ring-2 focus:ring-orange-600 outline-none appearance-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="success">Successful</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {/* HEURISTIC: Error Prevention (Disable export if no data) */}
            <Button
              onClick={downloadCSV}
              disabled={!transactions || transactions.length === 0}
              // Light Mode: bg-brand-buttonBase, text-brand-buttonText
              // Dark Mode: dark:bg-brand-buttonDark, dark:text-brand-buttonTextDark
              className="w-full lg:w-auto flex items-center justify-center font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed
    bg-brand-buttonBase text-brand-buttonText hover:opacity-80
    dark:bg-brand-buttonDark dark:text-brand-buttonTextDark dark:hover:opacity-80"
            >
              <Download className="w-4 h-4 mr-2 shrink-0" />
              Export Log
            </Button>
          </div>

          {/* HEURISTIC: Match System & Real World (Clearer terminology) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* 1. TOTAL REVENUE (Using your custom brand-orange) */}
            <Card className="bg-brand-orange text-white border-none shadow-lg shadow-brand-orange/20">
              <CardContent className="p-6">
                <p className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-black tracking-widest mb-2">
                  Total Revenue
                </p>
                <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white italic tracking-tighter">
                  {formatCurrency(stats.totalRevenue)
                  }
                </div>
                <p className="text-emerald-600 dark:text-emerald-400 text-[10px] mt-2 font-bold uppercase tracking-widest">
                  {stats.totalTransactions} Completed Sales
                </p>
              </CardContent>
            </Card>

            {/* 2. SUCCESS RATE (Using dark:bg-brand-gray for OLED-friendly cards) */}
            <Card className="bg-white dark:bg-brand-gray border-zinc-200 dark:border-brand-gray shadow-sm">
              <CardContent className="p-6">
                <p className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-black tracking-widest mb-2">
                  Success Rate
                </p>
                <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
                  {stats.successRate}%
                </div>
                <p className="text-emerald-600 dark:text-emerald-400 text-[10px] mt-2 font-bold uppercase tracking-widest">
                  Transaction Health
                </p>
              </CardContent>
            </Card>

            {/* 3. PENDING (Matching the clean pattern) */}
            <Card className="bg-white dark:bg-brand-gray border-zinc-200 dark:border-brand-gray shadow-sm">
              <CardContent className="p-6">
                <p className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-black tracking-widest mb-2">
                  Pending Confirmation
                </p>
                <div className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400">
                  {stats.pendingPayments}
                </div>
                <p className="text-zinc-400 dark:text-zinc-500 text-[10px] mt-2 font-bold uppercase tracking-widest">
                  Awaiting PIN
                </p>
              </CardContent>
            </Card>

            {/* 4. FAILED (Matching the clean pattern) */}
            <Card className="bg-white dark:bg-brand-gray border-zinc-200 dark:border-brand-gray shadow-sm">
              <CardContent className="p-6">
                <p className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-black tracking-widest mb-2">
                  Failed Orders
                </p>
                <div className="text-2xl sm:text-3xl font-black text-red-500 dark:text-red-400">
                  {stats.failedPayments}
                </div>
                <p className="text-zinc-400 dark:text-zinc-500 text-[10px] mt-2 font-bold uppercase tracking-widest">
                  Requires Action
                </p>
              </CardContent>
            </Card>

          </div>
        </SubscriptionShield>

        {/* HEURISTIC: Beautiful & Simple Design (Cleaner Tabs) */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full overflow-x-auto bg-zinc-200/50 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 no-scrollbar">
            <TabsTrigger value="overview" className="flex-1 py-3 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 rounded-xl shadow-sm transition-all">
              Overview
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1 py-3 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 rounded-xl shadow-sm transition-all">
              Ledger
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex-1 py-3 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 rounded-xl shadow-sm transition-all">
              Setup Menu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <SubscriptionShield requiredTier="ELITE" featureName="Advanced Analytics">
              <AnalyticsModule />
            </SubscriptionShield>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Activity className="w-4 h-4 text-orange-500" /> Recent Transactions
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0">
                {transactions && transactions.length > 0 ? (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {transactions.slice(0, 10).map((transaction, idx) => {
                      const isSuccess = transaction.status?.toLowerCase() === 'success';
                      // ... (Keep existing date formatting logic here) ...

                      return (
                        <div key={transaction.id || idx} className="p-4 sm:p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${isSuccess ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>
                              <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                                {transaction.phoneNumber || transaction.accountRef || 'Walk-in Customer'}
                              </p>
                              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mt-0.5">
                                {/* Format Date String Here */}
                                {formatDate(transaction.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-sm sm:text-base text-zinc-900 dark:text-white">
                              KES {Number(transaction.amount).toLocaleString()}
                            </p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${isSuccess ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400' :
                              transaction.status === 'pending' ? 'text-amber-700 bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400' :
                                'text-red-700 bg-red-100 dark:bg-red-500/10 dark:text-red-400'
                              }`}>
                              {transaction.status || 'UNKNOWN'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // HEURISTIC: Help and Recovery (Actionable Empty State)
                  <div className="text-center py-20 px-6">
                    <div className="bg-zinc-100 dark:bg-zinc-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <QrCode className="w-8 h-8 text-zinc-400" />
                    </div>
                    <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-2">No Transactions Yet</h3>
                    <p className="text-xs text-zinc-500 font-medium mb-6 max-w-[250px] mx-auto">
                      Your ledger is empty. Generate your first QR code to start receiving payments.
                    </p>
                    <Button onClick={() => navigate('/generate-qr')} className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-6 rounded-xl">
                      Generate First QR Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu" className="mt-6">
            <SubscriptionShield requiredTier="CORE" featureName="Digital Menu" requiredAddon="menuEnabled">
              {user ? <MenuModule merchantId={user.uid} /> : <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-orange-500" /></div>}
            </SubscriptionShield>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MerchantDashboard;
import React, { useState, useEffect } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart
} from 'recharts';
import {
  ArrowUpRight, ArrowDownRight, Zap, Clock, Sparkles
} from 'lucide-react';

const AnalyticsModule = ({ analytics }) => {
  const [chartData, setChartData] = useState([]);
  const [viewMode, setViewMode] = useState('bar');

  useEffect(() => {
    if (analytics) {
      processVisualization(analytics);
    }
  }, [analytics]);

  const processVisualization = (data) => {
    if (!data?.dailySummaries || data.dailySummaries.length === 0) return;

    const sortedRawData = [...data.dailySummaries].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const isLongPeriod = sortedRawData.length > 7;
    const lastIndex = sortedRawData.length - 1;
    const todayStr = new Date().toDateString();

    let history = sortedRawData.map((day, index) => {
      const d = new Date(day.date);
      const isToday = d.toDateString() === todayStr;
      const isOngoingDay = index === lastIndex;

      // Determine label: Show "Today" if it's the current date
      let dateLabel = isLongPeriod
        ? d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })
        : d.toLocaleDateString('en-KE', { weekday: 'short' });
      
      if (isToday) dateLabel = "Today";

      return {
        fullDate: day.date,
        date: dateLabel,
        actualRevenue: Number(day.totalRevenue || 0),
        // We only show forecastRevenue for the "Tomorrow" node or the transition point.
        // To hide the orange bar Today, we set forecastRevenue to null in Bar mode, 
        // but keep it for Trend mode to connect lines.
        forecastRevenue: (viewMode === 'trend' && isOngoingDay) 
          ? Number(day.totalRevenue || 0) 
          : null,
        isOngoingDay
      };
    });

    // Add "Tomorrow" Forecast
    if (data.insights?.prediction && (data.period === 'week' || data.period === 'today')) {
      history.push({
        date: 'Tomorrow',
        actualRevenue: null, 
        forecastRevenue: Number(data.insights.prediction.nextDayRevenue || 0),
        isOngoingDay: false
      });
    }

    setChartData(history);
  };

  const processPieData = (data) => {
    if (!data?.dailySummaries) return [];
    const sorted = [...data.dailySummaries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const isLongPeriod = sorted.length > 7;
    const todayStr = new Date().toDateString();

    return sorted.map(day => {
      const d = new Date(day.date);
      const label = d.toDateString() === todayStr ? "Today" : (isLongPeriod
        ? d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })
        : d.toLocaleDateString('en-KE', { weekday: 'short' }));
      return {
        name: label,
        value: Number(day.totalRevenue || 0)
      };
    }).filter(item => item.value > 0);
  };

  const pieData = processPieData(analytics);
  const PIE_COLORS = ['#FF6B00', '#F97316', '#FB923C', '#FDBA74', '#71717a', '#52525b', '#3f3f46'];
  const isGrowth = analytics?.insights?.prediction?.trendDirection === 'growth';

  const getSafeValue = (val) => {
    if (Array.isArray(val)) return Number(val[1] || val[0] || 0);
    return Number(val || 0);
  };

  if (!analytics) return (
    <div className="w-full h-96 flex flex-col items-center justify-center space-y-4 animate-pulse">
      <div className="w-16 h-16 bg-brand-borderLight dark:bg-brand-borderDark rounded-full" />
      <div className="h-4 w-48 bg-brand-borderLight dark:bg-brand-borderDark rounded" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* TOP ROW: INTELLIGENCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="p-6 rounded-[2rem] bg-brand-surface dark:bg-brand-gray border border-brand-borderLight dark:border-brand-borderDark shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-brand-light dark:bg-brand-black rounded-xl border border-brand-borderLight dark:border-brand-borderDark">
              <Zap className="w-5 h-5 text-content-main dark:text-content-mainDark" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-content-muted">Current Period</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-content-main dark:text-content-mainDark">
            <span className="text-sm font-bold align-top mr-1 text-content-muted">KES</span>
            {Number(analytics?.summary?.totalRevenue || 0).toLocaleString()}
          </h3>
        </div>

        <div className="relative p-6 rounded-[2rem] bg-brand-black border border-brand-borderDark overflow-hidden group shadow-2xl">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-orange/20 blur-3xl rounded-full group-hover:bg-brand-orange/30 transition-all" />
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="p-2.5 bg-brand-orange/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-brand-orange" />
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isGrowth ? 'bg-status-success' : 'bg-status-error'} animate-pulse`} />
              <span className="text-[9px] font-black uppercase tracking-widest text-content-mutedDark">AI Forecast</span>
            </div>
          </div>
          <h3 className="relative z-10 text-2xl md:text-3xl font-black text-white flex items-center gap-2">
            <span className="text-sm font-bold align-top text-content-mutedDark">KES</span>
            {Number(analytics?.insights?.prediction?.nextDayRevenue || 0).toLocaleString()}
            {isGrowth ? <ArrowUpRight className="w-5 h-5 text-status-success" /> : <ArrowDownRight className="w-5 h-5 text-status-error" />}
          </h3>
          <p className="relative z-10 text-[10px] font-bold text-content-mutedDark mt-2 uppercase tracking-wide">Projected for Tomorrow</p>
        </div>

        <div className="p-6 rounded-[2rem] bg-brand-surface dark:bg-brand-gray border border-brand-borderLight dark:border-brand-borderDark shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-brand-light dark:bg-brand-black rounded-xl border border-brand-borderLight dark:border-brand-borderDark">
              <Clock className="w-5 h-5 text-brand-orange" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-content-muted">Peak Hour</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-content-main dark:text-content-mainDark">
            {analytics?.insights?.peakTradingHour || 'N/A'}
          </h3>
          <p className="text-[10px] font-bold text-content-muted mt-2 uppercase tracking-wide">Most Active Time</p>
        </div>
      </div>

      {/* BOTTOM ROW: CHART ENGINE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 md:p-8 rounded-[2.5rem] bg-brand-surface dark:bg-brand-gray border border-brand-borderLight dark:border-brand-borderDark shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-content-muted mb-1">Performance</h4>
              <h2 className="text-xl md:text-2xl font-black text-content-main dark:text-content-mainDark italic">
                {viewMode === 'bar' ? 'Revenue Volume' : 'Growth Trajectory'}
              </h2>
            </div>
            <div className="flex bg-brand-light dark:bg-brand-black p-1 rounded-xl border border-brand-borderLight dark:border-brand-borderDark">
              <button onClick={() => setViewMode('bar')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'bar' ? 'bg-brand-surface dark:bg-brand-gray text-content-main dark:text-content-mainDark shadow-sm' : 'text-content-muted hover:text-content-main dark:hover:text-content-mainDark'}`}>Bar</button>
              <button onClick={() => setViewMode('trend')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'trend' ? 'bg-brand-orange text-white shadow-brand-orange/20 shadow-lg' : 'text-content-muted hover:text-content-main dark:hover:text-content-mainDark'}`}>Trend</button>
            </div>
          </div>

          <div className="h-[300px] md:h-[400px] w-full">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {viewMode === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#71717A" opacity={0.2} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717A', fontWeight: 'bold' }} dy={10} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#71717A', fontWeight: 'bold' }} 
                      tickFormatter={(val) => `${val / 1000}k`}
                      domain={[0, 'auto']} // Ensures it scales naturally based on data
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,107,0,0.05)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-tooltip-bg dark:bg-tooltip-bgDark border border-tooltip-border dark:border-tooltip-borderDark text-tooltip-text dark:text-tooltip-textDark p-3 rounded-xl shadow-2xl z-50">
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">{label}</p>
                              <div className="space-y-1.5">
                                {payload.map((entry, index) => {
                                  const val = getSafeValue(entry.value);
                                  if (val === 0 && entry.dataKey !== 'forecastRevenue') return null;
                                  const isForecast = entry.dataKey === 'forecastRevenue';
                                  return (
                                    <div key={index} className="flex items-center gap-2 text-sm font-bold">
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                      <span className="opacity-90">{isForecast ? 'AI Forecast' : 'Actual'}:</span>
                                      <span>KES {val.toLocaleString()}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="actualRevenue" radius={[6, 6, 0, 0]} barSize={30} fill="#121212" className="dark:fill-brand-light fill-brand-black" />
                    {/* Forecast bar only shows for "Tomorrow" now */}
                    <Bar dataKey="forecastRevenue" radius={[6, 6, 0, 0]} barSize={30} fill="#FF6B00" opacity={0.9} />
                  </BarChart>
                ) : (
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#71717A" opacity={0.2} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717A', fontWeight: 'bold' }} dy={10} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#71717A', fontWeight: 'bold' }} 
                      tickFormatter={(val) => `${val / 1000}k`}
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-tooltip-bg dark:bg-tooltip-bgDark border border-tooltip-border dark:border-tooltip-borderDark text-tooltip-text dark:text-tooltip-textDark p-3 rounded-xl shadow-2xl z-50">
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">{label}</p>
                              <div className="space-y-1.5">
                                {payload.map((entry, index) => {
                                  const val = getSafeValue(entry.value);
                                  return (
                                    <div key={index} className="flex items-center gap-2 text-sm font-bold">
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                      <span className="opacity-90">{entry.name === 'actualRevenue' ? 'Actual' : 'AI Forecast'}:</span>
                                      <span>KES {val.toLocaleString()}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line type="monotone" dataKey="actualRevenue" stroke="#121212" className="dark:stroke-brand-light stroke-brand-black" strokeWidth={3} dot={{ r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls={true} />
                    <Line type="monotone" dataKey="forecastRevenue" stroke="#FF6B00" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: '#FF6B00' }} connectNulls={true} />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-content-muted">
                <BarChart className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Waiting for data</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 p-6 md:p-8 rounded-[2.5rem] bg-brand-surface dark:bg-brand-gray border border-brand-borderLight dark:border-brand-borderDark shadow-sm flex flex-col">
          <div className="mb-4">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-content-muted mb-1">Breakdown</h4>
            <h2 className="text-xl md:text-2xl font-black text-content-main dark:text-content-mainDark italic">Daily Share</h2>
          </div>
          <div className="flex-1 w-full relative min-h-[300px]">
            {pieData && pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-tooltip-bg dark:bg-tooltip-bgDark border border-tooltip-border dark:border-tooltip-borderDark text-tooltip-text dark:text-tooltip-textDark p-3 rounded-xl shadow-2xl z-50">
                            <div className="flex items-center gap-2 text-sm font-bold">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill || payload[0].color }} />
                              <span className="opacity-90">{payload[0].name}:</span>
                              <span>KES {getSafeValue(payload[0].value).toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-content-muted">
                <p className="text-xs font-bold uppercase tracking-widest">No data available</p>
              </div>
            )}

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
              <span className="text-[10px] text-content-muted font-bold uppercase block tracking-widest">Total</span>
              <span className="text-2xl font-black text-content-main dark:text-content-mainDark">{analytics?.dailySummaries?.length || 0}</span>
              <span className="text-[9px] text-content-muted font-bold uppercase block">Days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsModule;
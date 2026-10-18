// Static demo data that populates the dashboard during a free trial session.
// This data is intentionally realistic to give prospects an accurate preview
// of how the system looks and behaves with real transaction volume.

export const DEMO_MERCHANT = {
  name: 'Demo Business',
  accountType: 'Restaurant',
  email: 'demo@merchantpro.co.ke',
  phone: '254712345678',
  tillNumber: '123456',
};

export const DEMO_ANALYTICS = {
  summary: {
    totalRevenue: 187450,
    totalTransactions: 63,
    averageTransaction: 2975,
  },
  // Use ISO date strings so AnalyticsModule can parse them correctly
  dailySummaries: (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const revenues = [18400, 24100, 31700, 27500, 42300, 29600, 13850];
      days.push({
        date: d.toISOString().split('T')[0],
        totalRevenue: revenues[6 - i],
        totalTransactions: Math.floor(revenues[6 - i] / 2975),
      });
    }
    return days;
  })(),
  insights: {
    peakTradingHour: '12:00 PM',
    prediction: {
      nextDayRevenue: 34200,
      trendDirection: 'growth',
    },
  },
  period: 'week',
  statusBreakdown: {
    success: 55,
    pending: 5,
    failed: 3,
  },
};


// Generates a timestamp offset by a given number of minutes from now
const ago = (minutesAgo) => {
  const d = new Date(Date.now() - minutesAgo * 60 * 1000);
  return { _seconds: Math.floor(d.getTime() / 1000), _nanoseconds: 0 };
};

export const DEMO_TRANSACTIONS = [
  {
    id: 'demo-txn-001',
    phoneNumber: '254712345678',
    amount: 1200,
    status: 'success',
    transactionRef: 'QHF7K2L9X1',
    accountRef: 'TBL-01',
    createdAt: ago(5),
  },
  {
    id: 'demo-txn-002',
    phoneNumber: '254798765432',
    amount: 3500,
    status: 'success',
    transactionRef: 'MPN3R8T0W6',
    accountRef: 'TBL-04',
    createdAt: ago(18),
  },
  {
    id: 'demo-txn-003',
    phoneNumber: '254723456789',
    amount: 850,
    status: 'pending',
    transactionRef: 'ZCQ5Y1A4V7',
    accountRef: 'TBL-02',
    createdAt: ago(32),
  },
  {
    id: 'demo-txn-004',
    phoneNumber: '254756789012',
    amount: 4200,
    status: 'success',
    transactionRef: 'LBD9E6N2S8',
    accountRef: 'TBL-07',
    createdAt: ago(54),
  },
  {
    id: 'demo-txn-005',
    phoneNumber: '254711223344',
    amount: 650,
    status: 'failed',
    transactionRef: 'RKU1M0P5F3',
    accountRef: 'TBL-03',
    createdAt: ago(71),
  },
  {
    id: 'demo-txn-006',
    phoneNumber: '254733445566',
    amount: 2100,
    status: 'success',
    transactionRef: 'GTH4C8J6Q2',
    accountRef: 'TBL-05',
    createdAt: ago(95),
  },
  {
    id: 'demo-txn-007',
    phoneNumber: '254744556677',
    amount: 5800,
    status: 'success',
    transactionRef: 'WYX2O7B1D9',
    accountRef: 'TBL-08',
    createdAt: ago(120),
  },
  {
    id: 'demo-txn-008',
    phoneNumber: '254766778899',
    amount: 1750,
    status: 'success',
    transactionRef: 'NAE5I3U0K4',
    accountRef: 'TBL-06',
    createdAt: ago(145),
  },
  {
    id: 'demo-txn-009',
    phoneNumber: '254777889900',
    amount: 920,
    status: 'pending',
    transactionRef: 'FJS8V4H7T6',
    accountRef: 'TBL-01',
    createdAt: ago(200),
  },
  {
    id: 'demo-txn-010',
    phoneNumber: '254788990011',
    amount: 3100,
    status: 'success',
    transactionRef: 'PLM6X0Z9C5',
    accountRef: 'TBL-09',
    createdAt: ago(260),
  },
];

export const DEMO_MENU_ITEMS = [
  { name: 'Nyama Choma Platter', price: '1200', category: 'Mains', isAvailable: true, imageUrl: '/menu-images/Nyama%20choma.jpg' },
  { name: 'Ham sandwich', price: '350', category: 'Sides', isAvailable: true, imageUrl: '/menu-images/Ham%20Sandwich.jpg' },
  { name: 'Pilau (Full)', price: '550', category: 'Mains', isAvailable: true, imageUrl: '/menu-images/Pilau.jpg' },
  { name: 'Chips & Chicken', price: '650', category: 'Sides', isAvailable: true, imageUrl: '/menu-images/Chips%20and%20Chiken.jpg' },
  { name: 'Fresh Juice (500ml)', price: '150', category: 'Drinks', isAvailable: true, imageUrl: '/menu-images/Fresh%20juices.jpg' },
  { name: 'Soda (330ml)', price: '100', category: 'Drinks', isAvailable: true, imageUrl: '/menu-images/Soda.jpg' },
  { name: 'Samosa (3 pcs)', price: '120', category: 'Snacks', isAvailable: true, imageUrl: '/menu-images/samosas.jpg' },
];

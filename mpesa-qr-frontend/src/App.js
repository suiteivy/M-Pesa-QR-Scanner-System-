import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Components
import Login from './components/Login';
import Register from './components/Register';
import MerchantDashboard from './components/MerchantDashboard';
import MerchantQRGenerator from './components/MerchantQRGenerator';
import PublicQRScanner from './components/PublicQRScanner';
import Transactions from './components/Transactions';
import QRPaymentScanner from './components/QRPaymentScanner';
import PayPrompt from "./components/PayPrompt";
import PublicMenuPage from './components/PublicMenuPage';
import LandingPage from './components/LandingPage';
import BookConsultation from './components/BookConsultation';
import TrialDashboard from './components/TrialDashboard';

// Utilities
import PrivateRoute from './utility/PrivateRoute';
import { SubscriptionProvider } from './hooks/SubscriptionProvider';
import { FreeTrialProvider } from './hooks/FreeTrialContext';

// --- ROUTING COMPONENT ---
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Landing Page */}
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />}
      />
      <Route path="/landing" element={<LandingPage />} />

      {/* Auth Routes (redirect to dashboard if already signed in) */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      {/* Free trial: accessible without any login or account */}
      <Route path="/trial" element={<TrialDashboard />} />

      {/* Public Routes */}
      <Route path="/scan" element={<PublicQRScanner />} />
      <Route path="/pay" element={<PayPrompt />} />
      <Route path="/public/menu/:merchantId" element={<PublicMenuPage />} />
      <Route path="/book-consultation" element={<BookConsultation />} />
      <Route path="/contact-us" element={<BookConsultation />} />

      {/* Protected Routes */}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<MerchantDashboard />} />
        <Route path="/generate-qr" element={<MerchantQRGenerator />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/payment-scanner" element={<PublicQRScanner />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  return (
    <AuthProvider>
      <FreeTrialProvider>
        <SubscriptionProvider>
          <div className="App">
            <AppRoutes />
          </div>
        </SubscriptionProvider>
      </FreeTrialProvider>
    </AuthProvider>
  );
}

export default App;
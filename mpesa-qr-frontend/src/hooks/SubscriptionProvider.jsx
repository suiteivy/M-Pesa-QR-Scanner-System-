import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { Loader2, ShieldCheck } from 'lucide-react'; 

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth(); 
  
  const [subState, setSubState] = useState({
    tier: 'CORE',
    status: 'TRIALING',
    isValid: false, 
    menuEnabled: false,
    loading: true, 
    isBoarded: false
  });

  // --- 1. REAL-TIME DATABASE SYNC ---
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setSubState(prev => ({ ...prev, loading: false, isValid: false }));
      return;
    }

    const unsub = onSnapshot(doc(db, 'merchants', user.uid), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const now = Date.now();
        
        let expiryDate = null;
        if (data.subscription?.expiry) {
          expiryDate = typeof data.subscription.expiry.toDate === 'function' 
            ? data.subscription.expiry.toDate().getTime() 
            : new Date(data.subscription.expiry).getTime(); 
        }

        let isWithinTimeframe = expiryDate ? now < expiryDate : false;
        const statusActive = data.subscription?.status === 'ACTIVE';
        const isTrialing = data.subscription?.status === 'TRIALING';

        // --- ⚡️ THE 1-HOUR LOCAL DEMO GUARD ---
        // If they are using the demo account, override the database expiry with a local 1-hour session
        if (user.email === 'admin@cloudora.com') { // Use your exact demo email here
          let demoStart = localStorage.getItem('demo_start_time');
          
          // If this is their first time logging in, start the 1-hour timer
          if (!demoStart) {
            demoStart = now.toString();
            localStorage.setItem('demo_start_time', demoStart);
          }
          
          // Calculate exactly 60 minutes from when they first logged in
          const ONE_HOUR_MS = 60 * 60 * 1000;
          const demoExpiry = parseInt(demoStart, 10) + ONE_HOUR_MS;
          
          // Override the valid check: They are valid ONLY if the current time is before their local expiry
          isWithinTimeframe = now < demoExpiry;
        }

        setSubState({
          tier: data.subscription?.tier || 'CORE',
          status: data.subscription?.status || 'EXPIRED',
          isValid: (statusActive || isTrialing) && isWithinTimeframe,
          menuEnabled: data.addons?.menuEnabled || false,
          isBoarded: data.metadata?.isBoarded || false,
          loading: false 
        });
      } else {
        setSubState(prev => ({ ...prev, loading: false, isValid: false }));
      }
    }, (error) => {
      console.error("Subscription Sync Error:", error);
      setSubState(prev => ({ ...prev, loading: false, isValid: false }));
    });

    return () => unsub();
  }, [user, authLoading]);

  // --- 2. LIVE COUNTDOWN KICKER ---
  // This interval runs every 10 seconds to ensure they are booted out instantly when the hour is up,
  // without needing to refresh the page.
  useEffect(() => {
    if (subState.isValid && user?.email === 'admin@cloudora.com') {
      const interval = setInterval(() => {
        const demoStart = localStorage.getItem('demo_start_time');
        if (demoStart) {
          const ONE_HOUR_MS = 60 * 60 * 1000;
          const hasExpired = Date.now() > parseInt(demoStart, 10) + ONE_HOUR_MS;
          
          if (hasExpired) {
            // Trigger the SubscriptionShield instantly
            setSubState(prev => ({ ...prev, isValid: false, status: 'EXPIRED' }));
            clearInterval(interval);
          }
        }
      }, 10000); 

      return () => clearInterval(interval);
    }
  }, [subState.isValid, user]);

  if (subState.loading || authLoading) {
    return (
      <div className="min-h-screen bg-brand-light dark:bg-brand-black flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="bg-brand-orange/10 p-5 rounded-3xl mb-6 relative border border-brand-orange/20">
          <ShieldCheck className="w-10 h-10 text-brand-orange relative z-10" />
          <div className="absolute inset-0 border-2 border-brand-orange/30 rounded-3xl animate-ping opacity-20" />
        </div>
        <div className="flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-brand-orange animate-spin" />
          <p className="text-content-muted dark:text-content-mutedDark text-xs font-black uppercase tracking-[0.2em]">
            Securing Demo Session
          </p>
        </div>
      </div>
    );
  }

  return (
    <SubscriptionContext.Provider value={subState}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
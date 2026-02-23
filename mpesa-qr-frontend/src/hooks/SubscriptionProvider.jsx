import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { Loader2, ShieldCheck } from 'lucide-react'; // Added icons for the loading state

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  // 1. THE FIX: Grab the 'loading' state from your Auth context!
  // We rename it to 'authLoading' to avoid confusing it with our subscription loading.
  const { user, loading: authLoading } = useAuth(); 
  
  const [subState, setSubState] = useState({
    tier: 'CORE',
    status: 'TRIALING',
    isValid: false, // Starts locked, but we won't show it until loading is done
    menuEnabled: false,
    loading: true, 
    isBoarded: false
  });

  useEffect(() => {
    // 2. THE GATEKEEPER: If Auth is still loading, freeze! Do nothing yet.
    if (authLoading) return;

    // 3. Auth is done. If they aren't logged in, kill the loader.
    if (!user) {
      setSubState(prev => ({ ...prev, loading: false, isValid: false }));
      return;
    }

    // 4. They are logged in! Fetch the real data.
    const unsub = onSnapshot(doc(db, 'merchants', user.uid), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const now = new Date();
        
        // Safely extract the expiry date
        let expiryDate = null;
        if (data.subscription?.expiry) {
          expiryDate = typeof data.subscription.expiry.toDate === 'function' 
            ? data.subscription.expiry.toDate() 
            : new Date(data.subscription.expiry); 
        }

        const isWithinTimeframe = expiryDate ? now < expiryDate : false;
        const statusActive = data.subscription?.status === 'ACTIVE';
        const isTrialing = data.subscription?.status === 'TRIALING';

        setSubState({
          tier: data.subscription?.tier || 'CORE',
          status: data.subscription?.status || 'EXPIRED',
          isValid: (statusActive || isTrialing) && isWithinTimeframe,
          menuEnabled: data.addons?.menuEnabled || false,
          isBoarded: data.metadata?.isBoarded || false,
          loading: false // DATA SECURED! Unlock the UI.
        });
      } else {
        // Doc doesn't exist yet
        setSubState(prev => ({ ...prev, loading: false, isValid: false }));
      }
    }, (error) => {
      console.error("Subscription Sync Error:", error);
      setSubState(prev => ({ ...prev, loading: false, isValid: false }));
    });

    return () => unsub();
  }, [user, authLoading]); // Added authLoading to the dependency array

  // --- HCI: Visibility of System Status ---
  // Instead of showing a blank screen or flashing a locked UI, 
  // we show a sleek, on-brand verification screen while the APIs talk to each other.
  if (subState.loading || authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="bg-orange-600/10 p-5 rounded-3xl mb-6 relative">
          <ShieldCheck className="w-10 h-10 text-orange-600 relative z-10" />
          <div className="absolute inset-0 border-2 border-orange-600/30 rounded-3xl animate-ping opacity-20" />
        </div>
        <div className="flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
          <p className="text-zinc-600 dark:text-zinc-400 text-xs font-black uppercase tracking-[0.2em]">
            Verifying License
          </p>
        </div>
      </div>
    );
  }

  // Once loading is completely false, render the actual app
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
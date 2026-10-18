import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebase';

// Free trial duration: 3 days in milliseconds
const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

// Firestore collection that stores trial session metadata
const TRIAL_COLLECTION = 'freeTrials';

const FreeTrialContext = createContext(null);

export const FreeTrialProvider = ({ children }) => {
  const [hasUsedTrial, setHasUsedTrial] = useState(() => {
    return Boolean(localStorage.getItem('hasUsedTrial'));
  });

  const [isTrialActive, setIsTrialActive] = useState(() => {
    return Boolean(localStorage.getItem('trialStartTime'));
  });

  const [trialStartTime, setTrialStartTime] = useState(() => {
    const saved = localStorage.getItem('trialStartTime');
    return saved ? Number(saved) : null;
  });

  const [timeLeft, setTimeLeft] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState({ days: 3, hours: 0, minutes: 0, seconds: 0 });
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [trialLoading, setTrialLoading] = useState(true);

  // 1. On mount: check local storage first for instant render, then sync with Firebase.
  useEffect(() => {
    const localStart = localStorage.getItem('trialStartTime');
    if (localStart) {
      const startTimeNum = Number(localStart);
      setTrialStartTime(startTimeNum);
      setIsTrialActive(true);
      if (Date.now() - startTimeNum >= TRIAL_DURATION_MS) {
        setIsTrialExpired(true);
        setHasUsedTrial(true);
        localStorage.setItem('hasUsedTrial', 'true');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.isAnonymous) {
        try {
          const trialRef = doc(db, TRIAL_COLLECTION, firebaseUser.uid);
          const trialSnap = await getDoc(trialRef);

          if (trialSnap.exists()) {
            const data = trialSnap.data();
            const startTime = data.startTime?.toDate
              ? data.startTime.toDate().getTime()
              : (data.startTime ? new Date(data.startTime).getTime() : Date.now());

            setTrialStartTime(startTime);
            localStorage.setItem('trialStartTime', startTime.toString());
            setIsTrialActive(true);

            if (Date.now() - startTime >= TRIAL_DURATION_MS) {
              setIsTrialExpired(true);
              setHasUsedTrial(true);
              localStorage.setItem('hasUsedTrial', 'true');
            }
          }
        } catch (err) {
          console.warn('Free trial Firebase session read note:', err.message);
        }
      }
      setTrialLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Countdown ticker: runs continuously in real-time whenever trialStartTime exists
  useEffect(() => {
    if (!trialStartTime) return;

    const tick = () => {
      const now = Date.now();
      const expiryTime = trialStartTime + TRIAL_DURATION_MS;
      const difference = expiryTime - now;

      if (difference <= 0) {
        setTimeLeft('0d 00:00:00');
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsTrialExpired(true);
        setHasUsedTrial(true);
        localStorage.setItem('hasUsedTrial', 'true');
        return;
      }

      const totalSeconds = Math.floor(difference / 1000);
      const days = Math.floor(totalSeconds / (60 * 60 * 24));
      const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      const seconds = totalSeconds % 60;

      setTimeRemaining({ days, hours, minutes, seconds });
      setTimeLeft(
        `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    tick(); // Run immediately
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [trialStartTime]);

  // 3. Start trial: immediately records current timestamp in local state + storage, then syncs with Firebase.
  const startTrial = useCallback(async () => {
    const now = Date.now();
    let startTimeToUse = trialStartTime;

    if (!startTimeToUse) {
      const saved = localStorage.getItem('trialStartTime');
      startTimeToUse = saved ? Number(saved) : now;
    }

    localStorage.setItem('trialStartTime', startTimeToUse.toString());
    setTrialStartTime(startTimeToUse);
    setIsTrialActive(true);
    setIsTrialExpired(false);

    try {
      const credential = await signInAnonymously(auth);
      const uid = credential.user.uid;
      const trialRef = doc(db, TRIAL_COLLECTION, uid);

      const existing = await getDoc(trialRef);
      if (!existing.exists()) {
        await setDoc(trialRef, {
          startTime: serverTimestamp(),
          active: true,
        });
      }
    } catch (err) {
      console.warn('Firebase Anonymous Auth notice:', err.message);
    }
  }, [trialStartTime]);

  // 4. End trial: clears storage and local state, marks trial as used, and signs out anonymous user from Firebase.
  const endTrial = useCallback(async () => {
    localStorage.removeItem('trialStartTime');
    localStorage.removeItem('trial_menu_items');
    localStorage.removeItem('trial_orders');
    localStorage.setItem('hasUsedTrial', 'true');
    setHasUsedTrial(true);
    setIsTrialActive(false);
    setTrialStartTime(null);
    setTimeLeft(null);
    setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    setIsTrialExpired(false);

    try {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.isAnonymous) {
        try {
          const menuRef = collection(db, 'merchants', currentUser.uid, 'menu');
          const menuSnapshot = await getDocs(menuRef);
          if (!menuSnapshot.empty) {
            const batch = writeBatch(db);
            menuSnapshot.docs.forEach((menuDoc) => batch.delete(menuDoc.ref));
            await batch.commit();
          }
        } catch (cleanupError) {
          console.warn('Trial menu cleanup notice:', cleanupError.message);
        }
        const trialRef = doc(db, TRIAL_COLLECTION, currentUser.uid);
        await deleteDoc(trialRef);
        await signOut(auth);
      }
    } catch (err) {
      console.warn('End trial Firebase notice:', err.message);
    }
  }, []);

  const value = {
    isTrialActive,
    isTrialExpired,
    hasUsedTrial,
    trialStartTime,
    timeLeft,
    timeRemaining,
    trialLoading,
    startTrial,
    endTrial,
  };

  return (
    <FreeTrialContext.Provider value={value}>
      {children}
    </FreeTrialContext.Provider>
  );
};

export const useFreeTrial = () => {
  const context = useContext(FreeTrialContext);
  if (!context) {
    throw new Error('useFreeTrial must be used within a FreeTrialProvider');
  }
  return context;
};

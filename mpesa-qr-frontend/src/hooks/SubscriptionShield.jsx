import React from 'react';
import { Lock, Zap, RefreshCw, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // HCI: Use fast client-side routing
import { useSubscription } from './SubscriptionProvider';
import Button from '../components/ui/Button';

const SubscriptionShield = ({ 
  children, 
  requiredTier = 'CORE', 
  requiredAddon = null,   
  featureName = "this feature" 
}) => {
  const navigate = useNavigate();
  const { tier, isValid, menuEnabled } = useSubscription();

  // --- Logic Checks ---
  // Using 'PRO' assuming your elite tier was rebranded to Merchant Pro in the UI
  const hasTierAccess = tier === 'PRO' || tier === 'ELITE' || tier === requiredTier;
  const hasAddonAccess = requiredAddon ? menuEnabled : true;
  
  // --- HCI: Error Diagnosis ---
  // Determine the EXACT reason they are locked out to provide the correct recovery path
  const isExpired = !isValid;
  const needsTierUpgrade = !hasTierAccess;
  const needsAddon = requiredAddon && !hasAddonAccess;

  const isLocked = isExpired || needsTierUpgrade || needsAddon;

  if (!isLocked) {
    return <>{children}</>;
  }

  // --- Dynamic UI Configuration based on the Lock Reason ---
  let lockConfig = {
    title: 'Access Restricted',
    desc: 'You do not have access to this feature.',
    ctaText: 'View Plans',
    icon: <Lock className="w-8 h-8 text-orange-600" />,
    action: () => navigate('/upgrade')
  };

  if (isExpired) {
    lockConfig = {
      title: 'Subscription Expired',
      desc: `Your plan has expired. Renew to restore access to ${featureName}.`,
      ctaText: 'Renew Plan',
      icon: <RefreshCw className="w-8 h-8 text-orange-600 animate-spin-slow" />,
      action: () => navigate('/upgrade')
    };
  } else if (needsAddon) {
    lockConfig = {
      title: 'Module Required',
      desc: `The ${featureName} requires the dedicated add-on module.`,
      ctaText: 'Add to Plan',
      icon: <PlusCircle className="w-8 h-8 text-orange-600" />,
      action: () => navigate('/upgrade?addon=menu') // Deep linking for efficiency
    };
  } else if (needsTierUpgrade) {
    lockConfig = {
      title: 'Pro Feature',
      desc: `Upgrade your terminal to unlock ${featureName} and advanced analytics.`,
      ctaText: 'Upgrade to Pro',
      icon: <Zap className="w-8 h-8 text-orange-600" />,
      action: () => navigate('/upgrade')
    };
  }

  return (
    // HEURISTIC: Beautiful and Simple Design
    // We wrap the children in a relative container.
    <div className="relative group overflow-hidden rounded-[2rem] min-h-[300px] border border-transparent dark:border-zinc-800/50">
      
      {/* 1. The Teaser Layer: Reduced opacity and grayscale so they can see what they are missing */}
      <div className="blur-md select-none filter grayscale-[0.8] opacity-30 dark:opacity-20 transition-all duration-700 pointer-events-none">
        {children}
      </div>

      {/* 2. The Interactive Overlay: Frosted Glass */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-white/40 dark:bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-500">
        
        {/* HEURISTIC: Match System to Real World (Clear, physical-looking card) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-center max-w-sm w-full relative overflow-hidden">
          
          <div className="bg-orange-50 dark:bg-orange-900/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-orange-200 dark:border-orange-800/30">
            {lockConfig.icon}
          </div>
          
          <div className="space-y-2 mb-8 relative z-10">
            <h3 className="text-zinc-950 dark:text-white font-black uppercase italic tracking-tighter text-2xl leading-tight">
              {lockConfig.title}
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
              {lockConfig.desc}
            </p>
          </div>

          <Button 
            className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-600/20 active:scale-95 transition-all flex items-center justify-center" 
            onClick={lockConfig.action}
          >
            {lockConfig.ctaText}
          </Button>

          <p className="mt-5 text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
            Instant Activation via M-Pesa
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionShield;
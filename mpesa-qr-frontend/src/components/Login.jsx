import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // <-- ADD useLocation here
import Button from './ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import Input from './ui/Input';
import Label from './ui/Label';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  QrCode,
  Loader2,
  Zap
} from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { API_BASE_URL } from '../utility/constants';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  // 1. Get the routing location object
  const location = useLocation();
  
  // 2. Check if the dashboard sent us the "manualInteractionRequired" flag
  const isManualLogout = location.state?.manualInteractionRequired || false;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // 3. Initialize isAutoLoggingIn based on the flag! 
  // If they just logged out, this starts as FALSE.
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(!isManualLogout); 
  
  // Ref to prevent double-firing in React 18 Strict Mode
  const hasAttemptedAutoLogin = useRef(false);

  const { setMerchantData } = useAuth();
  const navigate = useNavigate();

  // --- THE TRIGGER: Fire immediately on page load ---
  useEffect(() => {
    // 4. ONLY fire the auto-login if they didn't just log out
    if (!hasAttemptedAutoLogin.current && !isManualLogout) {
      hasAttemptedAutoLogin.current = true;
      handleDemoLogin();
    }
  }, []);

  const handleDemoLogin = () => {
    // Fallback to hardcoded credentials if .env is missing
    // Note: If using Vite, this usually needs to be import.meta.env.VITE_FREE_TRAIL_EMAIL
    const DEMO_EMAIL = process.env.Free_Trail_Email || 'admin@cloudora.com';
    const DEMO_PASSWORD = process.env.Free_Trail_Password || '12345678';

    console.log('🚀 Initiating demo login with credentials:', DEMO_EMAIL);
    
    // Visually fill the inputs for the user so they see what happened if it falls back
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    
    // Execute the login bypass
    executeAuth(DEMO_EMAIL, DEMO_PASSWORD);
  };

  const executeAuth = async (authEmail, authPassword) => {
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, authEmail, authPassword);
      const user = userCredential.user;
      const idToken = await user.getIdToken();
      
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-token`, {
        idToken: idToken
      }, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        timeout: 10000 
      });

      if (response.data.success) {
        localStorage.setItem('authToken', idToken);
        setMerchantData(response.data.user);
        // App.js routing will naturally take over and push them to the dashboard
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      let errorMessage = 'Login failed. Please try again.';
      
      if (err.code === 'auth/user-not-found') errorMessage = 'No demo account found. Please check Firebase.';
      else if (err.code === 'auth/wrong-password') errorMessage = 'Incorrect demo password.';
      else if (err.code === 'auth/invalid-email') errorMessage = 'Invalid demo email format.';
      else if (err.response?.data?.error) errorMessage = err.response.data.error;
      
      setError(errorMessage);
      setIsAutoLoggingIn(false); // Drop the loading screen, show the manual form
    } finally {
      setLoading(false);
    }
  };

  const handleManualLogin = (e) => {
    e.preventDefault();
    executeAuth(email, password);
  };

  // --- UI: AUTOMATIC LOGIN STATE ---
  if (isAutoLoggingIn) {
    return (
      <div className="min-h-screen bg-brand-light dark:bg-brand-black flex flex-col items-center justify-center p-4 transition-colors duration-500 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-brand-orange/10 p-6 rounded-[2.5rem] mb-8 relative border border-brand-orange/20">
          <QrCode className="w-12 h-12 text-brand-orange relative z-10" />
          <div className="absolute inset-0 border-2 border-brand-orange/30 rounded-[2.5rem] animate-ping opacity-20" />
        </div>
        
        <h1 className="text-3xl font-black text-content-main dark:text-content-mainDark mb-2 uppercase tracking-tighter italic">
          Merchant<span className="text-brand-orange">Pro</span>
        </h1>
        
        <div className="flex items-center gap-3 mt-6 bg-brand-surface dark:bg-brand-gray px-6 py-3 rounded-2xl border border-brand-borderLight dark:border-brand-borderDark shadow-lg">
          <Loader2 className="w-5 h-5 text-brand-orange animate-spin" />
          <p className="text-content-muted dark:text-content-mutedDark text-xs font-black uppercase tracking-[0.2em]">
            Provisioning Demo Dashboard...
          </p>
        </div>
      </div>
    );
  }

  // --- UI: FALLBACK MANUAL STATE ---
  return (
    <div className="min-h-screen bg-brand-light dark:bg-brand-black flex items-center justify-center p-4 transition-colors duration-500">
      <div className="w-full max-w-lg space-y-8 animate-in slide-in-from-bottom-8">
        
        <div className="text-center space-y-4">
          <div className="bg-brand-orange p-4 rounded-3xl w-fit mx-auto shadow-2xl shadow-brand-orange/20">
            <Zap className="w-10 h-10 text-white fill-current" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-content-main dark:text-content-mainDark mb-1 uppercase tracking-tighter">
              Connection <span className="text-brand-orange">Failed</span>
            </h1>
            <p className="text-sm font-bold text-content-muted dark:text-content-mutedDark uppercase tracking-widest">
              Manual Override Required
            </p>
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-brand-surface dark:bg-brand-gray rounded-[2rem] overflow-hidden">
          <CardHeader className="space-y-1 pb-6 pt-8 text-center">
            <CardTitle className="text-2xl font-black text-content-main dark:text-content-mainDark">Auto-Login Interrupted</CardTitle>
            <CardDescription className="text-content-muted dark:text-content-mutedDark font-medium">
              We couldn't connect you automatically.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pb-10">
            {error && (
              <div className="bg-status-errorBg border-l-4 border-status-error rounded-r-xl p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0" />
                  <p className="text-status-error text-sm font-bold">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleManualLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-content-main dark:text-content-mainDark font-bold ml-1 text-xs uppercase tracking-wider">
                  Demo Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="rounded-2xl border-brand-borderLight dark:border-brand-borderDark bg-brand-light dark:bg-brand-black text-content-main dark:text-content-mainDark focus:border-brand-orange h-14"
                  icon={Mail}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-content-main dark:text-content-mainDark font-bold ml-1 text-xs uppercase tracking-wider">
                  Demo Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="rounded-2xl border-brand-borderLight dark:border-brand-borderDark bg-brand-light dark:bg-brand-black text-content-main dark:text-content-mainDark focus:border-brand-orange h-14 pr-12"
                    icon={Lock}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-content-muted hover:text-brand-orange transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-14 bg-brand-orange hover:bg-brand-orangeHover active:scale-95 rounded-2xl font-black text-white shadow-xl shadow-brand-orange/20 transition-all text-sm uppercase tracking-tight"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Retry Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
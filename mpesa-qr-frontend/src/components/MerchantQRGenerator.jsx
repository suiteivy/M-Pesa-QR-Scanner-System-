import React, { useState, useEffect,useRef} from 'react';
import { useNavigate } from 'react-router-dom';

import QRCode from 'qrcode';
import axios from 'axios';
import {
  Download,
  Share2,
  AlertCircle,
  ArrowUpRight,
  ArrowLeft,
  CheckCircle,
  Clock,
  Loader2,
  Zap,
  QrCode
} from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { useAuth } from '../hooks/useAuth';
import SubscriptionShield from '../hooks/SubscriptionShield';
import { API_BASE_URL } from '../utility/constants';

const MerchantQRGenerator = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, merchantData, logout } = useAuth();
  const [merchant, setMerchant] = useState(merchantData);
  const navigate = useNavigate();

  const generateQRData = async () => {
    if (!user) {
      setError("Authentication required. Please log in.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Get Fresh Token
      const token = await user.getIdToken();

      // 2. Call Backend to verify merchant status and log request
      const response = await axios.post(
        `${API_BASE_URL}/api/daraja/generate-qr`,
        { amount: "0", size: "300" },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      if (response.data.success) {
        // --- TEST ENVIRONMENT LOGIC (OPTION A: Terminal URL) ---
        // This links to your hosted PayPrompt page which handles the STK trigger.
        // We use window.location.origin to adapt to localhost or production URLs.
        const terminalUrl = `${window.location.origin}/pay?uid=${merchantData.uid}&name=${encodeURIComponent(merchantData.name)}&shortcode=${merchantData.shortcode}`;

        /* // --- PRODUCTION LOGIC (OPTION B: Direct M-Pesa Data) ---
        // Use this only if you want to bypass your web UI and open M-Pesa directly.
        // const qrRawData = response.data.data.qrCode; 
        */

        // 3. Render the QR Image
        const qrImageUrl = await QRCode.toDataURL(terminalUrl, {
          width: 600,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' },
          errorCorrectionLevel: 'H'
        });

        setQrCodeUrl(qrImageUrl);
        setSuccess(`Terminal asset provisioned for ${merchantData.name}`);
      }
    } catch (err) {
      console.error('QR Generation Error:', err);
      setError(err.response?.data?.message || 'Synchronization failed. Verify server status.');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    const cleanName = (merchantData?.name || 'Merchant').replace(/\s+/g, '_');
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${cleanName}_Terminal_Asset.png`;
    link.click();
    setSuccess('Asset exported to local storage.');
  };

  const shareQRCode = async () => {
    if (!qrCodeUrl) return;
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const file = new File([blob], 'Payment_Asset.png', { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          title: `Merchant Payment Asset: ${merchantData?.name}`,
          files: [file],
        });
      } else {
        await navigator.clipboard.writeText(window.location.origin + `/pay?uid=${merchantData.uid}`);
        setSuccess('Payment link copied to clipboard.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') setError('Distribution failed.');
    }
  };
// 1. Create the reference
  const qrResultRef = useRef(null);

  // 2. Watch for the QR code to appear and scroll to it
  useEffect(() => {
    if (qrCodeUrl && qrResultRef.current) {
      // Small timeout ensures the DOM has painted the new element before scrolling
      setTimeout(() => {
        qrResultRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' // Centers the QR code perfectly on the screen
        });
      }, 100);
    }
  }, [qrCodeUrl]);


return (
 <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 lg:p-12 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">

        {/* --- HEURISTIC: User Control & Freedom (Emergency Exit) --- */}
        <button 
          onClick={() => navigate(-1)} // Alternatively: navigate('/dashboard') to be strictly safe
          className="group flex items-center gap-3 text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors w-fit -mt-2 md:-mt-4"
        >
          <div className="bg-zinc-200/50 dark:bg-zinc-800/50 p-2 rounded-xl group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">
            Back
          </span>
        </button>

        {/* --- HEURISTIC: Match System to Real World (No Jargon) --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="bg-orange-600 p-2 rounded-xl text-white shadow-sm">
                <QrCode className="w-5 h-5" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-orange-600">
                Payment Setup
              </h2>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-zinc-950 dark:text-white uppercase tracking-tighter leading-none">
              Generate <span className="text-zinc-400 dark:text-zinc-600">QR Code</span>
            </h1>
          </div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest md:text-right max-w-[250px]">
            Create a scannable M-Pesa code for {merchant?.name || 'your store'}.
          </p>
        </div>

        <SubscriptionShield requiredTier="CORE" featureName="QR Generation">

          {/* --- HEURISTIC: Visibility of System Status (Alerts at the top, where the eye is) --- */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 text-red-700 dark:text-red-400 rounded-r-xl flex items-center gap-3 font-bold text-sm animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0" /> {error}
            </div>
          )}

          {success && !error && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400 rounded-r-xl flex items-center gap-3 font-bold text-sm animate-in slide-in-from-top-2">
              <CheckCircle className="w-5 h-5 shrink-0" /> {success}
            </div>
          )}

          {/* --- GENERATOR CARD --- */}
          <div className="relative overflow-hidden bg-white dark:bg-brand-gray border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-lg p-6 md:p-10">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Store Profile</p>
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-zinc-950 dark:text-white">
                    {merchant?.name || 'Loading Profile...'}
                  </h2>
                </div>
                
                {/* HEURISTIC: Recognition (Confirming the exact details before generation) */}
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 px-3 py-1 font-mono text-xs">
                    Shortcode: {merchant?.shortcode || 'N/A'}
                  </Badge>
                  <Badge className="bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/30 px-3 py-1 uppercase text-[10px] font-black">
                    {merchant?.accountType || 'PAYBILL'}
                  </Badge>
                </div>
              </div>

              {/* HEURISTIC: Clear, actionable button text */}
              <Button
                onClick={generateQRData}
                disabled={loading}
                className="h-14 md:h-16 px-8 w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm shadow-md disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5 mr-3" />
                    Generate QR
                  </>
                )}
              </Button>
            </div>
            
            {/* Subtle decorative watermark */}
            <QrCode className="absolute -right-8 -bottom-8 h-48 w-48 text-zinc-950/5 dark:text-white/5 -rotate-12 pointer-events-none" />
          </div>

          {/* --- QR RESULT --- */}
      {/* --- QR RESULT --- */}
          {qrCodeUrl && (
            // ATTACH THE REF HERE
            <div ref={qrResultRef} className="mt-8 animate-in zoom-in-95 duration-500">
              <div className="bg-white dark:bg-brand-gray border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 flex flex-col items-center space-y-8 shadow-sm rounded-3xl">
                
                <div className="text-center">
                  <h3 className="text-2xl font-black text-zinc-950 dark:text-white uppercase tracking-tighter">
                    Your QR Code is Ready
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest mt-2">
                    ID: {merchant?.uid?.slice(-8).toUpperCase()}
                  </p>
                </div>

                {/* HEURISTIC: Error Prevention (Strictly white background for scanner compatibility) */}
                <div className="p-6 bg-white rounded-3xl shadow-inner border-2 border-zinc-100">
                  <img src={qrCodeUrl} alt="Store QR Code" className="w-56 h-56 md:w-72 md:h-72 object-contain" />
                </div>

                {/* HEURISTIC: Efficiency of Use (Clear export actions) */}
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                  <Button 
                    onClick={downloadQRCode} 
                    variant="outline" 
                    className="flex-1 h-14 rounded-xl gap-2 font-bold uppercase tracking-widest text-xs border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <Download className="w-4 h-4 text-orange-600" /> Save Image
                  </Button>
                  <Button 
                    onClick={shareQRCode} 
                    variant="outline" 
                    className="flex-1 h-14 rounded-xl gap-2 font-bold uppercase tracking-widest text-xs border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-orange-600" /> Share Link
                  </Button>
                </div>

              </div>
            </div>
          )}

        </SubscriptionShield>
      </div>
    </div>
  );
};

export default MerchantQRGenerator;
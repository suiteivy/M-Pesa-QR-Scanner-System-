import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  QrCode, AlertCircle, Camera, CameraOff, 
  RefreshCw, Smartphone, Phone, DollarSign, 
  Zap, ArrowLeft, CheckCircle 
} from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { Label } from './ui/Label';
import { API_BASE_URL } from '../utility/constants';
const PublicQRScanner = () => {
const [scanning, setScanning] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  // 1. DEFINE SUCCESS CALLBACK FIRST (Stable Siphon)
  const onScanSuccess = (decodedText) => {
    console.log("Provisioning Asset Detected:", decodedText);
    
    // Stop the hardware immediately
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().then(() => setScanning(false));
    }

    if (decodedText.startsWith('http')) {
      try {
        const url = new URL(decodedText);
        if (url.hostname === window.location.hostname) {
          const params = Object.fromEntries(url.searchParams);
          setQrData(params);
          if (params.amount) setAmount(params.amount);
        } else {
          window.location.href = decodedText;
        }
        return;
      } catch (e) { console.error('URL parse error'); }
    }

    try {
      const parsedData = JSON.parse(decodedText);
      setQrData(parsedData);
      if (parsedData.amount) setAmount(parsedData.amount.toString());
    } catch (err) {
      setError('Invalid Merchant Identity Asset.');
    }
  };

  // 2. DEFINE INITIALIZATION SECOND
  const startScanner = async () => {
    setError('');
    setScanning(true);

    // Buffer to ensure the DOM div #qr-reader is painted
    setTimeout(async () => {
      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode('qr-reader');
        }

        await scannerRef.current.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          onScanSuccess, // Now it's defined and ready
          () => {} // Silent failure for "no QR in frame"
        );
      } catch (err) {
        console.error("Scanner start error:", err);
        setError("Optical hardware failed to initialize.");
        setScanning(false);
      }
    }, 150); 
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    setScanning(false);
  };

  // ... onScanSuccess and processPayment logic remain the same

return (
  <div className="min-h-screen bg-white dark:bg-brand-black flex items-center justify-center p-6 transition-colors duration-500 relative">
    
    {/* --- ABSOLUTE BACK ACTION --- */}
    <button 
      onClick={() => navigate(-1)} // Siphons previous route from history
      className="absolute top-8 left-8 flex items-center gap-2 group"
    >
      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-brand-gray flex items-center justify-center border border-zinc-200 dark:border-brand-gray/50 group-hover:border-brand-orange transition-all duration-300">
        <ArrowLeft className="w-5 h-5 text-zinc-500 group-hover:text-brand-orange" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-brand-orange transition-colors hidden sm:block italic">
        Back
      </span>
    </button>

    <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* --- BRANDED HEADER --- */}
      <div className="text-center space-y-3">
        <div className="!bg-brand-orange p-3 rounded-[1.5rem] w-fit mx-auto shadow-2xl shadow-brand-orange/30">
          <QrCode className="w-8 h-8 text-brand-black" />
        </div>
        <h1 className="text-4xl font-black text-brand-black dark:text-white italic uppercase tracking-tighter leading-none">
          Terminal <span className="!text-brand-orange">Scan</span>
        </h1>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] italic">
          Provisioning Interface
        </p>
      </div>

      <Card className="bg-zinc-50 dark:bg-brand-gray border-2 border-zinc-100 dark:border-brand-gray/50 shadow-2xl rounded-[3.5rem] overflow-hidden">
        <CardContent className="p-8 space-y-8">
          
          {!qrData ? (
            <div className="space-y-6">
              {/* --- PERSISTENT SCANNER CONTAINER --- */}
              <div 
                className={`relative bg-brand-black rounded-[2.5rem] overflow-hidden border-2 border-brand-gray/50 transition-all duration-500 ${
                  scanning ? 'h-[300px]' : 'h-64'
                }`}
              >
                <div id="qr-reader" className="w-full h-full" />

                {!scanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 opacity-40 pointer-events-none">
                    <Camera className="w-16 h-16 mb-4 text-white" />
                    <p className="text-white text-[10px] font-black uppercase tracking-widest text-center">
                      Optics Ready <br/> Click Initialize
                    </p>
                  </div>
                )}
                
                {scanning && (
                  <div className="absolute inset-0 z-10 border-[20px] border-transparent pointer-events-none rounded-[2.5rem] ring-4 ring-brand-orange/20 animate-pulse" />
                )}
              </div>

              <Button
                onClick={scanning ? stopScanner : startScanner}
                className={`w-full h-20 rounded-[2rem] font-black uppercase tracking-[0.2em] italic transition-all ${
                  scanning ? 'bg-zinc-800 text-white' : '!bg-brand-orange text-brand-black shadow-xl shadow-brand-orange/20'
                }`}
              >
                {scanning ? <><CameraOff className="mr-2" /> Stop</> : <><Camera className="mr-2" /> Initialize</>}
              </Button>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               {/* Siphoned Merchant Card, Inputs, and Confirm Button code block */}
               <div className="flex flex-col gap-4">
                  {/* ... form content ... */}
                  <button 
                    onClick={() => setQrData(null)}
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic hover:text-brand-orange transition-colors"
                  >
                    Clear Siphoned Data
                  </button>
               </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  </div>
);  
};

export default PublicQRScanner;
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle, Smartphone, Loader2, Zap, DollarSign, ShieldAlert, Info } from 'lucide-react';
import { API_BASE_URL } from '../utility/constants';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const PayPrompt = () => {
  const query = useQuery();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // 1. DATA SIPHONING
  const qrData = useMemo(() => {
    const data = {};
    for (const [key, value] of query.entries()) {
      data[key] = value;
    }
    return data;
  }, [query]);

  // --- CRITICAL GUARD: MERCHANT ID CHECK ---
  const merchantUid = qrData.uid || qrData.merchantId;

  // 2. DYNAMIC VS FIXED LOGIC
  const isDynamic = useMemo(() => {
    return qrData.dynamicAmount === 'true' || !qrData.amount || qrData.amount === '0';
  }, [qrData]);

  // 3. SYNC FIXED AMOUNT
  useEffect(() => {
    if (!isDynamic && qrData.amount) {
      setAmount(qrData.amount);
    }
  }, [isDynamic, qrData.amount]);

  // --- HCI: Error Prevention (Phone Number Formatting) ---
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // Strip all non-digits
    if (val.length <= 12) setPhoneNumber(val);
  };

  // --- 4. ERROR STATE: MISSING MERCHANT (Help Users Recognize Errors) ---
  if (!merchantUid) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center p-6 text-center animate-in fade-in">
        <div className="space-y-6 max-w-sm bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] shadow-2xl">
          <div className="bg-red-500/10 p-5 rounded-3xl mx-auto w-fit border border-red-500/20">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Invalid Code</h2>
            <p className="text-zinc-400 text-sm font-medium leading-relaxed">This payment link is missing merchant details. Please ask the store to generate a new QR code.</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white h-14 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors"
          >
            Retry Scan
          </button>
        </div>
      </div>
    );
  }

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount.');
      setLoading(false);
      return;
    }

    // --- PHONE SANITIZER ---
    let finalPhone = phoneNumber;
    if (finalPhone.startsWith('0')) finalPhone = `254${finalPhone.slice(1)}`;
    else if (finalPhone.startsWith('7') || finalPhone.startsWith('1')) finalPhone = `254${finalPhone}`;

    if (finalPhone.length !== 12) {
      setError('Invalid M-Pesa number. Must be 10 digits (e.g., 0712...).');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/daraja/customer-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          phoneNumber: finalPhone,
          amount: parseFloat(amount),
          merchantId: merchantUid,
          reference: qrData.reference || 'WEB_PAY',
          name: qrData.name || 'Merchant Payment'
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setSuccess('Check your phone to enter your M-Pesa PIN.');
      } else {
        setError(result.error || result.message || 'Payment request failed.');
      }
    } catch (err) {
      setError('Network failure. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualPay = () => {
    const link = `mpesa://paybill?business=${qrData.shortcode || '174379'}&amount=${amount}&account=${qrData.reference || 'PAY'}`;
    window.location.href = link;
  };

  return (
    // Replaced pure black with zinc-950/90 for a softer OLED backdrop
    <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 sm:p-10 rounded-[3rem] shadow-2xl w-full max-w-md relative overflow-hidden">
        
        {/* Subtle decorative element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        {/* --- HEURISTIC: Match System to Real World (Clear Identity) --- */}
        <div className="text-center space-y-3 mb-8 relative z-10">
          <div className="bg-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-orange-600/20">
            <Smartphone className="text-white w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Paying Merchant</p>
            <h2 className="text-3xl font-black text-zinc-950 dark:text-white uppercase tracking-tighter leading-none line-clamp-2">
              {qrData.name || 'Store Checkout'}
            </h2>
          </div>
        </div>

        <form onSubmit={handlePay} className="space-y-6 relative z-10">
          
          {/* Amount Display/Input Box */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] text-center relative overflow-hidden group">
            <label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest block mb-2">Payment Amount</label>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-black text-zinc-400">KES</span>
              {isDynamic ? (
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                  className="w-full bg-transparent border-none text-4xl sm:text-5xl font-black text-zinc-950 dark:text-white focus:ring-0 text-center placeholder:text-zinc-300 dark:placeholder:text-zinc-700 tracking-tighter outline-none p-0"
                  required
                />
              ) : (
                <div className="text-4xl sm:text-5xl font-black text-zinc-950 dark:text-white tracking-tighter">
                  {Number(amount).toLocaleString()}
                </div>
              )}
            </div>
            {isDynamic && (
              <div className="absolute top-4 right-4 text-orange-600">
                <Info className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* M-Pesa Number Input */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-zinc-500 ml-4 tracking-widest">Your M-Pesa Number</label>
            <div className="relative">
               {/* HEURISTIC: Affordance (Visual clue on how to format) */}
              <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-zinc-400">+254</span>
              <input
                type="tel"
                placeholder="7XX XXX XXX"
                value={phoneNumber.startsWith('254') ? phoneNumber.slice(3) : phoneNumber.startsWith('0') ? phoneNumber.slice(1) : phoneNumber}
                onChange={handlePhoneChange}
                disabled={loading}
                className="h-16 w-full pl-20 pr-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xl font-black text-zinc-950 dark:text-white focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* HEURISTIC: Visibility of System Status (Alerts right above the button) */}
          {(error || success) && (
            <div className={`p-4 rounded-2xl flex items-start gap-3 animate-in fade-in zoom-in-95 ${
              error ? 'bg-red-50 dark:bg-red-900/10 text-red-600 border border-red-200 dark:border-red-800/30' : 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 border border-emerald-200 dark:border-emerald-800/30'
            }`}>
              {error ? <AlertCircle className="shrink-0 w-5 h-5 mt-0.5" /> : <CheckCircle className="shrink-0 w-5 h-5 mt-0.5" />}
              <p className="text-[11px] font-bold uppercase tracking-wide leading-snug">{error || success}</p>
            </div>
          )}

          <div className="pt-2 space-y-4">
            {/* HEURISTIC: Prevent Errors (Button locked until inputs filled) */}
            <button
              type="submit"
              disabled={loading || !phoneNumber || (isDynamic && !amount)}
              className="w-full h-16 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-white disabled:text-zinc-400 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-600/20 disabled:shadow-none active:scale-95 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" /> Processing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" /> Send Payment Prompt
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleManualPay}
              className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-center"
            >
              Manual Pay via App instead
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default PayPrompt;
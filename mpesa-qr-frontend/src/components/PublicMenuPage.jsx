import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../utility/constants';
import MenuView from '../components/MenuView';
import { Utensils, AlertCircle, X, Smartphone, Loader2, Info,Zap,Lock} from 'lucide-react';

const PublicMenuPage = () => {
    const { merchantId } = useParams();
    const [menuData, setMenuData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Payment State
    const [selectedItem, setSelectedItem] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState({ type: '', msg: '' });

    useEffect(() => {
        const fetchPublicMenu = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_BASE_URL}/api/menu/${merchantId}`, {
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                });
                if (response.data.success) setMenuData(response.data.menu);
                else setError("This menu is currently empty.");
            } catch (err) {
                setError("Could not load the menu. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        if (merchantId) fetchPublicMenu();
    }, [merchantId]);

    // HEURISTIC: Error Prevention (Force numbers only)
    const handlePhoneChange = (e) => {
        const val = e.target.value.replace(/\D/g, ''); // Strip all non-digits
        if (val.length <= 12) setPhoneNumber(val);
    };

    const handleProcessPayment = async () => {
        if (!phoneNumber || phoneNumber.length < 9) {
            setPaymentStatus({ type: 'error', msg: 'Please enter a valid M-Pesa number.' });
            return;
        }

        setIsProcessing(true);
        setPaymentStatus({ type: '', msg: '' });

        try {
            const response = await axios.post(`${API_BASE_URL}/api/daraja/customer-payment`, {
                phoneNumber: phoneNumber.startsWith('0') ? `254${phoneNumber.slice(1)}` : phoneNumber,
                amount: selectedItem.price,
                merchantId: merchantId,
                name: selectedItem.name, 
                reference: `MNU-${selectedItem.id?.slice(-4) || 'ORDER'}`
            }, {
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });

            if (response.data.success) {
                setPaymentStatus({
                    type: 'success',
                    msg: `Request sent. Enter your M-Pesa PIN on your phone.`
                });
                // UX: Clear form so they don't accidentally double-pay
                setTimeout(() => {
                    setSelectedItem(null);
                    setPhoneNumber('');
                    setPaymentStatus({ type: '', msg: '' });
                }, 4000);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Payment request failed. Try again.';
            setPaymentStatus({ type: 'error', msg: errorMsg });
        } finally {
            setIsProcessing(false);
        }
    };

    // HEURISTIC: Visibility of System Status (On-brand loading)
    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            <div className="bg-orange-600/10 p-4 rounded-2xl mb-4">
                <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-widest text-xs">Syncing Menu...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 relative selection:bg-orange-600/30 font-sans transition-colors duration-300">

            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 px-6 py-12 shadow-sm border-b border-zinc-200 dark:border-zinc-800 text-center relative overflow-hidden">
                <div className="relative z-10">
                    <div className="bg-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-600/20 animate-in zoom-in-75 duration-500">
                        <Utensils className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-zinc-950 dark:text-white tracking-tighter uppercase italic leading-none">
                        Digital <span className="text-orange-600">Menu</span>
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mt-3">
                        Tap to order & pay instantly
                    </p>
                </div>
                {/* Decorative background element */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-lg bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
            </div>

            <div className="max-w-3xl mx-auto p-4 md:p-6 mt-4">
                {error ? (
                    // HEURISTIC: Error Diagnosis
                    <div className="bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] p-10 text-center border border-zinc-200 dark:border-zinc-800">
                        <Info className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-2">Menu Unavailable</h3>
                        <p className="text-sm font-medium text-zinc-500">{error}</p>
                    </div>
                ) : (
                    <MenuView
                        items={menuData}
                        onItemClick={(item) => item.isAvailable && setSelectedItem(item)}
                    />
                )}
            </div>

            {/* --- REBRANDED PAYMENT MODAL --- */}
            {selectedItem && (
                <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
                    
                    {/* HEURISTIC: User Control & Freedom (Clicking backdrop closes modal) */}
                    <div className="absolute inset-0" onClick={() => !isProcessing && setSelectedItem(null)} />

                    {/* Modal Card */}
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-md sm:rounded-[2.5rem] rounded-t-[2.5rem] rounded-b-none p-6 sm:p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 relative z-10 animate-in slide-in-from-bottom-8 duration-300">
                        
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Confirm Order</p>
                                <h3 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight leading-none">{selectedItem.name}</h3>
                                <p className="text-zinc-900 dark:text-zinc-100 font-black text-2xl mt-2 italic tracking-tighter">
                                    KES {Number(selectedItem.price).toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedItem(null)}
                                disabled={isProcessing}
                                className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-zinc-500 dark:text-zinc-400 ml-1 tracking-widest">
                                    M-Pesa Number
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-zinc-400">+254</span>
                                    <input
                                        type="tel"
                                        placeholder="7XX XXX XXX"
                                        value={phoneNumber.startsWith('254') ? phoneNumber.slice(3) : phoneNumber.startsWith('0') ? phoneNumber.slice(1) : phoneNumber}
                                        onChange={handlePhoneChange}
                                        disabled={isProcessing}
                                        className="w-full py-4 pl-16 pr-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-950 dark:text-white font-black text-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700 disabled:opacity-70"
                                    />
                                </div>
                            </div>

                            {paymentStatus.msg && (
                                <div className={`p-4 rounded-2xl text-[11px] font-bold uppercase tracking-wider flex items-start gap-3 animate-in fade-in zoom-in-95 ${
                                    paymentStatus.type === 'success'
                                        ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30'
                                        : 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30'
                                }`}>
                                    {paymentStatus.type === 'success' ? <Smartphone className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                                    <p className="leading-snug">{paymentStatus.msg}</p>
                                </div>
                            )}

                            {/* HEURISTIC: Clear visibility of system status on button */}
                            <button
                                onClick={handleProcessPayment}
                                disabled={isProcessing || !phoneNumber}
                                className={`w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 text-sm ${
                                    isProcessing || !phoneNumber
                                        ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed border border-zinc-300 dark:border-zinc-700'
                                        : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 active:scale-95'
                                }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-5 h-5 fill-current" />
                                        Pay Now
                                    </>
                                )}
                            </button>
                        </div>

                        <p className="text-center text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-6 flex items-center justify-center gap-1.5">
                            <Lock className="w-3 h-3" /> Secure Safaricom Checkout
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicMenuPage;
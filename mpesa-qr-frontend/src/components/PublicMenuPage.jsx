import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { API_BASE_URL } from '../utility/constants';
import { db } from '../firebase';
import MenuView from '../components/MenuView';
import { DEMO_MENU_ITEMS } from '../utility/demoData';
import {
  Utensils, AlertCircle, X, Smartphone, Loader2, Info,
  Lock, ShoppingCart, Plus, Minus, Trash2, ChevronRight, CheckCircle2, Zap
} from 'lucide-react';

const PublicMenuPage = () => {
  const { merchantId } = useParams();
  const [searchParams] = useSearchParams();
  const isDemoMenu = searchParams.get('demo') === 'true';
  const isPreviewMenu = searchParams.get('preview') === 'true';
  const demoItems = searchParams.get('items');
  const compactDemoItems = searchParams.get('m');

  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Cart State ───────────────────────────────────────────────────────────
  const [cart, setCart] = useState([]); // [{ item, qty }]
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // ─── Checkout State ───────────────────────────────────────────────────────
  const [phoneNumber, setPhoneNumber] = useState('');
  const [tableNo, setTableNo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({ type: '', msg: '' });
  const [orderSuccess, setOrderSuccess] = useState(false);

  // ─── Load Menu ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchPublicMenu = async () => {
      setLoading(true);
      setError(null);

      // 1. If compact or query param demo items are passed in URL
      if (compactDemoItems || demoItems) {
        try {
          const parsedItems = JSON.parse(compactDemoItems || demoItems || 'null');
          if (Array.isArray(parsedItems) && parsedItems.length > 0) {
            setMenuData(parsedItems.map((item) => {
              if (!Array.isArray(item)) return { ...item, isAvailable: item.isAvailable !== false };
              const [name, price, category, isAvailable = true, description = '', imageUrl = ''] = item;
              return { name, price, category, isAvailable, description, imageUrl };
            }));
            setLoading(false);
            return;
          }
        } catch {
          console.warn('Could not parse URL menu items, attempting fallback.');
        }
      }

      // 2. If trial preview or demo-merchant, load trial items from localStorage first
      if (isDemoMenu || isPreviewMenu || merchantId === 'demo-merchant' || !merchantId) {
        try {
          const localItems = JSON.parse(localStorage.getItem('trial_menu_items') || 'null');
          if (Array.isArray(localItems) && localItems.length > 0) {
            setMenuData(localItems.map(item => ({ ...item, isAvailable: item.isAvailable !== false })));
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Could not load trial_menu_items from localStorage:', e);
        }
        // Fall back to default demo items if no trial menu is saved
        setMenuData(DEMO_MENU_ITEMS.map(item => ({ ...item, isAvailable: item.isAvailable !== false })));
        setLoading(false);
        return;
      }

      // 3. Real merchant Firestore fetch
      try {
        const menuRef = collection(db, 'merchants', merchantId, 'menu');
        const menuSnapshot = await getDocs(menuRef);
        if (menuSnapshot.empty) {
          // If Firestore is empty, check localStorage trial items before showing error
          const localItems = JSON.parse(localStorage.getItem('trial_menu_items') || 'null');
          if (Array.isArray(localItems) && localItems.length > 0) {
            setMenuData(localItems.map(item => ({ ...item, isAvailable: item.isAvailable !== false })));
          } else {
            setError('This menu is currently empty.');
          }
        } else {
          setMenuData(menuSnapshot.docs.map((menuDoc) => ({
            id: menuDoc.id,
            isAvailable: true,
            ...menuDoc.data(),
          })));
        }
      } catch (err) {
        console.error('Public menu Firestore read error:', err);
        // Fallback for trial / demo testing
        const localItems = JSON.parse(localStorage.getItem('trial_menu_items') || 'null');
        if (Array.isArray(localItems) && localItems.length > 0) {
          setMenuData(localItems.map(item => ({ ...item, isAvailable: item.isAvailable !== false })));
        } else {
          setMenuData(DEMO_MENU_ITEMS.map(item => ({ ...item, isAvailable: item.isAvailable !== false })));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPublicMenu();
  }, [merchantId, isDemoMenu, isPreviewMenu, demoItems, compactDemoItems]);

  // ─── Cart Helpers ─────────────────────────────────────────────────────────
  const cartCount = cart.reduce((acc, c) => acc + c.qty, 0);
  const cartTotal = cart.reduce((acc, c) => acc + Number(c.item.price) * c.qty, 0);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.name === item.name);
      if (existing) return prev.map(c => c.item.name === item.name ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { item, qty: 1 }];
    });
  };

  const removeFromCart = (itemName) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.name === itemName);
      if (existing?.qty === 1) return prev.filter(c => c.item.name !== itemName);
      return prev.map(c => c.item.name === itemName ? { ...c, qty: c.qty - 1 } : c);
    });
  };

  const deleteFromCart = (itemName) => setCart(prev => prev.filter(c => c.item.name !== itemName));

  // ─── Phone Input ─────────────────────────────────────────────────────────
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 12) setPhoneNumber(val);
  };

  // ─── Mock M-Pesa Checkout ─────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      setPaymentStatus({ type: 'error', msg: 'Please enter a valid M-Pesa number.' });
      return;
    }
    if (cart.length === 0) {
      setPaymentStatus({ type: 'error', msg: 'Your cart is empty.' });
      return;
    }

    setIsProcessing(true);
    setPaymentStatus({ type: '', msg: '' });

    const formattedPhone = phoneNumber.startsWith('0')
      ? `254${phoneNumber.slice(1)}`
      : phoneNumber.startsWith('254') ? phoneNumber : `254${phoneNumber}`;

    const orderPayload = {
      merchantId: merchantId || 'demo',
      phoneNumber: formattedPhone,
      tableNo: tableNo || 'N/A',
      items: cart.map(c => ({
        name: c.item.name,
        price: Number(c.item.price),
        qty: c.qty,
        subtotal: Number(c.item.price) * c.qty,
      })),
      total: cartTotal,
      status: 'received',
      paymentMethod: 'mpesa',
      transactionRef: 'MP' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    try {
      // ── Mock payment delay (simulates STK push) ──────────────────────────
      await new Promise(res => setTimeout(res, 1800));

      // ── Save order to Firestore (real merchant) ──────────────────────────
      if (merchantId && merchantId !== 'demo-merchant' && !isDemoMenu && !isPreviewMenu) {
        try {
          const ordersRef = collection(db, 'merchants', merchantId, 'orders');
          await addDoc(ordersRef, {
            ...orderPayload,
            status: 'received',
            createdAt: serverTimestamp(),
          });
        } catch (fsErr) {
          console.warn('Firestore order save note:', fsErr);
        }
      }

      // ── Always save order to localStorage for trial dashboard / local tracking ──
      try {
        const savedOrders = JSON.parse(localStorage.getItem('trial_orders') || '[]');
        savedOrders.unshift({ ...orderPayload, id: `order-${Date.now()}`, status: 'received' });
        localStorage.setItem('trial_orders', JSON.stringify(savedOrders.slice(0, 50)));
        window.dispatchEvent(new Event('storage'));
      } catch (lsErr) {
        console.warn('localStorage order save error:', lsErr);
      }

      setPaymentStatus({
        type: 'success',
        msg: `M-Pesa STK sent to +${formattedPhone}. Enter your PIN to confirm.`,
      });

      setTimeout(() => {
        setOrderSuccess(true);
        setCart([]);
        setShowCheckout(false);
        setShowCart(false);
      }, 2000);

    } catch (err) {
      console.error('Order error:', err);
      setPaymentStatus({ type: 'error', msg: 'Could not place order. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Loading UI ────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="bg-orange-600/10 p-4 rounded-2xl mb-4">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
      <p className="text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-widest text-xs">Syncing Menu...</p>
    </div>
  );

  // ─── Order Success Screen ─────────────────────────────────────────────────
  if (orderSuccess) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-center">
      <div className="bg-emerald-500/10 p-6 rounded-3xl mb-6 animate-in zoom-in-75 duration-500">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
      </div>
      <h2 className="text-3xl font-black text-zinc-950 dark:text-white tracking-tighter uppercase italic mb-2">Order Placed!</h2>
      <p className="text-zinc-500 text-sm font-medium mb-6 max-w-xs">Your order has been received. Check your M-Pesa for the payment prompt.</p>
      <button
        onClick={() => setOrderSuccess(false)}
        className="bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest px-8 py-4 rounded-2xl text-sm transition-all active:scale-95"
      >
        Order Again
      </button>
    </div>
  );

  const isInteractive = true;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-32 relative selection:bg-orange-600/30 font-sans transition-colors duration-300">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 px-6 py-12 shadow-sm border-b border-zinc-200 dark:border-zinc-800 text-center relative overflow-hidden">
        <div className="relative z-10">
          <div className="bg-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-600/20 animate-in zoom-in-75 duration-500">
            <Utensils className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-zinc-950 dark:text-white tracking-tighter uppercase italic leading-none">
            Digital <span className="text-orange-600">Menu</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mt-3">
            Add items & pay instantly via M-Pesa
          </p>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-lg bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
      </div>

      {/* ── Menu Items ─────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto p-4 md:p-6 mt-4">
        {error ? (
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] p-10 text-center border border-zinc-200 dark:border-zinc-800">
            <Info className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
            <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-2">Menu Unavailable</h3>
            <p className="text-sm font-medium text-zinc-500">{error}</p>
          </div>
        ) : (
          <MenuView
            items={menuData}
            onItemClick={addToCart}
            onAddToCart={addToCart}
            onRemoveFromCart={removeFromCart}
            cartItems={cart}
            isCartMode={true}
          />
        )}
      </div>

      {/* ── Floating Cart Button ────────────────────────────────────────────── */}
      {isInteractive && cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 animate-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl h-16 flex items-center justify-between px-6 shadow-2xl shadow-orange-600/40 transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl p-2">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span className="font-black uppercase tracking-widest text-sm">View Cart</span>
              <span className="bg-white/20 text-white text-xs font-black px-2.5 py-1 rounded-xl">{cartCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg">KES {cartTotal.toLocaleString()}</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}

      {/* ── Cart Drawer ─────────────────────────────────────────────────────── */}
      {showCart && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => !isProcessing && setShowCart(false)} />
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md sm:rounded-[2.5rem] rounded-t-[2.5rem] rounded-b-none shadow-2xl border border-zinc-200 dark:border-zinc-800 relative z-10 animate-in slide-in-from-bottom-8 duration-300 max-h-[90vh] flex flex-col">

            {/* Cart Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 shrink-0">
              <div>
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Your Order</p>
                <h3 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight">{cartCount} item{cartCount !== 1 ? 's' : ''}</h3>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="overflow-y-auto flex-1 px-6 sm:px-8 space-y-3 pb-4">
              {cart.map(({ item, qty }) => (
                <div key={item.name} className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-zinc-950 dark:text-white text-sm truncate">{item.name}</p>
                    <p className="text-orange-600 font-black text-xs mt-0.5">KES {(Number(item.price) * qty).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => removeFromCart(item.name)} className="w-7 h-7 bg-zinc-200 dark:bg-zinc-700 rounded-lg flex items-center justify-center hover:bg-orange-100 transition-colors">
                      <Minus className="w-3 h-3 text-zinc-700 dark:text-zinc-300" />
                    </button>
                    <span className="font-black text-sm text-zinc-900 dark:text-white w-5 text-center">{qty}</span>
                    <button onClick={() => addToCart(item)} className="w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center hover:bg-orange-700 transition-colors">
                      <Plus className="w-3 h-3 text-white" />
                    </button>
                    <button onClick={() => deleteFromCart(item.name)} className="w-7 h-7 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors ml-1">
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Footer */}
            <div className="p-6 sm:p-8 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4 shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Total</span>
                <span className="text-2xl font-black text-zinc-950 dark:text-white italic tracking-tighter">KES {cartTotal.toLocaleString()}</span>
              </div>
              <button
                onClick={() => { setShowCart(false); setShowCheckout(true); }}
                className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
              >
                <Zap className="w-5 h-5 fill-current" />
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Checkout Modal ───────────────────────────────────────────────────── */}
      {showCheckout && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => !isProcessing && setShowCheckout(false)} />
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md sm:rounded-[2.5rem] rounded-t-[2.5rem] rounded-b-none p-6 sm:p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 relative z-10 animate-in slide-in-from-bottom-8 duration-300">

            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">M-Pesa Checkout</p>
                <h3 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight">Total: KES {cartTotal.toLocaleString()}</h3>
                <p className="text-xs text-zinc-500 font-medium mt-1">{cartCount} item{cartCount !== 1 ? 's' : ''} in cart</p>
              </div>
              <button
                onClick={() => setShowCheckout(false)}
                disabled={isProcessing}
                className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order summary */}
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 mb-5 space-y-1.5 max-h-36 overflow-y-auto">
              {cart.map(({ item, qty }) => (
                <div key={item.name} className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <span>{item.name} × {qty}</span>
                  <span className="text-orange-600">KES {(Number(item.price) * qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {/* Table / Name */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-zinc-500 dark:text-zinc-400 ml-1 tracking-widest">
                  Table / Name (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Table 5 or John"
                  value={tableNo}
                  onChange={(e) => setTableNo(e.target.value)}
                  disabled={isProcessing}
                  className="w-full py-4 px-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-950 dark:text-white font-bold text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-70"
                />
              </div>

              {/* Phone */}
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

              <button
                onClick={handleCheckout}
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
                    Sending STK Push...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-current" />
                    Pay KES {cartTotal.toLocaleString()} Now
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-6 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" /> Secure Safaricom Checkout (Mock)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicMenuPage;
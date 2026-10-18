import React, { useState, useEffect } from 'react';
import { QrCode, Edit3, Eye, Save, Plus, Trash2, Download, Share2, Upload } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import QRCode from 'qrcode';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';

import MenuView from './MenuView';
import SubscriptionShield from '../hooks/SubscriptionShield';
import { FRONTEND_BASE_URL } from '../utility/constants';
import { DEMO_MENU_ITEMS } from '../utility/demoData';
import { auth, db } from '../firebase';

const MAX_MENU_IMAGE_DATA_LENGTH = 350000;
const TRIAL_MENU_KEY = 'trial_menu_items';

const compressMenuImage = async (file) => {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('The selected image could not be read.'));
      image.src = objectUrl;
    });

    let maxDimension = 1200;
    let quality = 0.76;

    while (maxDimension >= 320) {
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image processing is unavailable in this browser.');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL('image/jpeg', quality);
      if (imageData.length <= MAX_MENU_IMAGE_DATA_LENGTH) return imageData;

      maxDimension = Math.floor(maxDimension * 0.8);
      quality = Math.max(0.5, quality - 0.06);
    }

    throw new Error('This photo is too large after compression. Choose a smaller image.');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const MenuModule = ({ merchantId, isDemo = false }) => {
  const { user } = useAuth();

  // Initialize items: trial users from localStorage, demo from DEMO_MENU_ITEMS, real from Firestore
  const [items, setItems] = useState(() => {
    if (isDemo) {
      const saved = localStorage.getItem(TRIAL_MENU_KEY);
      if (saved) {
        try { return JSON.parse(saved); } catch { /* fall through */ }
      }
      return DEMO_MENU_ITEMS;
    }
    return [];
  });
  const [viewMode, setViewMode] = useState('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [generatedMenuUrl, setGeneratedMenuUrl] = useState('');
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [error, setError] = useState('');

  const getMenuUrl = (id) => {
    const targetId = id || merchantId || user?.uid || auth.currentUser?.uid || 'demo-merchant';
    const menuUrl = new URL(`/public/menu/${targetId}`, FRONTEND_BASE_URL);
    if (isDemo) menuUrl.searchParams.set('preview', 'true');
    return menuUrl.toString();
  };

  // Persist trial items to localStorage whenever they change
  useEffect(() => {
    if (isDemo) {
      localStorage.setItem(TRIAL_MENU_KEY, JSON.stringify(items));
    }
  }, [items, isDemo]);

  // Load saved menu items from Firestore (real merchants only).
  useEffect(() => {
    const currentUser = user || auth.currentUser;
    if (!currentUser || isDemo) return;
    const fetchMenu = async () => {
      try {
        const menuRef = collection(db, 'merchants', currentUser.uid, 'menu');
        const menuSnapshot = await getDocs(menuRef);
        setItems(menuSnapshot.docs.map((menuDoc) => ({ id: menuDoc.id, ...menuDoc.data() })));
      } catch (fetchError) {
        console.error('Menu fetch error:', fetchError);
        setError('Could not load the saved menu. Check your Firestore rules and connection.');
      }
    };
    fetchMenu();
  }, [user, isDemo]);

  // 2. Handle CRUD Logic (Siphoned from Editor)
  const handleInputChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    setQrCodeUrl('');
    setGeneratedMenuUrl('');
  };

  const handleImageUpload = async (index, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Choose an image smaller than 5 MB.');
      return;
    }

    setUploadingIndex(index);
    setError('');
    try {
      const imageUrl = await compressMenuImage(file);
      handleInputChange(index, 'imageUrl', imageUrl);
    } catch (uploadError) {
      setError(uploadError.message || 'Could not prepare this photo. Please try again.');
    } finally {
      setUploadingIndex(null);
    }
  };

  const addRow = () => {
    setItems([...items, { name: '', price: '', category: 'Mains', isAvailable: true }]);
    setQrCodeUrl('');
    setGeneratedMenuUrl('');
  };

  const removeRow = (index) => {
    setItems(items.filter((_, i) => i !== index));
    setQrCodeUrl('');
    setGeneratedMenuUrl('');
  };

    // Save the current menu and publish its public QR code.
const handleSaveAndPublish = async () => {
    setIsSaving(true);
    setError('');

    try {
      const normalizedItems = items.map((item) => ({
        ...item,
        name: item.name?.trim() || '',
        category: item.category?.trim() || 'General',
        price: Number(item.price),
        description: item.description || '',
        imageUrl: item.imageUrl || '',
        isAvailable: item.isAvailable !== false,
        updatedAt: new Date().toISOString(),
      }));
      const invalidItem = normalizedItems.find((item) => item.name.length < 2 || !Number.isFinite(item.price) || item.price < 1);
      if (invalidItem) {
        throw new Error('Each dish needs a name and a price greater than zero.');
      }

      if (new Blob([JSON.stringify(normalizedItems)]).size > 8 * 1024 * 1024) {
        throw new Error('These photos make the menu too large to save. Replace some with smaller images.');
      }

      if (isDemo) {
        localStorage.setItem(TRIAL_MENU_KEY, JSON.stringify(normalizedItems));
        const deepLink = getMenuUrl(merchantId || 'demo-merchant');
        const qrUrl = await QRCode.toDataURL(deepLink, {
          width: 400,
          margin: 2,
          color: { dark: '#ea580c', light: '#ffffff' }
        });
        setQrCodeUrl(qrUrl);
        setGeneratedMenuUrl(deepLink);
        setViewMode('qr');
        return;
      }

      const currentUser = user || auth.currentUser;
      if (!currentUser) throw new Error('Your session is still starting. Please try again.');

      const menuRef = collection(db, 'merchants', currentUser.uid, 'menu');
      const existingItems = await getDocs(menuRef);
      if (existingItems.size + normalizedItems.length > 500) {
        throw new Error('This menu is too large to update in one save. Remove some dishes and try again.');
      }

      const batch = writeBatch(db);
      existingItems.docs.forEach((menuDoc) => batch.delete(menuDoc.ref));
      normalizedItems.forEach((item) => batch.set(doc(menuRef), item));
      await batch.commit();

      const deepLink = getMenuUrl(currentUser.uid);
      const qrUrl = await QRCode.toDataURL(deepLink, {
        width: 400,
        margin: 2,
        color: { dark: '#ea580c', light: '#ffffff' }
      });

      setQrCodeUrl(qrUrl);
      setGeneratedMenuUrl(deepLink);
      setViewMode('qr');
    } catch (err) {
      console.error('Menu Save Error:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred while saving your menu. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* --- Rebranded Segmented Control: Deep Black & Bold Orange --- */}
      <div className="bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-[2rem] shadow-2xl flex gap-1 border border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setViewMode('edit')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl transition-all text-xs font-black uppercase tracking-widest ${viewMode === 'edit' ? 'bg-orange-600 text-zinc-950 dark:text-white shadow-lg shadow-orange-600/20' : 'text-zinc-500 hover:text-zinc-950 dark:text-white'}`}
        >
          <Edit3 className="w-4 h-4" /> 
          <span>Edit</span>
        </button>
        <button
          onClick={() => setViewMode('preview')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl transition-all text-xs font-black uppercase tracking-widest ${viewMode === 'preview' ? 'bg-orange-600 text-zinc-950 dark:text-white shadow-lg shadow-orange-600/20' : 'text-zinc-500 hover:text-zinc-950 dark:text-white'}`}
        >
          <Eye className="w-4 h-4" /> 
          <span>Preview</span>
        </button>
        <button
          onClick={handleSaveAndPublish}
          disabled={isSaving}
          className={`flex-[1.2] flex items-center justify-center gap-2 py-4 rounded-2xl transition-all text-xs font-black uppercase tracking-widest ${viewMode === 'qr' ? 'bg-white text-zinc-950 shadow-lg' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'} active:scale-95`}
        >
          <QrCode className="w-4 h-4" />
          <span className="whitespace-nowrap">View QR</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* --- Dynamic Content Area --- */}
      <div className="min-h-[400px]">
        
        {/* MODE: EDIT - Rebranded for High-Contrast Data Entry */}
        {viewMode === 'edit' && (
          <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] p-4 md:p-8 shadow-2xl border border-zinc-900 space-y-6">
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col gap-4 p-6 bg-zinc-100 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 group relative transition-all focus-within:ring-2 focus-within:ring-orange-600/30">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-grow">
                      <label className="text-[10px] uppercase font-black text-zinc-500 mb-2 block tracking-[0.2em]">Dish Name</label>
                      <input
                        value={item.name}
                        onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 px-5 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 font-bold text-zinc-950 dark:text-white outline-none focus:border-orange-600 transition-colors placeholder:text-zinc-700"
                        placeholder="e.g. Traditional Platter"
                      />
                    </div>
                    <div className="sm:w-44">
                      <label className="text-[10px] uppercase font-black text-zinc-500 mb-2 block tracking-[0.2em]">Price (KES)</label>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleInputChange(index, 'price', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 px-5 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 font-black text-orange-500 outline-none focus:border-orange-600"
                        placeholder="0"
                      />
                    </div>
                    <div className="sm:w-44">
                      <label className="text-[10px] uppercase font-black text-zinc-500 mb-2 block tracking-[0.2em]">Category</label>
                      <input
                        value={item.category || ''}
                        onChange={(e) => handleInputChange(index, 'category', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 px-5 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 font-bold text-zinc-950 dark:text-white outline-none focus:border-orange-600 transition-colors placeholder:text-zinc-500"
                        placeholder="e.g. Mains"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-black text-zinc-500 mb-2 block tracking-[0.2em]">Dish Photo</span>
                    <div className="flex flex-wrap items-center gap-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={`${item.name || 'Menu item'} preview`}
                          className="h-16 w-16 rounded-xl object-cover"
                        />
                      )}
                      <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:border-orange-500 transition-colors ${uploadingIndex !== null ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload className="h-4 w-4 text-orange-500" />
                        {uploadingIndex === index ? 'Preparing Photo...' : item.imageUrl ? 'Change Photo' : 'Choose Photo'}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={uploadingIndex !== null || isSaving}
                          onChange={(event) => {
                            void handleImageUpload(index, event.target.files?.[0]);
                            event.target.value = '';
                          }}
                        />
                      </label>
                      {item.imageUrl && (
                        <button
                          type="button"
                          onClick={() => handleInputChange(index, 'imageUrl', '')}
                          disabled={uploadingIndex !== null || isSaving}
                          className="text-xs font-bold text-zinc-500 hover:text-red-500 disabled:opacity-50"
                        >
                          Remove photo
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => removeRow(index)} 
                    className="flex items-center justify-center gap-2 py-3 text-red-500 font-black text-xs uppercase bg-red-500/10 rounded-xl sm:absolute sm:-top-2 sm:-right-2 sm:shadow-xl sm:w-10 sm:h-10 sm:p-0 sm:rounded-full hover:bg-red-500 hover:text-zinc-950 dark:text-white transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sm:hidden">Delete Dish</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <button 
                onClick={addRow} 
                className="w-full py-5 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-zinc-500 font-black uppercase tracking-widest hover:text-orange-500 hover:border-orange-600/50 hover:bg-orange-600/5 transition-all flex items-center justify-center gap-3 active:scale-98"
              >
                <Plus className="w-5 h-5" /> Add New Dish
              </button>
              
              <button
                onClick={handleSaveAndPublish}
                disabled={isSaving}
                className="w-full py-6 bg-orange-600 hover:bg-orange-700 text-zinc-950 dark:text-white rounded-3xl font-black text-lg uppercase tracking-tighter shadow-2xl shadow-orange-600/30 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Syncing Menu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-6 h-6" /> Save & Update QR
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* MODE: PREVIEW - Will inherit the Public branding */}
        {viewMode === 'preview' && <MenuView items={items} />}

        {/* MODE: QR CODE - The Ultimate Presentation Mode */}
        {viewMode === 'qr' && (
          <div className="bg-white dark:bg-zinc-950 p-8 md:p-12 rounded-[3rem] border border-zinc-900 shadow-2xl text-center space-y-10 animate-in zoom-in-95 duration-300">
            <div className="space-y-3">
              <h3 className="text-4xl font-black text-zinc-950 dark:text-white tracking-tighter leading-none uppercase italic">{isDemo ? 'Menu Preview Ready' : 'Menu Published!'}</h3>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">This QR opens the current menu</p>
            </div>

            <div className="relative inline-block p-8 bg-white rounded-[3rem] shadow-[0_0_50px_rgba(255,107,0,0.2)]">
              <img src={qrCodeUrl} alt="Menu QR Code" className="w-60 h-60 md:w-72 md:h-72 rounded-2xl" />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-orange-600 text-zinc-950 dark:text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl">
                Scan to View
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={qrCodeUrl}
                download="menu-qr.png"
                className="flex-1 flex items-center justify-center gap-3 py-5 bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white rounded-2xl font-black uppercase tracking-widest border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-800 transition active:scale-95"
              >
                <Download className="w-5 h-5 text-orange-500" /> Download
              </a>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ 
                      title: 'Our Digital Menu',
                      url: getMenuUrl((user || auth.currentUser)?.uid)
                    });
                  }
                }}
                className="flex-1 flex items-center justify-center gap-3 py-5 bg-orange-600 text-zinc-950 dark:text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 hover:bg-orange-700 transition active:scale-95"
              >
                <Share2 className="w-5 h-5" /> Share Link
              </button>
            </div>
            <a
              href={generatedMenuUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center text-sm font-bold text-orange-600 hover:underline"
            >
              Open this menu link
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuModule;
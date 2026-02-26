import React, { useState } from 'react';
import { 
  Shield, Trash2, Save, Lock, Building2, AlertTriangle, Loader2 
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import { API_BASE_URL } from '../utility/constants';

const SettingsModule = () => {
  const { user, merchantData, logout } = useAuth();
  
  const [profile, setProfile] = useState({
    name: merchantData?.name || '',
    shortcode: merchantData?.shortcode || '',
    accountType: merchantData?.accountType || 'till',
    accountReference: merchantData?.accountReference || ''
  });
  
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await user.getIdToken();
      await axios.patch(`${API_BASE_URL}/api/auth/update-profile`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus({ type: 'success', msg: 'Business profile updated successfully!' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'Update failed' });
    } finally { setLoading(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setStatus({ type: 'error', msg: 'Passwords do not match' });
    }
    setLoading(true);
    try {
      const token = await user.getIdToken();
      await axios.patch(`${API_BASE_URL}/api/auth/security/password`, 
        { newPassword: passwords.newPassword }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswords({ newPassword: '', confirmPassword: '' });
      setStatus({ type: 'success', msg: 'Password updated successfully!' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'Security update failed' });
    } finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm("🚨 WARNING: This will permanently delete your MerchantPro account and all transaction history. This cannot be undone. Proceed?");
    if (!confirm) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();
      await axios.delete(`${API_BASE_URL}/api/auth/account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await logout();
      window.location.href = '/';
    } catch (err) {
      setStatus({ type: 'error', msg: 'Failed to delete account' });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* STATUS NOTIFICATIONS */}
      {status.msg && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-2 ${
          status.type === 'success' 
            ? 'bg-status-successBg border-status-success/20 text-status-success' 
            : 'bg-status-errorBg border-status-error/20 text-status-error'
        }`}>
          {status.type === 'success' ? <Shield className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <p className="text-[10px] font-black uppercase tracking-widest">{status.msg}</p>
        </div>
      )}

      {/* 1. BUSINESS IDENTITY */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-content-muted dark:text-content-mutedDark flex items-center gap-2 px-2">
          <Building2 className="w-3.5 h-3.5 text-brand-orange" /> Business Identity
        </h3>
        <Card className="bg-brand-surface dark:bg-brand-gray border-brand-borderLight dark:border-brand-borderDark rounded-[2rem]">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-content-muted dark:text-content-mutedDark px-1">Merchant Name</label>
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="w-full bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark rounded-xl px-4 py-3 text-sm font-bold text-content-main dark:text-content-mainDark focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-content-muted dark:text-content-mutedDark px-1">Login Email</label>
                <input type="text" value={user?.email} disabled className="w-full bg-brand-light/50 dark:bg-brand-black/50 border border-brand-borderLight dark:border-brand-borderDark rounded-xl px-4 py-3 text-sm font-bold opacity-50 cursor-not-allowed text-content-muted dark:text-content-mutedDark" />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-brand-borderLight dark:border-brand-borderDark">
              <label className="text-[9px] font-black uppercase tracking-widest text-content-muted dark:text-content-mutedDark">M-Pesa Config</label>
              <div className="flex bg-brand-light dark:bg-brand-black p-1 rounded-2xl border border-brand-borderLight dark:border-brand-borderDark max-w-sm">
                <button 
                  onClick={() => setProfile({...profile, accountType: 'till'})}
                  className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${profile.accountType === 'till' ? 'bg-brand-orange text-white shadow-md' : 'text-content-muted dark:text-content-mutedDark'}`}
                >Buy Goods</button>
                <button 
                  onClick={() => setProfile({...profile, accountType: 'paybill'})}
                  className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${profile.accountType === 'paybill' ? 'bg-brand-orange text-white shadow-md' : 'text-content-muted dark:text-content-mutedDark'}`}
                >Paybill</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-content-muted dark:text-content-mutedDark px-1">Shortcode</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 522522"
                    value={profile.shortcode}
                    onChange={(e) => setProfile({...profile, shortcode: e.target.value})}
                    className="w-full bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark rounded-xl px-4 py-3 text-sm font-bold text-content-main dark:text-content-mainDark outline-none focus:ring-2 focus:ring-brand-orange/20"
                  />
                </div>
                {profile.accountType === 'paybill' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-content-muted dark:text-content-mutedDark px-1">Account Ref</label>
                    <input 
                      type="text" 
                      placeholder="e.g. SHOP-101"
                      value={profile.accountReference}
                      onChange={(e) => setProfile({...profile, accountReference: e.target.value})}
                      className="w-full bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark rounded-xl px-4 py-3 text-sm font-bold text-content-main dark:text-content-mainDark outline-none focus:ring-2 focus:ring-brand-orange/20"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={handleUpdateProfile} disabled={loading} className="w-full md:w-auto px-8 bg-brand-buttonBase text-brand-buttonText dark:buttonDark dark:text-brand-buttonTextDark font-black uppercase tracking-widest rounded-xl py-4 h-auto text-[10px] shadow-lg shadow-brand-orange/10">
                {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />} Sync Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 2. SECURITY */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-content-muted dark:text-content-mutedDark flex items-center gap-2 px-2">
          <Lock className="w-3.5 h-3.5 text-brand-orange" /> Security
        </h3>
        <Card className="bg-brand-surface dark:bg-brand-gray border-brand-borderLight dark:border-brand-borderDark rounded-[2rem]">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-content-muted dark:text-content-mutedDark px-1">New Password</label>
                <input 
                  type="password" 
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  className="w-full bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark rounded-xl px-4 py-3 text-sm font-bold text-content-main dark:text-content-mainDark" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-content-muted dark:text-content-mutedDark px-1">Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                  className="w-full bg-brand-light dark:bg-brand-black border border-brand-borderLight dark:border-brand-borderDark rounded-xl px-4 py-3 text-sm font-bold text-content-main dark:text-content-mainDark" 
                />
              </div>
            </div>
            <Button onClick={handleChangePassword} disabled={loading} variant="outline" className="w-full md:w-auto h-auto py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-brand-borderLight dark:border-brand-borderDark text-content-main dark:text-content-mainDark">
              Update Credentials
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* 3. DANGER ZONE */}
      <section className="pt-4">
        <div className="p-6 md:p-8 rounded-[2rem] bg-status-errorBg border border-status-error/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-surface dark:bg-brand-gray text-status-error rounded-2xl shadow-sm">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-black uppercase tracking-widest text-status-error">Erase Account Data</h4>
              <p className="text-[9px] font-bold text-content-muted dark:text-content-mutedDark mt-1 uppercase tracking-tight">Permanently delete all merchant records</p>
            </div>
          </div>
          <Button onClick={handleDeleteAccount} className="w-full md:w-auto bg-status-error text-white font-black uppercase tracking-widest px-8 rounded-xl py-4 h-auto text-[10px] hover:opacity-90 shadow-lg shadow-status-error/20">
            Terminate Account
          </Button>
        </div>
      </section>

    </div>
  );
};

export default SettingsModule;
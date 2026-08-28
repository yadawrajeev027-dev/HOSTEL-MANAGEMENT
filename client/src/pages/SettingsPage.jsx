import React, { useState } from 'react';
import { 
  Settings, Lock, Bell, Eye, Shield, Smartphone, Palette, ChevronRight, X
} from 'lucide-react';
import { authApi } from '../api';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

function ChangePasswordModal({ isOpen, onClose }) {
  const { showToast } = useNotifications();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      showToast('Password changed successfully', 'success', 'Security Update');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl w-full max-w-md shadow-2xl animate-fadeIn">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Change Password</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Ensure your account is using a long, random password to stay secure.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Current Password</label>
            <input 
              type="password" 
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none" 
            />
          </div>
          
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">New Password</label>
            <input 
              type="password" 
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Confirm New Password</label>
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none" 
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50 transition-colors shadow-lg shadow-brand-500/20">
              {submitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SettingsPage({ setCurrentTab }) {
  const { user } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Mock toggle states
  const [toggles, setToggles] = useState({
    emailNotifs: true,
    smsNotifs: false,
    outpassUpdates: true,
    complaintUpdates: true,
    profileVisibility: true
  });

  const handleToggle = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">Settings & Preferences</h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Manage your account security, notifications, and app preferences.</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Left Column (Main Settings) */}
        <div className="space-y-6 w-full">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <Shield className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security & Access</h2>
            </div>
            
            <div className="p-2">
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    <Lock className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Change Password</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Update your account password</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-slate-900 transition-colors" />
              </button>

              <button 
                onClick={() => setCurrentTab('profile')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    <Eye className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Review Profile Data</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">See what information is saved in your profile</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-slate-900 transition-colors" />
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <Bell className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notification Preferences</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Email Notifications</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Receive important alerts via email</p>
                </div>
                <button 
                  onClick={() => handleToggle('emailNotifs')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${toggles.emailNotifs ? 'bg-brand-600' : 'bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 bg-white dark:bg-slate-900 rounded-full absolute top-1 transition-transform ${toggles.emailNotifs ? 'translate-x-7' : 'translate-x-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">SMS Alerts</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Emergency and critical updates to your phone</p>
                </div>
                <button 
                  onClick={() => handleToggle('smsNotifs')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${toggles.smsNotifs ? 'bg-brand-600' : 'bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 bg-white dark:bg-slate-900 rounded-full absolute top-1 transition-transform ${toggles.smsNotifs ? 'translate-x-7' : 'translate-x-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Outpass Status Updates</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Notify when outpass is approved/rejected</p>
                </div>
                <button 
                  onClick={() => handleToggle('outpassUpdates')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${toggles.outpassUpdates ? 'bg-brand-600' : 'bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 bg-white dark:bg-slate-900 rounded-full absolute top-1 transition-transform ${toggles.outpassUpdates ? 'translate-x-7' : 'translate-x-1'}`}></div>
                </button>
              </div>
            </div>
          </div>
        </div>



      </div>

      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </div>
  );
}

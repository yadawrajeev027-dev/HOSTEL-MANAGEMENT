import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  HeartPulse, 
  Building, 
  Zap, 
  Droplet, 
  ShieldAlert, 
  UtensilsCrossed, 
  AlertOctagon, 
  Bed,
  CheckCircle2, 
  X, 
  Send, 
  ArrowRight,
  Headphones,
  Bot
} from 'lucide-react';
import { callBoothApi, outpassApi } from '../api';
import { useNotifications } from '../context/NotificationContext';
import confetti from 'canvas-confetti';
import { EmergencyMicrophone } from './EmergencyMicrophone';

const CATEGORIES = [
  { id: 'Health Issue', label: 'Health Issue', icon: HeartPulse, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30 hover:border-rose-400', dest: 'Medical Room / Medical Staff' },
  { id: 'Hostel Issue', label: 'Hostel Issue', icon: Building, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30 hover:border-blue-400', dest: 'Floor Warden / Hostel Supervisor' },
  { id: 'Room Issue', label: 'Room Issue', icon: Bed, color: 'text-cyan-600 bg-cyan-50 border-sky-500/30 hover:border-sky-400', dest: 'Floor Warden / Caretaker' },
  { id: 'Electrical Issue', label: 'Electrical Issue', icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-500/30 hover:border-amber-400', dest: 'Maintenance / Electrical Staff' },
  { id: 'Water Issue', label: 'Water Issue', icon: Droplet, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30 hover:border-cyan-400', dest: 'Maintenance / Water Supply Staff' },
  { id: 'Security Issue', label: 'Security Issue', icon: ShieldAlert, color: 'text-red-600 bg-red-50 border-red-300 hover:border-red-400', dest: 'Campus Main Gate Security / Warden' },
  { id: 'Food/Mess Issue', label: 'Food/Mess Issue', icon: UtensilsCrossed, color: 'text-emerald-600 bg-emerald-50 border-emerald-500/30 hover:border-emerald-400', dest: 'Mess Manager / Responsible Warden' },
  { id: 'Other Emergency', label: 'Other Emergency', icon: AlertOctagon, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30 hover:border-purple-400', dest: 'Emergency Response Action Squad' }
];

export function CallBoothModal({ isOpen, onClose, onSuccess, initialData }) {
  const { showToast, fetchNotifications } = useNotifications();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    if (initialData) {
      if (initialData.category) setCategory(initialData.category);
      if (initialData.description) setDescription(initialData.description);
    }
  }, [initialData]);

  const handleReset = () => {
    setCategory('');
    setDescription('');
    setResultData(null);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!description.trim()) {
      alert('Please describe your emergency or issue');
      return;
    }

    setSubmitting(true);
    try {
      const res = await callBoothApi.create({
        category: category || undefined,
        description: description.trim(),
        isVoice: false
      });

      setResultData(res);
      showToast(res.message, 'success', 'Call Booth Dispatched');
      fetchNotifications();
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      if (onSuccess) onSuccess(res.callRequest);
    } catch (err) {
      alert(err.message || 'Failed to submit call request');
    } finally {
      setSubmitting(false);
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-brand-500/40 rounded-2xl shadow-2xl shadow-brand-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header with emergency red/brand gradient */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-red-950/60 via-white to-brand-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-500/40 flex items-center justify-center text-red-600 animate-pulse">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-['Outfit']">EMERGENCY CALL BOOTH</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-red-500 text-white tracking-widest animate-pulse">FAST ROUTE</span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">AI Voice Assistant & Rule-Based Automatic Dispatch</p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 bg-slate-950/50 hover:bg-slate-950 text-slate-400 hover:text-white rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto custom-scrollbar flex-1">
          {resultData ? (
            // Success Screen (Same as before)
            <div className="p-8 text-center animate-fadeIn space-y-6">
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-4 border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-['Outfit']">Ticket Dispatched Successfully</h3>
                <p className="text-slate-500 mt-2 max-w-md mx-auto">Your emergency request has been automatically routed to the responsible department.</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 text-left max-w-md mx-auto space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Ticket ID</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">#{resultData.callRequest?.id}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Routed To</span>
                  <span className="text-sm font-bold text-brand-600">{resultData.callRequest?.routedToRole || resultData.callRequest?.detectedService || resultData.callRequest?.category || 'Emergency Operator'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Priority</span>
                  <span className="text-[10px] font-black tracking-widest text-red-500 uppercase bg-red-500/10 px-2 py-0.5 rounded">CRITICAL</span>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button onClick={handleReset} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  Create Another
                </button>
                <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/25 transition-colors">
                  Close Call Booth
                </button>
              </div>
            </div>
          ) : (
            // Form Screen
            <div className="p-6">
              
              <EmergencyMicrophone 
                onCallConnected={(res) => {
                  showToast('Emergency call initiated successfully', 'success');
                  fetchNotifications();
                  if (onSuccess) onSuccess(res.callRequest);
                }} 
              />

              {/* Category Grid */}
              <div className="mb-6">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Or Select Category Manually</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-center transition-all ${
                        category === cat.id 
                          ? `${cat.color} ring-2 ring-brand-500 ring-offset-2 ring-offset-slate-900 shadow-lg` 
                          : 'bg-[#F5F7FB] dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <cat.icon className="w-5 h-5" />
                      <span className="text-[10px] font-bold leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Input */}
              <form id="call-booth-form" onSubmit={handleSubmit}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Incident Description</h3>
                  {category && (
                    <span className="text-[10px] font-semibold text-brand-500 flex items-center gap-1 bg-brand-500/10 px-2 py-0.5 rounded-full">
                      <ArrowRight className="w-3 h-3" /> Auto-routes to: {CATEGORIES.find(c => c.id === category)?.dest}
                    </span>
                  )}
                </div>
                
                <div className="relative">
                  <textarea
                    required
                    rows="3"
                    placeholder="Describe the emergency or issue... (Or use the AI Microphone above)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F5F7FB] dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none resize-none transition-all shadow-inner"
                  ></textarea>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer Actions (Only show if not on result screen) */}
        {!resultData && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-[#F5F7FB] dark:bg-slate-950/50 flex justify-end gap-3 shrink-0">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border border-slate-300 dark:border-slate-700"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              form="call-booth-form"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-all shadow-lg shadow-red-500/25 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              {submitting ? 'Dispatching...' : (
                <>
                  <Send className="w-4 h-4" /> Dispatch Call
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

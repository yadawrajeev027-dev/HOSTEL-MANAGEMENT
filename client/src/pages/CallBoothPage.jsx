import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  Mic, 
  MicOff, 
  HeartPulse, 
  Building, 
  Zap, 
  Droplet, 
  ShieldAlert, 
  UtensilsCrossed, 
  AlertOctagon, 
  Bed, 
  CheckCircle2, 
  Clock, 
  Search, 
  Sparkles,
  Phone,
  Send,
  Headphones
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { callBoothApi } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { useNotifications } from '../context/NotificationContext';
import confetti from 'canvas-confetti';

const CATEGORIES = [
  { id: 'Health Issue', label: 'Health Issue', icon: HeartPulse, color: 'text-rose-400', dest: 'Medical Room / Medical Staff', desc: 'Fever, injuries, sudden sickness, medical emergency' },
  { id: 'Hostel Issue', label: 'Hostel Issue', icon: Building, color: 'text-blue-400', dest: 'Floor Warden / Warden In-Charge', desc: 'Corridor cleanliness, noise disturbance, general hostel maintenance' },
  { id: 'Room Issue', label: 'Room Issue', icon: Bed, color: 'text-cyan-600', dest: 'Floor Warden / Caretaker', desc: 'Door lock, bed, cupboard, window latch issues' },
  { id: 'Electrical Issue', label: 'Electrical Issue', icon: Zap, color: 'text-amber-600', dest: 'Maintenance / Electrical Staff', desc: 'Sparking socket, fan breakdown, light failure, MCB trip' },
  { id: 'Water Issue', label: 'Water Issue', icon: Droplet, color: 'text-cyan-400', dest: 'Maintenance / Water Supply Staff', desc: 'No water supply, tap leak, washroom drainage overflow' },
  { id: 'Security Issue', label: 'Security Issue', icon: ShieldAlert, color: 'text-red-600', dest: 'Campus Security / Warden', desc: 'Unauthorized trespasser, theft, emergency gate security' },
  { id: 'Food/Mess Issue', label: 'Food/Mess Issue', icon: UtensilsCrossed, color: 'text-emerald-600', dest: 'Mess Manager / Responsible Warden', desc: 'Mess hygiene, raw food complaint, drinking water at dining hall' },
  { id: 'Other Emergency', label: 'Other Emergency', icon: AlertOctagon, color: 'text-purple-400', dest: 'Emergency Response Team / Chief Warden', desc: 'Any other urgent unforeseen crisis' }
];

export function CallBoothPage({ onOpenModal }) {
  const { user } = useAuth();
  const { showToast, fetchNotifications } = useNotifications();

  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // Status update modal for authorities
  const [statusModal, setStatusModal] = useState({ isOpen: false, call: null, status: 'Resolved', resolution: '' });

  const loadCalls = async () => {
    try {
      const res = await callBoothApi.getAll();
      setCalls(res.requests || []);
    } catch (err) {
      console.error('Failed to load call booth requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalls();
  }, [user?.id]);

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please describe your emergency');
      return;
    }

    setSubmitting(true);
    try {
      const res = await callBoothApi.create({
        category: selectedCategory || undefined,
        description: description.trim()
      });
      showToast(res.message, 'success', 'Dispatched');
      setDescription('');
      setSelectedCategory('');
      fetchNotifications();
      loadCalls();
      confetti({ particleCount: 50, spread: 60 });
    } catch (err) {
      alert(err.message || 'Failed to dispatch call');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    const { call, status, resolution } = statusModal;
    try {
      await callBoothApi.updateStatus(call.id, status, resolution);
      showToast('Call ticket updated successfully', 'success');
      setStatusModal({ isOpen: false, call: null, status: 'Resolved', resolution: '' });
      fetchNotifications();
      loadCalls();
    } catch (err) {
      alert(err.message || 'Update failed');
    }
  };

  const filtered = calls.filter(c => 
    c.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.studentName.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase()) ||
    c.destination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-red-950 via-white to-white border border-red-300 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-600 border border-red-400/30 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-red-600/40 animate-pulse">
            <PhoneCall className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white tracking-widest uppercase">
                INTELLIGENT ROUTING
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">24x7 University Emergency Command</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-['Outfit']">FAST CALL BOOTH</h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
              Automatic keyword detection & immediate assignment to Medical, Electric, Plumbing, Security, Mess or Wardens.
            </p>
          </div>
        </div>

        {user?.role === 'Student' && (
          <button
            onClick={onOpenModal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/30 transition-all cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            Open Voice & Call Modal
          </button>
        )}
      </div>

      {/* EMERGENCY HELPLINES QUICK CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <HeartPulse className="w-6 h-6 text-rose-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Medical Clinic</div>
            <div className="text-[11px] font-mono text-rose-400 font-bold">+91 98765 00001</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Security Desk</div>
            <div className="text-[11px] font-mono text-red-600 font-bold">+91 98765 00005</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Zap className="w-6 h-6 text-amber-600 shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Electrician</div>
            <div className="text-[11px] font-mono text-amber-600 font-bold">+91 98765 00003</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Droplet className="w-6 h-6 text-cyan-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Plumber / Water</div>
            <div className="text-[11px] font-mono text-cyan-400 font-bold">+91 98765 00004</div>
          </div>
        </div>
      </div>

      {/* STUDENT FAST REPORT FORM */}
      {user?.role === 'Student' && (
        <div className="bg-white dark:bg-slate-900 border border-red-300 rounded-3xl p-6 sm:p-7 shadow-xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            Quick Dispatch Desk
          </h3>

          <form onSubmit={handleQuickSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-2">
                1. Select Category (Or leave empty for smart AI keyword routing)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(isSelected ? '' : cat.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'bg-red-600/30 border-red-500 text-white ring-2 ring-red-500/40' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${cat.color}`} />
                        <span className="text-xs font-bold">{cat.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">{cat.dest}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                2. Describe Problem
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="e.g. 'I am having high fever and dizziness in Room 204', 'Water leaking from ceiling', 'Door lock broken'..."
                className="w-full px-4 py-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Dispatching...' : 'Dispatch Request Immediately'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TICKETS SEARCH & TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Call Booth Emergency Logs ({calls.length})
            </h3>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search emergency logs..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#F5F7FB] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 bg-[#F5F7FB]/40 rounded-2xl">
            No emergency tickets found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Category & Destination</th>
                  <th className="py-3 px-4">Student & Location</th>
                  <th className="py-3 px-4">Problem Description</th>
                  <th className="py-3 px-4">Status & In-Charge</th>
                  {user?.role !== 'Student' && <th className="py-3 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-700 dark:text-slate-200">
                {filtered.map((call) => (
                  <tr key={call.id} className="hover:bg-slate-50/30">
                    <td className="py-3.5 px-4 font-mono font-bold text-red-600">
                      {call.ticketNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{call.category}</div>
                      <div className="text-[11px] text-emerald-600 font-medium">➔ {call.destination}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-700 dark:text-slate-200">{call.studentName}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">{call.hostel}, Room {call.roomNumber}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="line-clamp-2 italic text-slate-600 dark:text-slate-300">"{call.description}"</p>
                      {call.resolution && (
                        <p className="text-[10px] text-brand-600 mt-1 font-medium">
                          <strong>Resolution:</strong> {call.resolution}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="mb-1">
                        <StatusBadge status={call.status} />
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">{call.assignedTo}</div>
                    </td>

                    {user?.role !== 'Student' && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setStatusModal({ isOpen: true, call, status: call.status, resolution: call.resolution || '' })}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                        >
                          Update Status
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RESOLUTION MODAL */}
      {statusModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-red-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Update Emergency Ticket Status</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              Ticket: <strong className="text-slate-900 dark:text-white">{statusModal.call?.ticketNumber}</strong> ({statusModal.call?.category})
            </p>

            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={statusModal.status}
                  onChange={(e) => setStatusModal({ ...statusModal, status: e.target.value })}
                  className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  <option value="Open">Open</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Resolution Comments</label>
                <textarea
                  rows={3}
                  value={statusModal.resolution}
                  onChange={(e) => setStatusModal({ ...statusModal, resolution: e.target.value })}
                  className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  placeholder="Detail action taken..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModal({ isOpen: false, call: null, status: 'Resolved', resolution: '' })}
                  className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500"
                >
                  Update Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

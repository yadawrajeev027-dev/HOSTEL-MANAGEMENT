import React, { useState, useEffect } from 'react';
import { 
  MessageSquareWarning, 
  Plus, 
  Send, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  User, 
  Building, 
  DoorClosed, 
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { complaintApi } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { useNotifications } from '../context/NotificationContext';
import confetti from 'canvas-confetti';

export function ComplaintsPage() {
  const { user } = useAuth();
  const { showToast, fetchNotifications } = useNotifications();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Response Modal for Authorities
  const [replyModal, setReplyModal] = useState({ isOpen: false, complaint: null, status: 'In Progress', response: '' });

  // Student Complaint Form State
  const [form, setForm] = useState({
    complaintTo: 'Floor Warden',
    studentName: user?.name || '',
    registrationNumber: user?.registrationNumber || '',
    hostelName: user?.hostel || 'Block A (Ganga Hostel)',
    roomNumber: user?.roomNumber || '204',
    description: ''
  });

  const loadComplaints = async () => {
    try {
      const res = await complaintApi.getAll();
      setComplaints(res.complaints || []);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      alert('Please enter your complaint description');
      return;
    }

    setSubmitting(true);
    try {
      const res = await complaintApi.create(form);
      showToast(res.message, 'success', 'Complaint Logged');
      setShowForm(false);
      setForm({ ...form, description: '' });
      fetchNotifications();
      loadComplaints();
      confetti({ particleCount: 40, spread: 50 });
    } catch (err) {
      alert(err.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    const { complaint, status, response } = replyModal;
    try {
      const res = await complaintApi.respond(complaint.id, status, response);
      showToast('Response recorded and notified to student', 'success');
      setReplyModal({ isOpen: false, complaint: null, status: 'In Progress', response: '' });
      fetchNotifications();
      loadComplaints();
    } catch (err) {
      alert(err.message || 'Failed to record response');
    }
  };

  const filtered = complaints.filter(c => {
    const matchesSearch = 
      c.complaintNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.studentName.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.complaintTo.toLowerCase().includes(search.toLowerCase());

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && c.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquareWarning className="w-6 h-6 text-cyan-600" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">COMPLAINT MANAGEMENT SYSTEM</h1>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Strict Role-Targeted Grievance Redressal (Protected Routing to Floor, Dept, Deputy Chief, or Chief Warden)
          </p>
        </div>

        {user?.role === 'Student' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-500 text-slate-900 dark:text-white shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
          >
            {showForm ? 'Close Form' : (
              <>
                <Plus className="w-4 h-4" />
                Submit New Complaint
              </>
            )}
          </button>
        )}
      </div>

      {/* STRICT ISOLATION NOTICE */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Strict Access Isolation Active:</strong> Complaints are visible <em>only</em> to the specific authority selected by the student and the student themselves.
          </span>
        </div>
        <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-[10px] font-mono text-slate-400 dark:text-slate-500">
          RBAC-SECURED
        </span>
      </div>

      {/* STUDENT COMPLAINT FORM */}
      {showForm && user?.role === 'Student' && (
        <div className="bg-white dark:bg-slate-900 border-2 border-sky-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">File Official Hostel Complaint</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Select the specific target authority who should receive and resolve your complaint.</p>
            </div>
            <button onClick={() => setShowForm(false)} className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white">
              ✕ Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* COMPLAINT TO DROPDOWN */}
            <div>
              <label className="block text-[11px] font-semibold text-cyan-600 uppercase tracking-wider mb-1">
                Complaint To (Select Target Authority) *
              </label>
              <select
                value={form.complaintTo}
                onChange={(e) => setForm({ ...form, complaintTo: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              >
                <option value="Floor Warden">Floor Warden (Room, corridor, and floor-level issues)</option>
                <option value="Department Warden">Department Warden (Academic labs, study hours, dept permissions)</option>
                <option value="Deputy Chief Warden">Deputy Chief Warden (Mess hygiene, hostel discipline, facilities)</option>
                <option value="Chief Warden">Chief Warden (Infrastructure policy, warden escalations, campus rules)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Student Name</label>
                <input
                  type="text"
                  value={form.studentName}
                  onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Registration Number</label>
                <input
                  type="text"
                  value={form.registrationNumber}
                  onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono uppercase text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Hostel Name</label>
                <input
                  type="text"
                  value={form.hostelName}
                  onChange={(e) => setForm({ ...form, hostelName: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Room Number</label>
                <input
                  type="text"
                  value={form.roomNumber}
                  onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Complaint Description (Write your complaint here...) *
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                placeholder="Write your complaint clearly with relevant details..."
                className="w-full px-3 py-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-sky-600 hover:bg-sky-500 text-slate-900 dark:text-white shadow-lg shadow-sky-500/25 flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* FILTER & SEARCH */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search complaints by ID, student, details..."
            className="w-full pl-9 pr-4 py-2 bg-[#F5F7FB] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'Submitted', 'Received', 'In Progress', 'Resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st ? 'bg-sky-600 text-slate-900 dark:text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* COMPLAINTS LIST CARDS */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No complaints found in your authorized inbox.
          </div>
        ) : (
          filtered.map((c) => (
            <div 
              key={c.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 rounded-3xl p-5 sm:p-6 shadow-xl transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-xs text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-lg border border-sky-500/20">
                    {c.complaintNumber}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    Directed To: <strong className="text-slate-900 dark:text-white">{c.complaintTo}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={c.status} />
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Student info and description */}
              <div className="py-3.5 space-y-2">
                <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-slate-700 dark:text-slate-200">{c.studentName}</span>
                  <span>• Reg: <strong className="font-mono text-slate-600 dark:text-slate-300">{c.registrationNumber}</strong></span>
                  <span>• {c.hostel}, Room #{c.roomNumber} ({c.department})</span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed italic bg-[#F5F7FB]/40 p-3 rounded-xl border border-slate-200/60">
                  "{c.description}"
                </p>
              </div>

              {/* Authority Response Section */}
              {c.response && (
                <div className="mt-2 p-3 rounded-xl bg-[#F5F7FB]/80 border border-sky-500/20 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-cyan-600">Official Response from {c.respondedBy || c.complaintTo}:</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(c.respondedAt || c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-xs">{c.response}</p>
                </div>
              )}

              {/* Authority Action Button */}
              {user?.role !== 'Student' && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setReplyModal({ isOpen: true, complaint: c, status: c.status, response: c.response || '' })}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-slate-900 dark:text-white transition-colors"
                  >
                    {c.response ? 'Update Response & Status' : 'Respond to Student'}
                  </button>
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* AUTHORITY REPLY MODAL */}
      {replyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-sky-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Respond to Student Complaint</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              Student: <strong className="text-slate-900 dark:text-white">{replyModal.complaint?.studentName}</strong> • "{replyModal.complaint?.description}"
            </p>

            <form onSubmit={handleReplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Complaint Status</label>
                <select
                  value={replyModal.status}
                  onChange={(e) => setReplyModal({ ...replyModal, status: e.target.value })}
                  className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  <option value="Received">Received</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Official Response *</label>
                <textarea
                  rows={4}
                  value={replyModal.response}
                  onChange={(e) => setReplyModal({ ...replyModal, response: e.target.value })}
                  className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  placeholder="Provide resolution details or actions taken..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyModal({ isOpen: false, complaint: null, status: 'In Progress', response: '' })}
                  className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white bg-sky-600 hover:bg-sky-500"
                >
                  Save & Notify Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Phone, 
  User, 
  Building, 
  DoorClosed, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  Send,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { outpassApi } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { DigitalOutpassModal } from '../components/DigitalOutpassModal';
import { useNotifications } from '../context/NotificationContext';
import confetti from 'canvas-confetti';

export function OutpassPage() {
  const { user } = useAuth();
  const { showToast, fetchNotifications } = useNotifications();

  const [outpasses, setOutpasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPass, setSelectedPass] = useState(null);

  // Warden / Chief Review Modals
  const [reviewModal, setReviewModal] = useState({ isOpen: false, outpass: null, roleType: 'warden', action: 'ACCEPT', remarks: '', rejectionReason: '' });

  // Form State
  const [form, setForm] = useState({
    studentName: user?.name || '',
    registrationNumber: user?.registrationNumber || '',
    purpose: '',
    outTime: '',
    inTime: '',
    guardianPhone: user?.guardianPhone || '+91 ',
    department: user?.department || 'Computer Science & Engineering',
    year: user?.year || '3rd Year',
    branch: user?.branch || 'B.Tech CSE',
    section: user?.section || 'A',
    hostelName: user?.hostel || 'Block A (Ganga Hostel)',
    roomNumber: user?.roomNumber || '204',
    selectedWardenId: ''
  });

  const [wardensList, setWardensList] = useState([]);

  const loadOutpasses = async () => {
    try {
      const res = await outpassApi.getAll();
      setOutpasses(res.outpasses || []);
    } catch (err) {
      console.error('Failed to load outpasses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOutpasses();
    loadWardensList();
  }, [user?.id]);

  const loadWardensList = async () => {
    try {
      const token = localStorage.getItem('hostel_token');
      const res = await fetch('http://localhost:5000/api/wardens', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.wardens) {
        setWardensList(data.wardens.filter(w => w.role === 'Floor Warden'));
      }
    } catch (err) {
      console.error('Failed to load wardens:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.purpose || !form.outTime || !form.inTime || !form.guardianPhone) {
      alert('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await outpassApi.create(form);
      showToast(res.message, 'success', 'Outpass Submitted');
      setShowApplyForm(false);
      fetchNotifications();
      loadOutpasses();
      confetti({ particleCount: 50, spread: 60 });
    } catch (err) {
      alert(err.message || 'Failed to submit outpass');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecision = async (e) => {
    e.preventDefault();
    const { outpass, roleType, action, remarks, rejectionReason } = reviewModal;
    try {
      let res;
      if (roleType === 'warden') {
        res = await outpassApi.wardenReview(outpass.id, action, remarks, rejectionReason);
      } else {
        res = await outpassApi.chiefReview(outpass.id, action, remarks, rejectionReason);
      }

      showToast(res.message, action.includes('ACCEPT') || action.includes('APPROVE') ? 'success' : 'info');
      setReviewModal({ isOpen: false, outpass: null, roleType: 'warden', action: 'ACCEPT', remarks: '', rejectionReason: '' });
      fetchNotifications();
      loadOutpasses();
      if (action.includes('ACCEPT') || action.includes('APPROVE')) {
        confetti({ particleCount: 60, spread: 60 });
      }
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  // Filtered outpasses
  const filtered = outpasses.filter(o => {
    const matchesSearch = 
      o.studentName.toLowerCase().includes(search.toLowerCase()) ||
      o.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.outpassNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.purpose.toLowerCase().includes(search.toLowerCase());

    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'APPROVED') return matchesSearch && o.finalStatus === 'APPROVED';
    if (statusFilter === 'PENDING') return matchesSearch && o.finalStatus.includes('PENDING');
    if (statusFilter === 'REJECTED') return matchesSearch && o.finalStatus === 'REJECTED';
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Ticket className="w-6 h-6 text-brand-600" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">OUTPASS MANAGEMENT SYSTEM</h1>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            5-Step Multi-Authority Approval Engine (Student ➔ Floor Warden ➔ Chief Warden ➔ Digital Gate Pass)
          </p>
        </div>

        {user?.role === 'Student' && (
          <button
            onClick={() => setShowApplyForm(!showApplyForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25 transition-all cursor-pointer"
          >
            {showApplyForm ? 'Close Form' : (
              <>
                <Plus className="w-4 h-4" />
                Apply New Outpass
              </>
            )}
          </button>
        )}
      </div>

      {/* 5-STEP WORKFLOW VISUAL PROGRESS BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-lg">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Official 5-Step Outpass Lifecycle</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center text-xs">
          
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 font-bold mx-auto flex items-center justify-center mb-1 text-[11px]">1</span>
            <div className="font-bold text-slate-900 dark:text-white">Student Submits</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">Fills outpass form</div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 font-bold mx-auto flex items-center justify-center mb-1 text-[11px]">2</span>
            <div className="font-bold text-slate-900 dark:text-white">Warden Review</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">Accept or Reject</div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold mx-auto flex items-center justify-center mb-1 text-[11px]">3</span>
            <div className="font-bold text-slate-900 dark:text-white">Auto Forward</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">Sent to Chief Warden</div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 font-bold mx-auto flex items-center justify-center mb-1 text-[11px]">4</span>
            <div className="font-bold text-slate-900 dark:text-white">Chief Approval</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">Final decision authority</div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 font-bold mx-auto flex items-center justify-center mb-1 text-[11px]">5</span>
            <div className="font-bold text-slate-900 dark:text-white">Digital Pass Issued</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">QR Code Gate Entry</div>
          </div>

        </div>
      </div>

      {/* STUDENT OUTPASS FORM MODAL / COLLAPSIBLE */}
      {showApplyForm && user?.role === 'Student' && (
        <div className="bg-white dark:bg-slate-900 border-2 border-brand-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">Official Outpass Request Form</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Complete all details. Your request will be forwarded immediately to your Floor Warden.</p>
            </div>
            <button 
              onClick={() => setShowApplyForm(false)}
              className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              ✕ Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Row 1: Student info */}
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
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Department</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Year & Branch</label>
                <input
                  type="text"
                  value={`${form.year} - ${form.branch}`}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Row 2: Hostel, Room, Section & Guardian Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Section</label>
                <input
                  type="text"
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Guardian Phone Number *</label>
                <input
                  type="tel"
                  value={form.guardianPhone}
                  onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                  required
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none"
                />
              </div>
            </div>

            {/* Row 3: Warden Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-1 lg:col-span-2">
                <label className="block text-[11px] font-semibold text-brand-600 uppercase mb-1">Choose Your Warden *</label>
                <select
                  value={form.selectedWardenId}
                  onChange={(e) => setForm({ ...form, selectedWardenId: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-brand-50 border border-brand-200 rounded-xl text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">-- Select Your Floor Warden --</option>
                  {wardensList.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.assignedHostel || 'Any'} - Floor {w.assignedFloor || 'Any'})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">This will send your request directly to this warden.</p>
              </div>
            </div>

            {/* Row 3: Timings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Out Time (Departure Date & Time) *</label>
                <input
                  type="datetime-local"
                  value={form.outTime}
                  onChange={(e) => setForm({ ...form, outTime: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">In Time (Expected Return Date & Time) *</label>
                <input
                  type="datetime-local"
                  value={form.inTime}
                  onChange={(e) => setForm({ ...form, inTime: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none"
                />
              </div>
            </div>

            {/* Row 4: Purpose */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Purpose of Leaving Hostel *</label>
              <textarea
                rows={3}
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                required
                placeholder="Detail the specific purpose (e.g. Attending sister marriage in hometown, Medical doctor appointment at Apollo, Weekend home visit)..."
                className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowApplyForm(false)}
                className="px-4 py-2.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25 flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Outpass Request'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search outpasses by student, ID, purpose..."
            className="w-full pl-9 pr-4 py-2 bg-[#F5F7FB] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'ALL' ? 'bg-brand-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All ({outpasses.length})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'PENDING' ? 'bg-amber-600 text-slate-900 dark:text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Pending ({outpasses.filter(o => o.finalStatus.includes('PENDING')).length})
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Approved ({outpasses.filter(o => o.finalStatus === 'APPROVED').length})
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'REJECTED' ? 'bg-rose-600 text-slate-900 dark:text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Rejected ({outpasses.filter(o => o.finalStatus === 'REJECTED').length})
          </button>
        </div>

      </div>

      {/* OUTPASSES TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 bg-[#F5F7FB]/40 rounded-2xl">
            No outpass records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Pass ID</th>
                  <th className="py-3 px-4">Student & Hostel</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Timings (Out / In)</th>
                  <th className="py-3 px-4">Status & Approvals</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-700 dark:text-slate-200">
                {filtered.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600">
                      {op.outpassNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{op.studentName}</div>
                      <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{op.registrationNumber}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">{op.hostel}, Room {op.roomNumber}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="line-clamp-2 italic text-slate-600 dark:text-slate-300">"{op.purpose}"</p>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">Guardian: {op.guardianPhone}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-[11px]">Out: <strong className="text-amber-600">{new Date(op.outTime).toLocaleDateString()}</strong></div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">In: <strong className="text-emerald-600">{new Date(op.inTime).toLocaleDateString()}</strong></div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="mb-1">
                        <StatusBadge status={op.finalStatus} />
                      </div>
                      {op.finalStatus === 'APPROVED' && (
                        <div className="text-[10px] text-emerald-600 font-medium">
                          ✓ CW: {op.chiefWardenName || 'Approved'}
                        </div>
                      )}
                      {op.finalStatus === 'REJECTED' && (
                        <div className="text-[10px] text-rose-400 font-medium max-w-xs truncate">
                          Reason: {op.rejectionReason}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        
                        {/* Floor Warden Action */}
                        {user?.role === 'Floor Warden' && op.finalStatus === 'PENDING_WARDEN_APPROVAL' && (
                          <>
                            <button
                              onClick={() => setReviewModal({ isOpen: true, outpass: op, roleType: 'warden', action: 'ACCEPT', remarks: 'Verified with parent. Recommended.', rejectionReason: '' })}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => setReviewModal({ isOpen: true, outpass: op, roleType: 'warden', action: 'REJECT', remarks: '', rejectionReason: 'Attendance shortage.' })}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/40"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* Chief/Deputy Chief Warden Action */}
                        {(user?.role === 'Chief Warden' || user?.role === 'Deputy Chief Warden') && op.finalStatus === 'PENDING_CHIEF_APPROVAL' && (
                          <>
                            <button
                              onClick={() => setReviewModal({ isOpen: true, outpass: op, roleType: 'chief', action: 'APPROVE', remarks: 'Final approval granted.', rejectionReason: '' })}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-slate-900 dark:text-white"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setReviewModal({ isOpen: true, outpass: op, roleType: 'chief', action: 'REJECT', remarks: '', rejectionReason: 'Denied.' })}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/40"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* Approved Digital Pass Trigger for all authorized viewers */}
                        {op.finalStatus === 'APPROVED' && (
                          <button
                            onClick={() => setSelectedPass(op)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Digital Pass
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DECISION MODAL FOR WARDEN & CHIEF WARDEN */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              {reviewModal.action.includes('ACCEPT') || reviewModal.action.includes('APPROVE') ? 'Approve / Forward Outpass' : 'Reject Outpass'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              Student: <strong className="text-slate-900 dark:text-white">{reviewModal.outpass?.studentName}</strong> ({reviewModal.outpass?.registrationNumber})
            </p>

            <form onSubmit={handleDecision} className="space-y-4">
              {reviewModal.action.includes('ACCEPT') || reviewModal.action.includes('APPROVE') ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Remarks / Recommendation Notes</label>
                  <textarea
                    rows={3}
                    value={reviewModal.remarks}
                    onChange={(e) => setReviewModal({ ...reviewModal, remarks: e.target.value })}
                    className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    placeholder="Enter approval remarks..."
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-rose-300 mb-1">Rejection Reason *</label>
                  <textarea
                    rows={3}
                    value={reviewModal.rejectionReason}
                    onChange={(e) => setReviewModal({ ...reviewModal, rejectionReason: e.target.value })}
                    className="w-full p-2.5 bg-[#F5F7FB] border border-rose-500/50 rounded-xl text-xs text-slate-900 dark:text-white"
                    placeholder="Enter rejection reason..."
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModal({ isOpen: false, outpass: null, roleType: 'warden', action: 'ACCEPT', remarks: '', rejectionReason: '' })}
                  className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500"
                >
                  Submit Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Pass Modal */}
      {selectedPass && (
        <DigitalOutpassModal
          isOpen={!!selectedPass}
          onClose={() => setSelectedPass(null)}
          outpass={selectedPass}
        />
      )}

    </div>
  );
}

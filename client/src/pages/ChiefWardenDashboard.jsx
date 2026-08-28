import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Ticket, 
  Building, 
  Users, 
  MessageSquareWarning, 
  PhoneCall, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  PieChart, 
  ArrowRight,
  Sparkles,
  Printer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { statsApi, outpassApi, complaintApi, callBoothApi } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { DigitalOutpassModal } from '../components/DigitalOutpassModal';
import { useNotifications } from '../context/NotificationContext';
import confetti from 'canvas-confetti';

export function ChiefWardenDashboard({ setCurrentTab }) {
  const { user } = useAuth();
  const { showToast, fetchNotifications } = useNotifications();

  const [statsData, setStatsData] = useState(null);
  const [outpasses, setOutpasses] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chief Approval Modal
  const [chiefReviewModal, setChiefReviewModal] = useState({ isOpen: false, outpass: null, action: 'APPROVE', remarks: '', rejectionReason: '' });
  const [complaintModal, setComplaintModal] = useState({ isOpen: false, complaint: null, status: 'In Progress', response: '' });
  const [selectedPass, setSelectedPass] = useState(null);

  const loadAll = async () => {
    try {
      const [statsRes, outpassRes, complaintRes, callRes] = await Promise.all([
        statsApi.getOverview(),
        outpassApi.getAll(),
        complaintApi.getAll(),
        callBoothApi.getAll()
      ]);
      setStatsData(statsRes);
      setOutpasses(outpassRes.outpasses || []);
      setComplaints(complaintRes.complaints || []);
      setCalls(callRes.requests || []);
    } catch (err) {
      console.error('Failed to load Chief Warden dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [user?.id]);

  const handleChiefApproval = async (e) => {
    e.preventDefault();
    const { outpass, action, remarks, rejectionReason } = chiefReviewModal;
    try {
      const res = await outpassApi.chiefReview(outpass.id, action, remarks, rejectionReason);
      showToast(res.message, action === 'APPROVE' ? 'success' : 'info', 'Chief Warden Decision');
      setChiefReviewModal({ isOpen: false, outpass: null, action: 'APPROVE', remarks: '', rejectionReason: '' });
      fetchNotifications();
      loadAll();
      if (action === 'APPROVE') {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.5 } });
      }
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const handleComplaintReply = async (e) => {
    e.preventDefault();
    const { complaint, status, response } = complaintModal;
    try {
      await complaintApi.respond(complaint.id, status, response);
      showToast('Chief Warden response recorded', 'success');
      setComplaintModal({ isOpen: false, complaint: null, status: 'In Progress', response: '' });
      fetchNotifications();
      loadAll();
    } catch (err) {
      alert(err.message || 'Response failed');
    }
  };

  const pendingChiefApprovals = outpasses.filter(o => o.finalStatus === 'PENDING_CHIEF_APPROVAL');
  const stats = statsData?.stats || {};

  return (
    <div className="space-y-6">
      
      {/* 1. CHIEF WARDEN WELCOME BANNER */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-white to-indigo-950 border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 border border-purple-300/30 flex items-center justify-center text-slate-900 dark:text-white text-2xl font-black shadow-lg shadow-purple-500/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  CHIEF WARDEN PORTAL
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">Head of Residence & Student Welfare</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-['Outfit']">{user?.name}</h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                Final approval authority for Outpasses, campus hostel oversight, warden administration & high-level complaints.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('wardens')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 transition-colors"
            >
              Manage Wardens
            </button>
            <button
              onClick={() => setCurrentTab('hostels')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-slate-900 dark:text-white transition-colors"
            >
              Hostel Occupancy
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-500/30 shadow-lg cursor-pointer hover:border-purple-500 transition-all" onClick={() => setCurrentTab('hostels')}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Hostels</span>
            <Building className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-['Outfit']">{statsData?.hostelsSummary?.totalHostels || 0}</div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{statsData?.hostelsSummary?.occupiedBeds || 0} beds occupied</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Students</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-['Outfit']">{stats.totalStudents || 0}</div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Enrolled students</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-500/30 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Final Outpass Approvals</span>
            <Ticket className="w-4 h-4 text-purple-400 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-['Outfit']">{pendingChiefApprovals.length}</div>
          <p className="text-[11px] text-purple-400 mt-1">Warden-recommended queue</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Residents</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-['Outfit']">{stats.totalStudents || 0}</div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Enrolled students</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hostels & Occupancy</span>
            <Building className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-2 font-['Outfit']">{stats.occupancyRate || 0}%</div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{stats.totalOccupancy || 0} / {stats.totalCapacity || 0} beds filled</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Emergency Calls</span>
            <PhoneCall className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-3xl font-black text-red-600 mt-2 font-['Outfit']">{stats.activeEmergencyRequests || 0}</div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Active emergency tickets</p>
        </div>

      </div>

      {/* 3. STEP 4: CHIEF WARDEN FINAL OUTPASS APPROVAL QUEUE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Step 4: Pending Chief Warden Approvals ({pendingChiefApprovals.length})
            </h3>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">✓ Already verified & accepted by Floor Warden</span>
        </div>

        {pendingChiefApprovals.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 bg-[#F5F7FB]/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            ✓ No outpasses currently waiting for Chief Warden final approval.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Pass ID</th>
                  <th className="py-3 px-4">Student & Hostel</th>
                  <th className="py-3 px-4">Warden Recommendation</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Timings</th>
                  <th className="py-3 px-4">Guardian Contact</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-700 dark:text-slate-200">
                {pendingChiefApprovals.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-50/30">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-300">{op.outpassNumber}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{op.studentName}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">{op.hostel}, Room {op.roomNumber} ({op.department})</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-[11px] text-emerald-600 font-semibold">✓ {op.wardenName}</div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 italic truncate">"{op.wardenRemarks}"</p>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs text-slate-600 dark:text-slate-300 italic">
                      "{op.purpose}"
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-[11px]">Out: {new Date(op.outTime).toLocaleDateString()}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">In: {new Date(op.inTime).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{op.guardianPhone}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setChiefReviewModal({ isOpen: true, outpass: op, action: 'APPROVE', remarks: 'Final approval granted. Permitted.', rejectionReason: '' })}
                          className="px-3.5 py-1.5 rounded-lg font-bold text-xs bg-purple-600 hover:bg-purple-500 text-slate-900 dark:text-white transition-colors cursor-pointer"
                        >
                          Approve Pass
                        </button>
                        <button
                          onClick={() => setChiefReviewModal({ isOpen: true, outpass: op, action: 'REJECT', remarks: '', rejectionReason: 'Denied due to university guidelines.' })}
                          className="px-3 py-1.5 rounded-lg font-bold text-xs bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. CHIEF WARDEN COMPLAINTS & EMERGENCY OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Complaints Addressed to Chief Warden */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquareWarning className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Chief Warden Complaints Inbox</h3>
            </div>
          </div>

          <div className="space-y-3">
            {complaints.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">No complaints submitted to Chief Warden.</p>
            ) : (
              complaints.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{c.studentName}</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-2">({c.hostel}, Room {c.roomNumber})</span>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic mb-2">"{c.description}"</p>
                  
                  {c.response ? (
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 text-[11px] text-purple-300 mb-2">
                      <strong>Chief Warden Response:</strong> {c.response}
                    </div>
                  ) : null}

                  <button
                    onClick={() => setComplaintModal({ isOpen: true, complaint: c, status: c.status, response: c.response || '' })}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 underline"
                  >
                    {c.response ? 'Edit Response' : 'Reply to Student'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* All Active Emergency Call Requests */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Campus Emergency & Call Booth Hub</h3>
            </div>
          </div>

          <div className="space-y-3">
            {calls.slice(0, 4).map((call) => (
              <div key={call.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-red-600 text-xs">{call.category} ➔ {call.destination}</span>
                  <StatusBadge status={call.status} />
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">
                  {call.studentName} • {call.hostel}, Room {call.roomNumber}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic mb-1.5">"{call.description}"</p>
                <div className="text-[11px] text-slate-400 dark:text-slate-500">Assigned: <strong className="text-slate-700 dark:text-slate-200">{call.assignedTo}</strong></div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* MODAL 1: CHIEF WARDEN APPROVAL MODAL */}
      {chiefReviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-purple-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              {chiefReviewModal.action === 'APPROVE' ? 'Final Permission: Approve Outpass' : 'Reject Outpass'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              Student: <strong className="text-slate-900 dark:text-white">{chiefReviewModal.outpass?.studentName}</strong> • Purpose: "{chiefReviewModal.outpass?.purpose}"
            </p>

            <form onSubmit={handleChiefApproval} className="space-y-4">
              {chiefReviewModal.action === 'APPROVE' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Chief Warden Remarks / Approval Notes</label>
                  <textarea
                    rows={3}
                    value={chiefReviewModal.remarks}
                    onChange={(e) => setChiefReviewModal({ ...chiefReviewModal, remarks: e.target.value })}
                    className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    placeholder="e.g. Final approval granted for requested dates. Safe travels."
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-rose-300 mb-1">Rejection Reason *</label>
                  <textarea
                    rows={3}
                    value={chiefReviewModal.rejectionReason}
                    onChange={(e) => setChiefReviewModal({ ...chiefReviewModal, rejectionReason: e.target.value })}
                    className="w-full p-2.5 bg-[#F5F7FB] border border-rose-500/50 rounded-xl text-xs text-slate-900 dark:text-white"
                    placeholder="Provide reason for rejection..."
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setChiefReviewModal({ isOpen: false, outpass: null, action: 'APPROVE', remarks: '', rejectionReason: '' })}
                  className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white ${
                    chiefReviewModal.action === 'APPROVE' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Confirm {chiefReviewModal.action === 'APPROVE' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPLAINT REPLY */}
      {complaintModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-purple-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Chief Warden Response</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">"{complaintModal.complaint?.description}"</p>

            <form onSubmit={handleComplaintReply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={complaintModal.status}
                  onChange={(e) => setComplaintModal({ ...complaintModal, status: e.target.value })}
                  className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  <option value="Received">Received</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Official Response</label>
                <textarea
                  rows={3}
                  value={complaintModal.response}
                  onChange={(e) => setComplaintModal({ ...complaintModal, response: e.target.value })}
                  className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  placeholder="Type official Chief Warden resolution..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setComplaintModal({ isOpen: false, complaint: null, status: 'In Progress', response: '' })}
                  className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white bg-purple-600 hover:bg-purple-500"
                >
                  Submit Official Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Outpass View */}
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

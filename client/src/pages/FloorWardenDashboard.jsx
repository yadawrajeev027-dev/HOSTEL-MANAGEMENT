import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Ticket, 
  MessageSquareWarning, 
  PhoneCall, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Check, 
  X, 
  ArrowRight,
  Send,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { outpassApi, complaintApi, callBoothApi, statsApi } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { useNotifications } from '../context/NotificationContext';
import confetti from 'canvas-confetti';

export function FloorWardenDashboard({ setCurrentTab }) {
  const { user } = useAuth();
  const { showToast, fetchNotifications } = useNotifications();
  
  const [statsData, setStatsData] = useState(null);
  const [outpasses, setOutpasses] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [reviewModal, setReviewModal] = useState({ isOpen: false, outpass: null, action: 'ACCEPT', remarks: '', rejectionReason: '' });
  const [complaintModal, setComplaintModal] = useState({ isOpen: false, complaint: null, status: 'In Progress', response: '' });
  const [callModal, setCallModal] = useState({ isOpen: false, call: null, status: 'Resolved', resolution: '' });

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
      console.error('Failed to load floor warden dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [user?.id]);

  const handleWardenReview = async (e) => {
    e.preventDefault();
    const { outpass, action, remarks, rejectionReason } = reviewModal;
    try {
      const res = await outpassApi.wardenReview(outpass.id, action, remarks, rejectionReason);
      showToast(res.message, action === 'ACCEPT' ? 'success' : 'info');
      setReviewModal({ isOpen: false, outpass: null, action: 'ACCEPT', remarks: '', rejectionReason: '' });
      fetchNotifications();
      loadAll();
      if (action === 'ACCEPT') confetti({ particleCount: 50, spread: 50 });
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const handleComplaintResponse = async (e) => {
    e.preventDefault();
    const { complaint, status, response } = complaintModal;
    try {
      const res = await complaintApi.respond(complaint.id, status, response);
      showToast('Response sent to student successfully', 'success');
      setComplaintModal({ isOpen: false, complaint: null, status: 'In Progress', response: '' });
      fetchNotifications();
      loadAll();
    } catch (err) {
      alert(err.message || 'Response failed');
    }
  };

  const handleCallResolution = async (e) => {
    e.preventDefault();
    const { call, status, resolution } = callModal;
    try {
      const res = await callBoothApi.updateStatus(call.id, status, resolution);
      showToast('Call ticket updated successfully', 'success');
      setCallModal({ isOpen: false, call: null, status: 'Resolved', resolution: '' });
      fetchNotifications();
      loadAll();
    } catch (err) {
      alert(err.message || 'Update failed');
    }
  };

  const pendingOutpasses = outpasses.filter(o => o.finalStatus === 'PENDING_WARDEN_APPROVAL');

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              FLOOR WARDEN PORTAL
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{user?.assignedHostel} • {user?.assignedFloor}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-['Outfit']">{user?.name}</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Review outpasses, floor complaints, and emergency issues.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTab('students')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors"
          >
            Floor Directory
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Pending Outpasses</div>
          <div className="text-2xl font-black text-amber-600 mt-1 font-['Outfit']">{pendingOutpasses.length}</div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Require your review</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Floor Complaints</div>
          <div className="text-2xl font-black text-cyan-600 mt-1 font-['Outfit']">{complaints.length}</div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Targeted to Floor Warden</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Active Call Issues</div>
          <div className="text-2xl font-black text-red-600 mt-1 font-['Outfit']">{calls.filter(c => c.status !== 'Resolved').length}</div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Emergency alerts</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Floor Students</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-['Outfit']">{statsData?.stats?.totalStudents || 0}</div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Assigned resident pool</p>
        </div>
      </div>

      {/* SECTION 1: PENDING OUTPASS APPROVAL QUEUE (Step 2 of Workflow) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Step 2: Pending Outpass Review Queue ({pendingOutpasses.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Accepted requests will forward to Chief Warden</span>
        </div>

        {pendingOutpasses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 bg-[#F5F7FB]/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            ✓ No pending outpasses awaiting your review. All clear!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student & Reg No</th>
                  <th className="py-3 px-4">Hostel / Room</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Out & In Timings</th>
                  <th className="py-3 px-4">Guardian Phone</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-700 dark:text-slate-200">
                {pendingOutpasses.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-50/30">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{op.studentName}</div>
                      <div className="font-mono text-[11px] text-brand-600">{op.registrationNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      {op.hostel} <br />
                      <span className="text-slate-400 dark:text-slate-500">Room #{op.roomNumber} ({op.floor})</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="line-clamp-2 text-slate-600 dark:text-slate-300 italic">"{op.purpose}"</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-[11px]">Out: {new Date(op.outTime).toLocaleDateString()}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">In: {new Date(op.inTime).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{op.guardianPhone}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setReviewModal({ isOpen: true, outpass: op, action: 'ACCEPT', remarks: 'Verified with parent. Recommended.', rejectionReason: '' })}
                          className="px-3 py-1.5 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => setReviewModal({ isOpen: true, outpass: op, action: 'REJECT', remarks: '', rejectionReason: 'Attendance shortage or disciplinary rule.' })}
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

      {/* SECTION 2: FLOOR COMPLAINTS & CALL BOOTH ISSUES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Complaints Assigned Specifically to Floor Warden */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquareWarning className="w-5 h-5 text-cyan-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Floor Complaints ({complaints.length})</h3>
            </div>
          </div>

          <div className="space-y-3">
            {complaints.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">No complaints submitted to Floor Warden.</p>
            ) : (
              complaints.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{c.studentName}</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-2">Room {c.roomNumber}</span>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic mb-2">"{c.description}"</p>
                  
                  {c.response ? (
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 text-[11px] text-brand-600 mb-2">
                      <strong>Response:</strong> {c.response}
                    </div>
                  ) : null}

                  <button
                    onClick={() => setComplaintModal({ isOpen: true, complaint: c, status: c.status, response: c.response || '' })}
                    className="text-xs font-semibold text-cyan-600 hover:text-cyan-600 underline"
                  >
                    {c.response ? 'Edit Response' : 'Reply & Update Status'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Call Booth Emergency Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Emergency / Call Booth Issues</h3>
            </div>
          </div>

          <div className="space-y-3">
            {calls.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">No active emergency calls.</p>
            ) : (
              calls.map((call) => (
                <div key={call.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-red-600 text-xs">{call.category}</span>
                    <StatusBadge status={call.status} />
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">
                    {call.studentName} ({call.hostel}, Room {call.roomNumber})
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic mb-2">"{call.description}"</p>
                  
                  <button
                    onClick={() => setCallModal({ isOpen: true, call, status: call.status, resolution: call.resolution || '' })}
                    className="text-xs font-semibold text-red-600 hover:text-red-600 underline"
                  >
                    Update Resolution Status
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* MODAL 1: WARDEN OUTPASS ACCEPT/REJECT MODAL */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              {reviewModal.action === 'ACCEPT' ? 'Accept & Forward Outpass' : 'Reject Outpass'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              Student: <strong className="text-slate-900 dark:text-white">{reviewModal.outpass?.studentName}</strong> ({reviewModal.outpass?.registrationNumber})
            </p>

            <form onSubmit={handleWardenReview} className="space-y-4">
              {reviewModal.action === 'ACCEPT' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Warden Recommendation / Remarks</label>
                  <textarea
                    rows={3}
                    value={reviewModal.remarks}
                    onChange={(e) => setReviewModal({ ...reviewModal, remarks: e.target.value })}
                    className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    placeholder="e.g. Verified with parent. Recommended for Chief Warden approval."
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
                    placeholder="e.g. Attendance below 75% threshold. Denied as per hostel rules."
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModal({ isOpen: false, outpass: null, action: 'ACCEPT', remarks: '', rejectionReason: '' })}
                  className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white ${
                    reviewModal.action === 'ACCEPT' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Confirm {reviewModal.action === 'ACCEPT' ? 'Acceptance' : 'Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPLAINT REPLY MODAL */}
      {complaintModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Respond to Complaint</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              "{complaintModal.complaint?.description}"
            </p>

            <form onSubmit={handleComplaintResponse} className="space-y-4">
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
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Response Message</label>
                <textarea
                  rows={3}
                  value={complaintModal.response}
                  onChange={(e) => setComplaintModal({ ...complaintModal, response: e.target.value })}
                  className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  placeholder="Type your response to the student..."
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
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white bg-sky-600 hover:bg-sky-500"
                >
                  Submit Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CALL RESOLUTION MODAL */}
      {callModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Update Emergency Call Status</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              Category: <strong className="text-red-600">{callModal.call?.category}</strong> - "{callModal.call?.description}"
            </p>

            <form onSubmit={handleCallResolution} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={callModal.status}
                  onChange={(e) => setCallModal({ ...callModal, status: e.target.value })}
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
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Resolution Notes</label>
                <textarea
                  rows={3}
                  value={callModal.resolution}
                  onChange={(e) => setCallModal({ ...callModal, resolution: e.target.value })}
                  className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  placeholder="Detail the action taken to resolve this issue..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCallModal({ isOpen: false, call: null, status: 'Resolved', resolution: '' })}
                  className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

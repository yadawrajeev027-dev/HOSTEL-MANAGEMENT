import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  MessageSquareWarning, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { complaintApi, studentApi, statsApi } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { useNotifications } from '../context/NotificationContext';

export function DepartmentWardenDashboard({ setCurrentTab }) {
  const { user } = useAuth();
  const { showToast, fetchNotifications } = useNotifications();

  const [statsData, setStatsData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [complaintModal, setComplaintModal] = useState({ isOpen: false, complaint: null, status: 'In Progress', response: '' });

  const loadAll = async () => {
    try {
      const [statsRes, complaintRes, studentRes] = await Promise.all([
        statsApi.getOverview(),
        complaintApi.getAll(),
        studentApi.getAll({ department: user?.assignedDepartment })
      ]);
      setStatsData(statsRes);
      setComplaints(complaintRes.complaints || []);
      setStudents(studentRes.students || []);
    } catch (err) {
      console.error('Failed to load Department Warden dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [user?.id]);

  const handleComplaintReply = async (e) => {
    e.preventDefault();
    const { complaint, status, response } = complaintModal;
    try {
      await complaintApi.respond(complaint.id, status, response);
      showToast('Response submitted to student', 'success');
      setComplaintModal({ isOpen: false, complaint: null, status: 'In Progress', response: '' });
      fetchNotifications();
      loadAll();
    } catch (err) {
      alert(err.message || 'Response failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              DEPARTMENT WARDEN PORTAL
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{user?.assignedDepartment}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-['Outfit']">{user?.name}</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Manage department academic-hostel grievances and student affairs.</p>
        </div>

        <button
          onClick={() => setCurrentTab('students')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors"
        >
          View Department Students ({students.length})
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Department Residents</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-['Outfit']">{students.length}</div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Enrolled in {user?.assignedDepartment || 'CSE'}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Active Dept Complaints</span>
          <div className="text-2xl font-black text-cyan-400 mt-1 font-['Outfit']">
            {complaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Targeted to Department Warden</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Resolved Inquiries</span>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-['Outfit']">
            {complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Successfully closed</p>
        </div>
      </div>

      {/* Complaints Directed to Department Warden */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Department Complaints Inbox ({complaints.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Strictly isolated to {user?.assignedDepartment}</span>
        </div>

        <div className="space-y-3">
          {complaints.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-8 text-center bg-[#F5F7FB]/40 rounded-2xl">
              ✓ No complaints currently addressed to Department Warden.
            </p>
          ) : (
            complaints.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">{c.studentName}</span>
                    <span className="font-mono text-[11px] text-cyan-400 ml-2">({c.registrationNumber})</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-2">• {c.hostel}, Room {c.roomNumber}</span>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic mb-2">"{c.description}"</p>
                
                {c.response && (
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-cyan-300 mb-2">
                    <strong>Your Response:</strong> {c.response}
                  </div>
                )}

                <button
                  onClick={() => setComplaintModal({ isOpen: true, complaint: c, status: c.status, response: c.response || '' })}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline"
                >
                  {c.response ? 'Edit Response' : 'Reply & Update Status'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Response Modal */}
      {complaintModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Department Warden Response</h3>
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
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Response</label>
                <textarea
                  rows={3}
                  value={complaintModal.response}
                  onChange={(e) => setComplaintModal({ ...complaintModal, response: e.target.value })}
                  className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  placeholder="Type department response..."
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
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white bg-cyan-600 hover:bg-cyan-500"
                >
                  Save Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

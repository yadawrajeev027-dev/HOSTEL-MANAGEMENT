import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Phone, 
  Mail, 
  Building, 
  User, 
  Shield, 
  Trash2, 
  Edit3,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { wardenApi, hostelApi } from '../api';
import { useNotifications } from '../context/NotificationContext';

export function WardensListPage() {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [wardens, setWardens] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: 'password123',
    role: 'Floor Warden',
    designation: 'Floor Warden',
    phone: '+91 ',
    email: '',
    assignedHostel: '',
    assignedFloor: '',
    assignedDepartment: ''
  });

  const loadWardens = async () => {
    try {
      const res = await wardenApi.getAll();
      setWardens(res.wardens || []);
      const hRes = await hostelApi.getAll();
      setHostels(hRes.hostels || []);
    } catch (err) {
      console.error('Failed to load wardens:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWardens();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await wardenApi.create(formData);
      showToast(res.message, 'success');
      setShowAddModal(false);
      loadWardens();
    } catch (err) {
      alert(err.message || 'Failed to add warden');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this warden account?')) return;
    try {
      await wardenApi.delete(id);
      showToast('Warden removed', 'info');
      loadWardens();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">WARDENS MANAGEMENT</h1>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Chief Warden administration of Floor Wardens, Department Wardens, and Deputy Chief Wardens.
          </p>
        </div>

        {user?.role === 'Chief Warden' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-slate-900 dark:text-white shadow-lg shadow-purple-600/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Warden
          </button>
        )}
      </div>

      {/* Wardens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {wardens.map((w) => (
          <div
            key={w.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/30 rounded-3xl p-6 shadow-xl space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-lg">
                  {w.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{w.name}</h3>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    {w.role}
                  </span>
                </div>
              </div>

              {user?.role === 'Chief Warden' && w.id !== user.id && (
                <button
                  onClick={() => handleDelete(w.id)}
                  className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Remove Warden"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400 dark:text-slate-500">Username</span>
                <span className="font-mono text-brand-600 font-bold">{w.username}</span>
              </div>

              {w.assignedHostel && (
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500">Hostel / Floor</span>
                  <span className="text-slate-900 dark:text-white font-medium">{w.assignedHostel} ({w.assignedFloor})</span>
                </div>
              )}

              {w.assignedDepartment && (
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500">Department</span>
                  <span className="text-slate-900 dark:text-white font-medium">{w.assignedDepartment}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400 dark:text-slate-500">Contact</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">{w.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>{w.email || `${w.username}@college.edu`}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ADD WARDEN MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-purple-500/40 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 font-['Outfit']">Add New Warden Account</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Create warden credentials and assign responsibilities.</p>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. Dr. Anand Verma"
                  className="w-full p-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
                >
                  <option value="Floor Warden">Floor Warden</option>
                  <option value="Department Warden">Department Warden</option>
                  <option value="Deputy Chief Warden">Deputy Chief Warden</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    placeholder="e.g. fw_b4"
                    className="w-full p-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="w-full p-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {formData.role === 'Floor Warden' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Assigned Hostel</label>
                    <select
                      value={formData.assignedHostel}
                      onChange={(e) => setFormData({ ...formData, assignedHostel: e.target.value, assignedFloor: '' })}
                      className="w-full p-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">Select Hostel</option>
                      {hostels.map(h => (
                        <option key={h.id} value={h.name}>{h.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Floor</label>
                    <select
                      value={formData.assignedFloor}
                      onChange={(e) => setFormData({ ...formData, assignedFloor: e.target.value })}
                      disabled={!formData.assignedHostel}
                      className="w-full p-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white disabled:opacity-50"
                    >
                      <option value="">Select Floor</option>
                      {formData.assignedHostel && hostels.find(h => h.name === formData.assignedHostel)?.totalFloors > 0 && 
                        Array.from({ length: hostels.find(h => h.name === formData.assignedHostel).totalFloors }, (_, i) => i + 1).map(floorNum => (
                          <option key={floorNum} value={`${floorNum}${['st','nd','rd'][((floorNum+90)%100-10)%10-1]||'th'} Floor`}>
                            {floorNum}{['st','nd','rd'][((floorNum+90)%100-10)%10-1]||'th'} Floor
                          </option>
                        ))
                      }
                    </select>
                  </div>
                </div>
              )}

              {formData.role === 'Department Warden' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.assignedDepartment}
                    onChange={(e) => setFormData({ ...formData, assignedDepartment: e.target.value })}
                    placeholder="e.g. Mechanical Engineering"
                    className="w-full p-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white bg-purple-600 hover:bg-purple-500"
                >
                  Create Warden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

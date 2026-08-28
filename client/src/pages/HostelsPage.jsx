import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Users, 
  Bed, 
  Shield, 
  Plus,
  Settings,
  Eye,
  Edit,
  Power,
  Trash2
} from 'lucide-react';
import { hostelApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export function HostelsPage({ setCurrentTab, setSelectedHostelId }) {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [hostels, setHostels] = useState([]);
  const [allocationRules, setAllocationRules] = useState({});
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  
  // Forms
  const [formData, setFormData] = useState({
    name: '', type: 'Boys', totalFloors: '', roomsPerFloor: '', roomCapacity: '', capacity: '', totalBeds: '', description: '', wardenName: '', wardenUsername: '', wardenPhone: '', status: 'Active'
  });
  const [editId, setEditId] = useState(null);

  const handleFieldChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    // Auto-calculate capacity and totalBeds if the 3 variables exist
    const floors = parseInt(newData.totalFloors) || 0;
    const rooms = parseInt(newData.roomsPerFloor) || 0;
    const cap = parseInt(newData.roomCapacity) || 0;
    
    if (floors > 0 && rooms > 0 && cap > 0) {
      const total = floors * rooms * cap;
      newData.capacity = total;
      newData.totalBeds = total;
    }
    
    setFormData(newData);
  };

  const [rulesDraft, setRulesDraft] = useState({
    '1st Year': '', '2nd Year': '', '3rd Year': '', '4th Year': ''
  });

  const loadData = async () => {
    try {
      const res = await hostelApi.getAll();
      setHostels(res.hostels || []);
      
      const rRes = await hostelApi.getAllocationRules();
      setAllocationRules(rRes.rules || {});
      setRulesDraft({
        '1st Year': rRes.rules['1st Year'] || '',
        '2nd Year': rRes.rules['2nd Year'] || '',
        '3rd Year': rRes.rules['3rd Year'] || '',
        '4th Year': rRes.rules['4th Year'] || ''
      });
    } catch (err) {
      console.error('Failed to load hostels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const res = await hostelApi.update(editId, formData);
        showToast(res.message, 'success');
        setShowEditModal(false);
      } else {
        const res = await hostelApi.create(formData);
        showToast(res.message, 'success');
        setShowAddModal(false);
      }
      setFormData({ name: '', type: 'Boys', capacity: '', totalBeds: '', totalFloors: '', description: '', wardenName: '', wardenUsername: '', wardenPhone: '', status: 'Active' });
      setEditId(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save hostel');
    }
  };

  const openEdit = (h) => {
    setFormData({
      name: h.name, type: h.type, totalFloors: h.totalFloors || '', roomsPerFloor: h.roomsPerFloor || '', roomCapacity: h.roomCapacity || '', capacity: h.capacity, totalBeds: h.totalBeds, description: h.description, wardenName: h.wardenName, wardenUsername: '', wardenPhone: '', status: h.status
    });
    setEditId(h.id);
    setShowEditModal(true);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await hostelApi.updateStatus(id, newStatus);
      showToast(`Hostel marked as ${newStatus}`, 'success');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete the hostel "${name}"? This will also delete all its associated rooms and beds. This action cannot be undone.`)) return;
    
    try {
      await hostelApi.delete(id);
      showToast('Hostel deleted successfully', 'success');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete hostel');
    }
  };

  const handleSaveRules = async (e) => {
    e.preventDefault();
    try {
      const res = await hostelApi.updateRules(rulesDraft);
      showToast(res.message, 'success');
      setShowRulesModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update rules');
    }
  };

  const viewDetails = (id) => {
    if (setSelectedHostelId) {
      setSelectedHostelId(id);
      setCurrentTab('hostel-details');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-6 h-6 text-brand-600" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">HOSTEL MANAGEMENT</h1>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Create and manage multiple hostels, assign wardens, and monitor capacities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user?.role === 'Deputy Chief Warden' && (
            <button
              onClick={() => setShowRulesModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-lg cursor-pointer transition-colors"
            >
              <Settings className="w-4 h-4" />
              Allocation Rules
            </button>
          )}

          {user?.role === 'Chief Warden' && (
            <button
              onClick={() => {
                setFormData({ name: '', type: 'Boys', totalFloors: '', roomsPerFloor: '', roomCapacity: '', capacity: '', totalBeds: '', description: '', wardenName: '', wardenUsername: '', wardenPhone: '', status: 'Active' });
                setEditId(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/25 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Hostel
            </button>
          )}
        </div>
      </div>

      {/* Hostels List */}
      {hostels.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/50">
          <Building className="w-12 h-12 text-slate-600 dark:text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No hostels added yet.</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">Start by creating your first hostel block.</p>
          {user?.role === 'Chief Warden' && (
            <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-brand-600 text-white font-bold text-sm rounded-xl">
              + Add New Hostel
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-[#F5F7FB] text-xs uppercase font-semibold text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Hostel</th>
                  <th className="px-6 py-4">Warden</th>
                  <th className="px-6 py-4 text-right">Capacity</th>
                  <th className="px-6 py-4 text-right">Beds</th>
                  <th className="px-6 py-4 text-right">Occupied</th>
                  <th className="px-6 py-4 text-right">Available</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {hostels.map(h => (
                  <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{h.name}</div>
                      <div className="text-[10px] text-brand-600 uppercase tracking-wider">{h.type} • {h.totalFloors} Floors</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700 dark:text-slate-200">{h.wardenName}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">{h.capacity}</td>
                    <td className="px-6 py-4 text-right font-mono">{h.totalBeds}</td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-600">{h.occupiedBeds}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-brand-600">{h.availableBeds}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        h.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-500/20' 
                          : 'bg-slate-500/10 text-slate-400 dark:text-slate-500 border-slate-500/20'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => viewDetails(h.id)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-brand-600 transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        {user?.role === 'Chief Warden' && (
                          <>
                            <button onClick={() => openEdit(h)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors" title="Edit Hostel">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleToggleStatus(h.id, h.status)} className={`p-1.5 transition-colors ${h.status === 'Active' ? 'text-slate-400 dark:text-slate-500 hover:text-amber-500' : 'text-slate-400 dark:text-slate-500 hover:text-emerald-600'}`} title={h.status === 'Active' ? 'Deactivate' : 'Activate'}>
                              <Power className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(h.id, h.name)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-500 transition-colors" title="Delete Hostel">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT HOSTEL MODAL --- */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-brand-500/40 rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl my-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 font-['Outfit']">
              {editId ? 'Edit Hostel Details' : 'Add New Hostel'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Hostel Details Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">Hostel Information</h4>
                  
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Hostel Name *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Block A" className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Hostel Type *</label>
                      <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white">
                        <option value="Boys">Boys Hostel</option>
                        <option value="Girls">Girls Hostel</option>
                        <option value="Co-ed">Other / Co-ed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Number of Floors *</label>
                      <input type="number" value={formData.totalFloors} onChange={(e) => handleFieldChange('totalFloors', e.target.value)} required min="1" placeholder="e.g. 5" className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Rooms per Floor *</label>
                      <input type="number" value={formData.roomsPerFloor} onChange={(e) => handleFieldChange('roomsPerFloor', e.target.value)} required min="1" placeholder="e.g. 10" className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Students per Room *</label>
                      <input type="number" value={formData.roomCapacity} onChange={(e) => handleFieldChange('roomCapacity', e.target.value)} required min="1" placeholder="e.g. 2" className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Total Capacity</label>
                      <input type="number" value={formData.capacity} readOnly className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-500 font-mono font-bold" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Total Number of Beds</label>
                      <input type="number" value={formData.totalBeds} readOnly className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-500 font-mono font-bold" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Hostel Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Warden Details Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">Assigned Warden</h4>
                  
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Warden Name *</label>
                    <input type="text" value={formData.wardenName} onChange={(e) => setFormData({ ...formData, wardenName: e.target.value })} required placeholder="e.g. Rahul Kumar" className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white" />
                  </div>

                  {!editId && (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Warden Username *</label>
                        <input type="text" value={formData.wardenUsername} onChange={(e) => setFormData({ ...formData, wardenUsername: e.target.value })} required placeholder="For warden login" className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Warden Contact Number *</label>
                        <input type="text" value={formData.wardenPhone} onChange={(e) => setFormData({ ...formData, wardenPhone: e.target.value })} required placeholder="+91" className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono" />
                      </div>
                      <div className="p-3 bg-brand-50 border border-brand-500/20 rounded-xl">
                        <p className="text-[10px] text-brand-200 leading-relaxed">
                          Saving this hostel will automatically create a Warden account for <strong>{formData.wardenName || 'this person'}</strong>. They can log in using the username above and the default password <code className="bg-black/30 px-1 rounded">username+123</code>.
                        </p>
                      </div>
                    </>
                  )}
                  {editId && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Warden Contact Number</label>
                      <input type="text" value={formData.wardenPhone} onChange={(e) => setFormData({ ...formData, wardenPhone: e.target.value })} placeholder="+91" className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono" />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Hostel Description (Optional)</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white resize-none" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/25 transition-colors">
                  Save Hostel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ALLOCATION RULES MODAL --- */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 font-['Outfit']">Hostel Allocation Rules</h3>
            <form onSubmit={handleSaveRules} className="space-y-3">
              {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(year => (
                <div key={year}>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">{year} Assignment</label>
                  <select value={rulesDraft[year] || ''} onChange={(e) => setRulesDraft({ ...rulesDraft, [year]: e.target.value })} className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white">
                    <option value="">-- No specific rule --</option>
                    {hostels.map(h => (<option key={h.id} value={h.name}>{h.name}</option>))}
                  </select>
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowRulesModal(false)} className="px-4 py-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white bg-emerald-400 hover:bg-emerald-300">Save Rules</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

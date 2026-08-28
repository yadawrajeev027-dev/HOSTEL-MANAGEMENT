import React, { useState } from 'react';
import { X } from 'lucide-react';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';

export function EditProfileModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    phone: user?.phone || '',
    email: user?.email || '',
    joiningDate: user?.joiningDate ? new Date(user.joiningDate).toISOString().split('T')[0] : '',
    gender: user?.gender || '',
    section: user?.section || '',
    year: user?.year || '',
    semester: user?.semester || '',
    fatherName: user?.fatherName || '',
    parentPhone: user?.parentPhone || ''
  });

  if (!isOpen) return null;

  const isStudent = user?.role === 'Student';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await authApi.updateProfile(form);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const renderLockedFields = () => {
    if (isStudent) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="opacity-50">
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1">Registration No</label>
            <input type="text" value={user?.registrationNumber || 'N/A'} disabled className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 dark:text-slate-500 cursor-not-allowed" />
          </div>
          <div className="opacity-50">
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1">Department & Branch</label>
            <input type="text" value={`${user?.department || 'N/A'} - ${user?.branch || 'N/A'}`} disabled className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 dark:text-slate-500 cursor-not-allowed" />
          </div>
          <div className="opacity-50">
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1">Hostel Allocation</label>
            <input type="text" value={`${user?.hostel || 'N/A'} - Room ${user?.roomNumber || 'N/A'}`} disabled className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 dark:text-slate-500 cursor-not-allowed" />
          </div>
        </div>
      );
    } else if (user?.role === 'Warden' || user?.role === 'Floor Warden') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="opacity-50">
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1">{user?.role} ID</label>
            <input type="text" value={user?.wardenId || user?.username || 'N/A'} disabled className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 dark:text-slate-500 cursor-not-allowed" />
          </div>
          <div className="opacity-50">
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1">Assigned Hostel</label>
            <input type="text" value={user?.assignedHostel || user?.hostel || 'N/A'} disabled className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 dark:text-slate-500 cursor-not-allowed" />
          </div>
          <div className="opacity-50">
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1">Assigned Area</label>
            <input type="text" value={`${user?.role === 'Floor Warden' ? `Floor ${user?.assignedFloor || 'N/A'}` : `Room ${user?.roomNumber || 'N/A'}`}`} disabled className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 dark:text-slate-500 cursor-not-allowed" />
          </div>
        </div>
      );
    } else if (user?.role === 'Chief Warden' || user?.role === 'Admin' || user?.role === 'Deputy Chief Warden') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="opacity-50">
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1">{user?.role} ID</label>
            <input type="text" value={user?.username || 'N/A'} disabled className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 dark:text-slate-500 cursor-not-allowed" />
          </div>
          <div className="opacity-50">
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1">Office / Venue</label>
            <input type="text" value={user?.office || 'Main Administration'} disabled className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 dark:text-slate-500 cursor-not-allowed" />
          </div>
          <div className="opacity-50">
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1">Role Type</label>
            <input type="text" value={user?.role} disabled className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 dark:text-slate-500 cursor-not-allowed" />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl w-full max-w-4xl my-auto shadow-2xl animate-fadeIn flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Outfit']">Edit Profile Information</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Update your personal details</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Read-Only Admin Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Administration Locked Fields</h3>
              {renderLockedFields()}
            </div>

            {/* Editable Fields (Student) */}
            {isStudent && (
              <>
                <div>
                  <h3 className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">Personal & Academic Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Contact Number *</label>
                      <input type="tel" required value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none" placeholder="+91" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Email ID *</label>
                      <input type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Joining Date *</label>
                      <input type="date" required value={form.joiningDate} onChange={(e) => setForm({...form, joiningDate: e.target.value})} className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Gender *</label>
                      <select required value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})} className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Section *</label>
                      <input type="text" required value={form.section} onChange={(e) => setForm({...form, section: e.target.value})} className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none" placeholder="e.g. A" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Year *</label>
                      <select required value={form.year} onChange={(e) => setForm({...form, year: e.target.value})} className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none">
                        <option value="">Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                        <option value="5">5th Year</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Semester *</label>
                      <select required value={form.semester} onChange={(e) => setForm({...form, semester: e.target.value})} className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none">
                        <option value="">Select Semester</option>
                        <option value="1">1st Semester</option>
                        <option value="2">2nd Semester</option>
                        <option value="3">3rd Semester</option>
                        <option value="4">4th Semester</option>
                        <option value="5">5th Semester</option>
                        <option value="6">6th Semester</option>
                        <option value="7">7th Semester</option>
                        <option value="8">8th Semester</option>
                        <option value="9">9th Semester</option>
                        <option value="10">10th Semester</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">Parent Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Father's Name *</label>
                      <input type="text" required value={form.fatherName} onChange={(e) => setForm({...form, fatherName: e.target.value})} className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Father Phone Number *</label>
                      <input type="tel" required value={form.parentPhone} onChange={(e) => setForm({...form, parentPhone: e.target.value})} className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Editable Fields (Non-Student Roles) */}
            {!isStudent && (
              <>
                <div>
                  <h3 className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">Contact Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Phone Number *</label>
                      <input type="tel" required value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none" placeholder="+91" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Email Address *</label>
                      <input type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Joining Date *</label>
                      <input type="date" required value={form.joiningDate} onChange={(e) => setForm({...form, joiningDate: e.target.value})} className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">Gender *</label>
                      <select required value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})} className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-[#F5F7FB]/50 flex justify-end gap-3 shrink-0 rounded-b-3xl">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="edit-profile-form"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50 transition-colors shadow-lg shadow-brand-500/20 flex items-center gap-2"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
}

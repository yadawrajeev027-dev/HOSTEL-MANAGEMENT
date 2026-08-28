import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Building, 
  DoorClosed, 
  Phone, 
  Mail, 
  GraduationCap,
  Calendar,
  Hash,
  Trash2,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { studentApi, hostelApi } from '../api';

export function StudentsListPage() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [students, setStudents] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [hostelFilter, setHostelFilter] = useState('');
  
  // Registration Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [regData, setRegData] = useState({
    name: '', registrationNumber: '', password: '', phone: '', email: '', 
    department: 'Computer Science & Engineering', branch: 'B.Tech', year: '1st Year', guardianPhone: ''
  });

  const loadStudents = async () => {
    try {
      const res = await studentApi.getAll({ search, department: deptFilter, hostel: hostelFilter });
      setStudents(res.students || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const hRes = await hostelApi.getAll();
        setHostels(hRes.hostels || []);
      } catch(e) {
        console.error(e);
      }
    }
    init();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [search, deptFilter, hostelFilter]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete student ${name}?`)) return;
    try {
      await studentApi.delete(id);
      showToast('Student deleted successfully', 'success');
      loadStudents();
    } catch (err) {
      alert(err.message || 'Failed to delete student');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await studentApi.register(regData);
      showToast('Student registered successfully', 'success');
      setShowAddModal(false);
      setRegData({ name: '', registrationNumber: '', password: '', phone: '', email: '', department: 'Computer Science & Engineering', branch: 'B.Tech', year: '1st Year', guardianPhone: '' });
      loadStudents();
    } catch (err) {
      alert(err.message || 'Failed to register student');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">STUDENTS DIRECTORY</h1>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Hostel residents, room allocations, department records, and contact directory.
          </p>
        </div>
        
        {user?.role === 'Chief Warden' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl font-bold text-xs hover:bg-brand-500 transition-colors shadow-lg shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, reg no, room..."
            className="w-full pl-9 pr-3 py-2 bg-[#F5F7FB] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none"
          />
        </div>

        <div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none"
          >
            <option value="">All Departments</option>
            <option value="Computer Science & Engineering">Computer Science & Engineering</option>
            <option value="Electronics & Communication">Electronics & Communication</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
          </select>
        </div>

        <div>
          <select
            value={hostelFilter}
            onChange={(e) => setHostelFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#F5F7FB] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none"
          >
            <option value="">All Hostels</option>
            {hostels.map(h => (
              <option key={h.id} value={h.name}>{h.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {students.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No students found matching your criteria.
          </div>
        ) : (
          students.map((std) => (
            <div
              key={std.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 rounded-3xl p-5 shadow-xl transition-all space-y-3.5"
            >
              <div className="flex items-start justify-between gap-3.5">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/15 border border-brand-200 flex items-center justify-center text-brand-600 font-bold text-lg">
                    {std.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{std.name}</h3>
                    <span className="font-mono text-xs text-brand-600 font-bold">{std.registrationNumber}</span>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{std.department} • {std.year}</p>
                  </div>
                </div>
                {user?.role === 'Chief Warden' && (
                  <button 
                    onClick={() => handleDelete(std.id, std.name)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    title="Delete Student"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-brand-600" /> Hostel</span>
                  <span className="font-medium text-slate-900 dark:text-white">{std.hostel}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5"><DoorClosed className="w-3.5 h-3.5 text-brand-600" /> Room / Floor</span>
                  <span className="font-medium text-slate-900 dark:text-white">Room {std.roomNumber} ({std.floor})</span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-brand-600" /> Guardian Phone</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200">{std.guardianPhone}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                <span>Branch: <strong className="text-slate-700 dark:text-slate-200">{std.branch}</strong> (Sec {std.section || 'A'})</span>
                <span className="text-emerald-600 font-medium">Resident Active</span>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Outfit']">Register New Student</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="add-student-form" onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Full Name *</label>
                    <input type="text" required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} className="w-full p-2.5 bg-[#F5F7FB] border border-slate-200 rounded-xl text-xs text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Registration No *</label>
                    <input type="text" required value={regData.registrationNumber} onChange={e => setRegData({...regData, registrationNumber: e.target.value})} className="w-full p-2.5 bg-[#F5F7FB] border border-slate-200 rounded-xl text-xs text-slate-900 font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Password *</label>
                    <input type="password" required value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} className="w-full p-2.5 bg-[#F5F7FB] border border-slate-200 rounded-xl text-xs text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Email *</label>
                    <input type="email" required value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} className="w-full p-2.5 bg-[#F5F7FB] border border-slate-200 rounded-xl text-xs text-slate-900" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Department</label>
                    <select value={regData.department} onChange={e => setRegData({...regData, department: e.target.value})} className="w-full p-2.5 bg-[#F5F7FB] border border-slate-200 rounded-xl text-xs text-slate-900">
                      <option>Computer Science & Engineering</option>
                      <option>Electronics & Communication</option>
                      <option>Mechanical Engineering</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Branch</label>
                    <input type="text" value={regData.branch} onChange={e => setRegData({...regData, branch: e.target.value})} className="w-full p-2.5 bg-[#F5F7FB] border border-slate-200 rounded-xl text-xs text-slate-900" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Year</label>
                    <select value={regData.year} onChange={e => setRegData({...regData, year: e.target.value})} className="w-full p-2.5 bg-[#F5F7FB] border border-slate-200 rounded-xl text-xs text-slate-900">
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Phone *</label>
                    <input type="text" required value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} className="w-full p-2.5 bg-[#F5F7FB] border border-slate-200 rounded-xl text-xs text-slate-900 font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Guardian Phone</label>
                    <input type="text" value={regData.guardianPhone} onChange={e => setRegData({...regData, guardianPhone: e.target.value})} className="w-full p-2.5 bg-[#F5F7FB] border border-slate-200 rounded-xl text-xs text-slate-900 font-mono" />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 flex items-center justify-end gap-3 rounded-b-3xl">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" form="add-student-form" className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-500 transition-colors shadow-lg shadow-brand-500/20">
                Register Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

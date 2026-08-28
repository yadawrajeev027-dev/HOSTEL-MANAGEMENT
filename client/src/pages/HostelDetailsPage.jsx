import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Building,
  Users,
  BedDouble,
  DoorClosed,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { hostelApi } from '../api';
import { useNotifications } from '../context/NotificationContext';

export function HostelDetailsPage({ hostelId, onBack }) {
  const [hostel, setHostel] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assign Bed Modal State
  const { showToast } = useNotifications();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [assignData, setAssignData] = useState({ roomNumber: '', bedNumber: '' });

  const loadDetails = async () => {
    try {
      const hRes = await hostelApi.getById(hostelId);
      setHostel(hRes.hostel);

      const sRes = await hostelApi.getStudents(hostelId);
      setStudents(sRes.students || []);
    } catch (err) {
      console.error('Failed to load hostel details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hostelId) loadDetails();
  }, [hostelId]);

  const openAssignModal = (student) => {
    setSelectedStudent(student);
    setAssignData({ 
      roomNumber: student.roomNumber !== 'Unassigned' ? student.roomNumber : '',
      bedNumber: student.bedNumber !== 'Unassigned' ? student.bedNumber : ''
    });
    setShowAssignModal(true);
  };

  const handleAssignBed = async (e) => {
    e.preventDefault();
    try {
      // Need to add this endpoint to API!
      const res = await fetch(`http://localhost:5000/api/students/${selectedStudent.id}/bed`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hostel_token')}`
        },
        body: JSON.stringify({
          hostelName: hostel.name,
          roomNumber: assignData.roomNumber,
          bedNumber: assignData.bedNumber
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      setShowAssignModal(false);
      loadDetails(); // Reload to get updated beds and occupancy
    } catch (err) {
      alert(err.message || 'Failed to assign bed');
    }
  };

  if (loading) {
    return <div className="text-slate-400 dark:text-slate-500 p-8">Loading hostel details...</div>;
  }

  if (!hostel) {
    return <div className="text-rose-400 p-8">Hostel not found.</div>;
  }

  const occPct = hostel.totalBeds ? Math.round((hostel.occupiedBeds / hostel.totalBeds) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button 
          onClick={onBack}
          className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">{hostel.name}</h1>
          <p className="text-xs text-brand-600 font-bold uppercase tracking-wider">{hostel.type} • {hostel.totalFloors} Floors</p>
        </div>
        <div className="ml-auto">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
            hostel.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 dark:text-slate-500 border-slate-500/20'
          }`}>
            {hostel.status}
          </span>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Warden Info */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center border border-brand-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Assigned Warden</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{hostel.wardenName}</h3>
            {hostel.wardenContact && (
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1.5">
                <Phone className="w-3 h-3" /> {hostel.wardenContact}
              </div>
            )}
          </div>
        </div>

        {/* Capacity & Beds Info */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl col-span-1 md:col-span-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-3">Bed Occupancy Status</span>
          
          <div className="flex justify-between items-end mb-2">
            <div className="flex gap-6">
              <div>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{hostel.occupiedBeds}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 ml-1.5">Occupied</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-emerald-600">{hostel.availableBeds}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 ml-1.5">Available</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-brand-600">{hostel.totalBeds}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 ml-1.5">Total Beds</span>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-[#F5F7FB] overflow-hidden mt-3">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-500" 
              style={{ width: `${occPct}%` }}
            />
          </div>
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 text-right">
            {occPct}% OCCUPIED (Capacity Limit: {hostel.capacity} students)
          </div>
        </div>
      </div>

      {/* Assigned Students Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl mt-6">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-600" />
            Students in {hostel.name}
          </h3>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
            {students.length} Records
          </span>
        </div>

        {students.length === 0 ? (
          <div className="p-12 text-center">
            <BedDouble className="w-12 h-12 text-slate-700 dark:text-slate-200 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-600 dark:text-slate-300">No students added yet.</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Assign students to this hostel via Student Registration.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-[#F5F7FB]/50 text-xs uppercase font-semibold text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Registration No.</th>
                  <th className="px-6 py-4">Academic Details</th>
                  <th className="px-6 py-4">Room & Bed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{s.name}</td>
                    <td className="px-6 py-4 font-mono text-brand-600">{s.registrationNumber}</td>
                    <td className="px-6 py-4">
                      <div className="text-xs">{s.year} • {s.branch}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">{s.department}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <DoorClosed className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span className="font-bold text-slate-700 dark:text-slate-200">{s.roomNumber || 'Unassigned'}</span>
                        <span className="text-slate-600 dark:text-slate-300 px-1">•</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">Bed: {s.bedNumber || 'Unassigned'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Building, Users, DoorClosed, BedDouble, ArrowRight,
  Search, ShieldAlert, CheckCircle2, History
} from 'lucide-react';
import { allotmentApi, authApi, studentApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export function RoomAllotmentPage() {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  // Data states
  const [students, setStudents] = useState([]);
  const [allotted, setAllotted] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [history, setHistory] = useState([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('allot'); // 'allot', 'manage', 'history'
  
  // Selection states for Allotment process
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, [activeTab]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'allot') {
        // Load students and hostels
        const stuRes = await studentApi.getAll();
        setStudents(stuRes.students || []);

        const hRes = await allotmentApi.getHostels();
        setHostels(hRes.hostels || []);
      } 
      else if (activeTab === 'manage') {
        const alRes = await allotmentApi.getAllotted();
        setAllotted(alRes.allotted || []);
      }
      else if (activeTab === 'history') {
        const hiRes = await allotmentApi.getHistory();
        setHistory(hiRes.history || []);
      }
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHostelSelect = async (hostelId) => {
    setSelectedHostel(hostelId);
    setSelectedFloor(null);
    setSelectedRoom(null);
    setSelectedBed(null);
    setRooms([]);
    setBeds([]);
    
    if (hostelId) {
      const res = await allotmentApi.getFloors(hostelId);
      setFloors(res.floors || []);
    } else {
      setFloors([]);
    }
  };

  const handleFloorSelect = async (floorNum) => {
    setSelectedFloor(floorNum);
    setSelectedRoom(null);
    setSelectedBed(null);
    setBeds([]);

    if (floorNum && selectedHostel) {
      const res = await allotmentApi.getRooms(selectedHostel, floorNum);
      setRooms(res.rooms || []);
    } else {
      setRooms([]);
    }
  };

  const handleRoomSelect = async (roomId) => {
    setSelectedRoom(roomId);
    setSelectedBed(null);

    if (roomId) {
      const res = await allotmentApi.getBeds(roomId);
      setBeds(res.beds || []);
    } else {
      setBeds([]);
    }
  };

  const handleConfirmAllotment = async () => {
    try {
      const res = await allotmentApi.assign({
        studentId: selectedStudent.id,
        bedId: selectedBed.id
      });
      showToast(res.message, 'success');
      setShowConfirmModal(false);
      
      // Reset flow
      setSelectedStudent(null);
      handleHostelSelect(null);
      setSearchQuery('');
      
    } catch (err) {
      alert(err.message || 'Failed to allot room');
    }
  };

  const handleRemoveAllotment = async () => {
    try {
      const res = await allotmentApi.remove({ studentId: studentToRemove.id });
      showToast(res.message, 'success');
      setShowRemoveModal(false);
      loadInitialData(); // Reload manage table
    } catch (err) {
      alert(err.message || 'Failed to remove allotment');
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.registrationNumber && s.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">ROOM ALLOTMENT</h1>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Assign students to specific hostels, floors, rooms, and beds.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-fit">
        <button onClick={() => setActiveTab('allot')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'allot' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Allotment Flow</button>
        <button onClick={() => setActiveTab('manage')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'manage' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Manage Allotments</button>
        <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Allotment History</button>
      </div>

      {/* ALLOTMENT FLOW TAB */}
      {activeTab === 'allot' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Selection */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Step 1: Student */}
            <div className={`p-5 rounded-3xl border transition-all ${!selectedStudent ? 'bg-white dark:bg-slate-900 border-brand-200 ring-1 ring-brand-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[10px] text-brand-600">1</span> Select Student</h3>
              
              {!selectedStudent ? (
                <>
                  <div className="relative mb-4">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search by name or registration number..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  
                  {students.length === 0 ? (
                    <div className="text-center p-6 bg-[#F5F7FB]/50 rounded-xl text-slate-400 dark:text-slate-500 text-xs">No students added yet. Please ask a student to register first.</div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                      {filteredStudents.map(s => (
                        <div key={s.id} onClick={() => setSelectedStudent(s)} className="p-3 bg-[#F5F7FB] border border-slate-200 dark:border-slate-800 hover:border-brand-300 rounded-xl cursor-pointer flex items-center justify-between group transition-colors">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">{s.name}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">{s.registrationNumber} • {s.department} • {s.year}</div>
                          </div>
                          {s.hostel && s.hostel !== 'Unassigned' && (
                            <span className="px-2 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-bold rounded border border-rose-500/20">Already Allotted</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between p-4 bg-brand-50 border border-brand-200 rounded-xl">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{selectedStudent.name}</div>
                    <div className="text-xs text-brand-200">{selectedStudent.registrationNumber}</div>
                  </div>
                  <button onClick={() => setSelectedStudent(null)} className="text-xs font-bold text-brand-600 hover:text-brand-600">Change</button>
                </div>
              )}
            </div>

            {/* Step 2: Location */}
            <div className={`p-5 rounded-3xl border transition-all ${selectedStudent && !selectedBed ? 'bg-white dark:bg-slate-900 border-emerald-500/30 ring-1 ring-emerald-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[10px] text-emerald-600">2</span> Select Location</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Hostel */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1">Hostel</label>
                  <select disabled={!selectedStudent} value={selectedHostel || ''} onChange={(e) => handleHostelSelect(e.target.value)} className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white disabled:opacity-50">
                    <option value="">-- Select Hostel --</option>
                    {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                {/* Floor */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1">Floor</label>
                  <select disabled={!selectedHostel} value={selectedFloor || ''} onChange={(e) => handleFloorSelect(e.target.value)} className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white disabled:opacity-50">
                    <option value="">-- Select Floor --</option>
                    {floors.map(f => <option key={f} value={f}>Floor {f}</option>)}
                  </select>
                </div>
                {/* Room */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1">Room</label>
                  <select disabled={!selectedFloor} value={selectedRoom || ''} onChange={(e) => handleRoomSelect(e.target.value)} className="w-full p-2.5 bg-[#F5F7FB] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white disabled:opacity-50">
                    <option value="">-- Select Room --</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>Room {r.roomNumber}</option>)}
                  </select>
                </div>
              </div>

              {/* Beds */}
              {selectedRoom && (
                <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">Available Beds in Room</h4>
                  {beds.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500">No beds configured for this room.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {beds.map(b => (
                        <button
                          key={b.id}
                          disabled={b.status === 'Occupied'}
                          onClick={() => setSelectedBed(b)}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                            b.status === 'Occupied' 
                              ? 'bg-rose-500/5 border-rose-500/20 opacity-50 cursor-not-allowed' 
                              : selectedBed?.id === b.id
                                ? 'bg-emerald-500/20 border-emerald-500 ring-1 ring-emerald-500'
                                : 'bg-[#F5F7FB] border-slate-300 dark:border-slate-700 hover:border-emerald-500/50 cursor-pointer'
                          }`}
                        >
                          <BedDouble className={`w-5 h-5 ${b.status === 'Occupied' ? 'text-rose-400' : selectedBed?.id === b.id ? 'text-emerald-600' : 'text-slate-400 dark:text-slate-500'}`} />
                          <div className="text-center">
                            <div className={`text-xs font-bold ${selectedBed?.id === b.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{b.bedNumber}</div>
                            <div className={`text-[9px] uppercase font-bold mt-0.5 ${b.status === 'Occupied' ? 'text-rose-400' : 'text-emerald-600'}`}>{b.status}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sticky top-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">Allotment Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Student</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">{selectedStudent?.name || '--'}</div>
                </div>
                
                {selectedStudent?.hostel && selectedStudent?.hostel !== 'Unassigned' && (
                  <div className="p-3 bg-amber-50 border border-amber-500/20 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-amber-500 block mb-1">Current Assignment (Will be transferred)</span>
                    <div className="text-xs text-amber-200">{selectedStudent.hostel} • Room {selectedStudent.roomNumber}</div>
                  </div>
                )}

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Destination Hostel</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">{hostels.find(h => h.id === selectedHostel)?.name || '--'}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Floor</span>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">{selectedFloor || '--'}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Room</span>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">{rooms.find(r => r.id === selectedRoom)?.roomNumber || '--'}</div>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Bed</span>
                  <div className="text-sm font-bold text-emerald-600 mt-1">{selectedBed?.bedNumber || '--'}</div>
                </div>
              </div>

              <button
                disabled={!selectedStudent || !selectedBed}
                onClick={() => setShowConfirmModal(true)}
                className="w-full mt-6 py-3 rounded-xl font-bold text-sm bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-brand-500/20"
              >
                {selectedStudent?.hostel && selectedStudent?.hostel !== 'Unassigned' ? 'Transfer Student' : 'Allot Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE ALLOTMENTS TAB */}
      {activeTab === 'manage' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          {allotted.length === 0 ? (
            <div className="p-12 text-center">
              <DoorClosed className="w-12 h-12 text-slate-700 dark:text-slate-200 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-600 dark:text-slate-300">No rooms allotted yet.</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Use the Allotment Flow to assign students.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-[#F5F7FB]/50 text-xs uppercase font-semibold text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Hostel & Room</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {allotted.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">{s.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">{s.registrationNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-emerald-600">{s.hostel}</div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-300">Floor {s.floor} • Room {s.roomNumber} • {s.bedNumber}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setStudentToRemove(s);
                            setShowRemoveModal(true);
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
                        >
                          Remove Allotment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          {history.length === 0 ? (
            <div className="p-12 text-center">
              <History className="w-12 h-12 text-slate-700 dark:text-slate-200 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-600 dark:text-slate-300">No allotment history.</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-[#F5F7FB]/50 text-xs uppercase font-semibold text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {history.slice().reverse().map(h => (
                    <tr key={h.id || Math.random()} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 text-xs whitespace-nowrap">{new Date(h.date).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          h.action === 'ALLOTTED' ? 'bg-emerald-50 text-emerald-600 border-emerald-500/20' :
                          h.action === 'TRANSFERRED' ? 'bg-amber-50 text-amber-600 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {h.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{h.studentName}</td>
                      <td className="px-6 py-4 text-xs text-slate-400 dark:text-slate-500">
                        {h.action === 'REMOVED' ? (
                          <span>Removed from <strong className="text-slate-600 dark:text-slate-300">{h.oldBedDetails?.hostel} (Room {h.oldBedDetails?.roomNumber})</strong></span>
                        ) : h.action === 'TRANSFERRED' ? (
                          <span>Moved to <strong className="text-emerald-600">{h.newBedDetails?.hostel} (Room {h.newBedDetails?.roomNumber})</strong></span>
                        ) : (
                          <span>Assigned to <strong className="text-emerald-600">{h.newBedDetails?.hostel} (Room {h.newBedDetails?.roomNumber})</strong></span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">{h.changedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONFIRM MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-brand-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-brand-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">Confirm Allotment</h3>
            </div>
            
            <div className="space-y-4 bg-[#F5F7FB] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 dark:text-slate-500">Student:</span>
                <span className="font-bold text-slate-900 dark:text-white text-right">{selectedStudent?.name}<br/><span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{selectedStudent?.registrationNumber}</span></span>
              </div>
              <div className="flex justify-between text-sm border-t border-slate-200 dark:border-slate-800 pt-3">
                <span className="text-slate-400 dark:text-slate-500">Hostel:</span>
                <span className="font-bold text-slate-900 dark:text-white">{hostels.find(h => h.id === selectedHostel)?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 dark:text-slate-500">Room:</span>
                <span className="font-bold text-slate-900 dark:text-white">{rooms.find(r => r.id === selectedRoom)?.roomNumber} (Floor {selectedFloor})</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 dark:text-slate-500">Bed:</span>
                <span className="font-bold text-emerald-600">{selectedBed?.bedNumber}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white">Cancel</button>
              <button onClick={handleConfirmAllotment} className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/20">Confirm Allotment</button>
            </div>
          </div>
        </div>
      )}

      {/* REMOVE MODAL */}
      {showRemoveModal && studentToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-['Outfit']">Remove Allotment?</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">
              Are you sure you want to remove the room allotment for <strong>{studentToRemove.name}</strong>? This will free up their bed.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowRemoveModal(false)} className="px-4 py-2 text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white">Cancel</button>
              <button onClick={handleRemoveAllotment} className="px-5 py-2 rounded-xl text-sm font-bold text-slate-900 dark:text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-500/20">Remove</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useRef } from 'react';
import { 
  User, Building, DoorClosed, GraduationCap, Phone, Mail, Hash, ShieldCheck,
  Calendar, MapPin, Edit3, Camera, Activity, AlertCircle, PhoneCall, Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import { useNotifications } from '../context/NotificationContext';
import { EditProfileModal } from '../components/EditProfileModal';

export function ProfilePage({ setCurrentTab }) {
  const { user, updateUser } = useAuth();
  const { showToast } = useNotifications();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Allowed types
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Please upload a valid JPG, PNG, or WebP image', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      showToast('Image size should be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setIsUploading(true);
      try {
        const res = await authApi.updateProfile({ avatar: base64String });
        // Update user context with new avatar
        updateUser(res.user || { ...user, avatar: base64String });
        showToast('Profile image updated successfully', 'success', 'Updated');
        
        // Refresh from backend to be absolutely sure
        const meRes = await authApi.getMe();
        updateUser(meRes.user);
      } catch (err) {
        showToast(err.message || 'Failed to upload image', 'error', 'Error');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProfileUpdated = async () => {
    setIsEditModalOpen(false);
    showToast('Profile updated successfully', 'success', 'Updated');
    try {
      const res = await authApi.getMe();
      updateUser(res.user);
    } catch (err) {
      console.error(err);
    }
  };

  const isStudent = user?.role === 'Student';
  const isWarden = user?.role === 'Warden';
  const isFloorWarden = user?.role === 'Floor Warden';
  const isChiefWarden = user?.role === 'Chief Warden' || user?.role === 'Deputy Chief Warden';
  const isAdmin = user?.role === 'Admin';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          
          {/* Avatar Section */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-brand-500/40 flex items-center justify-center text-brand-600 font-extrabold text-4xl shadow-xl overflow-hidden shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {/* Edit Avatar Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-600 hover:bg-brand-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 border-2 border-slate-900 z-10"
              title="Change Profile Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/jpeg, image/png, image/webp" 
              className="hidden" 
            />
          </div>

          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">{user?.name}</h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mt-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-600 border border-brand-200">
                    {user?.role}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                    {user?.registrationNumber || user?.username || user?.wardenId || 'ID Not Assigned'}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors border border-slate-300 dark:border-slate-700 shrink-0"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile
              </button>
            </div>
            
            {isStudent && (
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">{user?.department || 'Department Not Assigned'} • {user?.branch || 'Branch Not Assigned'}</p>
            )}
            {!isStudent && (
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">{user?.office || user?.assignedHostel ? `Assigned: ${user?.assignedHostel || user?.office}` : 'Administrative Staff'}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Info) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Information (All Roles) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-600" /> Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Full Name</span>
                <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{user?.name || 'Not Available'}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Gender</span>
                <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{user?.gender || 'Not Available'}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Joining Date</span>
                <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{user?.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'Not Available'}</p>
              </div>
            </div>
          </div>

          {/* Academic Information (Student Only) */}
          {isStudent && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-brand-600" /> Academic Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Course & Department</span>
                  <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{user?.department || 'Not Assigned'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Branch</span>
                  <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{user?.branch || 'Not Assigned'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Current Year</span>
                  <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{user?.year || 'Not Assigned'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Section / Semester</span>
                  <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{user?.section || user?.semester || 'Not Assigned'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Parent Information (Student Only) */}
          {isStudent && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600" /> Parent Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Father's Name</span>
                  <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{user?.fatherName || 'Not Available'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Father Phone Number</span>
                  <p className="text-sm text-slate-700 dark:text-slate-200 font-mono">{user?.parentPhone || 'Not Available'}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Professional Information (Staff/Admin Only) */}
          {!isStudent && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-600" /> Assignment Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                {(isWarden || isFloorWarden) && (
                  <>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Assigned Hostel</span>
                      <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{user?.assignedHostel || user?.hostel || 'Not Assigned'}</p>
                    </div>
                    {isFloorWarden && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Assigned Floor</span>
                        <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{user?.assignedFloor || 'Not Assigned'}</p>
                      </div>
                    )}
                    {(isWarden || isFloorWarden) && user?.roomNumber && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Staff Room Number</span>
                        <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{user?.roomNumber}</p>
                      </div>
                    )}
                  </>
                )}

                {(isChiefWarden || isAdmin) && (
                  <>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Office / Venue</span>
                      <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{user?.office || 'Main Administration Building'}</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Managed Hostels</span>
                      <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">All Hostels</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (Side Info) */}
        <div className="space-y-6">
          
          {/* Hostel Information (Student Only) */}
          {isStudent && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-brand-500/10">
                <Building className="w-32 h-32" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2 relative z-10">
                <DoorClosed className="w-4 h-4 text-brand-600" /> Hostel Allocation
              </h2>
              <div className="space-y-4 mt-4 relative z-10">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Hostel Block</span>
                  <p className="text-base text-slate-900 dark:text-white font-bold">{user?.hostel || 'Not Assigned'}</p>
                </div>
                <div className="flex gap-8">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Room Number</span>
                    <p className="text-xl text-brand-600 font-bold font-mono">{user?.roomNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Bed Number</span>
                    <p className="text-xl text-brand-600 font-bold font-mono">{user?.bedNumber || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1 block">Hostel Warden</span>
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{user?.wardenName || 'Not Assigned'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information (All Roles) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-600" /> Contact Details
            </h2>
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase block">{isStudent ? 'Student Phone' : 'Personal Phone'}</span>
                  <p className="text-sm text-slate-700 dark:text-slate-200 font-mono">{user?.phone || 'Not Available'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase block">Email Address</span>
                  <p className="text-sm text-slate-700 dark:text-slate-200">{user?.email || 'Not Available'}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSuccess={handleProfileUpdated} 
      />
    </div>
  );
}

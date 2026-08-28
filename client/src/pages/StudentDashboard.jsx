import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, Ticket, MessageSquareWarning, Building, DoorClosed, 
  CheckCircle2, Clock, ShieldCheck, Printer, ArrowRight, User, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { statsApi } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { DigitalOutpassModal } from '../components/DigitalOutpassModal';

export function StudentDashboard({ onOpenCallBooth, setCurrentTab }) {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPass, setSelectedPass] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await statsApi.getOverview();
        setStatsData(res);
      } catch (err) {
        console.error('Failed to load student dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.id]);

  const stats = statsData?.stats || {
    pendingOutpasses: 0,
    approvedOutpasses: 0,
    activeComplaints: 0,
    activeCalls: 0
  };

  const getRecentActivity = () => {
    if (!statsData) return [];
    const activities = [
      ...(statsData.recentOutpasses?.map(op => ({ type: 'outpass', ...op })) || []),
      ...(statsData.recentComplaints?.map(cmp => ({ type: 'complaint', ...cmp })) || [])
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    return activities;
  };

  const recentActivity = getRecentActivity();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* 1. STUDENT HEADER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white text-2xl font-bold shadow-lg overflow-hidden shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'S'
              )}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{user?.name || 'Student'}</h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 dark:text-slate-500">
                <span className="font-mono text-slate-600 dark:text-slate-300">{user?.registrationNumber || 'Not Assigned'}</span>
                <span>•</span>
                <span>{user?.department || 'Dept'} {user?.branch || ''} • {user?.year ? `${user.year} Year` : 'Year N/A'}</span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5 bg-[#F5F7FB] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <Building className="w-3.5 h-3.5 text-brand-600" /> {user?.hostel || 'Hostel Not Assigned'}
                </span>
                <span className="flex items-center gap-1.5 bg-[#F5F7FB] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <DoorClosed className="w-3.5 h-3.5 text-brand-600" /> Room {user?.roomNumber || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setCurrentTab('outpass')} 
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-300 dark:border-slate-700 shadow-md flex items-center gap-2 shrink-0"
          >
            <Ticket className="w-4 h-4" /> Apply Outpass
          </button>
        </div>
      </div>

      {/* 2. EMERGENCY CALL BOOTH */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-red-200 p-6 shadow-xl group">
        <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-50 transition-colors" />
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-500 border border-red-300 shrink-0">
              <PhoneCall className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">EMERGENCY CALL BOOTH</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-red-100 text-red-600 border border-red-300">24/7 ACTIVE</span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xl leading-relaxed">
                Need immediate assistance? Report emergencies directly to the responsible team.
              </p>
            </div>
          </div>
          <button 
            onClick={onOpenCallBooth} 
            className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-600/20 flex items-center gap-2 shrink-0"
          >
            <PhoneCall className="w-4 h-4" /> Open Call Booth
          </button>
        </div>
      </div>

      {/* 3. FOUR SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div onClick={() => setCurrentTab('outpass')} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-300 transition-all cursor-pointer group shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Pending Outpasses</p>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.pendingOutpasses}</div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">Awaiting warden review</p>
        </div>

        <div onClick={() => setCurrentTab('outpass')} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 transition-all cursor-pointer group shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Approved Passes</p>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.approvedOutpasses}</div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">Ready to download</p>
        </div>

        <div onClick={() => setCurrentTab('complaints')} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-300 transition-all cursor-pointer group shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
              <MessageSquareWarning className="w-4 h-4 text-cyan-600" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Active Complaints</p>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.activeComplaints}</div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">In progress</p>
        </div>

        <div onClick={() => setCurrentTab('callbooth')} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-red-300 transition-all cursor-pointer group shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <PhoneCall className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Active Call Tickets</p>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.activeCalls}</div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">Dispatched</p>
        </div>

      </div>

      {/* 4. QUICK ACTIONS & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Quick Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            
            <button onClick={() => setCurrentTab('outpass')} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-brand-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left flex flex-col gap-3 group shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center group-hover:bg-brand-100 group-hover:border-brand-200 transition-colors">
                <Ticket className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-900 dark:text-white mb-0.5">Apply Outpass</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Request a pass</span>
              </div>
            </button>
            
            <button onClick={() => setCurrentTab('complaints')} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-brand-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left flex flex-col gap-3 group shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center group-hover:bg-brand-100 group-hover:border-brand-200 transition-colors">
                <MessageSquareWarning className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-900 dark:text-white mb-0.5">File Complaint</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Report issue</span>
              </div>
            </button>

            <button onClick={onOpenCallBooth} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-red-500/50 hover:bg-red-950/20 transition-all text-left flex flex-col gap-3 group shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center group-hover:bg-red-100 group-hover:border-red-300 transition-colors">
                <PhoneCall className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-900 dark:text-white mb-0.5">Emergency</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Get help now</span>
              </div>
            </button>

            <button onClick={() => setCurrentTab('profile')} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-brand-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left flex flex-col gap-3 group shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center group-hover:bg-brand-100 group-hover:border-brand-200 transition-colors">
                <User className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-900 dark:text-white mb-0.5">My Profile</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">View details</span>
              </div>
            </button>

          </div>
        </div>

        {/* Recent Activity (7 cols) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">Recent Activity</h3>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex-1 flex flex-col">
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">Loading activity...</div>
            ) : recentActivity.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">No recent activity</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px] mx-auto">Your recent hostel activities will appear here.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, idx) => (
                  <div key={`${activity.type}-${activity.id || idx}`} className="flex items-start gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors">
                    {activity.type === 'outpass' ? (
                      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0 border border-brand-500/20">
                        <Ticket className="w-5 h-5 text-brand-600" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0 border border-sky-500/20">
                        <MessageSquareWarning className="w-5 h-5 text-cyan-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {activity.type === 'outpass' ? `Outpass ${activity.outpassNumber}` : `Complaint #${activity.id.slice(-4)}`}
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {activity.type === 'outpass' ? activity.purpose : activity.title}
                      </p>
                      <div className="mt-2">
                        <StatusBadge status={activity.finalStatus || activity.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 5. COMPLAINTS SUMMARY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pl-1 pr-2">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Complaints & Grievances</h3>
          <button onClick={() => setCurrentTab('complaints')} className="text-xs font-bold text-brand-600 hover:text-brand-600 flex items-center gap-1 transition-colors">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
          {statsData?.recentComplaints?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <MessageSquareWarning className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">No complaints yet</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-4">Need help with something?</p>
                <button 
                  onClick={() => setCurrentTab('complaints')}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Submit Complaint
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {statsData?.recentComplaints?.slice(0, 4).map(complaint => (
                <div key={complaint.id} className="p-4 bg-[#F5F7FB] border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{complaint.title}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Submitted {new Date(complaint.createdAt).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={complaint.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Digital Outpass Modal */}
      <DigitalOutpassModal 
        isOpen={!!selectedPass} 
        onClose={() => setSelectedPass(null)} 
        outpassData={selectedPass}
      />
    </div>
  );
}

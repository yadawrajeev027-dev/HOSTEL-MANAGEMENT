import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useNotifications } from './context/NotificationContext';
import { LoginPage } from './pages/LoginPage';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CallBoothModal } from './components/CallBoothModal';

// Role Dashboards
import { StudentDashboard } from './pages/StudentDashboard';
import { FloorWardenDashboard } from './pages/FloorWardenDashboard';
import { DepartmentWardenDashboard } from './pages/DepartmentWardenDashboard';
import { DeputyChiefDashboard } from './pages/DeputyChiefDashboard';
import { ChiefWardenDashboard } from './pages/ChiefWardenDashboard';

// Feature Pages
import { OutpassPage } from './pages/OutpassPage';
import { ComplaintsPage } from './pages/ComplaintsPage';
import { CallBoothPage } from './pages/CallBoothPage';
import { StudentsListPage } from './pages/StudentsListPage';
import { WardensListPage } from './pages/WardensListPage';
import { HostelsPage } from './pages/HostelsPage';
import { HostelDetailsPage } from './pages/HostelDetailsPage';
import { RoomAllotmentPage } from './pages/RoomAllotmentPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

import { GlobalVoiceAgent } from './components/GlobalVoiceAgent';
import { complaintApi, outpassApi } from './api';

export function App() {
  const { user, isAuthenticated, loading } = useAuth();
  const { toast, showToast, fetchNotifications } = useNotifications();

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isCallBoothOpen, setIsCallBoothOpen] = useState(false);
  const [callBoothData, setCallBoothData] = useState(null);
  const [selectedHostelId, setSelectedHostelId] = useState(null);

  // AI Voice Agent Event Listeners
  useEffect(() => {
    const handleNavigate = (e) => setCurrentTab(e.detail);
    const handleCallBooth = (e) => {
      setCallBoothData(e.detail || null);
      setIsCallBoothOpen(true);
    };
    
    const handleAutoComplaint = async (e) => {
      const desc = e.detail;
      try {
        await complaintApi.create({
          title: "AI Voice Request",
          category: "General Maintenance",
          description: desc,
          isAnonymous: false
        });
        showToast('Complaint automatically filed by AI!', 'success');
        fetchNotifications();
        setCurrentTab('complaints'); // navigate there so they see it
      } catch (err) {
        showToast('Failed to auto-file complaint: ' + err.message, 'error');
      }
    };

    const handleAutoOutpass = async (e) => {
      const { destination, purpose } = e.detail;
      try {
        await outpassApi.create({
          destination,
          purpose,
          fromDate: new Date().toISOString().split('T')[0],
          toDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
        });
        showToast('Outpass automatically filed by AI!', 'success');
        fetchNotifications();
        setCurrentTab('outpass');
      } catch (err) {
        showToast('Failed to auto-file outpass: ' + err.message, 'error');
      }
    };
    
    window.addEventListener('ai-navigate', handleNavigate);
    window.addEventListener('ai-open-callbooth', handleCallBooth);
    window.addEventListener('ai-auto-complaint', handleAutoComplaint);
    window.addEventListener('ai-auto-outpass', handleAutoOutpass);
    
    return () => {
      window.removeEventListener('ai-navigate', handleNavigate);
      window.removeEventListener('ai-open-callbooth', handleCallBooth);
      window.removeEventListener('ai-auto-complaint', handleAutoComplaint);
      window.removeEventListener('ai-auto-outpass', handleAutoOutpass);
    };
  }, [showToast, fetchNotifications]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <span>Loading Hostel ERP Portal...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Render role-specific dashboard
  const renderDashboard = () => {
    switch (user?.role) {
      case 'Student':
        return <StudentDashboard onOpenCallBooth={() => setIsCallBoothOpen(true)} setCurrentTab={setCurrentTab} />;
      case 'Floor Warden':
        return <FloorWardenDashboard setCurrentTab={setCurrentTab} />;
      case 'Department Warden':
        return <DepartmentWardenDashboard setCurrentTab={setCurrentTab} />;
      case 'Deputy Chief Warden':
        return <DeputyChiefDashboard setCurrentTab={setCurrentTab} />;
      case 'Chief Warden':
        return <ChiefWardenDashboard setCurrentTab={setCurrentTab} />;
      default:
        return <StudentDashboard onOpenCallBooth={() => setIsCallBoothOpen(true)} setCurrentTab={setCurrentTab} />;
    }
  };

  // Render view by active tab
  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return renderDashboard();
      case 'outpass':
        return <OutpassPage />;
      case 'complaints':
        return <ComplaintsPage />;
      case 'callbooth':
        return <CallBoothPage onOpenModal={() => setIsCallBoothOpen(true)} />;
      case 'students':
        return <StudentsListPage />;
      case 'wardens':
        return <WardensListPage />;
      case 'hostels':
        return <HostelsPage setCurrentTab={setCurrentTab} setSelectedHostelId={setSelectedHostelId} />;
      case 'hostel-details':
        return <HostelDetailsPage hostelId={selectedHostelId} onBack={() => setCurrentTab('hostels')} />;
      case 'allotment':
        return <RoomAllotmentPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'profile':
        return <ProfilePage setCurrentTab={setCurrentTab} />;
      case 'settings':
        return <SettingsPage setCurrentTab={setCurrentTab} />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-900 dark:text-white font-['Inter',sans-serif]">
      
      {/* Sidebar - Fixed on left */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onOpenCallBooth={() => setIsCallBoothOpen(true)}
      />

      {/* Main Content Area - Adjusts margin based on sidebar */}
      <div className={`transition-all duration-300 ease-in-out flex flex-col min-h-screen ${
        isSidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
      }`}>
        
        {/* Top Navbar - Fixed at top, width adjusts with main area */}
        <Navbar 
          onOpenCallBooth={() => setIsCallBoothOpen(true)}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          setCurrentTab={setCurrentTab}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 max-w-7xl mx-auto w-full overflow-x-hidden">
          {renderContent()}
        </main>
      </div>

      {/* Global Call Booth Modal */}
      <CallBoothModal
        isOpen={isCallBoothOpen}
        initialData={callBoothData}
        onClose={() => {
          setIsCallBoothOpen(false);
          setCallBoothData(null);
        }}
        onSuccess={() => {
          // If on callbooth or dashboard, will refresh
        }}
      />

      {/* Toast Notification Alert */}
      {toast && (
        <div className="fixed bottom-5 left-5 md:left-auto md:right-5 z-[60] p-4 rounded-2xl bg-white dark:bg-slate-900 border border-brand-500/40 shadow-2xl flex items-center gap-3 text-xs animate-fadeIn max-w-md">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-brand-600 shrink-0" />
          )}
          <div>
            {toast.title && <div className="font-bold text-slate-900 dark:text-white mb-0.5">{toast.title}</div>}
            <div className="text-slate-600 dark:text-slate-300">{toast.message}</div>
          </div>
        </div>
      )}

      {/* Global AI Voice Agent */}
      <GlobalVoiceAgent />

    </div>
  );
}

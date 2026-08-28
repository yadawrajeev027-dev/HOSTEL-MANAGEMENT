import React from 'react';
import { 
  LayoutDashboard, 
  PhoneCall, 
  Ticket, 
  MessageSquareWarning, 
  Bell, 
  Users, 
  Building, 
  ShieldCheck, 
  UserCircle,
  Settings,
  X,
  Bed,
  Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export function Sidebar({ currentTab, setCurrentTab, isOpen, setIsOpen, isCollapsed, setIsCollapsed, onOpenCallBooth }) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const getNavItems = () => {
    switch (user?.role) {
      case 'Student':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'callbooth', label: 'Call Booth (Emergency)', icon: PhoneCall, highlight: true },
          { id: 'outpass', label: 'Outpass System', icon: Ticket },
          { id: 'complaints', label: 'Complaints', icon: MessageSquareWarning },
          { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
          { id: 'profile', label: 'Hostel & Profile', icon: UserCircle },
        ];

      case 'Floor Warden':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'outpass', label: 'Outpass Requests', icon: Ticket },
          { id: 'complaints', label: 'Floor Complaints', icon: MessageSquareWarning },
          { id: 'callbooth', label: 'Call Booth Issues', icon: PhoneCall },
          { id: 'students', label: 'Floor Students', icon: Users },
          { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount }
        ];

      case 'Department Warden':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'complaints', label: 'Dept Complaints', icon: MessageSquareWarning },
          { id: 'students', label: 'Dept Students', icon: Users },
          { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount }
        ];

      case 'Deputy Chief Warden':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'allotment', label: 'Room Allotment', icon: Bed },
          { id: 'students', label: 'All Students', icon: Users },
          { id: 'outpass', label: 'Outpass Overview', icon: Ticket },
          { id: 'complaints', label: 'Deputy Complaints', icon: MessageSquareWarning },
          { id: 'callbooth', label: 'Emergency Oversight', icon: PhoneCall },
          { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount }
        ];

      case 'Chief Warden':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'outpass', label: 'Outpass Approvals', icon: Ticket },
          { id: 'complaints', label: 'Chief Complaints', icon: MessageSquareWarning },
          { id: 'callbooth', label: 'Emergency / Calls', icon: PhoneCall },
          { id: 'hostels', label: 'Hostel Management', icon: Building },
          { id: 'students', label: 'Students Directory', icon: Users },
          { id: 'wardens', label: 'Manage Wardens', icon: ShieldCheck },
          { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount }
        ];

      default:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed top-0 left-0 z-40 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out ${
        isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
      } ${!isOpen && isCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'}`}>
        
        {/* Header with Hamburger */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          {!isCollapsed && <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden lg:block">Navigation</span>}
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase lg:hidden">Menu</span>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ml-auto"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info Badge in Sidebar (Hidden on collapsed desktop) */}
        <div className={`p-4 border-b border-slate-200 dark:border-slate-800 bg-[#F5F7FB]/40 shrink-0 ${isCollapsed ? 'hidden lg:flex lg:justify-center lg:px-2' : ''}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 rounded-full bg-brand-100 border border-brand-500/40 flex items-center justify-center text-brand-600 font-bold text-sm shrink-0 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</h4>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                  {user?.registrationNumber || user?.role}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpen(false);
                }}
                title={isCollapsed ? item.label : ''}
                className={`group relative w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isCollapsed ? 'justify-center lg:px-0' : 'justify-between'
                } ${
                  isActive 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                    : item.highlight
                      ? 'text-red-600 hover:text-red-600 hover:bg-red-50 border border-red-300'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/70'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-slate-900 dark:text-white' : item.highlight ? 'text-red-600' : 'text-slate-400 dark:text-slate-500'}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
                {!isCollapsed && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white dark:bg-slate-900 text-brand-700' : 'bg-red-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl border border-slate-300 dark:border-slate-700">
                    {item.label}
                    {item.badge > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Fast Action Card for Student */}
        {user?.role === 'Student' && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-gradient-to-t from-red-950/40 to-transparent shrink-0">
            <button
              onClick={onOpenCallBooth}
              title={isCollapsed ? 'Fast Call Booth' : ''}
              className={`w-full flex items-center justify-center py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-600/30 transition-all cursor-pointer ${isCollapsed ? 'px-0' : 'gap-2 px-4'}`}
            >
              <PhoneCall className="w-5 h-5 animate-bounce shrink-0" />
              {!isCollapsed && <span>FAST CALL BOOTH</span>}
            </button>
          </div>
        )}

      </aside>
    </>
  );
}

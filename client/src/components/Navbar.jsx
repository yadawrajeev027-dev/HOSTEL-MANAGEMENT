import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, LogOut, Shield, Menu, Settings as SettingsIcon, Edit3, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export function Navbar({ toggleSidebar, isSidebarCollapsed, setIsSidebarCollapsed, setCurrentTab }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const dropdownRef = useRef(null);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    setIsDropdownOpen(false);
    logout();
  };

  return (
    <>
      <nav className={`h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 fixed top-0 right-0 z-30 transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:left-[72px] lg:w-[calc(100%-72px)]' : 'lg:left-[260px] lg:w-[calc(100%-260px)]'
      } left-0 w-full`}>
        
        {/* Mobile Toggle & Brand */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Shield className="w-5 h-5 text-slate-900 dark:text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight hidden sm:block font-outfit">Hostel<span className="text-brand-500">Sync</span></span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          <button 
            onClick={toggleDarkMode}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button 
            onClick={() => setCurrentTab('notifications')}
            className="relative p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full border border-slate-300 dark:border-slate-700 hover:border-slate-500 transition-colors bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">{user?.name}</span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{user?.role}</span>
              </div>
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-700" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-500/40 text-brand-600 flex items-center justify-center font-bold text-sm">
                  {user?.name?.charAt(0) || <User className="w-4 h-4" />}
                </div>
              )}
            </button>

            {/* Dropdown Menu (Click based) */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                <div className="p-4 border-b border-slate-300 dark:border-slate-700 sm:hidden">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{user?.role}</p>
                </div>
                
                <div className="p-2 space-y-1">
                  <button 
                    onClick={() => { setCurrentTab('profile'); setIsDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4" /> My Profile
                  </button>
                  <button 
                    onClick={() => { setCurrentTab('settings'); setIsDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 rounded-lg transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4" /> Settings & Security
                  </button>
                  
                  <div className="h-px bg-slate-700/50 my-1"></div>
                  
                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Confirm Logout</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">Are you sure you want to log out of your account?</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, GraduationCap, Lock, User, UserPlus, LogIn, ChevronRight, Hash } from 'lucide-react';

export function LoginPage() {
  const { loginStudent, registerStudent, loginAdmin } = useAuth();
  
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'admin'
  const [studentMode, setStudentMode] = useState('login'); // 'login' or 'register'
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Student Form State
  const [studentRegNo, setStudentRegNo] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentDept, setStudentDept] = useState('Computer Science & Engineering');
  const [studentYear, setStudentYear] = useState('1st Year');
  const [studentBranch, setStudentBranch] = useState('B.Tech CSE');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Admin Form State
  const [adminRole, setAdminRole] = useState('Chief Warden');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (studentMode === 'login') {
        if (!studentRegNo || !studentPassword) {
          throw new Error("Registration Number and Password are required.");
        }
        await loginStudent(studentRegNo, studentPassword);
      } else {
        if (!studentName || !studentRegNo || !studentPassword || !confirmPassword) {
          throw new Error("All fields are required.");
        }
        if (studentPassword !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        if (studentPassword.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }

        const formData = {
          name: studentName,
          registrationNumber: studentRegNo,
          department: studentDept,
          year: studentYear,
          branch: studentBranch,
          password: studentPassword
        };
        await registerStudent(formData);
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!adminUsername || !adminPassword) {
        throw new Error("Username and Password are required.");
      }
      await loginAdmin(adminRole, adminUsername, adminPassword);
    } catch (err) {
      setError(err.message || "Invalid Admin Credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-500/20">
            <Shield className="w-8 h-8 text-slate-900 dark:text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-200 tracking-tight font-outfit">Hostel<span className="text-brand-600">Sync</span></h1>
          <p className="text-slate-400 dark:text-slate-500 mt-2 font-medium">Campus Accommodation Portal</p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          
          {/* Top Tabs */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => { setActiveTab('student'); setError(''); }}
              className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'student' 
                  ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/50' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Student Portal
            </button>
            <button
              onClick={() => { setActiveTab('admin'); setError(''); }}
              className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'admin' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin / Warden
            </button>
          </div>

          <div className="p-6 sm:p-8">
            
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium flex items-start gap-3">
                <div className="mt-0.5"><Lock className="w-4 h-4" /></div>
                {error}
              </div>
            )}

            {/* --- STUDENT PORTAL --- */}
            {activeTab === 'student' && (
              <div>
                {/* Login / Register Toggle */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
                  <button
                    onClick={() => { setStudentMode('login'); setError(''); }}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                      studentMode === 'login' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => { setStudentMode('register'); setError(''); }}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                      studentMode === 'register' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                <form onSubmit={handleStudentSubmit} className="space-y-4">
                  
                  {studentMode === 'register' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                        </div>
                        <input
                          type="text"
                          required
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none text-sm transition-shadow"
                          placeholder="E.g., Rahul Sharma"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Registration Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                      </div>
                      <input
                        type="text"
                        required
                        value={studentRegNo}
                        onChange={(e) => setStudentRegNo(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none text-sm uppercase transition-shadow"
                        placeholder="E.g., 24BCE1001"
                      />
                    </div>
                  </div>

                  {studentMode === 'register' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Department</label>
                        <select
                          value={studentDept}
                          onChange={(e) => setStudentDept(e.target.value)}
                          className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none text-sm"
                        >
                          <option>Computer Science & Engineering</option>
                          <option>Electronics & Communication</option>
                          <option>Mechanical Engineering</option>
                          <option>Civil Engineering</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Year</label>
                        <select
                          value={studentYear}
                          onChange={(e) => setStudentYear(e.target.value)}
                          className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none text-sm"
                        >
                          <option>1st Year</option>
                          <option>2nd Year</option>
                          <option>3rd Year</option>
                          <option>4th Year</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                      </div>
                      <input
                        type="password"
                        required
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none text-sm transition-shadow"
                        placeholder={studentMode === 'register' ? "Create a secure password" : "Enter your password"}
                      />
                    </div>
                  </div>

                  {studentMode === 'register' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Confirm Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                        </div>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none text-sm transition-shadow"
                          placeholder="Re-enter your password"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-brand-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : studentMode === 'login' ? (
                      <>Log In <LogIn className="w-4 h-4" /></>
                    ) : (
                      <>Create Account <UserPlus className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* --- ADMIN PORTAL --- */}
            {activeTab === 'admin' && (
              <form onSubmit={handleAdminSubmit} className="space-y-5">
                
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700 mb-4 flex gap-3">
                  <Shield className="w-5 h-5 shrink-0 text-indigo-600" />
                  <p>
                    <strong>Secure Access:</strong> Authorized personnel only. If you are logging in for the first time as the root admin, use <code className="bg-indigo-100 px-1 py-0.5 rounded text-indigo-800">admin</code> and your default credentials.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Authority Role</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-indigo-400" />
                    </div>
                    <select
                      value={adminRole}
                      onChange={(e) => setAdminRole(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-slate-900 shadow-sm font-medium"
                    >
                      <option value="Chief Warden">Chief Warden (Admin)</option>
                      <option value="Deputy Chief Warden">Deputy Chief Warden</option>
                      <option value="Department Warden">Department Warden</option>
                      <option value="Floor Warden">Floor Warden</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type="text"
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-shadow"
                      placeholder="Enter assigned username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-shadow"
                      placeholder="Enter secure password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-slate-900 dark:text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>Log In to Dashboard <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

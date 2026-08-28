import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('hostel_token');
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.user);
        } catch (err) {
          console.error("Token invalid or expired", err);
          localStorage.removeItem('hostel_token');
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const loginStudent = async (registrationNumber, password) => {
    const res = await authApi.studentLogin(registrationNumber, password);
    localStorage.setItem('hostel_token', res.token);
    setUser(res.user);
  };

  const registerStudent = async (formData) => {
    const res = await authApi.studentRegister(formData);
    localStorage.setItem('hostel_token', res.token);
    setUser(res.user);
  };

  const loginAdmin = async (role, username, password) => {
    const res = await authApi.adminLogin(role, username, password);
    localStorage.setItem('hostel_token', res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('hostel_token');
    setUser(null);
  };

  const updateUser = (newUserObj) => {
    setUser(newUserObj);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user,
      loginStudent, 
      registerStudent, 
      loginAdmin, 
      logout, 
      updateUser,
      loading 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const token = localStorage.getItem('medibridge_access_token');
    const storedUser = localStorage.getItem('medibridge_user');

    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        if (parsed.role === 'patient') {
          fetchPatientProfiles();
        }
      } catch (e) {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const fetchPatientProfiles = async () => {
    try {
      const res = await api.get('/patient-profiles');
      if (res.data.success) {
        setProfiles(res.data.data);
        const defaultProfile = res.data.data.find((p) => p.isDefault) || res.data.data[0];
        setActiveProfile(defaultProfile || null);
      }
    } catch (err) {
      console.error('[Auth] Failed to load family profiles:', err.message);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { user: userData, tokens } = res.data.data;
      localStorage.setItem('medibridge_access_token', tokens.accessToken);
      localStorage.setItem('medibridge_refresh_token', tokens.refreshToken);
      localStorage.setItem('medibridge_user', JSON.stringify(userData));
      setUser(userData);

      if (userData.role === 'patient') {
        await fetchPatientProfiles();
      }
      return userData;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('medibridge_refresh_token');
      await api.post('/auth/logout', { refreshToken });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.clear();
      setUser(null);
      setProfiles([]);
      setActiveProfile(null);
      window.location.href = '/login';
    }
  };

  const switchProfile = (profileId) => {
    const selected = profiles.find((p) => p._id === profileId);
    if (selected) {
      setActiveProfile(selected);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profiles,
        activeProfile,
        loading,
        login,
        logout,
        switchProfile,
        refreshProfiles: fetchPatientProfiles
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

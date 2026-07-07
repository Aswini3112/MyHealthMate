import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../config';

export interface PatientUser {
  _id?: string;
  id?: string;
  abhaId?: string;
  name: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  createdAt?: string;
}

export interface DoctorAccessSession {
  patient: PatientUser;
  documents: any[];
  doctorName: string;
  accessType?: 'otp' | 'qr_code';
  verified: boolean;
}

interface AuthContextType {
  user: PatientUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  doctorSession: DoctorAccessSession | null;
  
  loginWithAbha: (abhaId: string) => Promise<{ success: boolean; message: string; transactionId?: string }>;
  verifyAbhaOtp: (abhaId: string, otp: string, transactionId: string) => Promise<{ success: boolean; message: string }>;

  registerRegular: (data: any) => Promise<{ success: boolean; message: string }>;
  loginRegular: (data: any) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  
  verifyDoctorOtp: (otp: string, doctorName: string) => Promise<{ success: boolean; message: string }>;
  verifyDoctorQr: (hash: string) => Promise<{ success: boolean; message: string }>;
  doctorLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<PatientUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [doctorSession, setDoctorSession] = useState<DoctorAccessSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('myhealthmate_token');
    const savedUser = localStorage.getItem('myhealthmate_user');
    const savedDoc = localStorage.getItem('myhealthmate_doctor_session');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    if (savedDoc) {
      setDoctorSession(JSON.parse(savedDoc));
    }
    setIsLoading(false);
  }, []);

  const loginWithAbha = async (abhaId: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login-abha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abhaId }),
      });
      return await res.json();
    } catch (err) {
      console.error(err);
      return { success: false, message: 'ABHA gateway is temporarily unreachable.' };
    }
  };

  const verifyAbhaOtp = async (abhaId: string, otp: string, transactionId: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-abha-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abhaId, otp, transactionId }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        setToken(data.token);
        setUser(data.patient);
        localStorage.setItem('myhealthmate_token', data.token);
        localStorage.setItem('myhealthmate_user', JSON.stringify(data.patient));
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'OTP verification failed.' };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Server error during OTP verification.' };
    }
  };

  const registerRegular = async (regData: any) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register-regular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData),
      });
      const data = await res.json();
      if (data.success && data.token) {
        setToken(data.token);
        setUser(data.patient);
        localStorage.setItem('myhealthmate_token', data.token);
        localStorage.setItem('myhealthmate_user', JSON.stringify(data.patient));
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Registration failed.' };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Server error during registration.' };
    }
  };

  const loginRegular = async (credentials: any) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login-regular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (data.success && data.token) {
        setToken(data.token);
        setUser(data.patient);
        localStorage.setItem('myhealthmate_token', data.token);
        localStorage.setItem('myhealthmate_user', JSON.stringify(data.patient));
        return { success: true, message: 'Welcome back!' };
      }
      return { success: false, message: data.message || 'Login failed.' };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Server error during login.' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('myhealthmate_token');
    localStorage.removeItem('myhealthmate_user');
  };

  const verifyDoctorOtp = async (otpCode: string, doctorName: string) => {
    try {
      const res = await fetch(`${API_BASE}/doctor/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpCode, doctorName }),
      });
      const data = await res.json();
      if (data.success && data.patient) {
        const session: DoctorAccessSession = {
          patient: data.patient,
          documents: data.documents,
          doctorName: doctorName || 'Dr. Verified',
          accessType: 'otp',
          verified: true
        };
        setDoctorSession(session);
        localStorage.setItem('myhealthmate_doctor_session', JSON.stringify(session));
        return { success: true, message: 'Access verification successful.' };
      }
      return { success: false, message: data.message || 'OTP Verification failed.' };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Server communication error.' };
    }
  };

  const verifyDoctorQr = async (hash: string) => {
    try {
      const res = await fetch(`${API_BASE}/doctor/access-qr/${hash}`);
      const data = await res.json();
      if (data.success && data.patient) {
        const session: DoctorAccessSession = {
          patient: data.patient,
          documents: data.documents,
          doctorName: data.doctorName || 'Dr. QR Verified',
          accessType: 'qr_code',
          verified: true
        };
        setDoctorSession(session);
        localStorage.setItem('myhealthmate_doctor_session', JSON.stringify(session));
        return { success: true, message: 'Access verified via QR.' };
      }
      return { success: false, message: data.message || 'QR Link invalid or expired.' };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'QR verify server error.' };
    }
  };

  const doctorLogout = () => {
    setDoctorSession(null);
    localStorage.removeItem('myhealthmate_doctor_session');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
      doctorSession,
  loginWithAbha,
  verifyAbhaOtp,
  registerRegular,
  loginRegular,

  logout,

      verifyDoctorOtp,
      verifyDoctorQr,
      doctorLogout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

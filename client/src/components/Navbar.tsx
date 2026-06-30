import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, LayoutDashboard, FileText, BarChart3, MessageSquare, Share2, LogOut, User } from 'lucide-react';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout, doctorSession, doctorLogout } = useAuth();
  const location = useLocation();

  const isDoctor = location.pathname.startsWith('/doctor-portal');

  const isPublicPage = location.pathname === '/' || location.pathname === '/auth';

  if (!isAuthenticated && !doctorSession && !isPublicPage) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-slate-800 shadow-md">
      <Link to="/" className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-primary rounded-xl flex items-center justify-center pulse-primary">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="text-xl font-bold tracking-wide text-gradient">MyHealthMate</span>
          {isDoctor && <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full font-medium">Doctor View</span>}
        </div>
      </Link>

      {isAuthenticated && !isDoctor && (
        <div className="hidden md:flex items-center gap-1.5">
          <Link
            to="/dashboard"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isActive('/dashboard')
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            to="/records"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isActive('/records')
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileText className="w-4 h-4" />
            Medical Records
          </Link>
          <Link
            to="/analytics"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isActive('/analytics')
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Health Tracker
          </Link>
          <Link
            to="/chatbot"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isActive('/chatbot')
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            AI Companion
          </Link>
          <Link
            to="/share"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isActive('/share')
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Share2 className="w-4 h-4" />
            Doctor Share
          </Link>
        </div>
      )}

      <div className="flex items-center gap-4">
        {!isAuthenticated && !doctorSession && isPublicPage && (
          <div className="flex items-center gap-3">
            <Link
              to="/doctor-portal"
              className="hidden sm:flex text-xs text-slate-400 hover:text-slate-200 font-semibold px-3 py-2"
            >
              Doctor Portal
            </Link>
            <Link
              to="/auth"
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-gradient-primary text-white hover:opacity-95 transition-all"
            >
              Sign In
            </Link>
          </div>
        )}

        {isAuthenticated && !isDoctor && user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-200">{user.name}</span>
              {/* ABHA ID is intentionally not displayed by default */}
              {user.abhaId && <span className="hidden">{user.abhaId}</span>}

            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
              <User className="w-5 h-5 text-emerald-400" />
            </div>
            <button
              onClick={logout}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {doctorSession && (isDoctor || !isAuthenticated) && (
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-indigo-300">{doctorSession.doctorName}</span>
              <span className="text-xs text-slate-400">Accessing: {doctorSession.patient.name}</span>
            </div>
            <button
              onClick={doctorLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-rose-950 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit Portal
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

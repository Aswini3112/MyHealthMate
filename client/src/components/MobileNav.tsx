import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, BarChart3, MessageSquare, Share2 } from 'lucide-react';

const MobileNav: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || location.pathname.startsWith('/doctor-portal')) {
    return null;
  }

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/records', icon: FileText, label: 'Records' },
    { to: '/analytics', icon: BarChart3, label: 'Vitals' },
    { to: '/chatbot', icon: MessageSquare, label: 'AI Chat' },
    { to: '/share', icon: Share2, label: 'Share' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-slate-800 px-2 py-2">
      <div className="flex items-center justify-around">
        {links.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-semibold transition-all ${
                active ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;

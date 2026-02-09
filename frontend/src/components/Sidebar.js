import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { LayoutDashboard, Users, Calendar, LogOut, Activity } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = user?.role === 'admin' ? [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Users', path: '/admin/dashboard' },
    { icon: Calendar, label: 'Calendar', path: '/admin/dashboard' },
    { icon: Activity, label: 'Procedures', path: '/admin/dashboard' }
  ] : user?.role === 'doctor' ? [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/doctor/dashboard' },
    { icon: Users, label: 'Patients', path: '/doctor/dashboard' },
    { icon: Calendar, label: 'Appointments', path: '/doctor/dashboard' }
  ] : [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/receptionist/dashboard' },
    { icon: Users, label: 'Patients', path: '/receptionist/dashboard' },
    { icon: Calendar, label: 'Appointments', path: '/receptionist/dashboard' }
  ];

  return (
    <div className="w-64 bg-white/80 backdrop-blur-md border-r border-slate-200/50 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-6 w-6 text-emerald-600" />
          <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Expert's Dental Clinic
          </h2>
        </div>
        <p className="text-sm text-slate-500 mt-2">{user?.name}</p>
        <p className="text-xs text-emerald-600 font-medium capitalize">{user?.role || 'user'}</p>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={index}
                data-testid={`sidebar-${item.label.toLowerCase()}-btn`}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-2">
        <Button
          data-testid="sidebar-logout-btn"
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}

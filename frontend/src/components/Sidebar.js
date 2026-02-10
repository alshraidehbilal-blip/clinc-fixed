import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { LayoutDashboard, Users, Calendar, LogOut, Activity } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  if (!user) {
  return null;
}

  const handleLogout = () => {
    logout();
    window.location.href = '/login'; // نستخدم window.location بدل navigate
  };

  const menuItems = user?.role === 'admin' ? [
    { icon: LayoutDashboard, label: 'Dashboard', tab: 'dashboard' },
    { icon: Users, label: 'Users', tab: 'users' },
    { icon: Calendar, label: 'Calendar', tab: 'calendar' },
    { icon: Activity, label: 'Procedures', tab: 'procedures' }
  ] : user?.role === 'doctor' ? [
    { icon: LayoutDashboard, label: 'Dashboard', tab: 'dashboard' },
    { icon: Users, label: 'Patients', tab: 'patients' },
    { icon: Calendar, label: 'Appointments', tab: 'appointments' }
  ] : [
    { icon: LayoutDashboard, label: 'Dashboard', tab: 'dashboard' },
    { icon: Users, label: 'Patients', tab: 'patients' },
    { icon: Calendar, label: 'Appointments', tab: 'appointments' }
  ];

  return (
    <div className="w-64 bg-white/80 backdrop-blur-md border-r border-slate-200/50 flex flex-col">
      {/* Header */}
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

      {/* Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tab;
            return (
              <button
                key={index}
                data-testid={`sidebar-${item.label.toLowerCase()}-btn`}
                onClick={() => setActiveTab(item.tab)}
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

      {/* Logout */}
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

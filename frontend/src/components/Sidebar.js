import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { LayoutDashboard, Users, Calendar, LogOut, Globe, Activity } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = user?.role === 'admin' ? [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/admin/dashboard' },
    { icon: Users, label: t('users'), path: '/admin/dashboard' },
    { icon: Calendar, label: t('calendar'), path: '/admin/dashboard' },
    { icon: Activity, label: t('procedures'), path: '/admin/dashboard' }
  ] : user?.role === 'doctor' ? [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/doctor/dashboard' },
    { icon: Users, label: t('patients'), path: '/doctor/dashboard' },
    { icon: Calendar, label: t('appointments'), path: '/doctor/dashboard' }
  ] : [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/receptionist/dashboard' },
    { icon: Users, label: t('patients'), path: '/receptionist/dashboard' },
    { icon: Calendar, label: t('appointments'), path: '/receptionist/dashboard' }
  ];

  return (
    <div className="w-64 bg-white/80 backdrop-blur-md border-r border-slate-200/50 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-6 w-6 text-emerald-600" />
          <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {t('dentalClinic')}
          </h2>
        </div>
        <p className="text-sm text-slate-500 mt-2">{user?.name}</p>
        <p className="text-xs text-emerald-600 font-medium">{t(user?.role || 'user')}</p>
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
          data-testid="sidebar-language-toggle-btn"
          variant="ghost"
          className="w-full justify-start"
          onClick={toggleLanguage}
        >
          <Globe className="h-5 w-5 mr-3" />
          {i18n.language === 'en' ? 'العربية' : 'English'}
        </Button>
        <Button
          data-testid="sidebar-logout-btn"
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          {t('logout')}
        </Button>
      </div>
    </div>
  );
}

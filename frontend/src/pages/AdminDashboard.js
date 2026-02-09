import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Users, Calendar, DollarSign, Activity, UserPlus, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import UsersManagement from '../components/UsersManagement';
import ProceduresManagement from '../components/ProceduresManagement';
import PaymentsManagement from '../components/PaymentsManagement';
import CalendarView from '../components/CalendarView';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    total_patients: 0,
    appointments_today: 0,
    total_doctors: 0,
    total_revenue: 0,
    total_collected: 0,
    total_pending: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-emerald-600 font-medium">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {t('welcome')}, {user?.name}
            </h1>
            <p className="text-slate-600">{t('admin')} {t('dashboard')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card data-testid="total-patients-card" className="border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{t('patients')}</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.total_patients}</p>
                  </div>
                  <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="today-appointments-card" className="border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{t('todayAppointments')}</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.appointments_today}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="total-doctors-card" className="border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{t('totalDoctors')}</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.total_doctors}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="total-revenue-card" className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-700 mb-1">{t('totalRevenue')}</p>
                    <p className="text-3xl font-bold text-emerald-900">{stats.total_revenue.toFixed(2)} {t('JOD')}</p>
                  </div>
                  <div className="h-12 w-12 bg-emerald-200 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-emerald-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="total-collected-card" className="border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{t('totalCollected')}</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.total_collected.toFixed(2)} {t('JOD')}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="total-pending-card" className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700 mb-1">{t('totalPending')}</p>
                    <p className="text-3xl font-bold text-orange-900">{stats.total_pending.toFixed(2)} {t('JOD')}</p>
                  </div>
                  <div className="h-12 w-12 bg-orange-200 rounded-lg flex items-center justify-center">
                    <ClipboardList className="h-6 w-6 text-orange-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6" data-testid="admin-tabs">
              <TabsTrigger value="calendar" data-testid="tab-calendar">{t('calendar')}</TabsTrigger>
              <TabsTrigger value="users" data-testid="tab-users">{t('users')}</TabsTrigger>
              <TabsTrigger value="procedures" data-testid="tab-procedures">{t('procedures')}</TabsTrigger>
              <TabsTrigger value="payments" data-testid="tab-payments">{t('payments')}</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" data-testid="calendar-content">
              <CalendarView />
            </TabsContent>

            <TabsContent value="users" data-testid="users-content">
              <UsersManagement />
            </TabsContent>

            <TabsContent value="procedures" data-testid="procedures-content">
              <ProceduresManagement />
            </TabsContent>

            <TabsContent value="payments" data-testid="payments-content">
              <PaymentsManagement />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
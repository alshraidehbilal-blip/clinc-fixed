import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
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
  const [stats, setStats] = useState({
    total_patients: 0,
    appointments_today: 0,
    total_doctors: 0,
    total_revenue: 0,
    total_collected: 0,
    total_pending: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data for modals
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  
  // Modal states
  const [showPatientsModal, setShowPatientsModal] = useState(false);
  const [showDoctorsModal, setShowDoctorsModal] = useState(false);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showCollectedModal, setShowCollectedModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchAllData();
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

  const fetchAllData = async () => {
    try {
      const [patientsRes, doctorsRes, appointmentsRes, paymentsRes] = await Promise.all([
        axios.get(`${API}/patients`),
        axios.get(`${API}/doctors`),
        axios.get(`${API}/appointments`),
        axios.get(`${API}/payments`)
      ]);
      setPatients(patientsRes.data);
      setDoctors(doctorsRes.data);
      setAppointments(appointmentsRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const getTodayAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(appt => appt.date === today && appt.status !== 'cancelled');
  };

  const getPaidPayments = () => {
    return payments.filter(p => p.amount > 0);
  };

  const getPendingPatients = () => {
    return patients.filter(p => p.balance > 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-[#1FAE6A] font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#0F0F0F] mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Welcome, {user?.name}
            </h1>
            <p className="text-slate-600">Admin Dashboard</p>
          </div>

          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card 
                  onClick={() => setShowPatientsModal(true)}
                  className="border-slate-200 cursor-pointer hover:shadow-lg hover:border-[#1FAE6A] transition-all"
                  data-testid="total-patients-card"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Total Patients</p>
                        <p className="text-3xl font-bold text-[#0F0F0F]">{stats.total_patients}</p>
                        <p className="text-xs text-[#1FAE6A] mt-1">Click to view all</p>
                      </div>
                      <div className="h-12 w-12 bg-[#1FAE6A]/10 rounded-xl flex items-center justify-center">
                        <Users className="h-6 w-6 text-[#1FAE6A]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  onClick={() => setShowAppointmentsModal(true)}
                  className="border-slate-200 cursor-pointer hover:shadow-lg hover:border-[#1E88E5] transition-all"
                  data-testid="appointments-today-card"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Today's Appointments</p>
                        <p className="text-3xl font-bold text-[#0F0F0F]">{stats.appointments_today}</p>
                        <p className="text-xs text-[#1E88E5] mt-1">Click to view all</p>
                      </div>
                      <div className="h-12 w-12 bg-[#1E88E5]/10 rounded-xl flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-[#1E88E5]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  onClick={() => setShowDoctorsModal(true)}
                  className="border-slate-200 cursor-pointer hover:shadow-lg hover:border-purple-600 transition-all"
                  data-testid="total-doctors-card"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Total Doctors</p>
                        <p className="text-3xl font-bold text-[#0F0F0F]">{stats.total_doctors}</p>
                        <p className="text-xs text-purple-600 mt-1">Click to view all</p>
                      </div>
                      <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <UserPlus className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  onClick={() => setShowRevenueModal(true)}
                  className="border-[#1FAE6A]/30 bg-gradient-to-br from-[#1FAE6A]/10 to-white cursor-pointer hover:shadow-lg transition-all"
                  data-testid="total-revenue-card"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#1FAE6A] mb-1 font-medium">Total Revenue</p>
                        <p className="text-3xl font-bold text-[#0F0F0F]">{stats.total_revenue.toFixed(2)} JOD</p>
                        <p className="text-xs text-[#1FAE6A] mt-1">Click to view details</p>
                      </div>
                      <div className="h-12 w-12 bg-[#1FAE6A]/20 rounded-xl flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-[#1FAE6A]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  onClick={() => setShowCollectedModal(true)}
                  className="border-slate-200 cursor-pointer hover:shadow-lg hover:border-[#2ECC71] transition-all"
                  data-testid="total-collected-card"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Total Collected</p>
                        <p className="text-3xl font-bold text-[#0F0F0F]">{stats.total_collected.toFixed(2)} JOD</p>
                        <p className="text-xs text-[#2ECC71] mt-1">Click to view payments</p>
                      </div>
                      <div className="h-12 w-12 bg-[#2ECC71]/10 rounded-xl flex items-center justify-center">
                        <Activity className="h-6 w-6 text-[#2ECC71]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  onClick={() => setShowPendingModal(true)}
                  className="border-[#F4B400]/30 bg-gradient-to-br from-[#F4B400]/10 to-white cursor-pointer hover:shadow-lg transition-all"
                  data-testid="total-pending-card"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#F4B400] mb-1 font-medium">Total Pending</p>
                        <p className="text-3xl font-bold text-[#0F0F0F]">{stats.total_pending.toFixed(2)} JOD</p>
                        <p className="text-xs text-[#F4B400] mt-1">Click to view pending</p>
                      </div>
                      <div className="h-12 w-12 bg-[#F4B400]/20 rounded-xl flex items-center justify-center">
                        <ClipboardList className="h-6 w-6 text-[#F4B400]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          <div className="w-full">
            {activeTab === 'calendar' && <CalendarView />}
            {activeTab === 'users' && <UsersManagement />}
            {activeTab === 'procedures' && <ProceduresManagement />}
            {activeTab === 'payments' && <PaymentsManagement />}
          </div>
        </div>
      </main>

      {/* Patients Modal */}
      <Dialog open={showPatientsModal} onOpenChange={setShowPatientsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0F0F0F]">All Patients ({patients.length})</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Doctor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {patients.map(patient => (
                  <tr key={patient.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-[#0F0F0F]">{patient.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{patient.phone}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{patient.doctor_name}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#F4B400]">{patient.balance.toFixed(2)} JOD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Doctors Modal */}
      <Dialog open={showDoctorsModal} onOpenChange={setShowDoctorsModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0F0F0F]">All Doctors ({doctors.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {doctors.map(doctor => (
              <div key={doctor.id} className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
                <p className="font-semibold text-[#0F0F0F]">{doctor.name}</p>
                <p className="text-sm text-slate-600">{doctor.email}</p>
                <p className="text-sm text-slate-600">{doctor.phone}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Today's Appointments Modal */}
      <Dialog open={showAppointmentsModal} onOpenChange={setShowAppointmentsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0F0F0F]">Today's Appointments ({getTodayAppointments().length})</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {getTodayAppointments().map(appt => (
                  <tr key={appt.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-[#0F0F0F]">{appt.time}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#0F0F0F]">{appt.patient_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        appt.status === 'confirmed' ? 'bg-[#1FAE6A]/10 text-[#1FAE6A]' :
                        appt.status === 'done' ? 'bg-[#2ECC71]/10 text-[#2ECC71]' :
                        'bg-[#E53935]/10 text-[#E53935]'
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{appt.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revenue Details Modal */}
      <Dialog open={showRevenueModal} onOpenChange={setShowRevenueModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0F0F0F]">Total Revenue Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-[#1FAE6A]/10 rounded-xl p-6">
              <p className="text-sm text-[#1FAE6A] font-medium mb-2">Total Revenue</p>
              <p className="text-4xl font-bold text-[#0F0F0F]">{stats.total_revenue.toFixed(2)} JOD</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600 mb-1">Total Collected</p>
                <p className="text-2xl font-bold text-[#2ECC71]">{stats.total_collected.toFixed(2)} JOD</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600 mb-1">Total Pending</p>
                <p className="text-2xl font-bold text-[#F4B400]">{stats.total_pending.toFixed(2)} JOD</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Collected Payments Modal */}
      <Dialog open={showCollectedModal} onOpenChange={setShowCollectedModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0F0F0F]">Collected Payments ({getPaidPayments().length})</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {getPaidPayments().map(payment => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-[#0F0F0F]">{payment.patient_name}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#2ECC71]">{payment.amount.toFixed(2)} JOD</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(payment.payment_date).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{payment.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pending Balances Modal */}
      <Dialog open={showPendingModal} onOpenChange={setShowPendingModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0F0F0F]">Pending Balances ({getPendingPatients().length})</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Patient Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {getPendingPatients().map(patient => (
                  <tr key={patient.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-[#0F0F0F]">{patient.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{patient.phone}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{patient.total_cost.toFixed(2)} JOD</td>
                    <td className="px-4 py-3 text-sm text-[#2ECC71] font-semibold">{patient.total_paid.toFixed(2)} JOD</td>
                    <td className="px-4 py-3 text-sm text-[#F4B400] font-bold">{patient.balance.toFixed(2)} JOD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

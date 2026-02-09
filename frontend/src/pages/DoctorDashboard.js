import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Calendar, User, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({ appointments_today: 0, total_patients: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsRes, patientsRes, statsRes] = await Promise.all([
        axios.get(`${API}/appointments`),
        axios.get(`${API}/patients`),
        axios.get(`${API}/dashboard/stats`)
      ]);
      setAppointments(appointmentsRes.data);
      setPatients(patientsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getTodayAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(appt => appt.date === today && appt.status !== 'cancelled');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-emerald-600 font-medium">Loading...</div>
      </div>
    );
  }

  const todayAppointments = getTodayAppointments();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Welcome, {user?.name}
            </h1>
            <p className="text-slate-600">Dashboard</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div data-testid="today-appointments-card" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Today's Appointments</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.appointments_today}</p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div data-testid="total-patients-card" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Patients</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.total_patients}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl border border-emerald-400 shadow-sm p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-100 mb-1">Today</p>
                  <p className="text-lg font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <FileText className="h-8 w-8 text-emerald-100" />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Today's Appointments
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {todayAppointments.length === 0 ? (
                <div data-testid="no-appointments-message" className="p-8 text-center text-slate-500">
                  No appointments scheduled
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {todayAppointments.map((appt) => (
                        <tr key={appt.id} data-testid={`appointment-row-${appt.id}`} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{appt.time}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{appt.patient_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              appt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                              appt.status === 'done' ? 'bg-blue-100 text-blue-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {appt.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{appt.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Patients
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  data-testid={`patient-card-${patient.id}`}
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-slate-600" />
                    </div>
                    <Button
                      data-testid={`view-patient-btn-${patient.id}`}
                      size="sm"
                      variant="ghost"
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      View Profile
                    </Button>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">{patient.name}</h3>
                  <p className="text-sm text-slate-500 mb-3">{patient.phone}</p>
                  <div className="pt-3 border-t border-slate-100">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">
                        Total Cost: <span className="font-semibold text-slate-700">{patient.total_cost.toFixed(2)} JOD</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Total Paid: <span className="font-semibold text-emerald-600">{patient.total_paid.toFixed(2)} JOD</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Balance: <span className="font-semibold text-orange-600">{patient.balance.toFixed(2)} JOD</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

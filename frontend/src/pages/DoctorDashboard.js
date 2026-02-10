import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import CalendarView from '../components/CalendarView';
import { toast } from 'sonner';
import { User } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('calendar'); // التحكم بالتاب
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
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Welcome, {user?.name}
            </h1>
            <p className="text-slate-600">Doctor Dashboard</p>
          </div>

          {/* عرض المحتوى حسب التاب */}
          {activeTab === 'calendar' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Calendar</h2>
              <CalendarView />
            </div>
          )}

          {activeTab === 'patients' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Patients</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer"
                  >
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{patient.name}</h3>
                    <p className="text-sm text-slate-500 mb-3">{patient.phone}</p>
                    <div className="pt-3 border-t border-slate-100">
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
                ))}
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Today's Appointments</h2>
              {todayAppointments.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No appointments scheduled</div>
              ) : (
                <table className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                      <tr key={appt.id} className="hover:bg-slate-50">
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
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
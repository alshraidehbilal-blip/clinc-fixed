import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('patients');

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ total_patients: 0, appointments_today: 0 });
  const [loading, setLoading] = useState(true);

  const [showPatientDialog, setShowPatientDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);

  const [patientForm, setPatientForm] = useState({ name: '', phone: '', doctor_id: '' });
  const [appointmentForm, setAppointmentForm] = useState({ patient_id: '', doctor_id: '', date: '', time: '', status: 'confirmed' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [patientsRes, doctorsRes, appointmentsRes, statsRes] = await Promise.all([
        axios.get(`${API}/patients`),
        axios.get(`${API}/doctors`),
        axios.get(`${API}/appointments`),
        axios.get(`${API}/dashboard/stats`)
      ]);
      setPatients(patientsRes.data);
      setDoctors(doctorsRes.data);
      setAppointments(appointmentsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/patients`, patientForm);
      toast.success('Patient added successfully');
      setShowPatientDialog(false);
      setPatientForm({ name: '', phone: '', doctor_id: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add patient');
    }
  };

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/appointments`, appointmentForm);
      toast.success('Appointment created successfully');
      setShowAppointmentDialog(false);
      setAppointmentForm({ patient_id: '', doctor_id: '', date: '', time: '', status: 'confirmed' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create appointment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-emerald-600 font-medium">Loading...</div>
      </div>
    );
  }

  // تصفية مواعيد اليوم فقط
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(appt => appt.date === today && appt.status !== 'cancelled');

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Welcome, {user?.name}
              </h1>
              <p className="text-slate-600 capitalize">{activeTab} Dashboard</p>
            </div>
            <div className="flex gap-3">
              <Dialog open={showPatientDialog} onOpenChange={setShowPatientDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Patient
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Patient</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddPatient} className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={patientForm.name} onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })} required />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={patientForm.phone} onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })} required />
                    </div>
                    <div>
                      <Label>Select Doctor</Label>
                      <Select value={patientForm.doctor_id} onValueChange={(value) => setPatientForm({ ...patientForm, doctor_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map(doctor => <SelectItem key={doctor.id} value={doctor.id}>{doctor.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Save</Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={showAppointmentDialog} onOpenChange={setShowAppointmentDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-lg">
                    <Calendar className="h-4 w-4 mr-2" />
                    Add Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Appointment</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddAppointment} className="space-y-4">
                    <div>
                      <Label>Select Patient</Label>
                      <Select value={appointmentForm.patient_id} onValueChange={(value) => setAppointmentForm({ ...appointmentForm, patient_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map(patient => <SelectItem key={patient.id} value={patient.id}>{patient.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Select Doctor</Label>
                      <Select value={appointmentForm.doctor_id} onValueChange={(value) => setAppointmentForm({ ...appointmentForm, doctor_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map(doctor => <SelectItem key={doctor.id} value={doctor.id}>{doctor.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date</Label>
                        <Input type="date" value={appointmentForm.date} onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })} required />
                      </div>
                      <div>
                        <Label>Time</Label>
                        <Input type="time" value={appointmentForm.time} onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })} required />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Save</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* عرض القسم بناءً على التاب النشط */}
          {activeTab === 'patients' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Patients</h2>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {patients.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No patients found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Doctor</th>
                          <th>Total Cost</th>
                          <th>Total Paid</th>
                          <th>Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {patients.map(patient => (
                          <tr key={patient.id} className="hover:bg-slate-50">
                            <td>{patient.name}</td>
                            <td>{patient.phone}</td>
                            <td>{patient.doctor_name}</td>
                            <td>{patient.total_cost.toFixed(2)} JOD</td>
                            <td className="text-emerald-600 font-semibold">{patient.total_paid.toFixed(2)} JOD</td>
                            <td className="text-orange-600 font-semibold">{patient.balance.toFixed(2)} JOD</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Today's Appointments</h2>
              {todayAppointments.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No appointments scheduled</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th>Time</th>
                        <th>Patient Name</th>
                        <th>Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {todayAppointments.map(appt => (
                        <tr key={appt.id} className="hover:bg-slate-50">
                          <td>{appt.time}</td>
                          <td>{appt.patient_name}</td>
                          <td>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              appt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                              appt.status === 'done' ? 'bg-blue-100 text-blue-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {appt.status}
                            </span>
                          </td>
                          <td>{appt.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

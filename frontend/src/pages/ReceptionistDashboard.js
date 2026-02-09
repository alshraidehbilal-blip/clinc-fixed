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
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
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
      const [patientsRes, doctorsRes, statsRes] = await Promise.all([
        axios.get(`${API}/patients`),
        axios.get(`${API}/doctors`),
        axios.get(`${API}/dashboard/stats`)
      ]);
      setPatients(patientsRes.data);
      setDoctors(doctorsRes.data);
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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Welcome, {user?.name}
              </h1>
              <p className="text-slate-600">Dashboard</p>
            </div>
            <div className="flex gap-3">
              <Dialog open={showPatientDialog} onOpenChange={setShowPatientDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="add-patient-btn" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Patient
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="add-patient-dialog">
                  <DialogHeader>
                    <DialogTitle>Add Patient</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddPatient} className="space-y-4">
                    <div>
                      <Label htmlFor="patient-name">Name</Label>
                      <Input
                        id="patient-name"
                        data-testid="patient-name-input"
                        value={patientForm.name}
                        onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="patient-phone">Phone</Label>
                      <Input
                        id="patient-phone"
                        data-testid="patient-phone-input"
                        value={patientForm.phone}
                        onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="patient-doctor">Select Doctor</Label>
                      <Select value={patientForm.doctor_id} onValueChange={(value) => setPatientForm({ ...patientForm, doctor_id: value })}>
                        <SelectTrigger data-testid="patient-doctor-select">
                          <SelectValue placeholder="Select Doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>{doctor.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button data-testid="submit-patient-btn" type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Save
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={showAppointmentDialog} onOpenChange={setShowAppointmentDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="add-appointment-btn" variant="outline" className="rounded-lg">
                    <Calendar className="h-4 w-4 mr-2" />
                    Add Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="add-appointment-dialog">
                  <DialogHeader>
                    <DialogTitle>Add Appointment</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddAppointment} className="space-y-4">
                    <div>
                      <Label htmlFor="appt-patient">Select Patient</Label>
                      <Select value={appointmentForm.patient_id} onValueChange={(value) => setAppointmentForm({ ...appointmentForm, patient_id: value })}>
                        <SelectTrigger data-testid="appt-patient-select">
                          <SelectValue placeholder="Select Patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>{patient.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="appt-doctor">Select Doctor</Label>
                      <Select value={appointmentForm.doctor_id} onValueChange={(value) => setAppointmentForm({ ...appointmentForm, doctor_id: value })}>
                        <SelectTrigger data-testid="appt-doctor-select">
                          <SelectValue placeholder="Select Doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>{doctor.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="appt-date">Date</Label>
                        <Input
                          id="appt-date"
                          data-testid="appt-date-input"
                          type="date"
                          value={appointmentForm.date}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="appt-time">Time</Label>
                        <Input
                          id="appt-time"
                          data-testid="appt-time-input"
                          type="time"
                          value={appointmentForm.time}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <Button data-testid="submit-appointment-btn" type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Save
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div data-testid="total-patients-card" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Patients</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.total_patients}</p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <User className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div data-testid="today-appointments-card" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Today's Appointments</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.appointments_today}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Patients
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {patients.length === 0 ? (
                <div data-testid="no-patients-message" className="p-8 text-center text-slate-500">
                  No patients found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Doctor Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Cost</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Paid</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {patients.map((patient) => (
                        <tr key={patient.id} data-testid={`patient-row-${patient.id}`} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{patient.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{patient.phone}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{patient.doctor_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{patient.total_cost.toFixed(2)} JOD</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">{patient.total_paid.toFixed(2)} JOD</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600">{patient.balance.toFixed(2)} JOD</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

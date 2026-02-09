import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { ArrowLeft, Upload, FileText, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PatientDetailPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [xrays, setXrays] = useState([]);
  const [payments, setPayments] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [selectedProcedures, setSelectedProcedures] = useState([]);
  const [showAddHistoryDialog, setShowAddHistoryDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const isDoctor = user?.role === 'doctor';
  const isAdmin = user?.role === 'admin';
  const canRecordPayment = isAdmin || user?.role === 'receptionist';

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    try {
      const [patientRes, proceduresRes, paymentsRes] = await Promise.all([
        axios.get(`${API}/patients/${patientId}`),
        axios.get(`${API}/procedures`),
        axios.get(`${API}/patients/${patientId}/payments`)
      ]);
      setPatient(patientRes.data);
      setProcedures(proceduresRes.data);
      setPayments(paymentsRes.data);

      if (isDoctor || isAdmin) {
        const [historyRes, xraysRes] = await Promise.all([
          axios.get(`${API}/patients/${patientId}/history`),
          axios.get(`${API}/patients/${patientId}/xrays`)
        ]);
        setHistory(historyRes.data);
        setXrays(xraysRes.data);
      }
    } catch (error) {
      toast.error('Failed to fetch patient data');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHistory = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/patients/${patientId}/history`, {
        patient_id: patientId,
        notes,
        procedures: selectedProcedures
      });
      toast.success('History added successfully');
      setShowAddHistoryDialog(false);
      setNotes('');
      setSelectedProcedures([]);
      fetchData();
    } catch (error) {
      toast.error('Failed to add history');
    }
  };

  const handleUploadXray = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await axios.post(`${API}/patients/${patientId}/xray`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('X-ray uploaded successfully');
      setSelectedFile(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to upload X-ray');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/payments`, {
        patient_id: patientId,
        amount: parseFloat(paymentAmount),
        notes: paymentNotes
      });
      toast.success('Payment recorded successfully');
      setShowPaymentDialog(false);
      setPaymentAmount('');
      setPaymentNotes('');
      fetchData();
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const toggleProcedure = (procId) => {
    setSelectedProcedures(prev =>
      prev.includes(procId) ? prev.filter(id => id !== procId) : [...prev, procId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-emerald-600 font-medium">Loading...</div>
      </div>
    );
  }

  const getTotalCost = () => {
    return selectedProcedures.reduce((total, procId) => {
      const proc = procedures.find(p => p.id === procId);
      return total + (proc?.price || 0);
    }, 0);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Button
            data-testid="back-btn"
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {patient.name}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-sm text-slate-500">Phone</p>
                <p className="text-base font-medium text-slate-900">{patient.phone}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Doctor Name</p>
                <p className="text-base font-medium text-slate-900">{patient.doctor_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Cost</p>
                <p className="text-base font-semibold text-slate-700">{patient.total_cost.toFixed(2)} JOD</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Paid</p>
                <p className="text-base font-semibold text-emerald-600">{patient.total_paid.toFixed(2)} JOD</p>
              </div>
              <div className="md:col-span-2 lg:col-span-4">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                  <p className="text-sm text-orange-700 mb-1">Balance</p>
                  <p className="text-2xl font-bold text-orange-900">{patient.balance.toFixed(2)} JOD</p>
                </div>
              </div>
            </div>
          </div>

          {canRecordPayment && (
            <div className="mb-6">
              <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="record-payment-btn" className="bg-emerald-600 hover:bg-emerald-700">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="payment-dialog">
                  <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleRecordPayment} className="space-y-4">
                    <div>
                      <Label htmlFor="payment-amount">Amount (JOD)</Label>
                      <input
                        id="payment-amount"
                        type="number"
                        step="0.01"
                        data-testid="payment-amount-input"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment-notes">Notes</Label>
                      <Textarea
                        id="payment-notes"
                        data-testid="payment-notes-input"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <Button data-testid="submit-payment-btn" type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Save
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {isDoctor && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Dialog open={showAddHistoryDialog} onOpenChange={setShowAddHistoryDialog}>
                  <DialogTrigger asChild>
                    <Button data-testid="add-notes-btn" className="bg-emerald-600 hover:bg-emerald-700 w-full lg:w-auto">
                      <FileText className="h-4 w-4 mr-2" />
                      Add Notes
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="add-history-dialog" className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Notes</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddHistory} className="space-y-4">
                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          data-testid="notes-textarea"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={4}
                          required
                        />
                      </div>
                      <div>
                        <Label>Select Procedures</Label>
                        <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-4">
                          {procedures.map((proc) => (
                            <div key={proc.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`proc-${proc.id}`}
                                data-testid={`procedure-checkbox-${proc.id}`}
                                checked={selectedProcedures.includes(proc.id)}
                                onCheckedChange={() => toggleProcedure(proc.id)}
                              />
                              <label htmlFor={`proc-${proc.id}`} className="flex-1 text-sm cursor-pointer">
                                {proc.name_en} - <span className="text-emerald-600 font-semibold">{proc.price} JOD</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">Total Amount:</span>
                          <span className="text-lg font-bold text-emerald-600">{getTotalCost().toFixed(2)} JOD</span>
                        </div>
                      </div>
                      <Button data-testid="submit-history-btn" type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                        Save
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <form onSubmit={handleUploadXray} className="flex gap-2">
                  <input
                    type="file"
                    data-testid="xray-file-input"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  <Button data-testid="upload-xray-btn" type="submit" disabled={!selectedFile}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload X-Ray
                  </Button>
                </form>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Medical History
                  </h2>
                  <div className="space-y-4">
                    {history.length === 0 ? (
                      <p data-testid="no-history-message" className="text-sm text-slate-500">No history available</p>
                    ) : (
                      history.map((record) => (
                        <div key={record.id} data-testid={`history-record-${record.id}`} className="border-l-4 border-emerald-500 pl-4 py-2">
                          <p className="text-xs text-slate-500 mb-1">
                            {new Date(record.date).toLocaleDateString('en-US')}
                          </p>
                          <p className="text-sm text-slate-700 mb-2">{record.notes}</p>
                          {record.procedures.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {record.procedures.map((procId) => {
                                const proc = procedures.find(p => p.id === procId);
                                return proc ? (
                                  <span key={procId} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                                    {proc.name_en}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                          <p className="text-sm font-semibold text-emerald-600 mt-2">
                            Total Amount: {record.total_cost.toFixed(2)} JOD
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    X-Rays
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {xrays.length === 0 ? (
                      <p data-testid="no-xrays-message" className="text-sm text-slate-500">No X-rays available</p>
                    ) : (
                      xrays.map((xray) => (
                        <div key={xray.id} data-testid={`xray-${xray.id}`} className="border border-slate-200 rounded-lg p-2">
                          <img src={xray.image_data} alt={xray.filename} className="w-full h-48 object-cover rounded" />
                          <p className="text-xs text-slate-500 mt-2">{xray.filename}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(xray.uploaded_at).toLocaleDateString('en-US')}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Payment History
            </h2>
            {payments.length === 0 ? (
              <p data-testid="no-payments-message" className="text-sm text-slate-500">No data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Payment Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {payments.map((payment) => (
                      <tr key={payment.id} data-testid={`payment-row-${payment.id}`} className="hover:bg-slate-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                          {new Date(payment.payment_date).toLocaleDateString('en-US')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-emerald-600">
                          {payment.amount.toFixed(2)} JOD
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{payment.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

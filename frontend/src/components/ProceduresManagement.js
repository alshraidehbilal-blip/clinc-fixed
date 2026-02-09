import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProceduresManagement() {
  const { t, i18n } = useTranslation();
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState(null);
  const [deleteProcedure, setDeleteProcedure] = useState(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    price: '',
    description_en: '',
    description_ar: ''
  });

  useEffect(() => {
    fetchProcedures();
  }, []);

  const fetchProcedures = async () => {
    try {
      const response = await axios.get(`${API}/procedures`);
      setProcedures(response.data);
    } catch (error) {
      toast.error('Failed to fetch procedures');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, price: parseFloat(formData.price) };
      if (editingProcedure) {
        await axios.put(`${API}/procedures/${editingProcedure.id}`, data);
        toast.success('Procedure updated successfully');
      } else {
        await axios.post(`${API}/procedures`, data);
        toast.success('Procedure created successfully');
      }
      setShowDialog(false);
      resetForm();
      fetchProcedures();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save procedure');
    }
  };

  const handleEdit = (procedure) => {
    setEditingProcedure(procedure);
    setFormData({
      name_en: procedure.name_en,
      name_ar: procedure.name_ar,
      price: procedure.price.toString(),
      description_en: procedure.description_en || '',
      description_ar: procedure.description_ar || ''
    });
    setShowDialog(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/procedures/${deleteProcedure.id}`);
      toast.success('Procedure deleted successfully');
      setDeleteProcedure(null);
      fetchProcedures();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete procedure');
    }
  };

  const resetForm = () => {
    setFormData({ name_en: '', name_ar: '', price: '', description_en: '', description_ar: '' });
    setEditingProcedure(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {t('manageProcedures')}
        </h2>
        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="add-procedure-btn" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              {t('addProcedure')}
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="procedure-dialog" className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProcedure ? t('editProcedure') : t('addProcedure')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name_en">{t('nameEnglish')}</Label>
                  <Input
                    id="name_en"
                    data-testid="procedure-name-en-input"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name_ar">{t('nameArabic')}</Label>
                  <Input
                    id="name_ar"
                    data-testid="procedure-name-ar-input"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="price">{t('price')} ({t('JOD')})</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  data-testid="procedure-price-input"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description_en">{t('descriptionEnglish')}</Label>
                <Textarea
                  id="description_en"
                  data-testid="procedure-desc-en-input"
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="description_ar">{t('descriptionArabic')}</Label>
                <Textarea
                  id="description_ar"
                  data-testid="procedure-desc-ar-input"
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  rows={3}
                />
              </div>
              <Button data-testid="submit-procedure-btn" type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                {t('save')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {procedures.length === 0 ? (
          <div data-testid="no-procedures-message" className="p-8 text-center text-slate-500">{t('noData')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('name')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('price')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('description')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {procedures.map((procedure) => (
                  <tr key={procedure.id} data-testid={`procedure-row-${procedure.id}`} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {i18n.language === 'ar' ? procedure.name_ar : procedure.name_en}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                      {procedure.price.toFixed(2)} {t('JOD')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {i18n.language === 'ar' ? procedure.description_ar : procedure.description_en}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <Button
                          data-testid={`edit-procedure-btn-${procedure.id}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(procedure)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          data-testid={`delete-procedure-btn-${procedure.id}`}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteProcedure(procedure)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteProcedure} onOpenChange={(open) => !open && setDeleteProcedure(null)}>
        <AlertDialogContent data-testid="delete-procedure-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirmation')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-btn">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction data-testid="confirm-delete-btn" onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
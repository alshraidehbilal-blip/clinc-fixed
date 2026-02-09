import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'receptionist'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData);
      toast.success('Welcome');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Create Account
            </h1>
            <p className="text-slate-500">Manage your dental clinic efficiently</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name" data-testid="name-label">Name</Label>
              <Input
                id="name"
                data-testid="name-input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="email" data-testid="email-label">Email</Label>
              <Input
                id="email"
                data-testid="email-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="phone" data-testid="phone-label">Phone</Label>
              <Input
                id="phone"
                data-testid="phone-input"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="password" data-testid="password-label">Password</Label>
              <Input
                id="password"
                data-testid="password-input"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="role" data-testid="role-label">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger data-testid="role-select" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor" data-testid="role-doctor">Doctor</SelectItem>
                  <SelectItem value="receptionist" data-testid="role-receptionist">Receptionist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              data-testid="register-submit-btn"
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-lg font-medium"
              disabled={loading}
            >
              {loading ? '...' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

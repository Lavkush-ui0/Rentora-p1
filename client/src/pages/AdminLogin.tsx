import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { RentoraWordmark } from '../components/RentoraBrand';
import api from '../services/api';

export const AdminLogin: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data?.success && response.data.user?.role === 'ADMIN') {
        await login(email, password);
        navigate('/admin/dashboard');
      } else {
        setError('Access Denied: Only administrators can access this portal.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-primary-700/20 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-purple-700/20 rounded-full blur-3xl opacity-50"></div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <RentoraWordmark dark size={24} className="mb-4" />
          <h2 className="text-2xl font-black font-outfit text-white">Admin Dashboard</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-primary-500 mt-1">
            Control center
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-950/30 border border-red-900/50 rounded-2xl text-red-400 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="email"
                placeholder="admin@niet.co.in"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800/40 border border-slate-800 focus:border-primary-500 rounded-2xl pl-12 pr-4 py-3 text-white text-sm focus:outline-none transition-all placeholder-slate-600"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/40 border border-slate-800 focus:border-primary-500 rounded-2xl pl-12 pr-4 py-3 text-white text-sm focus:outline-none transition-all placeholder-slate-600"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <span>Enter Dashboard</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <a
            href="/home"
            className="text-xs font-bold text-slate-500 hover:text-slate-400 hover:underline"
          >
            ← Back to Student App
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

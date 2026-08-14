import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import logoLetterWhite from '../assets/logo-letter-white.png';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectPath = (location.state as any)?.from?.pathname || '/home';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to Rentora server. Make sure the backend server (npm run dev) is running on port 5000.');
      } else {
        setError(err.response.data?.message || err.response.data?.error || 'Login failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-primary-50 via-gray-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950 px-4 transition-colors duration-200">
      
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xl shadow-gray-200/50 dark:shadow-none animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 items-center justify-center p-2.5 shadow-lg shadow-red-500/20 mb-3">
            <img src={logoLetterWhite} alt="R" className="h-full w-full object-contain" />
          </div>
          <h2 className="text-2xl font-black font-outfit text-gray-900 dark:text-white">Welcome Back</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">Sign in to browse student-to-student rentals</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl text-red-700 dark:text-red-400 text-sm mb-6 animate-in slide-in-from-top-2 duration-150">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-medium leading-normal">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              NIET Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="yourname@niet.co.in"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 dark:bg-slate-800 dark:text-gray-100 placeholder-gray-400 pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm font-medium"
              />
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 dark:bg-slate-800 dark:text-gray-100 placeholder-gray-400 pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm font-medium"
              />
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <div className="h-5.5 w-5.5 animate-spin rounded-full border-3 border-white border-t-transparent"></div>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-primary-600 dark:text-primary-400 hover:underline">
            Register Here
          </Link>
        </p>

      </div>
    </div>
  );
};
export default Login;

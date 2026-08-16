import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, User, BookOpen, AlertCircle, UserPlus } from 'lucide-react';
import { RentoraWordmark } from '../components/RentoraBrand';
import api from '../services/api';

const COURSES = ['B.Tech', 'M.Tech', 'MBA', 'MCA', 'BCA', 'B.Sc', 'Other'];
const BRANCHES = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'Other'];
const CAMPUS_LOCATIONS = [
  'NIET Plot 19',
  'NIET Plot 15',
  'NIET Plot 14'
];

export const Register: React.FC = () => {
  const { registerUser, verifyOTP } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // OTP Verification State
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState(60);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    course: '',
    branch: '',
    year: '',
    collegeName: '',
  });

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (requiresVerification && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [requiresVerification, timer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (parseInt(form.year) < 1 || parseInt(form.year) > 5) {
      setError('Year must be between 1 and 5.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser({ ...form, year: parseInt(form.year) });
      if (res?.requiresVerification) {
        setRequiresVerification(true);
        setTimer(60);
        setOtp(Array(6).fill(''));
      } else {
        navigate('/home', { replace: true });
      }
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to Rentora server. Make sure the backend server (npm run dev) is running on port 5000.');
      } else {
        setError(err.response.data?.message || err.response.data?.error || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Auto-focus next input field
    if (element.value !== '' && element.nextSibling) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && otp[index] === '' && e.currentTarget.previousElementSibling) {
      (e.currentTarget.previousElementSibling as HTMLInputElement).focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setVerificationLoading(true);
    try {
      await verifyOTP(form.email, fullOtp);
      navigate('/home', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setResendLoading(true);
    try {
      await api.post('/auth/resend-otp', { email: form.email });
      setTimer(60);
      setOtp(Array(6).fill(''));
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to resend code.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-primary-50 via-gray-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950 px-4 py-10 transition-colors duration-200">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xl shadow-gray-200/50 dark:shadow-none animate-in fade-in zoom-in-95 duration-300">

        {requiresVerification ? (
          <div className="space-y-6">
            <div className="text-center mb-6 flex flex-col items-center">
              <RentoraWordmark dark={theme === 'dark'} size={24} className="mb-4" />
              <h2 className="text-2xl font-black font-outfit text-gray-900 dark:text-white">Verify Your Email</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                We've sent a 6-digit OTP to your campus email:
              </p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-1">
                {form.email}
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl text-red-700 dark:text-red-400 text-sm mb-6 animate-in slide-in-from-top-2 duration-150">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="font-medium leading-normal">{error}</p>
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="flex justify-center gap-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    className="w-12 h-14 text-center text-xl font-black text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all shadow-sm"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={verificationLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {verificationLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <span>Verify Code</span>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              {timer > 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Resend code in <span className="font-bold">{timer}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendOTP}
                  disabled={resendLoading}
                  className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
                >
                  {resendLoading ? 'Sending...' : 'Resend Verification Code'}
                </button>
              )}
            </div>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              Entered wrong email?{' '}
              <button
                onClick={() => {
                  setRequiresVerification(false);
                  setError('');
                }}
                className="font-bold text-primary-600 dark:text-primary-400 hover:underline"
              >
                Go Back
              </button>
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-8 flex flex-col items-center">
              <h2 className="text-2xl font-black font-outfit text-gray-900 dark:text-white flex flex-wrap items-center justify-center gap-2 mb-2.5">
                Join <RentoraWordmark dark={theme === 'dark'} size={24} />
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">NIET's exclusive student rental marketplace</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl text-red-700 dark:text-red-400 text-sm mb-6 animate-in slide-in-from-top-2 duration-150">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="font-medium leading-normal">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    name="fullName"
                    placeholder="e.g. Rahul Sharma"
                    required
                    value={form.fullName}
                    onChange={handleChange}
                    className="w-full bg-gray-50 text-gray-900 dark:bg-slate-800 dark:text-gray-100 placeholder-gray-400 pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm font-medium"
                  />
                  <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">NIET Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    placeholder="yourname@niet.co.in"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full bg-gray-50 text-gray-900 dark:bg-slate-800 dark:text-gray-100 placeholder-gray-400 pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm font-medium"
                  />
                  <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    placeholder="Min 6 chars with letters & numbers"
                    required
                    value={form.password}
                    onChange={handleChange}
                    className="w-full bg-gray-50 text-gray-900 dark:bg-slate-800 dark:text-gray-100 placeholder-gray-400 pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm font-medium"
                  />
                  <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" />
                </div>
              </div>

              {/* Course & Branch row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Course</label>
                  <div className="relative">
                    <select
                      name="course"
                      required
                      value={form.course}
                      onChange={handleChange}
                      className="w-full bg-gray-50 text-gray-900 dark:bg-slate-800 dark:text-gray-100 pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm font-medium appearance-none"
                    >
                      <option value="">Select</option>
                      {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <BookOpen className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Branch</label>
                  <select
                    name="branch"
                    required
                    value={form.branch}
                    onChange={handleChange}
                    className="w-full bg-gray-50 text-gray-900 dark:bg-slate-800 dark:text-gray-100 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm font-medium appearance-none"
                  >
                    <option value="">Select</option>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Year of Study</label>
                <input
                  type="number"
                  name="year"
                  placeholder="1–4"
                  min="1"
                  max="5"
                  required
                  value={form.year}
                  onChange={handleChange}
                  className="w-full bg-gray-50 text-gray-900 dark:bg-slate-800 dark:text-gray-100 placeholder-gray-400 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm font-medium"
                />
              </div>

              {/* College/Campus Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">College / Campus</label>
                <select
                  name="collegeName"
                  required
                  value={form.collegeName}
                  onChange={handleChange}
                  className="w-full bg-gray-50 text-gray-900 dark:bg-slate-800 dark:text-gray-100 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm font-medium appearance-none"
                >
                  <option value="">Select College / Campus</option>
                  {CAMPUS_LOCATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>

            {/* Notice */}
            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl text-center">
              <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                🎓 Rentora is exclusively for NIET students. All transactions are offline between students.
              </p>
            </div>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-primary-600 dark:text-primary-400 hover:underline">
                Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};
export default Register;

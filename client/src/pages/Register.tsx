import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, User, BookOpen, AlertCircle, UserPlus, ArrowLeft, Home } from 'lucide-react';
import rentoraLogo from '../assets/rentora-logo.png';
import logoName from '../assets/logo-name.png';
import logoNameWhite from '../assets/logo-name-white.png';
import api from '../services/api';
import { COURSES, BRANCHES_MAP, BRANCH_SPECIALIZATIONS_MAP, CAMPUS_LOCATIONS } from '../utils/constants';

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

  const [selectedBranch, setSelectedBranch] = useState('');
  const [specialization, setSpecialization] = useState('');

  // Reset selected branch and specialization when course changes
  useEffect(() => {
    setSelectedBranch('');
    setSpecialization('');
    setForm(f => ({ ...f, branch: '' }));
  }, [form.course]);

  // Sync selectedBranch and specialization to form.branch
  useEffect(() => {
    if (!selectedBranch) {
      setForm(f => ({ ...f, branch: '' }));
      return;
    }

    const specs = BRANCH_SPECIALIZATIONS_MAP[selectedBranch];
    if (specs && specialization && specialization !== 'Core') {
      setForm(f => ({ ...f, branch: `${selectedBranch} (${specialization})` }));
    } else {
      setForm(f => ({ ...f, branch: selectedBranch }));
    }
  }, [selectedBranch, specialization]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: any;
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

    // Enforce niet.co.in domain restriction before sending to server
    const emailDomain = form.email.split('@')[1];
    if (!emailDomain || emailDomain.toLowerCase() !== 'niet.co.in') {
      setError('Registration is restricted to NIET email addresses (@niet.co.in) only.');
      return;
    }

    if (form.password.length < 6 || form.password.length > 16) {
      setError('Password must be between 6 and 16 characters.');
      return;
    }

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
        setError('Cannot connect to Rentora server. If running locally, make sure the backend server is running on port 5001. If on hosted app, the server may still be spinning up.');
      } else {
        setError(err.response.data?.message || err.response.data?.error || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const val = element.value;

    // Handle multi-character input (e.g. pasting full 6-digit OTP)
    if (val.length > 1) {
      const digits = val.replace(/\D/g, '').slice(0, 6).split('');
      if (digits.length > 0) {
        const newOtp = [...otp];
        digits.forEach((d, i) => {
          if (index + i < 6) newOtp[index + i] = d;
        });
        setOtp(newOtp);
        const targetIdx = Math.min(index + digits.length, 5);
        const parent = element.parentElement;
        if (parent) {
          const inputs = parent.querySelectorAll<HTMLInputElement>('input');
          if (inputs[targetIdx]) inputs[targetIdx].focus();
        }
      }
      return;
    }

    const lastChar = val.slice(-1);
    if (lastChar && isNaN(Number(lastChar))) return;

    const newOtp = [...otp];
    newOtp[index] = lastChar;
    setOtp(newOtp);

    // Auto-focus next input field
    if (lastChar !== '') {
      const parent = element.parentElement;
      if (parent) {
        const inputs = parent.querySelectorAll<HTMLInputElement>('input');
        if (inputs[index + 1]) {
          inputs[index + 1].focus();
        }
      }
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '') {
        const parent = e.currentTarget.parentElement;
        if (parent) {
          const inputs = parent.querySelectorAll<HTMLInputElement>('input');
          if (inputs[index - 1]) {
            inputs[index - 1].focus();
          }
        }
      }
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-primary-50 via-gray-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950 px-4 py-10 transition-colors duration-200">
      
      {/* Top Navigation: Back & Home Buttons */}
      <div className="max-w-lg w-full flex items-center justify-between mb-3.5 px-1 animate-in fade-in duration-300">
        <button
          type="button"
          onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1);
            } else {
              navigate('/home');
            }
          }}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all bg-white dark:bg-slate-900 px-3.5 py-2 rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-sm hover:shadow active:scale-95 group"
        >
          <ArrowLeft className="h-4 w-4 text-slate-400 group-hover:text-brand-crimson dark:group-hover:text-red-400 transition-colors" />
          <span>Back</span>
        </button>

        <Link
          to="/home"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all bg-white dark:bg-slate-900 px-3.5 py-2 rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-sm hover:shadow active:scale-95 group"
        >
          <Home className="h-4 w-4 text-slate-400 group-hover:text-brand-crimson dark:group-hover:text-red-400 transition-colors" />
          <span>Home</span>
        </Link>
      </div>

      <div className="max-w-lg w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xl shadow-gray-200/50 dark:shadow-none animate-in fade-in zoom-in-95 duration-300">

        {requiresVerification ? (
          <div className="space-y-6">
            <div className="text-center mb-6 flex flex-col items-center">
              <div className="inline-flex h-20 w-20 rounded-2xl bg-white border border-slate-200/60 items-center justify-center p-3 shadow-md mb-4 transition-transform hover:scale-105 overflow-hidden">
                <img 
                  src={rentoraLogo} 
                  alt="Rentora Logo" 
                  className="h-full w-full object-contain" 
                  style={{ transform: 'scale(1.5)' }}
                />
              </div>
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
                    maxLength={6}
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
                className="w-full bg-brand-crimson hover:bg-brand-crimsonHover text-white font-bold py-3 rounded-2xl flex items-center justify-center space-x-2 shadow-crimson hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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
                  className="text-xs font-bold text-brand-crimson dark:text-brand-crimsonLight hover:underline disabled:opacity-50"
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
                className="font-bold text-brand-crimson dark:text-brand-crimsonLight hover:underline"
              >
                Go Back
              </button>
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-8 flex flex-col items-center">
              <div className="inline-flex h-20 w-20 rounded-2xl bg-white border border-slate-200/60 items-center justify-center p-3 shadow-md mb-4 transition-transform hover:scale-105 overflow-hidden">
                <img 
                  src={rentoraLogo} 
                  alt="Rentora Logo" 
                  className="h-full w-full object-contain" 
                  style={{ transform: 'scale(1.5)' }}
                />
              </div>
              <h2 className="text-2xl font-black font-outfit text-gray-900 dark:text-white flex flex-wrap items-center justify-center gap-2 mb-2.5">
                Join 
                <img 
                  src={theme === 'dark' ? logoNameWhite : logoName} 
                  alt="Rentora Wordmark" 
                  className={`h-[20px] object-contain flex-shrink-0 ${theme === 'dark' ? 'brightness-0 invert' : ''}`} 
                />
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
                    placeholder="6 to 16 characters (letters & numbers)"
                    maxLength={16}
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
                      className="w-full bg-gray-50 text-gray-900 dark:bg-slate-800 dark:text-gray-100 pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm font-medium cursor-pointer"
                    >
                      <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Select</option>
                      {COURSES.map(c => (
                        <option key={c} value={c} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                          {c}
                        </option>
                      ))}
                    </select>
                    <BookOpen className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Branch</label>
                  <select
                    name="branch"
                    required
                    value={selectedBranch}
                    onChange={(e) => {
                      setSelectedBranch(e.target.value);
                      setSpecialization('');
                    }}
                    disabled={!form.course}
                    className="w-full bg-gray-50 text-gray-900 dark:bg-slate-800 dark:text-gray-100 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Select</option>
                    {(BRANCHES_MAP[form.course] || []).map(b => (
                      <option key={b.value} value={b.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Branch Specialization field - displayed conditionally */}
              {BRANCH_SPECIALIZATIONS_MAP[selectedBranch] && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {selectedBranch} Specialization
                  </label>
                  <select
                    required
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full bg-gray-50 text-gray-900 dark:bg-slate-800 dark:text-gray-100 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm font-medium cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Select Specialization</option>
                    {BRANCH_SPECIALIZATIONS_MAP[selectedBranch].map(s => (
                      <option key={s.value} value={s.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  className="w-full bg-gray-50 text-gray-900 dark:bg-slate-800 dark:text-gray-100 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm font-medium"
                >
                  <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Select College / Campus</option>
                  {CAMPUS_LOCATIONS.map(c => (
                    <option key={c} value={c} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-crimson hover:bg-brand-crimsonHover text-white font-bold py-3 rounded-2xl flex items-center justify-center space-x-2 shadow-crimson hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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

              {/* Terms & Privacy Agreement Notice */}
              <p className="text-[11px] text-center text-gray-500 dark:text-gray-400 leading-relaxed px-1">
                By creating an account, you agree to Rentora's{' '}
                <Link to="/terms" target="_blank" className="font-bold text-brand-crimson dark:text-brand-crimsonLight underline">
                  Terms & Conditions
                </Link>{' '}
                (including the <span className="font-semibold text-gray-700 dark:text-gray-200">College Caution Money Recovery Policy</span> for unreturned items) and{' '}
                <Link to="/privacy" target="_blank" className="font-bold text-brand-crimson dark:text-brand-crimsonLight underline">
                  Privacy Policy
                </Link>.
              </p>
            </form>

            {/* Domain notice */}
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-center">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                🎓 Rentora is exclusively for NIET students. Only <strong>@niet.co.in</strong> email addresses are accepted.
              </p>
            </div>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-brand-crimson dark:text-brand-crimsonLight hover:underline">
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

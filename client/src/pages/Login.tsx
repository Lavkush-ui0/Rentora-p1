import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, LogIn, AlertCircle, ArrowLeft, Home, KeyRound, CheckCircle2, X } from 'lucide-react';
import { RentoraWordmark } from '../components/RentoraBrand';
import authService from '../services/authService';

export const Login: React.FC = () => {
  const { login, loginSendOTP, loginVerifyOTP } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification State
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(60);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Forgot Password State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const redirectPath = (location.state as any)?.from?.pathname || '/home';

  // Countdown timer for OTP
  useEffect(() => {
    let interval: any;
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  const validateDomain = (emailVal: string) => {
    const domain = emailVal.split('@')[1];
    if (domain && domain.toLowerCase() !== 'niet.co.in') {
      setError('Only NIET email addresses (@niet.co.in) are allowed.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateDomain(email)) return;
    if (password.length > 16) {
      setError('Password cannot exceed 16 characters.');
      return;
    }
    setLoading(true);

    try {
      const res = await login(email, password);
      const user = res?.user;
      const isProfileIncomplete = 
        user && user.role !== 'ADMIN' && (
          !user.fullName || 
          !user.course || 
          !user.branch || 
          user.branch === 'Not Set' || 
          !user.year
        );

      if (isProfileIncomplete) {
        navigate('/settings', { replace: true, state: { incompleteProfile: true } });
      } else {
        navigate(redirectPath, { replace: true });
      }
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to Rentora server. If running locally, make sure the backend server is running on port 5001. If on hosted app, the server may still be spinning up.');
      } else {
        setError(err.response.data?.message || err.response.data?.error || 'Login failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateDomain(email)) return;
    setLoading(true);
    try {
      await loginSendOTP(email);
      setOtpSent(true);
      setTimer(60);
      setOtp(Array(6).fill(''));
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to Rentora server.');
      } else {
        setError(err.response.data?.message || err.response.data?.error || 'Failed to send OTP.');
      }
    } finally {
      setLoading(false);
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
      const res = await loginVerifyOTP(email, fullOtp);
      const user = res?.user;
      const isProfileIncomplete = 
        user && user.role !== 'ADMIN' && (
          !user.fullName || 
          !user.course || 
          !user.branch || 
          user.branch === 'Not Set' || 
          !user.year
        );

      if (isProfileIncomplete) {
        navigate('/settings', { replace: true, state: { incompleteProfile: true } });
      } else {
        navigate(redirectPath, { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setVerificationLoading(false);
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

  const handleResendOTP = async () => {
    setError('');
    setResendLoading(true);
    try {
      await loginSendOTP(email);
      setTimer(60);
      setOtp(Array(6).fill(''));
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to resend code.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    if (!validateDomain(forgotEmail)) {
      setForgotError('Only NIET email addresses (@niet.co.in) are allowed.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await authService.forgotPassword(forgotEmail);
      if (res.data?.success) {
        setForgotStep(2);
        setForgotSuccess('A 6-digit password reset code has been sent to your email.');
      }
    } catch (err: any) {
      setForgotError(err.response?.data?.message || err.response?.data?.error || 'Failed to send reset code. Please check your email address.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (forgotOtp.trim().length !== 6) {
      setForgotError('Please enter the 6-digit reset code received on your email.');
      return;
    }

    if (forgotNewPassword.length < 6 || forgotNewPassword.length > 16) {
      setForgotError('Password must be between 6 and 16 characters.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('New passwords do not match.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authService.resetPassword({
        email: forgotEmail,
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword,
      });
      if (res.data?.success) {
        setForgotSuccess('Password reset successfully! You can now log in with your new password.');
        setEmail(forgotEmail);
        setTimeout(() => {
          setForgotModalOpen(false);
          setForgotStep(1);
          setForgotOtp('');
          setForgotNewPassword('');
          setForgotConfirmPassword('');
          setForgotSuccess('');
        }, 1500);
      }
    } catch (err: any) {
      setForgotError(err.response?.data?.message || err.response?.data?.error || 'Failed to reset password. Please check the code.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-primary-50 via-gray-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950 px-4 py-8 transition-colors duration-200">
      
      {/* Top Navigation: Back & Home Buttons */}
      <div className="max-w-md w-full flex items-center justify-between mb-3.5 px-1 animate-in fade-in duration-300">
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

      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xl shadow-gray-200/50 dark:shadow-none animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <RentoraWordmark dark={theme === 'dark'} size={24} className="mb-4" />
          <h2 className="text-2xl font-black font-outfit text-gray-900 dark:text-white">Welcome Back</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">Sign in to browse student-to-student rentals</p>
        </div>

        {/* Toggle Login Method */}
        <div className="flex bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-6 select-none">
          <button
            onClick={() => {
              setLoginMethod('password');
              setError('');
              setOtpSent(false);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              loginMethod === 'password'
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Password Sign In
          </button>
          <button
            onClick={() => {
              setLoginMethod('otp');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              loginMethod === 'otp'
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Email OTP Sign In
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl text-red-700 dark:text-red-400 text-sm mb-6 animate-in slide-in-from-top-2 duration-150">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-medium leading-normal">{error}</p>
          </div>
        )}

        {/* Conditional Forms */}
        {loginMethod === 'password' ? (
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
                <button
                  type="button"
                  onClick={() => {
                    setForgotModalOpen(true);
                    setForgotStep(1);
                    setForgotEmail(email);
                    setForgotError('');
                    setForgotSuccess('');
                  }}
                  className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  maxLength={16}
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
              className="w-full bg-brand-crimson hover:bg-brand-crimsonHover text-white font-bold py-3 rounded-2xl flex items-center justify-center space-x-2 shadow-crimson hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        ) : !otpSent ? (
          <form onSubmit={handleSendOTP} className="space-y-5">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-crimson hover:bg-brand-crimsonHover text-white font-bold py-3 rounded-2xl flex items-center justify-center space-x-2 shadow-crimson hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <Mail className="h-5 w-5" />
                  <span>Send Login OTP</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We sent a 6-digit login OTP to:
              </p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-1">
                {email}
              </p>
            </div>

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
                  <span>Verify &amp; Sign In</span>
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
                  {resendLoading ? 'Sending...' : 'Resend Login OTP'}
                </button>
              )}
            </div>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              Wrong email or want to change details?{' '}
              <button
                onClick={() => {
                  setOtpSent(false);
                  setError('');
                }}
                className="font-bold text-primary-600 dark:text-primary-400 hover:underline"
              >
                Go Back
              </button>
            </p>
          </div>
        )}

        {/* Domain notice */}
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-center">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            🎓 Rentora is exclusively for NIET students. Only <strong>@niet.co.in</strong> email addresses are accepted.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-brand-crimson dark:text-brand-crimsonLight hover:underline">
            Register Here
          </Link>
        </p>

      </div>

      {/* Forgot Password / Reset Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-7 max-w-md w-full shadow-2xl space-y-5 relative">
            <button
              onClick={() => {
                setForgotModalOpen(false);
                setForgotStep(1);
                setForgotError('');
                setForgotSuccess('');
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-2xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black font-outfit text-gray-900 dark:text-gray-100">
                  {forgotStep === 1 ? 'Reset Your Password' : 'Set New Password'}
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {forgotStep === 1
                    ? 'Enter your registered NIET email to receive a reset code'
                    : 'Enter the 6-digit code and your new password'}
                </p>
              </div>
            </div>

            {forgotError && (
              <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3.5 rounded-2xl text-red-700 dark:text-red-400 text-xs font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{forgotError}</p>
              </div>
            )}

            {forgotSuccess && (
              <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3.5 rounded-2xl text-green-700 dark:text-green-400 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <p>{forgotSuccess}</p>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendResetCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    NIET Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="yourname@niet.co.in"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm font-medium"
                    />
                    <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-gray-400" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="flex-1 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-bold py-2.5 rounded-2xl text-xs hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || !forgotEmail.trim()}
                    className="flex-1 bg-brand-crimson hover:bg-brand-crimsonHover text-white font-bold py-2.5 rounded-2xl text-xs transition-colors shadow-crimson flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <span>Send Reset Code</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    required
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm font-mono tracking-widest text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    New Password (6-16 chars)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      maxLength={16}
                      required
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm font-medium"
                    />
                    <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      maxLength={16}
                      required
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm font-medium"
                    />
                    <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-gray-400" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setForgotError('');
                      setForgotSuccess('');
                    }}
                    className="flex-1 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-bold py-2.5 rounded-2xl text-xs hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || !forgotOtp.trim() || !forgotNewPassword || !forgotConfirmPassword}
                    className="flex-1 bg-brand-crimson hover:bg-brand-crimsonHover text-white font-bold py-2.5 rounded-2xl text-xs transition-colors shadow-crimson flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <span>Reset Password</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default Login;

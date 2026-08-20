import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { compressImageIfNeeded } from '../utils/imageCompressor';
import { Sun, Moon, User, Save, AlertCircle, CheckCircle2, Camera, Upload, Trash2, X } from 'lucide-react';
import { COURSES, BRANCHES_MAP, CSE_SPECIALIZATIONS } from '../utils/constants';

export const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    course: user?.course || '',
    branch: user?.branch || '',
    year: user?.year?.toString() || '',
  });

  const [selectedBranch, setSelectedBranch] = useState('');
  const [specialization, setSpecialization] = useState('');

  // Initialize selectedBranch and specialization from user data on mount / user change
  useEffect(() => {
    if (user?.branch) {
      const match = user.branch.match(/^([^(]+)(?:\s*\(([^)]+)\))?$/);
      if (match) {
        const baseBranch = match[1].trim();
        const spec = match[2] ? match[2].trim() : 'Core';
        setSelectedBranch(baseBranch);
        setSpecialization(spec);
      } else {
        setSelectedBranch(user.branch);
        setSpecialization('Core');
      }
    }
  }, [user?.branch]);

  // Sync selectedBranch and specialization to form.branch
  useEffect(() => {
    if (!selectedBranch) {
      setForm(f => ({ ...f, branch: '' }));
      return;
    }

    if (selectedBranch === 'CSE' && specialization && specialization !== 'Core') {
      setForm(f => ({ ...f, branch: `CSE (${specialization})` }));
    } else {
      setForm(f => ({ ...f, branch: selectedBranch }));
    }
  }, [selectedBranch, specialization]);

  const [previewUrl, setPreviewUrl] = useState<string>(user?.avatar && user.avatar !== 'data:,' ? user.avatar : '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [webcamImage, setWebcamImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (user?.avatar && user.avatar !== 'data:,') {
      setPreviewUrl(user.avatar);
    } else {
      setPreviewUrl('');
    }
  }, [user?.avatar]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (rawFile) {
      // Compress if > 2MB
      const file = await compressImageIfNeeded(rawFile);
      setSelectedFile(file);
      setWebcamImage(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setCameraActive(true);
    setSuccess('');
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 400, facingMode: 'user' }
      });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 150);
    } catch (err) {
      console.error('Camera access failed:', err);
      setError('Could not access camera. Please ensure permissions are granted.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || video.clientWidth || 400;
      const height = video.videoHeight || video.clientHeight || 400;
      const size = Math.min(width, height);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(size, 0);
        ctx.scale(-1, 1);
        const videoWidth = video.videoWidth || width;
        const videoHeight = video.videoHeight || height;
        const sx = (videoWidth - size) / 2;
        const sy = (videoHeight - size) / 2;
        ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setWebcamImage(dataUrl);
        setPreviewUrl(dataUrl);
        setSelectedFile(null);
      }
      stopCamera();
    }
  };

  const handleResetAvatar = () => {
    setSelectedFile(null);
    setWebcamImage(null);
    setPreviewUrl('');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      formData.append('fullName', form.fullName);
      formData.append('bio', form.bio);
      formData.append('course', form.course);
      formData.append('branch', form.branch);
      formData.append('year', form.year);

      if (selectedFile) {
        formData.append('avatar', selectedFile);
      } else if (webcamImage) {
        formData.append('avatar', webcamImage);
      } else if (previewUrl === '') {
        formData.append('avatar', '');
      }

      await updateUser(formData);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black font-outfit text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Manage your profile and app preferences</p>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6">
        <h2 className="text-base font-black font-outfit text-gray-900 dark:text-gray-100 mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
              {theme === 'dark' ? <Moon className="h-5 w-5 text-primary-400" /> : <Sun className="h-5 w-5 text-amber-500" />}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Theme</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Currently using {theme} mode</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="relative inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
            style={{ backgroundColor: theme === 'dark' ? '#466bf2' : '#e5e7eb' }}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200 ${theme === 'dark' ? 'translate-x-5' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6">
        <h2 className="text-base font-black font-outfit text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
          <User className="h-5 w-5 text-primary-500" />
          <span>Edit Profile</span>
        </h2>

        {success && (
          <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 rounded-2xl text-green-700 dark:text-green-400 text-sm mb-4">
            <CheckCircle2 className="h-4 w-4" />
            <p className="font-medium">{success}</p>
          </div>
        )}
        {error && (
          <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 rounded-2xl text-red-700 dark:text-red-400 text-sm mb-4">
            <AlertCircle className="h-4 w-4" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Profile Picture Upload & Camera */}
          <div className="flex flex-col items-center sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-gray-100 dark:border-slate-800">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 shadow-inner flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-primary-100 dark:bg-primary-950/20 flex items-center justify-center text-primary-600 dark:text-primary-400 text-3xl font-black font-outfit">
                    {form.fullName ? form.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Profile Picture</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">JPG, JPEG, PNG or WEBP (Max 5MB)</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <label className="flex items-center space-x-1.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700/80 text-gray-700 dark:text-gray-200 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition-colors border border-gray-200 dark:border-slate-700">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={startCamera}
                  className="flex items-center space-x-1.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700/80 text-gray-700 dark:text-gray-200 text-xs font-bold px-3 py-2 rounded-xl transition-colors border border-gray-200 dark:border-slate-700"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Take Photo</span>
                </button>

                {(previewUrl || (user?.avatar && user.avatar !== 'data:,')) && (
                  <button
                    type="button"
                    onClick={handleResetAvatar}
                    className="flex items-center space-x-1.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold px-3 py-2 rounded-xl transition-colors border border-red-200 dark:border-red-900/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              name="fullName"
              required
              value={form.fullName}
              onChange={handleChange}
              className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Bio</label>
            <textarea
              name="bio"
              rows={3}
              placeholder="Tell other students about yourself..."
              value={form.bio}
              onChange={handleChange}
              maxLength={200}
              className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm font-medium resize-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Course</label>
              <select
                name="course"
                value={form.course}
                onChange={(e) => {
                  setForm(f => ({ ...f, course: e.target.value, branch: '' }));
                  setSelectedBranch('');
                  setSpecialization('');
                }}
                className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm appearance-none cursor-pointer"
              >
                <option value="">Select</option>
                {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Branch</label>
              <select
                name="branch"
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                  setSpecialization('');
                }}
                disabled={!form.course}
                className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">Select</option>
                {(BRANCHES_MAP[form.course] || []).map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Year</label>
              <input
                type="number"
                name="year"
                min="1"
                max="5"
                value={form.year}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm"
              />
            </div>
          </div>

          {/* CSE Specialization field - displayed conditionally */}
          {selectedBranch === 'CSE' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">CSE Specialization</label>
              <select
                required
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm appearance-none cursor-pointer"
              >
                <option value="">Select Specialization</option>
                {CSE_SPECIALIZATIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 bg-brand-crimson hover:bg-brand-crimsonHover text-white font-bold px-7 py-3 rounded-2xl shadow-crimson hover:shadow-xl transition-all disabled:opacity-50 active:scale-95 text-sm"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <><Save className="h-4 w-4" /><span>Save Changes</span></>
            )}
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6">
        <h2 className="text-base font-black font-outfit text-gray-900 dark:text-gray-100 mb-4">Account Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">Role</span>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${user?.role === 'ADMIN' ? 'bg-primary-100 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300'}`}>
              {user?.role}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Rentora Phase</span>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Phase 1 — NIET Only</span>
          </div>
        </div>
      </div>
      {/* Camera Modal Overlay */}
      {cameraActive && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-3xl border border-gray-150 dark:border-slate-850 p-6 max-w-md w-full space-y-4 shadow-2xl relative overflow-hidden">
            <button
              onClick={stopCamera}
              type="button"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 dark:hover:text-gray-250 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <h3 className="text-lg font-black font-outfit text-gray-900 dark:text-gray-100">Take Profile Picture</h3>
            
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square flex items-center justify-center border border-gray-200 dark:border-slate-800 shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
            </div>

            <div className="flex space-x-3 justify-end pt-2">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 border border-gray-200 dark:border-slate-700 text-gray-750 dark:text-gray-300 font-bold text-xs rounded-xl hover:bg-gray-50 dark:hover:bg-slate-850 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="flex items-center space-x-2 bg-brand-crimson hover:bg-brand-crimsonHover text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-crimson"
              >
                <Camera className="h-4 w-4" />
                <span>Capture Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Settings;

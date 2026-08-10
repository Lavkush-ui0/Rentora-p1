import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, User, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateUser({ ...form, year: parseInt(form.year) });
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

        <form onSubmit={handleSaveProfile} className="space-y-4">
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
              <input
                type="text"
                name="course"
                value={form.course}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Branch</label>
              <input
                type="text"
                name="branch"
                value={form.branch}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-primary-500 text-sm"
              />
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

          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-2.5 rounded-2xl shadow-sm transition-all disabled:opacity-50"
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
    </div>
  );
};
export default Settings;

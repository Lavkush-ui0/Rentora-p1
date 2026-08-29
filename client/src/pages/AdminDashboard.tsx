import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import {
  Users as UsersIcon, Package as ListingsIcon, CheckCircle2, Plus,
  MessageCircle, ClipboardCheck, CheckCircle, XCircle, Clock,
  Bot, Sparkles, UserPlus, Lock, Mail, User, Settings
} from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';
import { getImageUrl, getAvatarUrl } from '../utils/imageUrl';

// Custom SVG Line Graph Component
interface DailyStat {
  date: string;
  dayLabel: string;
  listings: number;
  requests: number;
}

const SVGLineGraph: React.FC<{ data: DailyStat[] }> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-400">
        No stats data available
      </div>
    );
  }

  const width = 600;
  const height = 220;
  const padding = 40;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  // Find max value for Y scaling
  const maxVal = Math.max(...data.map(d => Math.max(d.listings, d.requests, 5)));

  // Calculate coordinates
  const points = data.map((d, i) => {
    const x = padding + (i * (graphWidth / (data.length - 1)));
    const yListings = height - padding - ((d.listings / maxVal) * graphHeight);
    const yRequests = height - padding - ((d.requests / maxVal) * graphHeight);
    return { x, yListings, yRequests };
  });

  const listingsPath = points.map(p => `${p.x},${p.yListings}`).join(' ');
  const requestsPath = points.map(p => `${p.x},${p.yRequests}`).join(' ');

  return (
    <div className="relative bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-outfit font-black text-gray-900 dark:text-gray-100 text-sm">
            Platform Traffic Analytics
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Daily listings and requests over last 7 days
          </p>
        </div>
        <div className="flex items-center space-x-4 text-xs font-bold">
          <div className="flex items-center space-x-1.5">
            <span className="h-3 w-3 rounded-full bg-primary-500 inline-block"></span>
            <span className="text-gray-500 dark:text-gray-400">New Listings</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-3 w-3 rounded-full bg-purple-500 inline-block"></span>
            <span className="text-gray-500 dark:text-gray-400">Rental Requests</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Y-Axis Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding + ratio * graphHeight;
            const labelVal = Math.round(maxVal * (1 - ratio));
            return (
              <g key={i} className="opacity-40">
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  className="text-gray-100 dark:text-slate-800"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] font-bold text-gray-400 fill-current"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* Lines */}
          <polyline
            fill="none"
            stroke="url(#primaryGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={listingsPath}
          />
          <polyline
            fill="none"
            stroke="url(#purpleGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={requestsPath}
          />

          {/* Area Gradients Definitions */}
          <defs>
            <linearGradient id="primaryGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="purpleGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>

          {/* Dots on Data Points */}
          {points.map((pt, i) => (
            <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
              {/* Vertical indicator bar on hover */}
              {hoveredIdx === i && (
                <line
                  x1={pt.x}
                  y1={padding}
                  x2={pt.x}
                  y2={height - padding}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-gray-200 dark:text-slate-700"
                />
              )}
              {/* Listings Dot */}
              <circle
                cx={pt.x}
                cy={pt.yListings}
                r={hoveredIdx === i ? 6 : 4}
                className="fill-white dark:fill-slate-900 stroke-primary-500"
                strokeWidth="2.5"
              />
              {/* Requests Dot */}
              <circle
                cx={pt.x}
                cy={pt.yRequests}
                r={hoveredIdx === i ? 6 : 4}
                className="fill-white dark:fill-slate-900 stroke-purple-500"
                strokeWidth="2.5"
              />
              {/* X-Axis labels */}
              <text
                x={pt.x}
                y={height - padding + 18}
                textAnchor="middle"
                className="text-[10px] font-bold text-gray-400 fill-current"
              >
                {data[i].dayLabel}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIdx !== null && (
          <div
            className="absolute top-1/2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 p-3 rounded-2xl shadow-xl text-xs space-y-1 z-20 pointer-events-none transform -translate-y-1/2 transition-all border border-slate-800 dark:border-gray-100"
            style={{
              left: `${(points[hoveredIdx].x / width) * 100}%`,
              marginLeft: hoveredIdx > data.length / 2 ? '-130px' : '15px'
            }}
          >
            <p className="font-black border-b border-slate-800 dark:border-gray-200 pb-1 mb-1">
              {data[hoveredIdx].date}
            </p>
            <p className="font-medium">
              📈 Listings: <strong className="font-extrabold text-primary-400 dark:text-primary-600">{data[hoveredIdx].listings}</strong>
            </p>
            <p className="font-medium">
              💜 Requests: <strong className="font-extrabold text-purple-400 dark:text-purple-600">{data[hoveredIdx].requests}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const location = useLocation();

  // Determine current tab from path URL
  const path = location.pathname;
  const currentTab = path.includes('/users')
    ? 'users'
    : path.includes('/listings')
    ? 'listings'
    : path.includes('/approvals')
    ? 'approvals'
    : path.includes('/rejected')
    ? 'rejected'
    : path.includes('/categories')
    ? 'categories'
    : path.includes('/reports')
    ? 'reports'
    : 'dashboard';

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [pendingListings, setPendingListings] = useState<any[]>([]);
  const [rejectedListings, setRejectedListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Category input fields
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Layers');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [addingCat, setAddingCat] = useState(false);

  const [aiModerationEnabled, setAiModerationEnabled] = useState<boolean>(true);
  const [togglingAi, setTogglingAi] = useState<boolean>(false);
  const [dailyListingLimit, setDailyListingLimit] = useState<number>(2);
  const [limitInput, setLimitInput] = useState<number>(2);
  const [savingLimit, setSavingLimit] = useState<boolean>(false);
  const [limitSaved, setLimitSaved] = useState<boolean>(false);
  const [togglingBlockId, setTogglingBlockId] = useState<string | null>(null);
  const [createAccountModalOpen, setCreateAccountModalOpen] = useState<boolean>(false);
  const [createUserForm, setCreateUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'STUDENT' as 'STUDENT' | 'ADMIN',
    course: 'B.Tech',
    branch: 'CSE',
    year: 1,
    collegeName: 'NIET Plot 19',
  });
  const [creatingUser, setCreatingUser] = useState<boolean>(false);
  const [createUserError, setCreateUserError] = useState<string>('');
  const [createUserSuccess, setCreateUserSuccess] = useState<string>('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (currentTab === 'dashboard') {
        const statsRes = await adminService.getDashboardStats();
        if (statsRes.data?.success) {
          setStats(statsRes.data.stats);
          if (typeof statsRes.data.stats.aiModerationEnabled === 'boolean') {
            setAiModerationEnabled(statsRes.data.stats.aiModerationEnabled);
          }
        }
      } else if (currentTab === 'users') {
        const [usersRes, settingsRes] = await Promise.all([
          adminService.getUsers(),
          adminService.getSettings(),
        ]);
        if (usersRes.data?.success) setUsers(usersRes.data.users);
        if (settingsRes.data?.success && settingsRes.data.settings) {
          const s = settingsRes.data.settings;
          if (typeof s.dailyListingLimit === 'number') {
            setDailyListingLimit(s.dailyListingLimit);
            setLimitInput(s.dailyListingLimit);
          }
        }
      } else if (currentTab === 'listings') {
        const listRes = await adminService.getListings();
        if (listRes.data?.success) setListings(listRes.data.listings);
      } else if (currentTab === 'approvals') {
        const pendRes = await adminService.getPendingListings();
        if (pendRes.data?.success) setPendingListings(pendRes.data.listings);
      } else if (currentTab === 'rejected') {
        const rejRes = await adminService.getRejectedTodayListings();
        if (rejRes.data?.success) setRejectedListings(rejRes.data.listings);
      } else if (currentTab === 'categories') {
        const catRes = await adminService.getCategories();
        if (catRes.data?.success) setCategories(catRes.data.categories);
      } else if (currentTab === 'reports') {
        const repRes = await adminService.getReports();
        if (repRes.data?.success) setReports(repRes.data.reports);
      }
    } catch (err) {
      console.error('[AdminDashboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentTab]);

  const handleToggleAiModeration = async () => {
    setTogglingAi(true);
    try {
      const nextState = !aiModerationEnabled;
      const res = await adminService.updateSettings({ aiModerationEnabled: nextState });
      if (res.data?.success) {
        setAiModerationEnabled(res.data.settings.aiModerationEnabled);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle AI Moderation.');
    } finally {
      setTogglingAi(false);
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError('');
    setCreateUserSuccess('');

    if (createUserForm.password.length < 6 || createUserForm.password.length > 16) {
      setCreateUserError('Password must be between 6 and 16 characters.');
      return;
    }

    setCreatingUser(true);
    try {
      const res = await adminService.createUser(createUserForm);
      if (res.data?.success) {
        setCreateUserSuccess(res.data.message || 'Account created successfully!');
        setCreateUserForm({
          fullName: '',
          email: '',
          password: '',
          role: 'STUDENT',
          course: 'B.Tech',
          branch: 'CSE',
          year: 1,
          collegeName: 'NIET Plot 19',
        });
        const usersRes = await adminService.getUsers();
        if (usersRes.data?.success) setUsers(usersRes.data.users);
        setTimeout(() => {
          setCreateAccountModalOpen(false);
          setCreateUserSuccess('');
        }, 1200);
      }
    } catch (err: any) {
      setCreateUserError(err.response?.data?.message || 'Failed to create account.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleBlockToggle = async (userId: string) => {
    setTogglingBlockId(userId);
    try {
      const res = await adminService.toggleBlockUser(userId);
      if (res.data?.success) {
        // Optimistically update local state from server response
        const updatedUser = res.data.user;
        setUsers(prev => prev.map(u =>
          u._id === userId ? { ...u, isBlocked: updatedUser.isBlocked } : u
        ));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle user block status.');
    } finally {
      setTogglingBlockId(null);
    }
  };

  const handleSaveListingLimit = async () => {
    if (limitInput < 1 || limitInput > 50) {
      alert('Daily listing limit must be between 1 and 50.');
      return;
    }
    setSavingLimit(true);
    try {
      const res = await adminService.updateSettings({ dailyListingLimit: limitInput });
      if (res.data?.success) {
        setDailyListingLimit(res.data.settings.dailyListingLimit);
        setLimitSaved(true);
        setTimeout(() => setLimitSaved(false), 2000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update listing limit.');
    } finally {
      setSavingLimit(false);
    }
  };

  const handleRemoveListing = async (listingId: string) => {
    if (!window.confirm('Are you sure you want to take down this listed item? This will mark it as REMOVED.')) return;
    try {
      await adminService.removeListing(listingId);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove listing.');
    }
  };

  const handleApproveListing = async (listingId: string) => {
    try {
      await adminService.approveListing(listingId);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve listing.');
    }
  };

  const handleRejectListing = async () => {
    if (!rejectModalId) return;
    if (!rejectReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    try {
      await adminService.rejectListing(rejectModalId, rejectReason.trim());
      setRejectModalId(null);
      setRejectReason('');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject listing.');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      await adminService.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim(),
        icon: newCatIcon.trim(),
      });
      setNewCatName('');
      setNewCatDesc('');
      setNewCatIcon('Layers');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add category.');
    } finally {
      setAddingCat(false);
    }
  };

  const handleResolveReport = async (reportId: string, action: 'RESOLVED' | 'DISMISSED') => {
    try {
      await adminService.updateReportStatus(reportId, action);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update report status.');
    }
  };

  const handleRemoveAndResolveReport = async (reportId: string, listingId: string) => {
    if (!window.confirm('Are you sure you want to take down this listed product and mark this report as resolved?')) return;
    try {
      await adminService.removeListing(listingId);
      await adminService.updateReportStatus(reportId, 'RESOLVED');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove listing and resolve report.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Header summary */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black font-outfit text-gray-900 dark:text-white capitalize">
              {currentTab === 'dashboard' ? 'Overview' : `${currentTab} management`}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Welcome to the Rentora Admin Portal. Control listings, moderate users, and check system metrics.
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 border border-gray-200 dark:border-slate-800 text-xs font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
          >
            Refresh Data
          </button>
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* SUBVIEW 1: OVERVIEW DASHBOARD */}
            {currentTab === 'dashboard' && stats && (
              <div className="space-y-8">
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1: Total Users */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center">
                      <UsersIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400">Total Users</p>
                      <h4 className="text-xl font-black font-outfit text-gray-900 dark:text-white mt-0.5">
                        {stats.totalUsers}
                      </h4>
                    </div>
                  </div>

                  {/* Card 2: Active Listings */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 flex items-center justify-center">
                      <ListingsIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400">Active Listings</p>
                      <h4 className="text-xl font-black font-outfit text-gray-900 dark:text-white mt-0.5">
                        {stats.totalListings}
                      </h4>
                    </div>
                  </div>

                  {/* Card 3: Pending Approvals */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-orange-200 dark:border-orange-900/40 flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-orange-500 flex items-center justify-center">
                      <ClipboardCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400">Pending Approvals</p>
                      <h4 className="text-xl font-black font-outfit text-gray-900 dark:text-white mt-0.5">
                        {stats.pendingApprovals ?? 0}
                      </h4>
                    </div>
                  </div>

                  {/* Card 3: Completed Rentals */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-2xl bg-green-50 dark:bg-green-950/20 text-green-500 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400">Completed Rentals</p>
                      <h4 className="text-xl font-black font-outfit text-gray-900 dark:text-white mt-0.5">
                        {stats.totalCompletedRentals}
                      </h4>
                    </div>
                  </div>

                  {/* Card 4: Active Chats */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-950/20 text-purple-500 flex items-center justify-center">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400">Active Chats</p>
                      <h4 className="text-xl font-black font-outfit text-gray-900 dark:text-white mt-0.5">
                        {stats.totalActiveChats}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Groq AI Moderation Shield Control Card */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                      <Bot className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h3 className="font-outfit font-black text-base text-white">Groq AI Content Moderation Shield</h3>
                        <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                          aiModerationEnabled 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${aiModerationEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                          {aiModerationEnabled ? 'Active (Instant Auto-Approval)' : 'Paused (Manual Review Only)'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                        {aiModerationEnabled 
                          ? 'Legitimate student essentials (textbooks, calculators, drafters, lab gear) are verified and published instantly. Suspicious, explicit, or cheating materials are held for human review.'
                          : 'AI auto-approval is currently paused. Every single product upload by students will enter the Pending Approvals queue for manual human inspection.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleAiModeration}
                    disabled={togglingAi}
                    className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 shrink-0 ${
                      aiModerationEnabled
                        ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{togglingAi ? 'Updating...' : aiModerationEnabled ? 'Pause AI Auto-Approval' : 'Enable AI Auto-Approval'}</span>
                  </button>
                </div>

                {/* Graph */}
                <SVGLineGraph data={stats.dailyStats} />

                {/* Top Rated & Top Enquiry Products */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Top enquiry list */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                    <div>
                      <h3 className="font-outfit font-black text-sm text-gray-900 dark:text-white">
                        🔥 Top Enquiry Products
                      </h3>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        Most requested rental items on the platform
                      </p>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-slate-800/60">
                      {stats.topEnquiryListings?.map((item: any) => (
                        <div key={item._id} className="flex items-center justify-between py-3">
                          <div className="flex items-center space-x-3 min-w-0">
                            <img
                              src={getImageUrl(item.images?.[0])}
                              alt=""
                              className="h-10 w-10 rounded-xl object-cover border border-gray-100 dark:border-slate-800 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {item.title}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                owner: {item.owner?.fullName || 'Student'}
                              </p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg flex items-center space-x-1 shrink-0">
                            <span>{item.requestCount} requests</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top rated list */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                    <div>
                      <h3 className="font-outfit font-black text-sm text-gray-900 dark:text-white">
                        ⭐ Top Rated Products
                      </h3>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        Items with the highest overall feedback score
                      </p>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-slate-800/60">
                      {stats.topRatedListings?.map((item: any) => (
                        <div key={item._id} className="flex items-center justify-between py-3">
                          <div className="flex items-center space-x-3 min-w-0">
                            <img
                              src={getImageUrl(item.images?.[0])}
                              alt=""
                              className="h-10 w-10 rounded-xl object-cover border border-gray-100 dark:border-slate-800 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {item.title}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                owner: {item.owner?.fullName || 'Student'}
                              </p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-[10px] font-bold rounded-lg flex items-center space-x-1 shrink-0">
                            <span>⭐ {item.rating?.toFixed(1) || '0.0'}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBVIEW 2: USERS LIST */}
            {currentTab === 'users' && (
              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl overflow-hidden">
                {/* Panel Header */}
                <div className="p-6 border-b border-gray-50 dark:border-slate-800/60">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <h3 className="font-outfit font-black text-sm text-gray-900 dark:text-white">Registered Users &amp; Administrators</h3>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Manage accounts, create new admin credentials, and monitor campus access</p>
                    </div>
                    <button
                      onClick={() => setCreateAccountModalOpen(true)}
                      className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-2xl flex items-center space-x-2 shadow-lg shadow-primary-600/20 transition-all active:scale-95 shrink-0 w-fit"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Create Account (Admin / Student)</span>
                    </button>
                  </div>

                  {/* Daily Listing Limit Control */}
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl">
                    <div className="flex items-center space-x-2 flex-1">
                      <Settings className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-amber-800 dark:text-amber-300">Daily Listing Limit per User</p>
                        <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">Max products each user can list per 24 hours. Currently: <strong>{dailyListingLimit}</strong></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="daily-listing-limit-input"
                        type="number"
                        min={1}
                        max={50}
                        value={limitInput}
                        onChange={e => setLimitInput(Number(e.target.value))}
                        className="w-16 px-2 py-1.5 text-sm font-bold text-center border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      <button
                        id="save-listing-limit-btn"
                        onClick={handleSaveListingLimit}
                        disabled={savingLimit || limitInput === dailyListingLimit}
                        className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 ${
                          limitSaved
                            ? 'bg-green-500 text-white'
                            : limitInput === dailyListingLimit
                            ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
                            : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                        }`}
                      >
                        {savingLimit ? 'Saving…' : limitSaved ? '✓ Saved' : 'Apply'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-800/40 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-100 dark:border-slate-800">
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Last Post</th>
                        <th className="px-6 py-4">Status &amp; Access</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50 text-xs">
                      {users.map((u: any) => (
                        <tr key={u._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20">
                          <td className="px-6 py-4 flex items-center space-x-3">
                            <img
                              src={getAvatarUrl(u.avatar, u.fullName)}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover border border-gray-100 dark:border-slate-700"
                            />
                            <span className="font-bold text-gray-900 dark:text-white">{u.fullName}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{u.email}</td>
                          <td className="px-6 py-4 font-semibold uppercase text-[10px]">{u.role}</td>
                          <td className="px-6 py-4 text-gray-550 dark:text-gray-455 font-bold">
                            {u.lastPostAt ? new Date(u.lastPostAt).toLocaleString() : 'Never'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {/* Status badge */}
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                                u.isBlocked
                                  ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                                  : 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400'
                              }`}>
                                {u.isBlocked ? '🔒 Blocked' : '✓ Active'}
                              </span>

                              {/* iOS-style toggle switch (non-admin only) */}
                              {u.role !== 'ADMIN' && (
                                <button
                                  id={`block-toggle-${u._id}`}
                                  onClick={() => handleBlockToggle(u._id)}
                                  disabled={togglingBlockId === u._id}
                                  title={u.isBlocked ? 'Click to unblock this user' : 'Click to temporarily block this user'}
                                  className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-wait"
                                  style={{
                                    backgroundColor: u.isBlocked ? '#ef4444' : '#22c55e',
                                  }}
                                >
                                  <span
                                    className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-300"
                                    style={{ transform: u.isBlocked ? 'translateX(18px)' : 'translateX(2px)' }}
                                  />
                                </button>
                              )}
                              {u.role !== 'ADMIN' && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                  {togglingBlockId === u._id ? 'Updating…' : u.isBlocked ? 'Blocked' : 'Unblocked'}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUBVIEW 3: LISTINGS LIST */}
            {currentTab === 'listings' && (
              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-gray-50 dark:border-slate-800/60">
                  <h3 className="font-outfit font-black text-sm text-gray-900 dark:text-white">Active Listed Items</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Moderate rental catalog listings</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-800/40 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-100 dark:border-slate-800">
                        <th className="px-6 py-4">Item</th>
                        <th className="px-6 py-4">Owner</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Upload Date & Time</th>
                        <th className="px-6 py-4 text-center">Requests</th>
                        <th className="px-6 py-4 text-center">Submissions</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50 text-xs">
                      {listings.map((l: any) => (
                        <tr key={l._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20">
                          <td className="px-6 py-4 flex items-center space-x-3">
                            <img
                              src={getImageUrl(l.images?.[0])}
                              alt=""
                              className="h-9 w-9 rounded-xl object-cover border border-gray-100 dark:border-slate-850"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 dark:text-white truncate max-w-[160px]">{l.title}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">Deposit: ₹{l.securityDeposit}</p>
                              {l.postIpAddress && (
                                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">IP: {l.postIpAddress}</p>
                              )}
                              {l.rentedPeriod && (
                                <div className="mt-1 text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2 py-1 rounded-md inline-flex items-center gap-0.5 border border-blue-100 dark:border-blue-900/30 w-fit">
                                  <span>Rented: {new Date(l.rentedPeriod.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - {new Date(l.rentedPeriod.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                                </div>
                              )}
                              {l.postCoordinates?.latitude && l.postCoordinates?.longitude ? (
                                <div className="mt-1 flex items-center space-x-1">
                                  <span className="text-[9px] text-green-600 dark:text-green-400 font-semibold font-mono">📍 GPS Attached</span>
                                  <a
                                    href={`https://www.google.com/maps?q=${l.postCoordinates.latitude},${l.postCoordinates.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 text-[8px] font-black uppercase rounded-md transition-all inline-block"
                                  >
                                    Track User Location
                                  </a>
                                </div>
                              ) : (
                                <p className="text-[9px] text-gray-400 dark:text-gray-500 italic mt-0.5">No GPS coords attached</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-900 dark:text-white font-bold">{l.owner?.fullName || 'Deleted'}</div>
                            {l.owner?.email && (
                              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{l.owner.email}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold text-primary-600 dark:text-primary-400">
                            ₹{l.rentalPrice}/{l.priceUnit?.toLowerCase()}
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">
                            {new Date(l.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center font-bold">{l.requestCount}</td>
                          <td className="px-6 py-4 text-center font-bold">{l.submissionCount ?? 1}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                              l.status === 'ACTIVE'
                                ? 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400'
                                : l.status === 'REMOVED'
                                ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                                : l.status === 'RENTED'
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                            }`}>
                              {l.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {l.status !== 'REMOVED' && (
                              <button
                                onClick={() => handleRemoveListing(l._id)}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/25 dark:text-red-400 dark:hover:bg-red-950/40 text-xs font-bold rounded-xl transition-all"
                              >
                                Take Down
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUBVIEW 4: CATEGORIES MANAGEMENT */}
            {currentTab === 'categories' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form to add category */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-3xl h-fit space-y-4">
                  <div>
                    <h3 className="font-outfit font-black text-sm text-gray-900 dark:text-white">Add New Category</h3>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Create a new directory filter</p>
                  </div>
                  <form onSubmit={handleAddCategory} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Textbooks"
                        required
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Icon Name (Lucide)</label>
                      <input
                        type="text"
                        placeholder="e.g. Layers, Book, Laptop"
                        value={newCatIcon}
                        onChange={(e) => setNewCatIcon(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</label>
                      <textarea
                        placeholder="Describe the items in this category..."
                        rows={3}
                        value={newCatDesc}
                        onChange={(e) => setNewCatDesc(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 text-xs focus:outline-none resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={addingCat}
                      className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center space-x-1.5 transition-all shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{addingCat ? 'Adding...' : 'Add Category'}</span>
                    </button>
                  </form>
                </div>

                {/* Categories Table list */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl overflow-hidden">
                  <div className="p-6 border-b border-gray-50 dark:border-slate-800/60">
                    <h3 className="font-outfit font-black text-sm text-gray-900 dark:text-white">Product Categories</h3>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">View and activate categories</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-slate-800/40 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-100 dark:border-slate-800">
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Slug</th>
                          <th className="px-6 py-4">Icon</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50 text-xs">
                        {categories.map((c: any) => (
                          <tr key={c._id}>
                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{c.name}</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{c.slug}</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{c.icon}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                c.isActive
                                  ? 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400'
                                  : 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                              }`}>
                                {c.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SUBVIEW 5: REPORTS & FLAGGED ITEMS */}
            {currentTab === 'reports' && (
              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-gray-50 dark:border-slate-800/60">
                  <h3 className="font-outfit font-black text-sm text-gray-900 dark:text-white">Flagged Content Reports</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Priority review queue for reported catalog content</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-800/40 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-100 dark:border-slate-800">
                        <th className="px-6 py-4">Report Details</th>
                        <th className="px-6 py-4">Reported By</th>
                        <th className="px-6 py-4">Target Type</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50 text-xs">
                      {reports.map((r: any) => (
                        <tr key={r._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20">
                          <td className="px-6 py-4 space-y-1">
                            <p className="font-bold text-gray-900 dark:text-white">Reason: {r.reason}</p>
                            <p className="text-gray-500 dark:text-gray-400 italic">"{r.description}"</p>
                            {r.targetDetails && (
                              <div className="mt-2 p-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-xl space-y-0.5 max-w-sm">
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Target Details:</p>
                                <p className="text-[11px] font-bold text-gray-700 dark:text-gray-200">
                                  {r.targetType === 'LISTING' ? `Listing: "${r.targetDetails.title}"` : `User: "${r.targetDetails.fullName}"`}
                                </p>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                            {r.reportedBy?.fullName || 'Student'} ({r.reportedBy?.email})
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-[10px] font-bold rounded-lg uppercase">
                              {r.targetType}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              r.status === 'OPEN'
                                ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                                : r.status === 'RESOLVED'
                                ? 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                            {r.status === 'OPEN' && (
                              <>
                                {r.targetType === 'LISTING' && (
                                  <Link
                                    to={`/listing/${r.targetId}`}
                                    className="px-3 py-1.5 border border-primary-200 text-primary-600 dark:border-primary-900/30 dark:text-primary-400 text-xs font-bold rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/15 transition-all inline-block align-middle"
                                  >
                                    Go to Post
                                  </Link>
                                )}
                                {r.targetType === 'LISTING' && r.targetDetails && r.targetDetails.status !== 'REMOVED' && (
                                  <button
                                    onClick={() => handleRemoveAndResolveReport(r._id, r.targetId)}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all"
                                  >
                                    Take Down & Resolve
                                  </button>
                                )}
                                <button
                                  onClick={() => handleResolveReport(r._id, 'RESOLVED')}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all"
                                >
                                  Resolve
                                </button>
                                <button
                                  onClick={() => handleResolveReport(r._id, 'DISMISSED')}
                                  className="px-3 py-1.5 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                                >
                                  Dismiss
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* SUBVIEW 6: APPROVALS */}
            {currentTab === 'approvals' && (
              <div className="space-y-6">
                {/* Reject Modal */}
                {rejectModalId && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md border border-gray-100 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                      <h3 className="font-outfit font-black text-lg text-gray-900 dark:text-white mb-2">Reject Listing</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Provide a reason so the student can fix their listing and resubmit.</p>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        placeholder="e.g. Poor image quality, item description is too vague..."
                        className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 text-sm resize-none"
                      />
                      <div className="flex gap-3 mt-5">
                        <button
                          onClick={() => { setRejectModalId(null); setRejectReason(''); }}
                          className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 text-sm font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleRejectListing}
                          className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-2xl transition-all"
                        >
                          Confirm Reject
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {pendingListings.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-16 text-center">
                    <div className="h-16 w-16 rounded-3xl bg-green-50 dark:bg-green-950/20 text-green-500 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                    <h3 className="font-outfit font-black text-lg text-gray-900 dark:text-white">All caught up!</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No listings are waiting for approval right now.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {pendingListings.map((listing: any) => (
                      <div
                        key={listing._id}
                        className="bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/30 rounded-3xl overflow-hidden shadow-sm animate-in fade-in duration-200"
                      >
                        {/* Listing Image */}
                        <div className="relative h-48 bg-gray-100 dark:bg-slate-800 overflow-hidden">
                          {listing.images?.[0] ? (
                            <img
                              src={listing.images[0].startsWith('data:') ? listing.images[0] : listing.images[0]}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ListingsIcon className="h-10 w-10 text-gray-300 dark:text-slate-600" />
                            </div>
                          )}
                          {/* Pending badge and submission count */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                            <span className="bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                              <Clock className="h-3 w-3" /> PENDING
                            </span>
                            {listing.submissionCount !== undefined && (
                              <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                Submit Count: {listing.submissionCount}
                              </span>
                            )}
                          </div>
                          {/* Image count */}
                          {listing.images?.length > 1 && (
                            <span className="absolute top-3 right-3 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              +{listing.images.length - 1} photos
                            </span>
                          )}
                        </div>

                        {/* Listing Details */}
                        <div className="p-5 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-outfit font-black text-gray-900 dark:text-white text-base leading-snug">{listing.title}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{listing.category?.name}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-black text-primary-600 dark:text-primary-400">₹{listing.rentalPrice}</p>
                              <p className="text-[10px] text-gray-400">/ {listing.priceUnit?.toLowerCase()}</p>
                            </div>
                          </div>

                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{listing.description}</p>

                          <div className="flex flex-wrap gap-2">
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400">
                              {listing.condition?.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400">
                              📍 {listing.location}
                            </span>
                            {listing.securityDeposit > 0 && (
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400">
                                🔐 ₹{listing.securityDeposit} deposit
                              </span>
                            )}
                          </div>

                          {/* Owner info */}
                          <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-slate-800">
                            <img
                              src={listing.owner?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${listing.owner?.fullName}`}
                              alt={listing.owner?.fullName}
                              className="h-7 w-7 rounded-full object-cover"
                            />
                            <div>
                              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{listing.owner?.fullName}</p>
                              <p className="text-[10px] text-gray-400">{listing.owner?.email}</p>
                            </div>
                            <p className="ml-auto text-[10px] text-gray-400">{new Date(listing.createdAt).toLocaleDateString()}</p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-1">
                            <button
                              onClick={() => handleApproveListing(listing._id)}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-2xl transition-all"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => { setRejectModalId(listing._id); setRejectReason(''); }}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl border border-red-200 dark:border-red-900/40 transition-all"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* SUBVIEW 7: REJECTED TODAY */}
            {currentTab === 'rejected' && (
              <div className="space-y-6">
                {rejectedListings.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-16 text-center">
                    <div className="h-16 w-16 rounded-3xl bg-gray-55 dark:bg-slate-800 text-gray-400 flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8" />
                    </div>
                    <h3 className="font-outfit font-black text-lg text-gray-900 dark:text-white">Clean log</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No items have been rejected today.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {rejectedListings.map((listing: any) => (
                      <div
                        key={listing._id}
                        className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/30 rounded-3xl overflow-hidden shadow-sm animate-in fade-in duration-200"
                      >
                        {/* Listing Image */}
                        <div className="relative h-48 bg-gray-100 dark:bg-slate-800 overflow-hidden">
                          {listing.images?.[0] ? (
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ListingsIcon className="h-10 w-10 text-gray-300 dark:text-slate-600" />
                            </div>
                          )}
                          {/* Rejected badge */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                            <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                              <XCircle className="h-3 w-3" /> REJECTED TODAY
                            </span>
                          </div>
                        </div>

                        {/* Listing Details */}
                        <div className="p-5 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-outfit font-black text-gray-900 dark:text-white text-base leading-snug">{listing.title}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{listing.category?.name}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-black text-primary-600 dark:text-primary-400">₹{listing.rentalPrice}</p>
                              <p className="text-[10px] text-gray-400">/ {listing.priceUnit?.toLowerCase()}</p>
                            </div>
                          </div>

                          <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-950/20 p-3 rounded-2xl">
                            <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase">Rejection Reason:</p>
                            <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 italic">"{listing.rejectionReason || 'Does not meet guidelines.'}"</p>
                          </div>

                          <div className="flex flex-wrap gap-2 text-[10px] font-bold text-gray-500">
                            <span>📍 {listing.location}</span>
                            <span>•</span>
                            <span>Submissions: {listing.submissionCount ?? 1}</span>
                          </div>

                          {/* Owner info */}
                          <div className="flex items-center gap-2 pt-1.5 border-t border-gray-100 dark:border-slate-800">
                            <img
                              src={listing.owner?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${listing.owner?.fullName}`}
                              alt=""
                              className="h-7 w-7 rounded-full object-cover"
                            />
                            <div>
                              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{listing.owner?.fullName}</p>
                              <p className="text-[10px] text-gray-400">{listing.owner?.email}</p>
                            </div>
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={() => handleApproveListing(listing._id)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-green-500/10"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* CREATE USER / ADMIN MODAL */}
        {createAccountModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-outfit font-black text-base text-gray-900 dark:text-white">Create Account</h3>
                    <p className="text-xs text-gray-400">Directly provision verified campus credentials</p>
                  </div>
                </div>
                <button
                  onClick={() => setCreateAccountModalOpen(false)}
                  className="h-8 w-8 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-white flex items-center justify-center transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {createUserError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl text-red-600 dark:text-red-400 text-xs font-semibold">
                  {createUserError}
                </div>
              )}

              {createUserSuccess && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>{createUserSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateUserSubmit} className="space-y-4">
                {/* Role Switcher */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Role</label>
                  <div className="grid grid-cols-2 gap-3 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setCreateUserForm({ ...createUserForm, role: 'STUDENT' })}
                      className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                        createUserForm.role === 'STUDENT'
                          ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                      }`}
                    >
                      Student Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateUserForm({ ...createUserForm, role: 'ADMIN' })}
                      className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                        createUserForm.role === 'ADMIN'
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                      }`}
                    >
                      Administrator
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikas Sharma"
                      value={createUserForm.fullName}
                      onChange={(e) => setCreateUserForm({ ...createUserForm, fullName: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">NIET Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="name@niet.co.in"
                      value={createUserForm.email}
                      onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Password (Max 16 chars) */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Password (6 - 16 characters)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      required
                      maxLength={16}
                      placeholder="••••••••"
                      value={createUserForm.password}
                      onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Student specific fields */}
                {createUserForm.role === 'STUDENT' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Course</label>
                      <input
                        type="text"
                        value={createUserForm.course}
                        onChange={(e) => setCreateUserForm({ ...createUserForm, course: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Branch</label>
                      <input
                        type="text"
                        value={createUserForm.branch}
                        onChange={(e) => setCreateUserForm({ ...createUserForm, branch: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Year</label>
                      <select
                        value={createUserForm.year}
                        onChange={(e) => setCreateUserForm({ ...createUserForm, year: parseInt(e.target.value, 10) })}
                        className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold focus:outline-none"
                      >
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateAccountModalOpen(false)}
                    className="flex-1 py-3 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-bold rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-primary-600/20 transition-all disabled:opacity-50"
                  >
                    {creatingUser ? 'Creating...' : 'Provision Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

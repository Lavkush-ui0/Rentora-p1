import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { adminService } from '../services/adminService';
import {
  Users as UsersIcon, Package as ListingsIcon, CheckCircle2, Plus,
  MessageCircle
} from 'lucide-react';
import { AdminLayout } from '../layouts/AdminLayout';
import { getImageUrl } from '../utils/imageUrl';

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
    : path.includes('/categories')
    ? 'categories'
    : path.includes('/reports')
    ? 'reports'
    : 'dashboard';

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Category input fields
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Layers');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [addingCat, setAddingCat] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (currentTab === 'dashboard') {
        const statsRes = await adminService.getDashboardStats();
        if (statsRes.data?.success) setStats(statsRes.data.stats);
      } else if (currentTab === 'users') {
        const usersRes = await adminService.getUsers();
        if (usersRes.data?.success) setUsers(usersRes.data.users);
      } else if (currentTab === 'listings') {
        const listRes = await adminService.getListings();
        if (listRes.data?.success) setListings(listRes.data.listings);
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

  const handleBlockToggle = async (userId: string, isCurrentlyBlocked: boolean) => {
    try {
      if (isCurrentlyBlocked) {
        await adminService.unblockUser(userId);
      } else {
        await adminService.blockUser(userId);
      }
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle user block status.');
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
                <div className="p-6 border-b border-gray-50 dark:border-slate-800/60">
                  <h3 className="font-outfit font-black text-sm text-gray-900 dark:text-white">Registered Students</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Manage accounts and authorization access</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-800/40 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-100 dark:border-slate-800">
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50 text-xs">
                      {users.map((u: any) => (
                        <tr key={u._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20">
                          <td className="px-6 py-4 flex items-center space-x-3">
                            <img
                              src={u.avatar || 'https://picsum.photos/100/100'}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover border border-gray-100 dark:border-slate-700"
                            />
                            <span className="font-bold text-gray-900 dark:text-white">{u.fullName}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{u.email}</td>
                          <td className="px-6 py-4 font-semibold uppercase text-[10px]">{u.role}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              u.isBlocked
                                ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                                : 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400'
                            }`}>
                              {u.isBlocked ? 'Blocked' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {u.role !== 'ADMIN' && (
                              <button
                                onClick={() => handleBlockToggle(u._id, u.isBlocked)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                  u.isBlocked
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/25 dark:text-red-400 dark:hover:bg-red-950/40'
                                }`}
                              >
                                {u.isBlocked ? 'Unblock' : 'Block User'}
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
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Requests</th>
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
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-bold">{l.owner?.fullName || 'Deleted'}</td>
                          <td className="px-6 py-4 font-bold text-primary-600 dark:text-primary-400">
                            ₹{l.rentalPrice}/{l.priceUnit?.toLowerCase()}
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{l.category?.name}</td>
                          <td className="px-6 py-4 text-center font-bold">{l.requestCount}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                              l.status === 'ACTIVE'
                                ? 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400'
                                : l.status === 'REMOVED'
                                ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
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
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

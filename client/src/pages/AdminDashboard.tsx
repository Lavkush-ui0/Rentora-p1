import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { Users, Package, FileText, FolderOpen, CheckCircle2, XCircle, Trash2, Plus, ShieldAlert } from 'lucide-react';

const TABS = [
  { key: 'users', label: 'Users', icon: Users },
  { key: 'listings', label: 'Listings', icon: Package },
  { key: 'categories', label: 'Categories', icon: FolderOpen },
  { key: 'reports', label: 'Reports', icon: FileText },
];

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Layers');
  const [addingCat, setAddingCat] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'users') {
        const res = await adminService.getUsers();
        if (res.data?.success) setUsers(res.data.users);
      } else if (tab === 'listings') {
        const res = await adminService.getListings();
        if (res.data?.success) setListings(res.data.listings);
      } else if (tab === 'categories') {
        const res = await adminService.getCategories();
        if (res.data?.success) setCategories(res.data.categories);
      } else if (tab === 'reports') {
        const res = await adminService.getReports();
        if (res.data?.success) setReports(res.data.reports);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [tab]);

  const handleBlockUser = async (id: string, isBlocked: boolean) => {
    try {
      if (isBlocked) await adminService.unblockUser(id);
      else await adminService.blockUser(id);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed.');
    }
  };

  const handleRemoveListing = async (id: string) => {
    if (!confirm('Remove this listing?')) return;
    try {
      await adminService.removeListing(id);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove listing.');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingCat(true);
    try {
      await adminService.createCategory({ name: newCatName, icon: newCatIcon });
      setNewCatName('');
      setNewCatIcon('Layers');
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create category.');
    } finally { setAddingCat(false); }
  };

  const handleUpdateReport = async (id: string, status: string) => {
    try {
      await adminService.updateReportStatus(id, status);
      await fetchData();
    } catch (err) { console.error(err); }
  };

  const handleToggleCategory = async (id: string, isActive: boolean) => {
    try {
      await adminService.updateCategory(id, { isActive: !isActive });
      await fetchData();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-2xl bg-primary-100 dark:bg-primary-950/30 flex items-center justify-center">
          <ShieldAlert className="h-5.5 w-5.5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black font-outfit text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500">Manage users, listings, categories, and reports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all flex-shrink-0 ${
              tab === key
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-gray-300'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 flex items-center space-x-4">
              <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-slate-800"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full w-1/3"></div>
                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Users Tab */}
          {tab === 'users' && (
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u._id} className={`flex items-center space-x-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border transition-all ${u.isBlocked ? 'border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10' : 'border-gray-100 dark:border-slate-800'}`}>
                  <img src={u.avatar} alt={u.fullName} className="h-10 w-10 rounded-full border border-gray-100 dark:border-slate-700 object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{u.fullName}</p>
                      {u.role === 'ADMIN' && <span className="text-[10px] font-black bg-primary-100 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 px-1.5 py-0.5 rounded-full">ADMIN</span>}
                      {u.isBlocked && <span className="text-[10px] font-black bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-full">BLOCKED</span>}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{u.email} · {u.course} {u.branch}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{u.completedRentals} rentals · ⭐ {u.ratingAverage?.toFixed(1)}</p>
                  </div>
                  {u.role !== 'ADMIN' && u._id !== user?.id && (
                    <button
                      onClick={() => handleBlockUser(u._id, u.isBlocked)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex-shrink-0 ${
                        u.isBlocked
                          ? 'border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20'
                          : 'border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20'
                      }`}
                    >
                      {u.isBlocked ? <><CheckCircle2 className="h-3.5 w-3.5" /><span>Unblock</span></> : <><XCircle className="h-3.5 w-3.5" /><span>Block</span></>}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Listings Tab */}
          {tab === 'listings' && (
            <div className="space-y-3">
              {listings.map((l) => (
                <div key={l._id} className="flex items-center space-x-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
                  <img src={l.images?.[0]} alt={l.title} className="h-14 w-14 rounded-2xl object-cover border border-gray-100 dark:border-slate-700 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{l.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">by {l.owner?.fullName} · {l.status} · ₹{l.rentalPrice}/{l.priceUnit?.toLowerCase()}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{l.viewCount} views · {l.requestCount} requests</p>
                  </div>
                  {l.status !== 'REMOVED' && (
                    <button
                      onClick={() => handleRemoveListing(l._id)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Categories Tab */}
          {tab === 'categories' && (
            <div className="space-y-4">
              <form onSubmit={handleAddCategory} className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4">
                <input
                  type="text"
                  placeholder="New category name"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  required
                  className="flex-1 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:border-primary-500"
                />
                <input
                  type="text"
                  placeholder="Lucide icon name"
                  value={newCatIcon}
                  onChange={e => setNewCatIcon(e.target.value)}
                  className="w-36 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:border-primary-500"
                />
                <button
                  type="submit"
                  disabled={addingCat}
                  className="flex items-center space-x-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add</span>
                </button>
              </form>
              <div className="space-y-3">
                {categories.map((cat) => (
                  <div key={cat._id} className={`flex items-center space-x-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border transition-all ${!cat.isActive ? 'opacity-60 border-gray-100 dark:border-slate-800' : 'border-gray-100 dark:border-slate-800'}`}>
                    <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{cat.icon?.[0] || 'C'}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{cat.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{cat.slug} · Icon: {cat.icon || 'N/A'}</p>
                    </div>
                    <button
                      onClick={() => handleToggleCategory(cat._id, cat.isActive)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                        cat.isActive
                          ? 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                          : 'border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20'
                      }`}
                    >
                      {cat.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {tab === 'reports' && (
            <div className="space-y-3">
              {reports.length > 0 ? reports.map((rep) => (
                <div key={rep._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          rep.status === 'OPEN' ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                          rep.status === 'RESOLVED' ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
                          'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                        }`}>{rep.status}</span>
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{rep.targetType}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{rep.reason}</p>
                      {rep.description && <p className="text-xs text-gray-500 dark:text-gray-400">{rep.description}</p>}
                      <p className="text-xs text-gray-400 dark:text-gray-500">Reported by: {rep.reportedBy?.fullName}</p>
                    </div>
                    {rep.status === 'OPEN' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateReport(rep._id, 'RESOLVED')} className="text-xs font-bold px-3 py-1.5 rounded-xl border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 transition-all">
                          Resolve
                        </button>
                        <button onClick={() => handleUpdateReport(rep._id, 'DISMISSED')} className="text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 text-gray-400 dark:text-gray-600">
                  <FileText className="h-12 w-12 mx-auto mb-3" />
                  <p className="text-sm">No reports to review</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default AdminDashboard;

import React, { useEffect, useState } from 'react';
import api from '../../api';
import { ShieldCheck, Search, Key, Power, Loader2, X, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

function RoleBadge({ role }) {
  const map = {
    ADMIN:      'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/40',
    SUPPLIER:   'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
    RESTAURANT: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${map[role] || 'bg-gray-100 text-gray-700'}`}>
      {role}
    </span>
  );
}

export default function AdminUsers() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Password reset modal
  const [resetModal, setResetModal] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting]   = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/admin-portal/users')
      .then(res => setUsers(res.data))
      .catch(() => toast.error('Failed to load user accounts.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (account) => {
    if (account.LOGIN_ID === currentAdmin?.loginId) {
      toast.error('Security Protection: You cannot deactivate your currently logged-in administrator account.');
      return;
    }
    const action = account.IS_ACTIVE === 1 ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} account: ${account.EMAIL}?`)) return;

    try {
      const res = await api.put(`/admin-portal/users/${account.LOGIN_ID}/toggle-status`);
      toast.success(res.data.message);
      setUsers(prev => prev.map(u => u.LOGIN_ID === account.LOGIN_ID ? { ...u, IS_ACTIVE: res.data.is_active } : u));
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action} account.`);
    }
  };

  const handleOpenReset = (account) => {
    setTargetUser(account);
    setNewPassword('');
    setResetModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setResetting(true);
    try {
      const res = await api.post(`/admin-portal/users/${targetUser.LOGIN_ID}/reset-password`, {
        new_password: newPassword
      });
      toast.success(res.data.message);
      setResetModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setResetting(false);
    }
  };

  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'All' || u.ROLE === roleFilter;
    const matchQ = !search.trim() ||
      u.EMAIL.toLowerCase().includes(search.toLowerCase()) ||
      u.SUPPLIER_NAME?.toLowerCase().includes(search.toLowerCase()) ||
      u.RESTAURANT_NAME?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchQ;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Account & Authorization Management</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          View all authenticated system accounts, activate/deactivate access, and securely reset passwords without exposing password hashes.
        </p>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email or business name..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="flex gap-1.5">
          {['All', 'ADMIN', 'SUPPLIER', 'RESTAURANT'].map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors border ${
                roleFilter === role
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700'
              }`}
            >
              {role === 'All' ? 'All Roles' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-gray-200/80 dark:border-slate-800">
          <ShieldCheck className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No user accounts found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-gray-200/80 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3 text-left">Login ID</th>
                  <th className="px-4 py-3 text-left">Account Email</th>
                  <th className="px-4 py-3 text-center">System Role</th>
                  <th className="px-4 py-3 text-left">Linked Entity</th>
                  <th className="px-4 py-3 text-left">Created Date</th>
                  <th className="px-4 py-3 text-center">Account Status</th>
                  <th className="px-4 py-3 text-right">Security Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filtered.map(u => {
                  const isCurrentSelf = u.LOGIN_ID === currentAdmin?.loginId;
                  return (
                    <tr key={u.LOGIN_ID} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-gray-500">#{u.LOGIN_ID}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                        {u.EMAIL}
                        {isCurrentSelf && (
                          <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                            Current Session
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <RoleBadge role={u.ROLE} />
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {u.ROLE === 'SUPPLIER'
                          ? `🏭 ${u.SUPPLIER_NAME || 'Supplier #' + u.SUPPLIER_ID}`
                          : u.ROLE === 'RESTAURANT'
                          ? `🍽️ ${u.RESTAURANT_NAME || 'Restaurant #' + u.RESTAURANT_ID}`
                          : <span className="text-gray-400 italic">System Superuser (No business link)</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {u.CREATED_AT ? new Date(u.CREATED_AT).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          u.IS_ACTIVE === 1
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}>
                          {u.IS_ACTIVE === 1 ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Reset Password */}
                          <button
                            onClick={() => handleOpenReset(u)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Key className="w-3 h-3" /> Reset Password
                          </button>

                          {/* Toggle Active Status */}
                          <button
                            disabled={isCurrentSelf}
                            onClick={() => handleToggleStatus(u)}
                            title={isCurrentSelf ? 'Cannot deactivate self' : u.IS_ACTIVE === 1 ? 'Disable Account' : 'Activate Account'}
                            className={`p-1.5 rounded-md transition-colors ${
                              isCurrentSelf
                                ? 'opacity-30 cursor-not-allowed text-gray-400'
                                : u.IS_ACTIVE === 1
                                ? 'text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModal && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Reset Account Password
              </h3>
              <button onClick={() => setResetModal(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs space-y-1">
              <div><span className="text-gray-500">Account:</span> <span className="font-semibold text-gray-900 dark:text-white">{targetUser.EMAIL}</span></div>
              <div><span className="text-gray-500">Role:</span> <span className="font-semibold text-gray-900 dark:text-white">{targetUser.ROLE}</span></div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetModal(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="flex items-center px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  {resetting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Set New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

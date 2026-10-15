import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Store, Search, Plus, Edit2, Loader2, X, Power } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState({ restaurant_name: '', city: '', phone: '' });
  const [saving, setSaving]       = useState(false);

  const fetchRestaurants = () => {
    setLoading(true);
    api.get(`/admin-portal/restaurants?q=${encodeURIComponent(search)}`)
      .then(res => setRestaurants(res.data))
      .catch(() => toast.error('Failed to load restaurants.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRestaurants();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenModal = (restaurant = null) => {
    if (restaurant) {
      setEditing(restaurant);
      setForm({
        restaurant_name: restaurant.RESTAURANT_NAME || '',
        city:            restaurant.CITY || '',
        phone:           restaurant.PHONE || '',
      });
    } else {
      setEditing(null);
      setForm({ restaurant_name: '', city: '', phone: '' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.restaurant_name.trim()) {
      toast.error('Restaurant name is required.');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin-portal/restaurants/${editing.RESTAURANT_ID}`, form);
        toast.success('Restaurant updated successfully.');
      } else {
        await api.post('/admin-portal/restaurants', form);
        toast.success('Restaurant created successfully.');
      }
      setShowModal(false);
      fetchRestaurants();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save restaurant.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (restaurant) => {
    if (!restaurant.LOGIN_ID) {
      toast.info('This restaurant has no registered login account to activate/deactivate.');
      return;
    }
    const action = restaurant.IS_ACTIVE === 1 ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} the login account for ${restaurant.RESTAURANT_NAME}?`)) return;

    try {
      const res = await api.put(`/admin-portal/restaurants/${restaurant.RESTAURANT_ID}/toggle-status`);
      toast.success(res.data.message);
      setRestaurants(prev => prev.map(r => r.RESTAURANT_ID === restaurant.RESTAURANT_ID ? { ...r, IS_ACTIVE: res.data.is_active } : r));
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action} account.`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Restaurant Management</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage restaurant branches, spending records, and account statuses.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Restaurant
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by restaurant or city..."
          className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : restaurants.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-gray-200/80 dark:border-slate-800">
          <Store className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No restaurants found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-gray-200/80 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Restaurant Name</th>
                  <th className="px-4 py-3 text-left">City</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-center">Orders</th>
                  <th className="px-4 py-3 text-right">Total Spend</th>
                  <th className="px-4 py-3 text-center">Login Account</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {restaurants.map(r => (
                  <tr key={r.RESTAURANT_ID} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-gray-500">#{r.RESTAURANT_ID}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{r.RESTAURANT_NAME}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.CITY || '—'}</td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-300">{r.PHONE || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full font-mono bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-700/40">
                        {r.ORDER_COUNT}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900 dark:text-white">
                      ₹{Number(r.TOTAL_SPEND).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.LOGIN_ID ? (
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            r.IS_ACTIVE === 1
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}>
                            {r.IS_ACTIVE === 1 ? 'Active' : 'Disabled'}
                          </span>
                          <button
                            title={r.IS_ACTIVE === 1 ? 'Click to Deactivate' : 'Click to Activate'}
                            onClick={() => handleToggleStatus(r)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">No Login</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenModal(r)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-violet-600 dark:hover:text-violet-400"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {editing ? 'Edit Restaurant' : 'Add New Restaurant'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.restaurant_name}
                  onChange={e => setForm({ ...form, restaurant_name: e.target.value })}
                  placeholder="e.g. Royal Bistro"
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Bangalore"
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. +91 9988776655"
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  {editing ? 'Save Changes' : 'Create Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

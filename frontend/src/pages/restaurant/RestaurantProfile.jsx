import React, { useEffect, useState } from 'react';
import api from '../../api';
import { User, Save, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

export default function RestaurantProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm]       = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [dirty, setDirty]     = useState(false);

  useEffect(() => {
    api.get('/restaurant-portal/profile')
      .then(r => {
        setProfile(r.data);
        setForm({ restaurant_name: r.data.RESTAURANT_NAME, city: r.data.CITY || '', phone: r.data.PHONE || '' });
      })
      .catch(() => toast.error('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setDirty(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.restaurant_name?.trim()) { toast.error('Restaurant name is required.'); return; }
    setSaving(true);
    try {
      await api.put('/restaurant-portal/profile', form);
      toast.success('Profile updated successfully!');
      setDirty(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      {/* Avatar header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-200/80 dark:border-slate-800 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
          <span className="text-white text-2xl font-bold">{profile?.RESTAURANT_NAME?.[0]?.toUpperCase() || 'R'}</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile?.RESTAURANT_NAME}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user?.email}</p>
          <span className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
            Restaurant • ID #{profile?.RESTAURANT_ID}
          </span>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-200/80 dark:border-slate-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Business Information</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Restaurant Name *</label>
            <input name="restaurant_name" value={form.restaurant_name || ''} onChange={handleChange}
              className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Phone</label>
              <input name="phone" value={form.phone || ''} onChange={handleChange}
                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">City</label>
              <input name="city" value={form.city || ''} onChange={handleChange}
                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" disabled={saving || !dirty}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-emerald-500/20">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Read-only account info */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-200/80 dark:border-slate-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Account Information</h3>
        <dl className="space-y-3">
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500 dark:text-gray-400">Email</dt>
            <dd className="text-gray-900 dark:text-gray-100 font-medium">{user?.email}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500 dark:text-gray-400">Role</dt>
            <dd className="text-gray-900 dark:text-gray-100 font-medium">Restaurant</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500 dark:text-gray-400">Restaurant ID</dt>
            <dd className="font-mono text-gray-900 dark:text-gray-100">#{user?.restaurantId}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

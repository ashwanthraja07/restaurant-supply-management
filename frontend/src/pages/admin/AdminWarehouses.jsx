import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Warehouse, Plus, Edit2, Trash2, Loader2, X, Search } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminWarehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState({ warehouse_name: '', city: '' });
  const [saving, setSaving]       = useState(false);

  const fetchWarehouses = () => {
    setLoading(true);
    api.get('/admin-portal/warehouses')
      .then(res => setWarehouses(res.data))
      .catch(() => toast.error('Failed to load warehouses.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleOpenModal = (wh = null) => {
    if (wh) {
      setEditing(wh);
      setForm({
        warehouse_name: wh.WAREHOUSE_NAME || '',
        city:           wh.CITY || '',
      });
    } else {
      setEditing(null);
      setForm({ warehouse_name: '', city: '' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.warehouse_name.trim()) {
      toast.error('Warehouse name is required.');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin-portal/warehouses/${editing.WAREHOUSE_ID}`, form);
        toast.success('Warehouse updated successfully.');
      } else {
        await api.post('/admin-portal/warehouses', form);
        toast.success('Warehouse created successfully.');
      }
      setShowModal(false);
      fetchWarehouses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save warehouse.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (wh) => {
    if (!window.confirm(`Are you sure you want to delete warehouse "${wh.WAREHOUSE_NAME}"?`)) return;
    try {
      await api.delete(`/admin-portal/warehouses/${wh.WAREHOUSE_ID}`);
      toast.success('Warehouse deleted.');
      setWarehouses(prev => prev.filter(w => w.WAREHOUSE_ID !== wh.WAREHOUSE_ID));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot delete warehouse.');
    }
  };

  const filtered = warehouses.filter(w =>
    !search.trim() ||
    w.WAREHOUSE_NAME.toLowerCase().includes(search.toLowerCase()) ||
    w.CITY?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Warehouse Management</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage distribution facilities, storage locations, and regional stock depots.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Warehouse
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search warehouse or city..."
          className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-gray-200/80 dark:border-slate-800">
          <Warehouse className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No warehouses found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-gray-200/80 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Warehouse Name</th>
                  <th className="px-4 py-3 text-left">City / Region</th>
                  <th className="px-4 py-3 text-center">Stored Products</th>
                  <th className="px-4 py-3 text-right">Total Units Held</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filtered.map(w => (
                  <tr key={w.WAREHOUSE_ID} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-gray-500">#{w.WAREHOUSE_ID}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{w.WAREHOUSE_NAME}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{w.CITY || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full font-mono bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-700/40">
                        {w.ITEM_COUNT} items
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900 dark:text-white">
                      {Number(w.TOTAL_STOCK).toLocaleString()} units
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(w)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-violet-600 dark:hover:text-violet-400"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(w)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                {editing ? 'Edit Warehouse' : 'Add New Warehouse'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Warehouse Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.warehouse_name}
                  onChange={e => setForm({ ...form, warehouse_name: e.target.value })}
                  placeholder="e.g. Central Cold Storage Hub"
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  City / Location
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Delhi"
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
                  {editing ? 'Save Changes' : 'Create Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import { Pencil, Trash2, Plus } from 'lucide-react';

export default function Warehouses() {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ warehouse_id: '', warehouse_name: '', city: '', capacity: '' });
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/warehouses'); setItems(res.data); } catch (err) { toast.error('Error fetching warehouses'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/warehouses/${editing.WAREHOUSE_ID}`, formData);
      else await api.post('/warehouses', formData);
      toast.success(editing ? 'Warehouse updated' : 'Warehouse created');
      setShowForm(false);
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.error || 'Error saving warehouse'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this warehouse?')) {
      try { await api.delete(`/warehouses/${id}`); fetchItems(); toast.success('Deleted'); } catch (err) { toast.error('Error deleting warehouse'); }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Warehouses</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage storage facilities and capacities</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setFormData({ warehouse_id: '', warehouse_name: '', city: '', capacity: '' }); }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-xs text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> Add Warehouse
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-200 dark:border-slate-800 transition-colors">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            {editing ? 'Edit Warehouse' : 'New Warehouse'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Warehouse ID</label>
                <input required type="number" disabled={!!editing} value={formData.warehouse_id} onChange={e => setFormData({...formData, warehouse_id: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Warehouse Name</label>
                <input required type="text" value={formData.warehouse_name} onChange={e => setFormData({...formData, warehouse_name: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">City</label>
                <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Capacity</label>
                <input required type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-4 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Save</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-gray-200 dark:border-slate-800 overflow-hidden transition-colors">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
          <thead className="bg-gray-50/75 dark:bg-slate-950/50">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">City</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Capacity</th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800 text-sm">
            {items.map(r => (
              <tr key={r.WAREHOUSE_ID} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition">
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100 font-mono font-medium">{r.WAREHOUSE_ID}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100 font-medium">{r.WAREHOUSE_NAME}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{r.CITY}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{r.CAPACITY.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                  <button onClick={() => { setEditing(r); setFormData({ warehouse_id: r.WAREHOUSE_ID, warehouse_name: r.WAREHOUSE_NAME, city: r.CITY, capacity: r.CAPACITY }); setShowForm(true); }} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3 p-1 rounded"><Pencil className="w-4 h-4 inline" /></button>
                  <button onClick={() => handleDelete(r.WAREHOUSE_ID)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

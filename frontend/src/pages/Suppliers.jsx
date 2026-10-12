import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import { Pencil, Trash2, Plus } from 'lucide-react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ supplier_id: '', supplier_name: '', contact_no: '', city: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      toast.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/suppliers/${editing.SUPPLIER_ID}`, formData);
        toast.success('Supplier updated');
      } else {
        await api.post('/suppliers', formData);
        toast.success('Supplier created');
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ supplier_id: '', supplier_name: '', contact_no: '', city: '' });
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error saving supplier');
    }
  };

  const handleEdit = (supplier) => {
    setEditing(supplier);
    setFormData({
      supplier_id: supplier.SUPPLIER_ID,
      supplier_name: supplier.SUPPLIER_NAME,
      contact_no: supplier.CONTACT_NO,
      city: supplier.CITY
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier? Cannot be undone if no other tables reference it.')) {
      try {
        await api.delete(`/suppliers/${id}`);
        toast.success('Supplier deleted');
        fetchSuppliers();
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to delete supplier. It may be referenced elsewhere.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Suppliers</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage vendors supplying food and goods</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setFormData({ supplier_id: '', supplier_name: '', contact_no: '', city: '' }); }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-xs text-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-200 dark:border-slate-800 transition-colors">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            {editing ? 'Edit Supplier' : 'New Supplier'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Supplier ID</label>
                <input required type="number" disabled={!!editing} value={formData.supplier_id} onChange={e => setFormData({...formData, supplier_id: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Supplier Name</label>
                <input required type="text" value={formData.supplier_name} onChange={e => setFormData({...formData, supplier_name: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Contact Number</label>
                <input required type="text" value={formData.contact_no} onChange={e => setFormData({...formData, contact_no: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">City</label>
                <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">City</th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800 text-sm">
            {suppliers.map(sup => (
              <tr key={sup.SUPPLIER_ID} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition">
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100 font-mono font-medium">{sup.SUPPLIER_ID}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100 font-medium">{sup.SUPPLIER_NAME}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{sup.CONTACT_NO}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{sup.CITY}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                  <button onClick={() => handleEdit(sup)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3 p-1 rounded"><Pencil className="w-4 h-4 inline" /></button>
                  <button onClick={() => handleDelete(sup.SUPPLIER_ID)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

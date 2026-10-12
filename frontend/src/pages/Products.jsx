import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import { Pencil, Trash2, Plus } from 'lucide-react';

export default function Products() {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({ product_id: '', product_name: '', category: '', unit_cost: '', supplier_id: '' });
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchItems(); fetchSuppliers(); }, []);

  const fetchItems = async () => { try { const res = await api.get('/products'); setItems(res.data); } catch (err) { toast.error('Error fetching products'); } };
  const fetchSuppliers = async () => { try { const res = await api.get('/suppliers'); setSuppliers(res.data); } catch (err) {} };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/products/${editing.PRODUCT_ID}`, formData);
      else await api.post('/products', formData);
      toast.success(editing ? 'Product updated' : 'Product created');
      setShowForm(false);
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.error || 'Error saving product'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      try { await api.delete(`/products/${id}`); fetchItems(); toast.success('Deleted'); } catch (err) { toast.error('Error deleting product'); }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Products</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Catalog of products, costs, and associated suppliers</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setFormData({ product_id: '', product_name: '', category: '', unit_cost: '', supplier_id: (suppliers[0]?.SUPPLIER_ID || '') }); }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-xs text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-200 dark:border-slate-800 transition-colors">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            {editing ? 'Edit Product' : 'New Product'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Product ID</label>
                <input required type="number" disabled={!!editing} value={formData.product_id} onChange={e => setFormData({...formData, product_id: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Product Name</label>
                <input required type="text" value={formData.product_name} onChange={e => setFormData({...formData, product_name: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Category</label>
                <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Unit Cost ($)</label>
                <input required type="number" step="0.01" value={formData.unit_cost} onChange={e => setFormData({...formData, unit_cost: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Supplier</label>
                <select required value={formData.supplier_id} onChange={e => setFormData({...formData, supplier_id: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s.SUPPLIER_ID} value={s.SUPPLIER_ID}>{s.SUPPLIER_NAME}</option>)}
                </select>
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
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cost</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Supplier</th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800 text-sm">
            {items.map(r => (
              <tr key={r.PRODUCT_ID} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition">
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100 font-mono font-medium">{r.PRODUCT_ID}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100 font-medium">{r.PRODUCT_NAME}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300">{r.CATEGORY}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100 font-semibold">${Number(r.UNIT_COST).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{r.SUPPLIER_NAME}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                  <button onClick={() => { setEditing(r); setFormData({ product_id: r.PRODUCT_ID, product_name: r.PRODUCT_NAME, category: r.CATEGORY, unit_cost: r.UNIT_COST, supplier_id: r.SUPPLIER_ID }); setShowForm(true); }} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3 p-1 rounded"><Pencil className="w-4 h-4 inline" /></button>
                  <button onClick={() => handleDelete(r.PRODUCT_ID)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

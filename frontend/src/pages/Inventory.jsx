import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import { Pencil, Trash2, Plus } from 'lucide-react';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState({ inventory_id: '', product_id: '', warehouse_id: '', stock_qty: '', reorder_level: '' });
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchItems(); fetchProducts(); fetchWarehouses(); }, []);

  const fetchItems = async () => { try { const res = await api.get('/inventory'); setItems(res.data); } catch (err) { toast.error('Error fetching inventory'); } };
  const fetchProducts = async () => { try { const res = await api.get('/products'); setProducts(res.data); } catch (err) {} };
  const fetchWarehouses = async () => { try { const res = await api.get('/warehouses'); setWarehouses(res.data); } catch (err) {} };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/inventory/${editing.INVENTORY_ID}`, formData);
      else await api.post('/inventory', formData);
      toast.success(editing ? 'Inventory record updated' : 'Inventory record created');
      setShowForm(false);
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.error || 'Error saving inventory'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this inventory record?')) {
      try { await api.delete(`/inventory/${id}`); fetchItems(); toast.success('Deleted'); } catch (err) { toast.error('Error deleting inventory'); }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Inventory</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track stock quantities, warehouses, and reorder alerts</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setFormData({ inventory_id: '', product_id: (products[0]?.PRODUCT_ID || ''), warehouse_id: (warehouses[0]?.WAREHOUSE_ID || ''), stock_qty: '', reorder_level: '' }); }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-xs text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> Add Inventory
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-200 dark:border-slate-800 transition-colors">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            {editing ? 'Edit Inventory Record' : 'New Inventory Record'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Inventory ID</label>
                <input required type="number" disabled={!!editing} value={formData.inventory_id} onChange={e => setFormData({...formData, inventory_id: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Product</label>
                <select required value={formData.product_id} onChange={e => setFormData({...formData, product_id: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.PRODUCT_ID} value={p.PRODUCT_ID}>{p.PRODUCT_NAME}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Warehouse</label>
                <select required value={formData.warehouse_id} onChange={e => setFormData({...formData, warehouse_id: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Warehouse</option>
                  {warehouses.map(w => <option key={w.WAREHOUSE_ID} value={w.WAREHOUSE_ID}>{w.WAREHOUSE_NAME}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Stock Quantity</label>
                <input required type="number" value={formData.stock_qty} onChange={e => setFormData({...formData, stock_qty: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Reorder Level</label>
                <input required type="number" value={formData.reorder_level} onChange={e => setFormData({...formData, reorder_level: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Warehouse</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock Qty</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reorder Lvl</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800 text-sm">
            {items.map(r => {
              let statusText = 'Healthy';
              let badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300/40';
              if (r.STOCK_QTY === 0) {
                statusText = 'Critical';
                badgeColor = 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400 border border-red-300/40';
              } else if (r.STOCK_QTY <= r.REORDER_LEVEL) {
                statusText = 'Low Stock';
                badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300/40';
              }
             
              return (
                <tr key={r.INVENTORY_ID} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100 font-mono font-medium">{r.INVENTORY_ID}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100 font-medium">{r.PRODUCT_NAME}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{r.WAREHOUSE_NAME}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100 font-semibold">{r.STOCK_QTY}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{r.REORDER_LEVEL}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeColor}`}>{statusText}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                    <button onClick={() => { setEditing(r); setFormData({ inventory_id: r.INVENTORY_ID, product_id: r.PRODUCT_ID, warehouse_id: r.WAREHOUSE_ID, stock_qty: r.STOCK_QTY, reorder_level: r.REORDER_LEVEL }); setShowForm(true); }} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3 p-1 rounded"><Pencil className="w-4 h-4 inline" /></button>
                    <button onClick={() => handleDelete(r.INVENTORY_ID)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"><Trash2 className="w-4 h-4 inline" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

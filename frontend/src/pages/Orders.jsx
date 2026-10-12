import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import { Pencil, Trash2, Plus } from 'lucide-react';

export default function Orders() {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [formData, setFormData] = useState({ order_id: '', order_date: '', supplier_id: '', restaurant_id: '', order_status: 'Pending' });
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchItems(); fetchSuppliers(); fetchRestaurants(); }, []);

  const fetchItems = async () => { try { const res = await api.get('/orders'); setItems(res.data); } catch (err) { toast.error('Error fetching orders'); } };
  const fetchSuppliers = async () => { try { const res = await api.get('/suppliers'); setSuppliers(res.data); } catch (err) {} };
  const fetchRestaurants = async () => { try { const res = await api.get('/restaurants'); setRestaurants(res.data); } catch (err) {} };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/orders/${editing.ORDER_ID}`, formData);
      else await api.post('/orders', formData);
      toast.success(editing ? 'Order updated' : 'Order created');
      setShowForm(false);
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.error || 'Error saving order'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this purchase order?')) {
      try { await api.delete(`/orders/${id}`); fetchItems(); toast.success('Deleted'); } catch (err) { toast.error('Error deleting order'); }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Purchase Orders</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage orders placed with suppliers by restaurants</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setFormData({ order_id: '', order_date: new Date().toISOString().substring(0, 10), supplier_id: (suppliers[0]?.SUPPLIER_ID || ''), restaurant_id: (restaurants[0]?.RESTAURANT_ID || ''), order_status: 'Pending' }); }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-xs text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> Add Order
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-200 dark:border-slate-800 transition-colors">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            {editing ? 'Edit Purchase Order' : 'New Purchase Order'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Order ID</label>
                <input required type="number" disabled={!!editing} value={formData.order_id} onChange={e => setFormData({...formData, order_id: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Order Date</label>
                <input required type="date" value={formData.order_date} onChange={e => setFormData({...formData, order_date: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Supplier</label>
                <select required value={formData.supplier_id} onChange={e => setFormData({...formData, supplier_id: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s.SUPPLIER_ID} value={s.SUPPLIER_ID}>{s.SUPPLIER_NAME}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Restaurant</label>
                <select required value={formData.restaurant_id} onChange={e => setFormData({...formData, restaurant_id: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Restaurant</option>
                  {restaurants.map(r => <option key={r.RESTAURANT_ID} value={r.RESTAURANT_ID}>{r.RESTAURANT_NAME}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Order Status</label>
                <select required value={formData.order_status} onChange={e => setFormData({...formData, order_status: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Delivered">Delivered</option>
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
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Supplier</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Restaurant</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800 text-sm">
            {items.map(r => (
              <tr key={r.ORDER_ID} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition">
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100 font-mono font-medium">{r.ORDER_ID}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{new Date(r.ORDER_DATE).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{r.SUPPLIER_NAME}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{r.RESTAURANT_NAME}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    r.ORDER_STATUS === 'Pending' 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300/40' 
                      : r.ORDER_STATUS === 'Processing' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-300/40' 
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300/40'
                  }`}>
                    {r.ORDER_STATUS}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                  <button onClick={() => { setEditing(r); setFormData({ order_id: r.ORDER_ID, order_date: r.ORDER_DATE.substring(0, 10), supplier_id: r.SUPPLIER_ID, restaurant_id: r.RESTAURANT_ID, order_status: r.ORDER_STATUS }); setShowForm(true); }} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3 p-1 rounded"><Pencil className="w-4 h-4 inline" /></button>
                  <button onClick={() => handleDelete(r.ORDER_ID)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

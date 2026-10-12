import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import { Pencil, Trash2, Plus } from 'lucide-react';

export default function OrderItems() {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ order_item_id: '', order_id: '', product_id: '', quantity: '', total_cost: '' });
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchItems(); fetchOrders(); fetchProducts(); }, []);

  const fetchItems = async () => { try { const res = await api.get('/order-items'); setItems(res.data); } catch (err) { toast.error('Error fetching order items'); } };
  const fetchOrders = async () => { try { const res = await api.get('/orders'); setOrders(res.data); } catch (err) {} };
  const fetchProducts = async () => { try { const res = await api.get('/products'); setProducts(res.data); } catch (err) {} };

  const handleProductSelect = (e) => {
    const pid = e.target.value;
    const prod = products.find(p => p.PRODUCT_ID.toString() === pid);
    const qty = formData.quantity || 0;
    setFormData({ ...formData, product_id: pid, total_cost: prod ? prod.UNIT_COST * qty : 0 });
  };

  const handleQtyChange = (e) => {
    const qty = e.target.value;
    const prod = products.find(p => p.PRODUCT_ID.toString() === formData.product_id);
    setFormData({ ...formData, quantity: qty, total_cost: prod ? prod.UNIT_COST * qty : 0 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/order-items/${editing.ORDER_ITEM_ID}`, formData);
      else await api.post('/order-items', formData);
      toast.success(editing ? 'Order item updated' : 'Order item created');
      setShowForm(false);
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.error || 'Error saving order item'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this order item?')) {
      try { await api.delete(`/order-items/${id}`); fetchItems(); toast.success('Deleted'); } catch (err) { toast.error('Error deleting order item'); }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Items</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Detailed line items and total calculations for purchase orders</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setFormData({ order_item_id: '', order_id: (orders[0]?.ORDER_ID || ''), product_id: (products[0]?.PRODUCT_ID || ''), quantity: 1, total_cost: (products[0]?.UNIT_COST || 0) }); }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-xs text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> Add Order Item
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-200 dark:border-slate-800 transition-colors">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            {editing ? 'Edit Order Item' : 'New Order Item'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Item ID</label>
                <input required type="number" disabled={!!editing} value={formData.order_item_id} onChange={e => setFormData({...formData, order_item_id: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Order</label>
                <select required value={formData.order_id} onChange={e => setFormData({...formData, order_id: e.target.value})} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Order</option>
                  {orders.map(o => <option key={o.ORDER_ID} value={o.ORDER_ID}>Order #{o.ORDER_ID}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Product</label>
                <select required value={formData.product_id} onChange={handleProductSelect} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.PRODUCT_ID} value={p.PRODUCT_ID}>{p.PRODUCT_NAME} (${p.UNIT_COST})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Quantity</label>
                <input required type="number" min="1" value={formData.quantity} onChange={handleQtyChange} className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-1">Total Line Cost ($)</label>
                <input required type="number" readOnly value={formData.total_cost} className="w-full rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-800/60 px-3 py-2 text-sm text-gray-900 dark:text-white font-semibold cursor-not-allowed" />
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
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item ID</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Cost</th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800 text-sm">
            {items.map(r => (
              <tr key={r.ORDER_ITEM_ID} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition">
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100 font-mono font-medium">{r.ORDER_ITEM_ID}</td>
                <td className="px-6 py-4 whitespace-nowrap text-blue-600 dark:text-blue-400 font-medium">#{r.ORDER_ID}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100 font-medium">{r.PRODUCT_NAME}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{r.QUANTITY}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100 font-semibold">${Number(r.TOTAL_COST).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                  <button onClick={() => { setEditing(r); setFormData({ order_item_id: r.ORDER_ITEM_ID, order_id: r.ORDER_ID, product_id: r.PRODUCT_ID, quantity: r.QUANTITY, total_cost: r.TOTAL_COST }); setShowForm(true); }} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3 p-1 rounded"><Pencil className="w-4 h-4 inline" /></button>
                  <button onClick={() => handleDelete(r.ORDER_ITEM_ID)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

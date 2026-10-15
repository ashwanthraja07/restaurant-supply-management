import React, { useEffect, useState } from 'react';
import api from '../../api';
import { ClipboardList, Plus, Edit2, Trash2, Loader2, X, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminInventory() {
  const [inventory, setInventory]   = useState([]);
  const [products, setProducts]     = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState({ product_id: '', warehouse_id: '', stock_qty: '', reorder_level: '' });
  const [saving, setSaving]       = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, prodRes, whRes] = await Promise.all([
        api.get('/admin-portal/inventory'),
        api.get('/admin-portal/products'),
        api.get('/admin-portal/warehouses'),
      ]);
      setInventory(invRes.data);
      setProducts(prodRes.data);
      setWarehouses(whRes.data);
    } catch {
      toast.error('Failed to load inventory data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditing(item);
      setForm({
        product_id:    item.PRODUCT_ID,
        warehouse_id:  item.WAREHOUSE_ID,
        stock_qty:     item.STOCK_QTY,
        reorder_level: item.REORDER_LEVEL,
      });
    } else {
      setEditing(null);
      setForm({
        product_id:    products[0]?.PRODUCT_ID || '',
        warehouse_id:  warehouses[0]?.WAREHOUSE_ID || '',
        stock_qty:     0,
        reorder_level: 50,
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin-portal/inventory/${editing.INVENTORY_ID}`, {
          stock_qty: form.stock_qty,
          reorder_level: form.reorder_level,
        });
        toast.success('Inventory stock updated.');
      } else {
        await api.post('/admin-portal/inventory', form);
        toast.success('Inventory record added.');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save inventory.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete inventory entry for ${item.PRODUCT_NAME} at ${item.WAREHOUSE_NAME}?`)) return;
    try {
      await api.delete(`/admin-portal/inventory/${item.INVENTORY_ID}`);
      toast.success('Inventory entry deleted.');
      setInventory(prev => prev.filter(i => i.INVENTORY_ID !== item.INVENTORY_ID));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot delete inventory entry.');
    }
  };

  const filtered = inventory.filter(i => {
    const isLow = i.STOCK_QTY <= i.REORDER_LEVEL;
    if (onlyLowStock && !isLow) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      i.PRODUCT_NAME?.toLowerCase().includes(q) ||
      i.WAREHOUSE_NAME?.toLowerCase().includes(q) ||
      i.SUPPLIER_NAME?.toLowerCase().includes(q)
    );
  });

  const lowStockTotal = inventory.filter(i => i.STOCK_QTY <= i.REORDER_LEVEL).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">System Inventory Management</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Monitor real-time product stock quantities across warehouses and configure reorder warning levels.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Inventory Record
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by product, warehouse, supplier..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <button
          onClick={() => setOnlyLowStock(v => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
            onlyLowStock
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-red-400'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Low Stock Only ({lowStockTotal})</span>
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-gray-200/80 dark:border-slate-800">
          <ClipboardList className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No inventory records found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-gray-200/80 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Warehouse</th>
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-right">Stock Qty</th>
                  <th className="px-4 py-3 text-right">Reorder Level</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filtered.map(i => {
                  const isLow = i.STOCK_QTY <= i.REORDER_LEVEL;
                  return (
                    <tr key={i.INVENTORY_ID} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-gray-500">#{i.INVENTORY_ID}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{i.PRODUCT_NAME}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {i.WAREHOUSE_NAME} ({i.WAREHOUSE_CITY})
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{i.SUPPLIER_NAME}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 dark:text-white">
                        {i.STOCK_QTY}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-500">
                        {i.REORDER_LEVEL}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          isLow
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40'
                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                        }`}>
                          {isLow ? <AlertTriangle className="w-3 h-3 text-red-500" /> : <CheckCircle className="w-3 h-3 text-emerald-500" />}
                          {isLow ? 'LOW STOCK' : 'IN STOCK'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenModal(i)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-violet-600 dark:hover:text-violet-400"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(i)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {editing ? 'Update Inventory Stock' : 'Add Inventory Record'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Product *
                </label>
                <select
                  disabled={!!editing}
                  required
                  value={form.product_id}
                  onChange={e => setForm({ ...form, product_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white disabled:opacity-60"
                >
                  {products.map(p => (
                    <option key={p.PRODUCT_ID} value={p.PRODUCT_ID}>
                      {p.PRODUCT_NAME} ({p.SUPPLIER_NAME})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Warehouse *
                </label>
                <select
                  disabled={!!editing}
                  required
                  value={form.warehouse_id}
                  onChange={e => setForm({ ...form, warehouse_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white disabled:opacity-60"
                >
                  {warehouses.map(w => (
                    <option key={w.WAREHOUSE_ID} value={w.WAREHOUSE_ID}>
                      {w.WAREHOUSE_NAME} ({w.CITY})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.stock_qty}
                    onChange={e => setForm({ ...form, stock_qty: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.reorder_level}
                    onChange={e => setForm({ ...form, reorder_level: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-mono"
                  />
                </div>
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
                  {editing ? 'Update Stock' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

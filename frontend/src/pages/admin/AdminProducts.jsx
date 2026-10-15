import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Package, Search, Plus, Edit2, Trash2, Loader2, X } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminProducts() {
  const [products, setProducts]   = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('All');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState({ product_name: '', category: 'General', unit_cost: '', supplier_id: '' });
  const [saving, setSaving]       = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, supRes] = await Promise.all([
        api.get('/admin-portal/products'),
        api.get('/admin-portal/suppliers')
      ]);
      setProducts(prodRes.data);
      setSuppliers(supRes.data);
    } catch {
      toast.error('Failed to load products or suppliers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (prod = null) => {
    if (prod) {
      setEditing(prod);
      setForm({
        product_name: prod.PRODUCT_NAME || '',
        category:     prod.CATEGORY || 'General',
        unit_cost:    prod.UNIT_COST || '',
        supplier_id:  prod.SUPPLIER_ID || '',
      });
    } else {
      setEditing(null);
      setForm({
        product_name: '',
        category:     'General',
        unit_cost:    '',
        supplier_id:  suppliers[0]?.SUPPLIER_ID || '',
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.product_name.trim() || !form.supplier_id || form.unit_cost === '') {
      toast.error('All fields marked with * are required.');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin-portal/products/${editing.PRODUCT_ID}`, form);
        toast.success('Product updated successfully.');
      } else {
        await api.post('/admin-portal/products', form);
        toast.success('Product created successfully.');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (prod) => {
    if (!window.confirm(`Are you sure you want to delete "${prod.PRODUCT_NAME}"?`)) return;
    try {
      await api.delete(`/admin-portal/products/${prod.PRODUCT_ID}`);
      toast.success('Product deleted.');
      setProducts(prev => prev.filter(p => p.PRODUCT_ID !== prod.PRODUCT_ID));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot delete product.');
    }
  };

  const categories = ['All', ...Array.from(new Set(products.map(p => p.CATEGORY).filter(Boolean)))];

  const filtered = products.filter(p => {
    const matchCat = catFilter === 'All' || p.CATEGORY === catFilter;
    const matchQ = !search.trim() ||
      p.PRODUCT_NAME.toLowerCase().includes(search.toLowerCase()) ||
      p.SUPPLIER_NAME?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Product Catalog Management</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage system products, supplier associations, unit costs, and warehouse stock levels.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by product or supplier..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                catFilter === c
                  ? 'bg-violet-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-gray-200/80 dark:border-slate-800">
          <Package className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No products found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-gray-200/80 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Product Name</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-right">Unit Cost</th>
                  <th className="px-4 py-3 text-right">Aggregate Stock</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filtered.map(p => (
                  <tr key={p.PRODUCT_ID} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-gray-500">#{p.PRODUCT_ID}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{p.PRODUCT_NAME}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300">
                        {p.CATEGORY}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{p.SUPPLIER_NAME}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900 dark:text-white">
                      ₹{Number(p.UNIT_COST).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        Number(p.TOTAL_STOCK) === 0
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {p.TOTAL_STOCK} units
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(p)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-violet-600 dark:hover:text-violet-400"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
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
                {editing ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.product_name}
                  onChange={e => setForm({ ...form, product_name: e.target.value })}
                  placeholder="e.g. Basmati Rice 25kg"
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Supplier *
                </label>
                <select
                  required
                  value={form.supplier_id}
                  onChange={e => setForm({ ...form, supplier_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => (
                    <option key={s.SUPPLIER_ID} value={s.SUPPLIER_ID}>
                      {s.SUPPLIER_NAME}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Grains, Dairy, Meat"
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Unit Cost (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.unit_cost}
                  onChange={e => setForm({ ...form, unit_cost: e.target.value })}
                  placeholder="e.g. 1450.00"
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-mono"
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
                  {editing ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

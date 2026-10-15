import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Package, Search, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function SupplierProducts() {
  const [products, setProducts]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.get('/supplier-portal/products')
      .then(r => { setProducts(r.data); setFiltered(r.data); })
      .catch(() => toast.error('Failed to load products.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(products.filter(p =>
      p.PRODUCT_NAME?.toLowerCase().includes(q) || p.CATEGORY?.toLowerCase().includes(q)
    ));
  }, [search, products]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Products</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{products.length} products in your catalog</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-gray-200/80 dark:border-slate-800">
          <Package className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No products found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-gray-200/80 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3 text-right">Unit Cost</th>
                  <th className="px-6 py-3 text-right">Total Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filtered.map(p => (
                  <tr key={p.PRODUCT_ID} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-gray-500 dark:text-gray-400 text-xs">{p.PRODUCT_ID}</td>
                    <td className="px-6 py-3.5 font-medium text-gray-900 dark:text-gray-100">{p.PRODUCT_NAME}</td>
                    <td className="px-6 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {p.CATEGORY || 'Uncategorised'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-gray-900 dark:text-gray-100">
                      ₹{Number(p.UNIT_COST).toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className={`font-semibold ${p.TOTAL_STOCK === 0 ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
                        {p.TOTAL_STOCK}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Package, Search, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function RestaurantProducts() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/restaurant-portal/products')
      .then(r => { setProducts(r.data); setFiltered(r.data); })
      .catch(() => toast.error('Failed to load products.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(products.filter(p =>
      p.PRODUCT_NAME?.toLowerCase().includes(q) ||
      p.CATEGORY?.toLowerCase().includes(q) ||
      p.SUPPLIER_NAME?.toLowerCase().includes(q)
    ));
  }, [search, products]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Product Catalog</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{products.length} products available from suppliers</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product or supplier..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-gray-200/80 dark:border-slate-800">
          <Package className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.PRODUCT_ID} className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                  {p.CATEGORY || 'Uncategorised'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{p.PRODUCT_NAME}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">by {p.SUPPLIER_NAME || 'Unknown Supplier'}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900 dark:text-white">₹{Number(p.UNIT_COST).toFixed(2)}</span>
                <span className={`text-xs font-semibold ${p.AVAILABLE_STOCK === 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {p.AVAILABLE_STOCK === 0 ? 'Out of Stock' : `${p.AVAILABLE_STOCK} in stock`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

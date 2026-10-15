import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Warehouse, AlertTriangle, Loader2, Search } from 'lucide-react';
import { toast } from 'react-toastify';

export default function SupplierInventory() {
  const [inventory, setInventory] = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.get('/supplier-portal/inventory')
      .then(r => { setInventory(r.data); setFiltered(r.data); })
      .catch(() => toast.error('Failed to load inventory.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(inventory.filter(i =>
      i.PRODUCT_NAME?.toLowerCase().includes(q) || i.WAREHOUSE_NAME?.toLowerCase().includes(q)
    ));
  }, [search, inventory]);

  const lowStockCount = inventory.filter(i => i.STOCK_QTY <= i.REORDER_LEVEL).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Inventory</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{inventory.length} records across warehouses</p>
        </div>
        {lowStockCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4" />
            {lowStockCount} low stock item{lowStockCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search product or warehouse..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-gray-200/80 dark:border-slate-800">
          <Warehouse className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No inventory records found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-gray-200/80 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Warehouse</th>
                  <th className="px-5 py-3 text-right">Stock</th>
                  <th className="px-5 py-3 text-right">Reorder Level</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filtered.map(i => {
                  const isLow = i.STOCK_QTY <= i.REORDER_LEVEL;
                  return (
                    <tr key={i.INVENTORY_ID} className={`hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors ${isLow ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}>
                      <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-gray-100">{i.PRODUCT_NAME}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {i.CATEGORY || 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">{i.WAREHOUSE_NAME}</td>
                      <td className={`px-5 py-3.5 text-right font-semibold ${isLow ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {i.STOCK_QTY}
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-500 dark:text-gray-400">{i.REORDER_LEVEL}</td>
                      <td className="px-5 py-3.5">
                        {isLow ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">✓ OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

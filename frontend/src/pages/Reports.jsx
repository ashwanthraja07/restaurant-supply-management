import React, { useState, useEffect } from 'react';
import api from '../api';
import { Download } from 'lucide-react';

export default function Reports() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/reports').then(res => setData(res.data));
  }, []);

  const exportCSV = (filename, rows) => {
    if (!rows || !rows.length) return;
    const keys = Object.keys(rows[0]);
    const csvContent = [
      keys.join(','),
      ...rows.map(row => keys.map(k => `"${row[k]}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">SQL Reports & Analysis</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Live aggregate queries and analytics computed by Oracle SQL</p>
        </div>
      </div>
      
      {/* Product Cost Summary Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-200 dark:border-slate-800 transition-colors">
        <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Product Cost Summary (AGGREGATE)</h3>
        {data.productCostSummary?.[0] && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl text-center border border-gray-100 dark:border-slate-800">
              <div className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">Total Products</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data.productCostSummary[0].TOTAL_PRODUCTS}</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl text-center border border-gray-100 dark:border-slate-800">
              <div className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">Avg Cost</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">${Math.round(data.productCostSummary[0].AVERAGE_COST)}</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl text-center border border-gray-100 dark:border-slate-800">
              <div className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">Min Cost</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">${data.productCostSummary[0].MIN_COST}</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl text-center border border-gray-100 dark:border-slate-800">
              <div className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">Max Cost</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">${data.productCostSummary[0].MAX_COST}</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Product Counts */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-200 dark:border-slate-800 transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-semibold text-gray-900 dark:text-white">Supplier Product Counts (GROUP BY)</h3>
            <button onClick={() => exportCSV('supplier_product_counts', data.supplierProductCounts)} className="text-xs font-medium flex items-center px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg transition border border-gray-200 dark:border-slate-700">
              <Download className="w-3.5 h-3.5 mr-1"/> Export CSV
            </button>
          </div>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800 text-sm">
            <thead className="bg-gray-50/75 dark:bg-slate-950/50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Supplier</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Products</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
              {data.supplierProductCounts?.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{s.SUPPLIER_NAME}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 font-semibold">{s.TOTAL_PRODUCTS}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Restaurant Order Counts */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-200 dark:border-slate-800 transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-semibold text-gray-900 dark:text-white">Restaurant Order Counts (GROUP BY)</h3>
            <button onClick={() => exportCSV('restaurant_order_counts', data.restaurantOrderCounts)} className="text-xs font-medium flex items-center px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg transition border border-gray-200 dark:border-slate-700">
              <Download className="w-3.5 h-3.5 mr-1"/> Export CSV
            </button>
          </div>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800 text-sm">
            <thead className="bg-gray-50/75 dark:bg-slate-950/50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Restaurant</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
              {data.restaurantOrderCounts?.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{r.RESTAURANT_NAME}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 font-semibold">{r.TOTAL_ORDERS}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Products Above Average Cost */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-200 dark:border-slate-800 transition-colors">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white">Products Above Average Cost</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Using SQL Subquery: WHERE unit_cost &gt; (SELECT AVG(unit_cost) FROM product)</p>
          </div>
          <button onClick={() => exportCSV('products_above_average_cost', data.productsAboveAverageCost)} className="text-xs font-medium flex items-center px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg transition border border-gray-200 dark:border-slate-700">
            <Download className="w-3.5 h-3.5 mr-1"/> Export CSV
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800 text-sm">
          <thead className="bg-gray-50/75 dark:bg-slate-950/50">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Product Name</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Unit Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
            {data.productsAboveAverageCost?.map((p, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition">
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{p.PRODUCT_NAME}</td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 font-semibold">${Number(p.UNIT_COST).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

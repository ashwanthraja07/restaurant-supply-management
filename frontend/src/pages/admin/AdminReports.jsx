import React, { useEffect, useState } from 'react';
import api from '../../api';
import { BarChart3, TrendingUp, Layers, Award, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { toast } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';

export default function AdminReports() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useTheme();

  useEffect(() => {
    api.get('/admin-portal/reports')
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load analytical reports.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  const monthlySpending = (data?.monthlySpending || []).map(m => ({
    month: m.MONTH_LABEL,
    orders: Number(m.TOTAL_ORDERS),
    spend: Number(m.TOTAL_SPEND),
  }));

  const categoryStock = (data?.categoryStock || []).map(c => ({
    category: c.CATEGORY,
    products: Number(c.PRODUCT_COUNT),
    quantity: Number(c.TOTAL_QTY),
  }));

  const supplierPerformance = (data?.supplierPerformance || []).map(s => ({
    name: s.SUPPLIER_NAME,
    orders: Number(s.ORDERS_FULFILLED),
    volume: Number(s.VOLUME_VALUE),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reports & System Analytics</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Live business intelligence aggregated directly from relational Oracle Database tables.
        </p>
      </div>

      {/* Chart 1: Monthly Procurement Trend */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Monthly Purchase Order Spend (₹)</h3>
          </div>
          <span className="text-[11px] text-gray-400 font-mono">Aggregated by Order Date</span>
        </div>

        {monthlySpending.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-gray-400 italic">
            No historical order spending data found in database.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySpending}>
                <defs>
                  <linearGradient id="spendColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#64748b' }} />
                <Tooltip
                  formatter={(val) => `₹${Number(val).toLocaleString()}`}
                  contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#ffffff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="spend" stroke="#8b5cf6" fillOpacity={1} fill="url(#spendColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 2: Category Inventory Units */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Warehouse Stock by Product Category</h3>
          </div>

          {categoryStock.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-gray-400 italic">
              No inventory category records found.
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStock}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="category" tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} />
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#ffffff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="quantity" fill="#10b981" radius={[4, 4, 0, 0]} name="Units in Stock" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 3: Top Suppliers by Fulfillment Value */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top Suppliers by Order Volume (₹)</h3>
          </div>

          {supplierPerformance.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-gray-400 italic">
              No supplier order fulfillment data available.
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplierPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} />
                  <Tooltip
                    formatter={(val) => `₹${Number(val).toLocaleString()}`}
                    contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#ffffff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="volume" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Fulfilled Value (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

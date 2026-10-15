import React, { useEffect, useState } from 'react';
import api from '../../api';
import { ShoppingCart, CheckCircle, Clock, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

function StatCard({ title, value, icon, gradient, sub }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-xs border border-gray-200/80 dark:border-slate-800 flex items-center gap-4 transition-colors hover:shadow-md">
      <div className={`p-3.5 rounded-xl ${gradient} text-white flex-shrink-0 shadow-sm`}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Pending:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    Completed: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    Cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    Shipped:   'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
      {status}
    </span>
  );
}

export default function RestaurantDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useTheme();

  useEffect(() => {
    api.get('/restaurant-portal/dashboard')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  );

  if (!data) return <div className="text-gray-400">No data available.</div>;

  const tooltipStyle = {
    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
    borderColor: darkMode ? '#334155' : '#e2e8f0',
    color: darkMode ? '#f8fafc' : '#0f172a',
    borderRadius: '0.5rem',
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders"     value={data.totalOrders}     gradient="bg-emerald-600" icon={<ShoppingCart className="w-5 h-5" />} />
        <StatCard title="Pending Orders"   value={data.pendingOrders}   gradient="bg-amber-600"   icon={<Clock className="w-5 h-5" />} />
        <StatCard title="Completed Orders" value={data.completedOrders} gradient="bg-teal-600"    icon={<CheckCircle className="w-5 h-5" />} />
        <StatCard title="Total Spend"      value={`₹${Number(data.totalSpend || 0).toFixed(0)}`} gradient="bg-purple-600" icon={<DollarSign className="w-5 h-5" />} sub="across all orders" />
      </div>

      {/* Low Stock Alert Banner */}
      {data.lowStockAlerts?.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold mb-3">
            <AlertTriangle className="w-5 h-5" />
            {data.lowStockAlerts.length} Low Stock Alert{data.lowStockAlerts.length > 1 ? 's' : ''}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.lowStockAlerts.slice(0, 6).map(a => (
              <div key={a.INVENTORY_ID} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-red-100 dark:border-red-900/30 text-xs">
                <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{a.PRODUCT_NAME}</span>
                <span className="font-bold text-red-500 ml-2 flex-shrink-0">{a.STOCK_QTY} / {a.REORDER_LEVEL}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.ordersByStatus?.length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-200/80 dark:border-slate-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">My Orders by Status</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.ordersByStatus} dataKey="CNT" nameKey="ORDER_STATUS" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name}: ${(percent*100).toFixed(0)}%`}>
                    {data.ordersByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ color: darkMode ? '#cbd5e1' : '#475569', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Orders mini-chart placeholder or table */}
        {data.recentOrders?.length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
              <a href="/restaurant/orders" className="text-xs text-emerald-500 hover:text-emerald-400 font-medium">View all →</a>
            </div>
            <div className="space-y-2.5">
              {data.recentOrders.map(o => (
                <div key={o.ORDER_ID} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-slate-800 last:border-0">
                  <div>
                    <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">#{o.ORDER_ID}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{o.SUPPLIER_NAME} • {o.ORDER_DATE ? new Date(o.ORDER_DATE).toLocaleDateString() : ''}</p>
                  </div>
                  <StatusBadge status={o.ORDER_STATUS} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

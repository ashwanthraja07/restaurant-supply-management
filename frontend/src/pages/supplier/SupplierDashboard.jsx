import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Package, ShoppingCart, CheckCircle, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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

export default function SupplierDashboardPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useTheme();

  useEffect(() => {
    api.get('/supplier-portal/dashboard')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  if (!data) return <div className="text-gray-400">No data available.</div>;

  const chartAxisColor = darkMode ? '#94a3b8' : '#64748b';
  const chartGridColor = darkMode ? '#334155' : '#e2e8f0';
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
        <StatCard title="My Products"      value={data.totalProducts}   gradient="bg-blue-600"    icon={<Package className="w-5 h-5" />} />
        <StatCard title="Total Orders"     value={data.totalOrders}     gradient="bg-indigo-600"  icon={<ShoppingCart className="w-5 h-5" />} />
        <StatCard title="Pending Orders"   value={data.pendingOrders}   gradient="bg-amber-600"   icon={<Clock className="w-5 h-5" />} />
        <StatCard title="Completed Orders" value={data.completedOrders} gradient="bg-emerald-600" icon={<CheckCircle className="w-5 h-5" />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status Pie */}
        {data.ordersByStatus?.length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-200/80 dark:border-slate-800 transition-colors">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Orders by Status</h3>
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

        {/* Top Products Bar */}
        {data.topProducts?.length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-200/80 dark:border-slate-800 transition-colors">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Products by Stock Level</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topProducts.slice(0, 8)} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                  <XAxis dataKey="PRODUCT_NAME" stroke={chartAxisColor} tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis stroke={chartAxisColor} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="TOTAL_STOCK" name="Stock" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      {data.recentOrders?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-200/80 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
            <a href="/supplier/orders" className="text-xs text-blue-500 hover:text-blue-400 font-medium">View all →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800">
                  <th className="pb-3 pr-4">Order ID</th>
                  <th className="pb-3 pr-4">Restaurant</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {data.recentOrders.map(o => (
                  <tr key={o.ORDER_ID} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 pr-4 font-mono text-gray-900 dark:text-gray-100 font-medium">#{o.ORDER_ID}</td>
                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{o.RESTAURANT_NAME}</td>
                    <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{o.ORDER_DATE ? new Date(o.ORDER_DATE).toLocaleDateString() : '—'}</td>
                    <td className="py-3"><StatusBadge status={o.ORDER_STATUS} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!data.recentOrders?.length && !data.topProducts?.length && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-gray-200/80 dark:border-slate-800">
          <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No orders or products yet.</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Orders placed by restaurants will appear here.</p>
        </div>
      )}
    </div>
  );
}

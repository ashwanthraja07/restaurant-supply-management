import React, { useEffect, useState } from 'react';
import api from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, ShoppingCart, Store, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTheme } from '../context/ThemeContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useTheme();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) return <div className="text-gray-500 dark:text-gray-400">No data available</div>;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Suppliers" value={data.totalSuppliers} icon={<Users className="w-6 h-6" />} color="bg-blue-600" />
        <StatCard title="Total Restaurants" value={data.totalRestaurants} icon={<Store className="w-6 h-6" />} color="bg-emerald-600" />
        <StatCard title="Total Products" value={data.totalProducts} icon={<Package className="w-6 h-6" />} color="bg-purple-600" />
        <StatCard title="Pending Orders" value={data.pendingOrders} icon={<ShoppingCart className="w-6 h-6" />} color="bg-amber-600" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-200/80 dark:border-slate-800 transition-colors">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stock by Warehouse</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.stockByWarehouse}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="WAREHOUSE_NAME" stroke={darkMode ? '#94a3b8' : '#64748b'} />
                <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1e293b' : '#ffffff', 
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    color: darkMode ? '#f8fafc' : '#0f172a',
                    borderRadius: '0.5rem'
                  }} 
                />
                <Bar dataKey="TOTAL_STOCK" name="Units" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-gray-200/80 dark:border-slate-800 transition-colors">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Orders by Status</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.ordersByStatus}
                  dataKey="COUNT"
                  nameKey="ORDER_STATUS"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.ordersByStatus?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1e293b' : '#ffffff', 
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    color: darkMode ? '#f8fafc' : '#0f172a',
                    borderRadius: '0.5rem'
                  }} 
                />
                <Legend wrapperStyle={{ color: darkMode ? '#cbd5e1' : '#475569' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {data.lowStockAlerts && data.lowStockAlerts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xs border border-red-200 dark:border-red-900/40 transition-colors">
          <div className="flex items-center text-red-600 dark:text-red-400 mb-4">
            <AlertTriangle className="mr-2 w-5 h-5" />
            <h3 className="text-lg font-semibold">Low Stock Inventory Alerts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">Product</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">Warehouse</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">Stock</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">Reorder Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800 text-sm">
                {data.lowStockAlerts.map(alert => (
                  <tr key={alert.INVENTORY_ID} className="hover:bg-red-50/50 dark:hover:bg-red-950/20">
                    <td className="py-3 text-gray-900 dark:text-gray-100 font-medium">{alert.PRODUCT_NAME}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{alert.WAREHOUSE_NAME}</td>
                    <td className="py-3 font-semibold text-red-600 dark:text-red-400">{alert.STOCK_QTY}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{alert.REORDER_LEVEL}</td>
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

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-xs border border-gray-200/80 dark:border-slate-800 flex items-center transition-colors">
      <div className={`p-3.5 rounded-xl ${color} text-white mr-4 shadow-sm flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

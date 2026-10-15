import React, { useEffect, useState } from 'react';
import api from '../../api';
import {
  Users, Store, Package, Warehouse, ShoppingCart,
  Clock, CheckCircle2, AlertTriangle, Loader2, ArrowUpRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { toast } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  Pending:    '#f59e0b',
  Processing: '#3b82f6',
  Shipped:    '#8b5cf6',
  Completed:  '#10b981',
  Cancelled:  '#ef4444',
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useTheme();

  useEffect(() => {
    api.get('/admin-portal/dashboard')
      .then(res => setData(res.data))
      .catch(err => {
        console.error(err);
        toast.error('Failed to load administrative analytics.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const ordersByStatus = (data?.ordersByStatus || []).map(item => ({
    name: item.ORDER_STATUS,
    value: Number(item.CNT),
  }));
  const warehouseStock = (data?.warehouseStock || []).map(item => ({
    name: item.WAREHOUSE_NAME,
    stock: Number(item.TOTAL_STOCK),
  }));

  const statCards = [
    { title: 'Total Suppliers',    value: stats.totalSuppliers,   icon: Users,          color: 'text-blue-500',   bg: 'bg-blue-500/10',   href: '/admin/suppliers' },
    { title: 'Total Restaurants',  value: stats.totalRestaurants, icon: Store,          color: 'text-emerald-500',bg: 'bg-emerald-500/10', href: '/admin/restaurants' },
    { title: 'Total Products',     value: stats.totalProducts,    icon: Package,        color: 'text-amber-500',  bg: 'bg-amber-500/10',  href: '/admin/products' },
    { title: 'Total Warehouses',   value: stats.totalWarehouses,  icon: Warehouse,      color: 'text-purple-500', bg: 'bg-purple-500/10', href: '/admin/warehouses' },
    { title: 'Purchase Orders',    value: stats.totalOrders,      icon: ShoppingCart,   color: 'text-indigo-500', bg: 'bg-indigo-500/10', href: '/admin/orders' },
    { title: 'Pending Orders',     value: stats.pendingOrders,    icon: Clock,          color: 'text-yellow-500', bg: 'bg-yellow-500/10', href: '/admin/orders?status=Pending' },
    { title: 'Completed Orders',   value: stats.completedOrders,  icon: CheckCircle2,   color: 'text-green-500',  bg: 'bg-green-500/10',  href: '/admin/orders?status=Completed' },
    { title: 'Low Stock Alerts',   value: stats.lowStockCount,    icon: AlertTriangle,  color: stats.lowStockCount > 0 ? 'text-red-500' : 'text-slate-400', bg: stats.lowStockCount > 0 ? 'bg-red-500/10' : 'bg-slate-500/10', href: '/admin/inventory' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-violet-900/40 via-purple-900/20 to-slate-900 border border-violet-800/30 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold text-white">System-Wide Operations Dashboard</h2>
          <p className="text-xs text-slate-300 mt-1">
            Real-time Oracle Database telemetry across suppliers, restaurants, warehouses, and orders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Total System Inventory</span>
            <span className="text-lg font-bold text-violet-400 font-mono">{Number(stats.totalStock).toLocaleString()} units</span>
          </div>
        </div>
      </div>

      {/* 8 Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              to={card.href}
              className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200/80 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-600 transition-all shadow-xs group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{card.title}</span>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{card.value}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-violet-500 transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Orders by Status</h3>
          {ordersByStatus.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-gray-400">No orders recorded in database.</div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#ffffff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Warehouse Stock */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Warehouse Stock Levels</h3>
          {warehouseStock.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-gray-400">No warehouse stock data available.</div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={warehouseStock}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} />
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#ffffff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="stock" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Purchase Orders</h3>
          <Link to="/admin/orders" className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium">
            View All Orders →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-3 text-left">Order ID</th>
                <th className="px-4 py-3 text-left">Restaurant</th>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {(data?.recentOrders || []).map(order => (
                <tr key={order.ORDER_ID} className="hover:bg-gray-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white">#{order.ORDER_ID}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">{order.RESTAURANT_NAME}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{order.SUPPLIER_NAME}</td>
                  <td className="px-4 py-3 text-gray-500">{order.ORDER_DATE ? new Date(order.ORDER_DATE).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold font-mono text-gray-900 dark:text-white">
                    ₹{Number(order.ORDER_TOTAL).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700">
                      {order.ORDER_STATUS}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

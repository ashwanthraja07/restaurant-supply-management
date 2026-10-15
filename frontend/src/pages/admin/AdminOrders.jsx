import React, { useEffect, useState } from 'react';
import api from '../../api';
import { ShoppingCart, Search, Loader2, ChevronDown, ChevronUp, Filter, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';

const STATUS_OPTIONS = ['All', 'Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'];

function StatusBadge({ status }) {
  const map = {
    Pending:    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
    Processing: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
    Shipped:    'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40',
    Completed:  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
    Cancelled:  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/40',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${map[status] || 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
      {status}
    </span>
  );
}

export default function AdminOrders() {
  const [orders, setOrders]         = useState([]);
  const [suppliers, setSuppliers]   = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]       = useState(true);

  // Filters
  const [search, setSearch]                 = useState('');
  const [statusFilter, setStatusFilter]     = useState('All');
  const [supplierFilter, setSupplierFilter] = useState('All');
  const [restaurantFilter, setRestaurantFilter] = useState('All');

  // Expansion
  const [expanded, setExpanded]         = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [updatingId, setUpdatingId]     = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'All') params.append('status', statusFilter);
    if (supplierFilter !== 'All') params.append('supplier_id', supplierFilter);
    if (restaurantFilter !== 'All') params.append('restaurant_id', restaurantFilter);
    if (search.trim()) params.append('q', search.trim());

    api.get(`/admin-portal/orders?${params.toString()}`)
      .then(res => setOrders(res.data))
      .catch(() => toast.error('Failed to load purchase orders.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Initial fetch metadata
    Promise.all([
      api.get('/admin-portal/suppliers'),
      api.get('/admin-portal/restaurants')
    ]).then(([sRes, rRes]) => {
      setSuppliers(sRes.data);
      setRestaurants(rRes.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchOrders, 200);
    return () => clearTimeout(timer);
  }, [statusFilter, supplierFilter, restaurantFilter, search]);

  const toggleExpand = async (orderId) => {
    if (expanded === orderId) { setExpanded(null); return; }
    setExpanded(orderId);
    if (!orderDetails[orderId]) {
      try {
        const res = await api.get(`/admin-portal/orders/${orderId}`);
        setOrderDetails(prev => ({ ...prev, [orderId]: res.data }));
      } catch {
        toast.error('Failed to load order line items.');
      }
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/admin-portal/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order #${orderId} status updated to ${newStatus}.`);
      setOrders(prev => prev.map(o => o.ORDER_ID === orderId ? { ...o, ORDER_STATUS: newStatus } : o));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Purchase Order Management</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Global procurement audit across all restaurants and suppliers with status transition authority.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by ID or names..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Supplier Filter */}
          <div>
            <select
              value={supplierFilter}
              onChange={e => setSupplierFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white"
            >
              <option value="All">All Suppliers</option>
              {suppliers.map(s => (
                <option key={s.SUPPLIER_ID} value={s.SUPPLIER_ID}>{s.SUPPLIER_NAME}</option>
              ))}
            </select>
          </div>

          {/* Restaurant Filter */}
          <div>
            <select
              value={restaurantFilter}
              onChange={e => setRestaurantFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white"
            >
              <option value="All">All Restaurants</option>
              {restaurants.map(r => (
                <option key={r.RESTAURANT_ID} value={r.RESTAURANT_ID}>{r.RESTAURANT_NAME}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white"
            >
              {STATUS_OPTIONS.map(st => (
                <option key={st} value={st}>{st === 'All' ? 'All Statuses' : st}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-gray-200/80 dark:border-slate-800">
          <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No purchase orders matching filters.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-gray-200/80 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3 w-8"></th>
                  <th className="px-4 py-3 text-left">Order ID</th>
                  <th className="px-4 py-3 text-left">Restaurant</th>
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-left">Date Placed</th>
                  <th className="px-4 py-3 text-right">Items</th>
                  <th className="px-4 py-3 text-right">Total Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {orders.map(o => (
                  <React.Fragment key={o.ORDER_ID}>
                    <tr
                      onClick={() => toggleExpand(o.ORDER_ID)}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-400">
                        {expanded === o.ORDER_ID ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">#{o.ORDER_ID}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{o.RESTAURANT_NAME}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{o.SUPPLIER_NAME}</td>
                      <td className="px-4 py-3 text-gray-500">{o.ORDER_DATE ? new Date(o.ORDER_DATE).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">{o.ITEM_COUNT}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 dark:text-white">
                        ₹{Number(o.ORDER_TOTAL).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={o.ORDER_STATUS} />
                      </td>
                    </tr>

                    {/* Expanded details */}
                    {expanded === o.ORDER_ID && (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 bg-violet-50/40 dark:bg-violet-950/20 border-y border-violet-100 dark:border-violet-900/40">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                              Order #{o.ORDER_ID} Details & Status Override
                            </h4>

                            {/* Status transition dropdown */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Transition Status:</span>
                              <div className="flex gap-1">
                                {['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'].map(st => (
                                  <button
                                    key={st}
                                    disabled={o.ORDER_STATUS === st || updatingId === o.ORDER_ID}
                                    onClick={() => handleStatusChange(o.ORDER_ID, st)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                                      o.ORDER_STATUS === st
                                        ? 'bg-violet-600 text-white cursor-default'
                                        : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-violet-50 dark:hover:bg-slate-700 cursor-pointer'
                                    }`}
                                  >
                                    {st}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Order Items list */}
                          {orderDetails[o.ORDER_ID] ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                              {orderDetails[o.ORDER_ID].items?.map(it => (
                                <div key={it.ORDER_ITEM_ID} className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center justify-between text-xs">
                                  <div>
                                    <span className="font-semibold text-gray-900 dark:text-white block">{it.PRODUCT_NAME}</span>
                                    <span className="text-[11px] text-gray-500">Qty: {it.QUANTITY} • ₹{Number(it.UNIT_COST).toFixed(2)}/unit</span>
                                  </div>
                                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                                    ₹{Number(it.TOTAL_COST).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                              <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                              Loading line items...
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

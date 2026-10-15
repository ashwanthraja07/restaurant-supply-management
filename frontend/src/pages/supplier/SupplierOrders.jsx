import React, { useEffect, useState } from 'react';
import api from '../../api';
import { ShoppingCart, Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-toastify';

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

export default function SupplierOrders() {
  const [orders, setOrders]     = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [orderDetail, setOrderDetail] = useState({});

  useEffect(() => {
    api.get('/supplier-portal/orders')
      .then(r => { setOrders(r.data); setFiltered(r.data); })
      .catch(() => toast.error('Failed to load orders.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = orders;
    if (statusFilter !== 'All') result = result.filter(o => o.ORDER_STATUS === statusFilter);
    const q = search.toLowerCase();
    if (q) result = result.filter(o => o.RESTAURANT_NAME?.toLowerCase().includes(q) || String(o.ORDER_ID).includes(q));
    setFiltered(result);
  }, [search, statusFilter, orders]);

  const toggleExpand = async (orderId) => {
    if (expanded === orderId) { setExpanded(null); return; }
    setExpanded(orderId);
    if (!orderDetail[orderId]) {
      try {
        const r = await api.get(`/supplier-portal/orders/${orderId}`);
        setOrderDetail(d => ({ ...d, [orderId]: r.data }));
      } catch { toast.error('Failed to load order details.'); }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  const statuses = ['All', ...Array.from(new Set(orders.map(o => o.ORDER_STATUS)))];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Purchase Orders</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{orders.length} total orders</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-blue-400'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by restaurant or ID..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-gray-200/80 dark:border-slate-800">
          <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No orders found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-gray-200/80 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 w-8"></th>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Restaurant</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filtered.map(o => (
                  <React.Fragment key={o.ORDER_ID}>
                    <tr
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                      onClick={() => toggleExpand(o.ORDER_ID)}
                    >
                      <td className="px-4 py-3.5 text-gray-400">
                        {expanded === o.ORDER_ID ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-gray-900 dark:text-gray-100 font-medium">#{o.ORDER_ID}</td>
                      <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300">{o.RESTAURANT_NAME}</td>
                      <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">{o.ORDER_DATE ? new Date(o.ORDER_DATE).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3.5 text-right text-gray-700 dark:text-gray-300">{o.ITEM_COUNT}</td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-900 dark:text-gray-100">₹{Number(o.ORDER_TOTAL).toFixed(2)}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={o.ORDER_STATUS} /></td>
                    </tr>
                    {expanded === o.ORDER_ID && orderDetail[o.ORDER_ID] && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-blue-50/50 dark:bg-blue-950/20">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order Items</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Update Status:</span>
                              {['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'].map(st => (
                                <button
                                  key={st}
                                  disabled={o.ORDER_STATUS === st}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await api.put(`/supplier-portal/orders/${o.ORDER_ID}/status`, { status: st });
                                      toast.success(`Order #${o.ORDER_ID} marked as ${st}`);
                                      setOrders(prev => prev.map(item => item.ORDER_ID === o.ORDER_ID ? { ...item, ORDER_STATUS: st } : item));
                                    } catch (err) {
                                      toast.error(err.response?.data?.error || 'Failed to update order status.');
                                    }
                                  }}
                                  className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                                    o.ORDER_STATUS === st
                                      ? 'bg-blue-600 text-white cursor-default'
                                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {orderDetail[o.ORDER_ID].items?.map(item => (
                              <div key={item.ORDER_ITEM_ID} className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-slate-700 text-xs">
                                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium text-gray-900 dark:text-gray-100 block truncate">{item.PRODUCT_NAME}</span>
                                  <span className="text-gray-500 dark:text-gray-400">Qty: {item.QUANTITY} • ₹{Number(item.TOTAL_COST).toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
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

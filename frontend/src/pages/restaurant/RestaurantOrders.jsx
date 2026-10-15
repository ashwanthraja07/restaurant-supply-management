import React, { useEffect, useState } from 'react';
import api from '../../api';
import { ShoppingCart, Search, Loader2, ChevronDown, ChevronUp, Plus, X, Trash2, Ban } from 'lucide-react';
import { toast } from 'react-toastify';

function StatusBadge({ status }) {
  const map = {
    Pending:    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    Processing: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    Completed:  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    Cancelled:  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    Shipped:    'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
      {status}
    </span>
  );
}

export default function RestaurantOrders() {
  const [orders, setOrders]         = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState(null);
  const [orderDetail, setOrderDetail] = useState({});

  // Order modal state
  const [showModal, setShowModal]   = useState(false);
  const [suppliers, setSuppliers]   = useState([]);
  const [catalog, setCatalog]       = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1, unit_cost: 0 }]);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = () => {
    api.get('/restaurant-portal/orders')
      .then(r => { setOrders(r.data); setFiltered(r.data); })
      .catch(() => toast.error('Failed to load orders.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let result = orders;
    if (statusFilter !== 'All') result = result.filter(o => o.ORDER_STATUS === statusFilter);
    const q = search.toLowerCase();
    if (q) result = result.filter(o => o.SUPPLIER_NAME?.toLowerCase().includes(q) || String(o.ORDER_ID).includes(q));
    setFiltered(result);
  }, [search, statusFilter, orders]);

  const toggleExpand = async (orderId) => {
    if (expanded === orderId) { setExpanded(null); return; }
    setExpanded(orderId);
    if (!orderDetail[orderId]) {
      try {
        const r = await api.get(`/restaurant-portal/orders/${orderId}`);
        setOrderDetail(d => ({ ...d, [orderId]: r.data }));
      } catch { toast.error('Failed to load order details.'); }
    }
  };

  const handleOpenModal = async () => {
    setShowModal(true);
    try {
      const [supRes, prodRes] = await Promise.all([
        api.get('/restaurant-portal/suppliers'),
        api.get('/restaurant-portal/products')
      ]);
      setSuppliers(supRes.data);
      setCatalog(prodRes.data);
      if (supRes.data.length > 0) {
        setSelectedSupplier(supRes.data[0].SUPPLIER_ID);
      }
      setOrderItems([{ product_id: prodRes.data[0]?.PRODUCT_ID || '', quantity: 1, unit_cost: prodRes.data[0]?.UNIT_COST || 0 }]);
    } catch {
      toast.error('Failed to load supplier products catalog.');
    }
  };

  const handleAddItem = () => {
    setOrderItems([...orderItems, { product_id: catalog[0]?.PRODUCT_ID || '', quantity: 1, unit_cost: catalog[0]?.UNIT_COST || 0 }]);
  };

  const handleRemoveItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemProductChange = (index, productId) => {
    const prod = catalog.find(p => String(p.PRODUCT_ID) === String(productId));
    const newItems = [...orderItems];
    newItems[index] = {
      product_id: productId,
      quantity: newItems[index].quantity,
      unit_cost: prod ? prod.UNIT_COST : 0
    };
    setOrderItems(newItems);
  };

  const handleItemQtyChange = (index, qty) => {
    const newItems = [...orderItems];
    newItems[index].quantity = Math.max(1, parseInt(qty) || 1);
    setOrderItems(newItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_cost || 0)), 0);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) { toast.error('Please select a supplier.'); return; }
    if (orderItems.length === 0) { toast.error('Please add at least one item.'); return; }

    setSubmitting(true);
    try {
      await api.post('/restaurant-portal/orders', {
        supplier_id: selectedSupplier,
        items: orderItems
      });
      toast.success('Purchase order placed successfully!');
      setShowModal(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to cancel Order #${orderId}?`)) return;
    try {
      await api.put(`/restaurant-portal/orders/${orderId}/cancel`);
      toast.success(`Order #${orderId} cancelled.`);
      setOrders(prev => prev.map(o => o.ORDER_ID === orderId ? { ...o, ORDER_STATUS: 'Cancelled' } : o));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel order.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  );

  const statuses = ['All', ...Array.from(new Set(orders.map(o => o.ORDER_STATUS)))];

  return (
    <div className="space-y-5">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Purchase Orders</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{orders.length} total orders placed</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenModal}
            className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Place Purchase Order
          </button>
        </div>
      </div>

      {/* Filter and search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by supplier or ID..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-emerald-400'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-gray-200/80 dark:border-slate-800">
          <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No purchase orders found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-gray-200/80 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 w-8"></th>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filtered.map(o => (
                  <React.Fragment key={o.ORDER_ID}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors" onClick={() => toggleExpand(o.ORDER_ID)}>
                      <td className="px-4 py-3.5 text-gray-400">
                        {expanded === o.ORDER_ID ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-medium text-gray-900 dark:text-gray-100">#{o.ORDER_ID}</td>
                      <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300 font-medium">{o.SUPPLIER_NAME}</td>
                      <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">{o.ORDER_DATE ? new Date(o.ORDER_DATE).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3.5 text-right text-gray-700 dark:text-gray-300">{o.ITEM_COUNT}</td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-900 dark:text-gray-100">₹{Number(o.ORDER_TOTAL).toFixed(2)}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={o.ORDER_STATUS} /></td>
                    </tr>
                    {expanded === o.ORDER_ID && orderDetail[o.ORDER_ID] && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-emerald-50/50 dark:bg-emerald-950/20">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order Items</p>
                            {o.ORDER_STATUS?.toUpperCase() === 'PENDING' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelOrder(o.ORDER_ID);
                                }}
                                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 transition-colors cursor-pointer font-medium"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                Cancel Order
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {orderDetail[o.ORDER_ID].items?.map(item => (
                              <div key={item.ORDER_ITEM_ID} className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-slate-700 text-xs">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
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

      {/* Modal: Place New Order */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-gray-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Place New Purchase Order</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Select Supplier
                </label>
                <select
                  value={selectedSupplier}
                  onChange={e => setSelectedSupplier(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  {suppliers.map(s => (
                    <option key={s.SUPPLIER_ID} value={s.SUPPLIER_ID}>
                      {s.SUPPLIER_NAME} ({s.CITY || 'Global'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Order Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={item.product_id}
                        onChange={e => handleItemProductChange(idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      >
                        {catalog.map(p => (
                          <option key={p.PRODUCT_ID} value={p.PRODUCT_ID}>
                            {p.PRODUCT_NAME} (₹{p.UNIT_COST})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => handleItemQtyChange(idx, e.target.value)}
                        className="w-16 px-2 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-center"
                        placeholder="Qty"
                      />

                      <div className="text-xs font-mono text-gray-600 dark:text-gray-300 w-20 text-right">
                        ₹{(Number(item.quantity) * Number(item.unit_cost)).toFixed(2)}
                      </div>

                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Estimated Total:</span>
                  <span className="ml-2 text-base font-bold text-gray-900 dark:text-white">
                    ₹{calculateTotal().toFixed(2)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                    Confirm Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require SUPPLIER role
router.use(authenticate, authorize('SUPPLIER'));

// ─────────────────────────────────────────────────────────────
// GET /api/supplier-portal/dashboard
// Overview statistics for the logged-in supplier
// ─────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res, next) => {
    let connection;
    try {
        const supplierId = req.user.supplierId;
        connection = await db.getConnection();

        const [
            profileRes,
            totalProductsRes,
            totalOrdersRes,
            pendingOrdersRes,
            completedOrdersRes,
            recentOrdersRes,
            ordersByStatusRes,
            topProductsRes,
        ] = await Promise.all([
            connection.execute(
                `SELECT * FROM supplier WHERE supplier_id = :id`,
                { id: supplierId }
            ),
            connection.execute(
                `SELECT COUNT(*) AS cnt FROM product WHERE supplier_id = :id`,
                { id: supplierId }
            ),
            connection.execute(
                `SELECT COUNT(*) AS cnt FROM purchase_order WHERE supplier_id = :id`,
                { id: supplierId }
            ),
            connection.execute(
                `SELECT COUNT(*) AS cnt FROM purchase_order WHERE supplier_id = :id AND UPPER(order_status) = 'PENDING'`,
                { id: supplierId }
            ),
            connection.execute(
                `SELECT COUNT(*) AS cnt FROM purchase_order WHERE supplier_id = :id AND UPPER(order_status) = 'COMPLETED'`,
                { id: supplierId }
            ),
            connection.execute(
                `SELECT * FROM (
                    SELECT po.order_id, po.order_date, po.order_status, r.restaurant_name
                    FROM purchase_order po
                    JOIN restaurant r ON po.restaurant_id = r.restaurant_id
                    WHERE po.supplier_id = :id
                    ORDER BY po.order_date DESC
                ) WHERE ROWNUM <= 5`,
                { id: supplierId }
            ),
            connection.execute(
                `SELECT order_status, COUNT(*) AS cnt
                 FROM purchase_order
                 WHERE supplier_id = :id
                 GROUP BY order_status`,
                { id: supplierId }
            ),
            connection.execute(
                `SELECT p.product_name, p.category, p.unit_cost,
                         NVL(SUM(i.stock_qty), 0) AS total_stock
                 FROM product p
                 LEFT JOIN inventory i ON p.product_id = i.product_id
                 WHERE p.supplier_id = :id
                 GROUP BY p.product_name, p.category, p.unit_cost
                 ORDER BY total_stock DESC`,
                { id: supplierId }
            ),
        ]);

        res.json({
            profile:           profileRes.rows[0] || null,
            totalProducts:     totalProductsRes.rows[0].CNT,
            totalOrders:       totalOrdersRes.rows[0].CNT,
            pendingOrders:     pendingOrdersRes.rows[0].CNT,
            completedOrders:   completedOrdersRes.rows[0].CNT,
            recentOrders:      recentOrdersRes.rows,
            ordersByStatus:    ordersByStatusRes.rows,
            topProducts:       topProductsRes.rows,
        });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/supplier-portal/profile
// ─────────────────────────────────────────────────────────────
router.get('/profile', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT * FROM supplier WHERE supplier_id = :id`,
            { id: req.user.supplierId }
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found.' });
        res.json(result.rows[0]);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/supplier-portal/profile
// ─────────────────────────────────────────────────────────────
router.put('/profile', async (req, res, next) => {
    let connection;
    try {
        const { supplier_name, contact_no, city } = req.body;
        if (!supplier_name) return res.status(400).json({ error: 'Supplier name is required.' });
        connection = await db.getConnection();
        const result = await connection.execute(
            `UPDATE supplier SET supplier_name = :name, contact_no = :contact, city = :city
             WHERE supplier_id = :id`,
            { name: supplier_name, contact: contact_no || null, city: city || null, id: req.user.supplierId }
        );
        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Supplier not found.' });
        res.json({ message: 'Profile updated successfully.' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/supplier-portal/products
// Products supplied by the logged-in supplier
// ─────────────────────────────────────────────────────────────
router.get('/products', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT p.product_id, p.product_name, p.category, p.unit_cost,
                    NVL(SUM(i.stock_qty), 0) AS total_stock
             FROM product p
             LEFT JOIN inventory i ON p.product_id = i.product_id
             WHERE p.supplier_id = :id
             GROUP BY p.product_id, p.product_name, p.category, p.unit_cost
             ORDER BY p.product_id`,
            { id: req.user.supplierId }
        );
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/supplier-portal/orders
// Purchase orders for the logged-in supplier
// ─────────────────────────────────────────────────────────────
router.get('/orders', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT po.order_id, po.order_date, po.order_status,
                    r.restaurant_name, r.city AS restaurant_city,
                    COUNT(oi.order_item_id) AS item_count,
                    NVL(SUM(oi.total_cost), 0) AS order_total
             FROM purchase_order po
             JOIN restaurant r ON po.restaurant_id = r.restaurant_id
             LEFT JOIN order_item oi ON po.order_id = oi.order_id
             WHERE po.supplier_id = :id
             GROUP BY po.order_id, po.order_date, po.order_status, r.restaurant_name, r.city
             ORDER BY po.order_date DESC`,
            { id: req.user.supplierId }
        );
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/supplier-portal/orders/:orderId
// ─────────────────────────────────────────────────────────────
router.get('/orders/:orderId', async (req, res, next) => {
    let connection;
    try {
        const { orderId } = req.params;
        connection = await db.getConnection();

        const orderRes = await connection.execute(
            `SELECT po.*, s.supplier_name, r.restaurant_name
             FROM purchase_order po
             JOIN supplier s ON po.supplier_id = s.supplier_id
             JOIN restaurant r ON po.restaurant_id = r.restaurant_id
             WHERE po.order_id = :oid AND po.supplier_id = :sid`,
            { oid: orderId, sid: req.user.supplierId }
        );
        if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Order not found.' });

        const itemsRes = await connection.execute(
            `SELECT oi.order_item_id, oi.quantity, oi.total_cost,
                    p.product_name, p.category, p.unit_cost
             FROM order_item oi
             JOIN product p ON oi.product_id = p.product_id
             WHERE oi.order_id = :oid`,
            { oid: orderId }
        );

        res.json({ order: orderRes.rows[0], items: itemsRes.rows });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/supplier-portal/orders/:orderId/status
// Update order status (Pending, Processing, Shipped, Completed, Cancelled)
// ─────────────────────────────────────────────────────────────
router.put('/orders/:orderId/status', async (req, res, next) => {
    let connection;
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        if (!status) return res.status(400).json({ error: 'Status is required.' });

        connection = await db.getConnection();
        const result = await connection.execute(
            `UPDATE purchase_order SET order_status = :status
             WHERE order_id = :oid AND supplier_id = :sid`,
            { status, oid: orderId, sid: req.user.supplierId }
        );
        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Order not found or unauthorized.' });
        }
        res.json({ message: 'Order status updated successfully.', order_status: status });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/supplier-portal/inventory
// Inventory records for the logged-in supplier's products
// ─────────────────────────────────────────────────────────────
router.get('/inventory', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT i.inventory_id, i.stock_qty, i.reorder_level,
                    p.product_name, p.category,
                    w.warehouse_name, w.city AS warehouse_city
             FROM inventory i
             JOIN product p ON i.product_id = p.product_id
             JOIN warehouse w ON i.warehouse_id = w.warehouse_id
             WHERE p.supplier_id = :id
             ORDER BY i.inventory_id`,
            { id: req.user.supplierId }
        );
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

module.exports = router;

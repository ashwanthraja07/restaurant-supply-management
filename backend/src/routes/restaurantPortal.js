const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require RESTAURANT role
router.use(authenticate, authorize('RESTAURANT'));

// ─────────────────────────────────────────────────────────────
// GET /api/restaurant-portal/dashboard
// Overview statistics for the logged-in restaurant
// ─────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res, next) => {
    let connection;
    try {
        const restaurantId = req.user.restaurantId;
        connection = await db.getConnection();

        const [
            profileRes,
            totalOrdersRes,
            pendingOrdersRes,
            completedOrdersRes,
            totalSpendRes,
            recentOrdersRes,
            ordersByStatusRes,
            lowStockRes,
        ] = await Promise.all([
            connection.execute(
                `SELECT * FROM restaurant WHERE restaurant_id = :id`,
                { id: restaurantId }
            ),
            connection.execute(
                `SELECT COUNT(*) AS cnt FROM purchase_order WHERE restaurant_id = :id`,
                { id: restaurantId }
            ),
            connection.execute(
                `SELECT COUNT(*) AS cnt FROM purchase_order WHERE restaurant_id = :id AND UPPER(order_status) = 'PENDING'`,
                { id: restaurantId }
            ),
            connection.execute(
                `SELECT COUNT(*) AS cnt FROM purchase_order WHERE restaurant_id = :id AND UPPER(order_status) = 'COMPLETED'`,
                { id: restaurantId }
            ),
            connection.execute(
                `SELECT NVL(SUM(oi.total_cost), 0) AS total
                 FROM order_item oi
                 JOIN purchase_order po ON oi.order_id = po.order_id
                 WHERE po.restaurant_id = :id`,
                { id: restaurantId }
            ),
            connection.execute(
                `SELECT * FROM (
                    SELECT po.order_id, po.order_date, po.order_status,
                           s.supplier_name
                    FROM purchase_order po
                    JOIN supplier s ON po.supplier_id = s.supplier_id
                    WHERE po.restaurant_id = :id
                    ORDER BY po.order_date DESC
                ) WHERE ROWNUM <= 5`,
                { id: restaurantId }
            ),
            connection.execute(
                `SELECT order_status, COUNT(*) AS cnt
                 FROM purchase_order
                 WHERE restaurant_id = :id
                 GROUP BY order_status`,
                { id: restaurantId }
            ),
            connection.execute(
                `SELECT i.inventory_id, p.product_name, w.warehouse_name,
                         i.stock_qty, i.reorder_level
                 FROM inventory i
                 JOIN product p ON i.product_id = p.product_id
                 JOIN warehouse w ON i.warehouse_id = w.warehouse_id
                 WHERE i.stock_qty <= i.reorder_level
                 ORDER BY i.stock_qty ASC`,
                {}
            ),
        ]);

        res.json({
            profile:          profileRes.rows[0] || null,
            totalOrders:      totalOrdersRes.rows[0].CNT,
            pendingOrders:    pendingOrdersRes.rows[0].CNT,
            completedOrders:  completedOrdersRes.rows[0].CNT,
            totalSpend:       totalSpendRes.rows[0].TOTAL,
            recentOrders:     recentOrdersRes.rows,
            ordersByStatus:   ordersByStatusRes.rows,
            lowStockAlerts:   lowStockRes.rows,
        });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/restaurant-portal/profile
// ─────────────────────────────────────────────────────────────
router.get('/profile', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT * FROM restaurant WHERE restaurant_id = :id`,
            { id: req.user.restaurantId }
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Restaurant not found.' });
        res.json(result.rows[0]);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/restaurant-portal/profile
// ─────────────────────────────────────────────────────────────
router.put('/profile', async (req, res, next) => {
    let connection;
    try {
        const { restaurant_name, city, phone } = req.body;
        if (!restaurant_name) return res.status(400).json({ error: 'Restaurant name is required.' });
        connection = await db.getConnection();
        const result = await connection.execute(
            `UPDATE restaurant SET restaurant_name = :name, city = :city, phone = :phone
             WHERE restaurant_id = :id`,
            { name: restaurant_name, city: city || null, phone: phone || null, id: req.user.restaurantId }
        );
        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Restaurant not found.' });
        res.json({ message: 'Profile updated successfully.' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/restaurant-portal/orders
// Purchase orders for the logged-in restaurant
// ─────────────────────────────────────────────────────────────
router.get('/orders', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT po.order_id, po.order_date, po.order_status,
                    s.supplier_name, s.city AS supplier_city,
                    COUNT(oi.order_item_id) AS item_count,
                    NVL(SUM(oi.total_cost), 0) AS order_total
             FROM purchase_order po
             JOIN supplier s ON po.supplier_id = s.supplier_id
             LEFT JOIN order_item oi ON po.order_id = oi.order_id
             WHERE po.restaurant_id = :id
             GROUP BY po.order_id, po.order_date, po.order_status, s.supplier_name, s.city
             ORDER BY po.order_date DESC`,
            { id: req.user.restaurantId }
        );
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/restaurant-portal/orders/:orderId
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
             WHERE po.order_id = :oid AND po.restaurant_id = :rid`,
            { oid: orderId, rid: req.user.restaurantId }
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
// GET /api/restaurant-portal/products
// Product catalog available in the system
// ─────────────────────────────────────────────────────────────
router.get('/products', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT p.product_id, p.product_name, p.category, p.unit_cost,
                    s.supplier_name, NVL(SUM(i.stock_qty), 0) AS available_stock
             FROM product p
             LEFT JOIN supplier s ON p.supplier_id = s.supplier_id
             LEFT JOIN inventory i ON p.product_id = i.product_id
             GROUP BY p.product_id, p.product_name, p.category, p.unit_cost, s.supplier_name
             ORDER BY p.product_name`
        );
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/restaurant-portal/inventory
// Inventory/stock information
// ─────────────────────────────────────────────────────────────
router.get('/inventory', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT i.inventory_id, i.stock_qty, i.reorder_level,
                    p.product_name, p.category, p.unit_cost,
                    w.warehouse_name, w.city AS warehouse_city,
                    s.supplier_name,
                    CASE WHEN i.stock_qty <= i.reorder_level THEN 'LOW' ELSE 'OK' END AS stock_status
             FROM inventory i
             JOIN product p ON i.product_id = p.product_id
             JOIN warehouse w ON i.warehouse_id = w.warehouse_id
             LEFT JOIN supplier s ON p.supplier_id = s.supplier_id
             ORDER BY stock_status DESC, i.stock_qty ASC`
        );
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/restaurant-portal/suppliers
// ─────────────────────────────────────────────────────────────
router.get('/suppliers', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT supplier_id, supplier_name, city, contact_no FROM supplier ORDER BY supplier_name`
        );
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/restaurant-portal/orders
// Place a new purchase order with line items
// ─────────────────────────────────────────────────────────────
router.post('/orders', async (req, res, next) => {
    let connection;
    try {
        const { supplier_id, items } = req.body;
        if (!supplier_id) return res.status(400).json({ error: 'Supplier is required.' });
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'At least one order item is required.' });
        }

        connection = await db.getConnection();

        // Generate next IDs
        const orderIdRes = await connection.execute(
            `SELECT NVL(MAX(order_id), 0) + 1 AS next_id FROM purchase_order`
        );
        const nextOrderId = orderIdRes.rows[0].NEXT_ID;

        const itemIdRes = await connection.execute(
            `SELECT NVL(MAX(order_item_id), 0) + 1 AS next_id FROM order_item`
        );
        let nextItemId = itemIdRes.rows[0].NEXT_ID;

        const conn = connection;
        try {
            await conn.execute(
                `INSERT INTO purchase_order (order_id, order_date, supplier_id, restaurant_id, order_status)
                 VALUES (:oid, SYSDATE, :sid, :rid, 'Pending')`,
                { oid: nextOrderId, sid: Number(supplier_id), rid: req.user.restaurantId },
                { autoCommit: false }
            );

            for (const item of items) {
                const qty = Number(item.quantity) || 1;
                const cost = Number(item.unit_cost || 0) * qty;
                await conn.execute(
                    `INSERT INTO order_item (order_item_id, order_id, product_id, quantity, total_cost)
                     VALUES (:item_id, :oid, :pid, :qty, :cost)`,
                    {
                        item_id: nextItemId++,
                        oid: nextOrderId,
                        pid: Number(item.product_id),
                        qty: qty,
                        cost: cost
                    },
                    { autoCommit: false }
                );
            }

            await conn.commit();
        } catch (txErr) {
            await conn.rollback();
            throw txErr;
        }

        res.status(201).json({
            message: 'Purchase order placed successfully.',
            order_id: nextOrderId
        });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/restaurant-portal/orders/:orderId/cancel
// Cancel a pending purchase order
// ─────────────────────────────────────────────────────────────
router.put('/orders/:orderId/cancel', async (req, res, next) => {
    let connection;
    try {
        const { orderId } = req.params;
        connection = await db.getConnection();

        const result = await connection.execute(
            `UPDATE purchase_order SET order_status = 'Cancelled'
             WHERE order_id = :oid AND restaurant_id = :rid AND UPPER(order_status) = 'PENDING'`,
            { oid: orderId, rid: req.user.restaurantId }
        );

        if (result.rowsAffected === 0) {
            return res.status(400).json({ error: 'Order cannot be cancelled (must be Pending and owned by you).' });
        }
        res.json({ message: 'Order cancelled successfully.' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

module.exports = router;

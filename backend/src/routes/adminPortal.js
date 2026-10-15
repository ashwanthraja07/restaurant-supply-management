const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// Helper logger for administrative actions (auditing without secrets)
function logAdminAction(adminEmail, action, details) {
    const timestamp = new Date().toISOString();
    console.log(`[ADMIN AUDIT] [${timestamp}] Admin: ${adminEmail} | Action: ${action} | Details:`, JSON.stringify(details));
}

// ─────────────────────────────────────────────────────────────
// 1. DASHBOARD OVERVIEW & ANALYTICS
// GET /api/admin-portal/dashboard
// ─────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();

        const [
            suppliersRes,
            restaurantsRes,
            productsRes,
            warehousesRes,
            ordersRes,
            pendingOrdersRes,
            completedOrdersRes,
            lowStockRes,
            totalStockRes,
            ordersByStatusRes,
            recentOrdersRes,
            warehouseStockRes,
            topSuppliersRes
        ] = await Promise.all([
            connection.execute(`SELECT COUNT(*) AS cnt FROM supplier`),
            connection.execute(`SELECT COUNT(*) AS cnt FROM restaurant`),
            connection.execute(`SELECT COUNT(*) AS cnt FROM product`),
            connection.execute(`SELECT COUNT(*) AS cnt FROM warehouse`),
            connection.execute(`SELECT COUNT(*) AS cnt FROM purchase_order`),
            connection.execute(`SELECT COUNT(*) AS cnt FROM purchase_order WHERE UPPER(order_status) = 'PENDING'`),
            connection.execute(`SELECT COUNT(*) AS cnt FROM purchase_order WHERE UPPER(order_status) = 'COMPLETED'`),
            connection.execute(`SELECT COUNT(*) AS cnt FROM inventory WHERE stock_qty <= reorder_level`),
            connection.execute(`SELECT NVL(SUM(stock_qty), 0) AS total FROM inventory`),
            connection.execute(`
                SELECT order_status, COUNT(*) AS cnt
                FROM purchase_order
                GROUP BY order_status
            `),
            connection.execute(`
                SELECT * FROM (
                    SELECT po.order_id, po.order_date, po.order_status,
                           s.supplier_name, r.restaurant_name,
                           NVL(SUM(oi.total_cost), 0) AS order_total
                    FROM purchase_order po
                    JOIN supplier s ON po.supplier_id = s.supplier_id
                    JOIN restaurant r ON po.restaurant_id = r.restaurant_id
                    LEFT JOIN order_item oi ON po.order_id = oi.order_id
                    GROUP BY po.order_id, po.order_date, po.order_status, s.supplier_name, r.restaurant_name
                    ORDER BY po.order_date DESC, po.order_id DESC
                ) WHERE ROWNUM <= 6
            `),
            connection.execute(`
                SELECT w.warehouse_name, NVL(SUM(i.stock_qty), 0) AS total_stock
                FROM warehouse w
                LEFT JOIN inventory i ON w.warehouse_id = i.warehouse_id
                GROUP BY w.warehouse_name
                ORDER BY total_stock DESC
            `),
            connection.execute(`
                SELECT * FROM (
                    SELECT s.supplier_name, COUNT(p.product_id) AS product_count
                    FROM supplier s
                    LEFT JOIN product p ON s.supplier_id = p.supplier_id
                    GROUP BY s.supplier_name
                    ORDER BY product_count DESC
                ) WHERE ROWNUM <= 5
            `)
        ]);

        res.json({
            stats: {
                totalSuppliers:    suppliersRes.rows[0].CNT,
                totalRestaurants:  restaurantsRes.rows[0].CNT,
                totalProducts:     productsRes.rows[0].CNT,
                totalWarehouses:   warehousesRes.rows[0].CNT,
                totalOrders:       ordersRes.rows[0].CNT,
                pendingOrders:     pendingOrdersRes.rows[0].CNT,
                completedOrders:   completedOrdersRes.rows[0].CNT,
                lowStockCount:     lowStockRes.rows[0].CNT,
                totalStock:        totalStockRes.rows[0].TOTAL,
            },
            ordersByStatus:   ordersByStatusRes.rows,
            recentOrders:     recentOrdersRes.rows,
            warehouseStock:   warehouseStockRes.rows,
            topSuppliers:     topSuppliersRes.rows,
        });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// 2. SUPPLIER MANAGEMENT
// GET, POST, PUT, PUT /:id/toggle-status
// ─────────────────────────────────────────────────────────────
router.get('/suppliers', async (req, res, next) => {
    let connection;
    try {
        const { q } = req.query;
        connection = await db.getConnection();

        let sql = `
            SELECT s.supplier_id, s.supplier_name, s.contact_no, s.city,
                   COUNT(DISTINCT p.product_id) AS product_count,
                   COUNT(DISTINCT po.order_id) AS order_count,
                   l.login_id, l.email AS login_email, NVL(l.is_active, 0) AS is_active
            FROM supplier s
            LEFT JOIN product p ON s.supplier_id = p.supplier_id
            LEFT JOIN purchase_order po ON s.supplier_id = po.supplier_id
            LEFT JOIN login l ON s.supplier_id = l.supplier_id
        `;
        const binds = {};
        if (q && q.trim()) {
            sql += ` WHERE LOWER(s.supplier_name) LIKE :q OR LOWER(s.city) LIKE :q `;
            binds.q = `%${q.trim().toLowerCase()}%`;
        }
        sql += ` GROUP BY s.supplier_id, s.supplier_name, s.contact_no, s.city, l.login_id, l.email, l.is_active
                 ORDER BY s.supplier_id DESC `;

        const result = await connection.execute(sql, binds);
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.post('/suppliers', async (req, res, next) => {
    let connection;
    try {
        const { supplier_name, contact_no, city } = req.body;
        if (!supplier_name || !supplier_name.trim()) {
            return res.status(400).json({ error: 'Supplier name is required.' });
        }

        connection = await db.getConnection();
        const idRes = await connection.execute(`SELECT NVL(MAX(supplier_id), 0) + 1 AS next_id FROM supplier`);
        const nextId = idRes.rows[0].NEXT_ID;

        await connection.execute(
            `INSERT INTO supplier (supplier_id, supplier_name, contact_no, city)
             VALUES (:id, :name, :contact, :city)`,
            { id: nextId, name: supplier_name.trim(), contact: contact_no || null, city: city || null }
        );

        logAdminAction(req.user.email, 'CREATE_SUPPLIER', { supplierId: nextId, name: supplier_name });
        res.status(201).json({ message: 'Supplier created successfully.', supplier_id: nextId });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.put('/suppliers/:id', async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;
        const { supplier_name, contact_no, city } = req.body;
        if (!supplier_name || !supplier_name.trim()) {
            return res.status(400).json({ error: 'Supplier name is required.' });
        }

        connection = await db.getConnection();
        const result = await connection.execute(
            `UPDATE supplier SET supplier_name = :name, contact_no = :contact, city = :city
             WHERE supplier_id = :id`,
            { name: supplier_name.trim(), contact: contact_no || null, city: city || null, id: Number(id) }
        );

        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Supplier not found.' });

        logAdminAction(req.user.email, 'UPDATE_SUPPLIER', { supplierId: id, name: supplier_name });
        res.json({ message: 'Supplier updated successfully.' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.put('/suppliers/:id/toggle-status', async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await db.getConnection();

        const loginRes = await connection.execute(
            `SELECT login_id, is_active FROM login WHERE supplier_id = :sid`,
            { sid: Number(id) }
        );
        if (loginRes.rows.length === 0) {
            return res.status(404).json({ error: 'No associated login account found for this supplier.' });
        }

        const currentStatus = loginRes.rows[0].IS_ACTIVE;
        const newStatus = currentStatus === 1 ? 0 : 1;

        await connection.execute(
            `UPDATE login SET is_active = :status WHERE supplier_id = :sid`,
            { status: newStatus, sid: Number(id) }
        );

        logAdminAction(req.user.email, 'TOGGLE_SUPPLIER_STATUS', { supplierId: id, newStatus: newStatus === 1 ? 'ACTIVE' : 'INACTIVE' });
        res.json({
            message: `Supplier account ${newStatus === 1 ? 'activated' : 'deactivated'} successfully.`,
            is_active: newStatus
        });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// 3. RESTAURANT MANAGEMENT
// GET, POST, PUT, PUT /:id/toggle-status
// ─────────────────────────────────────────────────────────────
router.get('/restaurants', async (req, res, next) => {
    let connection;
    try {
        const { q } = req.query;
        connection = await db.getConnection();

        let sql = `
            SELECT r.restaurant_id, r.restaurant_name, r.city, r.phone,
                   COUNT(DISTINCT po.order_id) AS order_count,
                   NVL(SUM(oi.total_cost), 0) AS total_spend,
                   l.login_id, l.email AS login_email, NVL(l.is_active, 0) AS is_active
            FROM restaurant r
            LEFT JOIN purchase_order po ON r.restaurant_id = po.restaurant_id
            LEFT JOIN order_item oi ON po.order_id = oi.order_id
            LEFT JOIN login l ON r.restaurant_id = l.restaurant_id
        `;
        const binds = {};
        if (q && q.trim()) {
            sql += ` WHERE LOWER(r.restaurant_name) LIKE :q OR LOWER(r.city) LIKE :q `;
            binds.q = `%${q.trim().toLowerCase()}%`;
        }
        sql += ` GROUP BY r.restaurant_id, r.restaurant_name, r.city, r.phone, l.login_id, l.email, l.is_active
                 ORDER BY r.restaurant_id DESC `;

        const result = await connection.execute(sql, binds);
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.post('/restaurants', async (req, res, next) => {
    let connection;
    try {
        const { restaurant_name, city, phone } = req.body;
        if (!restaurant_name || !restaurant_name.trim()) {
            return res.status(400).json({ error: 'Restaurant name is required.' });
        }

        connection = await db.getConnection();
        const idRes = await connection.execute(`SELECT NVL(MAX(restaurant_id), 0) + 1 AS next_id FROM restaurant`);
        const nextId = idRes.rows[0].NEXT_ID;

        await connection.execute(
            `INSERT INTO restaurant (restaurant_id, restaurant_name, city, phone)
             VALUES (:id, :name, :city, :phone)`,
            { id: nextId, name: restaurant_name.trim(), city: city || null, phone: phone || null }
        );

        logAdminAction(req.user.email, 'CREATE_RESTAURANT', { restaurantId: nextId, name: restaurant_name });
        res.status(201).json({ message: 'Restaurant created successfully.', restaurant_id: nextId });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.put('/restaurants/:id', async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;
        const { restaurant_name, city, phone } = req.body;
        if (!restaurant_name || !restaurant_name.trim()) {
            return res.status(400).json({ error: 'Restaurant name is required.' });
        }

        connection = await db.getConnection();
        const result = await connection.execute(
            `UPDATE restaurant SET restaurant_name = :name, city = :city, phone = :phone
             WHERE restaurant_id = :id`,
            { name: restaurant_name.trim(), city: city || null, phone: phone || null, id: Number(id) }
        );

        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Restaurant not found.' });

        logAdminAction(req.user.email, 'UPDATE_RESTAURANT', { restaurantId: id, name: restaurant_name });
        res.json({ message: 'Restaurant updated successfully.' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.put('/restaurants/:id/toggle-status', async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await db.getConnection();

        const loginRes = await connection.execute(
            `SELECT login_id, is_active FROM login WHERE restaurant_id = :rid`,
            { rid: Number(id) }
        );
        if (loginRes.rows.length === 0) {
            return res.status(404).json({ error: 'No associated login account found for this restaurant.' });
        }

        const currentStatus = loginRes.rows[0].IS_ACTIVE;
        const newStatus = currentStatus === 1 ? 0 : 1;

        await connection.execute(
            `UPDATE login SET is_active = :status WHERE restaurant_id = :rid`,
            { status: newStatus, rid: Number(id) }
        );

        logAdminAction(req.user.email, 'TOGGLE_RESTAURANT_STATUS', { restaurantId: id, newStatus: newStatus === 1 ? 'ACTIVE' : 'INACTIVE' });
        res.json({
            message: `Restaurant account ${newStatus === 1 ? 'activated' : 'deactivated'} successfully.`,
            is_active: newStatus
        });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// 4. PRODUCT MANAGEMENT
// GET, POST, PUT, DELETE
// ─────────────────────────────────────────────────────────────
router.get('/products', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(`
            SELECT p.product_id, p.product_name, p.category, p.unit_cost, p.supplier_id,
                   s.supplier_name,
                   NVL(SUM(i.stock_qty), 0) AS total_stock
            FROM product p
            JOIN supplier s ON p.supplier_id = s.supplier_id
            LEFT JOIN inventory i ON p.product_id = i.product_id
            GROUP BY p.product_id, p.product_name, p.category, p.unit_cost, p.supplier_id, s.supplier_name
            ORDER BY p.product_id DESC
        `);
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.post('/products', async (req, res, next) => {
    let connection;
    try {
        const { product_name, category, unit_cost, supplier_id } = req.body;
        if (!product_name || !supplier_id || unit_cost === undefined) {
            return res.status(400).json({ error: 'Product name, supplier, and unit cost are required.' });
        }

        connection = await db.getConnection();

        // Check for duplicate product for same supplier
        const dupCheck = await connection.execute(
            `SELECT product_id FROM product
             WHERE LOWER(product_name) = LOWER(:name) AND supplier_id = :sid`,
            { name: product_name.trim(), sid: Number(supplier_id) }
        );
        if (dupCheck.rows.length > 0) {
            return res.status(409).json({ error: 'This supplier already has a product with this exact name.' });
        }

        const idRes = await connection.execute(`SELECT NVL(MAX(product_id), 0) + 1 AS next_id FROM product`);
        const nextId = idRes.rows[0].NEXT_ID;

        await connection.execute(
            `INSERT INTO product (product_id, product_name, category, unit_cost, supplier_id)
             VALUES (:id, :name, :cat, :cost, :sid)`,
            {
                id: nextId,
                name: product_name.trim(),
                cat: category || 'General',
                cost: Number(unit_cost),
                sid: Number(supplier_id)
            }
        );

        logAdminAction(req.user.email, 'CREATE_PRODUCT', { productId: nextId, name: product_name, supplierId: supplier_id });
        res.status(201).json({ message: 'Product created successfully.', product_id: nextId });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.put('/products/:id', async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;
        const { product_name, category, unit_cost, supplier_id } = req.body;
        if (!product_name || !supplier_id || unit_cost === undefined) {
            return res.status(400).json({ error: 'Product name, supplier, and unit cost are required.' });
        }

        connection = await db.getConnection();
        const result = await connection.execute(
            `UPDATE product SET product_name = :name, category = :cat, unit_cost = :cost, supplier_id = :sid
             WHERE product_id = :id`,
            {
                name: product_name.trim(),
                cat: category || 'General',
                cost: Number(unit_cost),
                sid: Number(supplier_id),
                id: Number(id)
            }
        );

        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Product not found.' });

        logAdminAction(req.user.email, 'UPDATE_PRODUCT', { productId: id, name: product_name });
        res.json({ message: 'Product updated successfully.' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.delete('/products/:id', async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await db.getConnection();

        // Check inventory references
        const invCheck = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM inventory WHERE product_id = :id`,
            { id: Number(id) }
        );
        if (invCheck.rows[0].CNT > 0) {
            return res.status(400).json({ error: 'Cannot delete product with existing inventory records.' });
        }

        // Check order item references
        const orderCheck = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM order_item WHERE product_id = :id`,
            { id: Number(id) }
        );
        if (orderCheck.rows[0].CNT > 0) {
            return res.status(400).json({ error: 'Cannot delete product that has existing purchase order items.' });
        }

        await connection.execute(`DELETE FROM product WHERE product_id = :id`, { id: Number(id) });
        logAdminAction(req.user.email, 'DELETE_PRODUCT', { productId: id });
        res.json({ message: 'Product deleted successfully.' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// 5. WAREHOUSE MANAGEMENT
// GET, POST, PUT, DELETE
// ─────────────────────────────────────────────────────────────
router.get('/warehouses', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(`
            SELECT w.warehouse_id, w.warehouse_name, w.city,
                   COUNT(i.inventory_id) AS item_count,
                   NVL(SUM(i.stock_qty), 0) AS total_stock
            FROM warehouse w
            LEFT JOIN inventory i ON w.warehouse_id = i.warehouse_id
            GROUP BY w.warehouse_id, w.warehouse_name, w.city
            ORDER BY w.warehouse_id
        `);
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.post('/warehouses', async (req, res, next) => {
    let connection;
    try {
        const { warehouse_name, city } = req.body;
        if (!warehouse_name || !warehouse_name.trim()) {
            return res.status(400).json({ error: 'Warehouse name is required.' });
        }

        connection = await db.getConnection();
        const idRes = await connection.execute(`SELECT NVL(MAX(warehouse_id), 0) + 1 AS next_id FROM warehouse`);
        const nextId = idRes.rows[0].NEXT_ID;

        await connection.execute(
            `INSERT INTO warehouse (warehouse_id, warehouse_name, city)
             VALUES (:id, :name, :city)`,
            { id: nextId, name: warehouse_name.trim(), city: city || null }
        );

        logAdminAction(req.user.email, 'CREATE_WAREHOUSE', { warehouseId: nextId, name: warehouse_name });
        res.status(201).json({ message: 'Warehouse created successfully.', warehouse_id: nextId });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.put('/warehouses/:id', async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;
        const { warehouse_name, city } = req.body;
        if (!warehouse_name || !warehouse_name.trim()) {
            return res.status(400).json({ error: 'Warehouse name is required.' });
        }

        connection = await db.getConnection();
        const result = await connection.execute(
            `UPDATE warehouse SET warehouse_name = :name, city = :city WHERE warehouse_id = :id`,
            { name: warehouse_name.trim(), city: city || null, id: Number(id) }
        );

        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Warehouse not found.' });

        logAdminAction(req.user.email, 'UPDATE_WAREHOUSE', { warehouseId: id, name: warehouse_name });
        res.json({ message: 'Warehouse updated successfully.' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.delete('/warehouses/:id', async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await db.getConnection();

        const invCheck = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM inventory WHERE warehouse_id = :id`,
            { id: Number(id) }
        );
        if (invCheck.rows[0].CNT > 0) {
            return res.status(400).json({ error: 'Cannot delete warehouse that holds inventory stock.' });
        }

        await connection.execute(`DELETE FROM warehouse WHERE warehouse_id = :id`, { id: Number(id) });
        logAdminAction(req.user.email, 'DELETE_WAREHOUSE', { warehouseId: id });
        res.json({ message: 'Warehouse deleted successfully.' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// 6. INVENTORY MANAGEMENT
// GET, POST, PUT, DELETE
// ─────────────────────────────────────────────────────────────
router.get('/inventory', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(`
            SELECT i.inventory_id, i.stock_qty, i.reorder_level,
                   p.product_id, p.product_name, p.category, p.unit_cost,
                   w.warehouse_id, w.warehouse_name, w.city AS warehouse_city,
                   s.supplier_id, s.supplier_name,
                   CASE WHEN i.stock_qty <= i.reorder_level THEN 'LOW' ELSE 'OK' END AS stock_status
            FROM inventory i
            JOIN product p ON i.product_id = p.product_id
            JOIN warehouse w ON i.warehouse_id = w.warehouse_id
            JOIN supplier s ON p.supplier_id = s.supplier_id
            ORDER BY stock_status DESC, i.inventory_id DESC
        `);
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.post('/inventory', async (req, res, next) => {
    let connection;
    try {
        const { product_id, warehouse_id, stock_qty, reorder_level } = req.body;
        if (!product_id || !warehouse_id || stock_qty === undefined) {
            return res.status(400).json({ error: 'Product, warehouse, and stock quantity are required.' });
        }

        connection = await db.getConnection();
        const idRes = await connection.execute(`SELECT NVL(MAX(inventory_id), 0) + 1 AS next_id FROM inventory`);
        const nextId = idRes.rows[0].NEXT_ID;

        await connection.execute(
            `INSERT INTO inventory (inventory_id, product_id, warehouse_id, stock_qty, reorder_level)
             VALUES (:id, :pid, :wid, :qty, :reorder)`,
            {
                id: nextId,
                pid: Number(product_id),
                wid: Number(warehouse_id),
                qty: Number(stock_qty),
                reorder: Number(reorder_level || 0)
            }
        );

        logAdminAction(req.user.email, 'ADD_INVENTORY', { inventoryId: nextId, productId: product_id, warehouseId: warehouse_id, qty: stock_qty });
        res.status(201).json({ message: 'Inventory record created successfully.', inventory_id: nextId });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.put('/inventory/:id', async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;
        const { stock_qty, reorder_level } = req.body;
        if (stock_qty === undefined) {
            return res.status(400).json({ error: 'Stock quantity is required.' });
        }

        connection = await db.getConnection();
        const result = await connection.execute(
            `UPDATE inventory SET stock_qty = :qty, reorder_level = :reorder WHERE inventory_id = :id`,
            { qty: Number(stock_qty), reorder: Number(reorder_level || 0), id: Number(id) }
        );

        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Inventory record not found.' });

        logAdminAction(req.user.email, 'UPDATE_INVENTORY', { inventoryId: id, qty: stock_qty, reorder: reorder_level });
        res.json({ message: 'Inventory record updated successfully.' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.delete('/inventory/:id', async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await db.getConnection();
        await connection.execute(`DELETE FROM inventory WHERE inventory_id = :id`, { id: Number(id) });
        logAdminAction(req.user.email, 'DELETE_INVENTORY', { inventoryId: id });
        res.json({ message: 'Inventory record deleted successfully.' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// 7. PURCHASE ORDER MANAGEMENT
// GET, GET /:id, PUT /:id/status
// ─────────────────────────────────────────────────────────────
router.get('/orders', async (req, res, next) => {
    let connection;
    try {
        const { status, supplier_id, restaurant_id, q } = req.query;
        connection = await db.getConnection();

        let sql = `
            SELECT po.order_id, po.order_date, po.order_status,
                   s.supplier_id, s.supplier_name,
                   r.restaurant_id, r.restaurant_name,
                   COUNT(oi.order_item_id) AS item_count,
                   NVL(SUM(oi.total_cost), 0) AS order_total
            FROM purchase_order po
            JOIN supplier s ON po.supplier_id = s.supplier_id
            JOIN restaurant r ON po.restaurant_id = r.restaurant_id
            LEFT JOIN order_item oi ON po.order_id = oi.order_id
            WHERE 1=1
        `;
        const binds = {};
        if (status && status !== 'All') {
            sql += ` AND UPPER(po.order_status) = UPPER(:status) `;
            binds.status = status;
        }
        if (supplier_id && supplier_id !== 'All') {
            sql += ` AND po.supplier_id = :sid `;
            binds.sid = Number(supplier_id);
        }
        if (restaurant_id && restaurant_id !== 'All') {
            sql += ` AND po.restaurant_id = :rid `;
            binds.rid = Number(restaurant_id);
        }
        if (q && q.trim()) {
            sql += ` AND (LOWER(s.supplier_name) LIKE :q OR LOWER(r.restaurant_name) LIKE :q OR TO_CHAR(po.order_id) LIKE :q) `;
            binds.q = `%${q.trim().toLowerCase()}%`;
        }

        sql += ` GROUP BY po.order_id, po.order_date, po.order_status, s.supplier_id, s.supplier_name, r.restaurant_id, r.restaurant_name
                 ORDER BY po.order_date DESC, po.order_id DESC `;

        const result = await connection.execute(sql, binds);
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.get('/orders/:id', async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await db.getConnection();

        const orderRes = await connection.execute(
            `SELECT po.*, s.supplier_name, s.contact_no AS supplier_contact,
                    r.restaurant_name, r.phone AS restaurant_phone
             FROM purchase_order po
             JOIN supplier s ON po.supplier_id = s.supplier_id
             JOIN restaurant r ON po.restaurant_id = r.restaurant_id
             WHERE po.order_id = :id`,
            { id: Number(id) }
        );
        if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Order not found.' });

        const itemsRes = await connection.execute(
            `SELECT oi.order_item_id, oi.quantity, oi.total_cost,
                    p.product_id, p.product_name, p.category, p.unit_cost
             FROM order_item oi
             JOIN product p ON oi.product_id = p.product_id
             WHERE oi.order_id = :id`,
            { id: Number(id) }
        );

        res.json({ order: orderRes.rows[0], items: itemsRes.rows });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.put('/orders/:id/status', async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        connection = await db.getConnection();

        const orderCheck = await connection.execute(
            `SELECT order_id, order_status FROM purchase_order WHERE order_id = :id`,
            { id: Number(id) }
        );
        if (orderCheck.rows.length === 0) return res.status(404).json({ error: 'Order not found.' });

        const previousStatus = orderCheck.rows[0].ORDER_STATUS;

        await connection.execute(
            `UPDATE purchase_order SET order_status = :status WHERE order_id = :id`,
            { status, id: Number(id) }
        );

        logAdminAction(req.user.email, 'UPDATE_ORDER_STATUS', {
            orderId: id,
            previousStatus,
            newStatus: status
        });

        res.json({ message: 'Order status updated successfully.', order_status: status });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// 8. USER ACCOUNT MANAGEMENT
// GET, PUT /:id/toggle-status, POST /:id/reset-password
// ─────────────────────────────────────────────────────────────
router.get('/users', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        // NEVER SELECT PASSWORD_HASH
        const result = await connection.execute(`
            SELECT l.login_id, l.email, l.role, l.is_active, l.created_at,
                   l.supplier_id, s.supplier_name,
                   l.restaurant_id, r.restaurant_name
            FROM login l
            LEFT JOIN supplier s ON l.supplier_id = s.supplier_id
            LEFT JOIN restaurant r ON l.restaurant_id = r.restaurant_id
            ORDER BY l.login_id DESC
        `);
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.put('/users/:id/toggle-status', async (req, res, next) => {
    let connection;
    try {
        const targetId = Number(req.params.id);

        // Security check: Protect administrator from accidentally removing their own access
        if (req.user.loginId === targetId) {
            return res.status(400).json({
                error: 'Security Policy: You cannot deactivate your own administrator account while logged in.'
            });
        }

        connection = await db.getConnection();
        const userRes = await connection.execute(
            `SELECT login_id, email, role, is_active FROM login WHERE login_id = :id`,
            { id: targetId }
        );
        if (userRes.rows.length === 0) return res.status(404).json({ error: 'User account not found.' });

        const currentStatus = userRes.rows[0].IS_ACTIVE;
        const newStatus = currentStatus === 1 ? 0 : 1;

        await connection.execute(
            `UPDATE login SET is_active = :status WHERE login_id = :id`,
            { status: newStatus, id: targetId }
        );

        logAdminAction(req.user.email, 'TOGGLE_USER_STATUS', {
            targetLoginId: targetId,
            targetEmail: userRes.rows[0].EMAIL,
            targetRole: userRes.rows[0].ROLE,
            newStatus: newStatus === 1 ? 'ACTIVE' : 'INACTIVE'
        });

        res.json({
            message: `Account ${userRes.rows[0].EMAIL} ${newStatus === 1 ? 'activated' : 'deactivated'} successfully.`,
            is_active: newStatus
        });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.post('/users/:id/reset-password', async (req, res, next) => {
    let connection;
    try {
        const targetId = Number(req.params.id);
        const { new_password } = req.body;

        if (!new_password || new_password.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
        }

        connection = await db.getConnection();
        const userRes = await connection.execute(
            `SELECT login_id, email, role FROM login WHERE login_id = :id`,
            { id: targetId }
        );
        if (userRes.rows.length === 0) return res.status(404).json({ error: 'User account not found.' });

        const newHash = await bcrypt.hash(new_password, 12);

        await connection.execute(
            `UPDATE login SET password_hash = :hash WHERE login_id = :id`,
            { hash: newHash, id: targetId }
        );

        logAdminAction(req.user.email, 'RESET_USER_PASSWORD', {
            targetLoginId: targetId,
            targetEmail: userRes.rows[0].EMAIL,
            targetRole: userRes.rows[0].ROLE
        });

        res.json({ message: `Password for ${userRes.rows[0].EMAIL} has been reset successfully.` });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// 9. REPORTS AND ANALYTICS
// GET /api/admin-portal/reports
// ─────────────────────────────────────────────────────────────
router.get('/reports', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();

        const [monthlySpendingRes, categoryStockRes, supplierPerformanceRes] = await Promise.all([
            // Order spend by month
            connection.execute(`
                SELECT TO_CHAR(po.order_date, 'YYYY-MM') AS month_label,
                       COUNT(DISTINCT po.order_id) AS total_orders,
                       NVL(SUM(oi.total_cost), 0) AS total_spend
                FROM purchase_order po
                LEFT JOIN order_item oi ON po.order_id = oi.order_id
                GROUP BY TO_CHAR(po.order_date, 'YYYY-MM')
                ORDER BY month_label ASC
            `),
            // Stock by category
            connection.execute(`
                SELECT p.category,
                       COUNT(DISTINCT p.product_id) AS product_count,
                       NVL(SUM(i.stock_qty), 0) AS total_qty
                FROM product p
                LEFT JOIN inventory i ON p.product_id = i.product_id
                GROUP BY p.category
                ORDER BY total_qty DESC
            `),
            // Top suppliers by order volume
            connection.execute(`
                SELECT s.supplier_name,
                       COUNT(DISTINCT po.order_id) AS orders_fulfilled,
                       NVL(SUM(oi.total_cost), 0) AS volume_value
                FROM supplier s
                LEFT JOIN purchase_order po ON s.supplier_id = po.supplier_id
                LEFT JOIN order_item oi ON po.order_id = oi.order_id
                GROUP BY s.supplier_name
                ORDER BY volume_value DESC
            `)
        ]);

        res.json({
            monthlySpending:     monthlySpendingRes.rows,
            categoryStock:       categoryStockRes.rows,
            supplierPerformance: supplierPerformanceRes.rows
        });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

module.exports = router;

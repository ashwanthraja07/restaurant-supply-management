const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        
        // Use parallel queries for dashboard summary
        const queries = {
            totalSuppliers: 'SELECT COUNT(*) AS count FROM supplier',
            totalRestaurants: 'SELECT COUNT(*) AS count FROM restaurant',
            totalWarehouses: 'SELECT COUNT(*) AS count FROM warehouse',
            totalProducts: 'SELECT COUNT(*) AS count FROM product',
            totalOrders: 'SELECT COUNT(*) AS count FROM purchase_order',
            totalInventoryUnits: 'SELECT SUM(stock_qty) AS sum FROM inventory',
            pendingOrders: "SELECT COUNT(*) AS count FROM purchase_order WHERE UPPER(order_status) = 'PENDING'",
            lowStockProducts: 'SELECT COUNT(*) AS count FROM inventory WHERE stock_qty <= reorder_level',
            recentOrders: `
                SELECT * FROM (
                    SELECT po.order_id, po.order_date, po.order_status, r.restaurant_name 
                    FROM purchase_order po 
                    JOIN restaurant r ON po.restaurant_id = r.restaurant_id 
                    ORDER BY po.order_date DESC 
                ) WHERE ROWNUM <= 5
            `,
            ordersByStatus: 'SELECT order_status, COUNT(*) as count FROM purchase_order GROUP BY order_status',
            stockByWarehouse: 'SELECT w.warehouse_name, SUM(i.stock_qty) as total_stock FROM inventory i JOIN warehouse w ON i.warehouse_id = w.warehouse_id GROUP BY w.warehouse_name',
            productsByCategory: 'SELECT category, COUNT(*) as count FROM product GROUP BY category',
            highestCostProducts: 'SELECT * FROM (SELECT product_name, unit_cost FROM product ORDER BY unit_cost DESC) WHERE ROWNUM <= 5',
            lowStockAlerts: `
                SELECT i.inventory_id, p.product_name, w.warehouse_name, i.stock_qty, i.reorder_level
                FROM inventory i
                JOIN product p ON i.product_id = p.product_id
                JOIN warehouse w ON i.warehouse_id = w.warehouse_id
                WHERE i.stock_qty <= i.reorder_level
            `
        };

        const results = {};
        for (const [key, query] of Object.entries(queries)) {
            const result = await connection.execute(query);
            if (key === 'recentOrders' || key === 'ordersByStatus' || key === 'stockByWarehouse' || key === 'productsByCategory' || key === 'highestCostProducts' || key === 'lowStockAlerts') {
                results[key] = result.rows;
            } else {
                results[key] = result.rows[0].COUNT || result.rows[0].SUM || 0;
            }
        }
        
        res.json(results);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

module.exports = router;

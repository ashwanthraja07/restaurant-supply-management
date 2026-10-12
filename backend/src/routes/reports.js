const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        
        const reports = {};
        
        reports.productCostSummary = (await connection.execute(`
            SELECT COUNT(*) AS total_products, AVG(unit_cost) AS average_cost, 
                   MIN(unit_cost) AS min_cost, MAX(unit_cost) AS max_cost 
            FROM product
        `)).rows;

        reports.supplierProductCounts = (await connection.execute(`
            SELECT s.supplier_name, COUNT(p.product_id) AS total_products 
            FROM supplier s 
            LEFT JOIN product p ON s.supplier_id = p.supplier_id 
            GROUP BY s.supplier_name
        `)).rows;
        
        reports.restaurantOrderCounts = (await connection.execute(`
            SELECT r.restaurant_name, COUNT(po.order_id) AS total_orders 
            FROM restaurant r 
            LEFT JOIN purchase_order po ON r.restaurant_id = po.restaurant_id 
            GROUP BY r.restaurant_name
        `)).rows;

        reports.productsAboveAverageCost = (await connection.execute(`
            SELECT product_name, unit_cost 
            FROM product 
            WHERE unit_cost > (SELECT AVG(unit_cost) FROM product)
        `)).rows;

        res.json(reports);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

module.exports = router;

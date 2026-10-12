const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(`
            SELECT po.*, s.supplier_name, r.restaurant_name 
            FROM purchase_order po
            JOIN supplier s ON po.supplier_id = s.supplier_id
            JOIN restaurant r ON po.restaurant_id = r.restaurant_id
            ORDER BY po.order_id
        `);
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.get('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(`
            SELECT po.*, s.supplier_name, r.restaurant_name 
            FROM purchase_order po
            JOIN supplier s ON po.supplier_id = s.supplier_id
            JOIN restaurant r ON po.restaurant_id = r.restaurant_id
            WHERE po.order_id = :id
        `, [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.post('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { order_id, order_date, supplier_id, restaurant_id, order_status } = req.body;
        await connection.execute(
            `INSERT INTO purchase_order (order_id, order_date, supplier_id, restaurant_id, order_status) 
             VALUES (:id, TO_DATE(:dt, 'YYYY-MM-DD'), :sup, :rest, :status)`,
            {
                id: order_id,
                dt: order_date.substring(0, 10),
                sup: supplier_id,
                rest: restaurant_id,
                status: order_status || 'Pending'
            }
        );
        res.status(201).json({ message: 'Order created' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.put('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { order_date, supplier_id, restaurant_id, order_status } = req.body;
        const result = await connection.execute(
            `UPDATE purchase_order SET order_date = TO_DATE(:dt, 'YYYY-MM-DD'), supplier_id = :sup, restaurant_id = :rest, order_status = :status 
             WHERE order_id = :id`,
            {
                dt: order_date.substring(0, 10),
                sup: supplier_id,
                rest: restaurant_id,
                status: order_status,
                id: req.params.id
            }
        );
        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Order not found' });
        res.json({ message: 'Order updated' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.delete('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute('DELETE FROM purchase_order WHERE order_id = :id', [req.params.id]);
        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Order not found' });
        res.json({ message: 'Order deleted' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

module.exports = router;

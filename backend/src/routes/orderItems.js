const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(`
            SELECT oi.*, p.product_name, p.unit_cost
            FROM order_item oi
            JOIN product p ON oi.product_id = p.product_id
            ORDER BY oi.order_item_id
        `);
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.get('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute('SELECT * FROM order_item WHERE order_item_id = :id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Order item not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.post('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { order_item_id, order_id, product_id, quantity, total_cost } = req.body;
        await connection.execute(
            `INSERT INTO order_item (order_item_id, order_id, product_id, quantity, total_cost) 
             VALUES (:id, :oid, :pid, :qty, :cost)`,
            [order_item_id, order_id, product_id, quantity, total_cost]
        );
        res.status(201).json({ message: 'Order item created' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.put('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { order_id, product_id, quantity, total_cost } = req.body;
        const result = await connection.execute(
            `UPDATE order_item SET order_id = :oid, product_id = :pid, quantity = :qty, total_cost = :cost 
             WHERE order_item_id = :id`,
            [order_id, product_id, quantity, total_cost, req.params.id]
        );
        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Order item not found' });
        res.json({ message: 'Order item updated' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.delete('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute('DELETE FROM order_item WHERE order_item_id = :id', [req.params.id]);
        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Order item not found' });
        res.json({ message: 'Order item deleted' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

module.exports = router;

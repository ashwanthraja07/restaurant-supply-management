const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(`
            SELECT i.*, p.product_name, w.warehouse_name 
            FROM inventory i
            JOIN product p ON i.product_id = p.product_id
            JOIN warehouse w ON i.warehouse_id = w.warehouse_id
            ORDER BY i.inventory_id
        `);
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.get('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute('SELECT * FROM inventory WHERE inventory_id = :id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Inventory record not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.post('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { inventory_id, product_id, warehouse_id, stock_qty, reorder_level } = req.body;
        await connection.execute(
            `INSERT INTO inventory (inventory_id, product_id, warehouse_id, stock_qty, reorder_level) 
             VALUES (:id, :prod, :wh, :qty, :reorder)`,
            [inventory_id, product_id, warehouse_id, stock_qty, reorder_level]
        );
        res.status(201).json({ message: 'Inventory record created' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.put('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { product_id, warehouse_id, stock_qty, reorder_level } = req.body;
        const result = await connection.execute(
            `UPDATE inventory SET product_id = :prod, warehouse_id = :wh, stock_qty = :qty, reorder_level = :reorder 
             WHERE inventory_id = :id`,
            [product_id, warehouse_id, stock_qty, reorder_level, req.params.id]
        );
        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Inventory record not found' });
        res.json({ message: 'Inventory updated' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.delete('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute('DELETE FROM inventory WHERE inventory_id = :id', [req.params.id]);
        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Inventory record not found' });
        res.json({ message: 'Inventory deleted' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

module.exports = router;

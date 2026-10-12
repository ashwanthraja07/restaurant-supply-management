const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute('SELECT * FROM warehouse ORDER BY warehouse_id');
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.get('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute('SELECT * FROM warehouse WHERE warehouse_id = :id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Warehouse not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.post('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { warehouse_id, warehouse_name, city, capacity } = req.body;
        await connection.execute(
            `INSERT INTO warehouse (warehouse_id, warehouse_name, city, capacity) 
             VALUES (:id, :name, :city, :capacity)`,
            [warehouse_id, warehouse_name, city, capacity]
        );
        res.status(201).json({ message: 'Warehouse created' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.put('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { warehouse_name, city, capacity } = req.body;
        const result = await connection.execute(
            `UPDATE warehouse SET warehouse_name = :name, city = :city, capacity = :capacity 
             WHERE warehouse_id = :id`,
            [warehouse_name, city, capacity, req.params.id]
        );
        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Warehouse not found' });
        res.json({ message: 'Warehouse updated' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.delete('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute('DELETE FROM warehouse WHERE warehouse_id = :id', [req.params.id]);
        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Warehouse not found' });
        res.json({ message: 'Warehouse deleted' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

module.exports = router;

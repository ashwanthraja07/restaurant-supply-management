const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute('SELECT * FROM restaurant ORDER BY restaurant_id');
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.get('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute('SELECT * FROM restaurant WHERE restaurant_id = :id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Restaurant not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.post('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { restaurant_id, restaurant_name, city, phone } = req.body;
        await connection.execute(
            `INSERT INTO restaurant (restaurant_id, restaurant_name, city, phone) 
             VALUES (:id, :name, :city, :phone)`,
            [restaurant_id, restaurant_name, city, phone]
        );
        res.status(201).json({ message: 'Restaurant created' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.put('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { restaurant_name, city, phone } = req.body;
        const result = await connection.execute(
            `UPDATE restaurant SET restaurant_name = :name, city = :city, phone = :phone 
             WHERE restaurant_id = :id`,
            [restaurant_name, city, phone, req.params.id]
        );
        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Restaurant not found' });
        res.json({ message: 'Restaurant updated' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.delete('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute('DELETE FROM restaurant WHERE restaurant_id = :id', [req.params.id]);
        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Restaurant not found' });
        res.json({ message: 'Restaurant deleted' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

module.exports = router;

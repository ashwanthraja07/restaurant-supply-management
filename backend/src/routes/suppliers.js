const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute('SELECT * FROM supplier ORDER BY supplier_id');
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.get('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute('SELECT * FROM supplier WHERE supplier_id = :id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.post('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { supplier_id, supplier_name, contact_no, city } = req.body;
        await connection.execute(
            `INSERT INTO supplier (supplier_id, supplier_name, contact_no, city) 
             VALUES (:id, :name, :contact, :city)`,
            [supplier_id, supplier_name, contact_no, city]
        );
        res.status(201).json({ message: 'Supplier created' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.put('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { supplier_name, contact_no, city } = req.body;
        const result = await connection.execute(
            `UPDATE supplier SET supplier_name = :name, contact_no = :contact, city = :city 
             WHERE supplier_id = :id`,
            [supplier_name, contact_no, city, req.params.id]
        );
        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Supplier not found' });
        res.json({ message: 'Supplier updated' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.delete('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute('DELETE FROM supplier WHERE supplier_id = :id', [req.params.id]);
        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Supplier not found' });
        res.json({ message: 'Supplier deleted' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

module.exports = router;

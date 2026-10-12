const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(`
            SELECT p.*, s.supplier_name 
            FROM product p 
            LEFT JOIN supplier s ON p.supplier_id = s.supplier_id
            ORDER BY p.product_id
        `);
        res.json(result.rows);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.get('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute('SELECT * FROM product WHERE product_id = :id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(result.rows[0]);
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.post('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { product_id, product_name, category, unit_cost, supplier_id } = req.body;
        await connection.execute(
            `INSERT INTO product (product_id, product_name, category, unit_cost, supplier_id) 
             VALUES (:id, :name, :cat, :cost, :sup)`,
            [product_id, product_name, category, unit_cost, supplier_id]
        );
        res.status(201).json({ message: 'Product created' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.put('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { product_name, category, unit_cost, supplier_id } = req.body;
        const result = await connection.execute(
            `UPDATE product SET product_name = :name, category = :cat, unit_cost = :cost, supplier_id = :sup 
             WHERE product_id = :id`,
            [product_name, category, unit_cost, supplier_id, req.params.id]
        );
        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Product not found' });
        res.json({ message: 'Product updated' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

router.delete('/:id', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute('DELETE FROM product WHERE product_id = :id', [req.params.id]);
        if (result.rowsAffected === 0) return res.status(404).json({ error: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

module.exports = router;

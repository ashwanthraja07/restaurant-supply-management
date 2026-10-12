const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', (req, res) => {
    res.json({ status: 'UP' });
});

router.get('/db', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute('SELECT 1 FROM dual');
        if (result.rows && result.rows.length > 0) {
            res.json({ status: 'UP', message: 'Oracle Database connected' });
        } else {
            res.status(500).json({ status: 'DOWN', error: 'Query failed' });
        }
    } catch (err) {
        res.status(500).json({ status: 'DOWN', error: err.message });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});

module.exports = router;

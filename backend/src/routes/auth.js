const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { generateToken } = require('../middleware/auth');

const SALT_ROUNDS = 12;

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password, role }
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
    let connection;
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ error: 'Email, password, and role are required.' });
        }
        const requestedRole = role.toUpperCase();
        if (!['ADMIN', 'SUPPLIER', 'RESTAURANT'].includes(requestedRole)) {
            return res.status(400).json({ error: 'Invalid role. Must be ADMIN, SUPPLIER, or RESTAURANT.' });
        }

        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT * FROM login WHERE LOWER(email) = LOWER(:email)`,
            { email: email.trim() }
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const loginRecord = result.rows[0];

        // Never trust frontend role without validating against authenticated DB record
        if (loginRecord.ROLE !== requestedRole) {
            return res.status(403).json({
                error: `This account is a ${loginRecord.ROLE} account. Please select "${loginRecord.ROLE}" to sign in.`
            });
        }

        if (!loginRecord.IS_ACTIVE) {
            return res.status(403).json({ error: 'Account is inactive or disabled. Please contact the administrator.' });
        }

        const passwordMatch = await bcrypt.compare(password, loginRecord.PASSWORD_HASH);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = generateToken(loginRecord);

        let redirectUrl = '/admin/dashboard';
        if (loginRecord.ROLE === 'SUPPLIER') redirectUrl = '/supplier/dashboard';
        else if (loginRecord.ROLE === 'RESTAURANT') redirectUrl = '/restaurant/dashboard';

        res.json({
            token,
            redirectUrl,
            user: {
                loginId:      loginRecord.LOGIN_ID,
                email:        loginRecord.EMAIL,
                role:         loginRecord.ROLE,
                supplierId:   loginRecord.SUPPLIER_ID   || null,
                restaurantId: loginRecord.RESTAURANT_ID || null,
            }
        });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register/supplier
// Body: { email, password, supplier_name, contact_no, city }
// ─────────────────────────────────────────────────────────────
router.post('/register/supplier', async (req, res, next) => {
    let connection;
    try {
        const { email, password, supplier_name, contact_no, city } = req.body;

        // Validate required fields
        if (!email || !password || !supplier_name) {
            return res.status(400).json({ error: 'Email, password, and supplier name are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        connection = await db.getConnection();

        // Check email uniqueness
        const emailCheck = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM login WHERE LOWER(email) = LOWER(:email)`,
            { email: email.trim() }
        );
        if (emailCheck.rows[0].CNT > 0) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        // Get next IDs
        const supplierIdRes = await connection.execute(
            `SELECT NVL(MAX(supplier_id), 0) + 1 AS next_id FROM supplier`
        );
        const loginIdRes = await connection.execute(
            `SELECT login_seq.NEXTVAL AS next_id FROM DUAL`
        );

        const supplierId = supplierIdRes.rows[0].NEXT_ID;
        const loginId    = loginIdRes.rows[0].NEXT_ID;

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Disable autoCommit for manual transaction
        const conn = connection;
        await conn.execute(`SET TRANSACTION NAME 'supplier_register'`).catch(() => {});

        try {
            // Insert supplier
            await conn.execute(
                `INSERT INTO supplier (supplier_id, supplier_name, contact_no, city)
                 VALUES (:id, :name, :contact, :city)`,
                { id: supplierId, name: supplier_name, contact: contact_no || null, city: city || null },
                { autoCommit: false }
            );

            // Insert login
            await conn.execute(
                `INSERT INTO login (login_id, email, password_hash, role, supplier_id, restaurant_id, is_active)
                 VALUES (:lid, :email, :hash, 'SUPPLIER', :sid, NULL, 1)`,
                { lid: loginId, email: email.trim().toLowerCase(), hash: passwordHash, sid: supplierId },
                { autoCommit: false }
            );

            await conn.commit();
        } catch (txErr) {
            await conn.rollback();
            throw txErr;
        }

        // Fetch the created login record for token generation
        const newLogin = await connection.execute(
            `SELECT * FROM login WHERE login_id = :id`,
            { id: loginId }
        );
        const loginRecord = newLogin.rows[0];
        const token = generateToken(loginRecord);

        res.status(201).json({
            message: 'Supplier account created successfully.',
            token,
            user: {
                loginId:    loginRecord.LOGIN_ID,
                email:      loginRecord.EMAIL,
                role:       loginRecord.ROLE,
                supplierId: loginRecord.SUPPLIER_ID,
            }
        });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register/restaurant
// Body: { email, password, restaurant_name, city, phone }
// ─────────────────────────────────────────────────────────────
router.post('/register/restaurant', async (req, res, next) => {
    let connection;
    try {
        const { email, password, restaurant_name, city, phone } = req.body;

        if (!email || !password || !restaurant_name) {
            return res.status(400).json({ error: 'Email, password, and restaurant name are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        connection = await db.getConnection();

        // Check email uniqueness
        const emailCheck = await connection.execute(
            `SELECT COUNT(*) AS cnt FROM login WHERE LOWER(email) = LOWER(:email)`,
            { email: email.trim() }
        );
        if (emailCheck.rows[0].CNT > 0) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        // Get next IDs
        const restaurantIdRes = await connection.execute(
            `SELECT NVL(MAX(restaurant_id), 0) + 1 AS next_id FROM restaurant`
        );
        const loginIdRes = await connection.execute(
            `SELECT login_seq.NEXTVAL AS next_id FROM DUAL`
        );

        const restaurantId = restaurantIdRes.rows[0].NEXT_ID;
        const loginId      = loginIdRes.rows[0].NEXT_ID;

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const conn = connection;
        try {
            // Insert restaurant
            await conn.execute(
                `INSERT INTO restaurant (restaurant_id, restaurant_name, city, phone)
                 VALUES (:id, :name, :city, :phone)`,
                { id: restaurantId, name: restaurant_name, city: city || null, phone: phone || null },
                { autoCommit: false }
            );

            // Insert login
            await conn.execute(
                `INSERT INTO login (login_id, email, password_hash, role, supplier_id, restaurant_id, is_active)
                 VALUES (:lid, :email, :hash, 'RESTAURANT', NULL, :rid, 1)`,
                { lid: loginId, email: email.trim().toLowerCase(), hash: passwordHash, rid: restaurantId },
                { autoCommit: false }
            );

            await conn.commit();
        } catch (txErr) {
            await conn.rollback();
            throw txErr;
        }

        const newLogin = await connection.execute(
            `SELECT * FROM login WHERE login_id = :id`,
            { id: loginId }
        );
        const loginRecord = newLogin.rows[0];
        const token = generateToken(loginRecord);

        res.status(201).json({
            message: 'Restaurant account created successfully.',
            token,
            user: {
                loginId:      loginRecord.LOGIN_ID,
                email:        loginRecord.EMAIL,
                role:         loginRecord.ROLE,
                restaurantId: loginRecord.RESTAURANT_ID,
            }
        });
    } catch (err) { next(err); } finally { if (connection) await connection.close(); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me  — verify token and return user info
// ─────────────────────────────────────────────────────────────
const { authenticate } = require('../middleware/auth');
router.get('/me', authenticate, async (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;

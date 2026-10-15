/**
 * create_admin.js — Secure provisioning script for Administrator accounts.
 * 
 * Usage:
 *   node scripts/create_admin.js <email> <password>
 * 
 * Example:
 *   node scripts/create_admin.js root@supplyflow.com StrongAdminPass!2026
 */
const db = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    const args = process.argv.slice(2);
    const email = args[0] || process.env.NEW_ADMIN_EMAIL;
    const password = args[1] || process.env.NEW_ADMIN_PASSWORD;

    if (!email || !password) {
        console.error('Usage: node scripts/create_admin.js <email> <password>');
        process.exit(1);
    }

    if (password.length < 8) {
        console.error('Error: Admin password must be at least 8 characters long.');
        process.exit(1);
    }

    await db.initialize();
    let conn;
    try {
        conn = await db.getConnection();

        // Check if email is already taken
        const existing = await conn.execute(
            `SELECT login_id, role FROM login WHERE LOWER(email) = LOWER(:email)`,
            { email: email.trim() }
        );

        if (existing.rows.length > 0) {
            console.error(`Error: An account with email "${email}" already exists with role: ${existing.rows[0].ROLE}`);
            process.exit(1);
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const loginIdRes = await conn.execute(`SELECT login_seq.NEXTVAL AS next_id FROM DUAL`);
        const loginId = loginIdRes.rows[0].NEXT_ID;

        await conn.execute(
            `INSERT INTO login (login_id, email, password_hash, role, supplier_id, restaurant_id, is_active)
             VALUES (:lid, :email, :hash, 'ADMIN', NULL, NULL, 1)`,
            { lid: loginId, email: email.toLowerCase().trim(), hash: passwordHash }
        );

        console.log(`✅ Administrator account created successfully:`);
        console.log(`   Email: ${email.toLowerCase().trim()}`);
        console.log(`   Role: ADMIN`);
        console.log(`   Login ID: ${loginId}`);
    } catch (err) {
        console.error('Failed to create administrator account:', err.message);
    } finally {
        if (conn) await conn.close();
        await db.close();
    }
}

createAdmin();

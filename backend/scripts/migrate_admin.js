const db = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function migrate() {
    await db.initialize();
    let conn;
    try {
        conn = await db.getConnection();
        console.log('Connected to Oracle Database for ADMIN role migration.');

        // Drop existing check constraints if present
        const constraintsToDrop = ['CHK_LOGIN_ROLE', 'CHK_LOGIN_ONE_REF', 'CHK_LOGIN_ROLE_REF'];
        for (const cName of constraintsToDrop) {
            try {
                await conn.execute(`ALTER TABLE login DROP CONSTRAINT ${cName}`);
                console.log(`Dropped constraint: ${cName}`);
            } catch (err) {
                console.log(`Note on dropping ${cName}: ${err.message}`);
            }
        }

        // Add updated constraints supporting ADMIN, SUPPLIER, RESTAURANT
        try {
            await conn.execute(`
                ALTER TABLE login ADD CONSTRAINT chk_login_role
                CHECK (role IN ('ADMIN', 'SUPPLIER', 'RESTAURANT'))
            `);
            console.log('Added updated constraint: chk_login_role');
        } catch (err) {
            console.error('Error adding chk_login_role:', err.message);
        }

        try {
            await conn.execute(`
                ALTER TABLE login ADD CONSTRAINT chk_login_role_ref
                CHECK (
                    (role = 'ADMIN' AND supplier_id IS NULL AND restaurant_id IS NULL) OR
                    (role = 'SUPPLIER' AND supplier_id IS NOT NULL AND restaurant_id IS NULL) OR
                    (role = 'RESTAURANT' AND restaurant_id IS NOT NULL AND supplier_id IS NULL)
                )
            `);
            console.log('Added updated constraint: chk_login_role_ref');
        } catch (err) {
            console.error('Error adding chk_login_role_ref:', err.message);
        }

        // Check if an ADMIN user already exists
        const adminCheck = await conn.execute(
            `SELECT login_id, email FROM login WHERE role = 'ADMIN'`
        );

        if (adminCheck.rows.length === 0) {
            console.log('No administrator account found. Provisioning initial admin account...');
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@supplyflow.com';
            const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
            const passwordHash = await bcrypt.hash(adminPassword, 12);

            const loginIdRes = await conn.execute(`SELECT login_seq.NEXTVAL AS next_id FROM DUAL`);
            const loginId = loginIdRes.rows[0].NEXT_ID;

            await conn.execute(
                `INSERT INTO login (login_id, email, password_hash, role, supplier_id, restaurant_id, is_active)
                 VALUES (:lid, :email, :hash, 'ADMIN', NULL, NULL, 1)`,
                { lid: loginId, email: adminEmail.toLowerCase().trim(), hash: passwordHash }
            );
            console.log(`Administrator account provisioned:`);
            console.log(`  Email: ${adminEmail}`);
            console.log(`  Default Password: ${adminPassword} (Change in profile or reset as needed)`);
        } else {
            console.log(`Existing administrator account found: ${adminCheck.rows[0].EMAIL}`);
        }

        console.log('Admin migration successfully completed.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        if (conn) await conn.close();
        await db.close();
    }
}

migrate();

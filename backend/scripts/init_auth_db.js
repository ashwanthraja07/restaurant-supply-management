const db = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function main() {
    await db.initialize();
    let conn;
    try {
        conn = await db.getConnection();
        console.log('Connected to Oracle database.');

        // Check if LOGIN table exists
        const checkTable = await conn.execute(
            `SELECT table_name FROM user_tables WHERE table_name = 'LOGIN'`
        );

        if (checkTable.rows.length === 0) {
            console.log('LOGIN table does not exist. Creating LOGIN table...');
            await conn.execute(`
                CREATE TABLE login (
                    login_id      NUMBER PRIMARY KEY,
                    email         VARCHAR2(150) NOT NULL,
                    password_hash VARCHAR2(255) NOT NULL,
                    role          VARCHAR2(20)  NOT NULL,
                    supplier_id   NUMBER,
                    restaurant_id NUMBER,
                    created_at    DATE DEFAULT SYSDATE,
                    is_active     NUMBER(1) DEFAULT 1,
                    CONSTRAINT fk_login_supplier   FOREIGN KEY (supplier_id)   REFERENCES supplier(supplier_id),
                    CONSTRAINT fk_login_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurant(restaurant_id),
                    CONSTRAINT uq_login_email      UNIQUE (email),
                    CONSTRAINT chk_login_role      CHECK (role IN ('SUPPLIER', 'RESTAURANT')),
                    CONSTRAINT chk_login_one_ref   CHECK (
                        (supplier_id IS NOT NULL AND restaurant_id IS NULL) OR
                        (supplier_id IS NULL AND restaurant_id IS NOT NULL)
                    ),
                    CONSTRAINT chk_login_role_ref  CHECK (
                        (role = 'SUPPLIER'   AND supplier_id   IS NOT NULL AND restaurant_id IS NULL) OR
                        (role = 'RESTAURANT' AND restaurant_id IS NOT NULL AND supplier_id   IS NULL)
                    )
                )
            `);
            console.log('LOGIN table created successfully.');

            // Sequence
            try {
                await conn.execute(`
                    CREATE SEQUENCE login_seq
                        START WITH 1
                        INCREMENT BY 1
                        NOCACHE
                        NOCYCLE
                `);
                console.log('login_seq sequence created.');
            } catch (seqErr) {
                console.log('Sequence may already exist:', seqErr.message);
            }

            // Indexes
            try {
                await conn.execute(`CREATE INDEX idx_login_email ON login (email)`);
                await conn.execute(`CREATE INDEX idx_login_role ON login (role)`);
            } catch (idxErr) {
                console.log('Index note:', idxErr.message);
            }
        } else {
            console.log('LOGIN table already exists.');
        }

        // Check existing users in login table
        const users = await conn.execute(`SELECT email, role, supplier_id, restaurant_id FROM login`);
        console.log(`Current login accounts (${users.rows.length}):`);
        users.rows.forEach(u => console.log(` - ${u.EMAIL} [${u.ROLE}] (Sup: ${u.SUPPLIER_ID}, Rest: ${u.RESTAURANT_ID})`));

        // If no login records, create demo accounts linked to existing suppliers / restaurants
        if (users.rows.length === 0) {
            console.log('Seeding demo login accounts...');
            const defaultHash = await bcrypt.hash('password123', 12);

            // Check if suppliers exist
            const sups = await conn.execute(`SELECT supplier_id, supplier_name FROM supplier WHERE ROWNUM <= 2`);
            for (const s of sups.rows) {
                const email = `supplier${s.SUPPLIER_ID}@supplyflow.com`;
                await conn.execute(
                    `INSERT INTO login (login_id, email, password_hash, role, supplier_id, restaurant_id, is_active)
                     VALUES (login_seq.NEXTVAL, :email, :hash, 'SUPPLIER', :sid, NULL, 1)`,
                    { email, hash: defaultHash, sid: s.SUPPLIER_ID }
                );
                console.log(`Created demo supplier account: ${email} (Password: password123) for ${s.SUPPLIER_NAME}`);
            }

            // Check if restaurants exist
            const rests = await conn.execute(`SELECT restaurant_id, restaurant_name FROM restaurant WHERE ROWNUM <= 2`);
            for (const r of rests.rows) {
                const email = `restaurant${r.RESTAURANT_ID}@supplyflow.com`;
                await conn.execute(
                    `INSERT INTO login (login_id, email, password_hash, role, supplier_id, restaurant_id, is_active)
                     VALUES (login_seq.NEXTVAL, :email, :hash, 'RESTAURANT', NULL, :rid, 1)`,
                    { email, hash: defaultHash, rid: r.RESTAURANT_ID }
                );
                console.log(`Created demo restaurant account: ${email} (Password: password123) for ${r.RESTAURANT_NAME}`);
            }
        }

        console.log('Database initialization & verification complete.');
    } catch (err) {
        console.error('Database migration error:', err);
    } finally {
        if (conn) await conn.close();
        await db.close();
    }
}

main();

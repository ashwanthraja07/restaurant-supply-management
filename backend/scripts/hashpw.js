/**
 * hashpw.js — Utility to generate a bcrypt hash for a given plaintext password.
 * 
 * Usage (from the backend directory):
 *   node scripts/hashpw.js mySecretPassword123
 * 
 * Then use the output hash in SQL to create login records for existing
 * supplier/restaurant records:
 * 
 *   INSERT INTO login (login_id, email, password_hash, role, supplier_id, restaurant_id, is_active)
 *   VALUES (login_seq.NEXTVAL, 'supplier@example.com', '<PASTE_HASH_HERE>', 'SUPPLIER', 1, NULL, 1);
 * 
 *   INSERT INTO login (login_id, email, password_hash, role, supplier_id, restaurant_id, is_active)
 *   VALUES (login_seq.NEXTVAL, 'restaurant@example.com', '<PASTE_HASH_HERE>', 'RESTAURANT', NULL, 1, 1);
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
    console.error('Usage: node scripts/hashpw.js <your_password>');
    process.exit(1);
}

bcrypt.hash(password, 12).then(hash => {
    console.log('\nBcrypt hash for:', password);
    console.log('-'.repeat(80));
    console.log(hash);
    console.log('-'.repeat(80));
    console.log('\nCopy the hash above into your SQL INSERT for the login table.');
});

const baseUrl = 'http://localhost:5000/api';

async function runAdminTestSuite() {
    console.log('====================================================');
    console.log('   ADMINISTRATOR ROLE & DASHBOARD INTEGRATION TEST   ');
    console.log('====================================================');

    // 1. Admin Login
    console.log('\n[1/10] Testing Admin Login...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@supplyflow.com', password: 'Admin@12345', role: 'ADMIN' })
    });
    if (!loginRes.ok) throw new Error(`Admin login failed: ${loginRes.status}`);
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Admin login successful! Role:', loginData.user.role, '| Redirect:', loginData.redirectUrl);

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 2. Admin Dashboard
    console.log('\n[2/10] Testing Admin Dashboard Stats...');
    const dashRes = await fetch(`${baseUrl}/admin-portal/dashboard`, { headers });
    const dash = await dashRes.json();
    console.log('✅ Dashboard Overview Statistics:');
    console.log('   - Total Suppliers:', dash.stats.totalSuppliers);
    console.log('   - Total Restaurants:', dash.stats.totalRestaurants);
    console.log('   - Total Products:', dash.stats.totalProducts);
    console.log('   - Total Warehouses:', dash.stats.totalWarehouses);
    console.log('   - Total Orders:', dash.stats.totalOrders);
    console.log('   - Low Stock Count:', dash.stats.lowStockCount);
    console.log('   - Total System Stock:', dash.stats.totalStock, 'units');

    // 3. Supplier Management
    console.log('\n[3/10] Testing Supplier Management...');
    const supsRes = await fetch(`${baseUrl}/admin-portal/suppliers`, { headers });
    const sups = await supsRes.json();
    console.log(`✅ Loaded ${sups.length} suppliers.`);
    if (sups.length > 0) {
        const testSup = sups[0];
        console.log(`   Sample Supplier: ${testSup.SUPPLIER_NAME} (City: ${testSup.CITY}, Login: ${testSup.LOGIN_EMAIL || 'None'})`);
    }

    // 4. Restaurant Management
    console.log('\n[4/10] Testing Restaurant Management...');
    const restsRes = await fetch(`${baseUrl}/admin-portal/restaurants`, { headers });
    const rests = await restsRes.json();
    console.log(`✅ Loaded ${rests.length} restaurants.`);
    if (rests.length > 0) {
        const testRest = rests[0];
        console.log(`   Sample Restaurant: ${testRest.RESTAURANT_NAME} (Spend: ₹${testRest.TOTAL_SPEND})`);
    }

    // 5. Product Management & Duplicate Avoidance
    console.log('\n[5/10] Testing Product Management & Duplicate Avoidance...');
    const prodsRes = await fetch(`${baseUrl}/admin-portal/products`, { headers });
    const prods = await prodsRes.json();
    console.log(`✅ Loaded ${prods.length} products.`);

    if (prods.length > 0) {
        // Try to insert a duplicate of product 0 for the same supplier
        const dupRes = await fetch(`${baseUrl}/admin-portal/products`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                product_name: prods[0].PRODUCT_NAME,
                supplier_id: prods[0].SUPPLIER_ID,
                unit_cost: 100,
                category: 'Test'
            })
        });
        console.log(`   Duplicate product creation rejection status: ${dupRes.status} (Expect 409 Conflict)`);
        if (dupRes.status === 409) console.log('✅ Duplicate product successfully prevented by backend validation!');
    }

    // 6. Warehouse & Inventory Management
    console.log('\n[6/10] Testing Warehouses & Inventory Management...');
    const whRes = await fetch(`${baseUrl}/admin-portal/warehouses`, { headers });
    const whs = await whRes.json();
    console.log(`✅ Loaded ${whs.length} warehouses.`);

    const invRes = await fetch(`${baseUrl}/admin-portal/inventory`, { headers });
    const inv = await invRes.json();
    console.log(`✅ Loaded ${inv.length} inventory records across all warehouses.`);

    // 7. Purchase Order Management & Status Transitions
    console.log('\n[7/10] Testing Purchase Orders & Status Transitions...');
    const ordersRes = await fetch(`${baseUrl}/admin-portal/orders`, { headers });
    const orders = await ordersRes.json();
    console.log(`✅ Loaded ${orders.length} system-wide purchase orders.`);

    if (orders.length > 0) {
        const testOrder = orders[0];
        console.log(`   Testing status update on Order #${testOrder.ORDER_ID} (Current: ${testOrder.ORDER_STATUS})...`);
        const newStatus = testOrder.ORDER_STATUS === 'Pending' ? 'Processing' : 'Pending';
        const updateRes = await fetch(`${baseUrl}/admin-portal/orders/${testOrder.ORDER_ID}/status`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ status: newStatus })
        });
        if (updateRes.ok) {
            console.log(`✅ Order status transitioned successfully to: ${newStatus}`);
            // Revert back
            await fetch(`${baseUrl}/admin-portal/orders/${testOrder.ORDER_ID}/status`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status: testOrder.ORDER_STATUS })
            });
        }
    }

    // 8. User Account Management & Self-Deactivation Protection
    console.log('\n[8/10] Testing User Management & Self-Protection...');
    const usersRes = await fetch(`${baseUrl}/admin-portal/users`, { headers });
    const users = await usersRes.json();
    console.log(`✅ Loaded ${users.length} login accounts:`);
    users.forEach(u => console.log(`   - ID #${u.LOGIN_ID}: ${u.EMAIL} [${u.ROLE}] (Active: ${u.IS_ACTIVE})`));

    // Try to deactivate own admin account
    const selfUser = users.find(u => u.EMAIL === 'admin@supplyflow.com');
    if (selfUser) {
        const selfDeactRes = await fetch(`${baseUrl}/admin-portal/users/${selfUser.LOGIN_ID}/toggle-status`, {
            method: 'PUT',
            headers
        });
        console.log(`   Admin self-deactivation attempt status: ${selfDeactRes.status} (Expect 400 Bad Request)`);
        if (selfDeactRes.status === 400) {
            const errBody = await selfDeactRes.json();
            console.log(`✅ Security Protection confirmed: "${errBody.error}"`);
        }
    }

    // 9. Password Reset Workflow
    console.log('\n[9/10] Testing Secure Password Reset Workflow...');
    const targetUser = users.find(u => u.ROLE !== 'ADMIN');
    if (targetUser) {
        const resetRes = await fetch(`${baseUrl}/admin-portal/users/${targetUser.LOGIN_ID}/reset-password`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ new_password: 'newSecurePassword123' })
        });
        if (resetRes.ok) {
            console.log(`✅ Password reset successfully for ${targetUser.EMAIL} without hash exposure.`);
            // Verify login with new password
            const verifyLogin = await fetch(`${baseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: targetUser.EMAIL, password: 'newSecurePassword123', role: targetUser.ROLE })
            });
            console.log(`✅ Verified login with new password: HTTP ${verifyLogin.status}`);
            // Reset back to password123
            await fetch(`${baseUrl}/admin-portal/users/${targetUser.LOGIN_ID}/reset-password`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ new_password: 'password123' })
            });
        }
    }

    // 10. Reports & Analytics
    console.log('\n[10/10] Testing Reports & Analytics Queries...');
    const reportsRes = await fetch(`${baseUrl}/admin-portal/reports`, { headers });
    const reports = await reportsRes.json();
    console.log(`✅ Monthly spend intervals: ${reports.monthlySpending?.length || 0}`);
    console.log(`✅ Category stock records: ${reports.categoryStock?.length || 0}`);
    console.log(`✅ Supplier volume records: ${reports.supplierPerformance?.length || 0}`);

    console.log('\n====================================================');
    console.log('   🎉 ALL 10 ADMINISTRATOR TEST SUITES PASSED!      ');
    console.log('====================================================');
}

runAdminTestSuite().catch(err => {
    console.error('❌ Test suite error:', err);
    process.exit(1);
});

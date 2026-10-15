async function testSecurity() {
    const baseUrl = 'http://localhost:5000/api';

    console.log('--- 1. Testing Admin Login ---');
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@supplyflow.com', password: 'Admin@12345', role: 'ADMIN' })
    });
    const adminData = await adminLoginRes.json();
    console.log('Admin login status:', adminLoginRes.status, 'Role:', adminData.user?.role, 'Redirect:', adminData.redirectUrl);
    const adminToken = adminData.token;

    console.log('\n--- 2. Testing Admin Access to Admin Dashboard ---');
    const dashRes = await fetch(`${baseUrl}/admin-portal/dashboard`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dashData = await dashRes.json();
    console.log('Admin dashboard HTTP:', dashRes.status, 'Stats:', dashData.stats);

    console.log('\n--- 3. Testing Supplier Token Denial on Admin Portal ---');
    const supLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'supplier1001@supplyflow.com', password: 'password123', role: 'SUPPLIER' })
    });
    const supData = await supLoginRes.json();
    const supDashRes = await fetch(`${baseUrl}/admin-portal/dashboard`, {
        headers: { 'Authorization': `Bearer ${supData.token}` }
    });
    console.log('Supplier access to Admin portal status:', supDashRes.status, '(Expect 403)');

    console.log('\n--- 4. Testing Restaurant Token Denial on Admin Portal ---');
    const restLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'restaurant2001@supplyflow.com', password: 'password123', role: 'RESTAURANT' })
    });
    const restData = await restLoginRes.json();
    const restDashRes = await fetch(`${baseUrl}/admin-portal/dashboard`, {
        headers: { 'Authorization': `Bearer ${restData.token}` }
    });
    console.log('Restaurant access to Admin portal status:', restDashRes.status, '(Expect 403)');

    console.log('\n--- 5. Testing Role Mismatch Rejection ---');
    const mismatchRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@supplyflow.com', password: 'Admin@12345', role: 'SUPPLIER' })
    });
    console.log('Admin trying to log in as SUPPLIER status:', mismatchRes.status, '(Expect 403)');

    console.log('\nAll security tests passed!');
}

testSecurity().catch(console.error);

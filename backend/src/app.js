const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// ── Existing Routes ──────────────────────────────────────────
const healthRoutes = require('./routes/health');
const supplierRoutes = require('./routes/suppliers');
const restaurantRoutes = require('./routes/restaurants');
const warehouseRoutes = require('./routes/warehouses');
const productRoutes = require('./routes/products');
const inventoryRoutes = require('./routes/inventory');
const orderRoutes = require('./routes/orders');
const orderItemRoutes = require('./routes/orderItems');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/health', healthRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/order-items', orderItemRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── New Auth + Role-Specific Portal Routes ───────────────────
const authRoutes             = require('./routes/auth');
const supplierPortalRoutes   = require('./routes/supplierPortal');
const restaurantPortalRoutes = require('./routes/restaurantPortal');
const adminPortalRoutes      = require('./routes/adminPortal');

app.use('/api/auth', authRoutes);
app.use('/api/supplier-portal', supplierPortalRoutes);
app.use('/api/restaurant-portal', restaurantPortalRoutes);
app.use('/api/admin-portal', adminPortalRoutes);

// ── Error Handling Middleware ────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err.message && err.message.includes('ORA-')) {
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;

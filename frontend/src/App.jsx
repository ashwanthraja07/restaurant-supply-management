import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth pages
import Login from './pages/auth/Login';
import RegisterSupplier from './pages/auth/RegisterSupplier';
import RegisterRestaurant from './pages/auth/RegisterRestaurant';

// Route guard
import ProtectedRoute from './components/ProtectedRoute';

// Administrator Portal
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSuppliers from './pages/admin/AdminSuppliers';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminProducts from './pages/admin/AdminProducts';
import AdminWarehouses from './pages/admin/AdminWarehouses';
import AdminInventory from './pages/admin/AdminInventory';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';

// Supplier Portal
import SupplierLayout from './layouts/SupplierLayout';
import SupplierDashboardPage from './pages/supplier/SupplierDashboard';
import SupplierProducts from './pages/supplier/SupplierProducts';
import SupplierOrders from './pages/supplier/SupplierOrders';
import SupplierInventory from './pages/supplier/SupplierInventory';
import SupplierProfile from './pages/supplier/SupplierProfile';

// Restaurant Portal
import RestaurantLayout from './layouts/RestaurantLayout';
import RestaurantDashboard from './pages/restaurant/RestaurantDashboard';
import RestaurantOrders from './pages/restaurant/RestaurantOrders';
import RestaurantProducts from './pages/restaurant/RestaurantProducts';
import RestaurantInventory from './pages/restaurant/RestaurantInventory';
import RestaurantProfile from './pages/restaurant/RestaurantProfile';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Root → Login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register/supplier" element={<RegisterSupplier />} />
            <Route path="/register/restaurant" element={<RegisterRestaurant />} />

            {/* ── Administrator Portal (Protected: ADMIN role) ───── */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute role="ADMIN">
                <AdminLayout><AdminDashboard /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/suppliers" element={
              <ProtectedRoute role="ADMIN">
                <AdminLayout><AdminSuppliers /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/restaurants" element={
              <ProtectedRoute role="ADMIN">
                <AdminLayout><AdminRestaurants /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/products" element={
              <ProtectedRoute role="ADMIN">
                <AdminLayout><AdminProducts /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/warehouses" element={
              <ProtectedRoute role="ADMIN">
                <AdminLayout><AdminWarehouses /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/inventory" element={
              <ProtectedRoute role="ADMIN">
                <AdminLayout><AdminInventory /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/orders" element={
              <ProtectedRoute role="ADMIN">
                <AdminLayout><AdminOrders /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute role="ADMIN">
                <AdminLayout><AdminUsers /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute role="ADMIN">
                <AdminLayout><AdminReports /></AdminLayout>
              </ProtectedRoute>
            } />

            {/* ── Supplier Portal (Protected: SUPPLIER role) ─────── */}
            <Route path="/supplier/dashboard" element={
              <ProtectedRoute role="SUPPLIER">
                <SupplierLayout><SupplierDashboardPage /></SupplierLayout>
              </ProtectedRoute>
            } />
            <Route path="/supplier/products" element={
              <ProtectedRoute role="SUPPLIER">
                <SupplierLayout><SupplierProducts /></SupplierLayout>
              </ProtectedRoute>
            } />
            <Route path="/supplier/orders" element={
              <ProtectedRoute role="SUPPLIER">
                <SupplierLayout><SupplierOrders /></SupplierLayout>
              </ProtectedRoute>
            } />
            <Route path="/supplier/inventory" element={
              <ProtectedRoute role="SUPPLIER">
                <SupplierLayout><SupplierInventory /></SupplierLayout>
              </ProtectedRoute>
            } />
            <Route path="/supplier/profile" element={
              <ProtectedRoute role="SUPPLIER">
                <SupplierLayout><SupplierProfile /></SupplierLayout>
              </ProtectedRoute>
            } />

            {/* ── Restaurant Portal (Protected: RESTAURANT role) ──── */}
            <Route path="/restaurant/dashboard" element={
              <ProtectedRoute role="RESTAURANT">
                <RestaurantLayout><RestaurantDashboard /></RestaurantLayout>
              </ProtectedRoute>
            } />
            <Route path="/restaurant/orders" element={
              <ProtectedRoute role="RESTAURANT">
                <RestaurantLayout><RestaurantOrders /></RestaurantLayout>
              </ProtectedRoute>
            } />
            <Route path="/restaurant/products" element={
              <ProtectedRoute role="RESTAURANT">
                <RestaurantLayout><RestaurantProducts /></RestaurantLayout>
              </ProtectedRoute>
            } />
            <Route path="/restaurant/inventory" element={
              <ProtectedRoute role="RESTAURANT">
                <RestaurantLayout><RestaurantInventory /></RestaurantLayout>
              </ProtectedRoute>
            } />
            <Route path="/restaurant/profile" element={
              <ProtectedRoute role="RESTAURANT">
                <RestaurantLayout><RestaurantProfile /></RestaurantLayout>
              </ProtectedRoute>
            } />

            {/* Catch-all redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <ToastContainer position="bottom-right" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

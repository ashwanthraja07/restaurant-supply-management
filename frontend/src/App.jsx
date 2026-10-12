import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import Suppliers from './pages/Suppliers';
import Restaurants from './pages/Restaurants';
import Warehouses from './pages/Warehouses';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import OrderItems from './pages/OrderItems';
import Reports from './pages/Reports';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/warehouses" element={<Warehouses />} />
            <Route path="/products" element={<Products />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/order-items" element={<OrderItems />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </Layout>
        <ToastContainer position="bottom-right" />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

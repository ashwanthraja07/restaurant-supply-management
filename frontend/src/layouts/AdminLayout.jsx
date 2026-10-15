import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Store, Package, Warehouse,
  ClipboardList, ShoppingCart, ShieldCheck, BarChart3,
  LogOut, Menu, Database, ChevronRight, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';

const navItems = [
  { name: 'Dashboard',        href: '/admin/dashboard',   icon: LayoutDashboard },
  { name: 'Suppliers',        href: '/admin/suppliers',   icon: Users },
  { name: 'Restaurants',      href: '/admin/restaurants', icon: Store },
  { name: 'Products',         href: '/admin/products',    icon: Package },
  { name: 'Warehouses',       href: '/admin/warehouses',  icon: Warehouse },
  { name: 'Inventory',        href: '/admin/inventory',   icon: ClipboardList },
  { name: 'Purchase Orders',  href: '/admin/orders',      icon: ShoppingCart },
  { name: 'User Accounts',    href: '/admin/users',       icon: ShieldCheck },
  { name: 'Reports & Stats',  href: '/admin/reports',     icon: BarChart3 },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info('Logged out from Administrator portal.');
    navigate('/login', { replace: true });
  };

  const currentPage = navItems.find(i => location.pathname === i.href)?.name || 'Admin Console';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 flex-shrink-0">
        <div>
          <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent font-bold text-xl tracking-wide">
            SupplyFlow
          </span>
          <div className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider mt-0.5">Admin Console</div>
        </div>
        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-violet-900/60 text-violet-300 border border-violet-700/50">
          Oracle 11g
        </span>
      </div>

      {/* Admin badge */}
      <div className="px-4 py-3 mx-3 mt-3 rounded-lg bg-violet-600/10 border border-violet-500/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.email}</p>
            <p className="text-violet-400 text-[11px] font-medium">Administrator</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-1 px-3">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/20 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 space-y-1">
        <div className="flex items-center px-3 py-1.5 text-xs text-slate-400">
          <Database className="w-3.5 h-3.5 text-emerald-400 mr-2 flex-shrink-0" />
          <span>Oracle DB • Connected</span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 dark:bg-slate-950 text-white flex-col border-r border-slate-800 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 shadow-xs transition-colors flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">{currentPage}</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700/50">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-500" />
              Administrator
            </span>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition-colors border border-gray-200 dark:border-slate-700"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50 dark:bg-slate-950 transition-colors">
          {children}
        </main>
      </div>
    </div>
  );
}

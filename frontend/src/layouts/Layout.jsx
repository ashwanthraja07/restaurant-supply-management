import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Store, Warehouse, Package, 
  ClipboardList, ShoppingCart, ListOrdered, BarChart2, 
  Sun, Moon, Database 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Suppliers', href: '/suppliers', icon: Users },
    { name: 'Restaurants', href: '/restaurants', icon: Store },
    { name: 'Warehouses', href: '/warehouses', icon: Warehouse },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Inventory', href: '/inventory', icon: ClipboardList },
    { name: 'Purchase Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Order Items', href: '/order-items', icon: ListOrdered },
    { name: 'Reports', href: '/reports', icon: BarChart2 },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 dark:bg-slate-950 text-white flex flex-col border-r border-slate-800 flex-shrink-0">
        <div className="h-16 flex items-center justify-between px-6 font-bold text-xl border-b border-slate-800 tracking-wide">
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            SupplyFlow
          </span>
          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
            Oracle
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold' 
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-400 flex items-center">
          <Database className="w-3.5 h-3.5 text-emerald-400 mr-2 flex-shrink-0" />
          <span>Oracle DB 11g • Connected</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-8 shadow-xs transition-colors duration-200">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            {navigation.find(item => item.href === location.pathname)?.name || 'SupplyFlow'}
          </h1>

          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleDarkMode}
              aria-label="Toggle Dark Mode"
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer border border-gray-200 dark:border-slate-700 flex items-center gap-2 text-sm font-medium"
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline text-xs">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600" />
                  <span className="hidden sm:inline text-xs">Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Package, FileText, LogOut, Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
  { to: '/customers', label: 'Customers', icon: Users, roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
  { to: '/inventory', label: 'Inventory', icon: Package, roles: ['ADMIN', 'SALES', 'WAREHOUSE'] },
  { to: '/challans', label: 'Challans', icon: FileText, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  const visibleItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <aside className="w-56 flex-shrink-0 bg-forest-950 flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Brand */}
      <div className="p-5 border-b border-forest-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-sage-400 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 size={16} className="text-forest-950" />
          </div>
          <div>
            <p className="text-sage-50 font-semibold text-sm leading-tight">AgriDist</p>
            <p className="text-sage-400 text-[10px] uppercase tracking-wider">Operations Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <p className="text-forest-800 text-[10px] font-semibold uppercase tracking-widest px-2 mb-2 mt-1">
          Navigation
        </p>
        <ul className="space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-forest-700 text-sage-50'
                        : 'text-sage-400 hover:bg-forest-900 hover:text-sage-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={16} className={isActive ? 'text-sage-50' : 'text-sage-400'} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info + logout */}
      <div className="p-3 border-t border-forest-900/50">
        <div className="px-3 py-2 mb-1">
          <p className="text-sage-50 text-sm font-medium truncate">{user?.name}</p>
          <p className="text-sage-400 text-xs">{user?.role}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sage-400 hover:bg-red-900/30 hover:text-red-400 transition-colors duration-150"
        >
          <LogOut size={16} />
          Sign Out
        </motion.button>
      </div>
    </aside>
  );
}

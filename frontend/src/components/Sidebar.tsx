import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  BarChart2, 
  Settings, 
  ChevronRight, 
  ChevronLeft, 
  LogOut,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type NavItem = {
  icon: React.ElementType;
  label: string;
  badge?: number;
  id: string;
  path: string;
};

const navItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    id: 'dashboard',
    path: '/dashboard'
  },
  {
    icon: CheckSquare,
    label: 'Tasks',
    id: 'tasks',
    path: '/tasks'
  },
  {
    icon: Plus,
    label: 'Create Task',
    id: 'create-task',
    path: '/tasks/new'
  },
  {
    icon: Calendar,
    label: 'Calendar',
    id: 'calendar',
    path: '/calendar'
  },
  {
    icon: BarChart2,
    label: 'Analytics',
    id: 'analytics',
    path: '/analytics'
  },
];

const bottomItems: NavItem[] = [
  {
    icon: Settings,
    label: 'Settings',
    id: 'settings',
    path: '/settings'
  }
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeId, setActiveId] = useState('dashboard');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Update active navigation based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const allItems = [...navItems, ...bottomItems];
    const activeItem = allItems.find(item => item.path === currentPath);
    if (activeItem) {
      setActiveId(activeItem.id);
    }
  }, [location.pathname]);

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 80 }
  };

  const handleNavClick = (item: NavItem) => {
    setActiveId(item.id);
    navigate(item.path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex items-center justify-center p-6 h-screen">
      <motion.div
        className="h-[calc(100vh-48px)] bg-[#2A2A2A]/85 backdrop-blur-2xl border border-white/5 flex flex-col relative rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
        initial="expanded"
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-[32px] bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

        {/* Logo Area */}
        <div className="p-6 flex items-center justify-center border-b border-white/[0.03]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-lg p-2 border border-white/5">
              <img
                src="/branding/quid.png"
                alt="Quid Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-xl font-bold text-white whitespace-nowrap tracking-tight"
                >
                  Quid
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-[#2A2A2A]/90 border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#6b668c] hover:border-[#6b668c] transition-all z-50 shadow-lg"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Navigation */}
        <div className="flex-1 flex flex-col gap-1 px-3 py-6 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeId === item.id}
              isCollapsed={isCollapsed}
              onClick={() => handleNavClick(item)}
            />
          ))}

          <div className="my-3 h-px bg-white/10 mx-2" />

          {bottomItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeId === item.id}
              isCollapsed={isCollapsed}
              onClick={() => handleNavClick(item)}
            />
          ))}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02]">
          <div
            className={`flex items-center gap-3 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt="Profile"
                className="w-11 h-11 rounded-full object-cover border-2 border-white/20 shrink-0 shadow-lg"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#6b668c] to-[#928dab] shrink-0 shadow-lg flex items-center justify-center text-white font-bold text-base">
                {user?.full_name?.charAt(0).toUpperCase() ||
                  user?.username?.charAt(0).toUpperCase() ||
                  "U"}
              </div>
            )}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-hidden"
                >
                  <p className="text-sm font-bold text-white truncate">
                    {user?.username || "User"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.email || "user@example.com"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!isCollapsed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleLogout}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 transition-all text-sm font-medium shadow-sm hover:shadow-md"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function NavItem({
  item,
  isActive,
  isCollapsed,
  onClick
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group
        ${isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'}
        ${isCollapsed ? 'justify-center' : ''}
      `}
    >
      {isActive && (
        <motion.div
          layoutId="activeNav"
          className="absolute inset-0 bg-gradient-to-r from-[#6b668c]/20 via-transparent to-transparent rounded-xl"
          initial={false}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30
          }}
        />
      )}

      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-full bg-gradient-to-b from-[#6b668c] to-[#928dab] rounded-r-md" />
      )}

      <item.icon
        size={20}
        className={`relative z-10 transition-colors ${
          isActive ? 'text-[#928dab]' : 'group-hover:text-white'
        }`}
      />

      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="relative z-10 font-medium text-sm whitespace-nowrap overflow-hidden"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {item.badge && !isCollapsed && (
        <div className="ml-auto bg-[#6b668c]/20 text-[#928dab] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#6b668c]/30">
          {item.badge}
        </div>
      )}

      {item.badge && isCollapsed && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-[#928dab] rounded-full border border-[#2A2A2A]" />
      )}
    </button>
  );
}

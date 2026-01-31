import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  AlertTriangle,
  ClipboardList,
  FileText,
  Users,
  Shield,
  Settings,
  BookOpen,
  Bell,
  BarChart3,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useUIStore } from '../../store';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  badge?: number;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: '/dashboard',
  },
  {
    id: 'events',
    label: 'Événements',
    icon: <AlertTriangle className="w-5 h-5" />,
    path: '/events',
    badge: 12,
  },
  {
    id: 'procedures',
    label: 'Procédures',
    icon: <ClipboardList className="w-5 h-5" />,
    path: '/procedures',
  },
  {
    id: 'forms',
    label: 'Formulaires',
    icon: <FileText className="w-5 h-5" />,
    path: '/forms',
  },
  {
    id: 'users',
    label: 'Utilisateurs',
    icon: <Users className="w-5 h-5" />,
    children: [
      { id: 'users-list', label: 'Liste des utilisateurs', icon: <Users className="w-4 h-4" />, path: '/users' },
      { id: 'users-groups', label: 'Groupes', icon: <Users className="w-4 h-4" />, path: '/users/groups' },
      { id: 'users-roles', label: 'Rôles & Droits', icon: <Shield className="w-4 h-4" />, path: '/users/roles' },
    ],
  },
  {
    id: 'knowledge',
    label: 'Base de connaissances',
    icon: <BookOpen className="w-5 h-5" />,
    path: '/knowledge',
  },
  {
    id: 'analytics',
    label: 'Statistiques',
    icon: <BarChart3 className="w-5 h-5" />,
    path: '/analytics',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <Bell className="w-5 h-5" />,
    path: '/notifications',
    badge: 5,
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: <Settings className="w-5 h-5" />,
    children: [
      { id: 'settings-general', label: 'Général', icon: <Settings className="w-4 h-4" />, path: '/settings' },
      { id: 'settings-procedure-groups', label: 'Groupes de procédures', icon: <ClipboardList className="w-4 h-4" />, path: '/settings/procedure-groups' },
    ],
  },
];

interface SidebarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath = '/dashboard', onNavigate }) => {
  const { sidebarCollapsed, sidebarMobileOpen, toggleSidebar, setMobileSidebarOpen } = useUIStore();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['users']));

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const isActive = (item: NavItem): boolean => {
    if (item.path && currentPath === item.path) return true;
    if (item.children) {
      return item.children.some((child) => child.path === currentPath);
    }
    return false;
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const active = isActive(item);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);

    return (
      <div key={item.id}>
        <motion.button
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else if (item.path) {
              onNavigate?.(item.path);
              setMobileSidebarOpen(false);
            }
          }}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
            'text-sm font-medium transition-all duration-200',
            'group relative',
            level > 0 && 'ml-4 pl-4 border-l-2 border-dark-200 dark:border-dark-700',
            active
              ? 'bg-gradient-to-r from-primary-500/10 to-primary-500/5 text-primary-700 dark:text-primary-300'
              : 'text-dark-600 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700/50 hover:text-dark-900 dark:hover:text-white'
          )}
        >
          {/* Active indicator */}
          {active && level === 0 && (
            <motion.div
              layoutId="activeNavIndicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-gradient-to-b from-primary-500 to-primary-600"
            />
          )}

          {/* Icon */}
          <span
            className={cn(
              'flex-shrink-0 transition-colors',
              active ? 'text-primary-500' : 'text-dark-400 group-hover:text-primary-500'
            )}
          >
            {item.icon}
          </span>

          {/* Label */}
          {!sidebarCollapsed && (
            <>
              <span className="flex-1 text-left truncate">{item.label}</span>

              {/* Badge */}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="flex-shrink-0 min-w-[1.25rem] h-5 px-1.5 text-xs font-medium rounded-full bg-primary-500 text-white flex items-center justify-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}

              {/* Expand arrow */}
              {hasChildren && (
                <ChevronDown
                  className={cn(
                    'w-4 h-4 flex-shrink-0 transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )}
                />
              )}
            </>
          )}
        </motion.button>

        {/* Children */}
        {hasChildren && !sidebarCollapsed && (
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="py-1 space-y-1">
                  {item.children!.map((child) => renderNavItem(child, level + 1))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={cn('p-4 border-b border-dark-200 dark:border-dark-700', sidebarCollapsed && 'px-2')}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 p-2 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25">
            <Zap className="w-6 h-6" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-dark-900 dark:text-white">
                CCOUSA
              </h1>
              <p className="text-xs text-dark-500 dark:text-dark-400">
                Une Seule Santé
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navigationItems.map((item) => renderNavItem(item))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-dark-200 dark:border-dark-700">
        <button
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
            'text-sm font-medium text-dark-600 dark:text-dark-300',
            'hover:bg-dark-100 dark:hover:bg-dark-700/50 hover:text-dark-900 dark:hover:text-white',
            'transition-colors'
          )}
        >
          <HelpCircle className="w-5 h-5" />
          {!sidebarCollapsed && <span>Aide & Support</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 280 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'hidden lg:flex flex-col h-screen',
          'bg-white dark:bg-dark-800',
          'border-r border-dark-200 dark:border-dark-700',
          'fixed left-0 top-0 z-30'
        )}
      >
        {sidebarContent}

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'absolute -right-3 top-20 z-40',
            'w-6 h-6 rounded-full',
            'bg-white dark:bg-dark-800',
            'border border-dark-200 dark:border-dark-700',
            'shadow-md flex items-center justify-center',
            'text-dark-400 hover:text-dark-600 dark:hover:text-dark-300',
            'transition-colors'
          )}
        >
          <ChevronRight
            className={cn(
              'w-4 h-4 transition-transform',
              sidebarCollapsed ? '' : 'rotate-180'
            )}
          />
        </button>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-dark-900/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'fixed left-0 top-0 z-50 h-screen w-[280px]',
                'bg-white dark:bg-dark-800',
                'border-r border-dark-200 dark:border-dark-700',
                'flex flex-col lg:hidden'
              )}
            >
              {sidebarContent}
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg text-dark-500 hover:text-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;

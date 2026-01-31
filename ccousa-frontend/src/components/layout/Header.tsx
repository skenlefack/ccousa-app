import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Globe,
  Check,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useUIStore, useAuthStore, useNotificationsStore } from '../../store';
import { Badge, CountBadge } from '../ui';
import { formatRelativeTime, getInitials, getFullName } from '../../utils/format';

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { theme, setTheme, language, setLanguage, toggleMobileSidebar, sidebarCollapsed } = useUIStore();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationsStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  const currentLanguage = languages.find(l => l.code === language) || languages[0];

  return (
    <header
      className={cn(
        'sticky top-0 z-20 h-16',
        'bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl',
        'border-b border-dark-200 dark:border-dark-700',
        'flex items-center justify-between px-4 lg:px-6',
        sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
      )}
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-dark-500 hover:text-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page title */}
        {title && (
          <h1 className="text-lg font-semibold text-dark-900 dark:text-white hidden sm:block">
            {title}
          </h1>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <motion.div className="relative">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2.5 rounded-xl text-dark-500 hover:text-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 top-full mt-2 w-80 p-2 rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 shadow-xl"
              >
                <input
                  type="text"
                  placeholder="Rechercher..."
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-lg bg-dark-100 dark:bg-dark-700 text-dark-900 dark:text-white placeholder:text-dark-400 outline-none focus:ring-2 focus:ring-primary-500/20"
                  onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setLanguageOpen(!languageOpen)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-dark-500 hover:text-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
          >
            <span className="text-base">{currentLanguage.flag}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <AnimatePresence>
            {languageOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 top-full mt-2 w-40 py-1 rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 shadow-xl"
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setLanguageOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm',
                      'hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors',
                      language === lang.code && 'bg-primary-50 dark:bg-primary-900/20'
                    )}
                  >
                    <span>{lang.flag}</span>
                    <span className="flex-1 text-left text-dark-700 dark:text-dark-200">
                      {lang.label}
                    </span>
                    {language === lang.code && (
                      <Check className="w-4 h-4 text-primary-500" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="p-2.5 rounded-xl text-dark-500 hover:text-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2.5 rounded-xl text-dark-500 hover:text-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 text-xs font-medium rounded-full bg-red-500 text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 shadow-xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-dark-200 dark:border-dark-700">
                  <h3 className="font-semibold text-dark-900 dark:text-white">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      Tout marquer comme lu
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="w-10 h-10 text-dark-300 mx-auto mb-2" />
                      <p className="text-sm text-dark-500">
                        Aucune notification
                      </p>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        className={cn(
                          'px-4 py-3 border-b border-dark-100 dark:border-dark-700 cursor-pointer',
                          'hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors',
                          !notif.read && 'bg-primary-50/50 dark:bg-primary-900/10'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'p-1.5 rounded-lg',
                              notif.type === 'success' && 'bg-emerald-100 text-emerald-600',
                              notif.type === 'error' && 'bg-red-100 text-red-600',
                              notif.type === 'warning' && 'bg-amber-100 text-amber-600',
                              notif.type === 'info' && 'bg-blue-100 text-blue-600'
                            )}
                          >
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-dark-900 dark:text-white truncate">
                              {notif.title}
                            </p>
                            {notif.message && (
                              <p className="text-xs text-dark-500 truncate">
                                {notif.message}
                              </p>
                            )}
                            <p className="text-xs text-dark-400 mt-1">
                              {formatRelativeTime(notif.createdAt)}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-3 border-t border-dark-200 dark:border-dark-700">
                    <button className="w-full py-2 text-sm font-medium text-primary-600 hover:text-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                      Voir toutes les notifications
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-dark-200 dark:bg-dark-700 mx-2" />

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-medium text-sm">
              {user ? getInitials(user.firstName, user.lastName) : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-dark-900 dark:text-white">
                {user ? getFullName(user.firstName, user.lastName) : 'Utilisateur'}
              </p>
              <p className="text-xs text-dark-500">
                {user?.role?.name || 'Administrateur'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-dark-400" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 top-full mt-2 w-56 py-1 rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 shadow-xl"
              >
                <div className="px-4 py-3 border-b border-dark-200 dark:border-dark-700">
                  <p className="font-medium text-dark-900 dark:text-white">
                    {user ? getFullName(user.firstName, user.lastName) : 'Utilisateur'}
                  </p>
                  <p className="text-xs text-dark-500 truncate">
                    {user?.email || 'email@example.com'}
                  </p>
                </div>

                <div className="py-1">
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors">
                    <User className="w-4 h-4" />
                    Mon profil
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors">
                    <Settings className="w-4 h-4" />
                    Paramètres
                  </button>
                </div>

                <div className="border-t border-dark-200 dark:border-dark-700 py-1">
                  <button
                    onClick={() => {
                      logout();
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;

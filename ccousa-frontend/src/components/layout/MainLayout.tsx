import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '../../utils/cn';
import { useUIStore } from '../../store';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  currentPath,
  onNavigate,
}) => {
  const { theme, sidebarCollapsed } = useUIStore();

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900">
      {/* Sidebar */}
      <Sidebar currentPath={currentPath} onNavigate={onNavigate} />

      {/* Main content area */}
      <div
        className={cn(
          'transition-all duration-200',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
        )}
      >
        {/* Header */}
        <Header title={title} />

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

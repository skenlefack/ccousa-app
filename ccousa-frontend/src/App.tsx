import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from './components/layout';
import { ToastProvider } from './components/ui';
import { DashboardPage } from './pages/dashboard';
import { SettingsPage } from './pages/settings/SettingsPage';

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Simple client-side routing
type Route = 'dashboard' | 'events' | 'procedures' | 'forms' | 'users' | 'settings' | 'knowledge' | 'analytics' | 'notifications';

const pageTitles: Record<Route, string> = {
  dashboard: 'Tableau de bord',
  events: 'Événements',
  procedures: 'Procédures',
  forms: 'Formulaires',
  users: 'Utilisateurs',
  settings: 'Paramètres',
  knowledge: 'Base de connaissances',
  analytics: 'Statistiques',
  notifications: 'Notifications',
};

// Placeholder pages
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh]">
    <div className="p-6 rounded-2xl bg-white dark:bg-dark-800 shadow-lg border border-dark-200 dark:border-dark-700 text-center">
      <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">
        {title}
      </h2>
      <p className="text-dark-500 dark:text-dark-400">
        Cette page sera disponible prochainement.
      </p>
    </div>
  </div>
);

function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>('dashboard');
  const [currentPath, setCurrentPath] = useState('/dashboard');

  // Handle navigation
  const handleNavigate = (path: string) => {
    setCurrentPath(path);

    // Extract route from path
    const route = path.split('/')[1] as Route;
    if (route && pageTitles[route]) {
      setCurrentRoute(route);
    }
  };

  // Render current page
  const renderPage = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <DashboardPage />;
      case 'settings':
        return <SettingsPage />;
      case 'events':
        return <PlaceholderPage title="Gestion des Événements" />;
      case 'procedures':
        return <PlaceholderPage title="Gestion des Procédures" />;
      case 'forms':
        return <PlaceholderPage title="Constructeur de Formulaires" />;
      case 'users':
        return <PlaceholderPage title="Gestion des Utilisateurs" />;
      case 'knowledge':
        return <PlaceholderPage title="Base de Connaissances" />;
      case 'analytics':
        return <PlaceholderPage title="Statistiques & Rapports" />;
      case 'notifications':
        return <PlaceholderPage title="Notifications" />;
      default:
        return <DashboardPage />;
    }
  };

  // Check if we're on settings page to use different layout
  if (currentRoute === 'settings') {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider />
        <SettingsPage />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider />
      <MainLayout
        title={pageTitles[currentRoute]}
        currentPath={currentPath}
        onNavigate={handleNavigate}
      >
        {renderPage()}
      </MainLayout>
    </QueryClientProvider>
  );
}

export default App;

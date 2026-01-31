/**
 * CCOUSA-APP - Modern Application Entry Point
 *
 * This is the new modular version of the application with:
 * - Component-based architecture
 * - React Query for data fetching
 * - Zustand for state management
 * - Modern UI component library
 * - TypeScript strict mode
 *
 * To use this instead of the legacy App.tsx, update main.tsx:
 * import App from './src/AppModern'
 */

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from './components/layout';
import { ToastProvider } from './components/ui';
import { DashboardPage } from './pages/dashboard';
import { SettingsPage } from './pages/settings/SettingsPage';
import { EventsListPage, EventDetailPage, EventFormPage } from './pages/events';
import { ProceduresListPage, ProcedureDetailPage, ProcedureFormPage } from './pages/procedures';
import { FormsListPage, FormBuilderPage, FormPreviewPage } from './pages/forms';
import { UsersListPage, GroupsPage, RolesPermissionsPage } from './pages/users';
import { KnowledgeListPage, ArticleDetailPage, ArticleEditorPage } from './pages/knowledge';
import { AnalyticsDashboardPage, AnalyticsReportsPage } from './pages/analytics';
import { NotificationsCenterPage, NotificationsPreferencesPage } from './pages/notifications';
import { useUIStore } from './store';
import type { Event, Procedure, Form } from './types';
import type { Article } from './services/knowledge.service';

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

// Route types
type Route =
  | 'dashboard'
  | 'events'
  | 'events-new'
  | 'events-detail'
  | 'events-edit'
  | 'procedures'
  | 'procedures-new'
  | 'procedures-detail'
  | 'procedures-edit'
  | 'forms'
  | 'forms-new'
  | 'forms-detail'
  | 'forms-edit'
  | 'forms-preview'
  | 'users'
  | 'users-groups'
  | 'users-roles'
  | 'settings'
  | 'knowledge'
  | 'knowledge-new'
  | 'knowledge-detail'
  | 'knowledge-edit'
  | 'analytics'
  | 'analytics-reports'
  | 'notifications'
  | 'notifications-preferences';

const pageTitles: Record<Route, string> = {
  dashboard: 'Tableau de bord',
  events: 'Événements',
  'events-new': 'Nouvel événement',
  'events-detail': 'Détail événement',
  'events-edit': 'Modifier événement',
  procedures: 'Procédures',
  'procedures-new': 'Nouvelle procédure',
  'procedures-detail': 'Détail procédure',
  'procedures-edit': 'Modifier procédure',
  forms: 'Formulaires',
  'forms-new': 'Nouveau formulaire',
  'forms-detail': 'Détail formulaire',
  'forms-edit': 'Modifier formulaire',
  'forms-preview': 'Aperçu formulaire',
  users: 'Utilisateurs',
  'users-groups': 'Groupes',
  'users-roles': 'Rôles & Permissions',
  settings: 'Paramètres',
  knowledge: 'Base de connaissances',
  'knowledge-new': 'Nouvel article',
  'knowledge-detail': 'Article',
  'knowledge-edit': 'Modifier article',
  analytics: 'Statistiques',
  'analytics-reports': 'Rapports',
  notifications: 'Notifications',
  'notifications-preferences': 'Preferences notifications',
};

// Placeholder component for pages not yet migrated
const PlaceholderPage: React.FC<{ title: string; description?: string }> = ({
  title,
  description = 'Cette page sera disponible prochainement.'
}) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh]">
    <div className="p-8 rounded-2xl bg-white dark:bg-dark-800 shadow-lg border border-dark-200 dark:border-dark-700 text-center max-w-md">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-primary-600 dark:text-primary-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">
        {title}
      </h2>
      <p className="text-dark-500 dark:text-dark-400">
        {description}
      </p>
    </div>
  </div>
);

// Main App Component
function AppModern() {
  const [currentRoute, setCurrentRoute] = useState<Route>('dashboard');
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(null);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const { theme } = useUIStore();

  // Apply theme on mount and when it changes
  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Handle navigation
  const handleNavigate = (path: string) => {
    setCurrentPath(path);

    // Parse route from path
    const segments = path.split('/').filter(Boolean);
    let route: Route = 'dashboard';

    // Handle events routes with IDs
    if (segments[0] === 'events') {
      if (segments.length === 1) {
        route = 'events';
        setSelectedEventId(null);
      } else if (segments[1] === 'new') {
        route = 'events-new';
        setSelectedEventId(null);
      } else if (segments.length === 2) {
        route = 'events-detail';
        setSelectedEventId(segments[1]);
      } else if (segments[2] === 'edit') {
        route = 'events-edit';
        setSelectedEventId(segments[1]);
      }
    } else if (segments[0] === 'procedures') {
      // Handle procedures routes with IDs
      if (segments.length === 1) {
        route = 'procedures';
        setSelectedProcedureId(null);
      } else if (segments[1] === 'new') {
        route = 'procedures-new';
        setSelectedProcedureId(null);
      } else if (segments.length === 2) {
        route = 'procedures-detail';
        setSelectedProcedureId(segments[1]);
      } else if (segments[2] === 'edit') {
        route = 'procedures-edit';
        setSelectedProcedureId(segments[1]);
      }
    } else if (segments[0] === 'forms') {
      // Handle forms routes with IDs
      if (segments.length === 1) {
        route = 'forms';
        setSelectedFormId(null);
      } else if (segments[1] === 'new') {
        route = 'forms-new';
        setSelectedFormId(null);
      } else if (segments.length === 2) {
        route = 'forms-detail';
        setSelectedFormId(segments[1]);
      } else if (segments[2] === 'edit') {
        route = 'forms-edit';
        setSelectedFormId(segments[1]);
      } else if (segments[2] === 'preview') {
        route = 'forms-preview';
        setSelectedFormId(segments[1]);
      }
    } else if (segments[0] === 'knowledge') {
      // Handle knowledge routes with IDs
      if (segments.length === 1) {
        route = 'knowledge';
        setSelectedArticleId(null);
      } else if (segments[1] === 'new') {
        route = 'knowledge-new';
        setSelectedArticleId(null);
      } else if (segments.length === 2) {
        route = 'knowledge-detail';
        setSelectedArticleId(segments[1]);
      } else if (segments[2] === 'edit') {
        route = 'knowledge-edit';
        setSelectedArticleId(segments[1]);
      }
    } else if (segments[0] === 'analytics') {
      // Handle analytics routes
      if (segments.length === 1) {
        route = 'analytics';
      } else if (segments[1] === 'reports') {
        route = 'analytics-reports';
      }
    } else if (segments[0] === 'notifications') {
      // Handle notifications routes
      if (segments.length === 1) {
        route = 'notifications';
      } else if (segments[1] === 'preferences') {
        route = 'notifications-preferences';
      }
    } else if (segments.length >= 2) {
      const combined = segments.slice(0, 2).join('-') as Route;
      if (pageTitles[combined]) {
        route = combined;
      } else if (pageTitles[segments[0] as Route]) {
        route = segments[0] as Route;
      }
    } else if (segments.length === 1 && pageTitles[segments[0] as Route]) {
      route = segments[0] as Route;
    }

    setCurrentRoute(route);
  };

  // Event-specific navigation handlers
  const handleEventBack = () => handleNavigate('/events');
  const handleEventCreate = () => handleNavigate('/events/new');
  const handleEventView = (id: string) => handleNavigate(`/events/${id}`);
  const handleEventEdit = (id: string) => handleNavigate(`/events/${id}/edit`);
  const handleEventSuccess = (event: Event) => handleNavigate(`/events/${event.id}`);

  // Procedure-specific navigation handlers
  const handleProcedureBack = () => handleNavigate('/procedures');
  const handleProcedureCreate = () => handleNavigate('/procedures/new');
  const handleProcedureView = (id: string) => handleNavigate(`/procedures/${id}`);
  const handleProcedureEdit = (id: string) => handleNavigate(`/procedures/${id}/edit`);
  const handleProcedureSuccess = (procedure: Procedure) => handleNavigate(`/procedures/${procedure.id}`);

  // Form-specific navigation handlers
  const handleFormBack = () => handleNavigate('/forms');
  const handleFormCreate = () => handleNavigate('/forms/new');
  const handleFormView = (id: string) => handleNavigate(`/forms/${id}`);
  const handleFormEdit = (id: string) => handleNavigate(`/forms/${id}/edit`);
  const handleFormPreview = (id: string) => handleNavigate(`/forms/${id}/preview`);
  const handleFormSuccess = (form: Form) => handleNavigate(`/forms/${form.id}`);

  // Article-specific navigation handlers
  const handleArticleBack = () => handleNavigate('/knowledge');
  const handleArticleCreate = () => handleNavigate('/knowledge/new');
  const handleArticleView = (id: string) => handleNavigate(`/knowledge/${id}`);
  const handleArticleEdit = (id: string) => handleNavigate(`/knowledge/${id}/edit`);
  const handleArticleSuccess = (article: Article) => handleNavigate(`/knowledge/${article.id}`);

  // Render current page based on route
  const renderPage = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <DashboardPage />;
      case 'settings':
        return <SettingsPage />;
      case 'events':
        return <EventsListPage />;
      case 'events-new':
        return (
          <EventFormPage
            onBack={handleEventBack}
            onSuccess={handleEventSuccess}
          />
        );
      case 'events-detail':
        return selectedEventId ? (
          <EventDetailPage
            eventId={selectedEventId}
            onBack={handleEventBack}
            onEdit={() => handleEventEdit(selectedEventId)}
          />
        ) : (
          <EventsListPage />
        );
      case 'events-edit':
        return selectedEventId ? (
          <EventFormPage
            eventId={selectedEventId}
            onBack={() => handleEventView(selectedEventId)}
            onSuccess={handleEventSuccess}
          />
        ) : (
          <EventsListPage />
        );
      case 'procedures':
        return <ProceduresListPage />;
      case 'procedures-new':
        return (
          <ProcedureFormPage
            onBack={handleProcedureBack}
            onSuccess={handleProcedureSuccess}
          />
        );
      case 'procedures-detail':
        return selectedProcedureId ? (
          <ProcedureDetailPage
            procedureId={selectedProcedureId}
            onBack={handleProcedureBack}
            onEdit={() => handleProcedureEdit(selectedProcedureId)}
          />
        ) : (
          <ProceduresListPage />
        );
      case 'procedures-edit':
        return selectedProcedureId ? (
          <ProcedureFormPage
            procedureId={selectedProcedureId}
            onBack={() => handleProcedureView(selectedProcedureId)}
            onSuccess={handleProcedureSuccess}
          />
        ) : (
          <ProceduresListPage />
        );
      case 'forms':
        return <FormsListPage onNavigate={handleNavigate} />;
      case 'forms-new':
        return (
          <FormBuilderPage
            onBack={handleFormBack}
            onSuccess={handleFormSuccess}
          />
        );
      case 'forms-detail':
      case 'forms-edit':
        return selectedFormId ? (
          <FormBuilderPage
            formId={selectedFormId}
            onBack={handleFormBack}
            onSuccess={handleFormSuccess}
          />
        ) : (
          <FormsListPage onNavigate={handleNavigate} />
        );
      case 'forms-preview':
        return selectedFormId ? (
          <FormPreviewPage
            formId={selectedFormId}
            onBack={() => handleFormEdit(selectedFormId)}
          />
        ) : (
          <FormsListPage onNavigate={handleNavigate} />
        );
      case 'users':
        return <UsersListPage onNavigate={handleNavigate} />;
      case 'users-groups':
        return <GroupsPage />;
      case 'users-roles':
        return <RolesPermissionsPage />;
      case 'knowledge':
        return <KnowledgeListPage onNavigate={handleNavigate} />;
      case 'knowledge-new':
        return (
          <ArticleEditorPage
            onBack={handleArticleBack}
            onSuccess={handleArticleSuccess}
          />
        );
      case 'knowledge-detail':
        return selectedArticleId ? (
          <ArticleDetailPage
            articleId={selectedArticleId}
            onBack={handleArticleBack}
            onEdit={() => handleArticleEdit(selectedArticleId)}
            onNavigate={handleNavigate}
          />
        ) : (
          <KnowledgeListPage onNavigate={handleNavigate} />
        );
      case 'knowledge-edit':
        return selectedArticleId ? (
          <ArticleEditorPage
            articleId={selectedArticleId}
            onBack={() => handleArticleView(selectedArticleId)}
            onSuccess={handleArticleSuccess}
          />
        ) : (
          <KnowledgeListPage onNavigate={handleNavigate} />
        );
      case 'analytics':
        return <AnalyticsDashboardPage onNavigate={handleNavigate} />;
      case 'analytics-reports':
        return <AnalyticsReportsPage onNavigate={handleNavigate} />;
      case 'notifications':
        return <NotificationsCenterPage onNavigate={handleNavigate} />;
      case 'notifications-preferences':
        return (
          <NotificationsPreferencesPage
            onBack={() => handleNavigate('/notifications')}
            onNavigate={handleNavigate}
          />
        );
      default:
        return <DashboardPage />;
    }
  };

  // Settings page uses its own layout
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

export default AppModern;

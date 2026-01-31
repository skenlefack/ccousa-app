import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsLayout } from '../../components/layout/SettingsLayout';
import { SystemConfigPage } from './SystemConfigPage';
import { EventCategoriesPage } from './EventCategoriesPage';
import { DocumentTypesPage } from './DocumentTypesPage';
import { OrganizationalUnitsPage } from './OrganizationalUnitsPage';
import { WorkSchedulesPage } from './WorkSchedulesPage';

// Placeholder components for sections not yet implemented
const NotificationsSettings: React.FC = () => (
  <div className="text-center py-12">
    <h3 className="text-lg font-medium text-dark-900 dark:text-white mb-2">
      Paramètres de notifications
    </h3>
    <p className="text-dark-500 dark:text-dark-400">
      Cette section sera disponible prochainement.
    </p>
  </div>
);

const SecuritySettings: React.FC = () => (
  <div className="text-center py-12">
    <h3 className="text-lg font-medium text-dark-900 dark:text-white mb-2">
      Paramètres de sécurité
    </h3>
    <p className="text-dark-500 dark:text-dark-400">
      Cette section sera disponible prochainement.
    </p>
  </div>
);

const AppearanceSettings: React.FC = () => (
  <div className="text-center py-12">
    <h3 className="text-lg font-medium text-dark-900 dark:text-white mb-2">
      Paramètres d'apparence
    </h3>
    <p className="text-dark-500 dark:text-dark-400">
      Cette section sera disponible prochainement.
    </p>
  </div>
);

export const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('system');

  const renderSection = () => {
    switch (activeSection) {
      case 'system':
        return <SystemConfigPage />;
      case 'categories':
        return <EventCategoriesPage />;
      case 'document-types':
        return <DocumentTypesPage />;
      case 'organizational-units':
        return <OrganizationalUnitsPage />;
      case 'work-schedules':
        return <WorkSchedulesPage />;
      case 'notifications':
        return <NotificationsSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'appearance':
        return <AppearanceSettings />;
      default:
        return <SystemConfigPage />;
    }
  };

  return (
    <SettingsLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderSection()}
        </motion.div>
      </AnimatePresence>
    </SettingsLayout>
  );
};

export default SettingsPage;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Play,
  Clock,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  ChevronDown,
  BarChart3,
  Users,
  ClipboardList,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  X,
  Settings,
  Mail,
} from 'lucide-react';
import { Card, CardHeader, Button, Badge, Input, Modal, Spinner } from '../../components/ui';
import { cn } from '../../utils/cn';
import { formatDate, formatRelativeTime } from '../../utils/format';
import {
  useReports,
  useReportTemplates,
  useScheduledReports,
  useCreateReport,
  useDeleteReport,
  useRunReport,
  useExportReport,
} from '../../hooks/useAnalytics';
import type { Report, ReportResult } from '../../services/analytics.service';

interface AnalyticsReportsPageProps {
  onNavigate?: (path: string) => void;
}

// Mock data for demo
const mockReports: Report[] = [
  {
    id: '1',
    name: 'Rapport mensuel des evenements',
    description: 'Resume des evenements du mois avec tendances et statistiques',
    type: 'events',
    createdBy: 'user1',
    createdByName: 'Dr. Marie Nguyen',
    isTemplate: false,
    isScheduled: true,
    lastRunAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    name: 'Statistiques utilisateurs',
    description: 'Analyse de l\'activite et de l\'engagement des utilisateurs',
    type: 'users',
    createdBy: 'user1',
    createdByName: 'Dr. Marie Nguyen',
    isTemplate: false,
    isScheduled: false,
    lastRunAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    name: 'Rapport de conformite procedures',
    description: 'Suivi de l\'application des procedures par departement',
    type: 'procedures',
    createdBy: 'user2',
    createdByName: 'Jean Kamga',
    isTemplate: false,
    isScheduled: true,
    lastRunAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    name: 'Analyse soumissions formulaires',
    description: 'Statistiques des soumissions de formulaires par type et periode',
    type: 'forms',
    createdBy: 'user3',
    createdByName: 'Alice Fouda',
    isTemplate: false,
    isScheduled: false,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockTemplates: Report[] = [
  {
    id: 't1',
    name: 'Rapport mensuel standard',
    description: 'Template pour rapport mensuel avec KPIs principaux',
    type: 'custom',
    createdBy: 'system',
    isTemplate: true,
    isScheduled: false,
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't2',
    name: 'Rapport d\'activite equipe',
    description: 'Suivi de l\'activite par equipe et utilisateur',
    type: 'users',
    createdBy: 'system',
    isTemplate: true,
    isScheduled: false,
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't3',
    name: 'Rapport incidents',
    description: 'Resume des incidents et evenements critiques',
    type: 'events',
    createdBy: 'system',
    isTemplate: true,
    isScheduled: false,
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const reportTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  events: { label: 'Evenements', icon: <AlertTriangle className="w-4 h-4" />, color: 'amber' },
  procedures: { label: 'Procedures', icon: <ClipboardList className="w-4 h-4" />, color: 'emerald' },
  forms: { label: 'Formulaires', icon: <FileText className="w-4 h-4" />, color: 'blue' },
  users: { label: 'Utilisateurs', icon: <Users className="w-4 h-4" />, color: 'purple' },
  knowledge: { label: 'Articles', icon: <BookOpen className="w-4 h-4" />, color: 'pink' },
  custom: { label: 'Personnalise', icon: <BarChart3 className="w-4 h-4" />, color: 'gray' },
};

export const AnalyticsReportsPage: React.FC<AnalyticsReportsPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reports' | 'templates' | 'scheduled'>('reports');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Queries
  const { data: reports, isLoading } = useReports({});
  const { data: templates } = useReportTemplates();
  const { data: scheduledReports } = useScheduledReports();

  // Mutations
  const deleteMutation = useDeleteReport();
  const runMutation = useRunReport();
  const exportMutation = useExportReport();

  // Use mock data if API not available
  const displayReports = reports || mockReports;
  const displayTemplates = templates || mockTemplates;
  const displayScheduled = scheduledReports || mockReports.filter(r => r.isScheduled);

  // Filter reports
  const filteredReports = displayReports.filter(report => {
    const matchesSearch = searchQuery
      ? report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesType = selectedType ? report.type === selectedType : true;
    return matchesSearch && matchesType;
  });

  const handleRunReport = async (report: Report) => {
    try {
      const result = await runMutation.mutateAsync({ id: report.id });
      setReportResult(result.data);
      setShowRunModal(true);
    } catch (error) {
      console.error('Failed to run report:', error);
    }
  };

  const handleExportReport = async (report: Report, format: 'pdf' | 'excel' | 'csv') => {
    try {
      const result = await exportMutation.mutateAsync({ reportId: report.id, format });
      if (result.data.downloadUrl) {
        window.open(result.data.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const handleDeleteReport = async () => {
    if (!selectedReport) return;
    try {
      await deleteMutation.mutateAsync(selectedReport.id);
      setShowDeleteModal(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  const getTypeColor = (type: string) => {
    const config = reportTypeConfig[type];
    if (!config) return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
    switch (config.color) {
      case 'amber': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
      case 'emerald': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'blue': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'purple': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'pink': return 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const renderReportCard = (report: Report, isTemplate = false) => (
    <motion.div
      key={report.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="p-5 h-full hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div className={cn('p-2 rounded-lg', getTypeColor(report.type))}>
            {reportTypeConfig[report.type]?.icon || <FileText className="w-4 h-4" />}
          </div>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setOpenMenuId(openMenuId === report.id ? null : report.id)}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>

            <AnimatePresence>
              {openMenuId === report.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-1 w-48 rounded-xl bg-white dark:bg-dark-800 shadow-lg border border-dark-200 dark:border-dark-700 py-1 z-10"
                >
                  {!isTemplate && (
                    <>
                      <button
                        onClick={() => {
                          handleRunReport(report);
                          setOpenMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Executer
                      </button>
                      <button
                        onClick={() => {
                          handleExportReport(report, 'pdf');
                          setOpenMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Exporter PDF
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setOpenMenuId(null)}
                    className="w-full px-4 py-2 text-left text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Dupliquer
                  </button>
                  {!isTemplate && (
                    <>
                      <button
                        onClick={() => setOpenMenuId(null)}
                        className="w-full px-4 py-2 text-left text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Modifier
                      </button>
                      <hr className="my-1 border-dark-200 dark:border-dark-700" />
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowDeleteModal(true);
                          setOpenMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-dark-900 dark:text-white line-clamp-1">
            {report.name}
          </h3>
          {report.description && (
            <p className="mt-1 text-sm text-dark-500 dark:text-dark-400 line-clamp-2">
              {report.description}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" size="sm">
            {reportTypeConfig[report.type]?.label || report.type}
          </Badge>
          {report.isScheduled && (
            <Badge variant="primary" size="sm" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Programme
            </Badge>
          )}
          {isTemplate && (
            <Badge variant="success" size="sm">
              Template
            </Badge>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-dark-100 dark:border-dark-700">
          <div className="flex items-center justify-between text-xs text-dark-500 dark:text-dark-400">
            {report.lastRunAt ? (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                Execute {formatRelativeTime(report.lastRunAt)}
              </span>
            ) : (
              <span>Cree {formatRelativeTime(report.createdAt)}</span>
            )}
            {report.createdByName && (
              <span>par {report.createdByName}</span>
            )}
          </div>
        </div>

        {!isTemplate && (
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={() => handleRunReport(report)}
              disabled={runMutation.isPending}
            >
              <Play className="w-4 h-4 mr-1" />
              Executer
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExportReport(report, 'excel')}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        )}

        {isTemplate && (
          <div className="mt-4">
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => onNavigate?.(`/analytics/reports/new?template=${report.id}`)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Utiliser ce template
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
            Rapports
          </h1>
          <p className="mt-1 text-dark-500 dark:text-dark-400">
            Creez et gerez vos rapports personnalises
          </p>
        </div>

        <Button variant="primary" onClick={() => onNavigate?.('/analytics/reports/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau rapport
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-dark-100 dark:bg-dark-800 rounded-xl w-fit">
        {[
          { key: 'reports', label: 'Mes rapports', count: displayReports.length },
          { key: 'templates', label: 'Templates', count: displayTemplates.length },
          { key: 'scheduled', label: 'Programmes', count: displayScheduled.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
              activeTab === tab.key
                ? 'bg-white dark:bg-dark-700 text-dark-900 dark:text-white shadow'
                : 'text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white'
            )}
          >
            {tab.label}
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs',
              activeTab === tab.key
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'bg-dark-200 text-dark-600 dark:bg-dark-600 dark:text-dark-400'
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      {activeTab === 'reports' && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <Input
              placeholder="Rechercher un rapport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedType || ''}
              onChange={(e) => setSelectedType(e.target.value || null)}
              className="h-10 px-3 rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tous les types</option>
              {Object.entries(reportTypeConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {activeTab === 'reports' && (
            <>
              {filteredReports.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-100 dark:bg-dark-700 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-dark-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                    Aucun rapport trouve
                  </h3>
                  <p className="mt-2 text-dark-500 dark:text-dark-400">
                    {searchQuery || selectedType
                      ? 'Essayez de modifier vos criteres de recherche'
                      : 'Commencez par creer votre premier rapport'}
                  </p>
                  {!searchQuery && !selectedType && (
                    <Button
                      variant="primary"
                      className="mt-4"
                      onClick={() => onNavigate?.('/analytics/reports/new')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Creer un rapport
                    </Button>
                  )}
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredReports.map((report) => renderReportCard(report))}
                </div>
              )}
            </>
          )}

          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayTemplates.map((template) => renderReportCard(template, true))}
            </div>
          )}

          {activeTab === 'scheduled' && (
            <>
              {displayScheduled.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-100 dark:bg-dark-700 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-dark-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                    Aucun rapport programme
                  </h3>
                  <p className="mt-2 text-dark-500 dark:text-dark-400">
                    Programmez l'execution automatique de vos rapports
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {displayScheduled.map((report) => (
                    <Card key={report.id} className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn('p-3 rounded-xl', getTypeColor(report.type))}>
                            {reportTypeConfig[report.type]?.icon || <FileText className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-dark-900 dark:text-white">
                              {report.name}
                            </h3>
                            <p className="text-sm text-dark-500 dark:text-dark-400">
                              {report.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-dark-900 dark:text-white flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Hebdomadaire
                            </p>
                            <p className="text-xs text-dark-500 dark:text-dark-400">
                              Prochaine execution: Lundi 08:00
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="success" size="sm">Actif</Badge>
                            <Button variant="ghost" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer le rapport"
      >
        <div className="space-y-4">
          <p className="text-dark-600 dark:text-dark-400">
            Etes-vous sur de vouloir supprimer le rapport "{selectedReport?.name}" ?
            Cette action est irreversible.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteReport}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Result Modal */}
      <Modal
        isOpen={showRunModal}
        onClose={() => {
          setShowRunModal(false);
          setReportResult(null);
        }}
        title="Resultat du rapport"
        size="lg"
      >
        {reportResult ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-dark-900 dark:text-white">
                  {reportResult.reportName}
                </h3>
                <p className="text-sm text-dark-500 dark:text-dark-400">
                  Genere le {formatDate(reportResult.generatedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleExportReport(selectedReport!, 'pdf')}>
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleExportReport(selectedReport!, 'excel')}>
                  <Download className="w-4 h-4 mr-1" />
                  Excel
                </Button>
              </div>
            </div>

            <div className="border border-dark-200 dark:border-dark-700 rounded-lg overflow-hidden">
              <div className="p-4 bg-dark-50 dark:bg-dark-800 text-center">
                <p className="text-dark-500 dark:text-dark-400">
                  {reportResult.totalRows} lignes de donnees
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AnalyticsReportsPage;

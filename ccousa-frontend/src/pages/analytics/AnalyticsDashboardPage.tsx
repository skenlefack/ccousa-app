import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  FileText,
  BookOpen,
  ClipboardList,
  Activity,
  ArrowRight,
  Download,
  RefreshCw,
  Filter,
  ChevronDown,
  BarChart3,
  PieChart,
  LineChart,
  Clock,
  Eye,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, Button, Badge, Spinner } from '../../components/ui';
import { cn } from '../../utils/cn';
import { formatRelativeTime, formatNumber } from '../../utils/format';
import {
  useDashboardStats,
  useKpiCards,
  useModuleStats,
  useRecentActivity,
  useUserActivityChart,
  useModuleDistributionChart,
  useGrowthMetrics,
  useExportDashboard,
} from '../../hooks/useAnalytics';
import type { KpiCard, ActivityLog, ChartData, ModuleStats } from '../../services/analytics.service';

interface AnalyticsDashboardPageProps {
  onNavigate?: (path: string) => void;
}

// Date range options
const dateRanges = [
  { label: '7 derniers jours', value: '7d', startDate: getDateOffset(-7) },
  { label: '30 derniers jours', value: '30d', startDate: getDateOffset(-30) },
  { label: '3 derniers mois', value: '3m', startDate: getDateOffset(-90) },
  { label: '12 derniers mois', value: '12m', startDate: getDateOffset(-365) },
  { label: 'Cette annee', value: 'year', startDate: getYearStart() },
];

function getDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function getYearStart(): string {
  const date = new Date();
  return new Date(date.getFullYear(), 0, 1).toISOString().split('T')[0];
}

// Mock data for demo
const mockKpis: KpiCard[] = [
  { id: '1', label: 'Utilisateurs actifs', value: 892, previousValue: 845, change: 5.6, changeType: 'increase', format: 'number', icon: 'users', color: 'purple' },
  { id: '2', label: 'Evenements ce mois', value: 47, previousValue: 52, change: -9.6, changeType: 'decrease', format: 'number', icon: 'calendar', color: 'amber' },
  { id: '3', label: 'Articles publies', value: 234, previousValue: 198, change: 18.2, changeType: 'increase', format: 'number', icon: 'book', color: 'emerald' },
  { id: '4', label: 'Soumissions formulaires', value: 1247, previousValue: 1102, change: 13.2, changeType: 'increase', format: 'number', icon: 'clipboard', color: 'blue' },
];

const mockModuleStats: ModuleStats[] = [
  { module: 'events', label: 'Evenements', total: 234, active: 47, trend: 12, chartData: [] },
  { module: 'procedures', label: 'Procedures', total: 89, active: 34, trend: 5, chartData: [] },
  { module: 'forms', label: 'Formulaires', total: 156, active: 78, trend: -3, chartData: [] },
  { module: 'knowledge', label: 'Articles', total: 412, active: 234, trend: 18, chartData: [] },
];

const mockActivity: ActivityLog[] = [
  { id: '1', userId: '1', userName: 'Dr. Marie Nguyen', action: 'a cree un nouvel evenement', actionType: 'create', resourceType: 'event', resourceName: 'Foyer grippe aviaire', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: '2', userId: '2', userName: 'Jean Kamga', action: 'a publie un article', actionType: 'update', resourceType: 'article', resourceName: 'Guide de vaccination', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: '3', userId: '3', userName: 'Alice Fouda', action: 'a soumis un formulaire', actionType: 'submit', resourceType: 'form', resourceName: 'Rapport inspection', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: '4', userId: '4', userName: 'Paul Mbarga', action: 's\'est connecte', actionType: 'login', resourceType: 'user', createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
  { id: '5', userId: '5', userName: 'Sarah Ngo', action: 'a exporte un rapport', actionType: 'export', resourceType: 'report', resourceName: 'Statistiques mensuelles', createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
];

const mockChartData = {
  userActivity: [
    { label: 'Lun', value: 120 },
    { label: 'Mar', value: 145 },
    { label: 'Mer', value: 132 },
    { label: 'Jeu', value: 178 },
    { label: 'Ven', value: 165 },
    { label: 'Sam', value: 89 },
    { label: 'Dim', value: 67 },
  ],
  moduleDistribution: [
    { label: 'Evenements', value: 35, color: '#f59e0b' },
    { label: 'Procedures', value: 20, color: '#10b981' },
    { label: 'Formulaires', value: 25, color: '#3b82f6' },
    { label: 'Articles', value: 20, color: '#8b5cf6' },
  ],
};

export const AnalyticsDashboardPage: React.FC<AnalyticsDashboardPageProps> = ({ onNavigate }) => {
  const [selectedRange, setSelectedRange] = useState('30d');
  const [isRangeOpen, setIsRangeOpen] = useState(false);

  // Queries (using mock data for now)
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: kpis, isLoading: kpisLoading } = useKpiCards();
  const { data: moduleStats, isLoading: moduleStatsLoading } = useModuleStats();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(10);
  const { data: growthMetrics } = useGrowthMetrics('month');

  const exportMutation = useExportDashboard();

  // Use mock data if API not available
  const displayKpis = kpis || mockKpis;
  const displayModuleStats = moduleStats || mockModuleStats;
  const displayActivity = recentActivity || mockActivity;

  const selectedRangeLabel = dateRanges.find(r => r.value === selectedRange)?.label || '30 derniers jours';

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const result = await exportMutation.mutateAsync({
        format,
        includeCharts: true,
        dateRange: {
          start: dateRanges.find(r => r.value === selectedRange)?.startDate || getDateOffset(-30),
          end: new Date().toISOString().split('T')[0],
        },
      });
      if (result.data.downloadUrl) {
        window.open(result.data.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getKpiIcon = (icon?: string) => {
    switch (icon) {
      case 'users': return <Users className="w-6 h-6" />;
      case 'calendar': return <Calendar className="w-6 h-6" />;
      case 'book': return <BookOpen className="w-6 h-6" />;
      case 'clipboard': return <ClipboardList className="w-6 h-6" />;
      default: return <Activity className="w-6 h-6" />;
    }
  };

  const getKpiColor = (color?: string) => {
    switch (color) {
      case 'purple': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'amber': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
      case 'emerald': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'blue': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'update': return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'delete': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'view': return <Eye className="w-4 h-4 text-gray-500" />;
      case 'login': return <Users className="w-4 h-4 text-purple-500" />;
      case 'export': return <Download className="w-4 h-4 text-amber-500" />;
      case 'submit': return <FileText className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
            Tableau de bord analytique
          </h1>
          <p className="mt-1 text-dark-500 dark:text-dark-400">
            Vue d'ensemble des performances et de l'activite
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="relative">
            <Button
              variant="secondary"
              onClick={() => setIsRangeOpen(!isRangeOpen)}
              className="min-w-[180px] justify-between"
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {selectedRangeLabel}
              </span>
              <ChevronDown className={cn('w-4 h-4 transition-transform', isRangeOpen && 'rotate-180')} />
            </Button>

            {isRangeOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-dark-800 shadow-lg border border-dark-200 dark:border-dark-700 py-2 z-10"
              >
                {dateRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => {
                      setSelectedRange(range.value);
                      setIsRangeOpen(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm transition-colors',
                      selectedRange === range.value
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700'
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Export Button */}
          <Button
            variant="secondary"
            onClick={() => handleExport('pdf')}
            disabled={exportMutation.isPending}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayKpis.map((kpi, index) => (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-5 h-full">
              <div className="flex items-start justify-between">
                <div className={cn('p-3 rounded-xl', getKpiColor(kpi.color))}>
                  {getKpiIcon(kpi.icon)}
                </div>
                {kpi.change !== undefined && (
                  <div className={cn(
                    'flex items-center gap-1 text-sm font-medium',
                    kpi.changeType === 'increase' ? 'text-emerald-600 dark:text-emerald-400' :
                    kpi.changeType === 'decrease' ? 'text-red-600 dark:text-red-400' :
                    'text-dark-500 dark:text-dark-400'
                  )}>
                    {kpi.changeType === 'increase' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : kpi.changeType === 'decrease' ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : null}
                    {Math.abs(kpi.change).toFixed(1)}%
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-dark-500 dark:text-dark-400">{kpi.label}</p>
                <p className="mt-1 text-3xl font-bold text-dark-900 dark:text-white">
                  {formatNumber(kpi.value)}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Activity Chart */}
        <Card className="lg:col-span-2 p-6">
          <CardHeader
            title="Activite des utilisateurs"
            subtitle="Connexions et actions par jour"
            action={
              <Button variant="ghost" size="sm">
                <LineChart className="w-4 h-4 mr-2" />
                Details
              </Button>
            }
          />
          <div className="mt-6 h-64">
            <div className="flex items-end justify-between h-full gap-2">
              {mockChartData.userActivity.map((point, index) => {
                const maxValue = Math.max(...mockChartData.userActivity.map(p => p.value));
                const height = (point.value / maxValue) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: index * 0.05, duration: 0.5 }}
                      className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg min-h-[4px]"
                    />
                    <span className="text-xs text-dark-500 dark:text-dark-400">{point.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Module Distribution */}
        <Card className="p-6">
          <CardHeader
            title="Repartition par module"
            subtitle="Utilisation relative"
            action={
              <Button variant="ghost" size="sm">
                <PieChart className="w-4 h-4" />
              </Button>
            }
          />
          <div className="mt-6 space-y-4">
            {mockChartData.moduleDistribution.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dark-700 dark:text-dark-300">{item.label}</span>
                  <span className="font-medium text-dark-900 dark:text-white">{item.value}%</span>
                </div>
                <div className="h-2 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Module Stats & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Stats */}
        <Card className="p-6">
          <CardHeader
            title="Statistiques par module"
            subtitle="Apercu des donnees"
            action={
              <Button variant="ghost" size="sm" onClick={() => onNavigate?.('/analytics/reports')}>
                Voir rapports
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            }
          />
          <div className="mt-4 space-y-3">
            {displayModuleStats.map((stat, index) => (
              <motion.div
                key={stat.module}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-dark-50 dark:bg-dark-700/50 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'p-2 rounded-lg',
                    stat.module === 'events' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                    stat.module === 'procedures' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    stat.module === 'forms' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                  )}>
                    {stat.module === 'events' ? <Calendar className="w-5 h-5" /> :
                     stat.module === 'procedures' ? <ClipboardList className="w-5 h-5" /> :
                     stat.module === 'forms' ? <FileText className="w-5 h-5" /> :
                     <BookOpen className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-dark-900 dark:text-white">{stat.label}</p>
                    <p className="text-sm text-dark-500 dark:text-dark-400">
                      {stat.active} actifs sur {stat.total} total
                    </p>
                  </div>
                </div>
                <div className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  stat.trend > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                  stat.trend < 0 ? 'text-red-600 dark:text-red-400' :
                  'text-dark-500 dark:text-dark-400'
                )}>
                  {stat.trend > 0 ? <TrendingUp className="w-4 h-4" /> :
                   stat.trend < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                  {stat.trend > 0 ? '+' : ''}{stat.trend}%
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <CardHeader
            title="Activite recente"
            subtitle="Dernieres actions"
            action={
              <Button variant="ghost" size="sm" onClick={() => onNavigate?.('/analytics/activity')}>
                Voir tout
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            }
          />
          <div className="mt-4 space-y-1">
            {displayActivity.slice(0, 5).map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getActionIcon(activity.actionType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dark-900 dark:text-white">
                    <span className="font-medium">{activity.userName}</span>{' '}
                    <span className="text-dark-600 dark:text-dark-400">{activity.action}</span>
                    {activity.resourceName && (
                      <>
                        {' : '}
                        <span className="font-medium text-primary-600 dark:text-primary-400">
                          {activity.resourceName}
                        </span>
                      </>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-dark-400 dark:text-dark-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(activity.createdAt)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <CardHeader
          title="Actions rapides"
          subtitle="Accedez rapidement aux fonctionnalites"
        />
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Button
            variant="secondary"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => onNavigate?.('/analytics/reports/new')}
          >
            <BarChart3 className="w-6 h-6 text-primary-600" />
            <span>Nouveau rapport</span>
          </Button>
          <Button
            variant="secondary"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => handleExport('excel')}
          >
            <Download className="w-6 h-6 text-emerald-600" />
            <span>Exporter Excel</span>
          </Button>
          <Button
            variant="secondary"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => onNavigate?.('/analytics/reports')}
          >
            <FileText className="w-6 h-6 text-blue-600" />
            <span>Mes rapports</span>
          </Button>
          <Button
            variant="secondary"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => onNavigate?.('/analytics/activity')}
          >
            <Activity className="w-6 h-6 text-purple-600" />
            <span>Journal activite</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsDashboardPage;

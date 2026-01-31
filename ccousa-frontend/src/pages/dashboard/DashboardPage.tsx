import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  ArrowRight,
  FileText,
  Bell,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, StatCard, Badge, Button } from '../../components/ui';
import { cn } from '../../utils/cn';
import { formatRelativeTime } from '../../utils/format';

// Mock data for demonstration
const statsData = [
  {
    label: 'Événements actifs',
    value: '47',
    change: 12,
    changeLabel: 'ce mois',
    icon: <AlertTriangle className="w-6 h-6" />,
    iconColor: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    label: 'En investigation',
    value: '23',
    change: -5,
    changeLabel: 'vs sem. dernière',
    icon: <Clock className="w-6 h-6" />,
    iconColor: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    label: 'Résolus ce mois',
    value: '156',
    change: 28,
    changeLabel: 'vs mois dernier',
    icon: <CheckCircle className="w-6 h-6" />,
    iconColor: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  {
    label: 'Utilisateurs actifs',
    value: '892',
    change: 4,
    changeLabel: 'cette semaine',
    icon: <Users className="w-6 h-6" />,
    iconColor: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  },
];

const recentEvents = [
  {
    id: '1',
    title: 'Foyer de grippe aviaire détecté',
    location: 'Yaoundé, Centre',
    status: 'INVESTIGATING',
    severity: 'HIGH',
    reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category: 'OUTBREAK',
  },
  {
    id: '2',
    title: 'Suspicion de rage canine',
    location: 'Douala, Littoral',
    status: 'REPORTED',
    severity: 'CRITICAL',
    reportedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    category: 'INVESTIGATION',
  },
  {
    id: '3',
    title: 'Campagne de vaccination terminée',
    location: 'Garoua, Nord',
    status: 'RESOLVED',
    severity: 'LOW',
    reportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    category: 'VACCINATION',
  },
  {
    id: '4',
    title: 'Inspection sanitaire programmée',
    location: 'Bafoussam, Ouest',
    status: 'CONFIRMED',
    severity: 'MEDIUM',
    reportedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    category: 'INSPECTION',
  },
];

const activityTimeline = [
  {
    id: '1',
    user: 'Dr. Marie Nguyen',
    action: 'a créé un nouvel événement',
    target: 'Foyer de grippe aviaire',
    time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    type: 'create',
  },
  {
    id: '2',
    user: 'Jean-Paul Mbeki',
    action: 'a mis à jour le statut',
    target: 'Investigation #234',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    type: 'update',
  },
  {
    id: '3',
    user: 'Système',
    action: 'a généré le rapport hebdomadaire',
    target: 'Rapport Semaine 4',
    time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    type: 'system',
  },
  {
    id: '4',
    user: 'Aminata Diallo',
    action: 'a clôturé l\'événement',
    target: 'Campagne vaccination Nord',
    time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    type: 'complete',
  },
];

const severityConfig = {
  LOW: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Faible' },
  MEDIUM: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'Moyen' },
  HIGH: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'Élevé' },
  CRITICAL: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Critique' },
};

const statusConfig = {
  REPORTED: { color: 'bg-blue-100 text-blue-700', label: 'Signalé' },
  INVESTIGATING: { color: 'bg-amber-100 text-amber-700', label: 'Investigation' },
  CONFIRMED: { color: 'bg-purple-100 text-purple-700', label: 'Confirmé' },
  RESOLVED: { color: 'bg-emerald-100 text-emerald-700', label: 'Résolu' },
  CLOSED: { color: 'bg-dark-100 text-dark-700', label: 'Clôturé' },
};

// Simple chart visualization component
const MiniChart: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((value, index) => {
        const height = ((value - min) / range) * 100;
        return (
          <motion.div
            key={index}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(height, 10)}%` }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className={cn('flex-1 rounded-sm', color)}
          />
        );
      })}
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const chartData = {
    events: [12, 19, 15, 25, 22, 30, 28, 35, 32, 40, 38, 47],
    resolved: [8, 12, 10, 18, 20, 25, 22, 28, 30, 35, 32, 40],
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
            Tableau de bord
          </h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            Vue d'ensemble de la situation sanitaire
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" leftIcon={<Calendar className="w-4 h-4" />}>
            Derniers 30 jours
          </Button>
          <Button leftIcon={<FileText className="w-4 h-4" />}>
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard
              label={stat.label}
              value={stat.value}
              change={stat.change}
              changeLabel={stat.changeLabel}
              icon={stat.icon}
              iconColor={stat.iconColor}
            />
          </motion.div>
        ))}
      </div>

      {/* Charts and Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events Trend Chart */}
        <Card variant="glass" padding="lg" className="lg:col-span-2">
          <CardHeader
            title="Tendance des événements"
            subtitle="Évolution sur les 12 derniers mois"
            icon={<Activity className="w-5 h-5" />}
            action={
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Détails
              </Button>
            }
          />
          <div className="space-y-6">
            {/* Legend */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-500" />
                <span className="text-sm text-dark-600 dark:text-dark-300">Nouveaux événements</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-dark-600 dark:text-dark-300">Résolus</span>
              </div>
            </div>

            {/* Chart */}
            <div className="h-48 flex items-end gap-2">
              {chartData.events.map((value, index) => (
                <div key={index} className="flex-1 flex flex-col gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(chartData.resolved[index] / 50) * 100}%` }}
                    transition={{ delay: index * 0.05, duration: 0.5 }}
                    className="w-full bg-emerald-500 rounded-t opacity-70"
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${((value - chartData.resolved[index]) / 50) * 100}%` }}
                    transition={{ delay: index * 0.05 + 0.1, duration: 0.5 }}
                    className="w-full bg-primary-500 rounded-t"
                  />
                </div>
              ))}
            </div>

            {/* X-axis labels */}
            <div className="flex gap-2 text-xs text-dark-400">
              {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((month) => (
                <div key={month} className="flex-1 text-center">{month}</div>
              ))}
            </div>
          </div>
        </Card>

        {/* Activity Timeline */}
        <Card variant="glass" padding="lg">
          <CardHeader
            title="Activité récente"
            subtitle="Dernières actions"
            icon={<Zap className="w-5 h-5" />}
          />
          <div className="space-y-4 mt-4">
            {activityTimeline.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-3"
              >
                <div className="relative">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium',
                      activity.type === 'create' && 'bg-blue-500',
                      activity.type === 'update' && 'bg-amber-500',
                      activity.type === 'complete' && 'bg-emerald-500',
                      activity.type === 'system' && 'bg-purple-500'
                    )}
                  >
                    {activity.user.charAt(0)}
                  </div>
                  {index < activityTimeline.length - 1 && (
                    <div className="absolute left-4 top-8 w-px h-full bg-dark-200 dark:bg-dark-700" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm text-dark-900 dark:text-white">
                    <span className="font-medium">{activity.user}</span>
                    {' '}{activity.action}
                  </p>
                  <p className="text-sm text-primary-600 dark:text-primary-400">
                    {activity.target}
                  </p>
                  <p className="text-xs text-dark-400 mt-1">
                    {formatRelativeTime(activity.time)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Events */}
      <Card variant="glass" padding="lg">
        <CardHeader
          title="Événements récents"
          subtitle="Les derniers événements signalés"
          icon={<AlertTriangle className="w-5 h-5" />}
          action={
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Voir tous
            </Button>
          }
        />
        <div className="overflow-x-auto mt-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-200 dark:border-dark-700">
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Événement
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Localisation
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Sévérité
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
              {recentEvents.map((event, index) => (
                <motion.tr
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-dark-50 dark:hover:bg-dark-700/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-dark-900 dark:text-white">
                        {event.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-dark-600 dark:text-dark-300">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant="default"
                      size="sm"
                      className={severityConfig[event.severity as keyof typeof severityConfig].color}
                    >
                      {severityConfig[event.severity as keyof typeof severityConfig].label}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant="default"
                      size="sm"
                      className={statusConfig[event.status as keyof typeof statusConfig].color}
                    >
                      {statusConfig[event.status as keyof typeof statusConfig].label}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-dark-500">
                    {formatRelativeTime(event.reportedAt)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Créer un événement', icon: AlertTriangle, color: 'from-amber-500 to-orange-500' },
          { label: 'Lancer une procédure', icon: FileText, color: 'from-blue-500 to-cyan-500' },
          { label: 'Générer un rapport', icon: Activity, color: 'from-emerald-500 to-green-500' },
          { label: 'Envoyer une alerte', icon: Bell, color: 'from-purple-500 to-pink-500' },
        ].map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'p-4 rounded-xl text-left',
              'bg-gradient-to-br shadow-lg',
              action.color,
              'text-white'
            )}
          >
            <action.icon className="w-6 h-6 mb-3" />
            <p className="font-semibold">{action.label}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;

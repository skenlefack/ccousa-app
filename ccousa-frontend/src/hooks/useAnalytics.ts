/**
 * Analytics Hooks
 * React Query hooks for dashboard, charts, reports, and activity tracking
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  dashboardService,
  chartsService,
  activityService,
  reportsService,
  exportService,
  trendsService,
  type AnalyticsQueryParams,
  type ExportOptions,
  type Report,
  type ReportSchedule,
  type ReportParameter,
  type ReportColumn,
  type ReportFilter,
} from '../services/analytics.service';

// ===========================================
// Query Keys
// ===========================================

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  kpis: () => [...dashboardKeys.all, 'kpis'] as const,
  overview: (params: AnalyticsQueryParams) => [...dashboardKeys.all, 'overview', params] as const,
  modules: (module?: string) => [...dashboardKeys.all, 'modules', module] as const,
  realtime: () => [...dashboardKeys.all, 'realtime'] as const,
};

export const chartKeys = {
  all: ['charts'] as const,
  available: () => [...chartKeys.all, 'available'] as const,
  data: (chartId: string, params: AnalyticsQueryParams) => [...chartKeys.all, 'data', chartId, params] as const,
  moduleDistribution: () => [...chartKeys.all, 'module-distribution'] as const,
};

export const activityKeys = {
  all: ['activity'] as const,
  logs: (params: {
    page?: number;
    pageSize?: number;
    userId?: string;
    actionType?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
  }) => [...activityKeys.all, 'logs', params] as const,
  recent: (limit: number) => [...activityKeys.all, 'recent', limit] as const,
  summary: (params: AnalyticsQueryParams) => [...activityKeys.all, 'summary', params] as const,
  engagement: (limit?: number) => [...activityKeys.all, 'engagement', limit] as const,
};

export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (params: { type?: string; isTemplate?: boolean }) => [...reportKeys.lists(), params] as const,
  details: () => [...reportKeys.all, 'detail'] as const,
  detail: (id: string) => [...reportKeys.details(), id] as const,
  templates: () => [...reportKeys.all, 'templates'] as const,
  scheduled: () => [...reportKeys.all, 'scheduled'] as const,
  history: (id: string) => [...reportKeys.all, 'history', id] as const,
};

export const trendsKeys = {
  all: ['trends'] as const,
  data: (params: AnalyticsQueryParams) => [...trendsKeys.all, 'data', params] as const,
  growth: (period: 'week' | 'month' | 'quarter' | 'year') => [...trendsKeys.all, 'growth', period] as const,
  forecast: (metric: string, periods: number) => [...trendsKeys.all, 'forecast', metric, periods] as const,
};

// ===========================================
// Dashboard Hooks
// ===========================================

/**
 * Get main dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardService.getStats(),
    select: (response) => response.data,
  });
}

/**
 * Get KPI cards for dashboard
 */
export function useKpiCards() {
  return useQuery({
    queryKey: dashboardKeys.kpis(),
    queryFn: () => dashboardService.getKpiCards(),
    select: (response) => response.data,
  });
}

/**
 * Get overview metrics with date range
 */
export function useDashboardOverview(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: dashboardKeys.overview(params),
    queryFn: () => dashboardService.getOverview(params),
    select: (response) => response.data,
  });
}

/**
 * Get module-specific statistics
 */
export function useModuleStats(module?: string) {
  return useQuery({
    queryKey: dashboardKeys.modules(module),
    queryFn: () => dashboardService.getModuleStats(module),
    select: (response) => response.data,
  });
}

/**
 * Get real-time stats (for live updates)
 */
export function useRealTimeStats(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.realtime(),
    queryFn: () => dashboardService.getRealTimeStats(),
    select: (response) => response.data,
    enabled,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// ===========================================
// Charts Hooks
// ===========================================

/**
 * Get available charts
 */
export function useAvailableCharts() {
  return useQuery({
    queryKey: chartKeys.available(),
    queryFn: () => chartsService.getAvailableCharts(),
    select: (response) => response.data,
  });
}

/**
 * Get chart data by ID
 */
export function useChartData(chartId: string, params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: chartKeys.data(chartId, params),
    queryFn: () => chartsService.getChartData(chartId, params),
    select: (response) => response.data,
    enabled: !!chartId,
  });
}

/**
 * Get user activity chart
 */
export function useUserActivityChart(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: chartKeys.data('user-activity', params),
    queryFn: () => chartsService.getUserActivityChart(params),
    select: (response) => response.data,
  });
}

/**
 * Get events timeline chart
 */
export function useEventsTimelineChart(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: chartKeys.data('events-timeline', params),
    queryFn: () => chartsService.getEventsTimelineChart(params),
    select: (response) => response.data,
  });
}

/**
 * Get form submissions chart
 */
export function useFormSubmissionsChart(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: chartKeys.data('form-submissions', params),
    queryFn: () => chartsService.getFormSubmissionsChart(params),
    select: (response) => response.data,
  });
}

/**
 * Get article views chart
 */
export function useArticleViewsChart(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: chartKeys.data('article-views', params),
    queryFn: () => chartsService.getArticleViewsChart(params),
    select: (response) => response.data,
  });
}

/**
 * Get module distribution chart
 */
export function useModuleDistributionChart() {
  return useQuery({
    queryKey: chartKeys.moduleDistribution(),
    queryFn: () => chartsService.getModuleDistributionChart(),
    select: (response) => response.data,
  });
}

/**
 * Get trends comparison chart
 */
export function useTrendsChart(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: chartKeys.data('trends', params),
    queryFn: () => chartsService.getTrendsChart(params),
    select: (response) => response.data,
  });
}

// ===========================================
// Activity Hooks
// ===========================================

/**
 * Get activity logs with pagination
 */
export function useActivityLogs(params: {
  page?: number;
  pageSize?: number;
  userId?: string;
  actionType?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
} = {}) {
  return useQuery({
    queryKey: activityKeys.logs(params),
    queryFn: () => activityService.getLogs(params),
    select: (response) => ({
      logs: response.data,
      pagination: response.pagination,
    }),
  });
}

/**
 * Get recent activity
 */
export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: activityKeys.recent(limit),
    queryFn: () => activityService.getRecentActivity(limit),
    select: (response) => response.data,
  });
}

/**
 * Get activity summary by type
 */
export function useActivitySummary(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: activityKeys.summary(params),
    queryFn: () => activityService.getActivitySummary(params),
    select: (response) => response.data,
  });
}

/**
 * Get user engagement metrics
 */
export function useUserEngagement(limit?: number) {
  return useQuery({
    queryKey: activityKeys.engagement(limit),
    queryFn: () => activityService.getUserEngagement({ limit }),
    select: (response) => response.data,
  });
}

// ===========================================
// Reports Hooks
// ===========================================

/**
 * Get all reports
 */
export function useReports(params: { type?: string; isTemplate?: boolean } = {}) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: () => reportsService.getAll(params),
    select: (response) => response.data,
  });
}

/**
 * Get report by ID
 */
export function useReport(id: string) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => reportsService.getById(id),
    select: (response) => response.data,
    enabled: !!id,
  });
}

/**
 * Get report templates
 */
export function useReportTemplates() {
  return useQuery({
    queryKey: reportKeys.templates(),
    queryFn: () => reportsService.getTemplates(),
    select: (response) => response.data,
  });
}

/**
 * Get scheduled reports
 */
export function useScheduledReports() {
  return useQuery({
    queryKey: reportKeys.scheduled(),
    queryFn: () => reportsService.getScheduled(),
    select: (response) => response.data,
  });
}

/**
 * Get report run history
 */
export function useReportHistory(reportId: string) {
  return useQuery({
    queryKey: reportKeys.history(reportId),
    queryFn: () => reportsService.getRunHistory(reportId),
    select: (response) => response.data,
    enabled: !!reportId,
  });
}

/**
 * Create a new report
 */
export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      type: Report['type'];
      parameters?: ReportParameter[];
      columns?: ReportColumn[];
      filters?: ReportFilter[];
      isTemplate?: boolean;
    }) => reportsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}

/**
 * Update a report
 */
export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Report> }) =>
      reportsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}

/**
 * Delete a report
 */
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reportsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}

/**
 * Run/generate a report
 */
export function useRunReport() {
  return useMutation({
    mutationFn: ({ id, parameters }: { id: string; parameters?: Record<string, unknown> }) =>
      reportsService.run(id, parameters),
  });
}

/**
 * Schedule a report
 */
export function useScheduleReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, schedule }: { id: string; schedule: ReportSchedule }) =>
      reportsService.schedule(id, schedule),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: reportKeys.scheduled() });
    },
  });
}

/**
 * Unschedule a report
 */
export function useUnscheduleReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reportsService.unschedule(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: reportKeys.scheduled() });
    },
  });
}

// ===========================================
// Export Hooks
// ===========================================

/**
 * Export dashboard data
 */
export function useExportDashboard() {
  return useMutation({
    mutationFn: (options: ExportOptions) => exportService.exportDashboard(options),
  });
}

/**
 * Export report to file
 */
export function useExportReport() {
  return useMutation({
    mutationFn: ({ reportId, format }: { reportId: string; format: 'pdf' | 'excel' | 'csv' }) =>
      exportService.exportReport(reportId, format),
  });
}

/**
 * Export chart as image
 */
export function useExportChart() {
  return useMutation({
    mutationFn: ({ chartId, format }: { chartId: string; format?: 'png' | 'svg' }) =>
      exportService.exportChart(chartId, format),
  });
}

/**
 * Export activity logs
 */
export function useExportActivityLogs() {
  return useMutation({
    mutationFn: (params: { startDate?: string; endDate?: string; format: 'excel' | 'csv' }) =>
      exportService.exportActivityLogs(params),
  });
}

// ===========================================
// Trends Hooks
// ===========================================

/**
 * Get trends data
 */
export function useTrends(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: trendsKeys.data(params),
    queryFn: () => trendsService.getTrends(params),
    select: (response) => response.data,
  });
}

/**
 * Get growth metrics
 */
export function useGrowthMetrics(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
  return useQuery({
    queryKey: trendsKeys.growth(period),
    queryFn: () => trendsService.getGrowthMetrics(period),
    select: (response) => response.data,
  });
}

/**
 * Get forecast data
 */
export function useForecast(metric: string, periods = 6) {
  return useQuery({
    queryKey: trendsKeys.forecast(metric, periods),
    queryFn: () => trendsService.getForecast(metric, periods),
    select: (response) => response.data,
    enabled: !!metric,
  });
}

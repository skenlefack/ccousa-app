/**
 * Analytics Service
 * API services for dashboard statistics, charts, reports, and activity tracking
 */

import api from './api';

// ===========================================
// Types
// ===========================================

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  userGrowthRate: number;
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  eventCompletionRate: number;
  totalProcedures: number;
  activeProcedures: number;
  totalForms: number;
  formSubmissions: number;
  totalArticles: number;
  publishedArticles: number;
  articleViews: number;
  avgReadTime: number;
}

export interface KpiCard {
  id: string;
  label: string;
  value: number;
  previousValue?: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  format?: 'number' | 'percentage' | 'currency' | 'duration';
  icon?: string;
  color?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
  category?: string;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'radar';
  data: ChartDataPoint[];
  timeSeries?: TimeSeriesData[];
  labels?: string[];
  datasets?: {
    label: string;
    data: number[];
    color?: string;
    backgroundColor?: string;
  }[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  actionType: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'export' | 'submit';
  resourceType: 'event' | 'procedure' | 'form' | 'article' | 'user' | 'group' | 'report';
  resourceId?: string;
  resourceName?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  type: 'events' | 'procedures' | 'forms' | 'users' | 'knowledge' | 'custom';
  parameters?: ReportParameter[];
  columns?: ReportColumn[];
  filters?: ReportFilter[];
  schedule?: ReportSchedule;
  createdBy: string;
  createdByName?: string;
  isTemplate: boolean;
  isScheduled: boolean;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportParameter {
  key: string;
  label: string;
  type: 'date' | 'dateRange' | 'select' | 'multiSelect' | 'text' | 'number';
  options?: { value: string; label: string }[];
  defaultValue?: unknown;
  required?: boolean;
}

export interface ReportColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage';
  sortable?: boolean;
  width?: number;
}

export interface ReportFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'between';
  value: unknown;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  isActive: boolean;
}

export interface ReportResult {
  reportId: string;
  reportName: string;
  generatedAt: string;
  parameters: Record<string, unknown>;
  columns: ReportColumn[];
  data: Record<string, unknown>[];
  summary?: Record<string, number>;
  totalRows: number;
}

export interface TrendData {
  period: string;
  metrics: {
    name: string;
    value: number;
    previousValue?: number;
    change?: number;
  }[];
}

export interface ModuleStats {
  module: string;
  label: string;
  total: number;
  active: number;
  trend: number;
  chartData: TimeSeriesData[];
}

export interface UserEngagement {
  userId: string;
  userName: string;
  userAvatar?: string;
  loginCount: number;
  actionsCount: number;
  lastActiveAt: string;
  engagementScore: number;
}

export interface AnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  module?: string;
  groupBy?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts?: boolean;
  dateRange?: { start: string; end: string };
  sections?: string[];
}

// ===========================================
// API Response Types
// ===========================================

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ===========================================
// Dashboard Service
// ===========================================

export const dashboardService = {
  /**
   * Get main dashboard statistics
   */
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    const response = await api.get('/analytics/dashboard/stats');
    return {
      success: true,
      data: transformDashboardStats(response.data.data || response.data),
    };
  },

  /**
   * Get KPI cards for dashboard
   */
  async getKpiCards(): Promise<ApiResponse<KpiCard[]>> {
    const response = await api.get('/analytics/dashboard/kpis');
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformKpiCard),
    };
  },

  /**
   * Get overview metrics with date range
   */
  async getOverview(params: AnalyticsQueryParams = {}): Promise<ApiResponse<DashboardStats>> {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.period) queryParams.append('period', params.period);

    const response = await api.get(`/analytics/dashboard/overview?${queryParams.toString()}`);
    return {
      success: true,
      data: transformDashboardStats(response.data.data || response.data),
    };
  },

  /**
   * Get module-specific statistics
   */
  async getModuleStats(module?: string): Promise<ApiResponse<ModuleStats[]>> {
    const url = module
      ? `/analytics/dashboard/modules/${module}`
      : '/analytics/dashboard/modules';
    const response = await api.get(url);
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformModuleStats),
    };
  },

  /**
   * Get real-time stats (for live updates)
   */
  async getRealTimeStats(): Promise<ApiResponse<{ activeUsers: number; recentActions: number; pendingTasks: number }>> {
    const response = await api.get('/analytics/dashboard/realtime');
    return {
      success: true,
      data: response.data.data || response.data,
    };
  },
};

// ===========================================
// Charts Service
// ===========================================

export const chartsService = {
  /**
   * Get chart data by type
   */
  async getChartData(chartId: string, params: AnalyticsQueryParams = {}): Promise<ApiResponse<ChartData>> {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.period) queryParams.append('period', params.period);
    if (params.groupBy) queryParams.append('groupBy', params.groupBy);

    const response = await api.get(`/analytics/charts/${chartId}?${queryParams.toString()}`);
    return {
      success: true,
      data: transformChartData(response.data.data || response.data),
    };
  },

  /**
   * Get user activity chart
   */
  async getUserActivityChart(params: AnalyticsQueryParams = {}): Promise<ApiResponse<ChartData>> {
    return this.getChartData('user-activity', params);
  },

  /**
   * Get events timeline chart
   */
  async getEventsTimelineChart(params: AnalyticsQueryParams = {}): Promise<ApiResponse<ChartData>> {
    return this.getChartData('events-timeline', params);
  },

  /**
   * Get form submissions chart
   */
  async getFormSubmissionsChart(params: AnalyticsQueryParams = {}): Promise<ApiResponse<ChartData>> {
    return this.getChartData('form-submissions', params);
  },

  /**
   * Get knowledge base views chart
   */
  async getArticleViewsChart(params: AnalyticsQueryParams = {}): Promise<ApiResponse<ChartData>> {
    return this.getChartData('article-views', params);
  },

  /**
   * Get module distribution pie chart
   */
  async getModuleDistributionChart(): Promise<ApiResponse<ChartData>> {
    const response = await api.get('/analytics/charts/module-distribution');
    return {
      success: true,
      data: transformChartData(response.data.data || response.data),
    };
  },

  /**
   * Get trends comparison chart
   */
  async getTrendsChart(params: AnalyticsQueryParams = {}): Promise<ApiResponse<ChartData>> {
    return this.getChartData('trends', params);
  },

  /**
   * Get all available charts metadata
   */
  async getAvailableCharts(): Promise<ApiResponse<{ id: string; title: string; type: string; description: string }[]>> {
    const response = await api.get('/analytics/charts');
    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  },
};

// ===========================================
// Activity Service
// ===========================================

export const activityService = {
  /**
   * Get activity logs with pagination
   */
  async getLogs(params: {
    page?: number;
    pageSize?: number;
    userId?: string;
    actionType?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<PaginatedResponse<ActivityLog>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('limit', params.pageSize.toString());
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.actionType) queryParams.append('actionType', params.actionType);
    if (params.resourceType) queryParams.append('resourceType', params.resourceType);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const response = await api.get(`/analytics/activity?${queryParams.toString()}`);

    const logs = response.data.data?.logs || response.data.logs || [];
    const pagination = response.data.data?.pagination || response.data.pagination || {
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      total: logs.length,
      totalPages: 1,
    };

    return {
      success: true,
      data: logs.map(transformActivityLog),
      pagination: {
        page: pagination.page,
        pageSize: pagination.limit || pagination.pageSize,
        total: pagination.total,
        totalPages: pagination.totalPages,
      },
    };
  },

  /**
   * Get recent activity (limited)
   */
  async getRecentActivity(limit = 10): Promise<ApiResponse<ActivityLog[]>> {
    const response = await api.get(`/analytics/activity/recent?limit=${limit}`);
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformActivityLog),
    };
  },

  /**
   * Get user's activity
   */
  async getUserActivity(userId: string, params: { page?: number; pageSize?: number } = {}): Promise<PaginatedResponse<ActivityLog>> {
    return this.getLogs({ ...params, userId });
  },

  /**
   * Get activity summary by type
   */
  async getActivitySummary(params: AnalyticsQueryParams = {}): Promise<ApiResponse<{ actionType: string; count: number }[]>> {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const response = await api.get(`/analytics/activity/summary?${queryParams.toString()}`);
    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  },

  /**
   * Get user engagement metrics
   */
  async getUserEngagement(params: { limit?: number } = {}): Promise<ApiResponse<UserEngagement[]>> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get(`/analytics/activity/engagement?${queryParams.toString()}`);
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformUserEngagement),
    };
  },
};

// ===========================================
// Reports Service
// ===========================================

export const reportsService = {
  /**
   * Get all reports
   */
  async getAll(params: { type?: string; isTemplate?: boolean } = {}): Promise<ApiResponse<Report[]>> {
    const queryParams = new URLSearchParams();
    if (params.type) queryParams.append('type', params.type);
    if (params.isTemplate !== undefined) queryParams.append('isTemplate', params.isTemplate.toString());

    const response = await api.get(`/analytics/reports?${queryParams.toString()}`);
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformReport),
    };
  },

  /**
   * Get report by ID
   */
  async getById(id: string): Promise<ApiResponse<Report>> {
    const response = await api.get(`/analytics/reports/${id}`);
    return {
      success: true,
      data: transformReport(response.data.data || response.data),
    };
  },

  /**
   * Get report templates
   */
  async getTemplates(): Promise<ApiResponse<Report[]>> {
    return this.getAll({ isTemplate: true });
  },

  /**
   * Create a new report
   */
  async create(data: {
    name: string;
    description?: string;
    type: Report['type'];
    parameters?: ReportParameter[];
    columns?: ReportColumn[];
    filters?: ReportFilter[];
    isTemplate?: boolean;
  }): Promise<ApiResponse<Report>> {
    const response = await api.post('/analytics/reports', data);
    return {
      success: true,
      data: transformReport(response.data.data || response.data),
    };
  },

  /**
   * Update a report
   */
  async update(id: string, data: Partial<Report>): Promise<ApiResponse<Report>> {
    const response = await api.put(`/analytics/reports/${id}`, data);
    return {
      success: true,
      data: transformReport(response.data.data || response.data),
    };
  },

  /**
   * Delete a report
   */
  async delete(id: string): Promise<ApiResponse<{ id: string }>> {
    const response = await api.delete(`/analytics/reports/${id}`);
    return {
      success: true,
      data: response.data.data || { id },
    };
  },

  /**
   * Run/generate a report
   */
  async run(id: string, parameters: Record<string, unknown> = {}): Promise<ApiResponse<ReportResult>> {
    const response = await api.post(`/analytics/reports/${id}/run`, { parameters });
    return {
      success: true,
      data: transformReportResult(response.data.data || response.data),
    };
  },

  /**
   * Schedule a report
   */
  async schedule(id: string, schedule: ReportSchedule): Promise<ApiResponse<Report>> {
    const response = await api.post(`/analytics/reports/${id}/schedule`, schedule);
    return {
      success: true,
      data: transformReport(response.data.data || response.data),
    };
  },

  /**
   * Unschedule a report
   */
  async unschedule(id: string): Promise<ApiResponse<Report>> {
    const response = await api.delete(`/analytics/reports/${id}/schedule`);
    return {
      success: true,
      data: transformReport(response.data.data || response.data),
    };
  },

  /**
   * Get scheduled reports
   */
  async getScheduled(): Promise<ApiResponse<Report[]>> {
    const response = await api.get('/analytics/reports/scheduled');
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformReport),
    };
  },

  /**
   * Get report run history
   */
  async getRunHistory(reportId: string): Promise<ApiResponse<{ id: string; generatedAt: string; parameters: Record<string, unknown> }[]>> {
    const response = await api.get(`/analytics/reports/${reportId}/history`);
    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  },
};

// ===========================================
// Export Service
// ===========================================

export const exportService = {
  /**
   * Export dashboard data
   */
  async exportDashboard(options: ExportOptions): Promise<ApiResponse<{ downloadUrl: string }>> {
    const response = await api.post('/analytics/export/dashboard', options);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  },

  /**
   * Export report to file
   */
  async exportReport(reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<ApiResponse<{ downloadUrl: string }>> {
    const response = await api.post(`/analytics/export/report/${reportId}`, { format });
    return {
      success: true,
      data: response.data.data || response.data,
    };
  },

  /**
   * Export chart as image
   */
  async exportChart(chartId: string, format: 'png' | 'svg' = 'png'): Promise<ApiResponse<{ downloadUrl: string }>> {
    const response = await api.post(`/analytics/export/chart/${chartId}`, { format });
    return {
      success: true,
      data: response.data.data || response.data,
    };
  },

  /**
   * Export activity logs
   */
  async exportActivityLogs(params: { startDate?: string; endDate?: string; format: 'excel' | 'csv' }): Promise<ApiResponse<{ downloadUrl: string }>> {
    const response = await api.post('/analytics/export/activity', params);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  },
};

// ===========================================
// Trends Service
// ===========================================

export const trendsService = {
  /**
   * Get trends data
   */
  async getTrends(params: AnalyticsQueryParams = {}): Promise<ApiResponse<TrendData[]>> {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.period) queryParams.append('period', params.period);
    if (params.module) queryParams.append('module', params.module);

    const response = await api.get(`/analytics/trends?${queryParams.toString()}`);
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformTrendData),
    };
  },

  /**
   * Get growth metrics
   */
  async getGrowthMetrics(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<ApiResponse<{
    users: { current: number; previous: number; growth: number };
    events: { current: number; previous: number; growth: number };
    articles: { current: number; previous: number; growth: number };
    forms: { current: number; previous: number; growth: number };
  }>> {
    const response = await api.get(`/analytics/trends/growth?period=${period}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  },

  /**
   * Get forecast data
   */
  async getForecast(metric: string, periods = 6): Promise<ApiResponse<TimeSeriesData[]>> {
    const response = await api.get(`/analytics/trends/forecast?metric=${metric}&periods=${periods}`);
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformTimeSeries),
    };
  },
};

// ===========================================
// Transform Functions
// ===========================================

function transformDashboardStats(data: Record<string, unknown>): DashboardStats {
  return {
    totalUsers: data.total_users as number || data.totalUsers as number || 0,
    activeUsers: data.active_users as number || data.activeUsers as number || 0,
    newUsersThisMonth: data.new_users_this_month as number || data.newUsersThisMonth as number || 0,
    userGrowthRate: data.user_growth_rate as number || data.userGrowthRate as number || 0,
    totalEvents: data.total_events as number || data.totalEvents as number || 0,
    upcomingEvents: data.upcoming_events as number || data.upcomingEvents as number || 0,
    completedEvents: data.completed_events as number || data.completedEvents as number || 0,
    eventCompletionRate: data.event_completion_rate as number || data.eventCompletionRate as number || 0,
    totalProcedures: data.total_procedures as number || data.totalProcedures as number || 0,
    activeProcedures: data.active_procedures as number || data.activeProcedures as number || 0,
    totalForms: data.total_forms as number || data.totalForms as number || 0,
    formSubmissions: data.form_submissions as number || data.formSubmissions as number || 0,
    totalArticles: data.total_articles as number || data.totalArticles as number || 0,
    publishedArticles: data.published_articles as number || data.publishedArticles as number || 0,
    articleViews: data.article_views as number || data.articleViews as number || 0,
    avgReadTime: data.avg_read_time as number || data.avgReadTime as number || 0,
  };
}

function transformKpiCard(data: Record<string, unknown>): KpiCard {
  return {
    id: data.id as string,
    label: data.label as string || '',
    value: data.value as number || 0,
    previousValue: data.previous_value as number || data.previousValue as number,
    change: data.change as number,
    changeType: data.change_type as KpiCard['changeType'] || data.changeType as KpiCard['changeType'],
    format: data.format as KpiCard['format'],
    icon: data.icon as string,
    color: data.color as string,
  };
}

function transformChartData(data: Record<string, unknown>): ChartData {
  return {
    id: data.id as string,
    title: data.title as string || '',
    type: data.type as ChartData['type'] || 'line',
    data: ((data.data as Record<string, unknown>[]) || []).map(d => ({
      label: d.label as string || '',
      value: d.value as number || 0,
      date: d.date as string,
      category: d.category as string,
      color: d.color as string,
    })),
    timeSeries: ((data.time_series as Record<string, unknown>[]) || (data.timeSeries as Record<string, unknown>[]) || []).map(transformTimeSeries),
    labels: data.labels as string[],
    datasets: data.datasets as ChartData['datasets'],
  };
}

function transformTimeSeries(data: Record<string, unknown>): TimeSeriesData {
  return {
    date: data.date as string || '',
    value: data.value as number || 0,
    label: data.label as string,
  };
}

function transformActivityLog(data: Record<string, unknown>): ActivityLog {
  return {
    id: data.id as string,
    userId: data.user_id as string || data.userId as string || '',
    userName: data.user_name as string || data.userName as string || '',
    userAvatar: data.user_avatar as string || data.userAvatar as string,
    action: data.action as string || '',
    actionType: data.action_type as ActivityLog['actionType'] || data.actionType as ActivityLog['actionType'] || 'view',
    resourceType: data.resource_type as ActivityLog['resourceType'] || data.resourceType as ActivityLog['resourceType'] || 'event',
    resourceId: data.resource_id as string || data.resourceId as string,
    resourceName: data.resource_name as string || data.resourceName as string,
    metadata: data.metadata as Record<string, unknown>,
    ipAddress: data.ip_address as string || data.ipAddress as string,
    userAgent: data.user_agent as string || data.userAgent as string,
    createdAt: data.created_at as string || data.createdAt as string || '',
  };
}

function transformReport(data: Record<string, unknown>): Report {
  return {
    id: data.id as string,
    name: data.name as string || '',
    description: data.description as string,
    type: data.type as Report['type'] || 'custom',
    parameters: data.parameters as ReportParameter[],
    columns: data.columns as ReportColumn[],
    filters: data.filters as ReportFilter[],
    schedule: data.schedule as ReportSchedule,
    createdBy: data.created_by as string || data.createdBy as string || '',
    createdByName: data.created_by_name as string || data.createdByName as string,
    isTemplate: data.is_template as boolean ?? data.isTemplate as boolean ?? false,
    isScheduled: data.is_scheduled as boolean ?? data.isScheduled as boolean ?? false,
    lastRunAt: data.last_run_at as string || data.lastRunAt as string,
    createdAt: data.created_at as string || data.createdAt as string || '',
    updatedAt: data.updated_at as string || data.updatedAt as string || '',
  };
}

function transformReportResult(data: Record<string, unknown>): ReportResult {
  return {
    reportId: data.report_id as string || data.reportId as string || '',
    reportName: data.report_name as string || data.reportName as string || '',
    generatedAt: data.generated_at as string || data.generatedAt as string || '',
    parameters: data.parameters as Record<string, unknown> || {},
    columns: data.columns as ReportColumn[] || [],
    data: data.data as Record<string, unknown>[] || [],
    summary: data.summary as Record<string, number>,
    totalRows: data.total_rows as number || data.totalRows as number || 0,
  };
}

function transformTrendData(data: Record<string, unknown>): TrendData {
  return {
    period: data.period as string || '',
    metrics: ((data.metrics as Record<string, unknown>[]) || []).map(m => ({
      name: m.name as string || '',
      value: m.value as number || 0,
      previousValue: m.previous_value as number || m.previousValue as number,
      change: m.change as number,
    })),
  };
}

function transformModuleStats(data: Record<string, unknown>): ModuleStats {
  return {
    module: data.module as string || '',
    label: data.label as string || '',
    total: data.total as number || 0,
    active: data.active as number || 0,
    trend: data.trend as number || 0,
    chartData: ((data.chart_data as Record<string, unknown>[]) || (data.chartData as Record<string, unknown>[]) || []).map(transformTimeSeries),
  };
}

function transformUserEngagement(data: Record<string, unknown>): UserEngagement {
  return {
    userId: data.user_id as string || data.userId as string || '',
    userName: data.user_name as string || data.userName as string || '',
    userAvatar: data.user_avatar as string || data.userAvatar as string,
    loginCount: data.login_count as number || data.loginCount as number || 0,
    actionsCount: data.actions_count as number || data.actionsCount as number || 0,
    lastActiveAt: data.last_active_at as string || data.lastActiveAt as string || '',
    engagementScore: data.engagement_score as number || data.engagementScore as number || 0,
  };
}

export default {
  dashboard: dashboardService,
  charts: chartsService,
  activity: activityService,
  reports: reportsService,
  export: exportService,
  trends: trendsService,
};

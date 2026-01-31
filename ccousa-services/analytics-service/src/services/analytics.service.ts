import { query } from '../utils/database';
import { v4 as uuidv4 } from 'uuid';

export interface AnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  module?: string;
  groupBy?: string;
}

export interface ActivityLogParams {
  page?: number;
  pageSize?: number;
  userId?: string;
  actionType?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReportData {
  name: string;
  description?: string;
  type: 'events' | 'procedures' | 'forms' | 'users' | 'knowledge' | 'custom';
  parameters?: unknown[];
  columns?: unknown[];
  filters?: unknown[];
  isTemplate?: boolean;
}

export class AnalyticsService {
  // ===========================================
  // Dashboard Stats
  // ===========================================

  async getDashboardStats() {
    const [events, users, procedures, forms, articles] = await Promise.all([
      query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'reported') as reported,
        COUNT(*) FILTER (WHERE status = 'investigating') as investigating,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical,
        COUNT(*) FILTER (WHERE severity = 'high') as high,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as last_30_days
      FROM health_events`),
      query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month
      FROM users`),
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM procedures'),
      query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        (SELECT COUNT(*) FROM form_submissions WHERE created_at > NOW() - INTERVAL '30 days') as submissions_this_month
      FROM forms`),
      query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_published = true) as published,
        COALESCE(SUM(view_count), 0) as total_views
      FROM articles`),
    ]);

    const eventsData = events.rows[0] || {};
    const usersData = users.rows[0] || {};
    const proceduresData = procedures.rows[0] || {};
    const formsData = forms.rows[0] || {};
    const articlesData = articles.rows[0] || {};

    return {
      totalUsers: parseInt(usersData.total) || 0,
      activeUsers: parseInt(usersData.active) || 0,
      newUsersThisMonth: parseInt(usersData.new_this_month) || 0,
      userGrowthRate: 5.6, // Calculate from historical data
      totalEvents: parseInt(eventsData.total) || 0,
      upcomingEvents: parseInt(eventsData.reported) + parseInt(eventsData.investigating) || 0,
      completedEvents: parseInt(eventsData.resolved) || 0,
      eventCompletionRate: eventsData.total > 0 ? Math.round((eventsData.resolved / eventsData.total) * 100) : 0,
      totalProcedures: parseInt(proceduresData.total) || 0,
      activeProcedures: parseInt(proceduresData.active) || 0,
      totalForms: parseInt(formsData.total) || 0,
      formSubmissions: parseInt(formsData.submissions_this_month) || 0,
      totalArticles: parseInt(articlesData.total) || 0,
      publishedArticles: parseInt(articlesData.published) || 0,
      articleViews: parseInt(articlesData.total_views) || 0,
      avgReadTime: 4.5, // Calculate from actual data
    };
  }

  async getKpiCards() {
    const stats = await this.getDashboardStats();

    return [
      {
        id: '1',
        label: 'Utilisateurs actifs',
        value: stats.activeUsers,
        previousValue: Math.round(stats.activeUsers * 0.95),
        change: stats.userGrowthRate,
        changeType: 'increase',
        format: 'number',
        icon: 'users',
        color: 'purple',
      },
      {
        id: '2',
        label: 'Evenements ce mois',
        value: stats.upcomingEvents,
        previousValue: Math.round(stats.upcomingEvents * 1.1),
        change: -9.6,
        changeType: 'decrease',
        format: 'number',
        icon: 'calendar',
        color: 'amber',
      },
      {
        id: '3',
        label: 'Articles publies',
        value: stats.publishedArticles,
        previousValue: Math.round(stats.publishedArticles * 0.85),
        change: 18.2,
        changeType: 'increase',
        format: 'number',
        icon: 'book',
        color: 'emerald',
      },
      {
        id: '4',
        label: 'Soumissions formulaires',
        value: stats.formSubmissions,
        previousValue: Math.round(stats.formSubmissions * 0.88),
        change: 13.2,
        changeType: 'increase',
        format: 'number',
        icon: 'clipboard',
        color: 'blue',
      },
    ];
  }

  async getModuleStats(module?: string) {
    const modules = ['events', 'procedures', 'forms', 'knowledge'];

    if (module && modules.includes(module)) {
      return [await this.getSingleModuleStats(module)];
    }

    return Promise.all(modules.map(m => this.getSingleModuleStats(m)));
  }

  private async getSingleModuleStats(module: string) {
    let result;

    switch (module) {
      case 'events':
        result = await query(`SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status != 'resolved') as active
        FROM health_events`);
        break;
      case 'procedures':
        result = await query(`SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active
        FROM procedures`);
        break;
      case 'forms':
        result = await query(`SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active
        FROM forms`);
        break;
      case 'knowledge':
        result = await query(`SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_published = true) as active
        FROM articles`);
        break;
      default:
        return { module, label: module, total: 0, active: 0, trend: 0, chartData: [] };
    }

    const data = result.rows[0] || { total: 0, active: 0 };
    const labels: Record<string, string> = {
      events: 'Evenements',
      procedures: 'Procedures',
      forms: 'Formulaires',
      knowledge: 'Articles',
    };

    return {
      module,
      label: labels[module] || module,
      total: parseInt(data.total) || 0,
      active: parseInt(data.active) || 0,
      trend: Math.floor(Math.random() * 20) - 5, // Replace with actual trend calculation
      chartData: [],
    };
  }

  async getRealTimeStats() {
    const [activeUsers, recentActions, pendingTasks] = await Promise.all([
      query(`SELECT COUNT(DISTINCT user_id) as count
        FROM activity_logs
        WHERE created_at > NOW() - INTERVAL '15 minutes'`),
      query(`SELECT COUNT(*) as count
        FROM activity_logs
        WHERE created_at > NOW() - INTERVAL '1 hour'`),
      query(`SELECT COUNT(*) as count
        FROM health_events
        WHERE status IN ('reported', 'investigating')`),
    ]);

    return {
      activeUsers: parseInt(activeUsers.rows[0]?.count) || 0,
      recentActions: parseInt(recentActions.rows[0]?.count) || 0,
      pendingTasks: parseInt(pendingTasks.rows[0]?.count) || 0,
    };
  }

  // ===========================================
  // Charts
  // ===========================================

  async getChartData(chartId: string, params: AnalyticsQueryParams = {}) {
    switch (chartId) {
      case 'user-activity':
        return this.getUserActivityChart(params);
      case 'events-timeline':
        return this.getEventsTimelineChart(params);
      case 'form-submissions':
        return this.getFormSubmissionsChart(params);
      case 'article-views':
        return this.getArticleViewsChart(params);
      case 'module-distribution':
        return this.getModuleDistributionChart();
      case 'trends':
        return this.getTrendsChart(params);
      default:
        return { id: chartId, title: 'Unknown', type: 'line', data: [] };
    }
  }

  async getUserActivityChart(params: AnalyticsQueryParams = {}) {
    const days = params.period === 'week' ? 7 : params.period === 'month' ? 30 : 7;

    const result = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM activity_logs
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    return {
      id: 'user-activity',
      title: 'Activite des utilisateurs',
      type: 'bar',
      data: result.rows.map((row: { date: string; count: string }) => ({
        label: new Date(row.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
        value: parseInt(row.count),
        date: row.date,
      })),
    };
  }

  async getEventsTimelineChart(params: AnalyticsQueryParams = {}) {
    const startDate = params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = params.endDate || new Date().toISOString();

    const result = await query(
      `SELECT DATE(created_at) as date, COUNT(*) as count, severity
       FROM health_events
       WHERE created_at BETWEEN $1 AND $2
       GROUP BY DATE(created_at), severity
       ORDER BY date ASC`,
      [startDate, endDate]
    );

    return {
      id: 'events-timeline',
      title: 'Timeline des evenements',
      type: 'line',
      data: result.rows.map((row: { date: string; count: string; severity: string }) => ({
        label: new Date(row.date).toLocaleDateString('fr-FR'),
        value: parseInt(row.count),
        date: row.date,
        category: row.severity,
      })),
    };
  }

  async getFormSubmissionsChart(params: AnalyticsQueryParams = {}) {
    const days = params.period === 'week' ? 7 : params.period === 'month' ? 30 : 7;

    const result = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM form_submissions
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    return {
      id: 'form-submissions',
      title: 'Soumissions de formulaires',
      type: 'area',
      data: result.rows.map((row: { date: string; count: string }) => ({
        label: new Date(row.date).toLocaleDateString('fr-FR'),
        value: parseInt(row.count),
        date: row.date,
      })),
    };
  }

  async getArticleViewsChart(params: AnalyticsQueryParams = {}) {
    const result = await query(`
      SELECT a.title, a.view_count as views
      FROM articles a
      WHERE a.is_published = true
      ORDER BY a.view_count DESC
      LIMIT 10
    `);

    return {
      id: 'article-views',
      title: 'Articles les plus vus',
      type: 'bar',
      data: result.rows.map((row: { title: string; views: string }) => ({
        label: row.title.substring(0, 30) + (row.title.length > 30 ? '...' : ''),
        value: parseInt(row.views) || 0,
      })),
    };
  }

  async getModuleDistributionChart() {
    const [events, procedures, forms, articles] = await Promise.all([
      query('SELECT COUNT(*) as count FROM health_events'),
      query('SELECT COUNT(*) as count FROM procedures'),
      query('SELECT COUNT(*) as count FROM forms'),
      query('SELECT COUNT(*) as count FROM articles'),
    ]);

    const total =
      parseInt(events.rows[0]?.count || 0) +
      parseInt(procedures.rows[0]?.count || 0) +
      parseInt(forms.rows[0]?.count || 0) +
      parseInt(articles.rows[0]?.count || 0);

    const calcPercent = (count: number) => total > 0 ? Math.round((count / total) * 100) : 0;

    return {
      id: 'module-distribution',
      title: 'Repartition par module',
      type: 'pie',
      data: [
        { label: 'Evenements', value: calcPercent(parseInt(events.rows[0]?.count || 0)), color: '#f59e0b' },
        { label: 'Procedures', value: calcPercent(parseInt(procedures.rows[0]?.count || 0)), color: '#10b981' },
        { label: 'Formulaires', value: calcPercent(parseInt(forms.rows[0]?.count || 0)), color: '#3b82f6' },
        { label: 'Articles', value: calcPercent(parseInt(articles.rows[0]?.count || 0)), color: '#8b5cf6' },
      ],
    };
  }

  async getTrendsChart(params: AnalyticsQueryParams = {}) {
    // Return trend data for multiple metrics
    return {
      id: 'trends',
      title: 'Tendances',
      type: 'line',
      data: [],
      datasets: [
        { label: 'Utilisateurs', data: [100, 120, 130, 125, 140, 150, 155], color: '#8b5cf6' },
        { label: 'Evenements', data: [50, 55, 48, 60, 52, 58, 65], color: '#f59e0b' },
        { label: 'Articles', data: [20, 25, 30, 35, 40, 45, 50], color: '#10b981' },
      ],
    };
  }

  async getAvailableCharts() {
    return [
      { id: 'user-activity', title: 'Activite des utilisateurs', type: 'bar', description: 'Connexions et actions par jour' },
      { id: 'events-timeline', title: 'Timeline des evenements', type: 'line', description: 'Evolution des evenements' },
      { id: 'form-submissions', title: 'Soumissions de formulaires', type: 'area', description: 'Formulaires soumis par jour' },
      { id: 'article-views', title: 'Vues des articles', type: 'bar', description: 'Articles les plus consultes' },
      { id: 'module-distribution', title: 'Repartition par module', type: 'pie', description: 'Distribution des donnees' },
      { id: 'trends', title: 'Tendances', type: 'line', description: 'Evolution des metriques' },
    ];
  }

  // ===========================================
  // Activity Logs
  // ===========================================

  async getActivityLogs(params: ActivityLogParams = {}) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (params.userId) {
      whereClause += ` AND al.user_id = $${paramIndex++}`;
      queryParams.push(params.userId);
    }
    if (params.actionType) {
      whereClause += ` AND al.action_type = $${paramIndex++}`;
      queryParams.push(params.actionType);
    }
    if (params.resourceType) {
      whereClause += ` AND al.resource_type = $${paramIndex++}`;
      queryParams.push(params.resourceType);
    }
    if (params.startDate) {
      whereClause += ` AND al.created_at >= $${paramIndex++}`;
      queryParams.push(params.startDate);
    }
    if (params.endDate) {
      whereClause += ` AND al.created_at <= $${paramIndex++}`;
      queryParams.push(params.endDate);
    }

    const [logsResult, countResult] = await Promise.all([
      query(
        `SELECT al.*, u.first_name, u.last_name, u.avatar_url
         FROM activity_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ${whereClause}
         ORDER BY al.created_at DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        [...queryParams, pageSize, offset]
      ),
      query(
        `SELECT COUNT(*) as total FROM activity_logs al ${whereClause}`,
        queryParams
      ),
    ]);

    const total = parseInt(countResult.rows[0]?.total) || 0;

    return {
      logs: logsResult.rows.map((row: Record<string, unknown>) => ({
        id: row.id,
        userId: row.user_id,
        userName: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Utilisateur',
        userAvatar: row.avatar_url,
        action: row.action,
        actionType: row.action_type,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        resourceName: row.resource_name,
        metadata: row.metadata,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: row.created_at,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getRecentActivity(limit = 10) {
    const result = await query(
      `SELECT al.*, u.first_name, u.last_name, u.avatar_url
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      userId: row.user_id,
      userName: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Utilisateur',
      userAvatar: row.avatar_url,
      action: row.action,
      actionType: row.action_type,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      resourceName: row.resource_name,
      createdAt: row.created_at,
    }));
  }

  async getActivitySummary(params: AnalyticsQueryParams = {}) {
    let whereClause = '';
    const queryParams: unknown[] = [];

    if (params.startDate && params.endDate) {
      whereClause = 'WHERE created_at BETWEEN $1 AND $2';
      queryParams.push(params.startDate, params.endDate);
    }

    const result = await query(
      `SELECT action_type, COUNT(*) as count
       FROM activity_logs
       ${whereClause}
       GROUP BY action_type
       ORDER BY count DESC`,
      queryParams
    );

    return result.rows;
  }

  async getUserEngagement(limit = 10) {
    const result = await query(
      `SELECT
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.avatar_url,
        COUNT(al.id) FILTER (WHERE al.action_type = 'login') as login_count,
        COUNT(al.id) as actions_count,
        MAX(al.created_at) as last_active_at,
        (COUNT(al.id) * 10 + COUNT(al.id) FILTER (WHERE al.action_type = 'login') * 5) as engagement_score
       FROM users u
       LEFT JOIN activity_logs al ON u.id = al.user_id AND al.created_at > NOW() - INTERVAL '30 days'
       GROUP BY u.id
       ORDER BY engagement_score DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row: Record<string, unknown>) => ({
      userId: row.user_id,
      userName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      userAvatar: row.avatar_url,
      loginCount: parseInt(row.login_count as string) || 0,
      actionsCount: parseInt(row.actions_count as string) || 0,
      lastActiveAt: row.last_active_at,
      engagementScore: parseInt(row.engagement_score as string) || 0,
    }));
  }

  async logActivity(data: {
    userId: string;
    action: string;
    actionType: string;
    resourceType: string;
    resourceId?: string;
    resourceName?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const result = await query(
      `INSERT INTO activity_logs (id, user_id, action, action_type, resource_type, resource_id, resource_name, metadata, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING *`,
      [
        uuidv4(),
        data.userId,
        data.action,
        data.actionType,
        data.resourceType,
        data.resourceId,
        data.resourceName,
        JSON.stringify(data.metadata || {}),
        data.ipAddress,
        data.userAgent,
      ]
    );

    return result.rows[0];
  }

  // ===========================================
  // Reports
  // ===========================================

  async getReports(params: { type?: string; isTemplate?: boolean } = {}) {
    let whereClause = 'WHERE 1=1';
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (params.type) {
      whereClause += ` AND r.type = $${paramIndex++}`;
      queryParams.push(params.type);
    }
    if (params.isTemplate !== undefined) {
      whereClause += ` AND r.is_template = $${paramIndex++}`;
      queryParams.push(params.isTemplate);
    }

    const result = await query(
      `SELECT r.*, u.first_name, u.last_name
       FROM reports r
       LEFT JOIN users u ON r.created_by = u.id
       ${whereClause}
       ORDER BY r.created_at DESC`,
      queryParams
    );

    return result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      parameters: row.parameters,
      columns: row.columns,
      filters: row.filters,
      schedule: row.schedule,
      createdBy: row.created_by,
      createdByName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      isTemplate: row.is_template,
      isScheduled: row.is_scheduled,
      lastRunAt: row.last_run_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getReportById(id: string) {
    const result = await query(
      `SELECT r.*, u.first_name, u.last_name
       FROM reports r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      parameters: row.parameters,
      columns: row.columns,
      filters: row.filters,
      schedule: row.schedule,
      createdBy: row.created_by,
      createdByName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      isTemplate: row.is_template,
      isScheduled: row.is_scheduled,
      lastRunAt: row.last_run_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async createReport(data: ReportData, userId: string) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO reports (id, name, description, type, parameters, columns, filters, is_template, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        id,
        data.name,
        data.description,
        data.type,
        JSON.stringify(data.parameters || []),
        JSON.stringify(data.columns || []),
        JSON.stringify(data.filters || []),
        data.isTemplate || false,
        userId,
      ]
    );

    return result.rows[0];
  }

  async updateReport(id: string, data: Partial<ReportData>) {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.type !== undefined) {
      updates.push(`type = $${paramIndex++}`);
      values.push(data.type);
    }
    if (data.parameters !== undefined) {
      updates.push(`parameters = $${paramIndex++}`);
      values.push(JSON.stringify(data.parameters));
    }
    if (data.columns !== undefined) {
      updates.push(`columns = $${paramIndex++}`);
      values.push(JSON.stringify(data.columns));
    }
    if (data.filters !== undefined) {
      updates.push(`filters = $${paramIndex++}`);
      values.push(JSON.stringify(data.filters));
    }

    if (updates.length === 0) return this.getReportById(id);

    updates.push('updated_at = NOW()');
    values.push(id);

    const result = await query(
      `UPDATE reports SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async deleteReport(id: string) {
    await query('DELETE FROM reports WHERE id = $1', [id]);
    return { id };
  }

  async runReport(id: string, parameters: Record<string, unknown> = {}) {
    const report = await this.getReportById(id);
    if (!report) throw new Error('Report not found');

    // Update last_run_at
    await query('UPDATE reports SET last_run_at = NOW() WHERE id = $1', [id]);

    // Generate report data based on type
    const stats = await this.getDashboardStats();
    const now = new Date().toISOString();

    return {
      reportId: id,
      reportName: report.name,
      generatedAt: now,
      parameters,
      columns: report.columns || [],
      data: [], // Would contain actual report data based on type
      summary: {
        totalUsers: stats.totalUsers,
        totalEvents: stats.totalEvents,
        totalArticles: stats.totalArticles,
      },
      totalRows: 0,
    };
  }

  async scheduleReport(id: string, schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    recipients: string[];
    format: 'pdf' | 'excel' | 'csv';
    isActive: boolean;
  }) {
    const result = await query(
      `UPDATE reports SET schedule = $1, is_scheduled = true, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [JSON.stringify(schedule), id]
    );

    return result.rows[0];
  }

  async unscheduleReport(id: string) {
    const result = await query(
      `UPDATE reports SET schedule = NULL, is_scheduled = false, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    return result.rows[0];
  }

  async getScheduledReports() {
    return this.getReports({ isTemplate: false });
  }

  // ===========================================
  // Trends
  // ===========================================

  async getTrends(params: AnalyticsQueryParams = {}) {
    const period = params.period || 'month';
    const intervals: Record<string, string> = {
      day: '1 day',
      week: '7 days',
      month: '30 days',
      quarter: '90 days',
      year: '365 days',
    };

    const interval = intervals[period] || '30 days';

    // Get trends for multiple metrics
    const [users, events, articles] = await Promise.all([
      query(`
        SELECT DATE(created_at) as period, COUNT(*) as value
        FROM users
        WHERE created_at > NOW() - INTERVAL '${interval}'
        GROUP BY DATE(created_at)
        ORDER BY period ASC
      `),
      query(`
        SELECT DATE(created_at) as period, COUNT(*) as value
        FROM health_events
        WHERE created_at > NOW() - INTERVAL '${interval}'
        GROUP BY DATE(created_at)
        ORDER BY period ASC
      `),
      query(`
        SELECT DATE(created_at) as period, COUNT(*) as value
        FROM articles
        WHERE created_at > NOW() - INTERVAL '${interval}'
        GROUP BY DATE(created_at)
        ORDER BY period ASC
      `),
    ]);

    return [
      { period, metrics: [{ name: 'users', value: users.rows.length, previousValue: 0, change: 0 }] },
      { period, metrics: [{ name: 'events', value: events.rows.length, previousValue: 0, change: 0 }] },
      { period, metrics: [{ name: 'articles', value: articles.rows.length, previousValue: 0, change: 0 }] },
    ];
  }

  async getGrowthMetrics(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
    const intervals: Record<string, { current: string; previous: string }> = {
      week: { current: '7 days', previous: '14 days' },
      month: { current: '30 days', previous: '60 days' },
      quarter: { current: '90 days', previous: '180 days' },
      year: { current: '365 days', previous: '730 days' },
    };

    const { current, previous } = intervals[period];

    const [usersCurrent, usersPrevious, eventsCurrent, eventsPrevious, articlesCurrent, articlesPrevious] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL '${current}'`),
      query(`SELECT COUNT(*) as count FROM users WHERE created_at BETWEEN NOW() - INTERVAL '${previous}' AND NOW() - INTERVAL '${current}'`),
      query(`SELECT COUNT(*) as count FROM health_events WHERE created_at > NOW() - INTERVAL '${current}'`),
      query(`SELECT COUNT(*) as count FROM health_events WHERE created_at BETWEEN NOW() - INTERVAL '${previous}' AND NOW() - INTERVAL '${current}'`),
      query(`SELECT COUNT(*) as count FROM articles WHERE created_at > NOW() - INTERVAL '${current}'`),
      query(`SELECT COUNT(*) as count FROM articles WHERE created_at BETWEEN NOW() - INTERVAL '${previous}' AND NOW() - INTERVAL '${current}'`),
    ]);

    const calcGrowth = (current: number, previous: number) =>
      previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;

    return {
      users: {
        current: parseInt(usersCurrent.rows[0]?.count) || 0,
        previous: parseInt(usersPrevious.rows[0]?.count) || 0,
        growth: calcGrowth(parseInt(usersCurrent.rows[0]?.count) || 0, parseInt(usersPrevious.rows[0]?.count) || 0),
      },
      events: {
        current: parseInt(eventsCurrent.rows[0]?.count) || 0,
        previous: parseInt(eventsPrevious.rows[0]?.count) || 0,
        growth: calcGrowth(parseInt(eventsCurrent.rows[0]?.count) || 0, parseInt(eventsPrevious.rows[0]?.count) || 0),
      },
      articles: {
        current: parseInt(articlesCurrent.rows[0]?.count) || 0,
        previous: parseInt(articlesPrevious.rows[0]?.count) || 0,
        growth: calcGrowth(parseInt(articlesCurrent.rows[0]?.count) || 0, parseInt(articlesPrevious.rows[0]?.count) || 0),
      },
      forms: {
        current: 0,
        previous: 0,
        growth: 0,
      },
    };
  }

  // Legacy methods for backwards compatibility
  async getEventsTimeline(startDate: string, endDate: string) {
    const result = await query(
      `SELECT DATE(created_at) as date, COUNT(*) as count, severity
       FROM health_events
       WHERE created_at BETWEEN $1 AND $2
       GROUP BY DATE(created_at), severity
       ORDER BY date ASC`,
      [startDate, endDate]
    );
    return result.rows;
  }

  async getEventsByCategory() {
    const result = await query(
      `SELECT ec.name as category, COUNT(he.id) as count
       FROM event_categories ec
       LEFT JOIN health_events he ON ec.id = he.event_category_id
       GROUP BY ec.id, ec.name
       ORDER BY count DESC`
    );
    return result.rows;
  }

  async getEventsByRegion() {
    const result = await query(
      `SELECT ou.name as region, COUNT(he.id) as count
       FROM organizational_units ou
       LEFT JOIN health_events he ON ou.id = he.organizational_unit_id
       WHERE ou.type = 'region'
       GROUP BY ou.id, ou.name
       ORDER BY count DESC`
    );
    return result.rows;
  }

  async getEventsBySeverity() {
    const result = await query(
      `SELECT severity, COUNT(*) as count
       FROM health_events
       GROUP BY severity
       ORDER BY CASE severity
         WHEN 'critical' THEN 1
         WHEN 'high' THEN 2
         WHEN 'medium' THEN 3
         WHEN 'low' THEN 4
       END`
    );
    return result.rows;
  }

  async getUserActivity(userId: string, days = 30) {
    const result = await query(
      `SELECT DATE(created_at) as date, action, COUNT(*) as count
       FROM activity_logs
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '${days} days'
       GROUP BY DATE(created_at), action
       ORDER BY date DESC`,
      [userId]
    );
    return result.rows;
  }

  async getTopUsers(limit = 10) {
    const result = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email, COUNT(al.id) as activity_count
       FROM users u
       LEFT JOIN activity_logs al ON u.id = al.user_id AND al.created_at > NOW() - INTERVAL '30 days'
       GROUP BY u.id
       ORDER BY activity_count DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getResponseTimeStats() {
    const result = await query(
      `SELECT
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)::numeric(10,2) as avg_hours,
        MIN(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)::numeric(10,2) as min_hours,
        MAX(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)::numeric(10,2) as max_hours
       FROM health_events
       WHERE resolved_at IS NOT NULL`
    );
    return result.rows[0];
  }

  async generateReport(type: string, startDate: string, endDate: string) {
    const stats = await this.getDashboardStats();
    const timeline = await this.getEventsTimeline(startDate, endDate);
    const byCategory = await this.getEventsByCategory();
    const bySeverity = await this.getEventsBySeverity();
    const byRegion = await this.getEventsByRegion();
    const responseTime = await this.getResponseTimeStats();

    return {
      type,
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      summary: stats,
      timeline,
      byCategory,
      bySeverity,
      byRegion,
      responseTime,
    };
  }
}

export default new AnalyticsService();

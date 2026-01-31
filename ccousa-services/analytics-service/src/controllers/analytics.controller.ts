import { Request, Response } from 'express';
import Joi from 'joi';
import analyticsService from '../services/analytics.service';
import logger from '../utils/logger';

// Validation schemas
const analyticsQuerySchema = Joi.object({
  startDate: Joi.string().isoDate(),
  endDate: Joi.string().isoDate(),
  period: Joi.string().valid('day', 'week', 'month', 'quarter', 'year'),
  module: Joi.string(),
  groupBy: Joi.string(),
});

const activityLogQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  userId: Joi.string().uuid(),
  actionType: Joi.string(),
  resourceType: Joi.string(),
  startDate: Joi.string().isoDate(),
  endDate: Joi.string().isoDate(),
});

const reportSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().max(1000),
  type: Joi.string().required().valid('events', 'procedures', 'forms', 'users', 'knowledge', 'custom'),
  parameters: Joi.array(),
  columns: Joi.array(),
  filters: Joi.array(),
  isTemplate: Joi.boolean(),
});

const scheduleSchema = Joi.object({
  frequency: Joi.string().required().valid('daily', 'weekly', 'monthly', 'quarterly'),
  dayOfWeek: Joi.number().integer().min(0).max(6),
  dayOfMonth: Joi.number().integer().min(1).max(31),
  time: Joi.string().required().pattern(/^\d{2}:\d{2}$/),
  recipients: Joi.array().items(Joi.string().email()).required(),
  format: Joi.string().required().valid('pdf', 'excel', 'csv'),
  isActive: Joi.boolean().default(true),
});

export class AnalyticsController {
  // ===========================================
  // Dashboard Endpoints
  // ===========================================

  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await analyticsService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getKpiCards(req: Request, res: Response): Promise<void> {
    try {
      const kpis = await analyticsService.getKpiCards();
      res.json({ success: true, data: kpis });
    } catch (error) {
      logger.error('Error getting KPI cards:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getDashboardOverview(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = analyticsQuerySchema.validate(req.query);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message });
        return;
      }

      const stats = await analyticsService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('Error getting dashboard overview:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getModuleStats(req: Request, res: Response): Promise<void> {
    try {
      const module = req.params.module;
      const stats = await analyticsService.getModuleStats(module);
      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('Error getting module stats:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getRealTimeStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await analyticsService.getRealTimeStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('Error getting realtime stats:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  // ===========================================
  // Charts Endpoints
  // ===========================================

  async getAvailableCharts(req: Request, res: Response): Promise<void> {
    try {
      const charts = await analyticsService.getAvailableCharts();
      res.json({ success: true, data: charts });
    } catch (error) {
      logger.error('Error getting available charts:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getChartData(req: Request, res: Response): Promise<void> {
    try {
      const chartId = req.params.chartId;
      const { error, value } = analyticsQuerySchema.validate(req.query);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message });
        return;
      }

      const data = await analyticsService.getChartData(chartId, value);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error getting chart data:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getModuleDistributionChart(req: Request, res: Response): Promise<void> {
    try {
      const data = await analyticsService.getModuleDistributionChart();
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error getting module distribution:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  // ===========================================
  // Activity Endpoints
  // ===========================================

  async getActivityLogs(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = activityLogQuerySchema.validate(req.query);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message });
        return;
      }

      const result = await analyticsService.getActivityLogs({
        page: value.page,
        pageSize: value.limit,
        userId: value.userId,
        actionType: value.actionType,
        resourceType: value.resourceType,
        startDate: value.startDate,
        endDate: value.endDate,
      });

      res.json({ success: true, ...result });
    } catch (error) {
      logger.error('Error getting activity logs:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getRecentActivity(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await analyticsService.getRecentActivity(limit);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error getting recent activity:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getActivitySummary(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = analyticsQuerySchema.validate(req.query);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message });
        return;
      }

      const data = await analyticsService.getActivitySummary(value);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error getting activity summary:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getUserEngagement(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await analyticsService.getUserEngagement(limit);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error getting user engagement:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async logActivity(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const data = await analyticsService.logActivity({
        userId: user.userId,
        action: req.body.action,
        actionType: req.body.actionType,
        resourceType: req.body.resourceType,
        resourceId: req.body.resourceId,
        resourceName: req.body.resourceName,
        metadata: req.body.metadata,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({ success: true, data });
    } catch (error) {
      logger.error('Error logging activity:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  // ===========================================
  // Reports Endpoints
  // ===========================================

  async getReports(req: Request, res: Response): Promise<void> {
    try {
      const type = req.query.type as string;
      const isTemplate = req.query.isTemplate === 'true' ? true : req.query.isTemplate === 'false' ? false : undefined;

      const data = await analyticsService.getReports({ type, isTemplate });
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error getting reports:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getReportById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const data = await analyticsService.getReportById(id);

      if (!data) {
        res.status(404).json({ success: false, message: 'Rapport non trouve' });
        return;
      }

      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error getting report:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getReportTemplates(req: Request, res: Response): Promise<void> {
    try {
      const data = await analyticsService.getReports({ isTemplate: true });
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error getting report templates:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getScheduledReports(req: Request, res: Response): Promise<void> {
    try {
      const data = await analyticsService.getScheduledReports();
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error getting scheduled reports:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async createReport(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = reportSchema.validate(req.body);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message });
        return;
      }

      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : { userId: 'system' };

      const data = await analyticsService.createReport(value, user.userId);
      res.status(201).json({ success: true, data });
    } catch (error) {
      logger.error('Error creating report:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async updateReport(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const { error, value } = reportSchema.validate(req.body, { presence: 'optional' });
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message });
        return;
      }

      const data = await analyticsService.updateReport(id, value);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error updating report:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async deleteReport(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      await analyticsService.deleteReport(id);
      res.json({ success: true, data: { id } });
    } catch (error) {
      logger.error('Error deleting report:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async runReport(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const parameters = req.body.parameters || {};

      const data = await analyticsService.runReport(id, parameters);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error running report:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async scheduleReport(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const { error, value } = scheduleSchema.validate(req.body);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message });
        return;
      }

      const data = await analyticsService.scheduleReport(id, value);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error scheduling report:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async unscheduleReport(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const data = await analyticsService.unscheduleReport(id);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error unscheduling report:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  // ===========================================
  // Export Endpoints
  // ===========================================

  async exportDashboard(req: Request, res: Response): Promise<void> {
    try {
      // In a real implementation, this would generate the export file
      const format = req.body.format || 'pdf';
      res.json({
        success: true,
        data: {
          downloadUrl: `/api/analytics/exports/dashboard-${Date.now()}.${format}`,
        },
      });
    } catch (error) {
      logger.error('Error exporting dashboard:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async exportReport(req: Request, res: Response): Promise<void> {
    try {
      const reportId = req.params.reportId;
      const format = req.body.format || 'pdf';
      res.json({
        success: true,
        data: {
          downloadUrl: `/api/analytics/exports/report-${reportId}-${Date.now()}.${format}`,
        },
      });
    } catch (error) {
      logger.error('Error exporting report:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async exportChart(req: Request, res: Response): Promise<void> {
    try {
      const chartId = req.params.chartId;
      const format = req.body.format || 'png';
      res.json({
        success: true,
        data: {
          downloadUrl: `/api/analytics/exports/chart-${chartId}-${Date.now()}.${format}`,
        },
      });
    } catch (error) {
      logger.error('Error exporting chart:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async exportActivityLogs(req: Request, res: Response): Promise<void> {
    try {
      const format = req.body.format || 'csv';
      res.json({
        success: true,
        data: {
          downloadUrl: `/api/analytics/exports/activity-${Date.now()}.${format}`,
        },
      });
    } catch (error) {
      logger.error('Error exporting activity logs:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  // ===========================================
  // Trends Endpoints
  // ===========================================

  async getTrends(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = analyticsQuerySchema.validate(req.query);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message });
        return;
      }

      const data = await analyticsService.getTrends(value);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error getting trends:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getGrowthMetrics(req: Request, res: Response): Promise<void> {
    try {
      const period = req.query.period as 'week' | 'month' | 'quarter' | 'year' || 'month';
      const data = await analyticsService.getGrowthMetrics(period);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error getting growth metrics:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getForecast(req: Request, res: Response): Promise<void> {
    try {
      const metric = req.query.metric as string;
      const periods = parseInt(req.query.periods as string) || 6;

      // Return mock forecast data
      const forecastData = Array.from({ length: periods }, (_, i) => ({
        date: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString(),
        value: Math.round(100 + Math.random() * 50),
        label: `Periode ${i + 1}`,
      }));

      res.json({ success: true, data: forecastData });
    } catch (error) {
      logger.error('Error getting forecast:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  // ===========================================
  // Legacy Endpoints (for backwards compatibility)
  // ===========================================

  async getDashboard(req: Request, res: Response): Promise<void> {
    return this.getDashboardStats(req, res);
  }

  async getEventsTimeline(req: Request, res: Response): Promise<void> {
    try {
      const startDate = req.query.startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = req.query.endDate as string || new Date().toISOString();

      const data = await analyticsService.getEventsTimeline(startDate, endDate);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getEventsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const data = await analyticsService.getEventsByCategory();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getEventsByRegion(req: Request, res: Response): Promise<void> {
    try {
      const data = await analyticsService.getEventsByRegion();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getEventsBySeverity(req: Request, res: Response): Promise<void> {
    try {
      const data = await analyticsService.getEventsBySeverity();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getUserActivity(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) { res.status(401).json({ success: false, message: 'Non authentifie' }); return; }

      const days = parseInt(req.query.days as string) || 30;
      const data = await analyticsService.getUserActivity(user.userId, days);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getTopUsers(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await analyticsService.getTopUsers(limit);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getResponseTimeStats(req: Request, res: Response): Promise<void> {
    try {
      const data = await analyticsService.getResponseTimeStats();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const type = req.query.type as string || 'monthly';
      const startDate = req.query.startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = req.query.endDate as string || new Date().toISOString();

      const report = await analyticsService.generateReport(type, startDate, endDate);
      res.json({ success: true, data: report });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }
}

export default new AnalyticsController();

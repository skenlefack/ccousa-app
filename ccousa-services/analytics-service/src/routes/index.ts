import { Router, Request, Response } from 'express';
import analyticsController from '../controllers/analytics.controller';
import { checkConnection } from '../utils/database';

const router = Router();

// Health check
router.get('/health', async (req: Request, res: Response) => {
  const db = await checkConnection();
  res.json({
    success: true,
    service: 'analytics-service',
    status: 'healthy',
    checks: { database: db ? 'connected' : 'disconnected' },
  });
});

// ===========================================
// Dashboard Routes
// ===========================================
router.get('/dashboard/stats', (req, res) => analyticsController.getDashboardStats(req, res));
router.get('/dashboard/kpis', (req, res) => analyticsController.getKpiCards(req, res));
router.get('/dashboard/overview', (req, res) => analyticsController.getDashboardOverview(req, res));
router.get('/dashboard/modules', (req, res) => analyticsController.getModuleStats(req, res));
router.get('/dashboard/modules/:module', (req, res) => analyticsController.getModuleStats(req, res));
router.get('/dashboard/realtime', (req, res) => analyticsController.getRealTimeStats(req, res));

// ===========================================
// Charts Routes
// ===========================================
router.get('/charts', (req, res) => analyticsController.getAvailableCharts(req, res));
router.get('/charts/module-distribution', (req, res) => analyticsController.getModuleDistributionChart(req, res));
router.get('/charts/:chartId', (req, res) => analyticsController.getChartData(req, res));

// ===========================================
// Activity Routes
// ===========================================
router.get('/activity', (req, res) => analyticsController.getActivityLogs(req, res));
router.get('/activity/recent', (req, res) => analyticsController.getRecentActivity(req, res));
router.get('/activity/summary', (req, res) => analyticsController.getActivitySummary(req, res));
router.get('/activity/engagement', (req, res) => analyticsController.getUserEngagement(req, res));
router.post('/activity', (req, res) => analyticsController.logActivity(req, res));

// ===========================================
// Reports Routes
// ===========================================
router.get('/reports', (req, res) => analyticsController.getReports(req, res));
router.get('/reports/templates', (req, res) => analyticsController.getReportTemplates(req, res));
router.get('/reports/scheduled', (req, res) => analyticsController.getScheduledReports(req, res));
router.post('/reports', (req, res) => analyticsController.createReport(req, res));
router.get('/reports/:id', (req, res) => analyticsController.getReportById(req, res));
router.put('/reports/:id', (req, res) => analyticsController.updateReport(req, res));
router.delete('/reports/:id', (req, res) => analyticsController.deleteReport(req, res));
router.post('/reports/:id/run', (req, res) => analyticsController.runReport(req, res));
router.post('/reports/:id/schedule', (req, res) => analyticsController.scheduleReport(req, res));
router.delete('/reports/:id/schedule', (req, res) => analyticsController.unscheduleReport(req, res));

// ===========================================
// Export Routes
// ===========================================
router.post('/export/dashboard', (req, res) => analyticsController.exportDashboard(req, res));
router.post('/export/report/:reportId', (req, res) => analyticsController.exportReport(req, res));
router.post('/export/chart/:chartId', (req, res) => analyticsController.exportChart(req, res));
router.post('/export/activity', (req, res) => analyticsController.exportActivityLogs(req, res));

// ===========================================
// Trends Routes
// ===========================================
router.get('/trends', (req, res) => analyticsController.getTrends(req, res));
router.get('/trends/growth', (req, res) => analyticsController.getGrowthMetrics(req, res));
router.get('/trends/forecast', (req, res) => analyticsController.getForecast(req, res));

// ===========================================
// Legacy Routes (for backwards compatibility)
// ===========================================
router.get('/dashboard', (req, res) => analyticsController.getDashboard(req, res));
router.get('/events/timeline', (req, res) => analyticsController.getEventsTimeline(req, res));
router.get('/events/by-category', (req, res) => analyticsController.getEventsByCategory(req, res));
router.get('/events/by-region', (req, res) => analyticsController.getEventsByRegion(req, res));
router.get('/events/by-severity', (req, res) => analyticsController.getEventsBySeverity(req, res));
router.get('/users/activity', (req, res) => analyticsController.getUserActivity(req, res));
router.get('/users/top', (req, res) => analyticsController.getTopUsers(req, res));
router.get('/response-time', (req, res) => analyticsController.getResponseTimeStats(req, res));
router.get('/report', (req, res) => analyticsController.generateReport(req, res));

export default router;

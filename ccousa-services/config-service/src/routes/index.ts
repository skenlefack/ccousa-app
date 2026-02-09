import { Router, Request, Response } from 'express';
import configController from '../controllers/config.controller';
import { checkConnection } from '../utils/database';

const router = Router();

// Health check
router.get('/health', async (req: Request, res: Response) => {
  const db = await checkConnection();
  res.json({
    success: true,
    service: 'config-service',
    status: 'healthy',
    checks: { database: db ? 'connected' : 'disconnected' }
  });
});

// ===========================================
// System Settings
// ===========================================
router.get('/settings', (req, res) => configController.getSystemSettings(req, res));
router.get('/settings/:key', (req, res) => configController.getSettingByKey(req, res));
router.put('/settings/:key', (req, res) => configController.updateSetting(req, res));
router.put('/settings/bulk', (req, res) => configController.bulkUpdateSettings(req, res));

// ===========================================
// Event Categories
// ===========================================
router.get('/event-categories', (req, res) => configController.getEventCategories(req, res));
router.get('/event-categories/:id', (req, res) => configController.getEventCategoryById(req, res));
router.post('/event-categories', (req, res) => configController.createEventCategory(req, res));
router.put('/event-categories/reorder', (req, res) => configController.reorderEventCategories(req, res));
router.put('/event-categories/:id', (req, res) => configController.updateEventCategory(req, res));
router.delete('/event-categories/:id', (req, res) => configController.deleteEventCategory(req, res));

// ===========================================
// Document Types
// ===========================================
router.get('/document-types', (req, res) => configController.getDocumentTypes(req, res));
router.get('/document-types/:id', (req, res) => configController.getDocumentTypeById(req, res));
router.post('/document-types', (req, res) => configController.createDocumentType(req, res));
router.put('/document-types/:id', (req, res) => configController.updateDocumentType(req, res));
router.delete('/document-types/:id', (req, res) => configController.deleteDocumentType(req, res));

// ===========================================
// Event Provenances (Origins)
// ===========================================
router.get('/event-provenances', (req, res) => configController.getEventProvenances(req, res));
router.get('/event-provenances/:id', (req, res) => configController.getEventProvenanceById(req, res));
router.post('/event-provenances', (req, res) => configController.createEventProvenance(req, res));
router.put('/event-provenances/:id', (req, res) => configController.updateEventProvenance(req, res));
router.delete('/event-provenances/:id', (req, res) => configController.deleteEventProvenance(req, res));

// ===========================================
// Organizational Units
// ===========================================
router.get('/organizational-units', (req, res) => configController.getOrganizationalUnits(req, res));
router.get('/organizational-units/:id', (req, res) => configController.getOrganizationalUnitById(req, res));
router.post('/organizational-units', (req, res) => configController.createOrganizationalUnit(req, res));
router.put('/organizational-units/:id', (req, res) => configController.updateOrganizationalUnit(req, res));
router.delete('/organizational-units/:id', (req, res) => configController.deleteOrganizationalUnit(req, res));

// ===========================================
// Work Schedules
// ===========================================
router.get('/work-schedules', (req, res) => configController.getWorkSchedules(req, res));
router.get('/work-schedules/:id', (req, res) => configController.getWorkScheduleById(req, res));
router.post('/work-schedules', (req, res) => configController.createWorkSchedule(req, res));
router.put('/work-schedules/:id', (req, res) => configController.updateWorkSchedule(req, res));
router.put('/work-schedules/:id/days', (req, res) => configController.updateWorkScheduleDays(req, res));
router.delete('/work-schedules/:id', (req, res) => configController.deleteWorkSchedule(req, res));

// ===========================================
// Reference Data
// ===========================================
router.get('/countries', (req, res) => configController.getCountries(req, res));
router.get('/languages', (req, res) => configController.getLanguages(req, res));
router.get('/timezones', (req, res) => configController.getTimezones(req, res));
router.get('/reference-data', (req, res) => configController.getReferenceData(req, res));

export default router;

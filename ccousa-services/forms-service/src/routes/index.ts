import { Router, Request, Response } from 'express';
import formsController from '../controllers/forms.controller';
import { checkConnection } from '../utils/database';

const router = Router();

// ===========================================
// Health Check
// ===========================================

router.get('/health', async (req: Request, res: Response) => {
  const dbConnected = await checkConnection();
  res.json({
    success: true,
    service: 'forms-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: { database: dbConnected ? 'connected' : 'disconnected' },
  });
});

// ===========================================
// Statistics & Field Types (before :id routes)
// ===========================================

router.get('/stats', (req, res) => formsController.getStats(req, res));
router.get('/field-types', (req, res) => formsController.getFieldTypes(req, res));
router.get('/field-types/category/:category', (req, res) => formsController.getFieldTypesByCategory(req, res));

// ===========================================
// Submissions Routes (before :id routes)
// ===========================================

router.get('/submissions', (req, res) => formsController.getSubmissions(req, res));
router.get('/submissions/:id', (req, res) => formsController.getSubmissionById(req, res));
router.post('/submissions', (req, res) => formsController.createSubmission(req, res));
router.put('/submissions/:id', (req, res) => formsController.updateSubmission(req, res));
router.post('/submissions/:id/validate', (req, res) => formsController.validateSubmission(req, res));
router.post('/submissions/:id/reject', (req, res) => formsController.rejectSubmission(req, res));
router.delete('/submissions/:id', (req, res) => formsController.deleteSubmission(req, res));

// ===========================================
// Forms CRUD Routes
// ===========================================

router.get('/', (req, res) => formsController.getAll(req, res));
router.get('/code/:code', (req, res) => formsController.getByCode(req, res));
router.get('/:id', (req, res) => formsController.getById(req, res));
router.post('/', (req, res) => formsController.create(req, res));
router.put('/:id', (req, res) => formsController.update(req, res));
router.delete('/:id', (req, res) => formsController.delete(req, res));

// Form Actions
router.post('/:id/duplicate', (req, res) => formsController.duplicate(req, res));
router.post('/:id/publish', (req, res) => formsController.publish(req, res));
router.post('/:id/unpublish', (req, res) => formsController.unpublish(req, res));
router.post('/:id/validate', (req, res) => formsController.validate(req, res));

// ===========================================
// Form Sections Routes
// ===========================================

router.get('/:formId/sections', (req, res) => formsController.getSections(req, res));
router.post('/:formId/sections', (req, res) => formsController.createSection(req, res));
router.put('/:formId/sections/reorder', (req, res) => formsController.reorderSections(req, res));
router.put('/:formId/sections/:sectionId', (req, res) => formsController.updateSection(req, res));
router.delete('/:formId/sections/:sectionId', (req, res) => formsController.deleteSection(req, res));

// ===========================================
// Form Fields Routes
// ===========================================

router.get('/:formId/sections/:sectionId/fields', (req, res) => formsController.getFields(req, res));
router.post('/:formId/sections/:sectionId/fields', (req, res) => formsController.createField(req, res));
router.put('/:formId/sections/:sectionId/fields/reorder', (req, res) => formsController.reorderFields(req, res));
router.put('/:formId/sections/:sectionId/fields/:fieldId', (req, res) => formsController.updateField(req, res));
router.delete('/:formId/sections/:sectionId/fields/:fieldId', (req, res) => formsController.deleteField(req, res));

export default router;

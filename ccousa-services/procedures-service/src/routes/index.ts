import { Router, Request, Response } from 'express';
import {
  proceduresController,
  procedureGroupsController,
  procedureExecutionsController,
  procedureTemplatesController,
} from '../controllers/procedures.controller';
import { checkConnection } from '../utils/database';

const router = Router();

// ===========================================
// Health Check
// ===========================================

router.get('/health', async (req: Request, res: Response) => {
  const dbConnected = await checkConnection();
  res.json({
    success: true,
    service: 'procedures-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: { database: dbConnected ? 'connected' : 'disconnected' },
  });
});

// ===========================================
// Statistics (before :id to avoid conflict)
// ===========================================

router.get('/stats', (req, res) => proceduresController.getStats(req, res));

// ===========================================
// Groups Routes (before :id routes)
// ===========================================

router.get('/groups', (req, res) => procedureGroupsController.getAll(req, res));
router.get('/groups/:id', (req, res) => procedureGroupsController.getById(req, res));
router.post('/groups', (req, res) => procedureGroupsController.create(req, res));
router.put('/groups/:id', (req, res) => procedureGroupsController.update(req, res));
router.delete('/groups/:id', (req, res) => procedureGroupsController.delete(req, res));

// ===========================================
// Executions Routes (before :id routes)
// ===========================================

router.get('/executions', (req, res) => procedureExecutionsController.getAll(req, res));
router.get('/executions/:id', (req, res) => procedureExecutionsController.getById(req, res));
router.get('/executions/:id/timeline', (req, res) => procedureExecutionsController.getTimeline(req, res));
router.post('/executions/start', (req, res) => procedureExecutionsController.start(req, res));
router.put('/executions/:id/cancel', (req, res) => procedureExecutionsController.cancel(req, res));
router.put('/executions/:id/advance', (req, res) => procedureExecutionsController.advanceStep(req, res));
router.put('/executions/:executionId/steps/:stepExecutionId/complete', (req, res) => procedureExecutionsController.completeStep(req, res));
router.put('/executions/:executionId/steps/:stepExecutionId/skip', (req, res) => procedureExecutionsController.skipStep(req, res));
router.put('/executions/:executionId/steps/:stepExecutionId/assign', (req, res) => procedureExecutionsController.assignStep(req, res));

// ===========================================
// Templates Routes (before :id routes)
// ===========================================

router.get('/templates', (req, res) => procedureTemplatesController.getPublic(req, res));
router.get('/templates/mine', (req, res) => procedureTemplatesController.getMine(req, res));
router.post('/templates', (req, res) => procedureTemplatesController.createFromProcedure(req, res));
router.delete('/templates/:id', (req, res) => procedureTemplatesController.delete(req, res));

// ===========================================
// Import Route (before :id routes)
// ===========================================

router.post('/import', (req, res) => proceduresController.importFromTemplate(req, res));

// ===========================================
// Procedures CRUD Routes
// ===========================================

router.get('/', (req, res) => proceduresController.getAll(req, res));
router.get('/:id', (req, res) => proceduresController.getById(req, res));
router.post('/', (req, res) => proceduresController.create(req, res));
router.put('/:id', (req, res) => proceduresController.update(req, res));
router.delete('/:id', (req, res) => proceduresController.delete(req, res));
router.put('/:id/restore', (req, res) => proceduresController.restore(req, res));
router.delete('/:id/permanent', (req, res) => proceduresController.deletePermanent(req, res));

// Procedure Actions
router.post('/:id/duplicate', (req, res) => proceduresController.duplicate(req, res));
router.post('/:id/validate', (req, res) => proceduresController.validate(req, res));
router.get('/:id/export', (req, res) => proceduresController.exportAsTemplate(req, res));

// ===========================================
// Procedure Steps Routes
// ===========================================

router.get('/:procedureId/steps', (req, res) => proceduresController.getSteps(req, res));
router.get('/:procedureId/steps/:stepId', (req, res) => proceduresController.getStep(req, res));
router.post('/:procedureId/steps', (req, res) => proceduresController.createStep(req, res));
router.put('/:procedureId/steps/reorder', (req, res) => proceduresController.reorderSteps(req, res));
router.put('/:procedureId/steps/bulk', (req, res) => proceduresController.bulkUpdateSteps(req, res));
router.put('/:procedureId/steps/:stepId', (req, res) => proceduresController.updateStep(req, res));
router.delete('/:procedureId/steps/:stepId', (req, res) => proceduresController.deleteStep(req, res));

// ===========================================
// Event Procedures Route (for events-service integration)
// ===========================================

router.get('/events/:eventId/procedures', (req, res) => procedureExecutionsController.getByEventId(req, res));

export default router;

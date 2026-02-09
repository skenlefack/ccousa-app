import { Request, Response } from 'express';
import Joi from 'joi';
import {
  proceduresService,
  procedureGroupsService,
  procedureExecutionsService,
  procedureTemplatesService,
} from '../services/procedures.service';
import logger from '../utils/logger';

// ===========================================
// Validation Schemas
// ===========================================

const createProcedureSchema = Joi.object({
  code: Joi.string().max(50).optional(),
  name: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(5000).optional(),
  type: Joi.string().valid('STANDARD', 'EMERGENCY', 'ADMINISTRATIVE', 'CLINICAL', 'SAFETY').required(),
  groupId: Joi.string().uuid().optional(),
  categoryId: Joi.string().uuid().optional(),
  triggerType: Joi.string().valid('MANUAL', 'EVENT_CREATED', 'EVENT_STATUS_CHANGE', 'SCHEDULED', 'CONDITION_BASED').required(),
  triggerConfig: Joi.object().optional(),
  steps: Joi.array().items(Joi.object({
    name: Joi.string().max(200).required(),
    description: Joi.string().max(2000).optional(),
    stepNumber: Joi.number().integer().min(1).required(),
    durationHours: Joi.number().positive().optional(),
    isOptional: Joi.boolean().optional(),
    assigneeType: Joi.string().valid('USER', 'ROLE', 'DEPARTMENT', 'AUTO').required(),
    assigneeId: Joi.string().uuid().optional(),
    formId: Joi.string().uuid().optional(),
    requiredDocumentIds: Joi.array().items(Joi.string().uuid()).optional(),
    externalStepId: Joi.string().optional(),
  })).optional(),
});

const updateProcedureSchema = Joi.object({
  name: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(5000).optional().allow(null),
  type: Joi.string().valid('STANDARD', 'EMERGENCY', 'ADMINISTRATIVE', 'CLINICAL', 'SAFETY').optional(),
  groupId: Joi.string().uuid().optional().allow(null),
  categoryId: Joi.string().uuid().optional().allow(null),
  triggerType: Joi.string().valid('MANUAL', 'EVENT_CREATED', 'EVENT_STATUS_CHANGE', 'SCHEDULED', 'CONDITION_BASED').optional(),
  triggerConfig: Joi.object().optional(),
  isActive: Joi.boolean().optional(),
});

const createStepSchema = Joi.object({
  name: Joi.string().max(200).required(),
  description: Joi.string().max(2000).optional(),
  stepNumber: Joi.number().integer().min(1).required(),
  durationHours: Joi.number().positive().optional(),
  isOptional: Joi.boolean().optional(),
  assigneeType: Joi.string().valid('USER', 'ROLE', 'DEPARTMENT', 'AUTO').required(),
  assigneeId: Joi.string().uuid().optional(),
  formId: Joi.string().uuid().optional(),
  requiredDocumentIds: Joi.array().items(Joi.string().uuid()).optional(),
  externalStepId: Joi.string().optional(),
});

const createGroupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: Joi.string().max(50).optional(),
  parentId: Joi.string().uuid().optional(),
});

// ===========================================
// Helper Functions
// ===========================================

function getUserFromRequest(req: Request): { userId: string; email: string } | null {
  const userInfo = req.headers['x-user-info'];
  return userInfo ? JSON.parse(userInfo as string) : null;
}

function handleError(res: Response, error: unknown, context: string) {
  const err = error as Error;
  logger.error(`${context}:`, error);

  const errorMap: Record<string, { status: number; code: string; message: string }> = {
    'PROCEDURE_NOT_FOUND': { status: 404, code: 'PROCEDURE_NOT_FOUND', message: 'Procédure non trouvée' },
    'STEP_NOT_FOUND': { status: 404, code: 'STEP_NOT_FOUND', message: 'Étape non trouvée' },
    'GROUP_NOT_FOUND': { status: 404, code: 'GROUP_NOT_FOUND', message: 'Groupe non trouvé' },
    'EXECUTION_NOT_FOUND': { status: 404, code: 'EXECUTION_NOT_FOUND', message: 'Exécution non trouvée' },
    'EXECUTION_NOT_FOUND_OR_COMPLETED': { status: 400, code: 'EXECUTION_NOT_FOUND_OR_COMPLETED', message: 'Exécution non trouvée ou déjà terminée' },
    'EXECUTION_NOT_IN_PROGRESS': { status: 400, code: 'EXECUTION_NOT_IN_PROGRESS', message: 'L\'exécution n\'est pas en cours' },
    'STEP_EXECUTION_NOT_FOUND': { status: 404, code: 'STEP_EXECUTION_NOT_FOUND', message: 'Exécution de l\'étape non trouvée' },
    'TEMPLATE_NOT_FOUND': { status: 404, code: 'TEMPLATE_NOT_FOUND', message: 'Template non trouvé' },
    'NO_FIELDS_TO_UPDATE': { status: 400, code: 'NO_FIELDS_TO_UPDATE', message: 'Aucun champ à mettre à jour' },
  };

  const errorInfo = errorMap[err.message];
  if (errorInfo) {
    res.status(errorInfo.status).json({ success: false, message: errorInfo.message, code: errorInfo.code });
    return;
  }

  res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
}

// ===========================================
// Procedures Controller
// ===========================================

export class ProceduresController {
  // GET /procedures
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const sortBy = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc';

      const filters = {
        search: req.query.search as string,
        type: req.query.type as string,
        categoryId: req.query.categoryId as string,
        groupId: req.query.groupId as string,
        triggerType: req.query.triggerType as string,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      };

      const result = await proceduresService.findAll(filters, { page, pageSize, sortBy, sortOrder });
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      handleError(res, error, 'getAll');
    }
  }

  // GET /procedures/stats
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await proceduresService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      handleError(res, error, 'getStats');
    }
  }

  // GET /procedures/:id
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const procedure = await proceduresService.findById(req.params.id);
      res.json({ success: true, data: procedure });
    } catch (error) {
      handleError(res, error, 'getById');
    }
  }

  // POST /procedures
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createProcedureSchema.validate(req.body);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message, code: 'VALIDATION_ERROR' });
        return;
      }

      const user = getUserFromRequest(req);
      const procedure = await proceduresService.create({ ...value, createdById: user?.userId });
      res.status(201).json({ success: true, message: 'Procédure créée', data: procedure });
    } catch (error) {
      handleError(res, error, 'create');
    }
  }

  // PUT /procedures/:id
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateProcedureSchema.validate(req.body);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message, code: 'VALIDATION_ERROR' });
        return;
      }

      const procedure = await proceduresService.update(req.params.id, value);
      res.json({ success: true, message: 'Procédure mise à jour', data: procedure });
    } catch (error) {
      handleError(res, error, 'update');
    }
  }

  // DELETE /procedures/:id
  async delete(req: Request, res: Response): Promise<void> {
    try {
      await proceduresService.delete(req.params.id);
      res.json({ success: true, message: 'Procédure supprimée' });
    } catch (error) {
      handleError(res, error, 'delete');
    }
  }

  // PUT /procedures/:id/restore
  async restore(req: Request, res: Response): Promise<void> {
    try {
      await proceduresService.restore(req.params.id);
      res.json({ success: true, message: 'Procédure restaurée' });
    } catch (error) {
      handleError(res, error, 'restore');
    }
  }

  // DELETE /procedures/:id/permanent
  async deletePermanent(req: Request, res: Response): Promise<void> {
    try {
      await proceduresService.deletePermanent(req.params.id);
      res.json({ success: true, message: 'Procédure supprimée définitivement' });
    } catch (error) {
      handleError(res, error, 'deletePermanent');
    }
  }

  // POST /procedures/:id/duplicate
  async duplicate(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: 'Le nom est requis', code: 'VALIDATION_ERROR' });
        return;
      }

      const user = getUserFromRequest(req);
      const procedure = await proceduresService.duplicate(req.params.id, name, user?.userId || '');
      res.status(201).json({ success: true, message: 'Procédure dupliquée', data: procedure });
    } catch (error) {
      handleError(res, error, 'duplicate');
    }
  }

  // POST /procedures/:id/validate
  async validate(req: Request, res: Response): Promise<void> {
    try {
      const result = await proceduresService.validate(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      handleError(res, error, 'validate');
    }
  }

  // GET /procedures/:id/export
  async exportAsTemplate(req: Request, res: Response): Promise<void> {
    try {
      const template = await proceduresService.exportAsTemplate(req.params.id);
      res.json({ success: true, data: template });
    } catch (error) {
      handleError(res, error, 'exportAsTemplate');
    }
  }

  // POST /procedures/import
  async importFromTemplate(req: Request, res: Response): Promise<void> {
    try {
      const user = getUserFromRequest(req);
      const procedure = await proceduresService.importFromTemplate(req.body, user?.userId || '');
      res.status(201).json({ success: true, message: 'Procédure importée', data: procedure });
    } catch (error) {
      handleError(res, error, 'importFromTemplate');
    }
  }

  // ===========================================
  // Steps Endpoints
  // ===========================================

  // GET /procedures/:procedureId/steps
  async getSteps(req: Request, res: Response): Promise<void> {
    try {
      const steps = await proceduresService.getSteps(req.params.procedureId);
      res.json({ success: true, data: steps });
    } catch (error) {
      handleError(res, error, 'getSteps');
    }
  }

  // GET /procedures/:procedureId/steps/:stepId
  async getStep(req: Request, res: Response): Promise<void> {
    try {
      const step = await proceduresService.getStep(req.params.procedureId, req.params.stepId);
      res.json({ success: true, data: step });
    } catch (error) {
      handleError(res, error, 'getStep');
    }
  }

  // POST /procedures/:procedureId/steps
  async createStep(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createStepSchema.validate(req.body);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message, code: 'VALIDATION_ERROR' });
        return;
      }

      const step = await proceduresService.createStep(req.params.procedureId, value);
      res.status(201).json({ success: true, message: 'Étape créée', data: step });
    } catch (error) {
      handleError(res, error, 'createStep');
    }
  }

  // PUT /procedures/:procedureId/steps/:stepId
  async updateStep(req: Request, res: Response): Promise<void> {
    try {
      const step = await proceduresService.updateStep(req.params.procedureId, req.params.stepId, req.body);
      res.json({ success: true, message: 'Étape mise à jour', data: step });
    } catch (error) {
      handleError(res, error, 'updateStep');
    }
  }

  // DELETE /procedures/:procedureId/steps/:stepId
  async deleteStep(req: Request, res: Response): Promise<void> {
    try {
      await proceduresService.deleteStep(req.params.procedureId, req.params.stepId);
      res.json({ success: true, message: 'Étape supprimée' });
    } catch (error) {
      handleError(res, error, 'deleteStep');
    }
  }

  // PUT /procedures/:procedureId/steps/reorder
  async reorderSteps(req: Request, res: Response): Promise<void> {
    try {
      const { stepIds } = req.body;
      if (!Array.isArray(stepIds)) {
        res.status(400).json({ success: false, message: 'stepIds doit être un tableau', code: 'VALIDATION_ERROR' });
        return;
      }

      const steps = await proceduresService.reorderSteps(req.params.procedureId, stepIds);
      res.json({ success: true, message: 'Étapes réordonnées', data: steps });
    } catch (error) {
      handleError(res, error, 'reorderSteps');
    }
  }

  // PUT /procedures/:procedureId/steps/bulk
  async bulkUpdateSteps(req: Request, res: Response): Promise<void> {
    try {
      const { steps } = req.body;
      if (!Array.isArray(steps)) {
        res.status(400).json({ success: false, message: 'steps doit être un tableau', code: 'VALIDATION_ERROR' });
        return;
      }

      const result = await proceduresService.bulkUpdateSteps(req.params.procedureId, steps);
      res.json({ success: true, message: 'Étapes mises à jour', data: result });
    } catch (error) {
      handleError(res, error, 'bulkUpdateSteps');
    }
  }
}

// ===========================================
// Procedure Groups Controller
// ===========================================

export class ProcedureGroupsController {
  // GET /procedures/groups
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const asTree = req.query.asTree === 'true';
      const groups = await procedureGroupsService.findAll(asTree);
      res.json({ success: true, data: groups });
    } catch (error) {
      handleError(res, error, 'getGroups');
    }
  }

  // GET /procedures/groups/:id
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const group = await procedureGroupsService.findById(req.params.id);
      res.json({ success: true, data: group });
    } catch (error) {
      handleError(res, error, 'getGroupById');
    }
  }

  // POST /procedures/groups
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createGroupSchema.validate(req.body);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message, code: 'VALIDATION_ERROR' });
        return;
      }

      const group = await procedureGroupsService.create(value);
      res.status(201).json({ success: true, message: 'Groupe créé', data: group });
    } catch (error) {
      handleError(res, error, 'createGroup');
    }
  }

  // PUT /procedures/groups/:id
  async update(req: Request, res: Response): Promise<void> {
    try {
      const group = await procedureGroupsService.update(req.params.id, req.body);
      res.json({ success: true, message: 'Groupe mis à jour', data: group });
    } catch (error) {
      handleError(res, error, 'updateGroup');
    }
  }

  // DELETE /procedures/groups/:id
  async delete(req: Request, res: Response): Promise<void> {
    try {
      await procedureGroupsService.delete(req.params.id);
      res.json({ success: true, message: 'Groupe supprimé' });
    } catch (error) {
      handleError(res, error, 'deleteGroup');
    }
  }
}

// ===========================================
// Procedure Executions Controller
// ===========================================

export class ProcedureExecutionsController {
  // GET /procedures/executions
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const sortBy = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc';

      const filters = {
        procedureId: req.query.procedureId as string,
        eventId: req.query.eventId as string,
        status: req.query.status as string,
        startedById: req.query.startedById as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
      };

      const result = await procedureExecutionsService.findAll(filters, { page, pageSize, sortBy, sortOrder });
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      handleError(res, error, 'getExecutions');
    }
  }

  // GET /procedures/executions/:id
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const execution = await procedureExecutionsService.findById(req.params.id);
      res.json({ success: true, data: execution });
    } catch (error) {
      handleError(res, error, 'getExecutionById');
    }
  }

  // GET /events/:eventId/procedures
  async getByEventId(req: Request, res: Response): Promise<void> {
    try {
      const executions = await procedureExecutionsService.findByEventId(req.params.eventId);
      res.json({ success: true, data: executions });
    } catch (error) {
      handleError(res, error, 'getByEventId');
    }
  }

  // POST /procedures/executions/start
  async start(req: Request, res: Response): Promise<void> {
    try {
      const { procedureId, eventId } = req.body;
      if (!procedureId || !eventId) {
        res.status(400).json({ success: false, message: 'procedureId et eventId sont requis', code: 'VALIDATION_ERROR' });
        return;
      }

      const user = getUserFromRequest(req);
      const execution = await procedureExecutionsService.start(procedureId, eventId, user?.userId || '');
      res.status(201).json({ success: true, message: 'Exécution démarrée', data: execution });
    } catch (error) {
      handleError(res, error, 'startExecution');
    }
  }

  // PUT /procedures/executions/:id/cancel
  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const { reason } = req.body;
      if (!reason) {
        res.status(400).json({ success: false, message: 'La raison est requise', code: 'VALIDATION_ERROR' });
        return;
      }

      const user = getUserFromRequest(req);
      const execution = await procedureExecutionsService.cancel(req.params.id, reason, user?.userId || '');
      res.json({ success: true, message: 'Exécution annulée', data: execution });
    } catch (error) {
      handleError(res, error, 'cancelExecution');
    }
  }

  // PUT /procedures/executions/:id/advance
  async advanceStep(req: Request, res: Response): Promise<void> {
    try {
      const user = getUserFromRequest(req);
      const execution = await procedureExecutionsService.advanceStep(req.params.id, req.body.notes, user?.userId || '');
      res.json({ success: true, message: 'Étape avancée', data: execution });
    } catch (error) {
      handleError(res, error, 'advanceStep');
    }
  }

  // PUT /procedures/executions/:executionId/steps/:stepExecutionId/complete
  async completeStep(req: Request, res: Response): Promise<void> {
    try {
      const user = getUserFromRequest(req);
      const step = await procedureExecutionsService.completeStep(
        req.params.executionId,
        req.params.stepExecutionId,
        req.body,
        user?.userId || ''
      );
      res.json({ success: true, message: 'Étape terminée', data: step });
    } catch (error) {
      handleError(res, error, 'completeStep');
    }
  }

  // PUT /procedures/executions/:executionId/steps/:stepExecutionId/skip
  async skipStep(req: Request, res: Response): Promise<void> {
    try {
      const { reason } = req.body;
      if (!reason) {
        res.status(400).json({ success: false, message: 'La raison est requise', code: 'VALIDATION_ERROR' });
        return;
      }

      const user = getUserFromRequest(req);
      const step = await procedureExecutionsService.skipStep(
        req.params.executionId,
        req.params.stepExecutionId,
        reason,
        user?.userId || ''
      );
      res.json({ success: true, message: 'Étape sautée', data: step });
    } catch (error) {
      handleError(res, error, 'skipStep');
    }
  }

  // PUT /procedures/executions/:executionId/steps/:stepExecutionId/assign
  async assignStep(req: Request, res: Response): Promise<void> {
    try {
      const { assignedToId } = req.body;
      if (!assignedToId) {
        res.status(400).json({ success: false, message: 'assignedToId est requis', code: 'VALIDATION_ERROR' });
        return;
      }

      const user = getUserFromRequest(req);
      const step = await procedureExecutionsService.assignStep(
        req.params.executionId,
        req.params.stepExecutionId,
        assignedToId,
        user?.userId || ''
      );
      res.json({ success: true, message: 'Étape assignée', data: step });
    } catch (error) {
      handleError(res, error, 'assignStep');
    }
  }

  // GET /procedures/executions/:id/timeline
  async getTimeline(req: Request, res: Response): Promise<void> {
    try {
      const timeline = await procedureExecutionsService.getTimeline(req.params.id);
      res.json({ success: true, data: timeline });
    } catch (error) {
      handleError(res, error, 'getTimeline');
    }
  }
}

// ===========================================
// Procedure Templates Controller
// ===========================================

export class ProcedureTemplatesController {
  // GET /procedures/templates
  async getPublic(req: Request, res: Response): Promise<void> {
    try {
      const templates = await procedureTemplatesService.findPublic();
      res.json({ success: true, data: templates });
    } catch (error) {
      handleError(res, error, 'getPublicTemplates');
    }
  }

  // GET /procedures/templates/mine
  async getMine(req: Request, res: Response): Promise<void> {
    try {
      const user = getUserFromRequest(req);
      const templates = await procedureTemplatesService.findByUser(user?.userId || '');
      res.json({ success: true, data: templates });
    } catch (error) {
      handleError(res, error, 'getMyTemplates');
    }
  }

  // POST /procedures/templates
  async createFromProcedure(req: Request, res: Response): Promise<void> {
    try {
      const { procedureId, isPublic } = req.body;
      if (!procedureId) {
        res.status(400).json({ success: false, message: 'procedureId est requis', code: 'VALIDATION_ERROR' });
        return;
      }

      const user = getUserFromRequest(req);
      const template = await procedureTemplatesService.createFromProcedure(
        procedureId,
        isPublic || false,
        user?.userId || ''
      );
      res.status(201).json({ success: true, message: 'Template créé', data: template });
    } catch (error) {
      handleError(res, error, 'createTemplate');
    }
  }

  // DELETE /procedures/templates/:id
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const user = getUserFromRequest(req);
      await procedureTemplatesService.delete(req.params.id, user?.userId || '');
      res.json({ success: true, message: 'Template supprimé' });
    } catch (error) {
      handleError(res, error, 'deleteTemplate');
    }
  }
}

// Export controller instances
export const proceduresController = new ProceduresController();
export const procedureGroupsController = new ProcedureGroupsController();
export const procedureExecutionsController = new ProcedureExecutionsController();
export const procedureTemplatesController = new ProcedureTemplatesController();

export default proceduresController;

import { Request, Response } from 'express';
import Joi from 'joi';
import formsService from '../services/forms.service';
import logger from '../utils/logger';

// ===========================================
// Validation Schemas
// ===========================================

const createFormSchema = Joi.object({
  code: Joi.string().max(50).optional(),
  name: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(2000).optional(),
  type: Joi.string().valid('PARAMETER', 'PROCEDURE', 'EVENT', 'REPORT', 'SURVEY').optional(),
  languageCode: Joi.string().max(5).optional(),
  layoutColumns: Joi.number().valid(1, 2, 3).optional(),
  sections: Joi.array().items(Joi.object({
    title: Joi.string().max(150).required(),
    description: Joi.string().max(500).optional(),
    sortOrder: Joi.number().integer().min(1).required(),
    columns: Joi.number().valid(1, 2, 3).optional(),
    isCollapsible: Joi.boolean().optional(),
    fields: Joi.array().optional(),
  })).optional(),
});

const createSectionSchema = Joi.object({
  title: Joi.string().max(150).required(),
  description: Joi.string().max(500).optional(),
  sortOrder: Joi.number().integer().min(1).required(),
  columns: Joi.number().valid(1, 2, 3).optional(),
  isCollapsible: Joi.boolean().optional(),
  isCollapsedDefault: Joi.boolean().optional(),
});

const createFieldSchema = Joi.object({
  fieldTypeId: Joi.string().uuid().required(),
  code: Joi.string().max(100).required(),
  label: Joi.string().max(200).required(),
  placeholder: Joi.string().max(200).optional(),
  helpText: Joi.string().max(500).optional(),
  defaultValue: Joi.string().optional(),
  isRequired: Joi.boolean().optional(),
  isReadonly: Joi.boolean().optional(),
  isHidden: Joi.boolean().optional(),
  validationRules: Joi.object().optional(),
  options: Joi.array().items(Joi.object({
    value: Joi.string().required(),
    label: Joi.string().required(),
    sortOrder: Joi.number().optional(),
  })).optional(),
  conditionalLogic: Joi.array().optional(),
  sortOrder: Joi.number().integer().min(1).required(),
  columnSpan: Joi.number().valid(1, 2, 3).optional(),
});

const createSubmissionSchema = Joi.object({
  formId: Joi.string().uuid().required(),
  eventId: Joi.string().uuid().optional(),
  procedureExecutionId: Joi.string().uuid().optional(),
  stepExecutionId: Joi.string().uuid().optional(),
  data: Joi.object().required(),
  status: Joi.string().valid('DRAFT', 'SUBMITTED').optional(),
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
    'FORM_NOT_FOUND': { status: 404, code: 'FORM_NOT_FOUND', message: 'Formulaire non trouvé' },
    'SECTION_NOT_FOUND': { status: 404, code: 'SECTION_NOT_FOUND', message: 'Section non trouvée' },
    'FIELD_NOT_FOUND': { status: 404, code: 'FIELD_NOT_FOUND', message: 'Champ non trouvé' },
    'SUBMISSION_NOT_FOUND': { status: 404, code: 'SUBMISSION_NOT_FOUND', message: 'Soumission non trouvée' },
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
// Forms Controller
// ===========================================

export class FormsController {
  // GET /forms
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const sortBy = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc';

      const filters = {
        search: req.query.search as string,
        type: req.query.type as string,
        languageCode: req.query.languageCode as string,
        isPublished: req.query.isPublished !== undefined ? req.query.isPublished === 'true' : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      };

      const result = await formsService.findAll(filters, { page, pageSize, sortBy, sortOrder });
      res.json({ success: true, data: result });
    } catch (error) {
      handleError(res, error, 'getAll');
    }
  }

  // GET /forms/stats
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await formsService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      handleError(res, error, 'getStats');
    }
  }

  // GET /forms/field-types
  async getFieldTypes(req: Request, res: Response): Promise<void> {
    try {
      const fieldTypes = await formsService.getFieldTypes();
      res.json({ success: true, data: fieldTypes });
    } catch (error) {
      handleError(res, error, 'getFieldTypes');
    }
  }

  // GET /forms/field-types/category/:category
  async getFieldTypesByCategory(req: Request, res: Response): Promise<void> {
    try {
      const fieldTypes = await formsService.getFieldTypesByCategory(req.params.category);
      res.json({ success: true, data: fieldTypes });
    } catch (error) {
      handleError(res, error, 'getFieldTypesByCategory');
    }
  }

  // GET /forms/:id
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const form = await formsService.findById(req.params.id);
      res.json({ success: true, data: form });
    } catch (error) {
      handleError(res, error, 'getById');
    }
  }

  // GET /forms/code/:code
  async getByCode(req: Request, res: Response): Promise<void> {
    try {
      const form = await formsService.findByCode(req.params.code);
      res.json({ success: true, data: form });
    } catch (error) {
      handleError(res, error, 'getByCode');
    }
  }

  // POST /forms
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createFormSchema.validate(req.body);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message, code: 'VALIDATION_ERROR' });
        return;
      }

      const user = getUserFromRequest(req);
      const form = await formsService.create({ ...value, createdById: user?.userId });
      res.status(201).json({ success: true, message: 'Formulaire créé', data: form });
    } catch (error) {
      handleError(res, error, 'create');
    }
  }

  // PUT /forms/:id
  async update(req: Request, res: Response): Promise<void> {
    try {
      const form = await formsService.update(req.params.id, req.body);
      res.json({ success: true, message: 'Formulaire mis à jour', data: form });
    } catch (error) {
      handleError(res, error, 'update');
    }
  }

  // DELETE /forms/:id
  async delete(req: Request, res: Response): Promise<void> {
    try {
      await formsService.delete(req.params.id);
      res.json({ success: true, message: 'Formulaire supprimé' });
    } catch (error) {
      handleError(res, error, 'delete');
    }
  }

  // POST /forms/:id/duplicate
  async duplicate(req: Request, res: Response): Promise<void> {
    try {
      const { name, code } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: 'Le nom est requis', code: 'VALIDATION_ERROR' });
        return;
      }

      const user = getUserFromRequest(req);
      const form = await formsService.duplicate(req.params.id, name, code, user?.userId || '');
      res.status(201).json({ success: true, message: 'Formulaire dupliqué', data: form });
    } catch (error) {
      handleError(res, error, 'duplicate');
    }
  }

  // POST /forms/:id/publish
  async publish(req: Request, res: Response): Promise<void> {
    try {
      const form = await formsService.publish(req.params.id);
      res.json({ success: true, message: 'Formulaire publié', data: form });
    } catch (error) {
      handleError(res, error, 'publish');
    }
  }

  // POST /forms/:id/unpublish
  async unpublish(req: Request, res: Response): Promise<void> {
    try {
      const form = await formsService.unpublish(req.params.id);
      res.json({ success: true, message: 'Formulaire dépublié', data: form });
    } catch (error) {
      handleError(res, error, 'unpublish');
    }
  }

  // POST /forms/:id/validate
  async validate(req: Request, res: Response): Promise<void> {
    try {
      const result = await formsService.validate(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      handleError(res, error, 'validate');
    }
  }

  // ===========================================
  // Sections Endpoints
  // ===========================================

  // GET /forms/:formId/sections
  async getSections(req: Request, res: Response): Promise<void> {
    try {
      const sections = await formsService.getSections(req.params.formId);
      res.json({ success: true, data: sections });
    } catch (error) {
      handleError(res, error, 'getSections');
    }
  }

  // POST /forms/:formId/sections
  async createSection(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createSectionSchema.validate(req.body);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message, code: 'VALIDATION_ERROR' });
        return;
      }

      const section = await formsService.createSection(req.params.formId, value);
      res.status(201).json({ success: true, message: 'Section créée', data: section });
    } catch (error) {
      handleError(res, error, 'createSection');
    }
  }

  // PUT /forms/:formId/sections/:sectionId
  async updateSection(req: Request, res: Response): Promise<void> {
    try {
      const section = await formsService.updateSection(req.params.formId, req.params.sectionId, req.body);
      res.json({ success: true, message: 'Section mise à jour', data: section });
    } catch (error) {
      handleError(res, error, 'updateSection');
    }
  }

  // DELETE /forms/:formId/sections/:sectionId
  async deleteSection(req: Request, res: Response): Promise<void> {
    try {
      await formsService.deleteSection(req.params.formId, req.params.sectionId);
      res.json({ success: true, message: 'Section supprimée' });
    } catch (error) {
      handleError(res, error, 'deleteSection');
    }
  }

  // PUT /forms/:formId/sections/reorder
  async reorderSections(req: Request, res: Response): Promise<void> {
    try {
      const { sectionIds } = req.body;
      if (!Array.isArray(sectionIds)) {
        res.status(400).json({ success: false, message: 'sectionIds doit être un tableau', code: 'VALIDATION_ERROR' });
        return;
      }

      const sections = await formsService.reorderSections(req.params.formId, sectionIds);
      res.json({ success: true, message: 'Sections réordonnées', data: sections });
    } catch (error) {
      handleError(res, error, 'reorderSections');
    }
  }

  // ===========================================
  // Fields Endpoints
  // ===========================================

  // GET /forms/:formId/sections/:sectionId/fields
  async getFields(req: Request, res: Response): Promise<void> {
    try {
      const fields = await formsService.getFields(req.params.formId, req.params.sectionId);
      res.json({ success: true, data: fields });
    } catch (error) {
      handleError(res, error, 'getFields');
    }
  }

  // POST /forms/:formId/sections/:sectionId/fields
  async createField(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createFieldSchema.validate(req.body);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message, code: 'VALIDATION_ERROR' });
        return;
      }

      const field = await formsService.createField(req.params.formId, req.params.sectionId, value);
      res.status(201).json({ success: true, message: 'Champ créé', data: field });
    } catch (error) {
      handleError(res, error, 'createField');
    }
  }

  // PUT /forms/:formId/sections/:sectionId/fields/:fieldId
  async updateField(req: Request, res: Response): Promise<void> {
    try {
      const field = await formsService.updateField(req.params.formId, req.params.sectionId, req.params.fieldId, req.body);
      res.json({ success: true, message: 'Champ mis à jour', data: field });
    } catch (error) {
      handleError(res, error, 'updateField');
    }
  }

  // DELETE /forms/:formId/sections/:sectionId/fields/:fieldId
  async deleteField(req: Request, res: Response): Promise<void> {
    try {
      await formsService.deleteField(req.params.formId, req.params.sectionId, req.params.fieldId);
      res.json({ success: true, message: 'Champ supprimé' });
    } catch (error) {
      handleError(res, error, 'deleteField');
    }
  }

  // PUT /forms/:formId/sections/:sectionId/fields/reorder
  async reorderFields(req: Request, res: Response): Promise<void> {
    try {
      const { fieldIds } = req.body;
      if (!Array.isArray(fieldIds)) {
        res.status(400).json({ success: false, message: 'fieldIds doit être un tableau', code: 'VALIDATION_ERROR' });
        return;
      }

      const fields = await formsService.reorderFields(req.params.formId, req.params.sectionId, fieldIds);
      res.json({ success: true, message: 'Champs réordonnés', data: fields });
    } catch (error) {
      handleError(res, error, 'reorderFields');
    }
  }

  // ===========================================
  // Submissions Endpoints
  // ===========================================

  // GET /forms/submissions
  async getSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const filters = {
        formId: req.query.formId as string,
        eventId: req.query.eventId as string,
        status: req.query.status as string,
        submittedById: req.query.submittedById as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
      };

      const result = await formsService.getSubmissions(filters, { page, pageSize });
      res.json({ success: true, data: result });
    } catch (error) {
      handleError(res, error, 'getSubmissions');
    }
  }

  // GET /forms/submissions/:id
  async getSubmissionById(req: Request, res: Response): Promise<void> {
    try {
      const submission = await formsService.getSubmissionById(req.params.id);
      res.json({ success: true, data: submission });
    } catch (error) {
      handleError(res, error, 'getSubmissionById');
    }
  }

  // POST /forms/submissions
  async createSubmission(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createSubmissionSchema.validate(req.body);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message, code: 'VALIDATION_ERROR' });
        return;
      }

      const user = getUserFromRequest(req);
      const submission = await formsService.createSubmission({ ...value, submittedById: user?.userId || '' });
      res.status(201).json({ success: true, message: 'Formulaire soumis', data: submission });
    } catch (error) {
      handleError(res, error, 'createSubmission');
    }
  }

  // PUT /forms/submissions/:id
  async updateSubmission(req: Request, res: Response): Promise<void> {
    try {
      const submission = await formsService.updateSubmission(req.params.id, req.body);
      res.json({ success: true, message: 'Soumission mise à jour', data: submission });
    } catch (error) {
      handleError(res, error, 'updateSubmission');
    }
  }

  // POST /forms/submissions/:id/validate
  async validateSubmission(req: Request, res: Response): Promise<void> {
    try {
      const user = getUserFromRequest(req);
      const submission = await formsService.validateSubmission(req.params.id, user?.userId || '');
      res.json({ success: true, message: 'Soumission validée', data: submission });
    } catch (error) {
      handleError(res, error, 'validateSubmission');
    }
  }

  // POST /forms/submissions/:id/reject
  async rejectSubmission(req: Request, res: Response): Promise<void> {
    try {
      const { reason } = req.body;
      if (!reason) {
        res.status(400).json({ success: false, message: 'La raison est requise', code: 'VALIDATION_ERROR' });
        return;
      }

      const user = getUserFromRequest(req);
      const submission = await formsService.rejectSubmission(req.params.id, reason, user?.userId || '');
      res.json({ success: true, message: 'Soumission rejetée', data: submission });
    } catch (error) {
      handleError(res, error, 'rejectSubmission');
    }
  }

  // DELETE /forms/submissions/:id
  async deleteSubmission(req: Request, res: Response): Promise<void> {
    try {
      await formsService.deleteSubmission(req.params.id);
      res.json({ success: true, message: 'Soumission supprimée' });
    } catch (error) {
      handleError(res, error, 'deleteSubmission');
    }
  }
}

export const formsController = new FormsController();
export default formsController;

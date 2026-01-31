import { Request, Response } from 'express';
import Joi from 'joi';
import eventsService from '../services/events.service';
import logger from '../utils/logger';

// ===========================================
// Validation Schemas
// ===========================================

const createEventSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().max(5000).allow('', null),
  categoryId: Joi.string().uuid().required(),
  severity: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').required(),
  location: Joi.string().max(200).required(),
  latitude: Joi.number().min(-90).max(90).allow(null),
  longitude: Joi.number().min(-180).max(180).allow(null),
  organizationalUnitId: Joi.string().uuid().allow(null),
  reportedAt: Joi.string().isoDate().allow(null),
});

const updateEventSchema = Joi.object({
  title: Joi.string().min(5).max(200),
  description: Joi.string().max(5000).allow('', null),
  categoryId: Joi.string().uuid(),
  status: Joi.string().valid('REPORTED', 'INVESTIGATING', 'CONFIRMED', 'RESOLVED', 'CLOSED'),
  severity: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
  location: Joi.string().max(200),
  latitude: Joi.number().min(-90).max(90).allow(null),
  longitude: Joi.number().min(-180).max(180).allow(null),
  organizationalUnitId: Joi.string().uuid().allow(null),
  assignedToId: Joi.string().uuid().allow(null),
});

const changeStatusSchema = Joi.object({
  status: Joi.string().valid('REPORTED', 'INVESTIGATING', 'CONFIRMED', 'RESOLVED', 'CLOSED').required(),
  reason: Joi.string().max(500).allow('', null),
});

const assignSchema = Joi.object({
  assignedToId: Joi.string().uuid().allow(null).required(),
});

const commentSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
});

const taskSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(2000).allow('', null),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').default('MEDIUM'),
  assignedToId: Joi.string().uuid().allow(null),
  dueDate: Joi.string().isoDate().allow(null),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200),
  description: Joi.string().max(2000).allow('', null),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
  assignedToId: Joi.string().uuid().allow(null),
  dueDate: Joi.string().isoDate().allow(null),
});

const taskStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').required(),
});

// ===========================================
// Helper Functions
// ===========================================

function getUserFromRequest(req: Request): { userId: string; email: string } | null {
  const userInfo = req.headers['x-user-info'];
  if (userInfo) {
    try {
      return JSON.parse(userInfo as string);
    } catch {
      return null;
    }
  }
  return null;
}

function handleError(res: Response, error: unknown) {
  const err = error as Error;
  const errorMap: Record<string, { status: number; code: string; message: string }> = {
    EVENT_NOT_FOUND: { status: 404, code: 'EVENT_NOT_FOUND', message: 'Événement non trouvé' },
    COMMENT_NOT_FOUND: { status: 404, code: 'COMMENT_NOT_FOUND', message: 'Commentaire non trouvé' },
    ATTACHMENT_NOT_FOUND: { status: 404, code: 'ATTACHMENT_NOT_FOUND', message: 'Pièce jointe non trouvée' },
    TASK_NOT_FOUND: { status: 404, code: 'TASK_NOT_FOUND', message: 'Tâche non trouvée' },
    NO_FIELDS_TO_UPDATE: { status: 400, code: 'NO_FIELDS_TO_UPDATE', message: 'Aucun champ à mettre à jour' },
  };

  const errorInfo = errorMap[err.message];
  if (errorInfo) {
    res.status(errorInfo.status).json({
      success: false,
      message: errorInfo.message,
      code: errorInfo.code,
    });
    return;
  }

  logger.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    code: 'INTERNAL_ERROR',
  });
}

// ===========================================
// Controller
// ===========================================

export class EventsController {
  // ===========================================
  // Events CRUD
  // ===========================================

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
        severity: req.query.severity as string,
        categoryId: req.query.categoryId as string,
        organizationalUnitId: req.query.organizationalUnitId as string,
        assignedToId: req.query.assignedToId as string,
        reportedById: req.query.reportedById as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
      };

      const pagination = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        sortBy: req.query.sortBy as string || 'reported_at',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await eventsService.findAll(filters, pagination);
      res.json({ success: true, data: result });
    } catch (error) {
      handleError(res, error);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const includeDetails = req.query.includeDetails !== 'false';
      const event = await eventsService.findById(req.params.id, includeDetails);
      res.json({ success: true, data: event });
    } catch (error) {
      handleError(res, error);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createEventSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const user = getUserFromRequest(req);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      const event = await eventsService.create({
        ...value,
        reportedById: user.userId,
      });

      res.status(201).json({
        success: true,
        message: 'Événement créé avec succès',
        data: event,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateEventSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const event = await eventsService.update(req.params.id, value);
      res.json({
        success: true,
        message: 'Événement mis à jour',
        data: event,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await eventsService.delete(req.params.id);
      res.json({
        success: true,
        message: 'Événement supprimé',
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  // ===========================================
  // Status & Assignment
  // ===========================================

  async changeStatus(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = changeStatusSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const user = getUserFromRequest(req);
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifié', code: 'UNAUTHORIZED' });
        return;
      }

      const event = await eventsService.changeStatus(req.params.id, value.status, user.userId, value.reason);
      res.json({
        success: true,
        message: 'Statut mis à jour',
        data: event,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  async assign(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = assignSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const user = getUserFromRequest(req);
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifié', code: 'UNAUTHORIZED' });
        return;
      }

      const event = await eventsService.assign(req.params.id, value.assignedToId, user.userId);
      res.json({
        success: true,
        message: value.assignedToId ? 'Événement assigné' : 'Assignation retirée',
        data: event,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  // ===========================================
  // Bulk Operations
  // ===========================================

  async bulkUpdateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { ids, status } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Liste d\'IDs requise',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const user = getUserFromRequest(req);
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifié', code: 'UNAUTHORIZED' });
        return;
      }

      const events = await eventsService.bulkUpdateStatus(ids, status, user.userId);
      res.json({
        success: true,
        message: `${events.length} événement(s) mis à jour`,
        data: events,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  async bulkAssign(req: Request, res: Response): Promise<void> {
    try {
      const { ids, assignedToId } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Liste d\'IDs requise',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const user = getUserFromRequest(req);
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifié', code: 'UNAUTHORIZED' });
        return;
      }

      const events = await eventsService.bulkAssign(ids, assignedToId, user.userId);
      res.json({
        success: true,
        message: `${events.length} événement(s) assigné(s)`,
        data: events,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  async bulkDelete(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Liste d\'IDs requise',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      await eventsService.bulkDelete(ids);
      res.json({
        success: true,
        message: `${ids.length} événement(s) supprimé(s)`,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  // ===========================================
  // Statistics
  // ===========================================

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        organizationalUnitId: req.query.organizationalUnitId as string,
      };

      const stats = await eventsService.getStats(filters);
      res.json({ success: true, data: stats });
    } catch (error) {
      handleError(res, error);
    }
  }

  // ===========================================
  // Comments
  // ===========================================

  async getComments(req: Request, res: Response): Promise<void> {
    try {
      const comments = await eventsService.getComments(req.params.id);
      res.json({ success: true, data: comments });
    } catch (error) {
      handleError(res, error);
    }
  }

  async addComment(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = commentSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const user = getUserFromRequest(req);
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifié', code: 'UNAUTHORIZED' });
        return;
      }

      const comment = await eventsService.addComment(req.params.id, {
        content: value.content,
        userId: user.userId,
      });

      res.status(201).json({
        success: true,
        message: 'Commentaire ajouté',
        data: comment,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  async updateComment(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = commentSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const comment = await eventsService.updateComment(req.params.id, req.params.commentId, value.content);
      res.json({
        success: true,
        message: 'Commentaire modifié',
        data: comment,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      await eventsService.deleteComment(req.params.id, req.params.commentId);
      res.json({
        success: true,
        message: 'Commentaire supprimé',
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  // ===========================================
  // Attachments
  // ===========================================

  async getAttachments(req: Request, res: Response): Promise<void> {
    try {
      const attachments = await eventsService.getAttachments(req.params.id);
      res.json({ success: true, data: attachments });
    } catch (error) {
      handleError(res, error);
    }
  }

  async uploadAttachment(req: Request, res: Response): Promise<void> {
    try {
      const user = getUserFromRequest(req);
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifié', code: 'UNAUTHORIZED' });
        return;
      }

      // File should be processed by multer middleware
      const file = req.file;
      if (!file) {
        res.status(400).json({
          success: false,
          message: 'Fichier requis',
          code: 'FILE_REQUIRED',
        });
        return;
      }

      // In a real implementation, upload to cloud storage and get URL
      const url = `/uploads/events/${req.params.id}/${file.filename}`;

      const attachment = await eventsService.addAttachment(req.params.id, {
        fileName: file.filename,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        url,
        documentTypeId: req.body.documentTypeId,
        uploadedById: user.userId,
      });

      res.status(201).json({
        success: true,
        message: 'Fichier téléchargé',
        data: attachment,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  async deleteAttachment(req: Request, res: Response): Promise<void> {
    try {
      await eventsService.deleteAttachment(req.params.id, req.params.attachmentId);
      res.json({
        success: true,
        message: 'Fichier supprimé',
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  // ===========================================
  // Tasks
  // ===========================================

  async getTasks(req: Request, res: Response): Promise<void> {
    try {
      const tasks = await eventsService.getTasks(req.params.id);
      res.json({ success: true, data: tasks });
    } catch (error) {
      handleError(res, error);
    }
  }

  async getTask(req: Request, res: Response): Promise<void> {
    try {
      const tasks = await eventsService.getTasks(req.params.id);
      const task = tasks.find((t) => t.id === req.params.taskId);

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Tâche non trouvée',
          code: 'TASK_NOT_FOUND',
        });
        return;
      }

      res.json({ success: true, data: task });
    } catch (error) {
      handleError(res, error);
    }
  }

  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = taskSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const user = getUserFromRequest(req);
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifié', code: 'UNAUTHORIZED' });
        return;
      }

      const task = await eventsService.addTask(req.params.id, {
        ...value,
        createdById: user.userId,
      });

      res.status(201).json({
        success: true,
        message: 'Tâche créée',
        data: task,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateTaskSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const task = await eventsService.updateTask(req.params.id, req.params.taskId, value);
      res.json({
        success: true,
        message: 'Tâche mise à jour',
        data: task,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  async changeTaskStatus(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = taskStatusSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const user = getUserFromRequest(req);
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifié', code: 'UNAUTHORIZED' });
        return;
      }

      const task = await eventsService.changeTaskStatus(req.params.id, req.params.taskId, value.status, user.userId);
      res.json({
        success: true,
        message: 'Statut de la tâche mis à jour',
        data: task,
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      await eventsService.deleteTask(req.params.id, req.params.taskId);
      res.json({
        success: true,
        message: 'Tâche supprimée',
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  // ===========================================
  // Timeline
  // ===========================================

  async getTimeline(req: Request, res: Response): Promise<void> {
    try {
      const timeline = await eventsService.getTimeline(req.params.id);
      res.json({ success: true, data: timeline });
    } catch (error) {
      handleError(res, error);
    }
  }
}

export default new EventsController();

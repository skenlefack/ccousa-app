import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import eventsController from '../controllers/events.controller';
import { checkConnection } from '../utils/database';

const router = Router();

// ===========================================
// File Upload Configuration
// ===========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  },
});

// ===========================================
// Health Check
// ===========================================

router.get('/health', async (req: Request, res: Response) => {
  const dbConnected = await checkConnection();
  res.json({
    success: true,
    service: 'events-service',
    status: 'healthy',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    checks: { database: dbConnected ? 'connected' : 'disconnected' },
  });
});

// ===========================================
// Statistics
// ===========================================

router.get('/stats', (req, res) => eventsController.getStats(req, res));

// ===========================================
// Bulk Operations
// ===========================================

router.put('/bulk/status', (req, res) => eventsController.bulkUpdateStatus(req, res));
router.put('/bulk/assign', (req, res) => eventsController.bulkAssign(req, res));
router.delete('/bulk', (req, res) => eventsController.bulkDelete(req, res));

// ===========================================
// Events CRUD
// ===========================================

router.get('/', (req, res) => eventsController.getAll(req, res));
router.post('/', (req, res) => eventsController.create(req, res));
router.get('/:id', (req, res) => eventsController.getById(req, res));
router.put('/:id', (req, res) => eventsController.update(req, res));
router.delete('/:id', (req, res) => eventsController.delete(req, res));

// ===========================================
// Status & Assignment
// ===========================================

router.put('/:id/status', (req, res) => eventsController.changeStatus(req, res));
router.put('/:id/assign', (req, res) => eventsController.assign(req, res));

// ===========================================
// Comments
// ===========================================

router.get('/:id/comments', (req, res) => eventsController.getComments(req, res));
router.post('/:id/comments', (req, res) => eventsController.addComment(req, res));
router.put('/:id/comments/:commentId', (req, res) => eventsController.updateComment(req, res));
router.delete('/:id/comments/:commentId', (req, res) => eventsController.deleteComment(req, res));

// ===========================================
// Attachments
// ===========================================

router.get('/:id/attachments', (req, res) => eventsController.getAttachments(req, res));
router.post('/:id/attachments', upload.single('file'), (req, res) => eventsController.uploadAttachment(req, res));
router.delete('/:id/attachments/:attachmentId', (req, res) => eventsController.deleteAttachment(req, res));

// ===========================================
// Tasks
// ===========================================

router.get('/:id/tasks', (req, res) => eventsController.getTasks(req, res));
router.get('/:id/tasks/:taskId', (req, res) => eventsController.getTask(req, res));
router.post('/:id/tasks', (req, res) => eventsController.createTask(req, res));
router.put('/:id/tasks/:taskId', (req, res) => eventsController.updateTask(req, res));
router.put('/:id/tasks/:taskId/status', (req, res) => eventsController.changeTaskStatus(req, res));
router.delete('/:id/tasks/:taskId', (req, res) => eventsController.deleteTask(req, res));

// ===========================================
// Timeline
// ===========================================

router.get('/:id/timeline', (req, res) => eventsController.getTimeline(req, res));

export default router;

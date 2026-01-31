import { query } from '../utils/database';
import logger from '../utils/logger';

// ===========================================
// Types
// ===========================================

interface CreateEventDto {
  title: string;
  description?: string;
  categoryId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: string;
  latitude?: number;
  longitude?: number;
  organizationalUnitId?: string;
  reportedById: string;
  reportedAt?: string;
}

interface UpdateEventDto {
  title?: string;
  description?: string;
  categoryId?: string;
  status?: 'REPORTED' | 'INVESTIGATING' | 'CONFIRMED' | 'RESOLVED' | 'CLOSED';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location?: string;
  latitude?: number;
  longitude?: number;
  organizationalUnitId?: string;
  assignedToId?: string | null;
}

interface EventFilters {
  search?: string;
  status?: string | string[];
  severity?: string | string[];
  categoryId?: string | string[];
  organizationalUnitId?: string | string[];
  assignedToId?: string;
  reportedById?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateCommentDto {
  content: string;
  userId: string;
}

interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedToId?: string;
  dueDate?: string;
  createdById: string;
}

interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedToId?: string;
  dueDate?: string;
}

// ===========================================
// Events Service
// ===========================================

export class EventsService {
  // Generate unique event code
  private async generateEventCode(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await query(
      `SELECT COUNT(*) + 1 as next_num FROM health_events WHERE EXTRACT(YEAR FROM created_at) = $1`,
      [year]
    );
    const nextNum = result.rows[0].next_num.toString().padStart(5, '0');
    return `EVT-${year}-${nextNum}`;
  }

  // Get all events with pagination and filters
  async findAll(filters: EventFilters = {}, pagination: PaginationParams = {}) {
    const { page = 1, pageSize = 10, sortBy = 'reported_at', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * pageSize;
    const params: unknown[] = [];
    let paramIndex = 1;

    // Build WHERE clauses
    const conditions: string[] = ['1=1'];

    if (filters.search) {
      conditions.push(`(e.title ILIKE $${paramIndex} OR e.code ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : filters.status.split(',');
      conditions.push(`e.status = ANY($${paramIndex}::text[])`);
      params.push(statuses);
      paramIndex++;
    }

    if (filters.severity) {
      const severities = Array.isArray(filters.severity) ? filters.severity : filters.severity.split(',');
      conditions.push(`e.severity = ANY($${paramIndex}::text[])`);
      params.push(severities);
      paramIndex++;
    }

    if (filters.categoryId) {
      const categories = Array.isArray(filters.categoryId) ? filters.categoryId : filters.categoryId.split(',');
      conditions.push(`e.category_id = ANY($${paramIndex}::uuid[])`);
      params.push(categories);
      paramIndex++;
    }

    if (filters.organizationalUnitId) {
      const units = Array.isArray(filters.organizationalUnitId) ? filters.organizationalUnitId : filters.organizationalUnitId.split(',');
      conditions.push(`e.organizational_unit_id = ANY($${paramIndex}::uuid[])`);
      params.push(units);
      paramIndex++;
    }

    if (filters.assignedToId) {
      conditions.push(`e.assigned_to_id = $${paramIndex}`);
      params.push(filters.assignedToId);
      paramIndex++;
    }

    if (filters.reportedById) {
      conditions.push(`e.reported_by_id = $${paramIndex}`);
      params.push(filters.reportedById);
      paramIndex++;
    }

    if (filters.dateFrom) {
      conditions.push(`e.reported_at >= $${paramIndex}`);
      params.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters.dateTo) {
      conditions.push(`e.reported_at <= $${paramIndex}`);
      params.push(filters.dateTo);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['reported_at', 'created_at', 'updated_at', 'severity', 'status', 'title'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'reported_at';
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const queryText = `
      SELECT
        e.id, e.code, e.title, e.description, e.status, e.severity,
        e.location, e.latitude, e.longitude,
        e.category_id as "categoryId",
        e.organizational_unit_id as "organizationalUnitId",
        e.reported_by_id as "reportedById",
        e.assigned_to_id as "assignedToId",
        e.reported_at as "reportedAt",
        e.confirmed_at as "confirmedAt",
        e.resolved_at as "resolvedAt",
        e.closed_at as "closedAt",
        e.created_at as "createdAt",
        e.updated_at as "updatedAt",
        json_build_object(
          'id', ec.id, 'code', ec.code, 'name', ec.name, 'color', ec.color, 'icon', ec.icon
        ) as category,
        CASE WHEN rb.id IS NOT NULL THEN json_build_object(
          'id', rb.id, 'firstName', rb.first_name, 'lastName', rb.last_name, 'email', rb.email
        ) ELSE NULL END as "reportedBy",
        CASE WHEN at.id IS NOT NULL THEN json_build_object(
          'id', at.id, 'firstName', at.first_name, 'lastName', at.last_name, 'email', at.email
        ) ELSE NULL END as "assignedTo",
        CASE WHEN ou.id IS NOT NULL THEN json_build_object(
          'id', ou.id, 'code', ou.code, 'name', ou.name, 'type', ou.type
        ) ELSE NULL END as "organizationalUnit"
      FROM health_events e
      LEFT JOIN event_categories ec ON e.category_id = ec.id
      LEFT JOIN users rb ON e.reported_by_id = rb.id
      LEFT JOIN users at ON e.assigned_to_id = at.id
      LEFT JOIN organizational_units ou ON e.organizational_unit_id = ou.id
      WHERE ${whereClause}
      ORDER BY e.${safeSortBy} ${safeSortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    params.push(pageSize, offset);

    const result = await query(queryText, params);

    // Count total
    const countParams = params.slice(0, -2); // Remove LIMIT and OFFSET params
    const countResult = await query(
      `SELECT COUNT(*) FROM health_events e WHERE ${whereClause}`,
      countParams
    );
    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / pageSize);

    return {
      items: result.rows,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  // Get single event with details
  async findById(id: string, includeDetails = true) {
    const eventResult = await query(
      `SELECT
        e.id, e.code, e.title, e.description, e.status, e.severity,
        e.location, e.latitude, e.longitude,
        e.category_id as "categoryId",
        e.organizational_unit_id as "organizationalUnitId",
        e.reported_by_id as "reportedById",
        e.assigned_to_id as "assignedToId",
        e.reported_at as "reportedAt",
        e.confirmed_at as "confirmedAt",
        e.resolved_at as "resolvedAt",
        e.closed_at as "closedAt",
        e.created_at as "createdAt",
        e.updated_at as "updatedAt",
        json_build_object(
          'id', ec.id, 'code', ec.code, 'name', ec.name, 'color', ec.color, 'icon', ec.icon
        ) as category,
        CASE WHEN rb.id IS NOT NULL THEN json_build_object(
          'id', rb.id, 'firstName', rb.first_name, 'lastName', rb.last_name, 'email', rb.email
        ) ELSE NULL END as "reportedBy",
        CASE WHEN at.id IS NOT NULL THEN json_build_object(
          'id', at.id, 'firstName', at.first_name, 'lastName', at.last_name, 'email', at.email
        ) ELSE NULL END as "assignedTo",
        CASE WHEN ou.id IS NOT NULL THEN json_build_object(
          'id', ou.id, 'code', ou.code, 'name', ou.name, 'type', ou.type
        ) ELSE NULL END as "organizationalUnit"
      FROM health_events e
      LEFT JOIN event_categories ec ON e.category_id = ec.id
      LEFT JOIN users rb ON e.reported_by_id = rb.id
      LEFT JOIN users at ON e.assigned_to_id = at.id
      LEFT JOIN organizational_units ou ON e.organizational_unit_id = ou.id
      WHERE e.id = $1`,
      [id]
    );

    if (eventResult.rows.length === 0) {
      throw new Error('EVENT_NOT_FOUND');
    }

    const event = eventResult.rows[0];

    if (includeDetails) {
      // Get comments
      const commentsResult = await query(
        `SELECT c.id, c.event_id as "eventId", c.user_id as "userId", c.content,
                c.created_at as "createdAt", c.updated_at as "updatedAt",
                json_build_object('id', u.id, 'firstName', u.first_name, 'lastName', u.last_name) as user
         FROM event_comments c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.event_id = $1
         ORDER BY c.created_at DESC`,
        [id]
      );
      event.comments = commentsResult.rows;

      // Get attachments
      const attachmentsResult = await query(
        `SELECT a.id, a.event_id as "eventId", a.file_name as "fileName",
                a.original_name as "originalName", a.file_size as "fileSize",
                a.mime_type as "mimeType", a.document_type_id as "documentTypeId",
                a.uploaded_by_id as "uploadedById", a.url, a.thumbnail_url as "thumbnailUrl",
                a.created_at as "createdAt",
                json_build_object('id', u.id, 'firstName', u.first_name, 'lastName', u.last_name) as "uploadedBy"
         FROM event_attachments a
         LEFT JOIN users u ON a.uploaded_by_id = u.id
         WHERE a.event_id = $1
         ORDER BY a.created_at DESC`,
        [id]
      );
      event.attachments = attachmentsResult.rows;

      // Get tasks
      const tasksResult = await query(
        `SELECT t.id, t.event_id as "eventId", t.title, t.description, t.status, t.priority,
                t.assigned_to_id as "assignedToId", t.due_date as "dueDate",
                t.completed_at as "completedAt", t.created_by_id as "createdById",
                t.created_at as "createdAt", t.updated_at as "updatedAt",
                CASE WHEN at.id IS NOT NULL THEN json_build_object('id', at.id, 'firstName', at.first_name, 'lastName', at.last_name) ELSE NULL END as "assignedTo",
                json_build_object('id', cb.id, 'firstName', cb.first_name, 'lastName', cb.last_name) as "createdBy"
         FROM event_tasks t
         LEFT JOIN users at ON t.assigned_to_id = at.id
         LEFT JOIN users cb ON t.created_by_id = cb.id
         WHERE t.event_id = $1
         ORDER BY t.created_at DESC`,
        [id]
      );
      event.tasks = tasksResult.rows;
    }

    return event;
  }

  // Create event
  async create(data: CreateEventDto) {
    const code = await this.generateEventCode();
    const reportedAt = data.reportedAt ? new Date(data.reportedAt) : new Date();

    const result = await query(
      `INSERT INTO health_events (
        code, title, description, category_id, status, severity,
        location, latitude, longitude, organizational_unit_id,
        reported_by_id, reported_at
      ) VALUES ($1, $2, $3, $4, 'REPORTED', $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        code,
        data.title,
        data.description || null,
        data.categoryId,
        data.severity,
        data.location,
        data.latitude || null,
        data.longitude || null,
        data.organizationalUnitId || null,
        data.reportedById,
        reportedAt,
      ]
    );

    // Create timeline entry
    await this.addTimelineEntry(result.rows[0].id, 'CREATED', 'Événement créé', data.reportedById);

    logger.info(`Event created: ${result.rows[0].id} - ${code}`);
    return this.findById(result.rows[0].id, false);
  }

  // Update event
  async update(id: string, data: UpdateEventDto) {
    const fieldMappings: Record<string, string> = {
      title: 'title',
      description: 'description',
      categoryId: 'category_id',
      status: 'status',
      severity: 'severity',
      location: 'location',
      latitude: 'latitude',
      longitude: 'longitude',
      organizationalUnitId: 'organizational_unit_id',
      assignedToId: 'assigned_to_id',
    };

    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && fieldMappings[key]) {
        fields.push(`${fieldMappings[key]} = $${paramCount++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) throw new Error('NO_FIELDS_TO_UPDATE');

    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await query(
      `UPDATE health_events SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) throw new Error('EVENT_NOT_FOUND');

    logger.info(`Event updated: ${id}`);
    return this.findById(id, false);
  }

  // Change event status
  async changeStatus(id: string, status: string, userId: string, reason?: string) {
    const timestampField = {
      CONFIRMED: 'confirmed_at',
      RESOLVED: 'resolved_at',
      CLOSED: 'closed_at',
    }[status];

    let queryText = `UPDATE health_events SET status = $1, updated_at = NOW()`;
    const params: unknown[] = [status];

    if (timestampField) {
      queryText += `, ${timestampField} = NOW()`;
    }

    queryText += ` WHERE id = $2 RETURNING *`;
    params.push(id);

    const result = await query(queryText, params);
    if (result.rows.length === 0) throw new Error('EVENT_NOT_FOUND');

    // Add timeline entry
    const description = reason ? `Statut changé vers ${status}: ${reason}` : `Statut changé vers ${status}`;
    await this.addTimelineEntry(id, 'STATUS_CHANGED', description, userId, { status, reason });

    logger.info(`Event ${id} status changed to ${status}`);
    return this.findById(id, false);
  }

  // Assign event
  async assign(id: string, assignedToId: string | null, userId: string) {
    const result = await query(
      `UPDATE health_events SET assigned_to_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [assignedToId, id]
    );

    if (result.rows.length === 0) throw new Error('EVENT_NOT_FOUND');

    // Add timeline entry
    const description = assignedToId ? 'Événement assigné' : 'Assignation retirée';
    await this.addTimelineEntry(id, 'ASSIGNED', description, userId, { assignedToId });

    logger.info(`Event ${id} assigned to ${assignedToId}`);
    return this.findById(id, false);
  }

  // Delete event
  async delete(id: string) {
    // Delete related records first
    await query('DELETE FROM event_timeline WHERE event_id = $1', [id]);
    await query('DELETE FROM event_tasks WHERE event_id = $1', [id]);
    await query('DELETE FROM event_attachments WHERE event_id = $1', [id]);
    await query('DELETE FROM event_comments WHERE event_id = $1', [id]);

    const result = await query('DELETE FROM health_events WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) throw new Error('EVENT_NOT_FOUND');

    logger.info(`Event deleted: ${id}`);
    return { id };
  }

  // Bulk operations
  async bulkUpdateStatus(ids: string[], status: string, userId: string) {
    const result = await query(
      `UPDATE health_events SET status = $1, updated_at = NOW() WHERE id = ANY($2::uuid[]) RETURNING *`,
      [status, ids]
    );

    // Add timeline entries
    for (const event of result.rows) {
      await this.addTimelineEntry(event.id, 'STATUS_CHANGED', `Statut changé vers ${status} (action groupée)`, userId);
    }

    return result.rows;
  }

  async bulkAssign(ids: string[], assignedToId: string, userId: string) {
    const result = await query(
      `UPDATE health_events SET assigned_to_id = $1, updated_at = NOW() WHERE id = ANY($2::uuid[]) RETURNING *`,
      [assignedToId, ids]
    );

    for (const event of result.rows) {
      await this.addTimelineEntry(event.id, 'ASSIGNED', 'Événement assigné (action groupée)', userId);
    }

    return result.rows;
  }

  async bulkDelete(ids: string[]) {
    for (const id of ids) {
      await this.delete(id);
    }
  }

  // Get statistics
  async getStats(filters?: { dateFrom?: string; dateTo?: string; organizationalUnitId?: string }) {
    let whereClause = '1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters?.dateFrom) {
      whereClause += ` AND reported_at >= $${paramIndex++}`;
      params.push(filters.dateFrom);
    }
    if (filters?.dateTo) {
      whereClause += ` AND reported_at <= $${paramIndex++}`;
      params.push(filters.dateTo);
    }
    if (filters?.organizationalUnitId) {
      whereClause += ` AND organizational_unit_id = $${paramIndex++}`;
      params.push(filters.organizationalUnitId);
    }

    // Get total and by status
    const statusResult = await query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'REPORTED') as reported,
        COUNT(*) FILTER (WHERE status = 'INVESTIGATING') as investigating,
        COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed,
        COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved,
        COUNT(*) FILTER (WHERE status = 'CLOSED') as closed
       FROM health_events WHERE ${whereClause}`,
      params
    );

    // Get by severity
    const severityResult = await query(
      `SELECT
        COUNT(*) FILTER (WHERE severity = 'LOW') as low,
        COUNT(*) FILTER (WHERE severity = 'MEDIUM') as medium,
        COUNT(*) FILTER (WHERE severity = 'HIGH') as high,
        COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical
       FROM health_events WHERE ${whereClause}`,
      params
    );

    // Get by category
    const categoryResult = await query(
      `SELECT ec.id as "categoryId", ec.name, ec.color, COUNT(e.id) as count
       FROM event_categories ec
       LEFT JOIN health_events e ON e.category_id = ec.id AND ${whereClause.replace(/\$/g, (match) => '$' + (parseInt(match.slice(1)) + 1))}
       GROUP BY ec.id, ec.name, ec.color
       HAVING COUNT(e.id) > 0
       ORDER BY count DESC`,
      params
    );

    // Get recent trend (last 30 days)
    const trendResult = await query(
      `SELECT DATE(reported_at) as date, COUNT(*) as count
       FROM health_events
       WHERE reported_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(reported_at)
       ORDER BY date`
    );

    return {
      total: parseInt(statusResult.rows[0].total, 10),
      byStatus: {
        REPORTED: parseInt(statusResult.rows[0].reported, 10),
        INVESTIGATING: parseInt(statusResult.rows[0].investigating, 10),
        CONFIRMED: parseInt(statusResult.rows[0].confirmed, 10),
        RESOLVED: parseInt(statusResult.rows[0].resolved, 10),
        CLOSED: parseInt(statusResult.rows[0].closed, 10),
      },
      bySeverity: {
        LOW: parseInt(severityResult.rows[0].low, 10),
        MEDIUM: parseInt(severityResult.rows[0].medium, 10),
        HIGH: parseInt(severityResult.rows[0].high, 10),
        CRITICAL: parseInt(severityResult.rows[0].critical, 10),
      },
      byCategory: categoryResult.rows.map((r) => ({
        categoryId: r.categoryId,
        category: { id: r.categoryId, name: r.name, color: r.color },
        count: parseInt(r.count, 10),
      })),
      recentTrend: trendResult.rows.map((r) => ({
        date: r.date,
        count: parseInt(r.count, 10),
      })),
    };
  }

  // ===========================================
  // Comments
  // ===========================================

  async getComments(eventId: string) {
    const result = await query(
      `SELECT c.id, c.event_id as "eventId", c.user_id as "userId", c.content,
              c.created_at as "createdAt", c.updated_at as "updatedAt",
              json_build_object('id', u.id, 'firstName', u.first_name, 'lastName', u.last_name) as user
       FROM event_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.event_id = $1
       ORDER BY c.created_at DESC`,
      [eventId]
    );
    return result.rows;
  }

  async addComment(eventId: string, data: CreateCommentDto) {
    const result = await query(
      `INSERT INTO event_comments (event_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
      [eventId, data.userId, data.content]
    );

    await this.addTimelineEntry(eventId, 'COMMENT_ADDED', 'Commentaire ajouté', data.userId);

    logger.info(`Comment added to event ${eventId}`);
    return this.getComments(eventId).then((comments) => comments.find((c) => c.id === result.rows[0].id));
  }

  async updateComment(eventId: string, commentId: string, content: string) {
    const result = await query(
      `UPDATE event_comments SET content = $1, updated_at = NOW() WHERE id = $2 AND event_id = $3 RETURNING *`,
      [content, commentId, eventId]
    );

    if (result.rows.length === 0) throw new Error('COMMENT_NOT_FOUND');
    return result.rows[0];
  }

  async deleteComment(eventId: string, commentId: string) {
    const result = await query(
      `DELETE FROM event_comments WHERE id = $1 AND event_id = $2 RETURNING id`,
      [commentId, eventId]
    );
    if (result.rows.length === 0) throw new Error('COMMENT_NOT_FOUND');
  }

  // ===========================================
  // Attachments
  // ===========================================

  async getAttachments(eventId: string) {
    const result = await query(
      `SELECT a.id, a.event_id as "eventId", a.file_name as "fileName",
              a.original_name as "originalName", a.file_size as "fileSize",
              a.mime_type as "mimeType", a.document_type_id as "documentTypeId",
              a.uploaded_by_id as "uploadedById", a.url, a.thumbnail_url as "thumbnailUrl",
              a.created_at as "createdAt",
              json_build_object('id', u.id, 'firstName', u.first_name, 'lastName', u.last_name) as "uploadedBy"
       FROM event_attachments a
       LEFT JOIN users u ON a.uploaded_by_id = u.id
       WHERE a.event_id = $1
       ORDER BY a.created_at DESC`,
      [eventId]
    );
    return result.rows;
  }

  async addAttachment(eventId: string, data: {
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    url: string;
    thumbnailUrl?: string;
    documentTypeId?: string;
    uploadedById: string;
  }) {
    const result = await query(
      `INSERT INTO event_attachments (event_id, file_name, original_name, file_size, mime_type, url, thumbnail_url, document_type_id, uploaded_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [eventId, data.fileName, data.originalName, data.fileSize, data.mimeType, data.url, data.thumbnailUrl || null, data.documentTypeId || null, data.uploadedById]
    );

    await this.addTimelineEntry(eventId, 'ATTACHMENT_ADDED', `Fichier ajouté: ${data.originalName}`, data.uploadedById);

    logger.info(`Attachment added to event ${eventId}: ${data.originalName}`);
    return result.rows[0];
  }

  async deleteAttachment(eventId: string, attachmentId: string) {
    const result = await query(
      `DELETE FROM event_attachments WHERE id = $1 AND event_id = $2 RETURNING *`,
      [attachmentId, eventId]
    );
    if (result.rows.length === 0) throw new Error('ATTACHMENT_NOT_FOUND');

    // TODO: Delete actual file from storage

    logger.info(`Attachment deleted: ${attachmentId}`);
  }

  // ===========================================
  // Tasks
  // ===========================================

  async getTasks(eventId: string) {
    const result = await query(
      `SELECT t.id, t.event_id as "eventId", t.title, t.description, t.status, t.priority,
              t.assigned_to_id as "assignedToId", t.due_date as "dueDate",
              t.completed_at as "completedAt", t.created_by_id as "createdById",
              t.created_at as "createdAt", t.updated_at as "updatedAt",
              CASE WHEN at.id IS NOT NULL THEN json_build_object('id', at.id, 'firstName', at.first_name, 'lastName', at.last_name) ELSE NULL END as "assignedTo",
              json_build_object('id', cb.id, 'firstName', cb.first_name, 'lastName', cb.last_name) as "createdBy"
       FROM event_tasks t
       LEFT JOIN users at ON t.assigned_to_id = at.id
       LEFT JOIN users cb ON t.created_by_id = cb.id
       WHERE t.event_id = $1
       ORDER BY t.created_at DESC`,
      [eventId]
    );
    return result.rows;
  }

  async addTask(eventId: string, data: CreateTaskDto) {
    const result = await query(
      `INSERT INTO event_tasks (event_id, title, description, priority, assigned_to_id, due_date, created_by_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING') RETURNING *`,
      [eventId, data.title, data.description || null, data.priority || 'MEDIUM', data.assignedToId || null, data.dueDate || null, data.createdById]
    );

    await this.addTimelineEntry(eventId, 'TASK_ADDED', `Tâche ajoutée: ${data.title}`, data.createdById);

    logger.info(`Task added to event ${eventId}: ${data.title}`);
    return this.getTasks(eventId).then((tasks) => tasks.find((t) => t.id === result.rows[0].id));
  }

  async updateTask(eventId: string, taskId: string, data: UpdateTaskDto) {
    const fieldMappings: Record<string, string> = {
      title: 'title',
      description: 'description',
      status: 'status',
      priority: 'priority',
      assignedToId: 'assigned_to_id',
      dueDate: 'due_date',
    };

    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && fieldMappings[key]) {
        fields.push(`${fieldMappings[key]} = $${paramCount++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) throw new Error('NO_FIELDS_TO_UPDATE');

    // Add completed_at if status is COMPLETED
    if (data.status === 'COMPLETED') {
      fields.push(`completed_at = NOW()`);
    }

    fields.push('updated_at = NOW()');
    values.push(taskId, eventId);

    const result = await query(
      `UPDATE event_tasks SET ${fields.join(', ')} WHERE id = $${paramCount++} AND event_id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) throw new Error('TASK_NOT_FOUND');

    logger.info(`Task updated: ${taskId}`);
    return this.getTasks(eventId).then((tasks) => tasks.find((t) => t.id === taskId));
  }

  async changeTaskStatus(eventId: string, taskId: string, status: string, userId: string) {
    const completedAt = status === 'COMPLETED' ? 'NOW()' : 'NULL';

    const result = await query(
      `UPDATE event_tasks SET status = $1, completed_at = ${completedAt}, updated_at = NOW()
       WHERE id = $2 AND event_id = $3 RETURNING *`,
      [status, taskId, eventId]
    );

    if (result.rows.length === 0) throw new Error('TASK_NOT_FOUND');

    if (status === 'COMPLETED') {
      await this.addTimelineEntry(eventId, 'TASK_COMPLETED', `Tâche terminée: ${result.rows[0].title}`, userId);
    }

    return this.getTasks(eventId).then((tasks) => tasks.find((t) => t.id === taskId));
  }

  async deleteTask(eventId: string, taskId: string) {
    const result = await query(
      `DELETE FROM event_tasks WHERE id = $1 AND event_id = $2 RETURNING id`,
      [taskId, eventId]
    );
    if (result.rows.length === 0) throw new Error('TASK_NOT_FOUND');
  }

  // ===========================================
  // Timeline
  // ===========================================

  async getTimeline(eventId: string) {
    const result = await query(
      `SELECT t.id, t.event_id as "eventId", t.action, t.description,
              t.user_id as "userId", t.metadata, t.created_at as "createdAt",
              json_build_object('id', u.id, 'firstName', u.first_name, 'lastName', u.last_name) as user
       FROM event_timeline t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.event_id = $1
       ORDER BY t.created_at DESC`,
      [eventId]
    );
    return result.rows;
  }

  private async addTimelineEntry(eventId: string, action: string, description: string, userId: string, metadata?: Record<string, unknown>) {
    await query(
      `INSERT INTO event_timeline (event_id, action, description, user_id, metadata) VALUES ($1, $2, $3, $4, $5)`,
      [eventId, action, description, userId, metadata ? JSON.stringify(metadata) : null]
    );
  }
}

export default new EventsService();

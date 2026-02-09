import { query } from '../utils/database';
import logger from '../utils/logger';

// ===========================================
// Types
// ===========================================

interface CreateProcedureDto {
  code: string;
  name: string;
  description?: string;
  type: 'STANDARD' | 'EMERGENCY' | 'ADMINISTRATIVE' | 'CLINICAL' | 'SAFETY';
  groupId?: string;
  categoryId?: string;
  triggerType: 'MANUAL' | 'EVENT_CREATED' | 'EVENT_STATUS_CHANGE' | 'SCHEDULED' | 'CONDITION_BASED';
  triggerConfig?: Record<string, unknown>;
  createdById: string;
  steps?: CreateStepDto[];
}

interface UpdateProcedureDto {
  name?: string;
  description?: string;
  type?: 'STANDARD' | 'EMERGENCY' | 'ADMINISTRATIVE' | 'CLINICAL' | 'SAFETY';
  groupId?: string;
  categoryId?: string;
  triggerType?: 'MANUAL' | 'EVENT_CREATED' | 'EVENT_STATUS_CHANGE' | 'SCHEDULED' | 'CONDITION_BASED';
  triggerConfig?: Record<string, unknown>;
  isActive?: boolean;
}

interface StepOperation {
  name: string;
  description?: string;
  formId?: string;
  sortOrder?: number;
}

interface CreateStepDto {
  name: string;
  description?: string;
  stepNumber: number;
  durationHours?: number;
  isOptional?: boolean;
  assigneeType: 'USER' | 'ROLE' | 'DEPARTMENT' | 'AUTO';
  assigneeId?: string;
  formId?: string;
  requiredDocumentIds?: string[];
  externalStepId?: string;
  operations?: StepOperation[];
}

interface UpdateStepDto extends Partial<CreateStepDto> {}

interface ProcedureFilters {
  search?: string;
  type?: string | string[];
  categoryId?: string | string[];
  groupId?: string;
  triggerType?: string;
  isActive?: boolean;
}

interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ExecutionFilters {
  procedureId?: string;
  eventId?: string;
  status?: string | string[];
  startedById?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ===========================================
// Procedures Service
// ===========================================

export class ProceduresService {
  // Generate unique procedure code
  private async generateProcedureCode(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await query(
      `SELECT COUNT(*) + 1 as next_num FROM procedures WHERE EXTRACT(YEAR FROM created_at) = $1`,
      [year]
    );
    const nextNum = result.rows[0].next_num.toString().padStart(4, '0');
    return `PROC-${year}-${nextNum}`;
  }

  // Get all procedures with pagination and filters
  async findAll(filters: ProcedureFilters = {}, pagination: PaginationParams = {}) {
    const { page = 1, pageSize = 10, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * pageSize;
    const params: unknown[] = [];
    let paramIndex = 1;

    const conditions: string[] = ['1=1'];

    if (filters.search) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.code ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.type) {
      const types = Array.isArray(filters.type) ? filters.type : filters.type.split(',');
      conditions.push(`p.type = ANY($${paramIndex}::text[])`);
      params.push(types);
      paramIndex++;
    }

    if (filters.categoryId) {
      const categories = Array.isArray(filters.categoryId) ? filters.categoryId : filters.categoryId.split(',');
      conditions.push(`p.category_id = ANY($${paramIndex}::uuid[])`);
      params.push(categories);
      paramIndex++;
    }

    if (filters.groupId) {
      conditions.push(`p.group_id = $${paramIndex}`);
      params.push(filters.groupId);
      paramIndex++;
    }

    if (filters.triggerType) {
      conditions.push(`p.trigger_type = $${paramIndex}`);
      params.push(filters.triggerType);
      paramIndex++;
    }

    if (filters.isActive !== undefined) {
      conditions.push(`p.is_active = $${paramIndex}`);
      params.push(filters.isActive);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const allowedSortFields = ['created_at', 'updated_at', 'name', 'type'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const queryText = `
      SELECT
        p.id, p.code, p.name, p.description, p.type,
        p.trigger_type as "triggerType",
        p.trigger_config as "triggerConfig",
        p.group_id as "groupId",
        p.category_id as "categoryId",
        p.is_active as "isActive",
        p.created_by_id as "createdById",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        CASE WHEN pg.id IS NOT NULL THEN json_build_object(
          'id', pg.id, 'name', pg.name, 'description', pg.description, 'color', pg.color, 'icon', pg.icon
        ) ELSE NULL END as "group",
        CASE WHEN ec.id IS NOT NULL THEN json_build_object(
          'id', ec.id, 'code', ec.code, 'name', ec.name, 'color', ec.color, 'icon', ec.icon
        ) ELSE NULL END as category,
        (SELECT COUNT(*) FROM procedure_steps WHERE procedure_id = p.id) as "stepsCount"
      FROM procedures p
      LEFT JOIN procedure_groups pg ON p.group_id = pg.id
      LEFT JOIN event_categories ec ON p.category_id = ec.id
      WHERE ${whereClause}
      ORDER BY p.${safeSortBy} ${safeSortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    params.push(pageSize, offset);

    const result = await query(queryText, params);

    // Count total
    const countParams = params.slice(0, -2);
    const countQuery = `
      SELECT COUNT(*) FROM procedures p
      LEFT JOIN procedure_groups pg ON p.group_id = pg.id
      LEFT JOIN event_categories ec ON p.category_id = ec.id
      WHERE ${whereClause}
    `;
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    return {
      data: result.rows,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  // Get procedure by ID with steps
  async findById(id: string) {
    const result = await query(
      `
      SELECT
        p.id, p.code, p.name, p.description, p.type,
        p.trigger_type as "triggerType",
        p.trigger_config as "triggerConfig",
        p.group_id as "groupId",
        p.category_id as "categoryId",
        p.is_active as "isActive",
        p.created_by_id as "createdById",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        CASE WHEN pg.id IS NOT NULL THEN json_build_object(
          'id', pg.id, 'name', pg.name, 'description', pg.description, 'color', pg.color, 'icon', pg.icon
        ) ELSE NULL END as "group",
        CASE WHEN ec.id IS NOT NULL THEN json_build_object(
          'id', ec.id, 'code', ec.code, 'name', ec.name, 'color', ec.color, 'icon', ec.icon
        ) ELSE NULL END as category,
        CASE WHEN u.id IS NOT NULL THEN json_build_object(
          'id', u.id, 'firstName', u.first_name, 'lastName', u.last_name, 'email', u.email
        ) ELSE NULL END as "createdBy"
      FROM procedures p
      LEFT JOIN procedure_groups pg ON p.group_id = pg.id
      LEFT JOIN event_categories ec ON p.category_id = ec.id
      LEFT JOIN users u ON p.created_by_id = u.id
      WHERE p.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) throw new Error('PROCEDURE_NOT_FOUND');

    // Get steps
    const stepsResult = await query(
      `
      SELECT
        id, name, description,
        step_number as "stepNumber",
        duration_hours as "durationHours",
        is_optional as "isOptional",
        assignee_type as "assigneeType",
        assignee_id as "assigneeId",
        form_id as "formId",
        required_document_ids as "requiredDocumentIds",
        external_step_id as "externalStepId",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM procedure_steps
      WHERE procedure_id = $1
      ORDER BY step_number ASC
      `,
      [id]
    );

    return { ...result.rows[0], steps: stepsResult.rows };
  }

  // Create procedure
  async create(data: CreateProcedureDto) {
    const code = data.code || await this.generateProcedureCode();

    const result = await query(
      `INSERT INTO procedures (
        code, name, description, type, group_id, category_id,
        trigger_type, trigger_config, created_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        code, data.name, data.description || null, data.type,
        data.groupId || null, data.categoryId || null,
        data.triggerType, JSON.stringify(data.triggerConfig || {}),
        data.createdById
      ]
    );

    const procedure = result.rows[0];

    // Create steps if provided
    if (data.steps && data.steps.length > 0) {
      for (const step of data.steps) {
        await this.createStep(procedure.id, step);
      }
    }

    logger.info(`Procédure créée: ${procedure.id}`);
    return this.findById(procedure.id);
  }

  // Update procedure
  async update(id: string, data: UpdateProcedureDto) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.name !== undefined) { fields.push(`name = $${paramCount++}`); values.push(data.name); }
    if (data.description !== undefined) { fields.push(`description = $${paramCount++}`); values.push(data.description); }
    if (data.type !== undefined) { fields.push(`type = $${paramCount++}`); values.push(data.type); }
    if (data.groupId !== undefined) { fields.push(`group_id = $${paramCount++}`); values.push(data.groupId); }
    if (data.categoryId !== undefined) { fields.push(`category_id = $${paramCount++}`); values.push(data.categoryId); }
    if (data.triggerType !== undefined) { fields.push(`trigger_type = $${paramCount++}`); values.push(data.triggerType); }
    if (data.triggerConfig !== undefined) { fields.push(`trigger_config = $${paramCount++}`); values.push(JSON.stringify(data.triggerConfig)); }
    if (data.isActive !== undefined) { fields.push(`is_active = $${paramCount++}`); values.push(data.isActive); }

    if (fields.length === 0) throw new Error('NO_FIELDS_TO_UPDATE');

    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await query(
      `UPDATE procedures SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id`,
      values
    );

    if (result.rows.length === 0) throw new Error('PROCEDURE_NOT_FOUND');

    logger.info(`Procédure mise à jour: ${id}`);
    return this.findById(id);
  }

  // Delete procedure (soft delete)
  async delete(id: string) {
    const result = await query(
      'UPDATE procedures SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) throw new Error('PROCEDURE_NOT_FOUND');
    logger.info(`Procédure supprimée: ${id}`);
    return { id };
  }

  // Restore procedure
  async restore(id: string) {
    const result = await query(
      'UPDATE procedures SET is_active = true, updated_at = NOW() WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) throw new Error('PROCEDURE_NOT_FOUND');
    logger.info(`Procédure restaurée: ${id}`);
    return { id };
  }

  // Delete procedure permanently (hard delete)
  async deletePermanent(id: string) {
    // First delete steps (cascade should handle this, but being explicit)
    await query('DELETE FROM procedure_steps WHERE procedure_id = $1', [id]);

    // Then delete the procedure
    const result = await query('DELETE FROM procedures WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) throw new Error('PROCEDURE_NOT_FOUND');
    logger.info(`Procédure supprimée définitivement: ${id}`);
    return { id };
  }

  // Duplicate procedure
  async duplicate(id: string, newName: string, userId: string) {
    const original = await this.findById(id);
    const code = await this.generateProcedureCode();

    const result = await query(
      `INSERT INTO procedures (
        code, name, description, type, group_id, category_id,
        trigger_type, trigger_config, created_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        code, newName, original.description, original.type,
        original.groupId, original.categoryId,
        original.triggerType, JSON.stringify(original.triggerConfig || {}),
        userId
      ]
    );

    const newId = result.rows[0].id;

    // Duplicate steps
    for (const step of original.steps || []) {
      await this.createStep(newId, {
        name: step.name,
        description: step.description,
        stepNumber: step.stepNumber,
        durationHours: step.durationHours,
        isOptional: step.isOptional,
        assigneeType: step.assigneeType,
        assigneeId: step.assigneeId,
        formId: step.formId,
        requiredDocumentIds: step.requiredDocumentIds,
        externalStepId: step.externalStepId,
      });
    }

    logger.info(`Procédure dupliquée: ${id} -> ${newId}`);
    return this.findById(newId);
  }

  // Get statistics
  async getStats() {
    const [totalResult, byTypeResult, byStatusResult, executionResult, topResult] = await Promise.all([
      query('SELECT COUNT(*) FROM procedures'),
      query(`SELECT type, COUNT(*) as count FROM procedures GROUP BY type`),
      query(`SELECT is_active, COUNT(*) as count FROM procedures GROUP BY is_active`),
      query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
          COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress,
          AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600)
            FILTER (WHERE status = 'COMPLETED') as avg_hours
        FROM procedure_executions
      `),
      query(`
        SELECT
          p.id as "procedureId",
          json_build_object('id', p.id, 'name', p.name, 'code', p.code, 'type', p.type) as procedure,
          COUNT(pe.id) as "executionCount",
          COALESCE(
            COUNT(*) FILTER (WHERE pe.status = 'COMPLETED')::float / NULLIF(COUNT(pe.id), 0),
            0
          ) as "completionRate"
        FROM procedures p
        LEFT JOIN procedure_executions pe ON p.id = pe.procedure_id
        GROUP BY p.id
        ORDER BY COUNT(pe.id) DESC
        LIMIT 5
      `)
    ]);

    const byType: Record<string, number> = {};
    byTypeResult.rows.forEach((row: { type: string; count: string }) => {
      byType[row.type] = parseInt(row.count, 10);
    });

    let active = 0, inactive = 0;
    byStatusResult.rows.forEach((row: { is_active: boolean; count: string }) => {
      if (row.is_active) active = parseInt(row.count, 10);
      else inactive = parseInt(row.count, 10);
    });

    const execStats = executionResult.rows[0];

    return {
      total: parseInt(totalResult.rows[0].count, 10),
      byType,
      byStatus: { active, inactive },
      executionStats: {
        total: parseInt(execStats.total || '0', 10),
        completed: parseInt(execStats.completed || '0', 10),
        inProgress: parseInt(execStats.in_progress || '0', 10),
        averageCompletionTimeHours: parseFloat(execStats.avg_hours || '0'),
      },
      topProcedures: topResult.rows.map(row => ({
        procedureId: row.procedureId,
        procedure: row.procedure,
        executionCount: parseInt(row.executionCount, 10),
        completionRate: parseFloat(row.completionRate) || 0,
      })),
    };
  }

  // Validate procedure workflow
  async validate(id: string) {
    const procedure = await this.findById(id);
    const errors: string[] = [];

    if (!procedure.steps || procedure.steps.length === 0) {
      errors.push('La procédure doit avoir au moins une étape');
    }

    // Check step numbers are sequential
    const stepNumbers = (procedure.steps || []).map((s: { stepNumber: number }) => s.stepNumber).sort((a: number, b: number) => a - b);
    for (let i = 0; i < stepNumbers.length; i++) {
      if (stepNumbers[i] !== i + 1) {
        errors.push(`Les numéros d'étapes ne sont pas séquentiels (manque l'étape ${i + 1})`);
        break;
      }
    }

    // Check required fields
    if (!procedure.name) errors.push('Le nom est requis');
    if (!procedure.type) errors.push('Le type est requis');
    if (!procedure.triggerType) errors.push('Le type de déclencheur est requis');

    return { valid: errors.length === 0, errors };
  }

  // Export as template
  async exportAsTemplate(id: string) {
    const procedure = await this.findById(id);

    return {
      id: `template-${id}`,
      name: procedure.name,
      description: procedure.description,
      type: procedure.type,
      steps: (procedure.steps || []).map((step: CreateStepDto) => ({
        name: step.name,
        description: step.description,
        stepNumber: step.stepNumber,
        durationHours: step.durationHours,
        isOptional: step.isOptional,
        assigneeType: step.assigneeType,
        assigneeId: step.assigneeId,
        formId: step.formId,
        requiredDocumentIds: step.requiredDocumentIds,
      })),
      isPublic: false,
      createdById: procedure.createdById,
      createdAt: new Date().toISOString(),
    };
  }

  // Import from template
  async importFromTemplate(template: { name: string; description?: string; type: string; steps: CreateStepDto[] }, userId: string) {
    return this.create({
      code: await this.generateProcedureCode(),
      name: template.name,
      description: template.description,
      type: template.type as CreateProcedureDto['type'],
      triggerType: 'MANUAL',
      createdById: userId,
      steps: template.steps,
    });
  }

  // ===========================================
  // Steps Methods
  // ===========================================

  async getSteps(procedureId: string) {
    const result = await query(
      `
      SELECT
        id, name, description,
        step_number as "stepNumber",
        duration_hours as "durationHours",
        is_optional as "isOptional",
        assignee_type as "assigneeType",
        assignee_id as "assigneeId",
        form_id as "formId",
        required_document_ids as "requiredDocumentIds",
        external_step_id as "externalStepId",
        operations,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM procedure_steps
      WHERE procedure_id = $1
      ORDER BY step_number ASC
      `,
      [procedureId]
    );
    return result.rows;
  }

  async getStep(procedureId: string, stepId: string) {
    const result = await query(
      `
      SELECT
        id, procedure_id as "procedureId", name, description,
        step_number as "stepNumber",
        duration_hours as "durationHours",
        is_optional as "isOptional",
        assignee_type as "assigneeType",
        assignee_id as "assigneeId",
        form_id as "formId",
        required_document_ids as "requiredDocumentIds",
        external_step_id as "externalStepId",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM procedure_steps
      WHERE procedure_id = $1 AND id = $2
      `,
      [procedureId, stepId]
    );
    if (result.rows.length === 0) throw new Error('STEP_NOT_FOUND');
    return result.rows[0];
  }

  async createStep(procedureId: string, data: CreateStepDto) {
    const result = await query(
      `INSERT INTO procedure_steps (
        procedure_id, name, description, step_number, step_order, step_type, duration_hours,
        is_optional, assignee_type, assignee_id, form_id,
        required_document_ids, external_step_id, operations
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        procedureId, data.name, data.description || null, data.stepNumber,
        data.stepNumber, 'TASK', // step_order = stepNumber, step_type = TASK by default
        data.durationHours || null, data.isOptional || false,
        data.assigneeType || 'AUTO', data.assigneeId || null, data.formId || null,
        data.requiredDocumentIds || null, data.externalStepId || null,
        JSON.stringify(data.operations || [])
      ]
    );
    return result.rows[0];
  }

  async updateStep(procedureId: string, stepId: string, data: UpdateStepDto) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.name !== undefined) { fields.push(`name = $${paramCount++}`); values.push(data.name); }
    if (data.description !== undefined) { fields.push(`description = $${paramCount++}`); values.push(data.description); }
    if (data.stepNumber !== undefined) { fields.push(`step_number = $${paramCount++}`); values.push(data.stepNumber); }
    if (data.durationHours !== undefined) { fields.push(`duration_hours = $${paramCount++}`); values.push(data.durationHours); }
    if (data.isOptional !== undefined) { fields.push(`is_optional = $${paramCount++}`); values.push(data.isOptional); }
    if (data.assigneeType !== undefined) { fields.push(`assignee_type = $${paramCount++}`); values.push(data.assigneeType); }
    if (data.assigneeId !== undefined) { fields.push(`assignee_id = $${paramCount++}`); values.push(data.assigneeId); }
    if (data.formId !== undefined) { fields.push(`form_id = $${paramCount++}`); values.push(data.formId); }
    if (data.requiredDocumentIds !== undefined) { fields.push(`required_document_ids = $${paramCount++}`); values.push(data.requiredDocumentIds); }
    if (data.externalStepId !== undefined) { fields.push(`external_step_id = $${paramCount++}`); values.push(data.externalStepId); }

    if (fields.length === 0) throw new Error('NO_FIELDS_TO_UPDATE');

    fields.push('updated_at = NOW()');
    values.push(procedureId, stepId);

    const result = await query(
      `UPDATE procedure_steps SET ${fields.join(', ')}
       WHERE procedure_id = $${paramCount++} AND id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) throw new Error('STEP_NOT_FOUND');
    return result.rows[0];
  }

  async deleteStep(procedureId: string, stepId: string) {
    const result = await query(
      'DELETE FROM procedure_steps WHERE procedure_id = $1 AND id = $2 RETURNING id',
      [procedureId, stepId]
    );
    if (result.rows.length === 0) throw new Error('STEP_NOT_FOUND');
    return { id: stepId };
  }

  async reorderSteps(procedureId: string, stepIds: string[]) {
    for (let i = 0; i < stepIds.length; i++) {
      await query(
        'UPDATE procedure_steps SET step_number = $1, updated_at = NOW() WHERE id = $2 AND procedure_id = $3',
        [i + 1, stepIds[i], procedureId]
      );
    }
    return this.getSteps(procedureId);
  }

  async bulkUpdateSteps(procedureId: string, steps: Array<{ id?: string } & CreateStepDto>) {
    // Delete existing steps
    await query('DELETE FROM procedure_steps WHERE procedure_id = $1', [procedureId]);

    // Insert new steps
    for (const step of steps) {
      await this.createStep(procedureId, step);
    }

    return this.getSteps(procedureId);
  }
}

// ===========================================
// Procedure Groups Service
// ===========================================

export class ProcedureGroupsService {
  async findAll(asTree = false) {
    const result = await query(
      `SELECT
        id, name, description, color, icon,
        parent_id as "parentId",
        created_at as "createdAt",
        updated_at as "updatedAt"
       FROM procedure_groups
       ORDER BY name ASC`
    );

    if (!asTree) return result.rows;

    // Build tree structure
    const groups = result.rows;
    const map = new Map();
    const roots: unknown[] = [];

    groups.forEach((g: { id: string }) => map.set(g.id, { ...g, children: [] }));
    groups.forEach((g: { id: string; parentId: string | null }) => {
      if (g.parentId && map.has(g.parentId)) {
        map.get(g.parentId).children.push(map.get(g.id));
      } else {
        roots.push(map.get(g.id));
      }
    });

    return roots;
  }

  async findById(id: string) {
    const result = await query(
      `SELECT
        id, name, description, color, icon,
        parent_id as "parentId",
        created_at as "createdAt",
        updated_at as "updatedAt"
       FROM procedure_groups WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) throw new Error('GROUP_NOT_FOUND');
    return result.rows[0];
  }

  async create(data: { name: string; description?: string; color?: string; icon?: string; parentId?: string }) {
    const result = await query(
      `INSERT INTO procedure_groups (name, description, color, icon, parent_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.name, data.description || null, data.color || '#3B82F6', data.icon || null, data.parentId || null]
    );
    logger.info(`Groupe créé: ${result.rows[0].id}`);
    return result.rows[0];
  }

  async update(id: string, data: { name?: string; description?: string; color?: string; icon?: string; parentId?: string }) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.name !== undefined) { fields.push(`name = $${paramCount++}`); values.push(data.name); }
    if (data.description !== undefined) { fields.push(`description = $${paramCount++}`); values.push(data.description); }
    if (data.color !== undefined) { fields.push(`color = $${paramCount++}`); values.push(data.color); }
    if (data.icon !== undefined) { fields.push(`icon = $${paramCount++}`); values.push(data.icon); }
    if (data.parentId !== undefined) { fields.push(`parent_id = $${paramCount++}`); values.push(data.parentId); }

    if (fields.length === 0) throw new Error('NO_FIELDS_TO_UPDATE');

    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await query(
      `UPDATE procedure_groups SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) throw new Error('GROUP_NOT_FOUND');
    return result.rows[0];
  }

  async delete(id: string) {
    const result = await query('DELETE FROM procedure_groups WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) throw new Error('GROUP_NOT_FOUND');
    logger.info(`Groupe supprimé: ${id}`);
    return { id };
  }
}

// ===========================================
// Procedure Executions Service
// ===========================================

export class ProcedureExecutionsService {
  async findAll(filters: ExecutionFilters = {}, pagination: PaginationParams = {}) {
    const { page = 1, pageSize = 10, sortBy = 'started_at', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * pageSize;
    const params: unknown[] = [];
    let paramIndex = 1;

    const conditions: string[] = ['1=1'];

    if (filters.procedureId) {
      conditions.push(`pe.procedure_id = $${paramIndex++}`);
      params.push(filters.procedureId);
    }

    if (filters.eventId) {
      conditions.push(`pe.event_id = $${paramIndex++}`);
      params.push(filters.eventId);
    }

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : filters.status.split(',');
      conditions.push(`pe.status = ANY($${paramIndex}::text[])`);
      params.push(statuses);
      paramIndex++;
    }

    if (filters.startedById) {
      conditions.push(`pe.started_by_id = $${paramIndex++}`);
      params.push(filters.startedById);
    }

    if (filters.dateFrom) {
      conditions.push(`pe.started_at >= $${paramIndex++}`);
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      conditions.push(`pe.started_at <= $${paramIndex++}`);
      params.push(filters.dateTo);
    }

    const whereClause = conditions.join(' AND ');

    const allowedSortFields = ['started_at', 'completed_at', 'status'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'started_at';
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const queryText = `
      SELECT
        pe.id, pe.procedure_id as "procedureId", pe.event_id as "eventId",
        pe.status, pe.current_step_number as "currentStepNumber",
        pe.started_by_id as "startedById",
        pe.started_at as "startedAt",
        pe.completed_at as "completedAt",
        pe.cancelled_at as "cancelledAt",
        pe.cancel_reason as "cancelReason",
        pe.created_at as "createdAt",
        pe.updated_at as "updatedAt",
        json_build_object('id', p.id, 'name', p.name, 'code', p.code, 'type', p.type) as procedure,
        CASE WHEN u.id IS NOT NULL THEN json_build_object(
          'id', u.id, 'firstName', u.first_name, 'lastName', u.last_name, 'email', u.email
        ) ELSE NULL END as "startedBy"
      FROM procedure_executions pe
      LEFT JOIN procedures p ON pe.procedure_id = p.id
      LEFT JOIN users u ON pe.started_by_id = u.id
      WHERE ${whereClause}
      ORDER BY pe.${safeSortBy} ${safeSortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    params.push(pageSize, offset);
    const result = await query(queryText, params);

    const countParams = params.slice(0, -2);
    const countQuery = `
      SELECT COUNT(*) FROM procedure_executions pe
      LEFT JOIN procedures p ON pe.procedure_id = p.id
      WHERE ${whereClause}
    `;
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    return {
      data: result.rows,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const result = await query(
      `
      SELECT
        pe.id, pe.procedure_id as "procedureId", pe.event_id as "eventId",
        pe.status, pe.current_step_number as "currentStepNumber",
        pe.started_by_id as "startedById",
        pe.started_at as "startedAt",
        pe.completed_at as "completedAt",
        pe.cancelled_at as "cancelledAt",
        pe.cancel_reason as "cancelReason",
        pe.created_at as "createdAt",
        pe.updated_at as "updatedAt",
        json_build_object('id', p.id, 'name', p.name, 'code', p.code, 'type', p.type) as procedure
      FROM procedure_executions pe
      LEFT JOIN procedures p ON pe.procedure_id = p.id
      WHERE pe.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) throw new Error('EXECUTION_NOT_FOUND');

    // Get step executions
    const stepsResult = await query(
      `
      SELECT
        se.id, se.execution_id as "executionId", se.step_id as "stepId",
        se.step_number as "stepNumber", se.status,
        se.assigned_to_id as "assignedToId",
        se.started_at as "startedAt",
        se.completed_at as "completedAt",
        se.completed_by_id as "completedById",
        se.notes,
        se.form_submission_id as "formSubmissionId",
        se.created_at as "createdAt",
        se.updated_at as "updatedAt",
        json_build_object('id', ps.id, 'name', ps.name, 'description', ps.description) as step
      FROM step_executions se
      LEFT JOIN procedure_steps ps ON se.step_id = ps.id
      WHERE se.execution_id = $1
      ORDER BY se.step_number ASC
      `,
      [id]
    );

    return { ...result.rows[0], stepExecutions: stepsResult.rows };
  }

  async findByEventId(eventId: string) {
    const result = await query(
      `
      SELECT
        pe.id, pe.procedure_id as "procedureId", pe.event_id as "eventId",
        pe.status, pe.current_step_number as "currentStepNumber",
        pe.started_at as "startedAt", pe.completed_at as "completedAt",
        json_build_object('id', p.id, 'name', p.name, 'code', p.code, 'type', p.type) as procedure
      FROM procedure_executions pe
      LEFT JOIN procedures p ON pe.procedure_id = p.id
      WHERE pe.event_id = $1
      ORDER BY pe.started_at DESC
      `,
      [eventId]
    );
    return result.rows;
  }

  async start(procedureId: string, eventId: string, userId: string) {
    // Get procedure with steps
    const proceduresService = new ProceduresService();
    const procedure = await proceduresService.findById(procedureId);

    // Create execution
    const result = await query(
      `INSERT INTO procedure_executions (
        procedure_id, event_id, status, current_step_number, started_by_id, started_at
      ) VALUES ($1, $2, 'IN_PROGRESS', 1, $3, NOW())
      RETURNING *`,
      [procedureId, eventId, userId]
    );

    const execution = result.rows[0];

    // Create step executions
    for (const step of procedure.steps || []) {
      await query(
        `INSERT INTO step_executions (
          execution_id, step_id, step_number, status
        ) VALUES ($1, $2, $3, $4)`,
        [
          execution.id, step.id, step.stepNumber,
          step.stepNumber === 1 ? 'IN_PROGRESS' : 'PENDING'
        ]
      );
    }

    // Log timeline
    await this.logTimeline(execution.id, userId, 'EXECUTION_STARTED', 'Exécution démarrée');

    logger.info(`Exécution démarrée: ${execution.id}`);
    return this.findById(execution.id);
  }

  async cancel(id: string, reason: string, userId: string) {
    const result = await query(
      `UPDATE procedure_executions
       SET status = 'CANCELLED', cancelled_at = NOW(), cancel_reason = $1, updated_at = NOW()
       WHERE id = $2 AND status IN ('PENDING', 'IN_PROGRESS')
       RETURNING *`,
      [reason, id]
    );

    if (result.rows.length === 0) throw new Error('EXECUTION_NOT_FOUND_OR_COMPLETED');

    await this.logTimeline(id, userId, 'EXECUTION_CANCELLED', `Exécution annulée: ${reason}`);

    logger.info(`Exécution annulée: ${id}`);
    return this.findById(id);
  }

  async advanceStep(id: string, notes: string | undefined, userId: string) {
    const execution = await this.findById(id);

    if (execution.status !== 'IN_PROGRESS') {
      throw new Error('EXECUTION_NOT_IN_PROGRESS');
    }

    const currentStepExecution = execution.stepExecutions?.find(
      (se: { stepNumber: number }) => se.stepNumber === execution.currentStepNumber
    );

    if (currentStepExecution) {
      // Complete current step
      await query(
        `UPDATE step_executions
         SET status = 'COMPLETED', completed_at = NOW(), completed_by_id = $1, notes = $2, updated_at = NOW()
         WHERE id = $3`,
        [userId, notes || null, currentStepExecution.id]
      );
    }

    const nextStepNumber = execution.currentStepNumber + 1;
    const nextStepExecution = execution.stepExecutions?.find(
      (se: { stepNumber: number }) => se.stepNumber === nextStepNumber
    );

    if (nextStepExecution) {
      // Start next step
      await query(
        `UPDATE step_executions SET status = 'IN_PROGRESS', started_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [nextStepExecution.id]
      );
      await query(
        `UPDATE procedure_executions SET current_step_number = $1, updated_at = NOW() WHERE id = $2`,
        [nextStepNumber, id]
      );

      await this.logTimeline(id, userId, 'STEP_ADVANCED', `Passage à l'étape ${nextStepNumber}`);
    } else {
      // No more steps - complete execution
      await query(
        `UPDATE procedure_executions SET status = 'COMPLETED', completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [id]
      );

      await this.logTimeline(id, userId, 'EXECUTION_COMPLETED', 'Exécution terminée');
    }

    return this.findById(id);
  }

  async completeStep(executionId: string, stepExecutionId: string, data: { notes?: string; formSubmissionId?: string }, userId: string) {
    const result = await query(
      `UPDATE step_executions
       SET status = 'COMPLETED', completed_at = NOW(), completed_by_id = $1, notes = $2, form_submission_id = $3, updated_at = NOW()
       WHERE id = $4 AND execution_id = $5
       RETURNING *`,
      [userId, data.notes || null, data.formSubmissionId || null, stepExecutionId, executionId]
    );

    if (result.rows.length === 0) throw new Error('STEP_EXECUTION_NOT_FOUND');

    await this.logTimeline(executionId, userId, 'STEP_COMPLETED', `Étape ${result.rows[0].step_number} terminée`);

    return result.rows[0];
  }

  async skipStep(executionId: string, stepExecutionId: string, reason: string, userId: string) {
    const result = await query(
      `UPDATE step_executions
       SET status = 'SKIPPED', completed_at = NOW(), notes = $1, updated_at = NOW()
       WHERE id = $2 AND execution_id = $3
       RETURNING *`,
      [reason, stepExecutionId, executionId]
    );

    if (result.rows.length === 0) throw new Error('STEP_EXECUTION_NOT_FOUND');

    await this.logTimeline(executionId, userId, 'STEP_SKIPPED', `Étape ${result.rows[0].step_number} sautée: ${reason}`);

    return result.rows[0];
  }

  async assignStep(executionId: string, stepExecutionId: string, assignedToId: string, userId: string) {
    const result = await query(
      `UPDATE step_executions SET assigned_to_id = $1, updated_at = NOW()
       WHERE id = $2 AND execution_id = $3
       RETURNING *`,
      [assignedToId, stepExecutionId, executionId]
    );

    if (result.rows.length === 0) throw new Error('STEP_EXECUTION_NOT_FOUND');

    await this.logTimeline(executionId, userId, 'STEP_ASSIGNED', `Étape ${result.rows[0].step_number} assignée`);

    return result.rows[0];
  }

  async getTimeline(executionId: string) {
    const result = await query(
      `
      SELECT
        t.id, t.action, t.description, t.user_id as "userId",
        t.created_at as "createdAt",
        CASE WHEN u.id IS NOT NULL THEN json_build_object(
          'id', u.id, 'firstName', u.first_name, 'lastName', u.last_name, 'email', u.email
        ) ELSE NULL END as user
      FROM procedure_execution_timeline t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.execution_id = $1
      ORDER BY t.created_at DESC
      `,
      [executionId]
    );
    return result.rows;
  }

  private async logTimeline(executionId: string, userId: string, action: string, description: string) {
    await query(
      `INSERT INTO procedure_execution_timeline (execution_id, user_id, action, description)
       VALUES ($1, $2, $3, $4)`,
      [executionId, userId, action, description]
    );
  }
}

// ===========================================
// Procedure Templates Service
// ===========================================

export class ProcedureTemplatesService {
  async findPublic() {
    const result = await query(
      `SELECT
        id, name, description, type, steps, is_public as "isPublic",
        created_by_id as "createdById", created_at as "createdAt"
       FROM procedure_templates
       WHERE is_public = true
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async findByUser(userId: string) {
    const result = await query(
      `SELECT
        id, name, description, type, steps, is_public as "isPublic",
        created_by_id as "createdById", created_at as "createdAt"
       FROM procedure_templates
       WHERE created_by_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async createFromProcedure(procedureId: string, isPublic: boolean, userId: string) {
    const proceduresService = new ProceduresService();
    const procedure = await proceduresService.findById(procedureId);

    const steps = (procedure.steps || []).map((step: CreateStepDto) => ({
      name: step.name,
      description: step.description,
      stepNumber: step.stepNumber,
      durationHours: step.durationHours,
      isOptional: step.isOptional,
      assigneeType: step.assigneeType,
      formId: step.formId,
    }));

    const result = await query(
      `INSERT INTO procedure_templates (name, description, type, steps, is_public, created_by_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [procedure.name, procedure.description, procedure.type, JSON.stringify(steps), isPublic, userId]
    );

    logger.info(`Template créé: ${result.rows[0].id}`);
    return result.rows[0];
  }

  async delete(id: string, userId: string) {
    const result = await query(
      'DELETE FROM procedure_templates WHERE id = $1 AND created_by_id = $2 RETURNING id',
      [id, userId]
    );
    if (result.rows.length === 0) throw new Error('TEMPLATE_NOT_FOUND');
    return { id };
  }
}

// Export instances
export const proceduresService = new ProceduresService();
export const procedureGroupsService = new ProcedureGroupsService();
export const procedureExecutionsService = new ProcedureExecutionsService();
export const procedureTemplatesService = new ProcedureTemplatesService();

export default proceduresService;

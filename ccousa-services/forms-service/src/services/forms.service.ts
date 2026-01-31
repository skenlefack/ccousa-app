import { query } from '../utils/database';
import logger from '../utils/logger';

// ===========================================
// Types
// ===========================================

interface CreateFormDto {
  code: string;
  name: string;
  description?: string;
  type?: string;
  languageCode?: string;
  layoutColumns?: number;
  createdById: string;
  sections?: CreateSectionDto[];
}

interface UpdateFormDto {
  name?: string;
  description?: string;
  type?: string;
  languageCode?: string;
  layoutColumns?: number;
  isPublished?: boolean;
  isActive?: boolean;
}

interface CreateSectionDto {
  title: string;
  description?: string;
  sortOrder: number;
  columns?: number;
  isCollapsible?: boolean;
  isCollapsedDefault?: boolean;
  fields?: CreateFieldDto[];
}

interface UpdateSectionDto extends Partial<CreateSectionDto> {}

interface CreateFieldDto {
  fieldTypeId: string;
  code: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  isRequired?: boolean;
  isReadonly?: boolean;
  isHidden?: boolean;
  validationRules?: object;
  options?: Array<{ value: string; label: string; sortOrder: number }>;
  conditionalLogic?: object[];
  sortOrder: number;
  columnSpan?: number;
}

interface UpdateFieldDto extends Partial<CreateFieldDto> {}

interface FormFilters {
  search?: string;
  type?: string | string[];
  languageCode?: string;
  isPublished?: boolean;
  isActive?: boolean;
}

interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface SubmissionFilters {
  formId?: string;
  eventId?: string;
  status?: string | string[];
  submittedById?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ===========================================
// Forms Service
// ===========================================

export class FormsService {
  // Generate unique form code
  private async generateFormCode(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await query(
      `SELECT COUNT(*) + 1 as next_num FROM forms WHERE EXTRACT(YEAR FROM created_at) = $1`,
      [year]
    );
    const nextNum = result.rows[0].next_num.toString().padStart(4, '0');
    return `FORM-${year}-${nextNum}`;
  }

  // Get all forms with pagination and filters
  async findAll(filters: FormFilters = {}, pagination: PaginationParams = {}) {
    const { page = 1, pageSize = 10, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * pageSize;
    const params: unknown[] = [];
    let paramIndex = 1;

    const conditions: string[] = ['1=1'];

    if (filters.search) {
      conditions.push(`(f.name ILIKE $${paramIndex} OR f.code ILIKE $${paramIndex} OR f.description ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.type) {
      const types = Array.isArray(filters.type) ? filters.type : filters.type.split(',');
      conditions.push(`f.type = ANY($${paramIndex}::text[])`);
      params.push(types);
      paramIndex++;
    }

    if (filters.languageCode) {
      conditions.push(`f.language_id = (SELECT id FROM languages WHERE code = $${paramIndex})`);
      params.push(filters.languageCode);
      paramIndex++;
    }

    if (filters.isPublished !== undefined) {
      conditions.push(`f.is_published = $${paramIndex}`);
      params.push(filters.isPublished);
      paramIndex++;
    }

    if (filters.isActive !== undefined) {
      conditions.push(`f.is_active = $${paramIndex}`);
      params.push(filters.isActive);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const allowedSortFields = ['created_at', 'updated_at', 'name', 'version'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const queryText = `
      SELECT
        f.id, f.code, f.title as name, f.description, f.type,
        f.layout_columns as "layoutColumns",
        f.is_active as "isActive",
        f.version,
        f.created_at as "createdAt",
        f.updated_at as "updatedAt",
        CASE WHEN f.version > 0 THEN true ELSE false END as "isPublished",
        (SELECT COUNT(*) FROM form_sections WHERE form_id = f.id) as "sectionsCount",
        (SELECT COUNT(*) FROM form_fields ff
         JOIN form_sections fs ON ff.section_id = fs.id
         WHERE fs.form_id = f.id) as "fieldsCount"
      FROM forms f
      WHERE ${whereClause}
      ORDER BY f.${safeSortBy} ${safeSortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    params.push(pageSize, offset);
    const result = await query(queryText, params);

    const countParams = params.slice(0, -2);
    const countQuery = `SELECT COUNT(*) FROM forms f WHERE ${whereClause}`;
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    return {
      items: result.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasNext: page < Math.ceil(total / pageSize),
      hasPrevious: page > 1,
    };
  }

  // Get form by ID with sections and fields
  async findById(id: string) {
    const result = await query(
      `
      SELECT
        f.id, f.code, f.title as name, f.description, f.type,
        f.layout_columns as "layoutColumns",
        f.is_active as "isActive",
        f.version,
        f.created_at as "createdAt",
        f.updated_at as "updatedAt",
        CASE WHEN f.version > 0 THEN true ELSE false END as "isPublished"
      FROM forms f
      WHERE f.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) throw new Error('FORM_NOT_FOUND');

    const form = result.rows[0];

    // Get sections with fields
    const sectionsResult = await query(
      `
      SELECT
        fs.id, fs.form_id as "formId", fs.title, fs.description,
        fs.section_order as "sortOrder",
        fs.columns_layout::int as columns,
        fs.is_collapsible as "isCollapsible",
        fs.is_collapsed_default as "isCollapsedDefault",
        fs.created_at as "createdAt"
      FROM form_sections fs
      WHERE fs.form_id = $1
      ORDER BY fs.section_order ASC
      `,
      [id]
    );

    const sections = [];
    for (const section of sectionsResult.rows) {
      const fieldsResult = await query(
        `
        SELECT
          ff.id, ff.section_id as "sectionId",
          ff.field_type_id as "fieldTypeId",
          ff.name as code, ff.label, ff.placeholder, ff.help_text as "helpText",
          ff.default_value as "defaultValue",
          ff.is_required as "isRequired",
          ff.is_readonly as "isReadonly",
          ff.is_hidden as "isHidden",
          ff.validation_rules as "validationRules",
          ff.options,
          ff.conditional_logic as "conditionalLogic",
          ff.field_order as "sortOrder",
          ff.column_span as "columnSpan",
          ff.created_at as "createdAt",
          ff.updated_at as "updatedAt",
          json_build_object(
            'id', ft.id,
            'code', ft.code,
            'name', ft.name,
            'category', ft.category
          ) as "fieldType"
        FROM form_fields ff
        LEFT JOIN field_types ft ON ff.field_type_id = ft.id
        WHERE ff.section_id = $1
        ORDER BY ff.field_order ASC
        `,
        [section.id]
      );
      section.fields = fieldsResult.rows;
      sections.push(section);
    }

    return { ...form, sections };
  }

  // Get form by code
  async findByCode(code: string) {
    const result = await query('SELECT id FROM forms WHERE code = $1', [code]);
    if (result.rows.length === 0) throw new Error('FORM_NOT_FOUND');
    return this.findById(result.rows[0].id);
  }

  // Create form
  async create(data: CreateFormDto) {
    const code = data.code || await this.generateFormCode();

    const result = await query(
      `INSERT INTO forms (code, title, description, type, layout_columns, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [code, data.name, data.description || null, data.type || 'PARAMETER', data.layoutColumns || 2, data.createdById]
    );

    const formId = result.rows[0].id;

    // Create sections if provided
    if (data.sections && data.sections.length > 0) {
      for (const section of data.sections) {
        await this.createSection(formId, section);
      }
    }

    logger.info(`Formulaire créé: ${formId}`);
    return this.findById(formId);
  }

  // Update form
  async update(id: string, data: UpdateFormDto) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.name !== undefined) { fields.push(`title = $${paramCount++}`); values.push(data.name); }
    if (data.description !== undefined) { fields.push(`description = $${paramCount++}`); values.push(data.description); }
    if (data.type !== undefined) { fields.push(`type = $${paramCount++}`); values.push(data.type); }
    if (data.layoutColumns !== undefined) { fields.push(`layout_columns = $${paramCount++}`); values.push(data.layoutColumns); }
    if (data.isActive !== undefined) { fields.push(`is_active = $${paramCount++}`); values.push(data.isActive); }

    if (fields.length === 0) throw new Error('NO_FIELDS_TO_UPDATE');

    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await query(
      `UPDATE forms SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id`,
      values
    );

    if (result.rows.length === 0) throw new Error('FORM_NOT_FOUND');

    logger.info(`Formulaire mis à jour: ${id}`);
    return this.findById(id);
  }

  // Delete form (soft delete)
  async delete(id: string) {
    const result = await query(
      'UPDATE forms SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) throw new Error('FORM_NOT_FOUND');
    logger.info(`Formulaire supprimé: ${id}`);
    return { id };
  }

  // Duplicate form
  async duplicate(id: string, newName: string, newCode: string, userId: string) {
    const original = await this.findById(id);
    const code = newCode || await this.generateFormCode();

    const result = await query(
      `INSERT INTO forms (code, title, description, type, layout_columns, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [code, newName, original.description, original.type, original.layoutColumns, userId]
    );

    const newFormId = result.rows[0].id;

    // Duplicate sections and fields
    for (const section of original.sections || []) {
      const newSection = await this.createSection(newFormId, {
        title: section.title,
        description: section.description,
        sortOrder: section.sortOrder,
        columns: section.columns,
        isCollapsible: section.isCollapsible,
        isCollapsedDefault: section.isCollapsedDefault,
      });

      for (const field of section.fields || []) {
        await this.createField(newFormId, newSection.id, {
          fieldTypeId: field.fieldTypeId,
          code: field.code,
          label: field.label,
          placeholder: field.placeholder,
          helpText: field.helpText,
          defaultValue: field.defaultValue,
          isRequired: field.isRequired,
          isReadonly: field.isReadonly,
          isHidden: field.isHidden,
          validationRules: field.validationRules,
          options: field.options,
          conditionalLogic: field.conditionalLogic,
          sortOrder: field.sortOrder,
          columnSpan: field.columnSpan,
        });
      }
    }

    logger.info(`Formulaire dupliqué: ${id} -> ${newFormId}`);
    return this.findById(newFormId);
  }

  // Publish form
  async publish(id: string) {
    const result = await query(
      'UPDATE forms SET version = version + 1, updated_at = NOW() WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) throw new Error('FORM_NOT_FOUND');
    logger.info(`Formulaire publié: ${id}`);
    return this.findById(id);
  }

  // Unpublish form
  async unpublish(id: string) {
    const result = await query(
      'UPDATE forms SET version = 0, updated_at = NOW() WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) throw new Error('FORM_NOT_FOUND');
    logger.info(`Formulaire dépublié: ${id}`);
    return this.findById(id);
  }

  // Validate form structure
  async validate(id: string) {
    const form = await this.findById(id);
    const errors: string[] = [];

    if (!form.sections || form.sections.length === 0) {
      errors.push('Le formulaire doit avoir au moins une section');
    }

    const hasFields = form.sections?.some((s: { fields?: unknown[] }) => s.fields && s.fields.length > 0);
    if (!hasFields) {
      errors.push('Le formulaire doit avoir au moins un champ');
    }

    if (!form.name) errors.push('Le nom est requis');

    return { valid: errors.length === 0, errors };
  }

  // Get form stats
  async getStats() {
    const [totalResult, byStatusResult, submissionResult] = await Promise.all([
      query('SELECT COUNT(*) FROM forms'),
      query(`
        SELECT
          SUM(CASE WHEN version > 0 THEN 1 ELSE 0 END) as published,
          SUM(CASE WHEN version = 0 AND is_active = true THEN 1 ELSE 0 END) as draft,
          SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive
        FROM forms
      `),
      query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'SUBMITTED') as submitted,
          COUNT(*) FILTER (WHERE status = 'VALIDATED') as validated,
          COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected
        FROM form_submissions
      `),
    ]);

    const statusStats = byStatusResult.rows[0];
    const submissionStats = submissionResult.rows[0];

    return {
      total: parseInt(totalResult.rows[0].count, 10),
      byStatus: {
        published: parseInt(statusStats.published || '0', 10),
        draft: parseInt(statusStats.draft || '0', 10),
        inactive: parseInt(statusStats.inactive || '0', 10),
      },
      submissionStats: {
        total: parseInt(submissionStats.total || '0', 10),
        submitted: parseInt(submissionStats.submitted || '0', 10),
        validated: parseInt(submissionStats.validated || '0', 10),
        rejected: parseInt(submissionStats.rejected || '0', 10),
        averageCompletionTimeMinutes: 0,
      },
      topForms: [],
    };
  }

  // ===========================================
  // Sections Methods
  // ===========================================

  async getSections(formId: string) {
    const result = await query(
      `SELECT id, form_id as "formId", title, description,
        section_order as "sortOrder", columns_layout::int as columns,
        is_collapsible as "isCollapsible", created_at as "createdAt"
       FROM form_sections WHERE form_id = $1 ORDER BY section_order ASC`,
      [formId]
    );
    return result.rows;
  }

  async getSection(formId: string, sectionId: string) {
    const result = await query(
      `SELECT id, form_id as "formId", title, description,
        section_order as "sortOrder", columns_layout::int as columns,
        is_collapsible as "isCollapsible", created_at as "createdAt"
       FROM form_sections WHERE form_id = $1 AND id = $2`,
      [formId, sectionId]
    );
    if (result.rows.length === 0) throw new Error('SECTION_NOT_FOUND');
    return result.rows[0];
  }

  async createSection(formId: string, data: CreateSectionDto) {
    const result = await query(
      `INSERT INTO form_sections (form_id, title, description, section_order, columns_layout, is_collapsible, is_collapsed_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [formId, data.title, data.description || null, data.sortOrder, data.columns?.toString() || '1', data.isCollapsible || false, data.isCollapsedDefault || false]
    );

    const section = result.rows[0];

    // Create fields if provided
    if (data.fields && data.fields.length > 0) {
      for (const field of data.fields) {
        await this.createField(formId, section.id, field);
      }
    }

    return this.getSection(formId, section.id);
  }

  async updateSection(formId: string, sectionId: string, data: UpdateSectionDto) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.title !== undefined) { fields.push(`title = $${paramCount++}`); values.push(data.title); }
    if (data.description !== undefined) { fields.push(`description = $${paramCount++}`); values.push(data.description); }
    if (data.sortOrder !== undefined) { fields.push(`section_order = $${paramCount++}`); values.push(data.sortOrder); }
    if (data.columns !== undefined) { fields.push(`columns_layout = $${paramCount++}`); values.push(data.columns.toString()); }
    if (data.isCollapsible !== undefined) { fields.push(`is_collapsible = $${paramCount++}`); values.push(data.isCollapsible); }

    if (fields.length === 0) throw new Error('NO_FIELDS_TO_UPDATE');

    values.push(formId, sectionId);

    const result = await query(
      `UPDATE form_sections SET ${fields.join(', ')}
       WHERE form_id = $${paramCount++} AND id = $${paramCount}
       RETURNING id`,
      values
    );

    if (result.rows.length === 0) throw new Error('SECTION_NOT_FOUND');
    return this.getSection(formId, sectionId);
  }

  async deleteSection(formId: string, sectionId: string) {
    const result = await query(
      'DELETE FROM form_sections WHERE form_id = $1 AND id = $2 RETURNING id',
      [formId, sectionId]
    );
    if (result.rows.length === 0) throw new Error('SECTION_NOT_FOUND');
    return { id: sectionId };
  }

  async reorderSections(formId: string, sectionIds: string[]) {
    for (let i = 0; i < sectionIds.length; i++) {
      await query(
        'UPDATE form_sections SET section_order = $1 WHERE id = $2 AND form_id = $3',
        [i + 1, sectionIds[i], formId]
      );
    }
    return this.getSections(formId);
  }

  // ===========================================
  // Fields Methods
  // ===========================================

  async getFields(formId: string, sectionId: string) {
    const result = await query(
      `SELECT ff.id, ff.section_id as "sectionId", ff.field_type_id as "fieldTypeId",
        ff.name as code, ff.label, ff.placeholder, ff.help_text as "helpText",
        ff.default_value as "defaultValue", ff.is_required as "isRequired",
        ff.is_readonly as "isReadonly", ff.is_hidden as "isHidden",
        ff.validation_rules as "validationRules", ff.options,
        ff.field_order as "sortOrder", ff.column_span as "columnSpan",
        ff.created_at as "createdAt", ff.updated_at as "updatedAt"
       FROM form_fields ff
       WHERE ff.section_id = $1
       ORDER BY ff.field_order ASC`,
      [sectionId]
    );
    return result.rows;
  }

  async createField(formId: string, sectionId: string, data: CreateFieldDto) {
    const result = await query(
      `INSERT INTO form_fields (
        form_id, section_id, field_type_id, name, label, placeholder, help_text,
        default_value, is_required, is_readonly, is_hidden, validation_rules,
        options, conditional_logic, field_order, column_span
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        formId, sectionId, data.fieldTypeId, data.code, data.label,
        data.placeholder || null, data.helpText || null, data.defaultValue || null,
        data.isRequired || false, data.isReadonly || false, data.isHidden || false,
        JSON.stringify(data.validationRules || {}), JSON.stringify(data.options || []),
        JSON.stringify(data.conditionalLogic || []), data.sortOrder, data.columnSpan || 1
      ]
    );
    return result.rows[0];
  }

  async updateField(formId: string, sectionId: string, fieldId: string, data: UpdateFieldDto) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.label !== undefined) { fields.push(`label = $${paramCount++}`); values.push(data.label); }
    if (data.placeholder !== undefined) { fields.push(`placeholder = $${paramCount++}`); values.push(data.placeholder); }
    if (data.helpText !== undefined) { fields.push(`help_text = $${paramCount++}`); values.push(data.helpText); }
    if (data.defaultValue !== undefined) { fields.push(`default_value = $${paramCount++}`); values.push(data.defaultValue); }
    if (data.isRequired !== undefined) { fields.push(`is_required = $${paramCount++}`); values.push(data.isRequired); }
    if (data.isReadonly !== undefined) { fields.push(`is_readonly = $${paramCount++}`); values.push(data.isReadonly); }
    if (data.isHidden !== undefined) { fields.push(`is_hidden = $${paramCount++}`); values.push(data.isHidden); }
    if (data.validationRules !== undefined) { fields.push(`validation_rules = $${paramCount++}`); values.push(JSON.stringify(data.validationRules)); }
    if (data.options !== undefined) { fields.push(`options = $${paramCount++}`); values.push(JSON.stringify(data.options)); }
    if (data.sortOrder !== undefined) { fields.push(`field_order = $${paramCount++}`); values.push(data.sortOrder); }
    if (data.columnSpan !== undefined) { fields.push(`column_span = $${paramCount++}`); values.push(data.columnSpan); }

    if (fields.length === 0) throw new Error('NO_FIELDS_TO_UPDATE');

    fields.push('updated_at = NOW()');
    values.push(sectionId, fieldId);

    const result = await query(
      `UPDATE form_fields SET ${fields.join(', ')}
       WHERE section_id = $${paramCount++} AND id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) throw new Error('FIELD_NOT_FOUND');
    return result.rows[0];
  }

  async deleteField(formId: string, sectionId: string, fieldId: string) {
    const result = await query(
      'DELETE FROM form_fields WHERE section_id = $1 AND id = $2 RETURNING id',
      [sectionId, fieldId]
    );
    if (result.rows.length === 0) throw new Error('FIELD_NOT_FOUND');
    return { id: fieldId };
  }

  async reorderFields(formId: string, sectionId: string, fieldIds: string[]) {
    for (let i = 0; i < fieldIds.length; i++) {
      await query(
        'UPDATE form_fields SET field_order = $1 WHERE id = $2 AND section_id = $3',
        [i + 1, fieldIds[i], sectionId]
      );
    }
    return this.getFields(formId, sectionId);
  }

  // ===========================================
  // Field Types Methods
  // ===========================================

  async getFieldTypes() {
    const result = await query(
      'SELECT id, code, name, category FROM field_types ORDER BY category, name'
    );
    return result.rows;
  }

  async getFieldTypesByCategory(category: string) {
    const result = await query(
      'SELECT id, code, name, category FROM field_types WHERE category = $1 ORDER BY name',
      [category]
    );
    return result.rows;
  }

  // ===========================================
  // Submissions Methods
  // ===========================================

  async getSubmissions(filters: SubmissionFilters = {}, pagination: PaginationParams = {}) {
    const { page = 1, pageSize = 10, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * pageSize;
    const params: unknown[] = [];
    let paramIndex = 1;

    const conditions: string[] = ['1=1'];

    if (filters.formId) {
      conditions.push(`fs.template_id = $${paramIndex++}`);
      params.push(filters.formId);
    }

    if (filters.eventId) {
      conditions.push(`fs.health_event_id = $${paramIndex++}`);
      params.push(filters.eventId);
    }

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : filters.status.split(',');
      conditions.push(`fs.status = ANY($${paramIndex}::text[])`);
      params.push(statuses);
      paramIndex++;
    }

    if (filters.submittedById) {
      conditions.push(`fs.submitted_by = $${paramIndex++}`);
      params.push(filters.submittedById);
    }

    const whereClause = conditions.join(' AND ');

    const queryText = `
      SELECT
        fs.id, fs.template_id as "formId", fs.health_event_id as "eventId",
        fs.data, fs.status,
        fs.submitted_by as "submittedById",
        fs.created_at as "submittedAt",
        fs.created_at as "createdAt",
        fs.updated_at as "updatedAt",
        json_build_object('id', f.id, 'name', f.title, 'code', f.code) as form,
        CASE WHEN u.id IS NOT NULL THEN json_build_object(
          'id', u.id, 'firstName', u.first_name, 'lastName', u.last_name
        ) ELSE NULL END as "submittedBy"
      FROM form_submissions fs
      LEFT JOIN forms f ON fs.template_id = f.id
      LEFT JOIN users u ON fs.submitted_by = u.id
      WHERE ${whereClause}
      ORDER BY fs.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    params.push(pageSize, offset);
    const result = await query(queryText, params);

    const countParams = params.slice(0, -2);
    const countQuery = `SELECT COUNT(*) FROM form_submissions fs WHERE ${whereClause}`;
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    return {
      items: result.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasNext: page < Math.ceil(total / pageSize),
      hasPrevious: page > 1,
    };
  }

  async getSubmissionById(id: string) {
    const result = await query(
      `SELECT fs.id, fs.template_id as "formId", fs.health_event_id as "eventId",
        fs.data, fs.status, fs.submitted_by as "submittedById",
        fs.created_at as "submittedAt", fs.created_at as "createdAt", fs.updated_at as "updatedAt"
       FROM form_submissions fs WHERE fs.id = $1`,
      [id]
    );
    if (result.rows.length === 0) throw new Error('SUBMISSION_NOT_FOUND');
    return result.rows[0];
  }

  async createSubmission(data: { formId: string; eventId?: string; data: object; status?: string; submittedById: string }) {
    const result = await query(
      `INSERT INTO form_submissions (template_id, health_event_id, data, status, submitted_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.formId, data.eventId || null, JSON.stringify(data.data), data.status || 'SUBMITTED', data.submittedById]
    );
    logger.info(`Soumission créée: ${result.rows[0].id}`);
    return result.rows[0];
  }

  async updateSubmission(id: string, data: { data?: object; status?: string }) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.data !== undefined) { fields.push(`data = $${paramCount++}`); values.push(JSON.stringify(data.data)); }
    if (data.status !== undefined) { fields.push(`status = $${paramCount++}`); values.push(data.status); }

    if (fields.length === 0) throw new Error('NO_FIELDS_TO_UPDATE');

    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await query(
      `UPDATE form_submissions SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) throw new Error('SUBMISSION_NOT_FOUND');
    return result.rows[0];
  }

  async validateSubmission(id: string, validatedById: string) {
    const result = await query(
      `UPDATE form_submissions SET status = 'VALIDATED', validated_by = $1, validated_at = NOW(), updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [validatedById, id]
    );
    if (result.rows.length === 0) throw new Error('SUBMISSION_NOT_FOUND');
    return result.rows[0];
  }

  async rejectSubmission(id: string, reason: string, validatedById: string) {
    const result = await query(
      `UPDATE form_submissions SET status = 'REJECTED', rejection_reason = $1, validated_by = $2, validated_at = NOW(), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [reason, validatedById, id]
    );
    if (result.rows.length === 0) throw new Error('SUBMISSION_NOT_FOUND');
    return result.rows[0];
  }

  async deleteSubmission(id: string) {
    const result = await query('DELETE FROM form_submissions WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) throw new Error('SUBMISSION_NOT_FOUND');
    return { id };
  }
}

export const formsService = new FormsService();
export default formsService;

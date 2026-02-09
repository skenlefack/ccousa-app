import { query } from '../utils/database';
import logger from '../utils/logger';

export class ConfigService {
  // ===========================================
  // System Settings
  // ===========================================

  async getSystemSettings() {
    const result = await query(
      `SELECT id, key, value, value_type, category, description, is_editable, updated_at
       FROM system_configurations ORDER BY category, key`
    );
    return result.rows.map(row => ({
      id: row.id,
      key: row.key,
      value: row.value,
      valueType: row.value_type,
      category: row.category,
      description: row.description,
      isEditable: row.is_editable,
      updatedAt: row.updated_at,
    }));
  }

  async getSettingByKey(key: string) {
    const result = await query(
      `SELECT * FROM system_configurations WHERE key = $1`,
      [key]
    );
    if (result.rows.length === 0) throw new Error('SETTING_NOT_FOUND');
    return result.rows[0];
  }

  async updateSetting(key: string, value: string) {
    const result = await query(
      `UPDATE system_configurations SET value = $1, updated_at = NOW() WHERE key = $2 AND is_editable = true RETURNING *`,
      [value, key]
    );
    if (result.rows.length === 0) throw new Error('SETTING_NOT_FOUND_OR_NOT_EDITABLE');
    logger.info(`Configuration mise à jour: ${key}`);
    return result.rows[0];
  }

  async bulkUpdateSettings(configs: Array<{ key: string; value: string }>) {
    const results = [];
    for (const config of configs) {
      try {
        const result = await this.updateSetting(config.key, config.value);
        results.push(result);
      } catch (error) {
        logger.warn(`Échec mise à jour configuration: ${config.key}`);
      }
    }
    return results;
  }

  // ===========================================
  // Event Categories
  // ===========================================

  async getEventCategories(includeInactive = false) {
    const result = await query(
      `SELECT id, code, name, description, color, icon, is_active, sort_order, created_at, updated_at
       FROM event_categories
       ${includeInactive ? '' : 'WHERE is_active = true'}
       ORDER BY sort_order, name`
    );
    return result.rows.map((row: any) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      color: row.color,
      icon: row.icon,
      isActive: row.is_active,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getEventCategoryById(id: string) {
    const result = await query(
      `SELECT * FROM event_categories WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) throw new Error('CATEGORY_NOT_FOUND');
    const row = result.rows[0];
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      color: row.color,
      icon: row.icon,
      isActive: row.is_active,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async createEventCategory(data: {
    code: string;
    name: string;
    description?: string;
    color: string;
    icon?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    // Get max sort order
    const maxSort = await query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM event_categories');
    const sortOrder = data.sortOrder || maxSort.rows[0].next;

    const result = await query(
      `INSERT INTO event_categories (code, name, description, color, icon, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.code, data.name, data.description, data.color, data.icon, sortOrder, data.isActive ?? true]
    );
    logger.info(`Catégorie d'événement créée: ${data.code}`);
    return result.rows[0];
  }

  async updateEventCategory(id: string, data: Partial<{
    code: string;
    name: string;
    description: string;
    color: string;
    icon: string;
    sortOrder: number;
    isActive: boolean;
  }>) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.code !== undefined) { fields.push(`code = $${paramIndex++}`); values.push(data.code); }
    if (data.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(data.description); }
    if (data.color !== undefined) { fields.push(`color = $${paramIndex++}`); values.push(data.color); }
    if (data.icon !== undefined) { fields.push(`icon = $${paramIndex++}`); values.push(data.icon); }
    if (data.sortOrder !== undefined) { fields.push(`sort_order = $${paramIndex++}`); values.push(data.sortOrder); }
    if (data.isActive !== undefined) { fields.push(`is_active = $${paramIndex++}`); values.push(data.isActive); }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE event_categories SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    if (result.rows.length === 0) throw new Error('CATEGORY_NOT_FOUND');
    logger.info(`Catégorie d'événement mise à jour: ${id}`);
    return result.rows[0];
  }

  async deleteEventCategory(id: string) {
    const result = await query(
      `DELETE FROM event_categories WHERE id = $1 RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) throw new Error('CATEGORY_NOT_FOUND');
    logger.info(`Catégorie d'événement supprimée: ${id}`);
    return { deleted: true };
  }

  async reorderEventCategories(orderedIds: string[]) {
    for (let i = 0; i < orderedIds.length; i++) {
      await query(
        `UPDATE event_categories SET sort_order = $1, updated_at = NOW() WHERE id = $2`,
        [i + 1, orderedIds[i]]
      );
    }
    logger.info('Catégories d\'événements réordonnées');
    return { reordered: true };
  }

  // ===========================================
  // Document Types
  // ===========================================

  async getDocumentTypes(includeInactive = false) {
    const result = await query(
      `SELECT id, code, name, description, allowed_extensions, max_size_bytes, is_required, is_active, sort_order, created_at, updated_at
       FROM document_types
       ${includeInactive ? '' : 'WHERE is_active = true'}
       ORDER BY sort_order, name`
    );
    return result.rows.map(row => ({
      ...row,
      allowedExtensions: row.allowed_extensions,
      maxSizeBytes: row.max_size_bytes,
      isRequired: row.is_required,
      isActive: row.is_active,
      sortOrder: row.sort_order,
    }));
  }

  async getDocumentTypeById(id: string) {
    const result = await query(`SELECT * FROM document_types WHERE id = $1`, [id]);
    if (result.rows.length === 0) throw new Error('DOCUMENT_TYPE_NOT_FOUND');
    return result.rows[0];
  }

  async createDocumentType(data: {
    code: string;
    name: string;
    description?: string;
    allowedExtensions?: string[];
    maxSizeBytes?: number;
    isRequired?: boolean;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const maxSort = await query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM document_types');
    const sortOrder = data.sortOrder || maxSort.rows[0].next;

    const result = await query(
      `INSERT INTO document_types (code, name, description, allowed_extensions, max_size_bytes, is_required, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.code,
        data.name,
        data.description,
        data.allowedExtensions || [],
        data.maxSizeBytes || 10485760,
        data.isRequired ?? false,
        sortOrder,
        data.isActive ?? true
      ]
    );
    logger.info(`Type de document créé: ${data.code}`);
    return result.rows[0];
  }

  async updateDocumentType(id: string, data: Partial<{
    code: string;
    name: string;
    description: string;
    allowedExtensions: string[];
    maxSizeBytes: number;
    isRequired: boolean;
    sortOrder: number;
    isActive: boolean;
  }>) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.code !== undefined) { fields.push(`code = $${paramIndex++}`); values.push(data.code); }
    if (data.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(data.description); }
    if (data.allowedExtensions !== undefined) { fields.push(`allowed_extensions = $${paramIndex++}`); values.push(data.allowedExtensions); }
    if (data.maxSizeBytes !== undefined) { fields.push(`max_size_bytes = $${paramIndex++}`); values.push(data.maxSizeBytes); }
    if (data.isRequired !== undefined) { fields.push(`is_required = $${paramIndex++}`); values.push(data.isRequired); }
    if (data.sortOrder !== undefined) { fields.push(`sort_order = $${paramIndex++}`); values.push(data.sortOrder); }
    if (data.isActive !== undefined) { fields.push(`is_active = $${paramIndex++}`); values.push(data.isActive); }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE document_types SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    if (result.rows.length === 0) throw new Error('DOCUMENT_TYPE_NOT_FOUND');
    logger.info(`Type de document mis à jour: ${id}`);
    return result.rows[0];
  }

  async deleteDocumentType(id: string) {
    const result = await query(`DELETE FROM document_types WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) throw new Error('DOCUMENT_TYPE_NOT_FOUND');
    logger.info(`Type de document supprimé: ${id}`);
    return { deleted: true };
  }

  // ===========================================
  // Event Provenances (Origins)
  // ===========================================

  async getEventProvenances(includeInactive = false) {
    const result = await query(
      `SELECT id, code, name, description, color, icon, is_active, sort_order, created_at, updated_at
       FROM event_provenances
       ${includeInactive ? '' : 'WHERE is_active = true'}
       ORDER BY sort_order, name`
    );
    return result.rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      color: row.color,
      icon: row.icon,
      isActive: row.is_active,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getEventProvenanceById(id: string) {
    const result = await query(`SELECT * FROM event_provenances WHERE id = $1`, [id]);
    if (result.rows.length === 0) throw new Error('PROVENANCE_NOT_FOUND');
    return result.rows[0];
  }

  async createEventProvenance(data: {
    code: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const maxSort = await query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM event_provenances');
    const sortOrder = data.sortOrder || maxSort.rows[0].next;

    const result = await query(
      `INSERT INTO event_provenances (code, name, description, color, icon, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.code,
        data.name,
        data.description || null,
        data.color || '#6366f1',
        data.icon || 'map-pin',
        sortOrder,
        data.isActive ?? true
      ]
    );
    logger.info(`Provenance créée: ${data.code}`);
    return result.rows[0];
  }

  async updateEventProvenance(id: string, data: Partial<{
    code: string;
    name: string;
    description: string;
    color: string;
    icon: string;
    sortOrder: number;
    isActive: boolean;
  }>) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.code !== undefined) { fields.push(`code = $${paramIndex++}`); values.push(data.code); }
    if (data.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(data.description); }
    if (data.color !== undefined) { fields.push(`color = $${paramIndex++}`); values.push(data.color); }
    if (data.icon !== undefined) { fields.push(`icon = $${paramIndex++}`); values.push(data.icon); }
    if (data.sortOrder !== undefined) { fields.push(`sort_order = $${paramIndex++}`); values.push(data.sortOrder); }
    if (data.isActive !== undefined) { fields.push(`is_active = $${paramIndex++}`); values.push(data.isActive); }
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE event_provenances SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    if (result.rows.length === 0) throw new Error('PROVENANCE_NOT_FOUND');
    logger.info(`Provenance mise à jour: ${id}`);
    return result.rows[0];
  }

  async deleteEventProvenance(id: string) {
    const result = await query(`DELETE FROM event_provenances WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) throw new Error('PROVENANCE_NOT_FOUND');
    logger.info(`Provenance supprimée: ${id}`);
    return { deleted: true };
  }

  // ===========================================
  // Organizational Units
  // ===========================================

  async getOrganizationalUnits(asTree = false) {
    const result = await query(
      `SELECT id, code, name, type, parent_id, latitude, longitude, is_active, created_at, updated_at
       FROM organizational_units ORDER BY type, name`
    );

    const units = result.rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      type: row.type,
      parentId: row.parent_id,
      latitude: row.latitude,
      longitude: row.longitude,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    if (!asTree) return units;

    // Build tree structure
    const map = new Map();
    const roots: typeof units = [];

    units.forEach(unit => {
      map.set(unit.id, { ...unit, children: [] });
    });

    units.forEach(unit => {
      const node = map.get(unit.id);
      if (unit.parentId && map.has(unit.parentId)) {
        map.get(unit.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  async getOrganizationalUnitById(id: string) {
    const result = await query(`SELECT * FROM organizational_units WHERE id = $1`, [id]);
    if (result.rows.length === 0) throw new Error('UNIT_NOT_FOUND');
    return result.rows[0];
  }

  async createOrganizationalUnit(data: {
    code: string;
    name: string;
    type: string;
    parentId?: string;
    latitude?: number;
    longitude?: number;
    isActive?: boolean;
  }) {
    const result = await query(
      `INSERT INTO organizational_units (code, name, type, parent_id, latitude, longitude, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.code, data.name, data.type, data.parentId, data.latitude, data.longitude, data.isActive ?? true]
    );
    logger.info(`Unité organisationnelle créée: ${data.code}`);
    return result.rows[0];
  }

  async updateOrganizationalUnit(id: string, data: Partial<{
    code: string;
    name: string;
    type: string;
    parentId: string;
    latitude: number;
    longitude: number;
    isActive: boolean;
  }>) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.code !== undefined) { fields.push(`code = $${paramIndex++}`); values.push(data.code); }
    if (data.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.type !== undefined) { fields.push(`type = $${paramIndex++}`); values.push(data.type); }
    if (data.parentId !== undefined) { fields.push(`parent_id = $${paramIndex++}`); values.push(data.parentId || null); }
    if (data.latitude !== undefined) { fields.push(`latitude = $${paramIndex++}`); values.push(data.latitude); }
    if (data.longitude !== undefined) { fields.push(`longitude = $${paramIndex++}`); values.push(data.longitude); }
    if (data.isActive !== undefined) { fields.push(`is_active = $${paramIndex++}`); values.push(data.isActive); }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE organizational_units SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    if (result.rows.length === 0) throw new Error('UNIT_NOT_FOUND');
    logger.info(`Unité organisationnelle mise à jour: ${id}`);
    return result.rows[0];
  }

  async deleteOrganizationalUnit(id: string) {
    // First delete children recursively
    await query(`DELETE FROM organizational_units WHERE parent_id = $1`, [id]);
    const result = await query(`DELETE FROM organizational_units WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) throw new Error('UNIT_NOT_FOUND');
    logger.info(`Unité organisationnelle supprimée: ${id}`);
    return { deleted: true };
  }

  // ===========================================
  // Work Schedules
  // ===========================================

  // Helper to format time from PostgreSQL (HH:MM:SS) to frontend format (HH:MM)
  private formatTime(time: string | null): string | null {
    if (!time) return null;
    // If already in HH:MM format, return as-is
    if (time.length === 5) return time;
    // If in HH:MM:SS format, trim seconds
    return time.substring(0, 5);
  }

  private transformScheduleRow(row: any) {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      timezoneId: row.timezone_id,
      startDate: row.start_date,
      endDate: row.end_date,
      isDefault: row.is_default,
      isActive: row.is_active,
      days: row.days?.map((d: any) => ({
        id: d.id,
        workScheduleId: d.work_schedule_id,
        dayOfWeek: d.day_of_week,
        startTime: this.formatTime(d.start_time) || '08:00',
        endTime: this.formatTime(d.end_time) || '17:00',
        breakStartTime: this.formatTime(d.break_start_time),
        breakEndTime: this.formatTime(d.break_end_time),
        breakDurationMinutes: d.break_duration_minutes || 60,
        isWorkingDay: d.is_working_day ?? true,
      })) || [],
    };
  }

  async getWorkSchedules() {
    const result = await query(
      `SELECT ws.*,
        (SELECT json_agg(wsd ORDER BY wsd.day_of_week)
         FROM work_schedule_days wsd
         WHERE wsd.work_schedule_id = ws.id) as days
       FROM work_schedules ws
       WHERE ws.is_active = true
       ORDER BY ws.is_default DESC, ws.name`
    );
    return result.rows.map(row => this.transformScheduleRow(row));
  }

  async getWorkScheduleById(id: string) {
    const result = await query(
      `SELECT ws.*,
        (SELECT json_agg(wsd ORDER BY wsd.day_of_week)
         FROM work_schedule_days wsd
         WHERE wsd.work_schedule_id = ws.id) as days
       FROM work_schedules ws
       WHERE ws.id = $1`,
      [id]
    );
    if (result.rows.length === 0) throw new Error('SCHEDULE_NOT_FOUND');
    return this.transformScheduleRow(result.rows[0]);
  }

  async createWorkSchedule(data: {
    code: string;
    name: string;
    description?: string;
    timezoneId: string;
    startDate?: string;
    endDate?: string;
    isDefault?: boolean;
    isActive?: boolean;
    days: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      breakStartTime?: string;
      breakEndTime?: string;
      breakDurationMinutes?: number;
      isWorkingDay: boolean;
    }>;
  }) {
    // If this is default, unset other defaults
    if (data.isDefault) {
      await query(`UPDATE work_schedules SET is_default = false WHERE is_default = true`);
    }

    const scheduleResult = await query(
      `INSERT INTO work_schedules (code, name, description, timezone_id, start_date, end_date, is_default, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.code,
        data.name,
        data.description,
        data.timezoneId,
        data.startDate,
        data.endDate,
        data.isDefault ?? false,
        data.isActive ?? true
      ]
    );

    const schedule = scheduleResult.rows[0];

    // Insert days
    for (const day of data.days) {
      await query(
        `INSERT INTO work_schedule_days (work_schedule_id, day_of_week, start_time, end_time, break_start_time, break_end_time, break_duration_minutes, is_working_day)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          schedule.id,
          day.dayOfWeek,
          day.startTime,
          day.endTime,
          day.breakStartTime,
          day.breakEndTime,
          day.breakDurationMinutes,
          day.isWorkingDay
        ]
      );
    }

    logger.info(`Horaire de travail créé: ${data.code}`);
    return this.getWorkScheduleById(schedule.id);
  }

  async updateWorkSchedule(id: string, data: Partial<{
    code: string;
    name: string;
    description: string;
    timezoneId: string;
    startDate: string;
    endDate: string;
    isDefault: boolean;
    isActive: boolean;
  }>) {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      await query(`UPDATE work_schedules SET is_default = false WHERE is_default = true AND id != $1`, [id]);
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.code !== undefined) { fields.push(`code = $${paramIndex++}`); values.push(data.code); }
    if (data.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(data.description); }
    if (data.timezoneId !== undefined) { fields.push(`timezone_id = $${paramIndex++}`); values.push(data.timezoneId); }
    if (data.startDate !== undefined) { fields.push(`start_date = $${paramIndex++}`); values.push(data.startDate || null); }
    if (data.endDate !== undefined) { fields.push(`end_date = $${paramIndex++}`); values.push(data.endDate || null); }
    if (data.isDefault !== undefined) { fields.push(`is_default = $${paramIndex++}`); values.push(data.isDefault); }
    if (data.isActive !== undefined) { fields.push(`is_active = $${paramIndex++}`); values.push(data.isActive); }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE work_schedules SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    if (result.rows.length === 0) throw new Error('SCHEDULE_NOT_FOUND');
    logger.info(`Horaire de travail mis à jour: ${id}`);
    return this.getWorkScheduleById(id);
  }

  async updateWorkScheduleDays(scheduleId: string, days: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    breakStartTime?: string;
    breakEndTime?: string;
    breakDurationMinutes?: number;
    isWorkingDay: boolean;
  }>) {
    // Delete existing days
    await query(`DELETE FROM work_schedule_days WHERE work_schedule_id = $1`, [scheduleId]);

    // Insert new days
    for (const day of days) {
      await query(
        `INSERT INTO work_schedule_days (work_schedule_id, day_of_week, start_time, end_time, break_start_time, break_end_time, break_duration_minutes, is_working_day)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          scheduleId,
          day.dayOfWeek,
          day.startTime,
          day.endTime,
          day.breakStartTime,
          day.breakEndTime,
          day.breakDurationMinutes,
          day.isWorkingDay
        ]
      );
    }

    logger.info(`Jours de l'horaire mis à jour: ${scheduleId}`);
    return this.getWorkScheduleById(scheduleId);
  }

  async deleteWorkSchedule(id: string) {
    await query(`DELETE FROM work_schedule_days WHERE work_schedule_id = $1`, [id]);
    const result = await query(`DELETE FROM work_schedules WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) throw new Error('SCHEDULE_NOT_FOUND');
    logger.info(`Horaire de travail supprimé: ${id}`);
    return { deleted: true };
  }

  // ===========================================
  // Reference Data
  // ===========================================

  async getCountries() {
    const result = await query(
      'SELECT code, name, iso3, phone_code FROM countries WHERE is_active = true ORDER BY name'
    );
    return result.rows;
  }

  async getLanguages() {
    const result = await query(
      `SELECT code, name, native_name, is_default, is_active
       FROM languages WHERE is_active = true ORDER BY is_default DESC, name`
    );
    return result.rows.map(r => ({
      code: r.code,
      name: r.name,
      nativeName: r.native_name,
      isDefault: r.is_default,
      isActive: r.is_active,
    }));
  }

  async getTimezones() {
    const result = await query(
      `SELECT id, code, name, offset_hours
       FROM timezones ORDER BY offset_hours`
    );
    return result.rows.map(r => ({
      id: r.id,
      code: r.code,
      name: r.name,
      offset: `UTC${r.offset_hours >= 0 ? '+' : ''}${r.offset_hours}`,
      offsetHours: r.offset_hours,
      offsetMinutes: r.offset_hours * 60,
    }));
  }

  async getReferenceData() {
    const [languages, countries, timezones] = await Promise.all([
      this.getLanguages(),
      this.getCountries(),
      this.getTimezones(),
    ]);
    return { languages, countries, timezones };
  }
}

export default new ConfigService();

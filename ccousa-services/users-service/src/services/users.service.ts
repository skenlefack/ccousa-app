import bcrypt from 'bcryptjs';
import { query } from '../utils/database';
import config from '../config';
import logger from '../utils/logger';

interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  organizationalUnitId?: string;
  phone?: string;
  identifier?: string;
}

interface UpdateUserDto {
  identifier?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roleId?: string;
  organizationalUnitId?: string;
  phone?: string;
  isActive?: boolean;
}

export class UsersService {
  async findAll(page = 1, limit = 20, search?: string) {
    const offset = (page - 1) * limit;
    let queryText = `
      SELECT u.id, u.identifier, u.email, u.first_name, u.last_name, u.phone,
             u.is_active, u.created_at, u.last_login_at,
             u.role_id, r.name as role_name,
             u.organizational_unit_id, g.name as organizational_unit_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN groups g ON u.organizational_unit_id = g.id
    `;
    const params: unknown[] = [];

    if (search) {
      queryText += ` WHERE u.email ILIKE $1 OR u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.identifier ILIKE $1`;
      params.push(`%${search}%`);
    }

    queryText += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Compter le total
    let countQuery = 'SELECT COUNT(*) FROM users u';
    const countParams: unknown[] = [];
    if (search) {
      countQuery += ` WHERE u.email ILIKE $1 OR u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.identifier ILIKE $1`;
      countParams.push(`%${search}%`);
    }
    const countResult = await query(countQuery, countParams);

    return {
      users: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count, 10),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
      },
    };
  }

  async findById(id: string) {
    const result = await query(
      `SELECT u.*, r.name as role_name, g.name as organizational_unit_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN groups g ON u.organizational_unit_id = g.id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    const user = result.rows[0];
    delete user.password_hash;
    return user;
  }

  async create(data: CreateUserDto) {
    // Vérifier si l'email existe déjà
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [data.email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(data.password, config.bcrypt.saltRounds);

    // Utiliser l'identifiant fourni ou en générer un par défaut
    const identifier = data.identifier || `USR${Date.now().toString(36).toUpperCase()}`;

    const result = await query(
      `INSERT INTO users (identifier, email, password_hash, first_name, last_name, role_id, organizational_unit_id, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, identifier, email, first_name, last_name, is_active, created_at`,
      [
        identifier,
        data.email.toLowerCase(),
        passwordHash,
        data.firstName,
        data.lastName,
        data.roleId,
        data.organizationalUnitId || null,
        data.phone || null,
      ]
    );

    logger.info(`Utilisateur créé: ${data.email}`);
    return result.rows[0];
  }

  async update(id: string, data: UpdateUserDto) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.identifier !== undefined) {
      fields.push(`identifier = $${paramCount++}`);
      values.push(data.identifier);
    }
    if (data.firstName !== undefined) {
      fields.push(`first_name = $${paramCount++}`);
      values.push(data.firstName);
    }
    if (data.lastName !== undefined) {
      fields.push(`last_name = $${paramCount++}`);
      values.push(data.lastName);
    }
    if (data.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(data.email.toLowerCase());
    }
    if (data.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(data.phone || null);
    }
    if (data.roleId !== undefined) {
      fields.push(`role_id = $${paramCount++}`);
      values.push(data.roleId);
    }
    if (data.organizationalUnitId !== undefined) {
      fields.push(`organizational_unit_id = $${paramCount++}`);
      values.push(data.organizationalUnitId || null);
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(data.isActive);
    }

    if (fields.length === 0) {
      throw new Error('NO_FIELDS_TO_UPDATE');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, email, first_name, last_name, is_active`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    logger.info(`Utilisateur mis à jour: ${id}`);
    return result.rows[0];
  }

  async delete(id: string) {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    logger.info(`Utilisateur supprimé: ${id}`);
    return { id };
  }

  async getRoles() {
    const result = await query('SELECT id, name, description, level FROM roles ORDER BY level ASC');
    return result.rows;
  }

  async getOrganizationalUnits() {
    const result = await query(
      `SELECT id, name, code, type, parent_id
       FROM organizational_units
       WHERE is_active = true
       ORDER BY name ASC`
    );
    return result.rows;
  }

  async getStats() {
    // Total users
    const totalResult = await query('SELECT COUNT(*) as count FROM users');
    const total = parseInt(totalResult.rows[0].count, 10);

    // Active users
    const activeResult = await query('SELECT COUNT(*) as count FROM users WHERE is_active = true');
    const active = parseInt(activeResult.rows[0].count, 10);

    // Inactive users
    const inactive = total - active;

    // Users by role
    const byRoleResult = await query(`
      SELECT r.id as role_id, r.name as role_name, COUNT(u.id) as count
      FROM roles r
      LEFT JOIN users u ON u.role_id = r.id
      GROUP BY r.id, r.name
      ORDER BY r.level ASC
    `);
    const byRole = byRoleResult.rows.map(row => ({
      roleId: row.role_id,
      roleName: row.role_name,
      count: parseInt(row.count, 10),
    }));

    // Users by organizational unit
    const byOrgUnitResult = await query(`
      SELECT o.id as unit_id, o.name as unit_name, COUNT(u.id) as count
      FROM organizational_units o
      LEFT JOIN users u ON u.organizational_unit_id = o.id
      WHERE o.is_active = true
      GROUP BY o.id, o.name
      ORDER BY count DESC
      LIMIT 10
    `);
    const byOrganizationalUnit = byOrgUnitResult.rows.map(row => ({
      unitId: row.unit_id,
      unitName: row.unit_name,
      count: parseInt(row.count, 10),
    }));

    // New users this month
    const newThisMonthResult = await query(`
      SELECT COUNT(*) as count FROM users
      WHERE created_at >= date_trunc('month', CURRENT_DATE)
    `);
    const newThisMonth = parseInt(newThisMonthResult.rows[0].count, 10);

    // Users who logged in today
    const lastLoginTodayResult = await query(`
      SELECT COUNT(*) as count FROM users
      WHERE last_login_at >= CURRENT_DATE
    `);
    const lastLoginToday = parseInt(lastLoginTodayResult.rows[0].count, 10);

    return {
      total,
      active,
      inactive,
      byRole,
      byOrganizationalUnit,
      newThisMonth,
      lastLoginToday,
    };
  }

  async resetPassword(id: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

    const result = await query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
      [passwordHash, id]
    );

    if (result.rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    logger.info(`Mot de passe réinitialisé pour l'utilisateur: ${id}`);
    return { success: true };
  }

  // ============================================
  // GROUPS MANAGEMENT
  // ============================================

  async getGroups() {
    const result = await query(
      `SELECT g.id, g.code, g.name, g.description, g.parent_id, g.is_active, g.created_at, g.group_type,
              (SELECT COUNT(*) FROM user_groups ug WHERE ug.group_id = g.id) as members_count
       FROM groups g
       ORDER BY g.group_type, g.name ASC`
    );
    return result.rows;
  }

  async getGroupById(id: string) {
    const result = await query(
      `SELECT g.*,
              (SELECT COUNT(*) FROM user_groups ug WHERE ug.group_id = g.id) as members_count
       FROM groups g WHERE g.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new Error('GROUP_NOT_FOUND');
    }
    return result.rows[0];
  }

  async createGroup(data: { code: string; name: string; description?: string; groupType?: string; parentId?: string }) {
    const existingGroup = await query('SELECT id FROM groups WHERE code = $1', [data.code]);
    if (existingGroup.rows.length > 0) {
      throw new Error('GROUP_CODE_EXISTS');
    }

    const result = await query(
      `INSERT INTO groups (code, name, description, group_type, parent_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.code, data.name, data.description || null, data.groupType || 'organizational', data.parentId || null]
    );
    logger.info(`Groupe créé: ${data.code}`);
    return result.rows[0];
  }

  async updateGroup(id: string, data: { name?: string; description?: string; groupType?: string; parentId?: string; isActive?: boolean }) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.groupType !== undefined) {
      fields.push(`group_type = $${paramCount++}`);
      values.push(data.groupType);
    }
    if (data.parentId !== undefined) {
      fields.push(`parent_id = $${paramCount++}`);
      values.push(data.parentId || null);
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(data.isActive);
    }

    if (fields.length === 0) {
      throw new Error('NO_FIELDS_TO_UPDATE');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE groups SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('GROUP_NOT_FOUND');
    }

    logger.info(`Groupe mis à jour: ${id}`);
    return result.rows[0];
  }

  async deleteGroup(id: string) {
    const result = await query('DELETE FROM groups WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      throw new Error('GROUP_NOT_FOUND');
    }
    logger.info(`Groupe supprimé: ${id}`);
    return { id };
  }

  async getGroupMembers(groupId: string) {
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, r.name as role_name
       FROM users u
       JOIN user_groups ug ON u.id = ug.user_id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE ug.group_id = $1
       ORDER BY u.last_name, u.first_name`,
      [groupId]
    );
    return result.rows;
  }

  async addUserToGroup(userId: string, groupId: string) {
    try {
      await query(
        `INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2)`,
        [userId, groupId]
      );
      logger.info(`Utilisateur ${userId} ajouté au groupe ${groupId}`);
      return { success: true };
    } catch (err: unknown) {
      if ((err as { code?: string }).code === '23505') {
        throw new Error('USER_ALREADY_IN_GROUP');
      }
      throw err;
    }
  }

  async removeUserFromGroup(userId: string, groupId: string) {
    const result = await query(
      `DELETE FROM user_groups WHERE user_id = $1 AND group_id = $2 RETURNING id`,
      [userId, groupId]
    );
    if (result.rows.length === 0) {
      throw new Error('USER_NOT_IN_GROUP');
    }
    logger.info(`Utilisateur ${userId} retiré du groupe ${groupId}`);
    return { success: true };
  }

  // ============================================
  // PERMISSIONS & ROLES MANAGEMENT
  // ============================================

  async getPermissions() {
    const result = await query(
      `SELECT id, code, name, description, module
       FROM permissions
       ORDER BY module, name ASC`
    );
    return result.rows;
  }

  async getRolesWithPermissions() {
    const rolesResult = await query(
      `SELECT id, code, name, description, level, is_active
       FROM roles
       ORDER BY level ASC`
    );

    const roles = rolesResult.rows;

    // Pour chaque rôle, récupérer ses permissions
    for (const role of roles) {
      const permsResult = await query(
        `SELECT p.id, p.code, p.name, p.module
         FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         WHERE rp.role_id = $1`,
        [role.id]
      );
      role.permissions = permsResult.rows;
    }

    return roles;
  }

  async createRole(data: { code: string; name: string; description?: string; level: number }) {
    const existingRole = await query('SELECT id FROM roles WHERE code = $1', [data.code]);
    if (existingRole.rows.length > 0) {
      throw new Error('ROLE_CODE_EXISTS');
    }

    const result = await query(
      `INSERT INTO roles (code, name, description, level)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.code, data.name, data.description || null, data.level]
    );
    logger.info(`Rôle créé: ${data.code}`);
    return result.rows[0];
  }

  async updateRole(id: string, data: { name?: string; description?: string; level?: number; isActive?: boolean }) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.level !== undefined) {
      fields.push(`level = $${paramCount++}`);
      values.push(data.level);
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(data.isActive);
    }

    if (fields.length === 0) {
      throw new Error('NO_FIELDS_TO_UPDATE');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE roles SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('ROLE_NOT_FOUND');
    }

    logger.info(`Rôle mis à jour: ${id}`);
    return result.rows[0];
  }

  async assignPermissionToRole(roleId: string, permissionId: string) {
    try {
      await query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`,
        [roleId, permissionId]
      );
      logger.info(`Permission ${permissionId} assignée au rôle ${roleId}`);
      return { success: true };
    } catch (err: unknown) {
      if ((err as { code?: string }).code === '23505') {
        throw new Error('PERMISSION_ALREADY_ASSIGNED');
      }
      throw err;
    }
  }

  async revokePermissionFromRole(roleId: string, permissionId: string) {
    const result = await query(
      `DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2 RETURNING id`,
      [roleId, permissionId]
    );
    if (result.rows.length === 0) {
      throw new Error('PERMISSION_NOT_ASSIGNED');
    }
    logger.info(`Permission ${permissionId} révoquée du rôle ${roleId}`);
    return { success: true };
  }
}

export default new UsersService();

import { Request, Response } from 'express';
import Joi from 'joi';
import usersService from '../services/users.service';
import logger from '../utils/logger';

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  roleId: Joi.string().uuid().required(),
  organizationalUnitId: Joi.string().uuid().optional().allow(null, ''),
  phone: Joi.string().optional().allow(null, ''),
  identifier: Joi.string().optional().allow(null, ''),
});

const updateUserSchema = Joi.object({
  identifier: Joi.string().optional().allow(null, ''),
  email: Joi.string().email().optional(),
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  roleId: Joi.string().uuid().optional(),
  organizationalUnitId: Joi.string().uuid().optional().allow(null, ''),
  phone: Joi.string().optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
});

export class UsersController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;

      const result = await usersService.findAll(page, limit, search);

      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des utilisateurs:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const user = await usersService.findById(req.params.id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'USER_NOT_FOUND') {
        res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      logger.error('Erreur lors de la récupération de l\'utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createUserSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const user = await usersService.create(value);

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: user,
      });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'EMAIL_ALREADY_EXISTS') {
        res.status(409).json({
          success: false,
          message: 'Cet email est déjà utilisé',
          code: 'EMAIL_ALREADY_EXISTS',
        });
        return;
      }

      logger.error('Erreur lors de la création de l\'utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateUserSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const user = await usersService.update(req.params.id, value);

      res.json({
        success: true,
        message: 'Utilisateur mis à jour avec succès',
        data: user,
      });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'USER_NOT_FOUND') {
        res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      logger.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await usersService.delete(req.params.id);

      res.json({
        success: true,
        message: 'Utilisateur supprimé avec succès',
      });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'USER_NOT_FOUND') {
        res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      logger.error('Erreur lors de la suppression de l\'utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  async getRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = await usersService.getRoles();
      res.json({ success: true, data: roles });
    } catch (error) {
      logger.error('Erreur lors de la récupération des rôles:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await usersService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins 8 caractères',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      await usersService.resetPassword(req.params.id, newPassword);
      res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'USER_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Utilisateur non trouvé', code: 'USER_NOT_FOUND' });
        return;
      }
      logger.error('Erreur lors de la réinitialisation du mot de passe:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async getOrganizationalUnits(req: Request, res: Response): Promise<void> {
    try {
      const units = await usersService.getOrganizationalUnits();
      res.json({ success: true, data: units });
    } catch (error) {
      logger.error('Erreur lors de la récupération des unités:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  // ============================================
  // GROUPS MANAGEMENT
  // ============================================

  async getGroups(req: Request, res: Response): Promise<void> {
    try {
      const groups = await usersService.getGroups();
      res.json({ success: true, data: groups });
    } catch (error) {
      logger.error('Erreur lors de la récupération des groupes:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async getGroupById(req: Request, res: Response): Promise<void> {
    try {
      const group = await usersService.getGroupById(req.params.id);
      res.json({ success: true, data: group });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'GROUP_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Groupe non trouvé', code: 'GROUP_NOT_FOUND' });
        return;
      }
      logger.error('Erreur lors de la récupération du groupe:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async createGroup(req: Request, res: Response): Promise<void> {
    try {
      const group = await usersService.createGroup(req.body);
      res.status(201).json({ success: true, message: 'Groupe créé avec succès', data: group });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'GROUP_CODE_EXISTS') {
        res.status(409).json({ success: false, message: 'Ce code de groupe existe déjà', code: 'GROUP_CODE_EXISTS' });
        return;
      }
      logger.error('Erreur lors de la création du groupe:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async updateGroup(req: Request, res: Response): Promise<void> {
    try {
      const group = await usersService.updateGroup(req.params.id, req.body);
      res.json({ success: true, message: 'Groupe mis à jour avec succès', data: group });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'GROUP_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Groupe non trouvé', code: 'GROUP_NOT_FOUND' });
        return;
      }
      logger.error('Erreur lors de la mise à jour du groupe:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async deleteGroup(req: Request, res: Response): Promise<void> {
    try {
      await usersService.deleteGroup(req.params.id);
      res.json({ success: true, message: 'Groupe supprimé avec succès' });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'GROUP_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Groupe non trouvé', code: 'GROUP_NOT_FOUND' });
        return;
      }
      logger.error('Erreur lors de la suppression du groupe:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async getGroupMembers(req: Request, res: Response): Promise<void> {
    try {
      const members = await usersService.getGroupMembers(req.params.id);
      res.json({ success: true, data: members });
    } catch (error) {
      logger.error('Erreur lors de la récupération des membres:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async addUserToGroup(req: Request, res: Response): Promise<void> {
    try {
      await usersService.addUserToGroup(req.body.userId, req.params.id);
      res.json({ success: true, message: 'Utilisateur ajouté au groupe' });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'USER_ALREADY_IN_GROUP') {
        res.status(409).json({ success: false, message: 'L\'utilisateur est déjà dans ce groupe', code: 'USER_ALREADY_IN_GROUP' });
        return;
      }
      logger.error('Erreur lors de l\'ajout au groupe:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async removeUserFromGroup(req: Request, res: Response): Promise<void> {
    try {
      await usersService.removeUserFromGroup(req.params.userId, req.params.id);
      res.json({ success: true, message: 'Utilisateur retiré du groupe' });
    } catch (error) {
      logger.error('Erreur lors du retrait du groupe:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  // ============================================
  // PERMISSIONS & ROLES MANAGEMENT
  // ============================================

  async getPermissions(req: Request, res: Response): Promise<void> {
    try {
      const permissions = await usersService.getPermissions();
      res.json({ success: true, data: permissions });
    } catch (error) {
      logger.error('Erreur lors de la récupération des permissions:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async getRolesWithPermissions(req: Request, res: Response): Promise<void> {
    try {
      const roles = await usersService.getRolesWithPermissions();
      res.json({ success: true, data: roles });
    } catch (error) {
      logger.error('Erreur lors de la récupération des rôles:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async createRole(req: Request, res: Response): Promise<void> {
    try {
      const role = await usersService.createRole(req.body);
      res.status(201).json({ success: true, message: 'Rôle créé avec succès', data: role });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'ROLE_CODE_EXISTS') {
        res.status(409).json({ success: false, message: 'Ce code de rôle existe déjà', code: 'ROLE_CODE_EXISTS' });
        return;
      }
      logger.error('Erreur lors de la création du rôle:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const role = await usersService.updateRole(req.params.id, req.body);
      res.json({ success: true, message: 'Rôle mis à jour avec succès', data: role });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'ROLE_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Rôle non trouvé', code: 'ROLE_NOT_FOUND' });
        return;
      }
      logger.error('Erreur lors de la mise à jour du rôle:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async assignPermission(req: Request, res: Response): Promise<void> {
    try {
      await usersService.assignPermissionToRole(req.params.roleId, req.body.permissionId);
      res.json({ success: true, message: 'Permission assignée avec succès' });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'PERMISSION_ALREADY_ASSIGNED') {
        res.status(409).json({ success: false, message: 'Permission déjà assignée', code: 'PERMISSION_ALREADY_ASSIGNED' });
        return;
      }
      logger.error('Erreur lors de l\'assignation de permission:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async revokePermission(req: Request, res: Response): Promise<void> {
    try {
      await usersService.revokePermissionFromRole(req.params.roleId, req.params.permissionId);
      res.json({ success: true, message: 'Permission révoquée avec succès' });
    } catch (error) {
      logger.error('Erreur lors de la révocation de permission:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }
}

export default new UsersController();

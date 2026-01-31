import { Request, Response } from 'express';
import Joi from 'joi';
import authService from '../services/auth.service';
import logger from '../utils/logger';

// Schémas de validation
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email invalide',
    'any.required': 'Email requis',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
    'any.required': 'Mot de passe requis',
  }),
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required().messages({
    'string.min': 'Le nouveau mot de passe doit contenir au moins 8 caractères',
  }),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const { email, password } = value;
      const result = await authService.login(email, password);

      res.json({
        success: true,
        message: 'Connexion réussie',
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Erreur lors de la connexion:', err);

      const errorMessages: Record<string, { status: number; message: string }> = {
        EMAIL_NOT_FOUND: { status: 401, message: 'Email ou mot de passe incorrect' },
        INVALID_PASSWORD: { status: 401, message: 'Email ou mot de passe incorrect' },
        ACCOUNT_DISABLED: { status: 403, message: 'Compte désactivé' },
      };

      const errorInfo = errorMessages[err.message] || { status: 500, message: 'Erreur interne' };

      res.status(errorInfo.status).json({
        success: false,
        message: errorInfo.message,
        code: err.message,
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];
      const userInfo = req.headers['x-user-info'];

      if (!token || !userInfo) {
        res.status(401).json({
          success: false,
          message: 'Non authentifié',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      const user = JSON.parse(userInfo as string);
      await authService.logout(user.userId, token);

      res.json({
        success: true,
        message: 'Déconnexion réussie',
      });
    } catch (error) {
      logger.error('Erreur lors de la déconnexion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la déconnexion',
        code: 'LOGOUT_ERROR',
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = refreshTokenSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const tokens = await authService.refreshToken(value.refreshToken);

      res.json({
        success: true,
        message: 'Tokens rafraîchis',
        data: tokens,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Erreur lors du refresh token:', err);

      res.status(401).json({
        success: false,
        message: 'Token de rafraîchissement invalide',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = changePasswordSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const userInfo = req.headers['x-user-info'];
      if (!userInfo) {
        res.status(401).json({
          success: false,
          message: 'Non authentifié',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      const user = JSON.parse(userInfo as string);
      await authService.changePassword(user.userId, value.oldPassword, value.newPassword);

      res.json({
        success: true,
        message: 'Mot de passe modifié avec succès',
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Erreur lors du changement de mot de passe:', err);

      if (err.message === 'INVALID_OLD_PASSWORD') {
        res.status(400).json({
          success: false,
          message: 'Ancien mot de passe incorrect',
          code: 'INVALID_OLD_PASSWORD',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors du changement de mot de passe',
        code: 'CHANGE_PASSWORD_ERROR',
      });
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      if (!userInfo) {
        res.status(401).json({
          success: false,
          message: 'Non authentifié',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      const user = JSON.parse(userInfo as string);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération du profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

export default new AuthController();

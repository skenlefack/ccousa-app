import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../utils/database';
import { setToken, deleteToken, blacklistToken } from '../utils/redis';
import config from '../config';
import logger from '../utils/logger';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface UserSession {
  id: string;
  identifier: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  photoUrl: string | null;
  role: {
    id: string;
    code: string;
    name: string;
    level: number;
  };
  unit: {
    id: string;
    name: string;
  } | null;
  defaultLanguage: 'fr' | 'en';
  timezone: string;
}

interface LoginResult {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: UserSession;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export class AuthService {
  async login(email: string, password: string): Promise<LoginResult> {
    // Rechercher l'utilisateur avec toutes les informations nécessaires
    const result = await query(
      `SELECT
        u.id,
        u.identifier,
        u.email,
        u.password_hash,
        u.first_name,
        u.last_name,
        u.phone,
        u.photo_url,
        u.is_active,
        COALESCE(l.code, 'fr') as default_language,
        COALESCE(tz.code, 'Africa/Douala') as timezone,
        r.id as role_id,
        r.code as role_code,
        r.name as role_name,
        r.level as role_level,
        ou.id as unit_id,
        ou.name as unit_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN organizational_units ou ON u.organizational_unit_id = ou.id
       LEFT JOIN languages l ON u.default_language_id = l.id
       LEFT JOIN timezones tz ON u.default_timezone_id = tz.id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new Error('EMAIL_NOT_FOUND');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new Error('ACCOUNT_DISABLED');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      // Incrémenter le compteur de tentatives échouées
      await query(
        'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = $1',
        [user.id]
      );
      throw new Error('INVALID_PASSWORD');
    }

    // Réinitialiser les tentatives échouées et mettre à jour last_login_at
    await query(
      'UPDATE users SET failed_login_attempts = 0, last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Générer les tokens
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role_code,
      firstName: user.first_name,
      lastName: user.last_name,
    });

    // Stocker le refresh token dans Redis
    await setToken(
      `refresh:${user.id}`,
      tokens.refreshToken,
      7 * 24 * 60 * 60 // 7 jours
    );

    // Créer une session
    try {
      await query(
        `INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
        [user.id, tokens.refreshToken, '0.0.0.0', 'Unknown']
      );
    } catch (err) {
      // Ignorer l'erreur si la table n'existe pas encore
      logger.warn('Could not create user session:', err);
    }

    logger.info(`Connexion réussie pour: ${email}`);

    // Formater la réponse pour le frontend
    const userSession: UserSession = {
      id: user.id,
      identifier: user.identifier || `USR${user.id.toString().padStart(3, '0')}`,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone || null,
      photoUrl: user.photo_url || null,
      role: {
        id: user.role_id || '1',
        code: user.role_code || 'USER_SIMPLE',
        name: user.role_name || 'Utilisateur',
        level: user.role_level || 1,
      },
      unit: user.unit_id ? {
        id: user.unit_id,
        name: user.unit_name,
      } : null,
      defaultLanguage: (user.default_language as 'fr' | 'en') || 'fr',
      timezone: user.timezone || 'Africa/Douala',
    };

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresInSeconds,
      user: userSession,
    };
  }

  async logout(userId: string, token: string): Promise<void> {
    // Supprimer le refresh token de Redis
    await deleteToken(`refresh:${userId}`);

    // Blacklister le token actuel
    await blacklistToken(token, 24 * 60 * 60); // 24h

    // Désactiver la session
    await query(
      'UPDATE user_sessions SET is_active = false WHERE user_id = $1 AND token = $2',
      [userId, token]
    );

    logger.info(`Déconnexion réussie pour userId: ${userId}`);
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload;

      // Vérifier que l'utilisateur existe toujours et est actif
      const result = await query(
        `SELECT u.*, r.name as role_name
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.id = $1 AND u.is_active = true`,
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        throw new Error('USER_NOT_FOUND');
      }

      const user = result.rows[0];

      // Générer de nouveaux tokens
      const tokens = this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role_name,
        firstName: user.first_name,
        lastName: user.last_name,
      });

      // Mettre à jour le refresh token dans Redis
      await setToken(
        `refresh:${user.id}`,
        tokens.refreshToken,
        7 * 24 * 60 * 60
      );

      return tokens;
    } catch (error) {
      logger.error('Erreur lors du refresh token:', error);
      throw new Error('INVALID_REFRESH_TOKEN');
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, result.rows[0].password_hash);
    if (!isOldPasswordValid) {
      throw new Error('INVALID_OLD_PASSWORD');
    }

    const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

    await query(
      'UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );

    logger.info(`Mot de passe changé pour userId: ${userId}`);
  }

  private generateTokens(payload: TokenPayload): { accessToken: string; refreshToken: string; expiresInSeconds: number } {
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as string,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as string,
    } as jwt.SignOptions);

    // Convertir expiresIn en secondes
    const expiresInStr = config.jwt.expiresIn;
    let expiresInSeconds = 86400; // Par défaut 24h
    if (expiresInStr.endsWith('h')) {
      expiresInSeconds = parseInt(expiresInStr) * 3600;
    } else if (expiresInStr.endsWith('d')) {
      expiresInSeconds = parseInt(expiresInStr) * 86400;
    } else if (expiresInStr.endsWith('m')) {
      expiresInSeconds = parseInt(expiresInStr) * 60;
    }

    return {
      accessToken,
      refreshToken,
      expiresInSeconds,
    };
  }
}

export default new AuthService();

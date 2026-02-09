import { Request, Response } from 'express';
import configService from '../services/config.service';
import logger from '../utils/logger';

export class ConfigController {
  // ===========================================
  // System Settings
  // ===========================================

  async getSystemSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await configService.getSystemSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      logger.error('Erreur getSystemSettings:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getSettingByKey(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const setting = await configService.getSettingByKey(key);
      res.json({ success: true, data: setting });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'SETTING_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Paramètre non trouvé' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async updateSetting(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const { value } = req.body;
      if (value === undefined) {
        res.status(400).json({ success: false, message: 'Valeur requise' });
        return;
      }
      const setting = await configService.updateSetting(key, String(value));
      res.json({ success: true, data: setting });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'SETTING_NOT_FOUND_OR_NOT_EDITABLE') {
        res.status(404).json({ success: false, message: 'Paramètre non trouvé ou non modifiable' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async bulkUpdateSettings(req: Request, res: Response): Promise<void> {
    try {
      const { configurations } = req.body;
      if (!Array.isArray(configurations)) {
        res.status(400).json({ success: false, message: 'Tableau de configurations requis' });
        return;
      }
      const results = await configService.bulkUpdateSettings(configurations);
      res.json({ success: true, data: results });
    } catch (error) {
      logger.error('Erreur bulkUpdateSettings:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  // ===========================================
  // Event Categories
  // ===========================================

  async getEventCategories(req: Request, res: Response): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await configService.getEventCategories(includeInactive);
      res.json({ success: true, data: categories });
    } catch (error) {
      logger.error('Erreur getEventCategories:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getEventCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const category = await configService.getEventCategoryById(id);
      res.json({ success: true, data: category });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'CATEGORY_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async createEventCategory(req: Request, res: Response): Promise<void> {
    try {
      const { code, name, description, color, icon, sortOrder, isActive } = req.body;
      if (!code || !name || !color) {
        res.status(400).json({ success: false, message: 'Code, nom et couleur requis' });
        return;
      }
      const category = await configService.createEventCategory({
        code, name, description, color, icon, sortOrder, isActive
      });
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      logger.error('Erreur createEventCategory:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async updateEventCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const category = await configService.updateEventCategory(id, req.body);
      res.json({ success: true, data: category });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'CATEGORY_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async deleteEventCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await configService.deleteEventCategory(id);
      res.json({ success: true, message: 'Catégorie supprimée' });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'CATEGORY_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async reorderEventCategories(req: Request, res: Response): Promise<void> {
    try {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        res.status(400).json({ success: false, message: 'Tableau d\'IDs requis' });
        return;
      }
      await configService.reorderEventCategories(orderedIds);
      res.json({ success: true, message: 'Catégories réordonnées' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  // ===========================================
  // Document Types
  // ===========================================

  async getDocumentTypes(req: Request, res: Response): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const types = await configService.getDocumentTypes(includeInactive);
      res.json({ success: true, data: types });
    } catch (error) {
      logger.error('Erreur getDocumentTypes:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getDocumentTypeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const type = await configService.getDocumentTypeById(id);
      res.json({ success: true, data: type });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'DOCUMENT_TYPE_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Type de document non trouvé' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async createDocumentType(req: Request, res: Response): Promise<void> {
    try {
      const { code, name, description, allowedExtensions, maxSizeBytes, isRequired, sortOrder, isActive } = req.body;
      if (!code || !name) {
        res.status(400).json({ success: false, message: 'Code et nom requis' });
        return;
      }
      const type = await configService.createDocumentType({
        code, name, description, allowedExtensions, maxSizeBytes, isRequired, sortOrder, isActive
      });
      res.status(201).json({ success: true, data: type });
    } catch (error) {
      logger.error('Erreur createDocumentType:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async updateDocumentType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const type = await configService.updateDocumentType(id, req.body);
      res.json({ success: true, data: type });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'DOCUMENT_TYPE_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Type de document non trouvé' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async deleteDocumentType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await configService.deleteDocumentType(id);
      res.json({ success: true, message: 'Type de document supprimé' });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'DOCUMENT_TYPE_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Type de document non trouvé' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  // ===========================================
  // Event Provenances (Origins)
  // ===========================================

  async getEventProvenances(req: Request, res: Response): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const provenances = await configService.getEventProvenances(includeInactive);
      res.json({ success: true, data: provenances });
    } catch (error) {
      logger.error('Erreur getEventProvenances:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getEventProvenanceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const provenance = await configService.getEventProvenanceById(id);
      res.json({ success: true, data: provenance });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'PROVENANCE_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Provenance non trouvée' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async createEventProvenance(req: Request, res: Response): Promise<void> {
    try {
      const provenance = await configService.createEventProvenance(req.body);
      res.status(201).json({ success: true, data: provenance });
    } catch (error) {
      logger.error('Erreur createEventProvenance:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async updateEventProvenance(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const provenance = await configService.updateEventProvenance(id, req.body);
      res.json({ success: true, data: provenance });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'PROVENANCE_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Provenance non trouvée' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async deleteEventProvenance(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await configService.deleteEventProvenance(id);
      res.json({ success: true, message: 'Provenance supprimée' });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'PROVENANCE_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Provenance non trouvée' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  // ===========================================
  // Organizational Units
  // ===========================================

  async getOrganizationalUnits(req: Request, res: Response): Promise<void> {
    try {
      const asTree = req.query.asTree === 'true';
      const units = await configService.getOrganizationalUnits(asTree);
      res.json({ success: true, data: units });
    } catch (error) {
      logger.error('Erreur getOrganizationalUnits:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getOrganizationalUnitById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const unit = await configService.getOrganizationalUnitById(id);
      res.json({ success: true, data: unit });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'UNIT_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Unité non trouvée' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async createOrganizationalUnit(req: Request, res: Response): Promise<void> {
    try {
      const { code, name, type, parentId, latitude, longitude, isActive } = req.body;
      if (!code || !name || !type) {
        res.status(400).json({ success: false, message: 'Code, nom et type requis' });
        return;
      }
      const unit = await configService.createOrganizationalUnit({
        code, name, type, parentId, latitude, longitude, isActive
      });
      res.status(201).json({ success: true, data: unit });
    } catch (error) {
      logger.error('Erreur createOrganizationalUnit:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async updateOrganizationalUnit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const unit = await configService.updateOrganizationalUnit(id, req.body);
      res.json({ success: true, data: unit });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'UNIT_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Unité non trouvée' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async deleteOrganizationalUnit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await configService.deleteOrganizationalUnit(id);
      res.json({ success: true, message: 'Unité supprimée' });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'UNIT_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Unité non trouvée' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  // ===========================================
  // Work Schedules
  // ===========================================

  async getWorkSchedules(req: Request, res: Response): Promise<void> {
    try {
      const schedules = await configService.getWorkSchedules();
      res.json({ success: true, data: schedules });
    } catch (error) {
      logger.error('Erreur getWorkSchedules:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getWorkScheduleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schedule = await configService.getWorkScheduleById(id);
      res.json({ success: true, data: schedule });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'SCHEDULE_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Horaire non trouvé' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async createWorkSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { code, name, description, timezoneId, startDate, endDate, isDefault, isActive, days } = req.body;
      if (!code || !name || !timezoneId || !Array.isArray(days)) {
        res.status(400).json({ success: false, message: 'Code, nom, fuseau horaire et jours requis' });
        return;
      }
      const schedule = await configService.createWorkSchedule({
        code, name, description, timezoneId, startDate, endDate, isDefault, isActive, days
      });
      res.status(201).json({ success: true, data: schedule });
    } catch (error) {
      logger.error('Erreur createWorkSchedule:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async updateWorkSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { days, ...scheduleData } = req.body;

      // Update main schedule data
      let schedule = await configService.updateWorkSchedule(id, scheduleData);

      // If days are provided, update them too
      if (Array.isArray(days) && days.length > 0) {
        schedule = await configService.updateWorkScheduleDays(id, days);
      }

      res.json({ success: true, data: schedule });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'SCHEDULE_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Horaire non trouvé' });
        return;
      }
      logger.error('Erreur updateWorkSchedule:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async updateWorkScheduleDays(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { days } = req.body;
      if (!Array.isArray(days)) {
        res.status(400).json({ success: false, message: 'Tableau de jours requis' });
        return;
      }
      const schedule = await configService.updateWorkScheduleDays(id, days);
      res.json({ success: true, data: schedule });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async deleteWorkSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await configService.deleteWorkSchedule(id);
      res.json({ success: true, message: 'Horaire supprimé' });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'SCHEDULE_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Horaire non trouvé' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  // ===========================================
  // Reference Data
  // ===========================================

  async getCountries(req: Request, res: Response): Promise<void> {
    try {
      const countries = await configService.getCountries();
      res.json({ success: true, data: countries });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getLanguages(req: Request, res: Response): Promise<void> {
    try {
      const languages = await configService.getLanguages();
      res.json({ success: true, data: languages });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getTimezones(req: Request, res: Response): Promise<void> {
    try {
      const timezones = await configService.getTimezones();
      res.json({ success: true, data: timezones });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getReferenceData(req: Request, res: Response): Promise<void> {
    try {
      const data = await configService.getReferenceData();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }
}

export default new ConfigController();

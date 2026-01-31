import { Request, Response } from 'express';
import Joi from 'joi';
import knowledgeService from '../services/knowledge.service';
import logger from '../utils/logger';

// Validation schemas
const articleSchema = Joi.object({
  title: Joi.string().min(5).max(300).required(),
  content: Joi.string().min(10).required(),
  excerpt: Joi.string().max(500).optional().allow(null, ''),
  categoryId: Joi.string().uuid().required(),
  tagIds: Joi.array().items(Joi.string().uuid()).optional(),
  coverImage: Joi.string().uri().optional().allow(null, ''),
  isPublished: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional(),
});

const updateArticleSchema = Joi.object({
  title: Joi.string().min(5).max(300).optional(),
  content: Joi.string().min(10).optional(),
  excerpt: Joi.string().max(500).optional().allow(null, ''),
  categoryId: Joi.string().uuid().optional(),
  tagIds: Joi.array().items(Joi.string().uuid()).optional(),
  coverImage: Joi.string().uri().optional().allow(null, ''),
  isPublished: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional(),
  isPinned: Joi.boolean().optional(),
});

const categorySchema = Joi.object({
  code: Joi.string().min(2).max(50).required(),
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional().allow(null, ''),
  icon: Joi.string().max(50).optional().allow(null, ''),
  color: Joi.string().max(20).optional().allow(null, ''),
  parentId: Joi.string().uuid().optional().allow(null, ''),
});

const tagSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  color: Joi.string().max(20).optional().allow(null, ''),
});

const commentSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
  parentId: Joi.string().uuid().optional().allow(null, ''),
});

// Error messages
const errorMessages: Record<string, { status: number; message: string }> = {
  ARTICLE_NOT_FOUND: { status: 404, message: 'Article non trouvé' },
  CATEGORY_NOT_FOUND: { status: 404, message: 'Catégorie non trouvée' },
  TAG_NOT_FOUND: { status: 404, message: 'Tag non trouvé' },
  COMMENT_NOT_FOUND: { status: 404, message: 'Commentaire non trouvé' },
  NO_FIELDS_TO_UPDATE: { status: 400, message: 'Aucun champ à mettre à jour' },
};

export class KnowledgeController {
  // ===========================================
  // ARTICLES
  // ===========================================

  async getArticles(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        categoryId: req.query.categoryId as string,
        tagId: req.query.tagId as string,
        authorId: req.query.authorId as string,
        isPublished: req.query.isPublished === 'true' ? true : req.query.isPublished === 'false' ? false : undefined,
        isFeatured: req.query.isFeatured === 'true' ? true : undefined,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await knowledgeService.getArticles(params);
      res.json({ success: true, data: result.articles, pagination: result.pagination });
    } catch (error) {
      logger.error('Erreur getArticles:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async getArticleById(req: Request, res: Response): Promise<void> {
    try {
      const article = await knowledgeService.getArticleById(req.params.id);
      res.json({ success: true, data: article });
    } catch (error) {
      const err = error as Error;
      const errorInfo = errorMessages[err.message];
      if (errorInfo) {
        res.status(errorInfo.status).json({ success: false, message: errorInfo.message, code: err.message });
        return;
      }
      logger.error('Erreur getArticleById:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async createArticle(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = articleSchema.validate(req.body);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message, code: 'VALIDATION_ERROR' });
        return;
      }

      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;

      const article = await knowledgeService.createArticle({ ...value, createdBy: user?.userId });
      res.status(201).json({ success: true, message: 'Article créé avec succès', data: article });
    } catch (error) {
      logger.error('Erreur createArticle:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async updateArticle(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateArticleSchema.validate(req.body);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message, code: 'VALIDATION_ERROR' });
        return;
      }

      const article = await knowledgeService.updateArticle(req.params.id, value);
      res.json({ success: true, message: 'Article mis à jour avec succès', data: article });
    } catch (error) {
      const err = error as Error;
      const errorInfo = errorMessages[err.message];
      if (errorInfo) {
        res.status(errorInfo.status).json({ success: false, message: errorInfo.message, code: err.message });
        return;
      }
      logger.error('Erreur updateArticle:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async deleteArticle(req: Request, res: Response): Promise<void> {
    try {
      await knowledgeService.deleteArticle(req.params.id);
      res.json({ success: true, message: 'Article supprimé avec succès' });
    } catch (error) {
      const err = error as Error;
      const errorInfo = errorMessages[err.message];
      if (errorInfo) {
        res.status(errorInfo.status).json({ success: false, message: errorInfo.message, code: err.message });
        return;
      }
      logger.error('Erreur deleteArticle:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async publishArticle(req: Request, res: Response): Promise<void> {
    try {
      const article = await knowledgeService.publishArticle(req.params.id);
      res.json({ success: true, message: 'Article publié avec succès', data: article });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'ARTICLE_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Article non trouvé', code: 'ARTICLE_NOT_FOUND' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async unpublishArticle(req: Request, res: Response): Promise<void> {
    try {
      const article = await knowledgeService.unpublishArticle(req.params.id);
      res.json({ success: true, message: 'Article dépublié avec succès', data: article });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'ARTICLE_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Article non trouvé', code: 'ARTICLE_NOT_FOUND' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async toggleFeatured(req: Request, res: Response): Promise<void> {
    try {
      const article = await knowledgeService.toggleFeatured(req.params.id);
      res.json({ success: true, data: article });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'ARTICLE_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Article non trouvé', code: 'ARTICLE_NOT_FOUND' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async likeArticle(req: Request, res: Response): Promise<void> {
    try {
      const result = await knowledgeService.likeArticle(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'ARTICLE_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Article non trouvé', code: 'ARTICLE_NOT_FOUND' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async getFeaturedArticles(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const articles = await knowledgeService.getFeaturedArticles(limit);
      res.json({ success: true, data: articles });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async getPopularArticles(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const articles = await knowledgeService.getPopularArticles(limit);
      res.json({ success: true, data: articles });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async getRecentArticles(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const articles = await knowledgeService.getRecentArticles(limit);
      res.json({ success: true, data: articles });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async getRelatedArticles(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const articles = await knowledgeService.getRelatedArticles(req.params.id, limit);
      res.json({ success: true, data: articles });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  // ===========================================
  // CATEGORIES
  // ===========================================

  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await knowledgeService.getCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const category = await knowledgeService.getCategoryById(req.params.id);
      res.json({ success: true, data: category });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'CATEGORY_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Catégorie non trouvée', code: 'CATEGORY_NOT_FOUND' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = categorySchema.validate(req.body);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message, code: 'VALIDATION_ERROR' });
        return;
      }

      const category = await knowledgeService.createCategory(value);
      res.status(201).json({ success: true, message: 'Catégorie créée avec succès', data: category });
    } catch (error) {
      logger.error('Erreur createCategory:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const category = await knowledgeService.updateCategory(req.params.id, req.body);
      res.json({ success: true, message: 'Catégorie mise à jour avec succès', data: category });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'CATEGORY_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Catégorie non trouvée', code: 'CATEGORY_NOT_FOUND' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      await knowledgeService.deleteCategory(req.params.id);
      res.json({ success: true, message: 'Catégorie supprimée avec succès' });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'CATEGORY_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Catégorie non trouvée', code: 'CATEGORY_NOT_FOUND' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  // ===========================================
  // TAGS
  // ===========================================

  async getTags(req: Request, res: Response): Promise<void> {
    try {
      const tags = await knowledgeService.getTags();
      res.json({ success: true, data: tags });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async getPopularTags(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const tags = await knowledgeService.getPopularTags(limit);
      res.json({ success: true, data: tags });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async createTag(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = tagSchema.validate(req.body);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message, code: 'VALIDATION_ERROR' });
        return;
      }

      const tag = await knowledgeService.createTag(value);
      res.status(201).json({ success: true, message: 'Tag créé avec succès', data: tag });
    } catch (error) {
      logger.error('Erreur createTag:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async deleteTag(req: Request, res: Response): Promise<void> {
    try {
      await knowledgeService.deleteTag(req.params.id);
      res.json({ success: true, message: 'Tag supprimé avec succès' });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'TAG_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Tag non trouvé', code: 'TAG_NOT_FOUND' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  // ===========================================
  // SEARCH
  // ===========================================

  async search(req: Request, res: Response): Promise<void> {
    try {
      const q = req.query.q as string;
      if (!q || q.length < 2) {
        res.status(400).json({ success: false, message: 'Terme de recherche trop court', code: 'VALIDATION_ERROR' });
        return;
      }

      const options = {
        categoryId: req.query.categoryId as string,
        limit: parseInt(req.query.limit as string) || 20,
      };

      const results = await knowledgeService.searchArticles(q, options);
      res.json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async getSearchSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const q = req.query.q as string;
      if (!q || q.length < 2) {
        res.json({ success: true, data: [] });
        return;
      }

      const suggestions = await knowledgeService.getSearchSuggestions(q);
      res.json({ success: true, data: suggestions });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  // ===========================================
  // COMMENTS
  // ===========================================

  async getComments(req: Request, res: Response): Promise<void> {
    try {
      const comments = await knowledgeService.getComments(req.params.id);
      res.json({ success: true, data: comments });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async createComment(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = commentSchema.validate(req.body);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message, code: 'VALIDATION_ERROR' });
        return;
      }

      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;

      const comment = await knowledgeService.createComment(req.params.id, {
        ...value,
        userId: user?.userId,
      });
      res.status(201).json({ success: true, message: 'Commentaire ajouté', data: comment });
    } catch (error) {
      logger.error('Erreur createComment:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async updateComment(req: Request, res: Response): Promise<void> {
    try {
      const { content } = req.body;
      if (!content) {
        res.status(400).json({ success: false, message: 'Contenu requis', code: 'VALIDATION_ERROR' });
        return;
      }

      const comment = await knowledgeService.updateComment(req.params.commentId, content);
      res.json({ success: true, message: 'Commentaire mis à jour', data: comment });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'COMMENT_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Commentaire non trouvé', code: 'COMMENT_NOT_FOUND' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      await knowledgeService.deleteComment(req.params.commentId);
      res.json({ success: true, message: 'Commentaire supprimé' });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'COMMENT_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Commentaire non trouvé', code: 'COMMENT_NOT_FOUND' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  async likeComment(req: Request, res: Response): Promise<void> {
    try {
      const result = await knowledgeService.likeComment(req.params.commentId);
      res.json({ success: true, data: result });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'COMMENT_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Commentaire non trouvé', code: 'COMMENT_NOT_FOUND' });
        return;
      }
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }

  // ===========================================
  // STATS
  // ===========================================

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await knowledgeService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('Erreur getStats:', error);
      res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_ERROR' });
    }
  }
}

export default new KnowledgeController();

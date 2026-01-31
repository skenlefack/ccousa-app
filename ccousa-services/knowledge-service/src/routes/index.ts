import { Router, Request, Response } from 'express';
import knowledgeController from '../controllers/knowledge.controller';
import { checkConnection } from '../utils/database';

const router = Router();

// Health check
router.get('/health', async (req: Request, res: Response) => {
  const db = await checkConnection();
  res.json({
    success: true,
    service: 'knowledge-service',
    status: 'healthy',
    checks: { database: db ? 'connected' : 'disconnected' }
  });
});

// Stats
router.get('/stats', (req, res) => knowledgeController.getStats(req, res));

// Search routes
router.get('/search', (req, res) => knowledgeController.search(req, res));
router.get('/search/suggestions', (req, res) => knowledgeController.getSearchSuggestions(req, res));

// Category routes
router.get('/categories', (req, res) => knowledgeController.getCategories(req, res));
router.post('/categories', (req, res) => knowledgeController.createCategory(req, res));
router.get('/categories/:id', (req, res) => knowledgeController.getCategoryById(req, res));
router.put('/categories/:id', (req, res) => knowledgeController.updateCategory(req, res));
router.delete('/categories/:id', (req, res) => knowledgeController.deleteCategory(req, res));

// Tag routes
router.get('/tags', (req, res) => knowledgeController.getTags(req, res));
router.get('/tags/popular', (req, res) => knowledgeController.getPopularTags(req, res));
router.post('/tags', (req, res) => knowledgeController.createTag(req, res));
router.delete('/tags/:id', (req, res) => knowledgeController.deleteTag(req, res));

// Article collection routes (must come before :id routes)
router.get('/articles/featured', (req, res) => knowledgeController.getFeaturedArticles(req, res));
router.get('/articles/popular', (req, res) => knowledgeController.getPopularArticles(req, res));
router.get('/articles/recent', (req, res) => knowledgeController.getRecentArticles(req, res));

// Article CRUD routes
router.get('/articles', (req, res) => knowledgeController.getArticles(req, res));
router.post('/articles', (req, res) => knowledgeController.createArticle(req, res));
router.get('/articles/:id', (req, res) => knowledgeController.getArticleById(req, res));
router.put('/articles/:id', (req, res) => knowledgeController.updateArticle(req, res));
router.delete('/articles/:id', (req, res) => knowledgeController.deleteArticle(req, res));

// Article action routes
router.post('/articles/:id/publish', (req, res) => knowledgeController.publishArticle(req, res));
router.post('/articles/:id/unpublish', (req, res) => knowledgeController.unpublishArticle(req, res));
router.post('/articles/:id/toggle-featured', (req, res) => knowledgeController.toggleFeatured(req, res));
router.post('/articles/:id/like', (req, res) => knowledgeController.likeArticle(req, res));

// Article related content routes
router.get('/articles/:id/related', (req, res) => knowledgeController.getRelatedArticles(req, res));

// Article comments routes
router.get('/articles/:id/comments', (req, res) => knowledgeController.getComments(req, res));
router.post('/articles/:id/comments', (req, res) => knowledgeController.createComment(req, res));

// Comment routes
router.put('/comments/:commentId', (req, res) => knowledgeController.updateComment(req, res));
router.delete('/comments/:commentId', (req, res) => knowledgeController.deleteComment(req, res));
router.post('/comments/:commentId/like', (req, res) => knowledgeController.likeComment(req, res));

export default router;

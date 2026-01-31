import { query } from '../utils/database';
import logger from '../utils/logger';

interface ArticleQueryParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  tagId?: string;
  authorId?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateArticleDto {
  title: string;
  content: string;
  excerpt?: string;
  categoryId: string;
  tagIds?: string[];
  coverImage?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  createdBy: string;
}

interface UpdateArticleDto {
  title?: string;
  content?: string;
  excerpt?: string;
  categoryId?: string;
  tagIds?: string[];
  coverImage?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  isPinned?: boolean;
}

export class KnowledgeService {
  // ===========================================
  // ARTICLES
  // ===========================================

  async getArticles(params: ArticleQueryParams = {}) {
    const { page = 1, limit = 20, categoryId, tagId, authorId, isPublished, isFeatured, search, sortBy = 'created_at', sortOrder = 'desc' } = params;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT a.*, c.name as category_name,
             u.first_name || ' ' || u.last_name as author_name,
             (SELECT COUNT(*) FROM knowledge_comments WHERE article_id = a.id) as comment_count
      FROM knowledge_articles a
      LEFT JOIN knowledge_categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE 1=1
    `;
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (isPublished !== undefined) {
      sql += ` AND a.is_published = $${paramIndex++}`;
      queryParams.push(isPublished);
    }

    if (isFeatured !== undefined) {
      sql += ` AND a.is_featured = $${paramIndex++}`;
      queryParams.push(isFeatured);
    }

    if (categoryId) {
      sql += ` AND a.category_id = $${paramIndex++}`;
      queryParams.push(categoryId);
    }

    if (authorId) {
      sql += ` AND a.created_by = $${paramIndex++}`;
      queryParams.push(authorId);
    }

    if (search) {
      sql += ` AND (a.title ILIKE $${paramIndex} OR a.content ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (tagId) {
      sql += ` AND EXISTS (SELECT 1 FROM knowledge_article_tags at WHERE at.article_id = a.id AND at.tag_id = $${paramIndex++})`;
      queryParams.push(tagId);
    }

    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['created_at', 'updated_at', 'title', 'view_count', 'like_count'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    sql += ` ORDER BY a.is_pinned DESC, a.${sortColumn} ${order}`;
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);

    const result = await query(sql, queryParams);

    // Count total
    let countSql = 'SELECT COUNT(*) FROM knowledge_articles a WHERE 1=1';
    const countParams: unknown[] = [];
    let countIndex = 1;

    if (isPublished !== undefined) {
      countSql += ` AND a.is_published = $${countIndex++}`;
      countParams.push(isPublished);
    }
    if (categoryId) {
      countSql += ` AND a.category_id = $${countIndex++}`;
      countParams.push(categoryId);
    }
    if (search) {
      countSql += ` AND (a.title ILIKE $${countIndex} OR a.content ILIKE $${countIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    return {
      articles: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getArticleById(id: string) {
    const result = await query(
      `SELECT a.*, c.name as category_name,
              u.first_name || ' ' || u.last_name as author_name,
              (SELECT COUNT(*) FROM knowledge_comments WHERE article_id = a.id) as comment_count
       FROM knowledge_articles a
       LEFT JOIN knowledge_categories c ON a.category_id = c.id
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) throw new Error('ARTICLE_NOT_FOUND');

    // Increment view count
    await query('UPDATE knowledge_articles SET view_count = view_count + 1 WHERE id = $1', [id]);

    // Get tags
    const tagsResult = await query(
      `SELECT t.* FROM knowledge_tags t
       JOIN knowledge_article_tags at ON t.id = at.tag_id
       WHERE at.article_id = $1`,
      [id]
    );

    return { ...result.rows[0], tags: tagsResult.rows };
  }

  async createArticle(data: CreateArticleDto) {
    const slug = this.generateSlug(data.title);

    const result = await query(
      `INSERT INTO knowledge_articles (title, slug, content, excerpt, category_id, cover_image, is_published, is_featured, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [data.title, slug, data.content, data.excerpt || null, data.categoryId, data.coverImage || null, data.isPublished ?? false, data.isFeatured ?? false, data.createdBy]
    );

    const article = result.rows[0];

    // Add tags
    if (data.tagIds && data.tagIds.length > 0) {
      for (const tagId of data.tagIds) {
        await query('INSERT INTO knowledge_article_tags (article_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [article.id, tagId]);
      }
    }

    logger.info(`Article créé: ${article.id}`);
    return article;
  }

  async updateArticle(id: string, data: UpdateArticleDto) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(data.title);
      fields.push(`slug = $${paramCount++}`);
      values.push(this.generateSlug(data.title));
    }
    if (data.content !== undefined) {
      fields.push(`content = $${paramCount++}`);
      values.push(data.content);
    }
    if (data.excerpt !== undefined) {
      fields.push(`excerpt = $${paramCount++}`);
      values.push(data.excerpt);
    }
    if (data.categoryId !== undefined) {
      fields.push(`category_id = $${paramCount++}`);
      values.push(data.categoryId);
    }
    if (data.coverImage !== undefined) {
      fields.push(`cover_image = $${paramCount++}`);
      values.push(data.coverImage || null);
    }
    if (data.isPublished !== undefined) {
      fields.push(`is_published = $${paramCount++}`);
      values.push(data.isPublished);
      if (data.isPublished) {
        fields.push(`published_at = NOW()`);
      }
    }
    if (data.isFeatured !== undefined) {
      fields.push(`is_featured = $${paramCount++}`);
      values.push(data.isFeatured);
    }
    if (data.isPinned !== undefined) {
      fields.push(`is_pinned = $${paramCount++}`);
      values.push(data.isPinned);
    }

    if (fields.length === 0) throw new Error('NO_FIELDS_TO_UPDATE');

    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await query(
      `UPDATE knowledge_articles SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) throw new Error('ARTICLE_NOT_FOUND');

    // Update tags if provided
    if (data.tagIds !== undefined) {
      await query('DELETE FROM knowledge_article_tags WHERE article_id = $1', [id]);
      for (const tagId of data.tagIds) {
        await query('INSERT INTO knowledge_article_tags (article_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, tagId]);
      }
    }

    logger.info(`Article mis à jour: ${id}`);
    return result.rows[0];
  }

  async deleteArticle(id: string) {
    const result = await query('DELETE FROM knowledge_articles WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) throw new Error('ARTICLE_NOT_FOUND');
    logger.info(`Article supprimé: ${id}`);
    return { id };
  }

  async publishArticle(id: string) {
    return this.updateArticle(id, { isPublished: true });
  }

  async unpublishArticle(id: string) {
    return this.updateArticle(id, { isPublished: false });
  }

  async toggleFeatured(id: string) {
    const article = await this.getArticleById(id);
    return this.updateArticle(id, { isFeatured: !article.is_featured });
  }

  async likeArticle(id: string) {
    const result = await query(
      'UPDATE knowledge_articles SET like_count = like_count + 1 WHERE id = $1 RETURNING like_count',
      [id]
    );
    if (result.rows.length === 0) throw new Error('ARTICLE_NOT_FOUND');
    return { likeCount: result.rows[0].like_count };
  }

  async getFeaturedArticles(limit = 5) {
    const result = await query(
      `SELECT a.*, c.name as category_name, u.first_name || ' ' || u.last_name as author_name
       FROM knowledge_articles a
       LEFT JOIN knowledge_categories c ON a.category_id = c.id
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.is_published = true AND a.is_featured = true
       ORDER BY a.created_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getPopularArticles(limit = 10) {
    const result = await query(
      `SELECT a.*, c.name as category_name, u.first_name || ' ' || u.last_name as author_name
       FROM knowledge_articles a
       LEFT JOIN knowledge_categories c ON a.category_id = c.id
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.is_published = true
       ORDER BY a.view_count DESC LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getRecentArticles(limit = 10) {
    const result = await query(
      `SELECT a.*, c.name as category_name, u.first_name || ' ' || u.last_name as author_name
       FROM knowledge_articles a
       LEFT JOIN knowledge_categories c ON a.category_id = c.id
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.is_published = true
       ORDER BY a.created_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getRelatedArticles(articleId: string, limit = 5) {
    const article = await this.getArticleById(articleId);
    const result = await query(
      `SELECT a.*, c.name as category_name
       FROM knowledge_articles a
       LEFT JOIN knowledge_categories c ON a.category_id = c.id
       WHERE a.is_published = true AND a.id != $1 AND a.category_id = $2
       ORDER BY a.created_at DESC LIMIT $3`,
      [articleId, article.category_id, limit]
    );
    return result.rows;
  }

  // ===========================================
  // CATEGORIES
  // ===========================================

  async getCategories() {
    const result = await query(
      `SELECT c.*, (SELECT COUNT(*) FROM knowledge_articles WHERE category_id = c.id AND is_published = true) as article_count
       FROM knowledge_categories c
       WHERE c.is_active = true
       ORDER BY c.sort_order, c.name`
    );
    return result.rows;
  }

  async getCategoryById(id: string) {
    const result = await query(
      `SELECT c.*, (SELECT COUNT(*) FROM knowledge_articles WHERE category_id = c.id) as article_count
       FROM knowledge_categories c WHERE c.id = $1`,
      [id]
    );
    if (result.rows.length === 0) throw new Error('CATEGORY_NOT_FOUND');
    return result.rows[0];
  }

  async createCategory(data: { code: string; name: string; description?: string; icon?: string; color?: string; parentId?: string }) {
    const result = await query(
      `INSERT INTO knowledge_categories (code, name, description, icon, color, parent_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.code, data.name, data.description || null, data.icon || null, data.color || null, data.parentId || null]
    );
    logger.info(`Catégorie créée: ${result.rows[0].id}`);
    return result.rows[0];
  }

  async updateCategory(id: string, data: { name?: string; description?: string; icon?: string; color?: string; parentId?: string; isActive?: boolean }) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (data.name) { fields.push(`name = $${i++}`); values.push(data.name); }
    if (data.description !== undefined) { fields.push(`description = $${i++}`); values.push(data.description); }
    if (data.icon !== undefined) { fields.push(`icon = $${i++}`); values.push(data.icon); }
    if (data.color !== undefined) { fields.push(`color = $${i++}`); values.push(data.color); }
    if (data.parentId !== undefined) { fields.push(`parent_id = $${i++}`); values.push(data.parentId || null); }
    if (data.isActive !== undefined) { fields.push(`is_active = $${i++}`); values.push(data.isActive); }

    if (fields.length === 0) throw new Error('NO_FIELDS_TO_UPDATE');
    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await query(`UPDATE knowledge_categories SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, values);
    if (result.rows.length === 0) throw new Error('CATEGORY_NOT_FOUND');
    return result.rows[0];
  }

  async deleteCategory(id: string) {
    const result = await query('DELETE FROM knowledge_categories WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) throw new Error('CATEGORY_NOT_FOUND');
    return { id };
  }

  // ===========================================
  // TAGS
  // ===========================================

  async getTags() {
    const result = await query(
      `SELECT t.*, (SELECT COUNT(*) FROM knowledge_article_tags WHERE tag_id = t.id) as article_count
       FROM knowledge_tags t ORDER BY t.name`
    );
    return result.rows;
  }

  async getPopularTags(limit = 20) {
    const result = await query(
      `SELECT t.*, (SELECT COUNT(*) FROM knowledge_article_tags WHERE tag_id = t.id) as article_count
       FROM knowledge_tags t
       ORDER BY article_count DESC LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async createTag(data: { name: string; color?: string }) {
    const slug = this.generateSlug(data.name);
    const result = await query(
      `INSERT INTO knowledge_tags (name, slug, color) VALUES ($1, $2, $3) RETURNING *`,
      [data.name, slug, data.color || null]
    );
    return result.rows[0];
  }

  async deleteTag(id: string) {
    await query('DELETE FROM knowledge_article_tags WHERE tag_id = $1', [id]);
    const result = await query('DELETE FROM knowledge_tags WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) throw new Error('TAG_NOT_FOUND');
    return { id };
  }

  // ===========================================
  // SEARCH
  // ===========================================

  async searchArticles(searchTerm: string, options: { categoryId?: string; limit?: number } = {}) {
    const { categoryId, limit = 20 } = options;

    let sql = `
      SELECT a.id, a.title, LEFT(a.content, 200) as excerpt, a.created_at, c.name as category_name,
             ts_rank(to_tsvector('french', a.title || ' ' || a.content), plainto_tsquery('french', $1)) as relevance_score
      FROM knowledge_articles a
      LEFT JOIN knowledge_categories c ON a.category_id = c.id
      WHERE a.is_published = true AND (a.title ILIKE $2 OR a.content ILIKE $2)
    `;
    const params: unknown[] = [searchTerm, `%${searchTerm}%`];
    let paramIndex = 3;

    if (categoryId) {
      sql += ` AND a.category_id = $${paramIndex++}`;
      params.push(categoryId);
    }

    sql += ` ORDER BY relevance_score DESC, a.created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await query(sql, params);
    return result.rows;
  }

  async getSearchSuggestions(searchTerm: string) {
    const result = await query(
      `SELECT DISTINCT title FROM knowledge_articles
       WHERE is_published = true AND title ILIKE $1
       ORDER BY title LIMIT 10`,
      [`%${searchTerm}%`]
    );
    return result.rows.map(r => r.title);
  }

  // ===========================================
  // COMMENTS
  // ===========================================

  async getComments(articleId: string) {
    const result = await query(
      `SELECT c.*, u.first_name || ' ' || u.last_name as user_name
       FROM knowledge_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.article_id = $1
       ORDER BY c.created_at ASC`,
      [articleId]
    );
    return result.rows;
  }

  async createComment(articleId: string, data: { content: string; userId: string; parentId?: string }) {
    const result = await query(
      `INSERT INTO knowledge_comments (article_id, user_id, content, parent_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [articleId, data.userId, data.content, data.parentId || null]
    );
    return result.rows[0];
  }

  async updateComment(commentId: string, content: string) {
    const result = await query(
      `UPDATE knowledge_comments SET content = $1, is_edited = true, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [content, commentId]
    );
    if (result.rows.length === 0) throw new Error('COMMENT_NOT_FOUND');
    return result.rows[0];
  }

  async deleteComment(commentId: string) {
    const result = await query('DELETE FROM knowledge_comments WHERE id = $1 RETURNING id', [commentId]);
    if (result.rows.length === 0) throw new Error('COMMENT_NOT_FOUND');
    return { id: commentId };
  }

  async likeComment(commentId: string) {
    const result = await query(
      'UPDATE knowledge_comments SET like_count = like_count + 1 WHERE id = $1 RETURNING like_count',
      [commentId]
    );
    if (result.rows.length === 0) throw new Error('COMMENT_NOT_FOUND');
    return { likeCount: result.rows[0].like_count };
  }

  // ===========================================
  // STATS
  // ===========================================

  async getStats() {
    const [totalResult, publishedResult, viewsResult, categoriesResult, tagsResult] = await Promise.all([
      query('SELECT COUNT(*) FROM knowledge_articles'),
      query('SELECT COUNT(*) FROM knowledge_articles WHERE is_published = true'),
      query('SELECT COALESCE(SUM(view_count), 0) as total FROM knowledge_articles'),
      query('SELECT COUNT(*) FROM knowledge_categories WHERE is_active = true'),
      query('SELECT COUNT(*) FROM knowledge_tags'),
    ]);

    const popularArticles = await this.getPopularArticles(5);
    const recentArticles = await this.getRecentArticles(5);

    return {
      totalArticles: parseInt(totalResult.rows[0].count, 10),
      publishedArticles: parseInt(publishedResult.rows[0].count, 10),
      draftArticles: parseInt(totalResult.rows[0].count, 10) - parseInt(publishedResult.rows[0].count, 10),
      totalViews: parseInt(viewsResult.rows[0].total, 10),
      totalCategories: parseInt(categoriesResult.rows[0].count, 10),
      totalTags: parseInt(tagsResult.rows[0].count, 10),
      popularArticles,
      recentArticles,
    };
  }

  // ===========================================
  // HELPERS
  // ===========================================

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }
}

export default new KnowledgeService();

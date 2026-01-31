/**
 * Knowledge Base Service
 * API services for articles, categories, tags, and search
 */

import api from './api';

// ===========================================
// Types
// ===========================================

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  categoryId: string;
  category?: Category;
  categoryName?: string;
  tags?: Tag[];
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  coverImage?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  isPinned: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  articleCount: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
  articleCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  parentId?: string;
  replies?: Comment[];
  likeCount: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  tagId?: string;
  authorId?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  sortBy?: 'createdAt' | 'viewCount' | 'likeCount' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateArticleData {
  title: string;
  content: string;
  excerpt?: string;
  categoryId: string;
  tagIds?: string[];
  coverImage?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
}

export interface UpdateArticleData {
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

export interface KnowledgeStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
  totalCategories: number;
  totalTags: number;
  popularArticles: Article[];
  recentArticles: Article[];
}

export interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  categoryName: string;
  createdAt: string;
  relevanceScore: number;
}

// ===========================================
// API Response Types
// ===========================================

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ===========================================
// Articles Service
// ===========================================

export const articlesService = {
  /**
   * Get all articles with pagination and filters
   */
  async getAll(params: ArticleQueryParams = {}): Promise<PaginatedResponse<Article>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('limit', params.pageSize.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.tagId) queryParams.append('tagId', params.tagId);
    if (params.authorId) queryParams.append('authorId', params.authorId);
    if (params.isPublished !== undefined) queryParams.append('isPublished', params.isPublished.toString());
    if (params.isFeatured !== undefined) queryParams.append('isFeatured', params.isFeatured.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await api.get(`/knowledge/articles?${queryParams.toString()}`);

    const articles = response.data.data?.articles || response.data.articles || [];
    const pagination = response.data.data?.pagination || response.data.pagination || {
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      total: articles.length,
      totalPages: 1,
    };

    return {
      success: true,
      data: articles.map(transformArticle),
      pagination: {
        page: pagination.page,
        pageSize: pagination.limit || pagination.pageSize,
        total: pagination.total,
        totalPages: pagination.totalPages,
      },
    };
  },

  /**
   * Get article by ID
   */
  async getById(id: string): Promise<ApiResponse<Article>> {
    const response = await api.get(`/knowledge/articles/${id}`);
    return {
      success: true,
      data: transformArticle(response.data.data || response.data),
    };
  },

  /**
   * Get article by slug
   */
  async getBySlug(slug: string): Promise<ApiResponse<Article>> {
    const response = await api.get(`/knowledge/articles/slug/${slug}`);
    return {
      success: true,
      data: transformArticle(response.data.data || response.data),
    };
  },

  /**
   * Create a new article
   */
  async create(data: CreateArticleData): Promise<ApiResponse<Article>> {
    const response = await api.post('/knowledge/articles', data);
    return {
      success: true,
      data: transformArticle(response.data.data || response.data),
    };
  },

  /**
   * Update an existing article
   */
  async update(id: string, data: UpdateArticleData): Promise<ApiResponse<Article>> {
    const response = await api.put(`/knowledge/articles/${id}`, data);
    return {
      success: true,
      data: transformArticle(response.data.data || response.data),
    };
  },

  /**
   * Delete an article
   */
  async delete(id: string): Promise<ApiResponse<{ id: string }>> {
    const response = await api.delete(`/knowledge/articles/${id}`);
    return {
      success: true,
      data: response.data.data || { id },
    };
  },

  /**
   * Publish an article
   */
  async publish(id: string): Promise<ApiResponse<Article>> {
    const response = await api.post(`/knowledge/articles/${id}/publish`);
    return {
      success: true,
      data: transformArticle(response.data.data || response.data),
    };
  },

  /**
   * Unpublish an article
   */
  async unpublish(id: string): Promise<ApiResponse<Article>> {
    const response = await api.post(`/knowledge/articles/${id}/unpublish`);
    return {
      success: true,
      data: transformArticle(response.data.data || response.data),
    };
  },

  /**
   * Toggle article featured status
   */
  async toggleFeatured(id: string): Promise<ApiResponse<Article>> {
    const response = await api.post(`/knowledge/articles/${id}/toggle-featured`);
    return {
      success: true,
      data: transformArticle(response.data.data || response.data),
    };
  },

  /**
   * Like an article
   */
  async like(id: string): Promise<ApiResponse<{ likeCount: number }>> {
    const response = await api.post(`/knowledge/articles/${id}/like`);
    return {
      success: true,
      data: response.data.data || { likeCount: 0 },
    };
  },

  /**
   * Get related articles
   */
  async getRelated(id: string, limit = 5): Promise<ApiResponse<Article[]>> {
    const response = await api.get(`/knowledge/articles/${id}/related?limit=${limit}`);
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformArticle),
    };
  },

  /**
   * Get featured articles
   */
  async getFeatured(limit = 5): Promise<ApiResponse<Article[]>> {
    const response = await api.get(`/knowledge/articles/featured?limit=${limit}`);
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformArticle),
    };
  },

  /**
   * Get popular articles
   */
  async getPopular(limit = 10): Promise<ApiResponse<Article[]>> {
    const response = await api.get(`/knowledge/articles/popular?limit=${limit}`);
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformArticle),
    };
  },

  /**
   * Get recent articles
   */
  async getRecent(limit = 10): Promise<ApiResponse<Article[]>> {
    const response = await api.get(`/knowledge/articles/recent?limit=${limit}`);
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformArticle),
    };
  },
};

// ===========================================
// Categories Service
// ===========================================

export const categoriesService = {
  /**
   * Get all categories
   */
  async getAll(): Promise<ApiResponse<Category[]>> {
    const response = await api.get('/knowledge/categories');
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformCategory),
    };
  },

  /**
   * Get category by ID
   */
  async getById(id: string): Promise<ApiResponse<Category>> {
    const response = await api.get(`/knowledge/categories/${id}`);
    return {
      success: true,
      data: transformCategory(response.data.data || response.data),
    };
  },

  /**
   * Create a new category
   */
  async create(data: { code: string; name: string; description?: string; icon?: string; color?: string; parentId?: string }): Promise<ApiResponse<Category>> {
    const response = await api.post('/knowledge/categories', data);
    return {
      success: true,
      data: transformCategory(response.data.data || response.data),
    };
  },

  /**
   * Update a category
   */
  async update(id: string, data: { name?: string; description?: string; icon?: string; color?: string; parentId?: string; isActive?: boolean }): Promise<ApiResponse<Category>> {
    const response = await api.put(`/knowledge/categories/${id}`, data);
    return {
      success: true,
      data: transformCategory(response.data.data || response.data),
    };
  },

  /**
   * Delete a category
   */
  async delete(id: string): Promise<ApiResponse<{ id: string }>> {
    const response = await api.delete(`/knowledge/categories/${id}`);
    return {
      success: true,
      data: response.data.data || { id },
    };
  },

  /**
   * Get category hierarchy
   */
  async getHierarchy(): Promise<ApiResponse<Category[]>> {
    const response = await api.get('/knowledge/categories');
    const categories = (response.data.data || response.data || []).map(transformCategory);

    // Build hierarchy
    const categoryMap = new Map<string, Category>();
    categories.forEach((c: Category) => categoryMap.set(c.id, { ...c, children: [] }));

    const rootCategories: Category[] = [];
    categories.forEach((c: Category) => {
      const category = categoryMap.get(c.id)!;
      if (c.parentId && categoryMap.has(c.parentId)) {
        const parent = categoryMap.get(c.parentId)!;
        if (!parent.children) parent.children = [];
        parent.children.push(category);
      } else {
        rootCategories.push(category);
      }
    });

    return {
      success: true,
      data: rootCategories,
    };
  },
};

// ===========================================
// Tags Service
// ===========================================

export const tagsService = {
  /**
   * Get all tags
   */
  async getAll(): Promise<ApiResponse<Tag[]>> {
    const response = await api.get('/knowledge/tags');
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformTag),
    };
  },

  /**
   * Get popular tags
   */
  async getPopular(limit = 20): Promise<ApiResponse<Tag[]>> {
    const response = await api.get(`/knowledge/tags/popular?limit=${limit}`);
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformTag),
    };
  },

  /**
   * Create a tag
   */
  async create(data: { name: string; color?: string }): Promise<ApiResponse<Tag>> {
    const response = await api.post('/knowledge/tags', data);
    return {
      success: true,
      data: transformTag(response.data.data || response.data),
    };
  },

  /**
   * Delete a tag
   */
  async delete(id: string): Promise<ApiResponse<{ id: string }>> {
    const response = await api.delete(`/knowledge/tags/${id}`);
    return {
      success: true,
      data: response.data.data || { id },
    };
  },
};

// ===========================================
// Search Service
// ===========================================

export const searchService = {
  /**
   * Search articles
   */
  async search(query: string, options: { categoryId?: string; limit?: number } = {}): Promise<ApiResponse<SearchResult[]>> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (options.categoryId) params.append('categoryId', options.categoryId);
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await api.get(`/knowledge/search?${params.toString()}`);
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformSearchResult),
    };
  },

  /**
   * Get search suggestions
   */
  async getSuggestions(query: string): Promise<ApiResponse<string[]>> {
    const response = await api.get(`/knowledge/search/suggestions?q=${encodeURIComponent(query)}`);
    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  },
};

// ===========================================
// Comments Service
// ===========================================

export const commentsService = {
  /**
   * Get comments for an article
   */
  async getByArticle(articleId: string): Promise<ApiResponse<Comment[]>> {
    const response = await api.get(`/knowledge/articles/${articleId}/comments`);
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformComment),
    };
  },

  /**
   * Add a comment
   */
  async create(articleId: string, data: { content: string; parentId?: string }): Promise<ApiResponse<Comment>> {
    const response = await api.post(`/knowledge/articles/${articleId}/comments`, data);
    return {
      success: true,
      data: transformComment(response.data.data || response.data),
    };
  },

  /**
   * Update a comment
   */
  async update(commentId: string, content: string): Promise<ApiResponse<Comment>> {
    const response = await api.put(`/knowledge/comments/${commentId}`, { content });
    return {
      success: true,
      data: transformComment(response.data.data || response.data),
    };
  },

  /**
   * Delete a comment
   */
  async delete(commentId: string): Promise<ApiResponse<{ id: string }>> {
    const response = await api.delete(`/knowledge/comments/${commentId}`);
    return {
      success: true,
      data: response.data.data || { id: commentId },
    };
  },

  /**
   * Like a comment
   */
  async like(commentId: string): Promise<ApiResponse<{ likeCount: number }>> {
    const response = await api.post(`/knowledge/comments/${commentId}/like`);
    return {
      success: true,
      data: response.data.data || { likeCount: 0 },
    };
  },
};

// ===========================================
// Stats Service
// ===========================================

export const knowledgeStatsService = {
  /**
   * Get knowledge base statistics
   */
  async getStats(): Promise<ApiResponse<KnowledgeStats>> {
    const response = await api.get('/knowledge/stats');
    return {
      success: true,
      data: response.data.data || response.data,
    };
  },
};

// ===========================================
// Favorites Service
// ===========================================

export const favoritesService = {
  /**
   * Get user's favorite articles
   */
  async getAll(): Promise<ApiResponse<Article[]>> {
    const response = await api.get('/knowledge/favorites');
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformArticle),
    };
  },

  /**
   * Add article to favorites
   */
  async add(articleId: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await api.post(`/knowledge/favorites/${articleId}`);
    return {
      success: true,
      data: response.data.data || { success: true },
    };
  },

  /**
   * Remove article from favorites
   */
  async remove(articleId: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await api.delete(`/knowledge/favorites/${articleId}`);
    return {
      success: true,
      data: response.data.data || { success: true },
    };
  },

  /**
   * Check if article is favorited
   */
  async isFavorited(articleId: string): Promise<ApiResponse<{ isFavorited: boolean }>> {
    const response = await api.get(`/knowledge/favorites/${articleId}/check`);
    return {
      success: true,
      data: response.data.data || { isFavorited: false },
    };
  },
};

// ===========================================
// Transform Functions
// ===========================================

function transformArticle(data: Record<string, unknown>): Article {
  return {
    id: data.id as string,
    title: data.title as string || '',
    slug: data.slug as string || '',
    excerpt: data.excerpt as string || (data.content as string)?.substring(0, 200) || undefined,
    content: data.content as string || '',
    categoryId: data.category_id as string || data.categoryId as string || '',
    categoryName: data.category_name as string || data.categoryName as string || undefined,
    authorId: data.created_by as string || data.authorId as string || '',
    authorName: data.author_name as string || data.authorName as string || undefined,
    authorAvatar: data.author_avatar as string || data.authorAvatar as string || undefined,
    coverImage: data.cover_image as string || data.coverImage as string || undefined,
    viewCount: data.view_count as number || data.viewCount as number || 0,
    likeCount: data.like_count as number || data.likeCount as number || 0,
    commentCount: data.comment_count as number || data.commentCount as number || 0,
    isPublished: data.is_published as boolean ?? data.isPublished as boolean ?? true,
    isFeatured: data.is_featured as boolean ?? data.isFeatured as boolean ?? false,
    isPinned: data.is_pinned as boolean ?? data.isPinned as boolean ?? false,
    publishedAt: data.published_at as string || data.publishedAt as string || undefined,
    createdAt: data.created_at as string || data.createdAt as string || '',
    updatedAt: data.updated_at as string || data.updatedAt as string || '',
  };
}

function transformCategory(data: Record<string, unknown>): Category {
  return {
    id: data.id as string,
    code: data.code as string || '',
    name: data.name as string || '',
    description: data.description as string || undefined,
    icon: data.icon as string || undefined,
    color: data.color as string || undefined,
    parentId: data.parent_id as string || data.parentId as string || undefined,
    articleCount: data.article_count as number || data.articleCount as number || 0,
    sortOrder: data.sort_order as number || data.sortOrder as number || 0,
    isActive: data.is_active as boolean ?? data.isActive as boolean ?? true,
    createdAt: data.created_at as string || data.createdAt as string || '',
    updatedAt: data.updated_at as string || data.updatedAt as string || '',
  };
}

function transformTag(data: Record<string, unknown>): Tag {
  return {
    id: data.id as string,
    name: data.name as string || '',
    slug: data.slug as string || '',
    color: data.color as string || undefined,
    articleCount: data.article_count as number || data.articleCount as number || 0,
    createdAt: data.created_at as string || data.createdAt as string || '',
  };
}

function transformComment(data: Record<string, unknown>): Comment {
  return {
    id: data.id as string,
    articleId: data.article_id as string || data.articleId as string || '',
    userId: data.user_id as string || data.userId as string || '',
    userName: data.user_name as string || data.userName as string || '',
    userAvatar: data.user_avatar as string || data.userAvatar as string || undefined,
    content: data.content as string || '',
    parentId: data.parent_id as string || data.parentId as string || undefined,
    likeCount: data.like_count as number || data.likeCount as number || 0,
    isEdited: data.is_edited as boolean ?? data.isEdited as boolean ?? false,
    createdAt: data.created_at as string || data.createdAt as string || '',
    updatedAt: data.updated_at as string || data.updatedAt as string || '',
  };
}

function transformSearchResult(data: Record<string, unknown>): SearchResult {
  return {
    id: data.id as string,
    title: data.title as string || '',
    excerpt: data.excerpt as string || '',
    categoryName: data.category_name as string || data.categoryName as string || '',
    createdAt: data.created_at as string || data.createdAt as string || '',
    relevanceScore: data.relevance_score as number || data.relevanceScore as number || 0,
  };
}

export default {
  articles: articlesService,
  categories: categoriesService,
  tags: tagsService,
  search: searchService,
  comments: commentsService,
  stats: knowledgeStatsService,
  favorites: favoritesService,
};

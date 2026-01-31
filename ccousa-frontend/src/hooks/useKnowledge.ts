/**
 * Knowledge Base Hooks
 * React Query hooks for articles, categories, tags, and search
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  articlesService,
  categoriesService,
  tagsService,
  searchService,
  commentsService,
  knowledgeStatsService,
  favoritesService,
  type ArticleQueryParams,
  type CreateArticleData,
  type UpdateArticleData,
} from '../services/knowledge.service';

// ===========================================
// Query Keys
// ===========================================

export const articleKeys = {
  all: ['articles'] as const,
  lists: () => [...articleKeys.all, 'list'] as const,
  list: (params: ArticleQueryParams) => [...articleKeys.lists(), params] as const,
  details: () => [...articleKeys.all, 'detail'] as const,
  detail: (id: string) => [...articleKeys.details(), id] as const,
  slug: (slug: string) => [...articleKeys.all, 'slug', slug] as const,
  related: (id: string) => [...articleKeys.all, 'related', id] as const,
  featured: () => [...articleKeys.all, 'featured'] as const,
  popular: () => [...articleKeys.all, 'popular'] as const,
  recent: () => [...articleKeys.all, 'recent'] as const,
  comments: (id: string) => [...articleKeys.all, 'comments', id] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
  hierarchy: () => [...categoryKeys.all, 'hierarchy'] as const,
};

export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  popular: () => [...tagKeys.all, 'popular'] as const,
};

export const searchKeys = {
  all: ['search'] as const,
  results: (query: string, options?: { categoryId?: string }) => [...searchKeys.all, query, options] as const,
  suggestions: (query: string) => [...searchKeys.all, 'suggestions', query] as const,
};

export const favoriteKeys = {
  all: ['favorites'] as const,
  lists: () => [...favoriteKeys.all, 'list'] as const,
  check: (id: string) => [...favoriteKeys.all, 'check', id] as const,
};

export const statsKeys = {
  all: ['knowledge-stats'] as const,
};

// ===========================================
// Articles Hooks
// ===========================================

/**
 * Get all articles with pagination and filters
 */
export function useArticles(params: ArticleQueryParams = {}) {
  return useQuery({
    queryKey: articleKeys.list(params),
    queryFn: () => articlesService.getAll(params),
    select: (response) => ({
      articles: response.data,
      pagination: response.pagination,
    }),
  });
}

/**
 * Get article by ID
 */
export function useArticle(id: string) {
  return useQuery({
    queryKey: articleKeys.detail(id),
    queryFn: () => articlesService.getById(id),
    select: (response) => response.data,
    enabled: !!id,
  });
}

/**
 * Get article by slug
 */
export function useArticleBySlug(slug: string) {
  return useQuery({
    queryKey: articleKeys.slug(slug),
    queryFn: () => articlesService.getBySlug(slug),
    select: (response) => response.data,
    enabled: !!slug,
  });
}

/**
 * Get related articles
 */
export function useRelatedArticles(id: string, limit = 5) {
  return useQuery({
    queryKey: articleKeys.related(id),
    queryFn: () => articlesService.getRelated(id, limit),
    select: (response) => response.data,
    enabled: !!id,
  });
}

/**
 * Get featured articles
 */
export function useFeaturedArticles(limit = 5) {
  return useQuery({
    queryKey: articleKeys.featured(),
    queryFn: () => articlesService.getFeatured(limit),
    select: (response) => response.data,
  });
}

/**
 * Get popular articles
 */
export function usePopularArticles(limit = 10) {
  return useQuery({
    queryKey: articleKeys.popular(),
    queryFn: () => articlesService.getPopular(limit),
    select: (response) => response.data,
  });
}

/**
 * Get recent articles
 */
export function useRecentArticles(limit = 10) {
  return useQuery({
    queryKey: articleKeys.recent(),
    queryFn: () => articlesService.getRecent(limit),
    select: (response) => response.data,
  });
}

/**
 * Create article mutation
 */
export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateArticleData) => articlesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

/**
 * Update article mutation
 */
export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateArticleData }) =>
      articlesService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: articleKeys.detail(id) });
    },
  });
}

/**
 * Delete article mutation
 */
export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => articlesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

/**
 * Publish article mutation
 */
export function usePublishArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => articlesService.publish(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: articleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
    },
  });
}

/**
 * Unpublish article mutation
 */
export function useUnpublishArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => articlesService.unpublish(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: articleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
    },
  });
}

/**
 * Toggle featured mutation
 */
export function useToggleFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => articlesService.toggleFeatured(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: articleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: articleKeys.featured() });
    },
  });
}

/**
 * Like article mutation
 */
export function useLikeArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => articlesService.like(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: articleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: articleKeys.popular() });
    },
  });
}

// ===========================================
// Categories Hooks
// ===========================================

/**
 * Get all categories
 */
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: () => categoriesService.getAll(),
    select: (response) => response.data,
  });
}

/**
 * Get category by ID
 */
export function useCategory(id: string) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => categoriesService.getById(id),
    select: (response) => response.data,
    enabled: !!id,
  });
}

/**
 * Get category hierarchy
 */
export function useCategoryHierarchy() {
  return useQuery({
    queryKey: categoryKeys.hierarchy(),
    queryFn: () => categoriesService.getHierarchy(),
    select: (response) => response.data,
  });
}

/**
 * Create category mutation
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { code: string; name: string; description?: string; icon?: string; color?: string; parentId?: string }) =>
      categoriesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.hierarchy() });
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
    },
  });
}

/**
 * Update category mutation
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; icon?: string; color?: string; parentId?: string; isActive?: boolean } }) =>
      categoriesService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: categoryKeys.hierarchy() });
    },
  });
}

/**
 * Delete category mutation
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.hierarchy() });
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
    },
  });
}

// ===========================================
// Tags Hooks
// ===========================================

/**
 * Get all tags
 */
export function useTags() {
  return useQuery({
    queryKey: tagKeys.lists(),
    queryFn: () => tagsService.getAll(),
    select: (response) => response.data,
  });
}

/**
 * Get popular tags
 */
export function usePopularTags(limit = 20) {
  return useQuery({
    queryKey: tagKeys.popular(),
    queryFn: () => tagsService.getPopular(limit),
    select: (response) => response.data,
  });
}

/**
 * Create tag mutation
 */
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; color?: string }) => tagsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tagKeys.popular() });
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
    },
  });
}

/**
 * Delete tag mutation
 */
export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tagsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tagKeys.popular() });
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
    },
  });
}

// ===========================================
// Search Hooks
// ===========================================

/**
 * Search articles
 */
export function useSearch(query: string, options: { categoryId?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: searchKeys.results(query, options),
    queryFn: () => searchService.search(query, options),
    select: (response) => response.data,
    enabled: query.length >= 2,
  });
}

/**
 * Get search suggestions
 */
export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: searchKeys.suggestions(query),
    queryFn: () => searchService.getSuggestions(query),
    select: (response) => response.data,
    enabled: query.length >= 2,
  });
}

// ===========================================
// Comments Hooks
// ===========================================

/**
 * Get comments for an article
 */
export function useComments(articleId: string) {
  return useQuery({
    queryKey: articleKeys.comments(articleId),
    queryFn: () => commentsService.getByArticle(articleId),
    select: (response) => response.data,
    enabled: !!articleId,
  });
}

/**
 * Create comment mutation
 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ articleId, data }: { articleId: string; data: { content: string; parentId?: string } }) =>
      commentsService.create(articleId, data),
    onSuccess: (_, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: articleKeys.comments(articleId) });
      queryClient.invalidateQueries({ queryKey: articleKeys.detail(articleId) });
    },
  });
}

/**
 * Update comment mutation
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string; articleId: string }) =>
      commentsService.update(commentId, content),
    onSuccess: (_, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: articleKeys.comments(articleId) });
    },
  });
}

/**
 * Delete comment mutation
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId }: { commentId: string; articleId: string }) =>
      commentsService.delete(commentId),
    onSuccess: (_, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: articleKeys.comments(articleId) });
      queryClient.invalidateQueries({ queryKey: articleKeys.detail(articleId) });
    },
  });
}

/**
 * Like comment mutation
 */
export function useLikeComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId }: { commentId: string; articleId: string }) =>
      commentsService.like(commentId),
    onSuccess: (_, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: articleKeys.comments(articleId) });
    },
  });
}

// ===========================================
// Stats Hooks
// ===========================================

/**
 * Get knowledge base statistics
 */
export function useKnowledgeStats() {
  return useQuery({
    queryKey: statsKeys.all,
    queryFn: () => knowledgeStatsService.getStats(),
    select: (response) => response.data,
  });
}

// ===========================================
// Favorites Hooks
// ===========================================

/**
 * Get user's favorite articles
 */
export function useFavorites() {
  return useQuery({
    queryKey: favoriteKeys.lists(),
    queryFn: () => favoritesService.getAll(),
    select: (response) => response.data,
  });
}

/**
 * Check if article is favorited
 */
export function useIsFavorited(articleId: string) {
  return useQuery({
    queryKey: favoriteKeys.check(articleId),
    queryFn: () => favoritesService.isFavorited(articleId),
    select: (response) => response.data.isFavorited,
    enabled: !!articleId,
  });
}

/**
 * Add to favorites mutation
 */
export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleId: string) => favoritesService.add(articleId),
    onSuccess: (_, articleId) => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.check(articleId) });
    },
  });
}

/**
 * Remove from favorites mutation
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleId: string) => favoritesService.remove(articleId),
    onSuccess: (_, articleId) => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.check(articleId) });
    },
  });
}

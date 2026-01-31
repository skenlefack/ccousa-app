import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  Plus,
  Filter,
  Star,
  Eye,
  MessageSquare,
  Heart,
  ChevronRight,
  Clock,
  User,
  Folder,
  Tag,
  TrendingUp,
  Grid,
  List,
  X,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import {
  useArticles,
  useCategories,
  usePopularTags,
  useFeaturedArticles,
  useKnowledgeStats,
  useSearch,
} from '../../hooks';
import type { Article, Category, Tag as TagType } from '../../services/knowledge.service';
import type { ArticleQueryParams } from '../../services/knowledge.service';

// ===========================================
// Stats Card Component
// ===========================================

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden rounded-xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 p-4 shadow-lg"
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color} bg-opacity-20 dark:bg-opacity-30`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-dark-900 dark:text-white">{value.toLocaleString()}</p>
        <p className="text-xs text-dark-500 dark:text-dark-400">{title}</p>
      </div>
    </div>
  </motion.div>
);

// ===========================================
// Category Sidebar Item
// ===========================================

interface CategoryItemProps {
  category: Category;
  isSelected: boolean;
  onClick: () => void;
  level?: number;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ category, isSelected, onClick, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
          isSelected
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
            : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-200'
        }`}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="p-0.5"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        )}
        <Folder className={`w-4 h-4 ${isSelected ? 'text-primary-600' : 'text-dark-400'}`} style={{ color: category.color }} />
        <span className="flex-1 truncate text-sm">{category.name}</span>
        <span className="text-xs text-dark-400">{category.articleCount}</span>
      </button>
      {hasChildren && isExpanded && (
        <div>
          {category.children!.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              isSelected={isSelected}
              onClick={onClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ===========================================
// Tag Badge
// ===========================================

const TagBadge: React.FC<{ tag: TagType; onClick?: () => void; isSelected?: boolean }> = ({ tag, onClick, isSelected }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
      isSelected
        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
        : 'bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-300 hover:bg-dark-200 dark:hover:bg-dark-600'
    }`}
    style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color } : undefined}
  >
    <Tag className="w-3 h-3" />
    {tag.name}
    <span className="ml-1 opacity-60">{tag.articleCount}</span>
  </button>
);

// ===========================================
// Article Card
// ===========================================

interface ArticleCardProps {
  article: Article;
  onClick: () => void;
  onToggleFavorite?: () => void;
  isFavorited?: boolean;
  viewMode: 'grid' | 'list';
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick, onToggleFavorite, isFavorited, viewMode }) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onClick}
        className="flex gap-4 p-4 rounded-xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300 group"
      >
        {article.coverImage && (
          <div className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
            <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              {article.isFeatured && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 mb-2">
                  <Star className="w-3 h-3" />
                  En vedette
                </span>
              )}
              <h3 className="font-semibold text-dark-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                {article.title}
              </h3>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
              className="p-1.5 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700"
            >
              {isFavorited ? (
                <BookmarkCheck className="w-4 h-4 text-primary-600" />
              ) : (
                <Bookmark className="w-4 h-4 text-dark-400" />
              )}
            </button>
          </div>
          <p className="mt-1 text-sm text-dark-600 dark:text-dark-300 line-clamp-2">{article.excerpt}</p>
          <div className="mt-2 flex items-center gap-4 text-xs text-dark-500 dark:text-dark-400">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {article.authorName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(article.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {article.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {article.likeCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {article.commentCount}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className="rounded-xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300 overflow-hidden group"
    >
      {/* Cover Image */}
      {article.coverImage ? (
        <div className="relative h-40 overflow-hidden">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {article.isFeatured && (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/90 text-amber-700 dark:text-amber-300">
                <Star className="w-3 h-3" />
                En vedette
              </span>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 dark:bg-dark-800/80 hover:bg-white dark:hover:bg-dark-700"
          >
            {isFavorited ? (
              <BookmarkCheck className="w-4 h-4 text-primary-600" />
            ) : (
              <Bookmark className="w-4 h-4 text-dark-400" />
            )}
          </button>
        </div>
      ) : (
        <div className="relative h-40 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center">
          <BookOpen className="w-12 h-12 text-primary-400 dark:text-primary-600" />
          {article.isFeatured && (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/90 text-amber-700 dark:text-amber-300">
                <Star className="w-3 h-3" />
                En vedette
              </span>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 dark:bg-dark-800/80 hover:bg-white dark:hover:bg-dark-700"
          >
            {isFavorited ? (
              <BookmarkCheck className="w-4 h-4 text-primary-600" />
            ) : (
              <Bookmark className="w-4 h-4 text-dark-400" />
            )}
          </button>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-dark-500 dark:text-dark-400 mb-2">
          <span className="px-2 py-0.5 rounded bg-dark-100 dark:bg-dark-700">
            {article.categoryName}
          </span>
        </div>
        <h3 className="font-semibold text-dark-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="mt-2 text-sm text-dark-600 dark:text-dark-300 line-clamp-2">{article.excerpt}</p>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-dark-100 dark:border-dark-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-dark-500 dark:text-dark-400">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {article.authorName}
            </span>
            <span>•</span>
            <span>{formatDate(article.createdAt)}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-dark-400">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {article.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {article.likeCount}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ===========================================
// Featured Article Banner
// ===========================================

const FeaturedBanner: React.FC<{ article: Article; onClick: () => void }> = ({ article, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className="relative rounded-2xl overflow-hidden cursor-pointer group"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-primary-600/90 to-primary-800/90 dark:from-primary-900/90 dark:to-dark-900/90" />
    {article.coverImage && (
      <img
        src={article.coverImage}
        alt={article.title}
        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
      />
    )}
    <div className="relative p-8 lg:p-12">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white">
          <Star className="w-4 h-4" />
          Article en vedette
        </span>
      </div>
      <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4 group-hover:underline">
        {article.title}
      </h2>
      <p className="text-white/80 line-clamp-2 mb-6 max-w-2xl">{article.excerpt}</p>
      <div className="flex items-center gap-6 text-white/80 text-sm">
        <span className="flex items-center gap-2">
          <User className="w-4 h-4" />
          {article.authorName}
        </span>
        <span className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          {article.viewCount} vues
        </span>
        <span className="flex items-center gap-2">
          <Heart className="w-4 h-4" />
          {article.likeCount} likes
        </span>
      </div>
    </div>
  </motion.div>
);

// ===========================================
// Knowledge List Page
// ===========================================

interface KnowledgeListPageProps {
  onNavigate?: (path: string) => void;
}

export const KnowledgeListPage: React.FC<KnowledgeListPageProps> = ({ onNavigate }) => {
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [filters, setFilters] = useState<ArticleQueryParams>({
    page: 1,
    pageSize: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    isPublished: true,
  });

  // Queries
  const queryParams = useMemo(() => ({
    ...filters,
    categoryId: selectedCategory || undefined,
    tagId: selectedTag || undefined,
  }), [filters, selectedCategory, selectedTag]);

  const { data: articlesData, isLoading } = useArticles(queryParams);
  const { data: categories = [] } = useCategories();
  const { data: popularTags = [] } = usePopularTags(15);
  const { data: featuredArticles = [] } = useFeaturedArticles(1);
  const { data: stats } = useKnowledgeStats();
  const { data: searchResults = [] } = useSearch(searchQuery);

  const articles = articlesData?.articles || [];
  const pagination = articlesData?.pagination || { page: 1, pageSize: 12, total: 0, totalPages: 0 };
  const featuredArticle = featuredArticles[0];

  // Handlers
  const handleArticleClick = (article: Article) => {
    onNavigate?.(`/knowledge/${article.id}`);
  };

  const handleCreateArticle = () => {
    onNavigate?.('/knowledge/new');
  };

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleTagSelect = (tagId: string | null) => {
    setSelectedTag(tagId === selectedTag ? null : tagId);
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 hidden lg:block">
        <div className="sticky top-6 space-y-6">
          {/* Categories */}
          <div className="rounded-xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 shadow-lg p-4">
            <h3 className="font-semibold text-dark-900 dark:text-white mb-3 flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Catégories
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => handleCategorySelect(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                  !selectedCategory
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-200'
                }`}
              >
                Tous les articles
              </button>
              {categories.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  isSelected={selectedCategory === category.id}
                  onClick={() => handleCategorySelect(category.id)}
                />
              ))}
            </div>
          </div>

          {/* Popular Tags */}
          <div className="rounded-xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 shadow-lg p-4">
            <h3 className="font-semibold text-dark-900 dark:text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Tags populaires
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  onClick={() => handleTagSelect(tag.id)}
                  isSelected={selectedTag === tag.id}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-dark-900 dark:text-white">
              Base de Connaissances
            </h1>
            <p className="text-dark-500 dark:text-dark-400 mt-1">
              Documentation, guides et ressources
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-3 rounded-xl border border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-800/80 hover:bg-dark-100 dark:hover:bg-dark-700"
            >
              <Search className="w-5 h-5 text-dark-500" />
            </button>
            <button
              onClick={handleCreateArticle}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300 hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Nouvel article
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  placeholder="Rechercher dans la base de connaissances..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 rounded-xl border border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl text-dark-900 dark:text-white placeholder-dark-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700"
                  >
                    <X className="w-5 h-5 text-dark-400" />
                  </button>
                )}
              </div>

              {/* Search Results */}
              {searchQuery && searchResults.length > 0 && (
                <div className="mt-2 rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 shadow-lg p-2">
                  {searchResults.slice(0, 5).map((result) => (
                    <button
                      key={result.id}
                      onClick={() => onNavigate?.(`/knowledge/${result.id}`)}
                      className="w-full text-left p-3 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                    >
                      <p className="font-medium text-dark-900 dark:text-white">{result.title}</p>
                      <p className="text-sm text-dark-500 dark:text-dark-400 line-clamp-1">{result.excerpt}</p>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Articles"
            value={stats?.totalArticles || 0}
            icon={<BookOpen className="w-5 h-5 text-blue-600" />}
            color="bg-blue-500"
          />
          <StatCard
            title="Publiés"
            value={stats?.publishedArticles || 0}
            icon={<Eye className="w-5 h-5 text-green-600" />}
            color="bg-green-500"
          />
          <StatCard
            title="Vues totales"
            value={stats?.totalViews || 0}
            icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
            color="bg-purple-500"
          />
          <StatCard
            title="Catégories"
            value={stats?.totalCategories || 0}
            icon={<Folder className="w-5 h-5 text-orange-600" />}
            color="bg-orange-500"
          />
        </div>

        {/* Featured Article */}
        {featuredArticle && (
          <FeaturedBanner
            article={featuredArticle}
            onClick={() => handleArticleClick(featuredArticle)}
          />
        )}

        {/* View Toggle & Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-dark-500 dark:text-dark-400">
              {pagination.total} article{pagination.total !== 1 ? 's' : ''}
            </span>
            {selectedCategory && (
              <button
                onClick={() => handleCategorySelect(null)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm"
              >
                <X className="w-3 h-3" />
                Catégorie
              </button>
            )}
            {selectedTag && (
              <button
                onClick={() => handleTagSelect(null)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm"
              >
                <X className="w-3 h-3" />
                Tag
              </button>
            )}
          </div>
          <div className="flex rounded-xl border border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-800/80 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${
                viewMode === 'grid'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-dark-500 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-700'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${
                viewMode === 'list'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-dark-500 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Articles */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 rounded-xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50">
            <BookOpen className="w-16 h-16 mx-auto text-dark-300 dark:text-dark-600 mb-4" />
            <h3 className="text-xl font-semibold text-dark-900 dark:text-white mb-2">
              Aucun article trouvé
            </h3>
            <p className="text-dark-500 dark:text-dark-400 mb-6">
              Commencez par créer votre premier article
            </p>
            <button
              onClick={handleCreateArticle}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Créer un article
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onClick={() => handleArticleClick(article)}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onClick={() => handleArticleClick(article)}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const start = Math.max(1, pagination.page - 2);
              const page = start + i;
              if (page > pagination.totalPages) return null;
              return (
                <button
                  key={page}
                  onClick={() => setFilters((prev) => ({ ...prev, page }))}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    page === pagination.page
                      ? 'bg-primary-600 text-white'
                      : 'border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-200'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

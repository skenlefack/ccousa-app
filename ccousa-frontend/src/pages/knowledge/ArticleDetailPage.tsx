import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  BookmarkCheck,
  Edit2,
  Trash2,
  MoreVertical,
  User,
  Tag,
  ChevronRight,
  Send,
  ThumbsUp,
  Reply,
  MoreHorizontal,
  Folder,
  Calendar,
  Link2,
  Twitter,
  Facebook,
  Linkedin,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  useArticle,
  useRelatedArticles,
  useComments,
  useLikeArticle,
  useCreateComment,
  useDeleteComment,
  useLikeComment,
  useIsFavorited,
  useAddFavorite,
  useRemoveFavorite,
} from '../../hooks';
import type { Article, Comment } from '../../services/knowledge.service';

// ===========================================
// Table of Contents
// ===========================================

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

const TableOfContents: React.FC<{ items: TOCItem[]; activeId: string | null }> = ({ items, activeId }) => {
  if (items.length === 0) return null;

  return (
    <div className="rounded-xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 p-4 shadow-lg">
      <h3 className="font-semibold text-dark-900 dark:text-white mb-3">Sommaire</h3>
      <nav className="space-y-1">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`block text-sm py-1 transition-colors ${
              activeId === item.id
                ? 'text-primary-600 dark:text-primary-400 font-medium'
                : 'text-dark-600 dark:text-dark-300 hover:text-primary-600 dark:hover:text-primary-400'
            }`}
            style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
          >
            {item.text}
          </a>
        ))}
      </nav>
    </div>
  );
};

// ===========================================
// Share Modal
// ===========================================

interface ShareModalProps {
  article: Article;
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ article, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
      >
        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">Partager cet article</h3>

        {/* Social Share */}
        <div className="flex justify-center gap-4 mb-6">
          <button className="p-3 rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 transition-colors">
            <Twitter className="w-5 h-5" />
          </button>
          <button className="p-3 rounded-full bg-[#4267B2]/10 text-[#4267B2] hover:bg-[#4267B2]/20 transition-colors">
            <Facebook className="w-5 h-5" />
          </button>
          <button className="p-3 rounded-full bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 transition-colors">
            <Linkedin className="w-5 h-5" />
          </button>
        </div>

        {/* Copy Link */}
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            readOnly
            className="flex-1 px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 bg-dark-50 dark:bg-dark-700 text-dark-900 dark:text-white text-sm"
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              copied
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 hover:bg-primary-200'
            }`}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ===========================================
// Comment Component
// ===========================================

interface CommentItemProps {
  comment: Comment;
  articleId: string;
  onReply: (parentId: string) => void;
  level?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, articleId, onReply, level = 0 }) => {
  const [showMenu, setShowMenu] = useState(false);
  const likeCommentMutation = useLikeComment();
  const deleteCommentMutation = useDeleteComment();

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "À l'instant";
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return d.toLocaleDateString('fr-FR');
  };

  return (
    <div className={`${level > 0 ? 'ml-12 pl-4 border-l-2 border-dark-200 dark:border-dark-700' : ''}`}>
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {comment.userName?.charAt(0) || 'U'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-dark-900 dark:text-white">{comment.userName}</span>
            <span className="text-xs text-dark-500 dark:text-dark-400">{formatDate(comment.createdAt)}</span>
            {comment.isEdited && (
              <span className="text-xs text-dark-400 italic">(modifié)</span>
            )}
          </div>
          <p className="mt-1 text-dark-700 dark:text-dark-200">{comment.content}</p>
          <div className="mt-2 flex items-center gap-4">
            <button
              onClick={() => likeCommentMutation.mutate({ commentId: comment.id, articleId })}
              className="flex items-center gap-1 text-sm text-dark-500 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{comment.likeCount}</span>
            </button>
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 text-sm text-dark-500 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <Reply className="w-4 h-4" />
              <span>Répondre</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700"
              >
                <MoreHorizontal className="w-4 h-4 text-dark-400" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 z-10 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-dark-200 dark:border-dark-700 py-1">
                  <button
                    onClick={() => {
                      deleteCommentMutation.mutate({ commentId: comment.id, articleId });
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              articleId={articleId}
              onReply={onReply}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ===========================================
// Comments Section
// ===========================================

interface CommentsSectionProps {
  articleId: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ articleId }) => {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const { data: comments = [], isLoading } = useComments(articleId);
  const createCommentMutation = useCreateComment();

  const handleSubmit = () => {
    if (!newComment.trim()) return;

    createCommentMutation.mutate(
      { articleId, data: { content: newComment, parentId: replyTo || undefined } },
      {
        onSuccess: () => {
          setNewComment('');
          setReplyTo(null);
        },
      }
    );
  };

  // Build comment tree
  const commentTree = useMemo(() => {
    const map = new Map<string, Comment>();
    const roots: Comment[] = [];

    comments.forEach((c) => map.set(c.id, { ...c, replies: [] }));
    comments.forEach((c) => {
      const comment = map.get(c.id)!;
      if (c.parentId && map.has(c.parentId)) {
        const parent = map.get(c.parentId)!;
        parent.replies = parent.replies || [];
        parent.replies.push(comment);
      } else {
        roots.push(comment);
      }
    });

    return roots;
  }, [comments]);

  return (
    <div className="mt-12">
      <h3 className="text-xl font-bold text-dark-900 dark:text-white mb-6 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Commentaires ({comments.length})
      </h3>

      {/* New Comment Form */}
      <div className="mb-8">
        {replyTo && (
          <div className="flex items-center gap-2 mb-2 text-sm text-dark-500 dark:text-dark-400">
            <Reply className="w-4 h-4" />
            <span>Répondre à un commentaire</span>
            <button onClick={() => setReplyTo(null)} className="text-primary-600 hover:underline">
              Annuler
            </button>
          </div>
        )}
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            U
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white resize-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!newComment.trim() || createCommentMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
                Publier
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : commentTree.length === 0 ? (
        <div className="text-center py-10 text-dark-500 dark:text-dark-400">
          Aucun commentaire. Soyez le premier à commenter !
        </div>
      ) : (
        <div className="space-y-6">
          {commentTree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              articleId={articleId}
              onReply={setReplyTo}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ===========================================
// Related Article Card
// ===========================================

const RelatedArticleCard: React.FC<{ article: Article; onClick: () => void }> = ({ article, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left p-4 rounded-xl hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors group"
  >
    <h4 className="font-medium text-dark-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 line-clamp-2">
      {article.title}
    </h4>
    <div className="mt-2 flex items-center gap-3 text-xs text-dark-500 dark:text-dark-400">
      <span className="flex items-center gap-1">
        <Eye className="w-3 h-3" />
        {article.viewCount}
      </span>
      <span className="flex items-center gap-1">
        <Heart className="w-3 h-3" />
        {article.likeCount}
      </span>
    </div>
  </button>
);

// ===========================================
// Article Detail Page
// ===========================================

interface ArticleDetailPageProps {
  articleId: string;
  onBack: () => void;
  onEdit?: () => void;
  onNavigate?: (path: string) => void;
}

export const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({
  articleId,
  onBack,
  onEdit,
  onNavigate,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const { data: article, isLoading, error } = useArticle(articleId);
  const { data: relatedArticles = [] } = useRelatedArticles(articleId);
  const { data: isFavorited = false } = useIsFavorited(articleId);

  const likeArticleMutation = useLikeArticle();
  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();

  // Extract headings from content for TOC
  const tocItems = useMemo<TOCItem[]>(() => {
    if (!article?.content) return [];
    const headingRegex = /<h([1-3])[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h\1>/g;
    const items: TOCItem[] = [];
    let match;
    while ((match = headingRegex.exec(article.content)) !== null) {
      items.push({
        id: match[2],
        text: match[3],
        level: parseInt(match[1]),
      });
    }
    return items;
  }, [article?.content]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleToggleFavorite = () => {
    if (isFavorited) {
      removeFavoriteMutation.mutate(articleId);
    } else {
      addFavoriteMutation.mutate(articleId);
    }
  };

  const handleLike = () => {
    likeArticleMutation.mutate(articleId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">Article non trouvé</h2>
        <p className="text-dark-500 dark:text-dark-400 mb-6">L'article que vous recherchez n'existe pas ou a été supprimé.</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-dark-500 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour à la liste
      </button>

      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Article Header */}
          <div className="mb-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-dark-500 dark:text-dark-400 mb-4">
              <button onClick={onBack} className="hover:text-primary-600">Base de connaissances</button>
              <ChevronRight className="w-4 h-4" />
              <span className="text-primary-600 dark:text-primary-400">{article.categoryName}</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-bold text-dark-900 dark:text-white mb-4">
              {article.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-dark-500 dark:text-dark-400">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xs">
                  {article.authorName?.charAt(0) || 'A'}
                </div>
                <span>{article.authorName}</span>
              </div>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(article.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {article.viewCount} vues
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                ~5 min de lecture
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleLike}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
              >
                <Heart className={`w-5 h-5 ${article.likeCount > 0 ? 'text-red-500 fill-red-500' : ''}`} />
                <span>{article.likeCount}</span>
              </button>
              <button
                onClick={handleToggleFavorite}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
              >
                {isFavorited ? (
                  <BookmarkCheck className="w-5 h-5 text-primary-600" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
                <span>{isFavorited ? 'Enregistré' : 'Enregistrer'}</span>
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span>Partager</span>
              </button>
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700"
                >
                  <MoreVertical className="w-5 h-5 text-dark-500" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-10 z-10 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-dark-200 dark:border-dark-700 py-2 w-48">
                    {onEdit && (
                      <button
                        onClick={() => { onEdit(); setShowMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-700 flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Modifier
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cover Image */}
          {article.coverImage && (
            <div className="rounded-2xl overflow-hidden mb-8">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-64 lg:h-96 object-cover"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="rounded-2xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 shadow-lg p-8">
            <article
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t border-dark-200 dark:border-dark-700">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="w-4 h-4 text-dark-400" />
                  {article.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 rounded-full text-sm bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-300"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="rounded-2xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 shadow-lg p-8 mt-8">
            <CommentsSection articleId={articleId} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 hidden lg:block">
          <div className="sticky top-6 space-y-6">
            {/* Table of Contents */}
            {tocItems.length > 0 && (
              <TableOfContents items={tocItems} activeId={activeHeading} />
            )}

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="rounded-xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 p-4 shadow-lg">
                <h3 className="font-semibold text-dark-900 dark:text-white mb-3">Articles similaires</h3>
                <div className="space-y-2">
                  {relatedArticles.slice(0, 5).map((related) => (
                    <RelatedArticleCard
                      key={related.id}
                      article={related}
                      onClick={() => onNavigate?.(`/knowledge/${related.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Author Info */}
            <div className="rounded-xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 p-4 shadow-lg">
              <h3 className="font-semibold text-dark-900 dark:text-white mb-3">À propos de l'auteur</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                  {article.authorName?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="font-medium text-dark-900 dark:text-white">{article.authorName}</p>
                  <p className="text-sm text-dark-500 dark:text-dark-400">Contributeur</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        article={article}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
};

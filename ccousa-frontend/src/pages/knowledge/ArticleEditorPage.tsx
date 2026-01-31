import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Image,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  X,
  Upload,
  Folder,
  Tag,
  Star,
  FileText,
  Settings,
  ChevronDown,
} from 'lucide-react';
import {
  useArticle,
  useCreateArticle,
  useUpdateArticle,
  useCategories,
  useTags,
  useCreateTag,
  usePublishArticle,
  useUnpublishArticle,
} from '../../hooks';
import type { Article, Category, Tag as TagType } from '../../services/knowledge.service';

// ===========================================
// Toolbar Button
// ===========================================

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon, label, onClick, isActive, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={`p-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
        : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-600 dark:text-dark-300'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {icon}
  </button>
);

// ===========================================
// Tag Input
// ===========================================

interface TagInputProps {
  selectedTags: TagType[];
  availableTags: TagType[];
  onAdd: (tag: TagType) => void;
  onRemove: (tagId: string) => void;
  onCreate: (name: string) => void;
}

const TagInput: React.FC<TagInputProps> = ({ selectedTags, availableTags, onAdd, onRemove, onCreate }) => {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredTags = availableTags.filter(
    (tag) =>
      !selectedTags.find((t) => t.id === tag.id) &&
      tag.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const existingTag = availableTags.find(
        (t) => t.name.toLowerCase() === inputValue.toLowerCase()
      );
      if (existingTag) {
        onAdd(existingTag);
      } else {
        onCreate(inputValue.trim());
      }
      setInputValue('');
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 min-h-[48px]">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm"
          >
            {tag.name}
            <button onClick={() => onRemove(tag.id)} className="hover:text-primary-900">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? 'Ajouter des tags...' : ''}
          className="flex-1 min-w-[100px] bg-transparent text-dark-900 dark:text-white outline-none text-sm"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (filteredTags.length > 0 || inputValue.trim()) && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-dark-200 dark:border-dark-700 max-h-48 overflow-y-auto">
          {filteredTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => {
                onAdd(tag);
                setInputValue('');
                setShowDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-dark-100 dark:hover:bg-dark-700 flex items-center gap-2"
            >
              <Tag className="w-4 h-4 text-dark-400" />
              {tag.name}
              <span className="text-xs text-dark-400">({tag.articleCount})</span>
            </button>
          ))}
          {inputValue.trim() && !filteredTags.find((t) => t.name.toLowerCase() === inputValue.toLowerCase()) && (
            <button
              onClick={() => {
                onCreate(inputValue.trim());
                setInputValue('');
                setShowDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center gap-2"
            >
              <Tag className="w-4 h-4" />
              Créer "{inputValue}"
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ===========================================
// Category Select
// ===========================================

interface CategorySelectProps {
  categories: Category[];
  selectedId: string;
  onChange: (id: string) => void;
}

const CategorySelect: React.FC<CategorySelectProps> = ({ categories, selectedId, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = categories.find((c) => c.id === selectedId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white"
      >
        <span className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-dark-400" style={selected?.color ? { color: selected.color } : undefined} />
          {selected?.name || 'Sélectionner une catégorie'}
        </span>
        <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-dark-200 dark:border-dark-700 max-h-60 overflow-y-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                onChange(category.id);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-dark-100 dark:hover:bg-dark-700 flex items-center gap-2 ${
                selectedId === category.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
              }`}
            >
              <Folder className="w-4 h-4" style={category.color ? { color: category.color } : undefined} />
              <span className="text-dark-900 dark:text-white">{category.name}</span>
              <span className="text-xs text-dark-400 ml-auto">{category.articleCount} articles</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ===========================================
// Cover Image Upload
// ===========================================

interface CoverImageUploadProps {
  imageUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
}

const CoverImageUpload: React.FC<CoverImageUploadProps> = ({ imageUrl, onUpload, onRemove }) => {
  const handleUpload = () => {
    // Simulate upload - in real app, this would open file picker and upload
    const demoUrl = `https://source.unsplash.com/random/1200x600?sig=${Date.now()}`;
    onUpload(demoUrl);
  };

  if (imageUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden">
        <img src={imageUrl} alt="Cover" className="w-full h-48 object-cover" />
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleUpload}
      className="w-full h-48 rounded-xl border-2 border-dashed border-dark-300 dark:border-dark-600 hover:border-primary-500 dark:hover:border-primary-500 flex flex-col items-center justify-center gap-2 text-dark-500 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
    >
      <Upload className="w-8 h-8" />
      <span>Ajouter une image de couverture</span>
    </button>
  );
};

// ===========================================
// Article Editor Page
// ===========================================

interface ArticleEditorPageProps {
  articleId?: string;
  onBack: () => void;
  onSuccess: (article: Article) => void;
}

export const ArticleEditorPage: React.FC<ArticleEditorPageProps> = ({
  articleId,
  onBack,
  onSuccess,
}) => {
  const isEditMode = !!articleId;

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  // Queries
  const { data: article } = useArticle(articleId || '');
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();

  // Mutations
  const createArticleMutation = useCreateArticle();
  const updateArticleMutation = useUpdateArticle();
  const publishMutation = usePublishArticle();
  const unpublishMutation = useUnpublishArticle();
  const createTagMutation = useCreateTag();

  // Load article data
  useEffect(() => {
    if (article && isEditMode) {
      setTitle(article.title);
      setContent(article.content);
      setExcerpt(article.excerpt || '');
      setCategoryId(article.categoryId);
      setSelectedTags(article.tags || []);
      setCoverImage(article.coverImage || null);
      setIsFeatured(article.isFeatured);
      setIsPublished(article.isPublished);
    }
  }, [article, isEditMode]);

  // Track dirty state
  useEffect(() => {
    if (isEditMode && article) {
      const hasChanges =
        title !== article.title ||
        content !== article.content ||
        excerpt !== (article.excerpt || '') ||
        categoryId !== article.categoryId ||
        coverImage !== (article.coverImage || null) ||
        isFeatured !== article.isFeatured;
      setIsDirty(hasChanges);
    } else {
      setIsDirty(!!title || !!content);
    }
  }, [title, content, excerpt, categoryId, coverImage, isFeatured, article, isEditMode]);

  // Handlers
  const handleSave = (publish = false) => {
    const data = {
      title,
      content,
      excerpt: excerpt || undefined,
      categoryId,
      tagIds: selectedTags.map((t) => t.id),
      coverImage: coverImage || undefined,
      isFeatured,
      isPublished: publish ? true : isPublished,
    };

    if (isEditMode && articleId) {
      updateArticleMutation.mutate(
        { id: articleId, data },
        {
          onSuccess: (response) => {
            if (publish && !article?.isPublished) {
              publishMutation.mutate(articleId);
            }
            onSuccess(response.data);
          },
        }
      );
    } else {
      createArticleMutation.mutate(data, {
        onSuccess: (response) => {
          onSuccess(response.data);
        },
      });
    }
  };

  const handleAddTag = (tag: TagType) => {
    setSelectedTags((prev) => [...prev, tag]);
  };

  const handleRemoveTag = (tagId: string) => {
    setSelectedTags((prev) => prev.filter((t) => t.id !== tagId));
  };

  const handleCreateTag = (name: string) => {
    createTagMutation.mutate(
      { name },
      {
        onSuccess: (response) => {
          handleAddTag(response.data);
        },
      }
    );
  };

  const isSaving = createArticleMutation.isPending || updateArticleMutation.isPending;
  const canSave = title.trim() && categoryId && !isSaving;

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border-b border-dark-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700"
            >
              <ArrowLeft className="w-5 h-5 text-dark-500" />
            </button>
            <div>
              <h1 className="font-semibold text-dark-900 dark:text-white">
                {isEditMode ? 'Modifier l\'article' : 'Nouvel article'}
              </h1>
              {isDirty && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Modifications non enregistrées
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                  : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={!canSave}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dark-300 dark:border-dark-600 text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={!canSave}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Publier
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Main Editor */}
          <div className="flex-1 space-y-6">
            {/* Cover Image */}
            <CoverImageUpload
              imageUrl={coverImage}
              onUpload={setCoverImage}
              onRemove={() => setCoverImage(null)}
            />

            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de l'article"
              className="w-full text-3xl font-bold text-dark-900 dark:text-white bg-transparent border-none outline-none placeholder-dark-300 dark:placeholder-dark-600"
            />

            {/* Excerpt */}
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Résumé de l'article (optionnel)..."
              rows={2}
              className="w-full text-lg text-dark-600 dark:text-dark-300 bg-transparent border-none outline-none resize-none placeholder-dark-400 dark:placeholder-dark-500"
            />

            {/* Editor Toolbar */}
            <div className="flex items-center gap-1 p-2 rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 shadow-sm">
              <ToolbarButton icon={<Bold className="w-4 h-4" />} label="Gras" onClick={() => {}} />
              <ToolbarButton icon={<Italic className="w-4 h-4" />} label="Italique" onClick={() => {}} />
              <ToolbarButton icon={<Underline className="w-4 h-4" />} label="Souligné" onClick={() => {}} />
              <div className="w-px h-6 bg-dark-200 dark:bg-dark-700 mx-1" />
              <ToolbarButton icon={<Heading1 className="w-4 h-4" />} label="Titre 1" onClick={() => {}} />
              <ToolbarButton icon={<Heading2 className="w-4 h-4" />} label="Titre 2" onClick={() => {}} />
              <ToolbarButton icon={<Heading3 className="w-4 h-4" />} label="Titre 3" onClick={() => {}} />
              <div className="w-px h-6 bg-dark-200 dark:bg-dark-700 mx-1" />
              <ToolbarButton icon={<List className="w-4 h-4" />} label="Liste" onClick={() => {}} />
              <ToolbarButton icon={<ListOrdered className="w-4 h-4" />} label="Liste numérotée" onClick={() => {}} />
              <ToolbarButton icon={<Quote className="w-4 h-4" />} label="Citation" onClick={() => {}} />
              <div className="w-px h-6 bg-dark-200 dark:bg-dark-700 mx-1" />
              <ToolbarButton icon={<Link2 className="w-4 h-4" />} label="Lien" onClick={() => {}} />
              <ToolbarButton icon={<Image className="w-4 h-4" />} label="Image" onClick={() => {}} />
              <ToolbarButton icon={<Code className="w-4 h-4" />} label="Code" onClick={() => {}} />
              <div className="flex-1" />
              <ToolbarButton icon={<Undo className="w-4 h-4" />} label="Annuler" onClick={() => {}} />
              <ToolbarButton icon={<Redo className="w-4 h-4" />} label="Rétablir" onClick={() => {}} />
            </div>

            {/* Content Editor */}
            <div className="rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 shadow-lg">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Commencez à écrire votre article...

Vous pouvez utiliser du HTML ou du Markdown pour formater votre contenu.

<h2>Titre de section</h2>
<p>Paragraphe avec du <strong>texte en gras</strong> et du <em>texte en italique</em>.</p>

<ul>
  <li>Premier élément</li>
  <li>Deuxième élément</li>
</ul>

<blockquote>
  Citation importante
</blockquote>

<pre><code>// Bloc de code
console.log('Hello World');
</code></pre>"
                rows={20}
                className="w-full p-6 text-dark-900 dark:text-white bg-transparent border-none outline-none resize-none font-mono text-sm"
              />
            </div>
          </div>

          {/* Settings Sidebar */}
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-80 flex-shrink-0 space-y-6"
            >
              {/* Category */}
              <div className="rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 p-4 shadow-lg">
                <h3 className="font-semibold text-dark-900 dark:text-white mb-3 flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  Catégorie
                </h3>
                <CategorySelect
                  categories={categories}
                  selectedId={categoryId}
                  onChange={setCategoryId}
                />
              </div>

              {/* Tags */}
              <div className="rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 p-4 shadow-lg">
                <h3 className="font-semibold text-dark-900 dark:text-white mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </h3>
                <TagInput
                  selectedTags={selectedTags}
                  availableTags={tags}
                  onAdd={handleAddTag}
                  onRemove={handleRemoveTag}
                  onCreate={handleCreateTag}
                />
              </div>

              {/* Options */}
              <div className="rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 p-4 shadow-lg">
                <h3 className="font-semibold text-dark-900 dark:text-white mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Options
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-5 h-5 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="flex items-center gap-2 text-dark-700 dark:text-dark-200">
                      <Star className="w-4 h-4 text-amber-500" />
                      Mettre en vedette
                    </span>
                  </label>
                </div>
              </div>

              {/* Status */}
              {isEditMode && (
                <div className="rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 p-4 shadow-lg">
                  <h3 className="font-semibold text-dark-900 dark:text-white mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Statut
                  </h3>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                    isPublished
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${isPublished ? 'bg-green-500' : 'bg-amber-500'}`} />
                    {isPublished ? 'Publié' : 'Brouillon'}
                  </div>
                  {isPublished && (
                    <button
                      onClick={() => unpublishMutation.mutate(articleId!)}
                      className="mt-3 w-full px-4 py-2 rounded-lg border border-dark-300 dark:border-dark-600 text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-700 text-sm"
                    >
                      Dépublier
                    </button>
                  )}
                </div>
              )}

              {/* Preview */}
              <div className="rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 p-4 shadow-lg">
                <h3 className="font-semibold text-dark-900 dark:text-white mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Aperçu
                </h3>
                <div className="p-4 rounded-lg bg-dark-50 dark:bg-dark-700/50">
                  {coverImage && (
                    <img src={coverImage} alt="Preview" className="w-full h-24 object-cover rounded-lg mb-3" />
                  )}
                  <h4 className="font-semibold text-dark-900 dark:text-white text-sm line-clamp-2">
                    {title || 'Titre de l\'article'}
                  </h4>
                  <p className="text-xs text-dark-500 dark:text-dark-400 mt-1 line-clamp-2">
                    {excerpt || 'Résumé de l\'article...'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-dark-200 dark:bg-dark-600 text-dark-600 dark:text-dark-300">
                      {categories.find((c) => c.id === categoryId)?.name || 'Catégorie'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

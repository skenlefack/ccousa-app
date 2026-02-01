import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, Activity, MapPin, Users,
  FileText, Bell, LayoutDashboard, Calendar, Syringe, ClipboardList,
  BookOpen, BarChart3, FolderCog, Search, Menu, X, ChevronLeft,
  ChevronRight, TrendingUp, TrendingDown, Clock, AlertTriangle,
  MessageSquare, Package, User, LogOut, ChevronDown, Circle, Check,
  Plus, Edit3, Trash2, Filter, Download, Upload, Shield, UserPlus,
  Users2, MoreVertical, Phone, Building2, RefreshCw, FolderTree, Minus,
  Camera, History, Monitor, Info, LogIn, Globe, Type, Hash, AtSign,
  ToggleLeft, List, CheckSquare, Radio, Image, Paperclip, Star, Sliders,
  AlignLeft, Heading, MinusCircle, Columns, Layers, Copy, Save, Play,
  Settings, ChevronUp, GripVertical, Maximize2, Code, Palette, Zap,
  MousePointer, Move, LayoutGrid, PanelLeftClose, PanelRightClose
} from 'lucide-react'

/* ============================================
   USER SESSION INTERFACE
   ============================================ */
interface UserSession {
  id: string
  identifier: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  photoUrl: string | null
  role: {
    id: string
    code: string
    name: string
    level: number
  }
  unit: {
    id: string
    name: string
  } | null
  defaultLanguage: 'fr' | 'en'
  timezone: string
}

interface AuthResponse {
  success: boolean
  message?: string
  data?: {
    token: string
    expiresIn: number
    user: UserSession
  }
}

/* ============================================
   TREE SELECT COMPONENT
   ============================================ */
interface TreeSelectOption {
  id: string
  name: string
  parentId: string | null
  icon?: React.ReactNode
}

interface TreeSelectProps {
  options: TreeSelectOption[]
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  excludeId?: string
  label?: string
}

function TreeSelect({ options, value, onChange, placeholder = "Sélectionner...", excludeId, label }: TreeSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter out excluded option and special groups
  const filteredOptions = options.filter(opt =>
    opt.id !== excludeId
  )

  // Get root nodes (no parent)
  const rootNodes = filteredOptions.filter(opt => !opt.parentId)

  // Get children of a node
  const getChildren = (parentId: string) => filteredOptions.filter(opt => opt.parentId === parentId)

  // Check if node has children
  const hasChildren = (nodeId: string) => filteredOptions.some(opt => opt.parentId === nodeId)

  // Filter by search term
  const matchesSearch = (node: TreeSelectOption): boolean => {
    if (searchTerm === '') return true
    const matches = node.name.toLowerCase().includes(searchTerm.toLowerCase())
    const childrenMatch = getChildren(node.id).some(child => matchesSearch(child))
    return matches || childrenMatch
  }

  // Toggle node expansion
  const toggleNode = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedNodes(prev =>
      prev.includes(nodeId)
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    )
  }

  // Select a node
  const selectNode = (node: TreeSelectOption | null) => {
    onChange(node?.id || null)
    setIsOpen(false)
    setSearchTerm('')
  }

  // Get selected option name
  const selectedOption = options.find(opt => opt.id === value)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Expand all nodes that match search
  useEffect(() => {
    if (searchTerm) {
      const nodesToExpand: string[] = []
      const findParents = (nodeId: string) => {
        const node = options.find(n => n.id === nodeId)
        if (node?.parentId) {
          nodesToExpand.push(node.parentId)
          findParents(node.parentId)
        }
      }
      options.forEach(opt => {
        if (opt.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          findParents(opt.id)
        }
      })
      setExpandedNodes(nodesToExpand)
    }
  }, [searchTerm, options])

  // Render tree node recursively
  const renderNode = (node: TreeSelectOption, level: number = 0): React.ReactNode => {
    if (!matchesSearch(node)) return null

    const children = getChildren(node.id)
    const isExpanded = expandedNodes.includes(node.id)
    const isSelected = value === node.id
    const nodeHasChildren = hasChildren(node.id)

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
            isSelected
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
          style={{ paddingLeft: `${12 + level * 20}px` }}
          onClick={() => selectNode(node)}
        >
          {nodeHasChildren ? (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleNode(node.id, e) }}
              className="p-0.5 hover:bg-slate-200 rounded transition-colors"
            >
              {isExpanded ? (
                <Minus className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <Plus className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
          ) : (
            <span className="w-4.5" />
          )}
          <FolderTree className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
          <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>{node.name}</span>
          {isSelected && <Check className="w-4 h-4 ml-auto text-blue-600" />}
        </div>
        {nodeHasChildren && isExpanded && (
          <div>
            {children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-xl text-sm transition-all ${
          isOpen
            ? 'border-blue-400 ring-2 ring-blue-400/20'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-slate-400" />
          <span className={selectedOption ? 'text-slate-700' : 'text-slate-400'}>
            {selectedOption?.name || placeholder}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-slide-up">
          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un groupe..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Tree */}
          <div className="max-h-64 overflow-y-auto">
            {/* Option "Aucun" */}
            <div
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors border-b border-slate-100 ${
                value === null
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
              onClick={() => selectNode(null)}
            >
              <X className="w-4 h-4 text-slate-400" />
              <span className="text-sm">Aucun (groupe racine)</span>
              {value === null && <Check className="w-4 h-4 ml-auto text-blue-600" />}
            </div>

            {/* Tree nodes */}
            {rootNodes.map(node => renderNode(node))}

            {/* No results */}
            {searchTerm && !rootNodes.some(node => matchesSearch(node)) && (
              <div className="px-4 py-6 text-center text-slate-500 text-sm">
                Aucun groupe trouvé
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================
   LOGIN PAGE - Design Futuriste
   ============================================ */
function LoginPage({ onLogin }: { onLogin: (user: UserSession) => void }) {
  const { t, i18n } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data: AuthResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Identifiants incorrects')
      }

      if (data.data) {
        // Sauvegarder le token avec expiration
        const expiresAt = Date.now() + (data.data.expiresIn * 1000)
        localStorage.setItem('auth_token', JSON.stringify({
          token: data.data.token,
          expiresAt
        }))

        // Sauvegarder les informations utilisateur
        localStorage.setItem('user_session', JSON.stringify(data.data.user))

        // Appliquer la langue par défaut de l'utilisateur
        if (data.data.user.defaultLanguage) {
          i18n.changeLanguage(data.data.user.defaultLanguage)
        }

        onLogin(data.data.user)
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Impossible de se connecter au serveur. Vérifiez votre connexion.')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Une erreur est survenue lors de la connexion')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 flex items-center justify-center relative">
      {/* Cercles décoratifs animés */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grand cercle externe */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/10 rounded-full animate-spin-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-400/20 rounded-full animate-spin-reverse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-teal-300/15 rounded-full animate-spin-slow" style={{ animationDuration: '25s' }} />

        {/* Cercles lumineux */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-teal-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-green-300/15 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-emerald-300/15 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />

        {/* Lignes circulaires décoratives */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
          <circle cx="50" cy="50" r="45" fill="none" stroke="url(#grad1)" strokeWidth="0.1" strokeDasharray="1 2" className="animate-spin-slow" style={{ transformOrigin: 'center' }} />
          <circle cx="50" cy="50" r="35" fill="none" stroke="url(#grad1)" strokeWidth="0.08" strokeDasharray="2 3" className="animate-spin-reverse" style={{ transformOrigin: 'center' }} />
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Points lumineux */}
        <div className="absolute top-20 right-20 w-1 h-1 bg-emerald-300 rounded-full animate-ping" />
        <div className="absolute bottom-32 left-32 w-1 h-1 bg-teal-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/3 left-20 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 flex items-center gap-16 px-8 max-w-6xl w-full">

        {/* Section gauche - Branding */}
        <div className="hidden lg:flex flex-col flex-1 text-white animate-slide-up">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl p-2 border border-white/20">
              <img src="/logo-minepia.png" alt="MINEPIA" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">CCOUSA<span className="text-emerald-300">-APP</span></h1>
              <p className="text-sm text-emerald-200/70 uppercase tracking-wider">{t('brand.slogan')}</p>
            </div>
          </div>

          <h2 className="text-3xl font-display font-bold leading-tight mb-4">
            {t('brand.title')}
            <span className="block text-emerald-300">{t('brand.titleHighlight')}</span>
          </h2>
          <p className="text-base text-white/60 mb-8 max-w-md">
            {t('brand.description')}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Activity className="w-5 h-5" />, title: t('features.realtime') },
              { icon: <MapPin className="w-5 h-5" />, title: t('features.geolocation') },
              { icon: <Users className="w-5 h-5" />, title: t('features.collaboration') },
              { icon: <FileText className="w-5 h-5" />, title: t('features.reports') },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                <div className="text-emerald-300">{f.icon}</div>
                <span className="text-sm font-medium text-white/80">{f.title}</span>
              </div>
            ))}
          </div>

          {/* Logos partenaires */}
          <div className="flex items-center justify-center gap-8 mt-10">
            <div className="w-24 h-24 bg-white rounded-full border-2 border-white/50 shadow-lg shadow-black/20 flex items-center justify-center overflow-hidden">
              <img src="/logo-minepia.png" alt="MINEPIA" className="w-[88px] h-[88px] object-contain" />
            </div>
            <div className="w-24 h-24 bg-white rounded-full border-2 border-white/50 shadow-lg shadow-black/20 flex items-center justify-center overflow-hidden">
              <img src="/patnuc-logo.png" alt="PATNUC" className="w-14 h-14 object-contain" />
            </div>
            <div className="w-24 h-24 bg-white rounded-full border-2 border-white/50 shadow-lg shadow-black/20 flex items-center justify-center overflow-hidden">
              <img src="/la-banque-mondiale-logo.png" alt="Banque Mondiale" className="w-16 h-16 object-contain" />
            </div>
          </div>

        </div>

        {/* Section droite - Formulaire */}
        <div className="w-full max-w-md animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl shadow-black/20">
            {/* Header mobile */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/10 rounded-xl p-1.5 border border-white/20">
                <img src="/logo-minepia.png" alt="MINEPIA" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-xl font-display font-bold text-white">CCOUSA<span className="text-emerald-300">-APP</span></h1>
            </div>

            {/* Titre */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-1">{t('login.title')}</h3>
              <p className="text-sm text-white/50">{t('login.subtitle')}</p>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-300">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">{t('login.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('login.emailPlaceholder')}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder-white/30 focus:bg-white/10 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">{t('login.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('login.passwordPlaceholder')}
                    className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder-white/30 focus:bg-white/10 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-400/30" />
                  <span className="text-white/50 group-hover:text-white/70 transition-colors">{t('login.rememberMe')}</span>
                </label>
                <a href="#" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">{t('login.forgotPassword')}</a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-base font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>{t('login.submit')} <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>

            {/* Séparateur */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/30 uppercase tracking-wider">{t('login.language')}</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Sélection de langue */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => changeLanguage('fr')}
                className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${i18n.language === 'fr' ? 'text-white bg-white/10 border border-white/20' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
              >
                Français
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${i18n.language === 'en' ? 'text-white bg-white/10 border border-white/20' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright en bas de page */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-xs text-white/30">{t('brand.copyright')}</p>
      </div>
    </div>
  )
}

/* ============================================
   SIDEBAR - Design avec fond vert et sous-menus
   ============================================ */
interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  badge?: number
  children?: { id: string; label: string }[]
}

function Sidebar({ activeItem, onItemClick, isCollapsed, onToggleCollapse, isMobileOpen, onMobileClose }: {
  activeItem: string
  onItemClick: (id: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  isMobileOpen: boolean
  onMobileClose: () => void
}) {
  const { t } = useTranslation()
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['events'])
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null)

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: <LayoutDashboard className="w-5 h-5" /> },
    {
      id: 'events',
      label: t('sidebar.events'),
      icon: <Activity className="w-5 h-5" />,
      badge: 12,
      children: [
        { id: 'events-inprogress', label: t('sidebar.eventsInProgress') },
        { id: 'events-received', label: t('sidebar.eventsReceived') },
        { id: 'events-processed', label: t('sidebar.eventsProcessed') },
        { id: 'events-scheduled', label: t('sidebar.eventsScheduled') },
      ]
    },
    { id: 'reports', label: t('sidebar.reports'), icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'knowledge', label: t('sidebar.knowledge'), icon: <BookOpen className="w-5 h-5" /> },
    {
      id: 'settings',
      label: t('sidebar.settings'),
      icon: <FolderCog className="w-5 h-5" />,
      children: [
        { id: 'settings-forms', label: t('sidebar.settingsForms') },
        { id: 'settings-procedures', label: t('sidebar.settingsProcedures') },
        { id: 'settings-categories', label: t('sidebar.settingsCategories') },
        { id: 'settings-doctypes', label: t('sidebar.settingsDocTypes') },
        { id: 'settings-origins', label: t('sidebar.settingsOrigins') },
      ]
    },
    {
      id: 'users',
      label: t('sidebar.users'),
      icon: <Users className="w-5 h-5" />,
      children: [
        { id: 'users-groups', label: t('sidebar.usersGroups') },
        { id: 'users-rights', label: t('sidebar.usersRights') },
        { id: 'users-management', label: t('sidebar.usersManagement') },
      ]
    },
    {
      id: 'config',
      label: t('sidebar.config'),
      icon: <ClipboardList className="w-5 h-5" />,
      children: [
        { id: 'config-schedule', label: t('sidebar.configSchedule') },
        { id: 'config-system', label: t('sidebar.configSystem') },
      ]
    },
  ]

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    )
  }

  const isMenuExpanded = (menuId: string) => expandedMenus.includes(menuId)

  const isItemActive = (itemId: string, children?: { id: string }[]) => {
    if (activeItem === itemId) return true
    if (children) return children.some(child => activeItem === child.id)
    return false
  }

  return (
    <>
      {isMobileOpen && <div className="fixed inset-0 bg-emerald-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={onMobileClose} />}

      {/* Bouton toggle - cercle positionné à la limite de la sidebar */}
      <button
        onClick={onToggleCollapse}
        style={{ left: isCollapsed ? '56px' : '264px' }}
        className="hidden lg:flex fixed top-5 z-[100] w-7 h-7 bg-white rounded-full shadow-lg items-center justify-center text-emerald-700 hover:bg-emerald-50 hover:scale-110 transition-all duration-300 border border-emerald-200"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <aside className={`fixed top-0 left-0 h-full bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 z-50 flex flex-col transition-all duration-300 shadow-2xl ${isCollapsed ? 'w-16 overflow-visible' : 'w-[270px]'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Effets circulaires décoratifs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] border border-white/5 rounded-full" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[200px] h-[200px] border border-emerald-400/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[150px] h-[150px] border border-teal-300/10 rounded-full" />
          <div className="absolute top-20 -left-10 w-24 h-24 bg-emerald-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 -right-10 w-32 h-32 bg-teal-400/10 rounded-full blur-3xl" />
          <div className="absolute top-32 right-4 w-1 h-1 bg-emerald-300/50 rounded-full animate-pulse" />
          <div className="absolute bottom-40 left-6 w-1 h-1 bg-teal-300/50 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Header avec logo */}
        <div className={`relative z-10 flex items-center h-[72px] border-b border-white/10 ${isCollapsed ? 'justify-center px-2' : 'px-5'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl p-0.5 shadow-lg shadow-black/20 flex-shrink-0">
              <img src="/logo-minepia.png" alt="MINEPIA" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="text-xl font-display font-bold text-white truncate">CCOUSA<span className="text-emerald-300">-APP</span></h1>
                <p className="text-sm text-emerald-200/70 truncate">Santé Animale</p>
              </div>
            )}
          </div>
          <button onClick={onMobileClose} className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors ml-auto">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`relative z-10 flex-1 ${isCollapsed ? 'overflow-visible px-2' : 'overflow-y-auto scrollbar-hide px-3'} py-4`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {!isCollapsed && (
            <p className="px-3 mb-3 text-[10px] font-semibold text-emerald-200/50 uppercase tracking-wider">Menu principal</p>
          )}
          <ul className={`${isCollapsed ? 'space-y-2' : 'space-y-1'}`}>
            {menuItems.map((item) => (
              <li key={item.id}>
                {isCollapsed ? (
                  /* Mode réduit - Icônes avec popup pour sous-menus */
                  <div
                    className="relative"
                    onMouseEnter={() => setHoveredMenu(item.id)}
                    onMouseLeave={() => setHoveredMenu(null)}
                  >
                    <button
                      onClick={() => item.children ? setHoveredMenu(item.id) : onItemClick(item.id)}
                      className="group relative w-full flex items-center justify-center py-2"
                    >
                      <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isItemActive(item.id, item.children)
                          ? 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 text-white shadow-lg shadow-emerald-500/40'
                          : 'text-white/50 hover:text-white'
                      }`}>
                        {!isItemActive(item.id, item.children) && (
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg shadow-emerald-500/30" />
                        )}
                        <span className={`relative z-10 transition-all duration-300 ${!isItemActive(item.id, item.children) ? 'group-hover:scale-110 group-hover:text-white' : ''}`}>
                          {item.icon}
                        </span>
                        {item.badge && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[9px] font-bold bg-red-500 text-white rounded-full shadow-md">
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Popup pour mode réduit */}
                    {hoveredMenu === item.id && (
                      <div className="absolute left-full ml-3 top-0 z-[9999] animate-slide-up">
                        <div className="relative flex items-start">
                          <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-emerald-800 mt-4" />
                          <div className="bg-gradient-to-br from-emerald-800 to-teal-800 rounded-xl shadow-2xl border border-white/10 overflow-hidden min-w-[220px]">
                            <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                              <span className="text-[15px] font-semibold text-white">{item.label}</span>
                            </div>
                            {item.children ? (
                              <div className="py-1">
                                {item.children.map((child) => (
                                  <button
                                    key={child.id}
                                    onClick={() => {
                                      onItemClick(child.id)
                                      setHoveredMenu(null)
                                    }}
                                    className={`w-full text-left px-4 py-3 text-[14px] transition-colors ${
                                      activeItem === child.id
                                        ? 'bg-emerald-500/30 text-emerald-200'
                                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                                  >
                                    {child.label}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  onItemClick(item.id)
                                  setHoveredMenu(null)
                                }}
                                className="w-full text-left px-4 py-3 text-[14px] text-white/70 hover:bg-white/10 hover:text-white"
                              >
                                Ouvrir
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Mode étendu avec sous-menus */
                  <div>
                    <button
                      onClick={() => item.children ? toggleMenu(item.id) : onItemClick(item.id)}
                      className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                        isItemActive(item.id, item.children)
                          ? 'bg-white/20 text-white shadow-md backdrop-blur-sm border border-white/20'
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {isItemActive(item.id, item.children) && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-300 rounded-r-full shadow-lg shadow-emerald-400/50" />
                      )}

                      <span className={`transition-transform duration-200 ${isItemActive(item.id, item.children) ? 'text-emerald-300' : 'group-hover:scale-110'}`}>
                        {item.icon}
                      </span>

                      <span className="flex-1 text-left text-[15px]">{item.label}</span>

                      {item.badge && (
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                          isItemActive(item.id, item.children)
                            ? 'bg-emerald-400/30 text-emerald-200'
                            : 'bg-white/10 text-white/70'
                        }`}>
                          {item.badge}
                        </span>
                      )}

                      {item.children && (
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMenuExpanded(item.id) ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {/* Sous-menu */}
                    {item.children && isMenuExpanded(item.id) && (
                      <div className="mt-1.5 ml-4 pl-4 border-l-2 border-white/10 space-y-1">
                        {item.children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => onItemClick(child.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-[14px] transition-all duration-200 ${
                              activeItem === child.id
                                ? 'bg-emerald-500/30 text-emerald-200 font-medium'
                                : 'text-white/50 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2 h-2 rounded-full ${activeItem === child.id ? 'bg-emerald-400' : 'bg-white/30'}`} />
                              {child.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

      </aside>
    </>
  )
}

/* ============================================
   USER STATUS TYPE
   ============================================ */
type UserStatus = 'available' | 'onBreak' | 'inMeeting' | 'outOfOffice' | 'inTraining' | 'onMission' | 'onLeave' | 'unavailable'

const statusColors: Record<UserStatus, { bg: string; dot: string; ring: string }> = {
  available: { bg: 'bg-emerald-500', dot: 'bg-emerald-500', ring: 'ring-emerald-500/30' },
  onBreak: { bg: 'bg-amber-500', dot: 'bg-amber-500', ring: 'ring-amber-500/30' },
  inMeeting: { bg: 'bg-blue-500', dot: 'bg-blue-500', ring: 'ring-blue-500/30' },
  outOfOffice: { bg: 'bg-slate-400', dot: 'bg-slate-400', ring: 'ring-slate-400/30' },
  inTraining: { bg: 'bg-purple-500', dot: 'bg-purple-500', ring: 'ring-purple-500/30' },
  onMission: { bg: 'bg-orange-500', dot: 'bg-orange-500', ring: 'ring-orange-500/30' },
  onLeave: { bg: 'bg-pink-500', dot: 'bg-pink-500', ring: 'ring-pink-500/30' },
  unavailable: { bg: 'bg-red-500', dot: 'bg-red-500', ring: 'ring-red-500/30' },
}

/* ============================================
   HEADER
   ============================================ */
function Header({ onMenuToggle, currentPage, onLogout, onProfileClick, userSession }: { onMenuToggle: () => void; currentPage: string; onLogout: () => void; onProfileClick: () => void; userSession: UserSession | null }) {
  const { t } = useTranslation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [userStatus, setUserStatus] = useState<UserStatus>('available')
  const menuRef = useRef<HTMLDivElement>(null)

  // Données utilisateur depuis la session
  const currentUser = {
    name: userSession ? `${userSession.firstName} ${userSession.lastName}` : 'Utilisateur',
    role: userSession?.role.name || 'Utilisateur',
    avatar: userSession?.photoUrl || null,
    initials: userSession ? `${userSession.firstName[0]}${userSession.lastName[0]}` : 'U',
  }

  const titles: Record<string, string> = {
    dashboard: t('header.dashboard'),
    'my-profile': t('header.myProfile'),
    // Événements
    'events-inprogress': t('sidebar.eventsInProgress'),
    'events-received': t('sidebar.eventsReceived'),
    'events-processed': t('sidebar.eventsProcessed'),
    'events-scheduled': t('sidebar.eventsScheduled'),
    // Rapports & Connaissance
    reports: t('sidebar.reports'),
    knowledge: t('sidebar.knowledge'),
    // Paramétrages
    'settings-forms': t('sidebar.settingsForms'),
    'settings-procedures': t('sidebar.settingsProcedures'),
    'settings-categories': t('sidebar.settingsCategories'),
    'settings-doctypes': t('sidebar.settingsDocTypes'),
    'settings-origins': t('sidebar.settingsOrigins'),
    // Utilisateurs
    'users-groups': t('sidebar.usersGroups'),
    'users-rights': t('sidebar.usersRights'),
    'users-management': t('sidebar.usersManagement'),
    // Configurations
    'config-schedule': t('sidebar.configSchedule'),
    'config-system': t('sidebar.configSystem'),
  }

  const statusOptions: UserStatus[] = ['available', 'onBreak', 'inMeeting', 'outOfOffice', 'inTraining', 'onMission', 'onLeave', 'unavailable']

  // Fermer le menu quand on clique dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-30 h-[72px] bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
      <div className="h-full flex items-center justify-between px-4 lg:px-6">
        {/* Titre de la page */}
        <div className="flex items-center gap-4">
          <button onClick={onMenuToggle} className="lg:hidden p-2.5 hover:bg-slate-100 rounded-xl">
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-xl font-display font-bold text-slate-800">{titles[currentPage] || t('header.dashboard')}</h1>
        </div>

        {/* Actions à droite */}
        <div className="flex items-center gap-3">
          {/* Bouton Messagerie */}
          <button
            className="group relative flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            title={t('header.messaging')}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="hidden md:inline text-sm font-semibold">{t('header.messaging')}</span>
            {/* Badge notifications */}
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full border-2 border-white">5</span>
          </button>

          {/* Bouton Gestion Matériel */}
          <button
            className="group flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            title={t('header.equipment')}
          >
            <Package className="w-5 h-5" />
            <span className="hidden md:inline text-sm font-semibold">{t('header.equipment')}</span>
          </button>

          {/* Notifications */}
          <button className="relative p-3 hover:bg-slate-100 rounded-xl transition-colors">
            <Bell className="w-6 h-6 text-slate-600" />
            <span className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">3</span>
          </button>

          {/* Séparateur */}
          <div className="hidden sm:block w-px h-10 bg-slate-200 mx-2" />

          {/* Menu Utilisateur */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 p-2 pr-4 hover:bg-slate-100 rounded-xl transition-all cursor-pointer group"
            >
              {/* Avatar avec indicateur de statut */}
              <div className="relative">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-white shadow-md"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-base ring-2 ring-white shadow-md">
                    {currentUser.initials}
                  </div>
                )}
                {/* Indicateur de statut */}
                <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${statusColors[userStatus].dot} rounded-full border-2 border-white`} />
              </div>

              {/* Infos utilisateur */}
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-[15px] font-semibold text-slate-800 leading-tight">{currentUser.name}</span>
                <span className="text-xs text-slate-500 leading-tight">{currentUser.role}</span>
              </div>

              {/* Chevron */}
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Menu déroulant */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up z-50">
                {/* En-tête du menu avec info utilisateur */}
                <div className="px-4 py-4 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white">
                  <div className="flex items-center gap-3">
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/30"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg ring-2 ring-white/30">
                        {currentUser.initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{currentUser.name}</p>
                      <p className="text-xs text-white/80 truncate">{currentUser.role}</p>
                    </div>
                  </div>
                </div>

                {/* Section Statut */}
                <div className="p-3 border-b border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">{t('header.changeStatus')}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {statusOptions.map((status) => (
                      <button
                        key={status}
                        onClick={() => setUserStatus(status)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          userStatus === status
                            ? `${statusColors[status].bg} text-white shadow-md`
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Circle className={`w-2.5 h-2.5 ${userStatus === status ? 'text-white fill-white' : statusColors[status].dot} ${userStatus !== status ? 'fill-current' : ''}`} />
                        <span className="truncate">{t(`userStatus.${status}`)}</span>
                        {userStatus === status && <Check className="w-3 h-3 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      onProfileClick()
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors text-sm font-medium"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                    {t('header.myProfile')}
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      onLogout()
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium mt-1"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <LogOut className="w-4 h-4 text-red-600" />
                    </div>
                    {t('header.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

/* ============================================
   DASHBOARD - Design Amélioré
   ============================================ */
function Dashboard({ userSession }: { userSession: UserSession | null }) {
  const { t } = useTranslation()

  const stats = [
    { title: t('dashboard.totalEvents'), value: '1,248', change: 12, icon: <Activity className="w-5 h-5" />, color: 'from-emerald-500 to-teal-600', bgLight: 'bg-emerald-50', textColor: 'text-emerald-600' },
    { title: t('dashboard.inProgress'), value: '156', change: -5, icon: <Clock className="w-5 h-5" />, color: 'from-blue-500 to-indigo-600', bgLight: 'bg-blue-50', textColor: 'text-blue-600' },
    { title: t('dashboard.activeAlerts'), value: '23', change: 8, icon: <AlertTriangle className="w-5 h-5" />, color: 'from-amber-500 to-orange-600', bgLight: 'bg-amber-50', textColor: 'text-amber-600' },
    { title: t('dashboard.confirmedOutbreaks'), value: '7', change: -15, icon: <AlertTriangle className="w-5 h-5" />, color: 'from-rose-500 to-red-600', bgLight: 'bg-rose-50', textColor: 'text-rose-600' },
  ]

  const events = [
    { code: 'EVT-2025-001', title: 'Suspicion PPA - Ferme Mbanga', location: 'Littoral', status: 'urgent', date: '26 Jan', priority: 1 },
    { code: 'EVT-2025-002', title: 'Campagne vaccination bovine', location: 'Nord', status: 'in-progress', date: '25 Jan', priority: 2 },
    { code: 'EVT-2025-003', title: 'Inspection sanitaire marché', location: 'Centre', status: 'open', date: '24 Jan', priority: 3 },
    { code: 'EVT-2024-198', title: 'Foyer grippe aviaire', location: 'Ouest', status: 'closed', date: '20 Jan', priority: 4 },
  ]

  const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    urgent: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    'in-progress': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    open: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    closed: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  }

  const statusLabels: Record<string, string> = {
    urgent: t('status.urgent'),
    'in-progress': t('status.inProgress'),
    open: t('status.open'),
    closed: t('status.closed'),
  }

  const regions = [
    { name: 'Adamaoua', events: 23, color: 'bg-emerald-500' },
    { name: 'Centre', events: 45, color: 'bg-blue-500' },
    { name: 'Est', events: 12, color: 'bg-purple-500' },
    { name: 'Extrême-Nord', events: 67, color: 'bg-orange-500' },
    { name: 'Littoral', events: 34, color: 'bg-teal-500' },
    { name: 'Nord', events: 56, color: 'bg-rose-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Hero Section avec fond animé */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-8 text-white animate-slide-up">
        {/* Cercles décoratifs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm mb-4">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/90">Système opérationnel</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
              {t('dashboard.welcome')}, <span className="text-emerald-200">{userSession?.firstName || 'Utilisateur'}</span>
            </h2>
            <p className="text-white/70 max-w-lg text-lg">{t('dashboard.welcomeSubtitle')}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 px-5 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              <Activity className="w-5 h-5" /> {t('dashboard.newEvent')}
            </button>
            <button className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20">
              <BarChart3 className="w-5 h-5" /> {t('dashboard.report')}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="group relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 animate-slide-up overflow-hidden border border-slate-100 hover:border-slate-200"
            style={{ animationDelay: `${(i + 1) * 100}ms` }}
          >
            {/* Gradient accent */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color}`} />

            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 ${stat.bgLight} rounded-xl flex items-center justify-center ${stat.textColor} group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${stat.change >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {stat.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(stat.change)}%
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-1 font-medium">{stat.title}</p>
            <p className="text-3xl font-display font-bold text-slate-800">{stat.value}</p>

            {/* Mini chart decoration */}
            <div className="absolute bottom-0 right-0 w-24 h-12 opacity-10">
              <svg viewBox="0 0 100 40" className={`w-full h-full ${stat.textColor}`}>
                <path d="M0,35 Q25,25 50,30 T100,20" fill="none" stroke="currentColor" strokeWidth="3"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Events List - 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-slate-800">{t('dashboard.recentEvents')}</h3>
                <p className="text-xs text-slate-500">4 nouveaux aujourd'hui</p>
              </div>
            </div>
            <button className="flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-colors">
              {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-50">
            {events.map((event, i) => (
              <div
                key={event.code}
                className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-all cursor-pointer group"
              >
                <div className="relative">
                  <div className={`w-12 h-12 rounded-xl ${statusConfig[event.status].bg} flex items-center justify-center transition-transform group-hover:scale-105`}>
                    <Activity className={`w-5 h-5 ${statusConfig[event.status].text}`} />
                  </div>
                  <span className={`absolute -top-1 -right-1 w-3 h-3 ${statusConfig[event.status].dot} rounded-full border-2 border-white`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{event.code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusConfig[event.status].bg} ${statusConfig[event.status].text}`}>
                      {statusLabels[event.status]}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">{event.title}</p>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.location}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{event.date}</span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </div>

        {/* Regions Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-slate-800">Régions</h3>
                <p className="text-xs text-slate-500">Répartition des événements</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {regions.map((region, i) => (
              <div key={i} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-700">{region.name}</span>
                  <span className="text-sm font-bold text-slate-800">{region.events}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${region.color} rounded-full transition-all duration-500 group-hover:opacity-80`}
                    style={{ width: `${(region.events / 70) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-100">
            <button className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 px-4 py-2.5 rounded-xl transition-colors">
              <MapPin className="w-4 h-4" /> Voir la carte
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="animate-slide-up" style={{ animationDelay: '600ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-bold text-slate-800">{t('dashboard.quickActions')}</h3>
          <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Raccourcis</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Activity className="w-6 h-6" />, label: t('dashboard.newEvent'), color: 'from-emerald-500 to-teal-600', hoverBg: 'hover:bg-emerald-50' },
            { icon: <Syringe className="w-6 h-6" />, label: t('dashboard.vaccination'), color: 'from-green-500 to-emerald-600', hoverBg: 'hover:bg-green-50' },
            { icon: <Users className="w-6 h-6" />, label: t('dashboard.user'), color: 'from-blue-500 to-indigo-600', hoverBg: 'hover:bg-blue-50' },
            { icon: <FileText className="w-6 h-6" />, label: t('dashboard.report'), color: 'from-purple-500 to-violet-600', hoverBg: 'hover:bg-purple-50' },
          ].map((action, i) => (
            <button
              key={i}
              className={`group relative flex flex-col items-center gap-3 p-5 bg-white rounded-2xl shadow-sm border border-slate-100 ${action.hoverBg} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center overflow-hidden`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <span className="font-semibold text-slate-700 group-hover:text-slate-900">{action.label}</span>

              {/* Hover effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '700ms' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Utilisateurs actifs', value: '234', icon: <Users className="w-5 h-5" /> },
            { label: 'Rapports générés', value: '1,892', icon: <FileText className="w-5 h-5" /> },
            { label: 'Vaccinations', value: '45,672', icon: <Syringe className="w-5 h-5" /> },
            { label: 'Temps de réponse', value: '2.4h', icon: <Clock className="w-5 h-5" /> },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-white/10 rounded-xl text-emerald-400 mb-2">
                {item.icon}
              </div>
              <p className="text-2xl font-display font-bold text-white">{item.value}</p>
              <p className="text-xs text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ============================================
   USERS MANAGEMENT PAGE
   ============================================ */
interface UserData {
  id: string
  identifier: string
  email: string
  firstName: string
  lastName: string
  phone: string
  role: { id: string; code: string; name: string; level: number }
  functions: string[]
  unit: { id: string; name: string } | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  photoUrl: string | null
  defaultLanguage: 'fr' | 'en'
  timezone: string
}

function UsersManagementPage() {
  const { t } = useTranslation()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // États pour les données API
  const [users, setUsers] = useState<UserData[]>([])
  const [roles, setRoles] = useState<Array<{ id: string; code: string; name: string; level: number }>>([])
  const [organizationalUnits, setOrganizationalUnits] = useState<Array<{ id: string; name: string; code: string; parent_id: string | null; group_type: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // Restaurer l'état du formulaire depuis localStorage
  const [currentView, setCurrentViewState] = useState<'list' | 'form'>(() => {
    const saved = localStorage.getItem('users_view')
    return (saved === 'form') ? 'form' : 'list'
  })
  const [editingUser, setEditingUserState] = useState<UserData | null>(() => {
    try {
      const saved = localStorage.getItem('users_editing')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  // Wrapper pour sauvegarder l'état
  const setCurrentView = (view: 'list' | 'form') => {
    setCurrentViewState(view)
    localStorage.setItem('users_view', view)
    if (view === 'list') {
      localStorage.removeItem('users_editing')
      setEditingUserState(null)
    }
  }
  const setEditingUser = (user: UserData | null) => {
    setEditingUserState(user)
    if (user) {
      localStorage.setItem('users_editing', JSON.stringify(user))
    } else {
      localStorage.removeItem('users_editing')
    }
  }

  // Charger les données depuis l'API
  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }

    try {
      // Charger utilisateurs, rôles et groupes en parallèle
      const [usersRes, rolesRes, groupsRes] = await Promise.all([
        fetch(`${API_URL}/api/users`, { headers }),
        fetch(`${API_URL}/api/users/roles`, { headers }),
        fetch(`${API_URL}/api/users/groups/list`, { headers })
      ])

      if (!usersRes.ok || !rolesRes.ok || !groupsRes.ok) {
        throw new Error('Erreur lors du chargement des données')
      }

      const usersData = await usersRes.json()
      const rolesData = await rolesRes.json()
      const groupsData = await groupsRes.json()

      // Transformer les données utilisateurs pour correspondre au format attendu
      const transformedUsers: UserData[] = (usersData.data || []).map((u: {
        id: string
        identifier?: string
        email: string
        first_name: string
        last_name: string
        phone?: string
        photo_url?: string
        is_active: boolean
        last_login_at?: string
        created_at: string
        role_id?: string
        role_name?: string
        organizational_unit_id?: string
        organizational_unit_name?: string
        function?: string
        default_language?: string
        timezone?: string
      }) => ({
        id: u.id,
        identifier: u.identifier || `USR${u.id.substring(0, 3).toUpperCase()}`,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        phone: u.phone || null,
        photoUrl: u.photo_url || null,
        role: {
          id: u.role_id || '',
          code: rolesData.data?.find((r: { id: string; name: string }) => r.name === u.role_name)?.code || 'USER_SIMPLE',
          name: u.role_name || 'Utilisateur',
          level: rolesData.data?.find((r: { id: string; name: string }) => r.name === u.role_name)?.level || 1
        },
        functions: u.function ? [u.function] : [],
        unit: u.organizational_unit_id ? {
          id: u.organizational_unit_id,
          name: u.organizational_unit_name || ''
        } : null,
        isActive: u.is_active,
        lastLoginAt: u.last_login_at || null,
        createdAt: u.created_at,
        defaultLanguage: (u.default_language as 'fr' | 'en') || 'fr',
        timezone: u.timezone || 'Africa/Douala'
      }))

      setUsers(transformedUsers)
      setRoles(rolesData.data || [])
      // Les groupes sont utilisés à la fois pour les fonctions et les unités organisationnelles
      const allGroups = groupsData.data || []
      setOrganizationalUnits(allGroups.map((g: { id: string; name: string; code: string; parent_id: string | null; group_type?: string }) => ({
        id: g.id,
        name: g.name,
        code: g.code,
        parent_id: g.parent_id,
        group_type: g.group_type || 'organizational'
      })))
    } catch (err) {
      console.error('Erreur chargement données:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }

  // Charger les données au montage
  useEffect(() => {
    fetchData()
  }, [])

  // Créer ou modifier un utilisateur
  const saveUser = async (userData: {
    identifier?: string
    email: string
    password?: string
    firstName: string
    lastName: string
    roleId: string
    organizationalUnitId?: string
    phone?: string
    isActive?: boolean
  }) => {
    setIsSaving(true)
    setFormError(null)
    setFormSuccess(null)
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }

    try {
      const url = editingUser
        ? `${API_URL}/api/users/${editingUser.id}`
        : `${API_URL}/api/users`
      const method = editingUser ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(userData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de la sauvegarde')
      }

      // Afficher le message de succès
      setFormSuccess(editingUser ? 'Utilisateur mis à jour avec succès' : 'Utilisateur créé avec succès')

      // Recharger la liste après un court délai
      setTimeout(async () => {
        await fetchData()
        setCurrentView('list')
        setFormSuccess(null)
      }, 1500)
    } catch (err) {
      console.error('Erreur sauvegarde:', err)
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
      // Auto-dismiss error after 5 seconds
      setTimeout(() => setFormError(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  // Supprimer un utilisateur
  const deleteUser = async (userId: string) => {
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }

    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      await fetchData()
      setShowDeleteConfirm(null)
    } catch (err) {
      console.error('Erreur suppression:', err)
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  // Mapper les rôles pour l'affichage avec traductions
  const rolesForFilter = roles.map(r => ({
    code: r.code || r.name.toUpperCase().replace(/\s+/g, '_'),
    name: r.name
  }))

  // Available functions from groups of type 'function'
  const availableFunctions = organizationalUnits
    .filter(g => g.group_type === 'function')
    .map(g => g.name)

  // Organizational units from groups of type 'organizational'
  const orgUnitsFiltered = organizationalUnits
    .filter(g => g.group_type === 'organizational')

  // Available timezones
  const timezones = [
    { code: 'Africa/Douala', name: 'Douala (UTC+1)' },
    { code: 'Africa/Lagos', name: 'Lagos (UTC+1)' },
    { code: 'Africa/Johannesburg', name: 'Johannesburg (UTC+2)' },
    { code: 'Europe/Paris', name: 'Paris (UTC+1/+2)' },
    { code: 'UTC', name: 'UTC (UTC+0)' },
  ]

  // State for functions autocomplete
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>(editingUser?.functions || [])
  const [functionSearch, setFunctionSearch] = useState('')
  const [showFunctionDropdown, setShowFunctionDropdown] = useState(false)
  const functionDropdownRef = useRef<HTMLDivElement>(null)

  // Close function dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (functionDropdownRef.current && !functionDropdownRef.current.contains(event.target as Node)) {
        setShowFunctionDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter functions based on search
  const filteredFunctions = availableFunctions.filter(fn =>
    fn.toLowerCase().includes(functionSearch.toLowerCase()) &&
    !selectedFunctions.includes(fn)
  )

  const addFunction = (fn: string) => {
    setSelectedFunctions(prev => [...prev, fn])
    setFunctionSearch('')
    setShowFunctionDropdown(false)
  }

  const removeFunction = (fn: string) => {
    setSelectedFunctions(prev => prev.filter(f => f !== fn))
  }

  // Reset selected functions when editing user changes
  useEffect(() => {
    setSelectedFunctions(editingUser?.functions || [])
    setFunctionSearch('')
    setShowFunctionDropdown(false)
  }, [editingUser])

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.identifier.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role.code === filterRole
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive)
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleBadgeColor = (code: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
      ADMIN: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      MANAGER: 'bg-blue-100 text-blue-700 border-blue-200',
      VALIDATOR: 'bg-teal-100 text-teal-700 border-teal-200',
      CONTENT_MANAGER: 'bg-amber-100 text-amber-700 border-amber-200',
      USER_SIMPLE: 'bg-slate-100 text-slate-700 border-slate-200',
    }
    return colors[code] || 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">{t('usersModule.usersList')}</h1>
          <p className="text-sm text-slate-500 mt-1">{filteredUsers.length} utilisateur(s) trouvé(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">{t('usersModule.export')}</span>
          </button>
          <button
            onClick={() => { setEditingUser(null); setCurrentView('form') }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            <span className="text-sm font-medium">{t('usersModule.addUser')}</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-600">{t('usersModule.loading')}</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 rounded-2xl border border-red-200 p-4 text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Réessayer
          </button>
        </div>
      )}

      {!isLoading && !error && currentView === 'list' ? (
      <>
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('usersModule.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
            />
          </div>

          {/* Role Filter */}
          <div className="relative min-w-[180px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="all">{t('usersModule.filterByRole')}</option>
              {rolesForFilter.map(role => (
                <option key={role.code} value={role.code}>{role.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative min-w-[160px]">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="all">{t('usersModule.filterByStatus')}</option>
              <option value="active">{t('usersModule.active')}</option>
              <option value="inactive">{t('usersModule.inactive')}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Refresh */}
          <button className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
          <button onClick={fetchData} className="ml-2 underline">Réessayer</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
            <p className="text-slate-500">Chargement des utilisateurs...</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilisateur</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">{t('usersModule.role')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">{t('usersModule.unit')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">{t('usersModule.lastLogin')}</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('usersModule.status')}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('usersModule.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {user.photoUrl ? (
                          <img src={user.photoUrl} alt={`${user.firstName} ${user.lastName}`} className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                        )}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${user.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        <p className="text-[10px] text-slate-400 font-mono md:hidden">{user.identifier}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getRoleBadgeColor(user.role.code)}`}>
                      <Shield className="w-3 h-3" />
                      {user.role.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="truncate max-w-[150px]">{user.unit?.name || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-sm text-slate-600">{formatDate(user.lastLoginAt)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {user.isActive ? t('usersModule.active') : t('usersModule.inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditingUser(user); setCurrentView('form') }}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title={t('usersModule.edit')}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(user.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('usersModule.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
      </>
      ) : (
      /* Form View */
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up">
        {/* Form Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-600">
          <h2 className="text-lg font-display font-bold text-white">
            {editingUser ? t('usersModule.editUser') : t('usersModule.addUser')}
          </h2>
          <button
            onClick={() => { setCurrentView('list'); setEditingUser(null); setFormError(null); setFormSuccess(null) }}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-white text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        </div>

        {/* Form Content */}
        <div className="p-4">
          {/* Toast Notifications */}
          {formError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-slide-up">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-800">Erreur</h4>
                <p className="text-sm text-red-600">{formError}</p>
              </div>
              <button onClick={() => setFormError(null)} className="text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {formSuccess && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 animate-slide-up">
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-emerald-800">Succès</h4>
                <p className="text-sm text-emerald-600">{formSuccess}</p>
              </div>
            </div>
          )}

          <form key={editingUser?.id || 'new'} className="space-y-3" onSubmit={(e) => {
            e.preventDefault()
            setFormError(null)
            const formData = new FormData(e.currentTarget)
            const password = formData.get('password') as string
            const confirmPassword = formData.get('confirmPassword') as string

            if (!editingUser && (!password || password.length < 6)) {
              setFormError('Le mot de passe doit contenir au moins 6 caractères')
              return
            }
            if (password && password !== confirmPassword) {
              setFormError('Les mots de passe ne correspondent pas')
              return
            }

            const userData = {
              identifier: formData.get('identifier') as string || undefined,
              email: formData.get('email') as string,
              firstName: formData.get('firstName') as string,
              lastName: formData.get('lastName') as string,
              roleId: formData.get('roleId') as string,
              phone: formData.get('phone') as string || undefined,
              organizationalUnitId: formData.get('organizationalUnitId') as string || undefined,
              ...(password && { password })
            }
            saveUser(userData)
          }}>
            {/* Section: Informations personnelles */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Informations personnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('usersModule.firstName')} *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    defaultValue={editingUser?.firstName}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('usersModule.lastName')} *</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    defaultValue={editingUser?.lastName}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                    placeholder="Kamga"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('usersModule.email')} *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    defaultValue={editingUser?.email}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                    placeholder="email@exemple.cm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('usersModule.phone')}</label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={editingUser?.phone || ''}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
              </div>
            </div>

            {/* Section: Authentification */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Authentification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('usersModule.identifier')} *</label>
                  <input
                    type="text"
                    name="identifier"
                    defaultValue={editingUser?.identifier}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all font-mono"
                    placeholder="USR001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {editingUser ? 'Nouveau mot de passe' : t('usersModule.password')} {!editingUser && '*'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                    placeholder={editingUser ? "Laisser vide pour conserver" : "••••••••"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t('usersModule.confirmPassword')} {!editingUser && '*'}
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                    placeholder={editingUser ? "Laisser vide pour conserver" : "••••••••"}
                  />
                </div>
              </div>
            </div>

            {/* Section: Rôle et Organisation */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Rôle et Organisation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('usersModule.role')} *</label>
                  <select
                    name="roleId"
                    required
                    defaultValue={editingUser?.role.id || ''}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Sélectionner un rôle</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('usersModule.function')}(s)</label>
                  <div className="relative" ref={functionDropdownRef}>
                    {/* Selected functions as tags */}
                    <div className="min-h-[42px] px-3 py-2 bg-white border border-slate-200 rounded-xl flex flex-wrap gap-2 items-center focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
                      {selectedFunctions.map(fn => (
                        <span key={fn} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">
                          {fn}
                          <button
                            type="button"
                            onClick={() => removeFunction(fn)}
                            className="hover:text-emerald-900 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={functionSearch}
                        onChange={(e) => {
                          setFunctionSearch(e.target.value)
                          setShowFunctionDropdown(true)
                        }}
                        onFocus={() => setShowFunctionDropdown(true)}
                        className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
                        placeholder={selectedFunctions.length === 0 ? "Rechercher une fonction..." : ""}
                      />
                    </div>
                    {/* Dropdown */}
                    {showFunctionDropdown && filteredFunctions.length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredFunctions.map(fn => (
                          <button
                            key={fn}
                            type="button"
                            onClick={() => addFunction(fn)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          >
                            {fn}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('usersModule.unit')}</label>
                  <select
                    name="organizationalUnitId"
                    defaultValue={editingUser?.unit?.id || ''}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Sélectionner une unité</option>
                    {orgUnitsFiltered.map(unit => (
                      <option key={unit.id} value={unit.id}>{unit.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section: Préférences */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                {t('usersModule.preferences')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('usersModule.defaultLanguage')}</label>
                  <select
                    defaultValue={editingUser?.defaultLanguage || 'fr'}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('usersModule.timezone')}</label>
                  <select
                    defaultValue={editingUser?.timezone || 'Africa/Douala'}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all appearance-none cursor-pointer"
                  >
                    {timezones.map(tz => (
                      <option key={tz.code} value={tz.code}>{tz.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Statut</label>
                  <div className="flex items-center gap-3 h-[42px] px-4 bg-white border border-slate-200 rounded-xl">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="isActive"
                        defaultChecked={editingUser?.isActive ?? true}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                    <span className="text-sm text-slate-600">Compte actif</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setCurrentView('list'); setEditingUser(null) }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm transition-colors"
              >
                {t('usersModule.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium text-sm hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                {isSaving ? 'Enregistrement...' : t('usersModule.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-display font-bold text-slate-800 mb-2">{t('usersModule.deleteUser')}</h3>
              <p className="text-slate-500 text-sm">{t('usersModule.deleteUserConfirm')}</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-center gap-3 bg-slate-50">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl font-medium text-sm transition-colors"
              >
                {t('usersModule.cancel')}
              </button>
              <button
                onClick={() => showDeleteConfirm && deleteUser(showDeleteConfirm)}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-colors"
              >
                {t('usersModule.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================
   GROUPS MANAGEMENT PAGE
   ============================================ */
interface GroupData {
  id: string
  code: string
  name: string
  description: string
  groupType: 'organizational' | 'function' | 'workgroup'
  parentId: string | null
  parentName: string | null
  isActive: boolean
  isEveryoneGroup: boolean
  isNPlusOneGroup: boolean
  isNMinusOneGroup: boolean
  membersCount: number
  createdAt: string
}

function GroupsManagementPage() {
  const { t } = useTranslation()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const [groups, setGroups] = useState<GroupData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [filterType, setFilterType] = useState<'all' | 'organizational' | 'function' | 'workgroup'>('all')

  // Restaurer l'état du formulaire depuis localStorage
  const [currentView, setCurrentViewState] = useState<'list' | 'form'>(() => {
    const saved = localStorage.getItem('groups_view')
    return (saved === 'form') ? 'form' : 'list'
  })
  const [editingGroup, setEditingGroupState] = useState<GroupData | null>(() => {
    try {
      const saved = localStorage.getItem('groups_editing')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [selectedParentId, setSelectedParentId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('groups_editing')
      const group = saved ? JSON.parse(saved) : null
      return group?.parentId || null
    } catch { return null }
  })

  // Wrapper pour sauvegarder l'état
  const setCurrentView = (view: 'list' | 'form') => {
    setCurrentViewState(view)
    localStorage.setItem('groups_view', view)
    if (view === 'list') {
      localStorage.removeItem('groups_editing')
      setEditingGroupState(null)
      setSelectedParentId(null)
    }
  }
  const setEditingGroup = (group: GroupData | null) => {
    setEditingGroupState(group)
    if (group) {
      localStorage.setItem('groups_editing', JSON.stringify(group))
      setSelectedParentId(group.parentId)
    } else {
      localStorage.removeItem('groups_editing')
    }
  }

  // Fetch groups from API
  const fetchGroups = async () => {
    setIsLoading(true)
    setError(null)
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
    try {
      const response = await fetch(`${API_URL}/api/users/groups/list`, { headers })
      if (!response.ok) throw new Error('Erreur lors du chargement des groupes')
      const result = await response.json()
      if (result.success) {
        const transformedGroups: GroupData[] = result.data.map((g: Record<string, unknown>) => ({
          id: g.id,
          code: g.code,
          name: g.name,
          description: g.description || '',
          groupType: (g.group_type as 'organizational' | 'function' | 'workgroup') || 'organizational',
          parentId: g.parent_id || null,
          parentName: null,
          isActive: g.is_active ?? true,
          isEveryoneGroup: false,
          isNPlusOneGroup: false,
          isNMinusOneGroup: false,
          membersCount: parseInt(g.members_count as string) || 0,
          createdAt: g.created_at as string
        }))
        setGroups(transformedGroups)
        if (transformedGroups.length > 0 && expandedGroups.length === 0) {
          setExpandedGroups([transformedGroups[0].id])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }

  // Save group (create or update)
  const saveGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
    const groupData = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      groupType: formData.get('groupType') as string || 'organizational',
      parentId: selectedParentId,
      isActive: (document.getElementById('groupIsActive') as HTMLInputElement)?.checked ?? true
    }
    try {
      const url = editingGroup
        ? `${API_URL}/api/users/groups/${editingGroup.id}`
        : `${API_URL}/api/users/groups`
      const method = editingGroup ? 'PUT' : 'POST'
      const response = await fetch(url, { method, headers, body: JSON.stringify(groupData) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Erreur lors de la sauvegarde')
      setCurrentView('list')
      fetchGroups()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete group
  const deleteGroup = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) return
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
    try {
      const response = await fetch(`${API_URL}/api/users/groups/${id}`, { method: 'DELETE', headers })
      if (!response.ok) throw new Error('Erreur lors de la suppression')
      fetchGroups()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  useEffect(() => { fetchGroups() }, [])

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1) }, [searchTerm, filterType])

  const filteredGroups = groups.filter(group => {
    const matchesSearch = searchTerm === '' ||
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || group.groupType === filterType
    return matchesSearch && matchesType
  })

  // Pagination logic
  const totalItems = filteredGroups.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedGroups = filteredGroups.slice(startIndex, endIndex)

  // Organiser les groupes en hiérarchie (pour la vue paginée)
  const rootGroups = paginatedGroups.filter(g => !g.parentId)
  const getChildren = (parentId: string) => paginatedGroups.filter(g => g.parentId === parentId)

  const toggleExpand = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    )
  }

  const renderGroup = (group: GroupData, level: number = 0) => {
    const children = getChildren(group.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedGroups.includes(group.id)

    return (
      <div key={group.id}>
        <div
          className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${level > 0 ? 'bg-slate-50/50' : ''}`}
          style={{ paddingLeft: `${16 + level * 24}px` }}
        >
          {/* Expand Button */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(group.id)}
              className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          ) : (
            <span className="w-6" />
          )}

          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
            group.groupType === 'function'
              ? 'bg-gradient-to-br from-purple-500 to-purple-600'
              : group.groupType === 'workgroup'
              ? 'bg-gradient-to-br from-amber-500 to-amber-600'
              : 'bg-gradient-to-br from-blue-500 to-indigo-600'
          }`}>
            <Users2 className="w-5 h-5" />
          </div>

          {/* Name & Description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-800">{group.name}</p>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{group.code}</span>
            </div>
            <p className="text-xs text-slate-500 truncate">{group.description || 'Aucune description'}</p>
          </div>

          {/* Type */}
          <div className="w-28 text-center">
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
              group.groupType === 'function'
                ? 'bg-purple-100 text-purple-700'
                : group.groupType === 'workgroup'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {group.groupType === 'function' ? 'Fonction' : group.groupType === 'workgroup' ? 'Travail' : 'Organisation'}
            </span>
          </div>

          {/* Members Count */}
          <div className="w-20 text-center">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-bold text-slate-700">
              {group.membersCount}
            </span>
          </div>

          {/* Status */}
          <div className="w-20 text-center">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              group.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${group.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {group.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>

          {/* Actions */}
          <div className="w-24 flex items-center justify-center gap-1">
            <button
              onClick={() => { setEditingGroup(group); setSelectedParentId(group.parentId); setCurrentView('form') }}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Modifier"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteGroup(group.id)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && children.map(child => renderGroup(child, level + 1))}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">{t('usersModule.groupsList')}</h1>
          <p className="text-sm text-slate-500 mt-1">{groups.length} groupe(s)</p>
        </div>
        <button
          onClick={() => { setEditingGroup(null); setSelectedParentId(null); setCurrentView('form') }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">{t('usersModule.addGroup')}</span>
        </button>
      </div>

      {currentView === 'list' ? (
      <>
      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
          <button onClick={fetchGroups} className="ml-2 underline">Réessayer</button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('usersModule.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all"
            />
          </div>

          {/* Filter by type */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'organizational' | 'function' | 'workgroup')}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="all">Tous les types</option>
              <option value="organizational">Organisationnel</option>
              <option value="function">Fonction</option>
              <option value="workgroup">Groupe de travail</option>
            </select>
          </div>

          {/* Items per page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Afficher</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1) }}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-400 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="w-6" /> {/* Expand button space */}
            <div className="w-10" /> {/* Icon space */}
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Groupe</span>
            </div>
            <div className="w-28 text-center">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</span>
            </div>
            <div className="w-20 text-center">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Membres</span>
            </div>
            <div className="w-20 text-center">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Statut</span>
            </div>
            <div className="w-24 text-center">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</span>
            </div>
          </div>
        </div>

        {/* Table Body */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-slate-500">Chargement...</p>
          </div>
        ) : rootGroups.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {rootGroups.map(group => renderGroup(group))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">{t('usersModule.noData')}</p>
          </div>
        )}
      </div>

      {/* Modern Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Info */}
            <div className="text-sm text-slate-500">
              Affichage de <span className="font-semibold text-slate-700">{startIndex + 1}</span> à{' '}
              <span className="font-semibold text-slate-700">{Math.min(endIndex, totalItems)}</span> sur{' '}
              <span className="font-semibold text-slate-700">{totalItems}</span> groupes
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="flex items-center p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Première page"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>

              {/* Previous Page */}
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Page précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (totalPages <= 7) return true
                    if (page === 1 || page === totalPages) return true
                    if (Math.abs(page - currentPage) <= 1) return true
                    return false
                  })
                  .map((page, idx, arr) => {
                    const showEllipsis = idx > 0 && page - arr[idx - 1] > 1
                    return (
                      <div key={page} className="flex items-center">
                        {showEllipsis && (
                          <span className="px-2 text-slate-400">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all ${
                            currentPage === page
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    )
                  })}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Page suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="flex items-center p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Dernière page"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      ) : (
      /* Form View */
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up">
        {/* Form Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600">
          <h2 className="text-lg font-display font-bold text-white">
            {editingGroup ? t('usersModule.editGroup') : t('usersModule.addGroup')}
          </h2>
          <button
            onClick={() => { setCurrentView('list'); setEditingGroup(null) }}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-white text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={saveGroup} className="space-y-6">
            {/* Section: Informations de base */}
            <div className="bg-slate-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Informations de base
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('usersModule.groupCode')} *</label>
                  <input
                    type="text"
                    name="code"
                    defaultValue={editingGroup?.code}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all"
                    placeholder="GRP-XXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('usersModule.groupName')} *</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingGroup?.name}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all"
                    placeholder="Nom du groupe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Type de groupe *</label>
                  <select
                    name="groupType"
                    defaultValue={editingGroup?.groupType || 'organizational'}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="organizational">Organisationnel</option>
                    <option value="function">Fonction</option>
                    <option value="workgroup">Groupe de travail</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <TreeSelect
                  label={t('usersModule.parentGroup')}
                  options={groups
                    .filter(g => !g.isEveryoneGroup && !g.isNPlusOneGroup && !g.isNMinusOneGroup)
                    .map(g => ({ id: g.id, name: g.name, parentId: g.parentId }))}
                  value={selectedParentId}
                  onChange={setSelectedParentId}
                  excludeId={editingGroup?.id}
                  placeholder="Aucun (groupe racine)"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('usersModule.groupDescription')}</label>
                  <input
                    type="text"
                    name="description"
                    defaultValue={editingGroup?.description}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all"
                    placeholder="Description du groupe..."
                  />
                </div>
              </div>
            </div>

            {/* Section: Configuration spéciale */}
            <div className="bg-slate-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Configuration spéciale
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Statut Actif */}
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Statut</p>
                      <p className="text-xs text-slate-500">Le groupe est actif</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="groupIsActive"
                        defaultChecked={editingGroup?.isActive ?? true}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Groupe Tout le monde */}
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Tout le monde</p>
                      <p className="text-xs text-slate-500">Groupe unique global</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="isEveryoneGroup"
                        defaultChecked={editingGroup?.isEveryoneGroup ?? false}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>

                {/* Groupe N+1 */}
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Groupe N+1</p>
                      <p className="text-xs text-slate-500">Supérieurs directs</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="isNPlusOneGroup"
                        defaultChecked={editingGroup?.isNPlusOneGroup ?? false}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>

                {/* Groupe N-1 */}
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Groupe N-1</p>
                      <p className="text-xs text-slate-500">Subordonnés directs</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="isNMinusOneGroup"
                        defaultChecked={editingGroup?.isNMinusOneGroup ?? false}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Info boxes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs text-amber-700">
                    <strong>Tout le monde :</strong> Un seul groupe de ce type. Tous les utilisateurs en font automatiquement partie.
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <p className="text-xs text-emerald-700">
                    <strong>N+1 :</strong> Un seul groupe. Les informations envoyées vont aux supérieurs hiérarchiques directs de l'expéditeur.
                  </p>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                  <p className="text-xs text-rose-700">
                    <strong>N-1 :</strong> Un seul groupe. Les informations envoyées vont aux subordonnés directs de l'expéditeur.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setCurrentView('list'); setEditingGroup(null) }}
                disabled={isSaving}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
              >
                {t('usersModule.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium text-sm hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50"
              >
                {isSaving ? 'Enregistrement...' : t('usersModule.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}
    </div>
  )
}

/* ============================================
   RIGHTS MANAGEMENT PAGE
   ============================================ */
interface RoleData {
  id: string
  code: string
  name: string
  description: string
  level: number
  isActive: boolean
  permissionsCount: number
}

interface PermissionData {
  id: string
  code: string
  name: string
  module: string
  description: string
}

function RightsManagementPage() {
  const { t } = useTranslation()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [roles, setRoles] = useState<(RoleData & { permissions?: { id: string; code: string; name: string; module: string }[] })[]>([])
  const [permissions, setPermissions] = useState<PermissionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Restaurer l'état du formulaire depuis localStorage
  const [currentView, setCurrentViewState] = useState<'list' | 'form'>(() => {
    const saved = localStorage.getItem('rights_view')
    return (saved === 'form') ? 'form' : 'list'
  })
  const [editingRole, setEditingRoleState] = useState<RoleData | null>(() => {
    try {
      const saved = localStorage.getItem('rights_editing')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  // Wrapper pour sauvegarder l'état
  const setCurrentView = (view: 'list' | 'form') => {
    setCurrentViewState(view)
    localStorage.setItem('rights_view', view)
    if (view === 'list') {
      localStorage.removeItem('rights_editing')
      setEditingRoleState(null)
    }
  }
  const setEditingRole = (role: RoleData | null) => {
    setEditingRoleState(role)
    if (role) {
      localStorage.setItem('rights_editing', JSON.stringify(role))
    } else {
      localStorage.removeItem('rights_editing')
    }
  }

  // Fetch roles and permissions from API
  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch(`${API_URL}/api/users/roles/list`, { headers }),
        fetch(`${API_URL}/api/users/permissions/list`, { headers })
      ])
      if (!rolesRes.ok || !permsRes.ok) throw new Error('Erreur lors du chargement')
      const [rolesResult, permsResult] = await Promise.all([rolesRes.json(), permsRes.json()])
      if (rolesResult.success) {
        const transformedRoles = rolesResult.data.map((r: Record<string, unknown>) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          description: r.description || '',
          level: r.level,
          isActive: r.is_active ?? true,
          permissionsCount: Array.isArray(r.permissions) ? (r.permissions as unknown[]).length : 0,
          permissions: r.permissions || []
        }))
        setRoles(transformedRoles)
        if (transformedRoles.length > 0 && !selectedRole) {
          setSelectedRole(transformedRoles[0].id)
        }
      }
      if (permsResult.success) {
        const transformedPerms: PermissionData[] = permsResult.data.map((p: Record<string, unknown>) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          module: p.module || 'general',
          description: p.description || ''
        }))
        setPermissions(transformedPerms)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }

  // Save role (create or update)
  const saveRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
    const roleData = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      level: parseInt(formData.get('level') as string) || 1,
      isActive: (document.getElementById('roleIsActive') as HTMLInputElement)?.checked ?? true
    }
    try {
      const url = editingRole
        ? `${API_URL}/api/users/roles/${editingRole.id}`
        : `${API_URL}/api/users/roles/create`
      const method = editingRole ? 'PUT' : 'POST'
      const response = await fetch(url, { method, headers, body: JSON.stringify(roleData) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Erreur lors de la sauvegarde')
      setCurrentView('list')
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  // Toggle permission for a role
  const togglePermission = async (roleId: string, permissionId: string, isAssigned: boolean) => {
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
    try {
      if (isAssigned) {
        await fetch(`${API_URL}/api/users/roles/${roleId}/permissions/${permissionId}`, { method: 'DELETE', headers })
      } else {
        await fetch(`${API_URL}/api/users/roles/${roleId}/permissions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ permissionId })
        })
      }
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification')
    }
  }

  useEffect(() => { fetchData() }, [])

  // Grouper les permissions par module
  const permissionsByModule = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = []
    acc[perm.module].push(perm)
    return acc
  }, {} as Record<string, PermissionData[]>)

  const moduleNames: Record<string, string> = {
    events: 'Événements',
    users: 'Utilisateurs',
    reports: 'Rapports',
    settings: 'Paramètres',
  }

  const getRoleLevelColor = (level: number) => {
    const colors: Record<number, string> = {
      6: 'from-purple-500 to-violet-600',
      5: 'from-indigo-500 to-blue-600',
      4: 'from-blue-500 to-cyan-600',
      3: 'from-teal-500 to-emerald-600',
      2: 'from-amber-500 to-orange-600',
      1: 'from-slate-400 to-slate-500',
    }
    return colors[level] || 'from-slate-400 to-slate-500'
  }

  const selectedRoleData = roles.find(r => r.id === selectedRole)

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">{t('usersModule.rightsList')}</h1>
          <p className="text-sm text-slate-500 mt-1">Gérer les rôles et leurs permissions associées</p>
        </div>
        <button
          onClick={() => { setEditingRole(null); setCurrentView('form') }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl hover:from-purple-600 hover:to-violet-700 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Ajouter un rôle</span>
        </button>
      </div>

      {currentView === 'list' ? (
      <>
      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
          <button onClick={fetchData} className="ml-2 underline">Réessayer</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-display font-bold text-slate-800">{t('usersModule.rolesList')}</h3>
            </div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
                <p className="text-slate-500">Chargement...</p>
              </div>
            ) : (
            <div className="divide-y divide-slate-50">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className={`flex items-center gap-3 p-4 transition-all ${
                    selectedRole === role.id ? 'bg-emerald-50 border-l-4 border-emerald-500' : 'hover:bg-slate-50'
                  }`}
                >
                  <button
                    onClick={() => setSelectedRole(role.id)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getRoleLevelColor(role.level)} flex items-center justify-center text-white font-bold text-sm`}>
                      {role.level}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{role.name}</p>
                      <p className="text-xs text-slate-500 truncate">{role.permissionsCount} permissions</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingRole(role); setCurrentView('form') }}
                      className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title={t('usersModule.edit')}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-colors ${selectedRole === role.id ? 'text-emerald-500' : 'text-slate-300'}`} />
                </div>
              ))}
            </div>
            )}
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="lg:col-span-2">
          {selectedRoleData ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className={`p-4 border-b border-slate-100 bg-gradient-to-r ${getRoleLevelColor(selectedRoleData.level)}`}>
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-white" />
                  <div>
                    <h3 className="font-display font-bold text-white">{selectedRoleData.name}</h3>
                    <p className="text-xs text-white/80">{selectedRoleData.description}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-6">
                {Object.entries(permissionsByModule).map(([module, perms]) => (
                  <div key={module}>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {moduleNames[module] || module}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {perms.map((perm) => {
                        const rolePermissions = selectedRoleData?.permissions || []
                        const isAssigned = rolePermissions.some((rp: { id: string }) => rp.id === perm.id)
                        return (
                          <div
                            key={perm.id}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                              isAssigned
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() => togglePermission(selectedRoleData!.id, perm.id, isAssigned)}
                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
                              />
                              <div>
                                <p className="text-sm font-medium text-slate-700">{perm.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">{perm.code}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium text-sm hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md">
                  {t('usersModule.save')}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Sélectionnez un rôle pour voir ses permissions</p>
            </div>
          )}
        </div>
      </div>
      </>
      ) : (
      /* Form View */
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up">
        {/* Form Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-500 to-violet-600">
          <h2 className="text-lg font-display font-bold text-white">
            {editingRole ? t('usersModule.editGroup') : 'Ajouter un rôle'}
          </h2>
          <button
            onClick={() => { setCurrentView('list'); setEditingRole(null) }}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-white text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={saveRole} className="space-y-6">
            {/* Section: Informations du rôle */}
            <div className="bg-slate-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Informations du rôle
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('usersModule.roleCode')} *</label>
                  <input
                    type="text"
                    name="code"
                    defaultValue={editingRole?.code}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all"
                    placeholder="ROLE_CODE"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('usersModule.roleName')} *</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingRole?.name}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all"
                    placeholder="Nom du rôle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('usersModule.roleLevel')} *</label>
                  <select
                    name="level"
                    defaultValue={editingRole?.level || ''}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Sélectionner un niveau</option>
                    <option value="1">Niveau 1 - Utilisateur simple</option>
                    <option value="2">Niveau 2 - Gestionnaire de contenu</option>
                    <option value="3">Niveau 3 - Validateur</option>
                    <option value="4">Niveau 4 - Manager</option>
                    <option value="5">Niveau 5 - Administrateur</option>
                    <option value="6">Niveau 6 - Super administrateur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Statut</label>
                  <div className="flex items-center gap-3 h-[42px] px-4 bg-white border border-slate-200 rounded-xl">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="roleIsActive"
                        defaultChecked={editingRole?.isActive ?? true}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                    <span className="text-sm text-slate-600">Actif</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Description */}
            <div className="bg-slate-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Description
              </h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('usersModule.roleDescription')}</label>
                <textarea
                  rows={4}
                  name="description"
                  defaultValue={editingRole?.description}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all resize-none"
                  placeholder="Description du rôle et de ses responsabilités..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setCurrentView('list'); setEditingRole(null) }}
                disabled={isSaving}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
              >
                {t('usersModule.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl font-medium text-sm hover:from-purple-600 hover:to-violet-700 transition-all shadow-md disabled:opacity-50"
              >
                {isSaving ? 'Enregistrement...' : t('usersModule.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}
    </div>
  )
}

/* ============================================
   MY PROFILE PAGE
   ============================================ */
function MyProfilePage({ userSession, onUpdateSession }: { userSession: UserSession | null; onUpdateSession: (user: UserSession) => void }) {
  const { t, i18n } = useTranslation()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'preferences' | 'activity'>('info')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [showPasswordStrength, setShowPasswordStrength] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    firstName: userSession?.firstName || '',
    lastName: userSession?.lastName || '',
    email: userSession?.email || '',
    phone: userSession?.phone || '',
    identifier: userSession?.identifier || '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Preferences state
  const [preferences, setPreferences] = useState({
    language: userSession?.defaultLanguage || 'fr',
    timezone: userSession?.timezone || 'Africa/Douala',
    emailNotifications: true,
    pushNotifications: true,
    weeklySummary: false,
    eventAlerts: true,
    systemAlerts: true,
  })

  // Activity history (mock data for now)
  const [activityHistory] = useState([
    { id: 1, action: 'Connexion réussie', date: new Date().toISOString(), ip: '192.168.1.100', device: 'Chrome / Windows' },
    { id: 2, action: 'Modification du profil', date: new Date(Date.now() - 86400000).toISOString(), ip: '192.168.1.100', device: 'Chrome / Windows' },
    { id: 3, action: 'Changement de mot de passe', date: new Date(Date.now() - 172800000).toISOString(), ip: '192.168.1.105', device: 'Firefox / MacOS' },
    { id: 4, action: 'Connexion réussie', date: new Date(Date.now() - 259200000).toISOString(), ip: '192.168.1.105', device: 'Safari / iOS' },
    { id: 5, action: 'Création d\'un événement', date: new Date(Date.now() - 345600000).toISOString(), ip: '192.168.1.100', device: 'Chrome / Windows' },
  ])

  // Connected sessions (mock data)
  const [sessions] = useState([
    { id: 1, device: 'Chrome / Windows', ip: '192.168.1.100', location: 'Douala, Cameroun', lastActive: 'Maintenant', current: true },
    { id: 2, device: 'Safari / iOS', ip: '192.168.1.105', location: 'Yaoundé, Cameroun', lastActive: 'Il y a 2 heures', current: false },
  ])

  // Reset form when userSession changes
  useEffect(() => {
    if (userSession) {
      setFormData({
        firstName: userSession.firstName || '',
        lastName: userSession.lastName || '',
        email: userSession.email || '',
        phone: userSession.phone || '',
        identifier: userSession.identifier || '',
      })
      setPreferences(prev => ({
        ...prev,
        language: userSession.defaultLanguage || 'fr',
        timezone: userSession.timezone || 'Africa/Douala',
      }))
    }
  }, [userSession])

  // Password strength calculator
  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    let score = 0
    if (password.length >= 6) score++
    if (password.length >= 8) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++

    if (score <= 1) return { score, label: 'Faible', color: 'bg-red-500' }
    if (score <= 2) return { score, label: 'Moyen', color: 'bg-orange-500' }
    if (score <= 3) return { score, label: 'Bon', color: 'bg-yellow-500' }
    if (score <= 4) return { score, label: 'Fort', color: 'bg-emerald-500' }
    return { score, label: 'Excellent', color: 'bg-emerald-600' }
  }

  const passwordStrength = getPasswordStrength(passwordData.newPassword)

  const handleSaveProfile = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError('Le prénom et le nom sont obligatoires')
      return
    }
    if (!formData.email.includes('@')) {
      setFormError('Email invalide')
      return
    }

    setIsSaving(true)
    setFormError(null)
    setFormSuccess(null)

    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null

    try {
      const response = await fetch(`${API_URL}/api/users/${userSession?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone?.trim() || null,
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de la mise à jour')
      }

      // Update session
      if (userSession) {
        const updatedUser = {
          ...userSession,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone?.trim() || '',
        }
        onUpdateSession(updatedUser)

        // Update localStorage
        const authDataParsed = authData ? JSON.parse(authData) : {}
        authDataParsed.user = updatedUser
        localStorage.setItem('auth_token', JSON.stringify(authDataParsed))
      }

      setFormSuccess('Profil mis à jour avec succès')
      setIsEditing(false)
      setTimeout(() => setFormSuccess(null), 3000)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
      setTimeout(() => setFormError(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword) {
      setFormError('Veuillez entrer votre mot de passe actuel')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setFormError('Les mots de passe ne correspondent pas')
      return
    }
    if (passwordData.newPassword.length < 6) {
      setFormError('Le nouveau mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      setFormError('Le nouveau mot de passe doit être différent de l\'ancien')
      return
    }

    setIsSaving(true)
    setFormError(null)
    setFormSuccess(null)

    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null

    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          oldPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors du changement de mot de passe')
      }

      setFormSuccess('Mot de passe modifié avec succès')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordStrength(false)
      setTimeout(() => setFormSuccess(null), 3000)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe')
      setTimeout(() => setFormError(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setIsSaving(true)
    setFormError(null)
    setFormSuccess(null)

    try {
      // Change language immediately
      if (preferences.language !== i18n.language) {
        i18n.changeLanguage(preferences.language)
        localStorage.setItem('language', preferences.language)
      }

      // Save preferences to localStorage (could be saved to backend later)
      localStorage.setItem('user_preferences', JSON.stringify(preferences))

      // Update session if needed
      if (userSession) {
        const updatedUser = {
          ...userSession,
          defaultLanguage: preferences.language,
          timezone: preferences.timezone,
        }
        onUpdateSession(updatedUser)

        const authData = localStorage.getItem('auth_token')
        if (authData) {
          const authDataParsed = JSON.parse(authData)
          authDataParsed.user = updatedUser
          localStorage.setItem('auth_token', JSON.stringify(authDataParsed))
        }
      }

      setFormSuccess('Préférences enregistrées avec succès')
      setTimeout(() => setFormSuccess(null), 3000)
    } catch (err) {
      setFormError('Erreur lors de l\'enregistrement des préférences')
      setTimeout(() => setFormError(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRevokeSession = (sessionId: number) => {
    // In a real app, this would call an API to revoke the session
    setFormSuccess('Session révoquée avec succès')
    setTimeout(() => setFormSuccess(null), 3000)
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormError('La taille de l\'image ne doit pas dépasser 5MB')
        setTimeout(() => setFormError(null), 5000)
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFormError('Veuillez sélectionner une image valide')
        setTimeout(() => setFormError(null), 5000)
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const imageDataUrl = reader.result as string
        setAvatarPreview(imageDataUrl)

        // Update session with new photo
        if (userSession) {
          // Sauvegarder l'avatar séparément avec l'ID utilisateur (persiste après déconnexion)
          localStorage.setItem(`user_avatar_${userSession.id}`, imageDataUrl)

          const updatedUser = {
            ...userSession,
            photoUrl: imageDataUrl,
          }
          onUpdateSession(updatedUser)

          // Update user_session in localStorage
          const userSessionData = localStorage.getItem('user_session')
          if (userSessionData) {
            const sessionParsed = JSON.parse(userSessionData)
            sessionParsed.photoUrl = imageDataUrl
            localStorage.setItem('user_session', JSON.stringify(sessionParsed))
          }
        }

        setFormSuccess('Photo de profil mise à jour')
        setTimeout(() => setFormSuccess(null), 3000)
      }
      reader.onerror = () => {
        setFormError('Erreur lors de la lecture de l\'image')
        setTimeout(() => setFormError(null), 5000)
      }
      reader.readAsDataURL(file)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const tabs = [
    { id: 'info' as const, label: 'Informations', icon: <User className="w-4 h-4" /> },
    { id: 'security' as const, label: 'Sécurité', icon: <Shield className="w-4 h-4" /> },
    { id: 'preferences' as const, label: 'Préférences', icon: <FolderCog className="w-4 h-4" /> },
    { id: 'activity' as const, label: 'Activité', icon: <Clock className="w-4 h-4" /> },
  ]

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 animate-slide-up">
      {/* Left Column - Profile Card (Fixed) */}
      <div className="lg:w-80 flex-shrink-0 space-y-6">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 relative">
            <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '24px 24px'}} />
          </div>
          <div className="px-4 pb-4 -mt-12 relative">
            <div className="flex flex-col items-center">
              {/* Avatar */}
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                {(avatarPreview || userSession?.photoUrl) ? (
                  <img
                    src={avatarPreview || userSession?.photoUrl || ''}
                    alt="Profile"
                    className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white shadow-xl">
                    {userSession?.firstName?.[0]}{userSession?.lastName?.[0]}
                  </div>
                )}
                <button
                  onClick={handleAvatarClick}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-lg shadow-lg flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors border border-slate-200"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* User Info */}
              <div className="text-center mt-3">
                <h1 className="text-lg font-display font-bold text-slate-800">
                  {userSession?.firstName} {userSession?.lastName}
                </h1>
                <p className="text-sm text-slate-500">{userSession?.email}</p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                  <Shield className="w-3 h-3" />
                  {userSession?.role.name}
                </span>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-mono">
                  {userSession?.identifier}
                </span>
              </div>

              {userSession?.unit && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    <Building2 className="w-3 h-3" />
                    {userSession.unit.name}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800">12</p>
                <p className="text-xs text-slate-500">Événements</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800">45j</p>
                <p className="text-xs text-slate-500">Membre depuis</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Actions rapides</h3>
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('security')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <Lock className="w-4 h-4 text-slate-400" />
              Changer le mot de passe
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <Bell className="w-4 h-4 text-slate-400" />
              Gérer les notifications
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <History className="w-4 h-4 text-slate-400" />
              Voir l'activité
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Content Area */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Toast Notifications */}
        {formError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-slide-up">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-red-800">Erreur</h4>
              <p className="text-sm text-red-600">{formError}</p>
            </div>
            <button onClick={() => setFormError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {formSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 animate-slide-up">
            <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-emerald-800">Succès</h4>
              <p className="text-sm text-emerald-600">{formSuccess}</p>
            </div>
          </div>
        )}

        {/* Tabs Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="border-b border-slate-100">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-emerald-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Tab: Informations */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Informations personnelles</h3>
                    <p className="text-sm text-slate-500">Gérez vos informations de profil</p>
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors text-sm font-medium"
                    >
                      <Edit3 className="w-4 h-4" />
                      Modifier
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsEditing(false)
                          setFormData({
                            firstName: userSession?.firstName || '',
                            lastName: userSession?.lastName || '',
                            email: userSession?.email || '',
                            phone: userSession?.phone || '',
                            identifier: userSession?.identifier || '',
                          })
                        }}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-sm font-medium"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {isSaving ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Enregistrer
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                        placeholder="Entrez votre prénom"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-slate-50 rounded-xl text-slate-800">{userSession?.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                        placeholder="Entrez votre nom"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-slate-50 rounded-xl text-slate-800">{userSession?.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                        placeholder="exemple@email.com"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-slate-50 rounded-xl text-slate-800">{userSession?.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+237 6XX XXX XXX"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-slate-50 rounded-xl text-slate-800">{userSession?.phone || 'Non renseigné'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Identifiant</label>
                    <p className="px-4 py-3 bg-slate-100 rounded-xl text-slate-500 font-mono text-sm">{userSession?.identifier}</p>
                    <p className="text-xs text-slate-400 mt-1">Identifiant unique, non modifiable</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Rôle</label>
                    <p className="px-4 py-3 bg-slate-100 rounded-xl text-slate-500">{userSession?.role.name}</p>
                    <p className="text-xs text-slate-400 mt-1">Attribué par l'administrateur</p>
                  </div>

                  {userSession?.unit && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Unité organisationnelle</label>
                      <p className="px-4 py-3 bg-slate-100 rounded-xl text-slate-500">{userSession.unit.name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Sécurité */}
            {activeTab === 'security' && (
              <div className="space-y-8">
                {/* Change Password Section */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Changer le mot de passe</h3>
                    <p className="text-sm text-slate-500">Assurez-vous d'utiliser un mot de passe fort</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 md:max-w-md">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe actuel</label>
                      <div className="relative">
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all pr-10"
                          placeholder="••••••••"
                        />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Nouveau mot de passe</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => {
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                          setShowPasswordStrength(true)
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                        placeholder="••••••••"
                      />
                      {showPasswordStrength && passwordData.newPassword && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${passwordStrength.color} transition-all`}
                                style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-600">{passwordStrength.label}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Confirmer le mot de passe</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:ring-2 outline-none transition-all ${
                          passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20'
                            : 'border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20'
                        }`}
                        placeholder="••••••••"
                      />
                      {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleChangePassword}
                    disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  >
                    {isSaving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    Changer le mot de passe
                  </button>
                </div>

                {/* Connected Sessions */}
                <div className="pt-6 border-t border-slate-100">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Sessions connectées</h3>
                    <p className="text-sm text-slate-500">Gérez les appareils connectés à votre compte</p>
                  </div>

                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-4 rounded-xl border ${session.current ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${session.current ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                              <Monitor className={`w-5 h-5 ${session.current ? 'text-emerald-600' : 'text-slate-500'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{session.device}</p>
                              <p className="text-sm text-slate-500">{session.location} • {session.ip}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {session.current ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                Session actuelle
                              </span>
                            ) : (
                              <>
                                <p className="text-sm text-slate-500">{session.lastActive}</p>
                                <button
                                  onClick={() => handleRevokeSession(session.id)}
                                  className="text-xs text-red-600 hover:text-red-700 font-medium mt-1"
                                >
                                  Révoquer
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security Tips */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 mb-2">Conseils de sécurité</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Utilisez un mot de passe unique pour ce compte</li>
                        <li>• Combinez lettres, chiffres et caractères spéciaux</li>
                        <li>• Ne partagez jamais votre mot de passe</li>
                        <li>• Changez votre mot de passe régulièrement</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Préférences */}
            {activeTab === 'preferences' && (
              <div className="space-y-8">
                {/* Language & Region */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Langue et région</h3>
                    <p className="text-sm text-slate-500">Personnalisez les paramètres régionaux</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Langue de l'interface</label>
                      <select
                        value={preferences.language}
                        onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Fuseau horaire</label>
                      <select
                        value={preferences.timezone}
                        onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="Africa/Douala">Douala (UTC+1)</option>
                        <option value="Africa/Lagos">Lagos (UTC+1)</option>
                        <option value="Africa/Johannesburg">Johannesburg (UTC+2)</option>
                        <option value="Europe/Paris">Paris (UTC+1/+2)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="pt-6 border-t border-slate-100">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Notifications</h3>
                    <p className="text-sm text-slate-500">Configurez comment vous souhaitez être notifié</p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-700">Notifications par email</p>
                          <p className="text-sm text-slate-500">Recevoir les alertes importantes par email</p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={preferences.emailNotifications}
                          onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-emerald-500 transition-colors" />
                        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Bell className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-700">Notifications push</p>
                          <p className="text-sm text-slate-500">Recevoir les notifications dans le navigateur</p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={preferences.pushNotifications}
                          onChange={(e) => setPreferences({ ...preferences, pushNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-emerald-500 transition-colors" />
                        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-700">Alertes événements</p>
                          <p className="text-sm text-slate-500">Être notifié des nouveaux événements sanitaires</p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={preferences.eventAlerts}
                          onChange={(e) => setPreferences({ ...preferences, eventAlerts: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-emerald-500 transition-colors" />
                        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-700">Résumé hebdomadaire</p>
                          <p className="text-sm text-slate-500">Recevoir un résumé des activités chaque semaine</p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={preferences.weeklySummary}
                          onChange={(e) => setPreferences({ ...preferences, weeklySummary: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-emerald-500 transition-colors" />
                        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleSavePreferences}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Enregistrer les préférences
                </button>
              </div>
            )}

            {/* Tab: Activité */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Historique d'activité</h3>
                  <p className="text-sm text-slate-500">Consultez vos actions récentes sur la plateforme</p>
                </div>

                <div className="space-y-4">
                  {activityHistory.map((activity, index) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 relative"
                    >
                      {index < activityHistory.length - 1 && (
                        <div className="absolute left-5 top-10 bottom-0 w-px bg-slate-200" />
                      )}
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 relative z-10">
                        {activity.action.includes('Connexion') ? (
                          <LogIn className="w-4 h-4 text-emerald-600" />
                        ) : activity.action.includes('mot de passe') ? (
                          <Lock className="w-4 h-4 text-orange-600" />
                        ) : activity.action.includes('profil') ? (
                          <User className="w-4 h-4 text-blue-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="font-medium text-slate-800">{activity.action}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                          <span>{formatDate(activity.date)}</span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5" />
                            {activity.ip}
                          </span>
                          <span className="flex items-center gap-1">
                            <Monitor className="w-3.5 h-3.5" />
                            {activity.device}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-4">
                  <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                    Voir plus d'activités
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================
   FORM BUILDER PAGE
   ============================================ */

// Types pour le Form Builder
interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required?: boolean
  helpText?: string
  defaultValue?: string
  options?: { label: string; value: string }[]
  validation?: {
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: string
    customMessage?: string
  }
  conditionalLogic?: {
    enabled: boolean
    action: 'show' | 'hide'
    field: string
    operator: 'equals' | 'not_equals' | 'contains' | 'greater' | 'less'
    value: string
  }
  width?: 'full' | 'half' | 'third'
  className?: string
  column?: number
}

interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
  collapsed?: boolean
  columns?: 1 | 2 | 3 | 4
  columnGap?: 'small' | 'medium' | 'large'
}

interface FormSchema {
  id: string
  name: string
  description?: string
  sections: FormSection[]
  settings: {
    submitButtonText: string
    successMessage: string
    redirectUrl?: string
    enableCaptcha?: boolean
    saveAsDraft?: boolean
    multiStep?: boolean
  }
  createdAt: string
  updatedAt: string
}

// Composants de formulaire disponibles
const FORM_COMPONENTS = [
  { type: 'text', label: 'Texte court', icon: Type, category: 'basic' },
  { type: 'textarea', label: 'Texte long', icon: AlignLeft, category: 'basic' },
  { type: 'number', label: 'Nombre', icon: Hash, category: 'basic' },
  { type: 'email', label: 'Email', icon: AtSign, category: 'basic' },
  { type: 'phone', label: 'Téléphone', icon: Phone, category: 'basic' },
  { type: 'date', label: 'Date', icon: Calendar, category: 'basic' },
  { type: 'time', label: 'Heure', icon: Clock, category: 'basic' },
  { type: 'datetime', label: 'Date et Heure', icon: Calendar, category: 'basic' },
  { type: 'select', label: 'Liste déroulante', icon: List, category: 'choice' },
  { type: 'multiselect', label: 'Sélection multiple', icon: CheckSquare, category: 'choice' },
  { type: 'radio', label: 'Boutons radio', icon: Radio, category: 'choice' },
  { type: 'checkbox', label: 'Cases à cocher', icon: CheckSquare, category: 'choice' },
  { type: 'toggle', label: 'Interrupteur', icon: ToggleLeft, category: 'choice' },
  { type: 'file', label: 'Fichier', icon: Paperclip, category: 'media' },
  { type: 'image', label: 'Image', icon: Image, category: 'media' },
  { type: 'signature', label: 'Signature', icon: Edit3, category: 'media' },
  { type: 'rating', label: 'Notation', icon: Star, category: 'advanced' },
  { type: 'slider', label: 'Curseur', icon: Sliders, category: 'advanced' },
  { type: 'heading', label: 'Titre', icon: Heading, category: 'layout' },
  { type: 'paragraph', label: 'Paragraphe', icon: AlignLeft, category: 'layout' },
  { type: 'divider', label: 'Séparateur', icon: MinusCircle, category: 'layout' },
  { type: 'section', label: 'Section', icon: Layers, category: 'layout' },
  { type: 'columns', label: 'Colonnes', icon: Columns, category: 'layout' },
  { type: 'hidden', label: 'Champ caché', icon: EyeOff, category: 'advanced' },
]

const COMPONENT_CATEGORIES = [
  { id: 'basic', label: 'Champs de base', icon: Type },
  { id: 'choice', label: 'Choix', icon: List },
  { id: 'media', label: 'Médias', icon: Image },
  { id: 'layout', label: 'Mise en page', icon: LayoutGrid },
  { id: 'advanced', label: 'Avancé', icon: Zap },
]

function FormBuilderPage() {
  const { t } = useTranslation()
  const [forms, setForms] = useState<FormSchema[]>([])
  const [currentForm, setCurrentForm] = useState<FormSchema | null>(null)
  const [selectedField, setSelectedField] = useState<FormField | null>(null)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'editor' | 'preview'>('list')
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<number | null>(null)
  const [dragOverSection, setDragOverSection] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('basic')
  const [searchComponent, setSearchComponent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [showFormSettings, setShowFormSettings] = useState(false)

  // Charger les formulaires depuis localStorage (simulation)
  useEffect(() => {
    const savedForms = localStorage.getItem('form_builder_forms')
    if (savedForms) {
      setForms(JSON.parse(savedForms))
    }
  }, [])

  // Sauvegarder les formulaires dans localStorage
  const saveForms = (updatedForms: FormSchema[]) => {
    setForms(updatedForms)
    localStorage.setItem('form_builder_forms', JSON.stringify(updatedForms))
  }

  // Créer un nouveau formulaire
  const createNewForm = () => {
    const newForm: FormSchema = {
      id: `form_${Date.now()}`,
      name: 'Nouveau formulaire',
      description: '',
      sections: [
        {
          id: `section_${Date.now()}`,
          title: 'Section 1',
          fields: [],
          columns: 1,
          columnGap: 'medium',
        },
      ],
      settings: {
        submitButtonText: 'Envoyer',
        successMessage: 'Formulaire envoyé avec succès !',
        saveAsDraft: true,
        multiStep: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setCurrentForm(newForm)
    setView('editor')
  }

  // Éditer un formulaire existant
  const editForm = (form: FormSchema) => {
    setCurrentForm({ ...form })
    setView('editor')
  }

  // Dupliquer un formulaire
  const duplicateForm = (form: FormSchema) => {
    const duplicated: FormSchema = {
      ...form,
      id: `form_${Date.now()}`,
      name: `${form.name} (copie)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveForms([...forms, duplicated])
    setFormSuccess('Formulaire dupliqué avec succès')
    setTimeout(() => setFormSuccess(null), 3000)
  }

  // Supprimer un formulaire
  const deleteForm = (formId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce formulaire ?')) {
      saveForms(forms.filter((f) => f.id !== formId))
      setFormSuccess('Formulaire supprimé')
      setTimeout(() => setFormSuccess(null), 3000)
    }
  }

  // Sauvegarder le formulaire en cours
  const saveCurrentForm = () => {
    if (!currentForm) return

    setIsSaving(true)
    const updatedForm = { ...currentForm, updatedAt: new Date().toISOString() }
    const existingIndex = forms.findIndex((f) => f.id === updatedForm.id)

    if (existingIndex >= 0) {
      const updatedForms = [...forms]
      updatedForms[existingIndex] = updatedForm
      saveForms(updatedForms)
    } else {
      saveForms([...forms, updatedForm])
    }

    setCurrentForm(updatedForm)
    setFormSuccess('Formulaire sauvegardé avec succès')
    setTimeout(() => {
      setFormSuccess(null)
      setIsSaving(false)
    }, 2000)
  }

  // Générer un ID unique pour les champs
  const generateFieldId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Ajouter un champ au formulaire
  const addFieldToSection = (sectionId: string, fieldType: string, index?: number, column?: number) => {
    if (!currentForm) return

    const componentDef = FORM_COMPONENTS.find((c) => c.type === fieldType)
    const newField: FormField = {
      id: generateFieldId(),
      type: fieldType,
      label: componentDef?.label || 'Nouveau champ',
      placeholder: '',
      required: false,
      width: 'full',
      column: column ?? 0,
      options: ['select', 'multiselect', 'radio', 'checkbox'].includes(fieldType)
        ? [
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' },
          ]
        : undefined,
    }

    const updatedSections = currentForm.sections.map((section) => {
      if (section.id === sectionId) {
        // Always push to end - column property determines which column displays the field
        // The natural order in the array determines ordering within each column
        return { ...section, fields: [...section.fields, newField] }
      }
      return section
    })

    setCurrentForm({ ...currentForm, sections: updatedSections })
    setSelectedField(newField)
    setSelectedSection(sectionId)
  }

  // Supprimer un champ
  const deleteField = (sectionId: string, fieldId: string) => {
    if (!currentForm) return

    const updatedSections = currentForm.sections.map((section) => {
      if (section.id === sectionId) {
        return { ...section, fields: section.fields.filter((f) => f.id !== fieldId) }
      }
      return section
    })

    setCurrentForm({ ...currentForm, sections: updatedSections })
    if (selectedField?.id === fieldId) {
      setSelectedField(null)
    }
  }

  // Dupliquer un champ
  const duplicateField = (sectionId: string, field: FormField) => {
    if (!currentForm) return

    const newField: FormField = {
      ...field,
      id: generateFieldId(),
      label: `${field.label} (copie)`,
    }

    const updatedSections = currentForm.sections.map((section) => {
      if (section.id === sectionId) {
        const fieldIndex = section.fields.findIndex((f) => f.id === field.id)
        const newFields = [...section.fields]
        newFields.splice(fieldIndex + 1, 0, newField)
        return { ...section, fields: newFields }
      }
      return section
    })

    setCurrentForm({ ...currentForm, sections: updatedSections })
  }

  // Mettre à jour un champ
  const updateField = (sectionId: string, fieldId: string, updates: Partial<FormField>) => {
    if (!currentForm) return

    const updatedSections = currentForm.sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          fields: section.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
        }
      }
      return section
    })

    setCurrentForm({ ...currentForm, sections: updatedSections })
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates })
    }
  }

  // Ajouter une section
  const addSection = () => {
    if (!currentForm) return

    const newSection: FormSection = {
      id: `section_${Date.now()}`,
      title: `Section ${currentForm.sections.length + 1}`,
      fields: [],
      columns: 1,
      columnGap: 'medium',
    }

    setCurrentForm({
      ...currentForm,
      sections: [...currentForm.sections, newSection],
    })
  }

  // Supprimer une section
  const deleteSection = (sectionId: string) => {
    if (!currentForm || currentForm.sections.length <= 1) return

    setCurrentForm({
      ...currentForm,
      sections: currentForm.sections.filter((s) => s.id !== sectionId),
    })
    if (selectedSection === sectionId) {
      setSelectedSection(null)
      setSelectedField(null)
    }
  }

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, componentType: string) => {
    setDraggedComponent(componentType)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragOver = (e: React.DragEvent, sectionId: string, index: number, column?: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragOverSection(sectionId)
    setDragOverIndex(index)
    setDragOverColumn(column ?? null)
  }

  const handleDrop = (e: React.DragEvent, sectionId: string, index: number, column?: number) => {
    e.preventDefault()
    if (draggedComponent) {
      addFieldToSection(sectionId, draggedComponent, index, column)
    }
    setDraggedComponent(null)
    setDragOverSection(null)
    setDragOverIndex(null)
    setDragOverColumn(null)
  }

  const handleDragEnd = () => {
    setDraggedComponent(null)
    setDragOverSection(null)
    setDragOverIndex(null)
    setDragOverColumn(null)
  }

  // Filtrer les composants par recherche
  const filteredComponents = FORM_COMPONENTS.filter(
    (c) =>
      (activeCategory === 'all' || c.category === activeCategory) &&
      c.label.toLowerCase().includes(searchComponent.toLowerCase())
  )

  // Rendu d'un aperçu de champ
  const renderFieldPreview = (field: FormField) => {
    const baseInputClass =
      'w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all'

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return <input type={field.type} placeholder={field.placeholder || `Entrez ${field.label.toLowerCase()}`} className={baseInputClass} disabled />
      case 'number':
        return <input type="number" placeholder={field.placeholder || '0'} className={baseInputClass} disabled />
      case 'textarea':
        return <textarea placeholder={field.placeholder || `Entrez ${field.label.toLowerCase()}`} className={`${baseInputClass} min-h-[80px] resize-none`} disabled />
      case 'date':
        return <input type="date" className={baseInputClass} disabled />
      case 'time':
        return <input type="time" className={baseInputClass} disabled />
      case 'datetime':
        return <input type="datetime-local" className={baseInputClass} disabled />
      case 'select':
        return (
          <select className={`${baseInputClass} appearance-none`} disabled>
            <option>{field.placeholder || 'Sélectionnez une option'}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )
      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded text-emerald-500" disabled />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        )
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2">
                <input type="radio" name={field.id} className="w-4 h-4 text-emerald-500" disabled />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        )
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded text-emerald-500" disabled />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        )
      case 'toggle':
        return (
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-6 bg-slate-300 rounded-full" />
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow" />
            </div>
            <span className="text-sm text-slate-600">{field.placeholder || 'Activer'}</span>
          </div>
        )
      case 'file':
        return (
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
            <Paperclip className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Cliquez ou déposez un fichier</p>
          </div>
        )
      case 'image':
        return (
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
            <Image className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Cliquez ou déposez une image</p>
          </div>
        )
      case 'signature':
        return (
          <div className="border border-slate-200 rounded-lg p-4 h-24 bg-slate-50 flex items-center justify-center">
            <p className="text-sm text-slate-400">Zone de signature</p>
          </div>
        )
      case 'rating':
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-6 h-6 text-slate-300" />
            ))}
          </div>
        )
      case 'slider':
        return (
          <div className="space-y-2">
            <input type="range" min="0" max="100" className="w-full" disabled />
            <div className="flex justify-between text-xs text-slate-500">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        )
      case 'heading':
        return <h3 className="text-lg font-semibold text-slate-800">{field.label}</h3>
      case 'paragraph':
        return <p className="text-sm text-slate-600">{field.placeholder || 'Texte de description...'}</p>
      case 'divider':
        return <hr className="border-slate-200" />
      case 'hidden':
        return (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <EyeOff className="w-4 h-4" />
            <span>Champ caché: {field.defaultValue || '(vide)'}</span>
          </div>
        )
      default:
        return <input type="text" placeholder={field.placeholder} className={baseInputClass} disabled />
    }
  }

  // Vue Liste des formulaires
  if (view === 'list') {
    return (
      <div className="h-full flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800">Gestionnaire de formulaires</h1>
            <p className="text-slate-500 mt-1">Créez et gérez vos formulaires personnalisés</p>
          </div>
          <button
            onClick={createNewForm}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25"
          >
            <Plus className="w-5 h-5" />
            Nouveau formulaire
          </button>
        </div>

        {/* Toast */}
        {formSuccess && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-slide-up">
            <Check className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-700">{formSuccess}</span>
          </div>
        )}

        {/* Liste des formulaires */}
        {forms.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
              <FileText className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Aucun formulaire</h2>
            <p className="text-slate-500 mb-6 max-w-md">
              Commencez par créer votre premier formulaire avec notre éditeur visuel intuitif.
            </p>
            <button
              onClick={createNewForm}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Créer un formulaire
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form) => (
              <div
                key={form.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
              >
                <div className="h-32 bg-gradient-to-br from-emerald-500 to-teal-600 relative">
                  <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)', backgroundSize: '20px 20px'}} />
                  <div className="absolute bottom-3 left-3 flex gap-1">
                    {form.sections.map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-white/50 rounded-full" />
                    ))}
                  </div>
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); duplicateForm(form); }}
                      className="w-8 h-8 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center text-white hover:bg-white/30"
                      title="Dupliquer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteForm(form.id); }}
                      className="w-8 h-8 bg-red-500/80 backdrop-blur rounded-lg flex items-center justify-center text-white hover:bg-red-600"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-800 mb-1">{form.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                    {form.description || 'Aucune description'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{form.sections.reduce((acc, s) => acc + s.fields.length, 0)} champs</span>
                    <span>Modifié le {new Date(form.updatedAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => editForm(form)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
                    >
                      <Edit3 className="w-4 h-4" />
                      Modifier
                    </button>
                    <button
                      onClick={() => { setCurrentForm(form); setView('preview'); }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Aperçu
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Vue Aperçu
  if (view === 'preview' && currentForm) {
    return (
      <div className="h-full flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('editor')}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-display font-bold text-slate-800">Aperçu: {currentForm.name}</h1>
              <p className="text-sm text-slate-500">Visualisez votre formulaire tel qu'il apparaîtra aux utilisateurs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('editor')}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Modifier
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="h-3 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{currentForm.name}</h2>
                {currentForm.description && (
                  <p className="text-slate-500 mb-6">{currentForm.description}</p>
                )}

                {currentForm.sections.map((section, sIndex) => (
                  <div key={section.id} className={sIndex > 0 ? 'mt-8 pt-8 border-t border-slate-100' : ''}>
                    {currentForm.sections.length > 1 && (
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">{section.title}</h3>
                        {section.description && (
                          <p className="text-sm text-slate-500">{section.description}</p>
                        )}
                      </div>
                    )}
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: `repeat(${section.columns || 1}, 1fr)`,
                        gap: section.columnGap === 'small' ? '12px' : section.columnGap === 'large' ? '24px' : '20px'
                      }}
                    >
                      {Array.from({ length: section.columns || 1 }).map((_, colIndex) => {
                        const columnFields = section.fields.filter(f => (f.column ?? 0) === colIndex)
                        return (
                          <div key={colIndex} className="space-y-4">
                            {columnFields.map((field) => (
                              <div key={field.id}>
                                {!['heading', 'paragraph', 'divider'].includes(field.type) && (
                                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                  </label>
                                )}
                                {renderFieldPreview(field)}
                                {field.helpText && (
                                  <p className="text-xs text-slate-500 mt-1">{field.helpText}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all">
                    {currentForm.settings.submitButtonText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Vue Éditeur
  return (
    <div className="h-full flex flex-col -m-6">
      {/* Top Toolbar */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setView('list'); setCurrentForm(null); setSelectedField(null); }}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="h-6 w-px bg-slate-200" />
          <input
            type="text"
            value={currentForm?.name || ''}
            onChange={(e) => currentForm && setCurrentForm({ ...currentForm, name: e.target.value })}
            className="text-lg font-semibold text-slate-800 bg-transparent border-none outline-none focus:ring-0 max-w-xs"
            placeholder="Nom du formulaire"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFormSettings(true)}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm"
          >
            <Settings className="w-4 h-4" />
            Paramètres
          </button>
          <button
            onClick={() => setView('preview')}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm"
          >
            <Eye className="w-4 h-4" />
            Aperçu
          </button>
          <div className="h-6 w-px bg-slate-200 mx-1" />
          <button
            onClick={saveCurrentForm}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Toast */}
      {formSuccess && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-500 text-white rounded-lg shadow-lg flex items-center gap-2 animate-slide-up">
          <Check className="w-4 h-4" />
          {formSuccess}
        </div>
      )}

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Components */}
        <div className={`${leftPanelOpen ? 'w-72' : 'w-0'} bg-white border-r border-slate-200 flex flex-col transition-all overflow-hidden flex-shrink-0`}>
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un composant..."
                value={searchComponent}
                onChange={(e) => setSearchComponent(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-emerald-400 outline-none transition-all"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-1 p-2 overflow-x-auto border-b border-slate-100">
            {COMPONENT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Components List */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 gap-2">
              {filteredComponents.map((component) => (
                <div
                  key={component.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, component.type)}
                  onDragEnd={handleDragEnd}
                  className="flex flex-col items-center gap-2 p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl cursor-grab active:cursor-grabbing transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow">
                    <component.icon className="w-5 h-5 text-slate-600 group-hover:text-emerald-600" />
                  </div>
                  <span className="text-xs text-slate-600 text-center font-medium">{component.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Toggle Left Panel */}
        <button
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="w-6 bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0"
        >
          {leftPanelOpen ? <PanelLeftClose className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
        </button>

        {/* Canvas */}
        <div className="flex-1 bg-slate-100 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {currentForm?.sections.map((section, sectionIndex) => (
              <div
                key={section.id}
                className={`bg-white rounded-xl border-2 transition-all ${
                  selectedSection === section.id ? 'border-emerald-400 shadow-lg shadow-emerald-500/10' : 'border-slate-200'
                }`}
              >
                {/* Section Header */}
                <div
                  className="flex items-center justify-between p-4 border-b border-slate-100 cursor-pointer"
                  onClick={() => { setSelectedSection(section.id); setSelectedField(null); }}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => {
                        const updatedSections = currentForm.sections.map((s) =>
                          s.id === section.id ? { ...s, title: e.target.value } : s
                        )
                        setCurrentForm({ ...currentForm, sections: updatedSections })
                      }}
                      className="font-semibold text-slate-800 bg-transparent border-none outline-none focus:ring-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Sélecteur de colonnes inline */}
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs text-slate-500 px-1.5">Colonnes:</span>
                      {[1, 2, 3, 4].map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            setCurrentForm(prev => {
                              if (!prev) return prev
                              return {
                                ...prev,
                                sections: prev.sections.map((s) =>
                                  s.id === section.id ? { ...s, columns: col as 1 | 2 | 3 | 4 } : s
                                )
                              }
                            })
                          }}
                          className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium transition-all ${
                            (section.columns || 1) === col
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {col}
                        </button>
                      ))}
                    </div>
                    {currentForm.sections.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Section Fields with Visual Columns */}
                <div className="p-4 min-h-[120px]">
                  {/* Debug: affiche le nombre de colonnes */}
                  <div className="text-xs text-orange-500 mb-2">Debug: {section.columns || 1} colonne(s)</div>
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: `repeat(${section.columns || 1}, minmax(0, 1fr))`,
                      gap: section.columnGap === 'small' ? '8px' : section.columnGap === 'large' ? '24px' : '16px'
                    }}
                  >
                    {Array.from({ length: section.columns || 1 }).map((_, colIndex) => {
                      const columnFields = section.fields.filter(f => (f.column ?? 0) === colIndex)
                      const numColumns = section.columns || 1

                      return (
                        <div
                          key={colIndex}
                          className={`min-h-[100px] rounded-xl border-2 border-dashed transition-all ${
                            dragOverSection === section.id && dragOverColumn === colIndex && draggedComponent
                              ? 'border-emerald-400 bg-emerald-50'
                              : 'border-slate-200 bg-slate-50/50'
                          }`}
                          onDragOver={(e) => handleDragOver(e, section.id, columnFields.length, colIndex)}
                          onDrop={(e) => handleDrop(e, section.id, columnFields.length, colIndex)}
                        >
                          {/* Column Header - always visible */}
                          <div className={`px-3 py-1.5 border-b rounded-t-xl flex items-center justify-between transition-colors ${
                            dragOverSection === section.id && dragOverColumn === colIndex && draggedComponent
                              ? 'bg-emerald-100 border-emerald-200'
                              : numColumns > 1 ? 'bg-slate-100/80 border-slate-200' : 'bg-slate-50/50 border-slate-200'
                          }`}>
                            <span className={`text-xs font-medium transition-colors ${
                              dragOverSection === section.id && dragOverColumn === colIndex && draggedComponent
                                ? 'text-emerald-600'
                                : 'text-slate-500'
                            }`}>
                              {numColumns > 1 ? `Colonne ${colIndex + 1}` : 'Zone de dépôt'}
                            </span>
                            <span className={`text-[10px] transition-colors ${
                              dragOverSection === section.id && dragOverColumn === colIndex && draggedComponent
                                ? 'text-emerald-500'
                                : 'text-slate-400'
                            }`}>
                              {columnFields.length} champ{columnFields.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="p-2 space-y-2">
                            {columnFields.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-6 text-center">
                                <MousePointer className="w-5 h-5 text-slate-300 mb-2" />
                                <p className="text-xs text-slate-400">Glissez un composant ici</p>
                              </div>
                            ) : (
                              columnFields.map((field, fieldIndex) => (
                                <div
                                  key={field.id}
                                  onDragOver={(e) => handleDragOver(e, section.id, fieldIndex, colIndex)}
                                  onDrop={(e) => handleDrop(e, section.id, fieldIndex, colIndex)}
                                >
                                  {dragOverSection === section.id && dragOverIndex === fieldIndex && dragOverColumn === colIndex && draggedComponent && (
                                    <div className="h-12 border-2 border-dashed border-emerald-400 bg-emerald-50 rounded-lg mb-2 flex items-center justify-center">
                                      <span className="text-xs text-emerald-600">Déposer ici</span>
                                    </div>
                                  )}
                                  <div
                                    className={`group relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                      selectedField?.id === field.id
                                        ? 'border-emerald-400 bg-emerald-50/50 shadow-md'
                                        : 'border-transparent bg-white hover:border-slate-200 hover:shadow-sm'
                                    }`}
                                    onClick={() => { setSelectedField(field); setSelectedSection(section.id); }}
                                  >
                                    {/* Field Actions */}
                                    <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); duplicateField(section.id, field); }}
                                        className="w-6 h-6 flex items-center justify-center rounded bg-white shadow-sm text-slate-400 hover:text-emerald-600 transition-colors"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); deleteField(section.id, field.id); }}
                                        className="w-6 h-6 flex items-center justify-center rounded bg-white shadow-sm text-slate-400 hover:text-red-500 transition-colors"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>

                                    {/* Field Preview */}
                                    <div className="pr-14">
                                      {!['heading', 'paragraph', 'divider'].includes(field.type) && (
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                          {field.label}
                                          {field.required && <span className="text-red-500 ml-0.5">*</span>}
                                        </label>
                                      )}
                                      {renderFieldPreview(field)}
                                      {field.helpText && (
                                        <p className="text-[10px] text-slate-500 mt-0.5">{field.helpText}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}

                            {/* Drop zone at the end of column */}
                            {columnFields.length > 0 && draggedComponent && (
                              <div
                                className={`h-12 border-2 border-dashed rounded-lg transition-all flex items-center justify-center ${
                                  dragOverSection === section.id && dragOverIndex === columnFields.length && dragOverColumn === colIndex
                                    ? 'border-emerald-400 bg-emerald-50'
                                    : 'border-slate-200 bg-slate-50/50'
                                }`}
                                onDragOver={(e) => handleDragOver(e, section.id, columnFields.length, colIndex)}
                                onDrop={(e) => handleDrop(e, section.id, columnFields.length, colIndex)}
                              >
                                <span className="text-xs text-slate-400">+ Ajouter ici</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}

            {/* Add Section Button */}
            <button
              onClick={addSection}
              className="w-full p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Ajouter une section
            </button>
          </div>
        </div>

        {/* Toggle Right Panel */}
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="w-6 bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0"
        >
          {rightPanelOpen ? <PanelRightClose className="w-4 h-4 text-slate-500" /> : <ChevronLeft className="w-4 h-4 text-slate-500" />}
        </button>

        {/* Right Panel - Properties */}
        <div className={`${rightPanelOpen ? 'w-80' : 'w-0'} bg-white border-l border-slate-200 flex flex-col transition-all overflow-hidden flex-shrink-0`}>
          {selectedField ? (
            <>
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Propriétés du champ</h3>
                <p className="text-xs text-slate-500 mt-0.5">{FORM_COMPONENTS.find(c => c.type === selectedField.type)?.label}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Label */}
                {!['divider'].includes(selectedField.type) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Libellé</label>
                    <input
                      type="text"
                      value={selectedField.label}
                      onChange={(e) => selectedSection && updateField(selectedSection, selectedField.id, { label: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-emerald-400 outline-none transition-all"
                    />
                  </div>
                )}

                {/* Placeholder */}
                {['text', 'textarea', 'email', 'phone', 'number', 'select', 'paragraph'].includes(selectedField.type) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      {selectedField.type === 'paragraph' ? 'Texte' : 'Placeholder'}
                    </label>
                    {selectedField.type === 'paragraph' || selectedField.type === 'textarea' ? (
                      <textarea
                        value={selectedField.placeholder || ''}
                        onChange={(e) => selectedSection && updateField(selectedSection, selectedField.id, { placeholder: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-emerald-400 outline-none transition-all min-h-[80px]"
                      />
                    ) : (
                      <input
                        type="text"
                        value={selectedField.placeholder || ''}
                        onChange={(e) => selectedSection && updateField(selectedSection, selectedField.id, { placeholder: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-emerald-400 outline-none transition-all"
                      />
                    )}
                  </div>
                )}

                {/* Help Text */}
                {!['heading', 'paragraph', 'divider'].includes(selectedField.type) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Texte d'aide</label>
                    <input
                      type="text"
                      value={selectedField.helpText || ''}
                      onChange={(e) => selectedSection && updateField(selectedSection, selectedField.id, { helpText: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-emerald-400 outline-none transition-all"
                      placeholder="Instructions pour l'utilisateur"
                    />
                  </div>
                )}

                {/* Default Value */}
                {['text', 'email', 'number', 'hidden'].includes(selectedField.type) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Valeur par défaut</label>
                    <input
                      type="text"
                      value={selectedField.defaultValue || ''}
                      onChange={(e) => selectedSection && updateField(selectedSection, selectedField.id, { defaultValue: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-emerald-400 outline-none transition-all"
                    />
                  </div>
                )}

                {/* Options for select, radio, checkbox */}
                {['select', 'multiselect', 'radio', 'checkbox'].includes(selectedField.type) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Options</label>
                    <div className="space-y-2">
                      {selectedField.options?.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={option.label}
                            onChange={(e) => {
                              const newOptions = [...(selectedField.options || [])]
                              newOptions[index] = { ...newOptions[index], label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') }
                              selectedSection && updateField(selectedSection, selectedField.id, { options: newOptions })
                            }}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-emerald-400 outline-none transition-all"
                          />
                          <button
                            onClick={() => {
                              const newOptions = selectedField.options?.filter((_, i) => i !== index)
                              selectedSection && updateField(selectedSection, selectedField.id, { options: newOptions })
                            }}
                            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newOptions = [...(selectedField.options || []), { label: `Option ${(selectedField.options?.length || 0) + 1}`, value: `option${(selectedField.options?.length || 0) + 1}` }]
                          selectedSection && updateField(selectedSection, selectedField.id, { options: newOptions })
                        }}
                        className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                      >
                        + Ajouter une option
                      </button>
                    </div>
                  </div>
                )}

                {/* Column Selector */}
                {(() => {
                  const currentSection = currentForm?.sections.find(s => s.id === selectedSection)
                  const numColumns = currentSection?.columns || 1
                  if (numColumns <= 1) return null
                  return (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Colonne</label>
                      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${numColumns}, 1fr)` }}>
                        {Array.from({ length: numColumns }).map((_, colIndex) => (
                          <button
                            key={colIndex}
                            onClick={() => selectedSection && updateField(selectedSection, selectedField.id, { column: colIndex })}
                            className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                              (selectedField.column ?? 0) === colIndex
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {colIndex + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* Required Toggle */}
                {!['heading', 'paragraph', 'divider', 'hidden'].includes(selectedField.type) && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">Champ obligatoire</span>
                    <button
                      onClick={() => selectedSection && updateField(selectedSection, selectedField.id, { required: !selectedField.required })}
                      className={`relative w-11 h-6 rounded-full transition-colors ${selectedField.required ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${selectedField.required ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                )}

                {/* Validation */}
                {['text', 'textarea', 'number', 'email'].includes(selectedField.type) && (
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-800 mb-3">Validation</h4>
                    {['text', 'textarea', 'email'].includes(selectedField.type) && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Min caractères</label>
                          <input
                            type="number"
                            min="0"
                            value={selectedField.validation?.minLength || ''}
                            onChange={(e) => selectedSection && updateField(selectedSection, selectedField.id, {
                              validation: { ...selectedField.validation, minLength: parseInt(e.target.value) || undefined }
                            })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-emerald-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Max caractères</label>
                          <input
                            type="number"
                            min="0"
                            value={selectedField.validation?.maxLength || ''}
                            onChange={(e) => selectedSection && updateField(selectedSection, selectedField.id, {
                              validation: { ...selectedField.validation, maxLength: parseInt(e.target.value) || undefined }
                            })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-emerald-400 outline-none"
                          />
                        </div>
                      </div>
                    )}
                    {selectedField.type === 'number' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Valeur min</label>
                          <input
                            type="number"
                            value={selectedField.validation?.min || ''}
                            onChange={(e) => selectedSection && updateField(selectedSection, selectedField.id, {
                              validation: { ...selectedField.validation, min: parseInt(e.target.value) || undefined }
                            })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-emerald-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Valeur max</label>
                          <input
                            type="number"
                            value={selectedField.validation?.max || ''}
                            onChange={(e) => selectedSection && updateField(selectedSection, selectedField.id, {
                              validation: { ...selectedField.validation, max: parseInt(e.target.value) || undefined }
                            })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-emerald-400 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : selectedSection ? (
            <>
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Propriétés de la section</h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Titre</label>
                  <input
                    type="text"
                    value={currentForm?.sections.find(s => s.id === selectedSection)?.title || ''}
                    onChange={(e) => {
                      if (!currentForm) return
                      const updatedSections = currentForm.sections.map((s) =>
                        s.id === selectedSection ? { ...s, title: e.target.value } : s
                      )
                      setCurrentForm({ ...currentForm, sections: updatedSections })
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-emerald-400 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                  <textarea
                    value={currentForm?.sections.find(s => s.id === selectedSection)?.description || ''}
                    onChange={(e) => {
                      if (!currentForm) return
                      const updatedSections = currentForm.sections.map((s) =>
                        s.id === selectedSection ? { ...s, description: e.target.value } : s
                      )
                      setCurrentForm({ ...currentForm, sections: updatedSections })
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-emerald-400 outline-none transition-all min-h-[80px]"
                    placeholder="Description optionnelle de la section"
                  />
                </div>

                {/* Nombre de colonnes */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-700 mb-3">Disposition des champs</label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-2">Nombre de colonnes</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((col) => (
                          <button
                            key={col}
                            onClick={() => {
                              if (!currentForm) return
                              const updatedSections = currentForm.sections.map((s) =>
                                s.id === selectedSection ? { ...s, columns: col as 1 | 2 | 3 | 4 } : s
                              )
                              setCurrentForm({ ...currentForm, sections: updatedSections })
                            }}
                            className={`relative py-3 rounded-lg text-sm font-medium transition-all ${
                              (currentForm?.sections.find(s => s.id === selectedSection)?.columns || 1) === col
                                ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <div className="flex justify-center gap-0.5 mb-1">
                              {Array.from({ length: col }).map((_, i) => (
                                <div key={i} className={`w-2 h-4 rounded-sm ${
                                  (currentForm?.sections.find(s => s.id === selectedSection)?.columns || 1) === col
                                    ? 'bg-emerald-500'
                                    : 'bg-slate-400'
                                }`} />
                              ))}
                            </div>
                            <span className="text-xs">{col}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-2">Espacement entre colonnes</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'small', label: 'Petit', size: 'gap-2' },
                          { value: 'medium', label: 'Moyen', size: 'gap-4' },
                          { value: 'large', label: 'Grand', size: 'gap-6' },
                        ].map((gap) => (
                          <button
                            key={gap.value}
                            onClick={() => {
                              if (!currentForm) return
                              const updatedSections = currentForm.sections.map((s) =>
                                s.id === selectedSection ? { ...s, columnGap: gap.value as 'small' | 'medium' | 'large' } : s
                              )
                              setCurrentForm({ ...currentForm, sections: updatedSections })
                            }}
                            className={`py-2 rounded-lg text-xs font-medium transition-all ${
                              (currentForm?.sections.find(s => s.id === selectedSection)?.columnGap || 'medium') === gap.value
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {gap.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aperçu de la disposition */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-xs text-slate-500 mb-2">Aperçu de la disposition</label>
                  <div className={`grid bg-slate-50 rounded-lg p-3 ${
                    (() => {
                      const cols = currentForm?.sections.find(s => s.id === selectedSection)?.columns || 1
                      const gap = currentForm?.sections.find(s => s.id === selectedSection)?.columnGap || 'medium'
                      const gapClass = gap === 'small' ? 'gap-1' : gap === 'large' ? 'gap-3' : 'gap-2'
                      return `grid-cols-${cols} ${gapClass}`
                    })()
                  }`} style={{
                    gridTemplateColumns: `repeat(${currentForm?.sections.find(s => s.id === selectedSection)?.columns || 1}, 1fr)`,
                    gap: currentForm?.sections.find(s => s.id === selectedSection)?.columnGap === 'small' ? '4px' :
                         currentForm?.sections.find(s => s.id === selectedSection)?.columnGap === 'large' ? '12px' : '8px'
                  }}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-6 bg-slate-200 rounded" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    {currentForm?.sections.find(s => s.id === selectedSection)?.columns || 1} colonne{(currentForm?.sections.find(s => s.id === selectedSection)?.columns || 1) > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <MousePointer className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-700 mb-1">Aucune sélection</h3>
              <p className="text-sm text-slate-500">
                Sélectionnez un champ ou une section pour modifier ses propriétés
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Form Settings Modal */}
      {showFormSettings && currentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg m-4 animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Paramètres du formulaire</h3>
              <button
                onClick={() => setShowFormSettings(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom du formulaire</label>
                <input
                  type="text"
                  value={currentForm.name}
                  onChange={(e) => setCurrentForm({ ...currentForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-emerald-400 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  value={currentForm.description || ''}
                  onChange={(e) => setCurrentForm({ ...currentForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-emerald-400 outline-none transition-all min-h-[80px]"
                  placeholder="Description du formulaire"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Texte du bouton d'envoi</label>
                <input
                  type="text"
                  value={currentForm.settings.submitButtonText}
                  onChange={(e) => setCurrentForm({ ...currentForm, settings: { ...currentForm.settings, submitButtonText: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-emerald-400 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Message de succès</label>
                <textarea
                  value={currentForm.settings.successMessage}
                  onChange={(e) => setCurrentForm({ ...currentForm, settings: { ...currentForm.settings, successMessage: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-emerald-400 outline-none transition-all min-h-[60px]"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700">Sauvegarder comme brouillon</p>
                  <p className="text-xs text-slate-500">Permettre aux utilisateurs de sauvegarder</p>
                </div>
                <button
                  onClick={() => setCurrentForm({ ...currentForm, settings: { ...currentForm.settings, saveAsDraft: !currentForm.settings.saveAsDraft } })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${currentForm.settings.saveAsDraft ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${currentForm.settings.saveAsDraft ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700">Formulaire multi-étapes</p>
                  <p className="text-xs text-slate-500">Afficher une section par page</p>
                </div>
                <button
                  onClick={() => setCurrentForm({ ...currentForm, settings: { ...currentForm.settings, multiStep: !currentForm.settings.multiStep } })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${currentForm.settings.multiStep ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${currentForm.settings.multiStep ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setShowFormSettings(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => setShowFormSettings(false)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================
   PROCEDURES PAGE
   ============================================ */
interface Procedure {
  id: string
  code: string
  name: string
  description?: string
  categoryId?: string
  category?: { id: string; name: string; color: string }
  keywords?: string
  checklist?: string
  visibleBy?: string[]
  triggerType: 'MANUAL' | 'AUTOMATIC'
  triggerConfig?: {
    frequency?: 'daily' | 'weekly' | 'monthly'
    dayOfWeek?: number
    dayOfMonth?: number
    time?: string
  }
  isActive: boolean
  steps?: ProcedureStepData[]
  createdAt: string
  updatedAt: string
}

interface ProcedureStepData {
  id?: string
  name: string
  description?: string
  stepNumber: number
  durationHours?: number
  responsibles?: string[]
  operations?: StepOperation[]
}

interface StepOperation {
  id?: string
  name: string
  description?: string
  formId?: string
  formName?: string
  sortOrder: number
}

interface EventCategory {
  id: string
  code: string
  name: string
  color: string
}

interface UserOrGroup {
  id: string
  type: 'user' | 'group'
  name: string
  email?: string
}

interface FormItem {
  id: string
  code: string
  name: string
}

type ProcedureView = 'list' | 'form' | 'steps'

function ProceduresPage() {
  const { t } = useTranslation()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  // View state
  const [currentView, setCurrentView] = useState<ProcedureView>('list')
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null)

  // Data states
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [categories, setCategories] = useState<EventCategory[]>([])
  const [usersAndGroups, setUsersAndGroups] = useState<UserOrGroup[]>([])
  const [forms, setForms] = useState<FormItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Form state for procedure
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    keywords: '',
    checklist: '',
    visibleBy: [] as string[],
    triggerType: 'MANUAL' as 'MANUAL' | 'AUTOMATIC',
    triggerConfig: {
      frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
      dayOfWeek: 1,
      dayOfMonth: 1,
      time: '09:00'
    }
  })

  // Steps state
  const [steps, setSteps] = useState<ProcedureStepData[]>([])
  const [draggedStep, setDraggedStep] = useState<number | null>(null)

  // Operations modal state
  const [showOperationsModal, setShowOperationsModal] = useState(false)
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null)
  const [operationForm, setOperationForm] = useState({ name: '', description: '', formId: '' })

  // Autocomplete states
  const [visibleBySearch, setVisibleBySearch] = useState('')
  const [showVisibleByDropdown, setShowVisibleByDropdown] = useState(false)
  const [responsibleSearch, setResponsibleSearch] = useState('')
  const [showResponsibleDropdown, setShowResponsibleDropdown] = useState<number | null>(null)

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingProcedure, setDeletingProcedure] = useState<Procedure | null>(null)

  const getHeaders = () => {
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    return { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
  }

  // Load data
  const loadProcedures = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/procedures`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        setProcedures(data.data?.items || data.items || [])
      }
    } catch (error) {
      console.error('Error loading procedures:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/config/event-categories`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        setCategories(data.data || data || [])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadUsersAndGroups = async () => {
    try {
      const [usersRes, groupsRes] = await Promise.all([
        fetch(`${API_URL}/api/users`, { headers: getHeaders() }),
        fetch(`${API_URL}/api/users/groups/list`, { headers: getHeaders() })
      ])
      const usersData = usersRes.ok ? await usersRes.json() : { data: [] }
      const groupsData = groupsRes.ok ? await groupsRes.json() : { data: [] }

      const users = (usersData.data || []).map((u: any) => ({
        id: u.id, type: 'user' as const, name: `${u.first_name} ${u.last_name}`, email: u.email
      }))
      const groups = (groupsData.data || []).map((g: any) => ({
        id: g.id, type: 'group' as const, name: g.name
      }))
      setUsersAndGroups([...users, ...groups])
    } catch (error) {
      console.error('Error loading users/groups:', error)
    }
  }

  const loadForms = async () => {
    try {
      const response = await fetch(`${API_URL}/api/forms`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        setForms(data.data?.items || data.items || [])
      }
    } catch (error) {
      console.error('Error loading forms:', error)
    }
  }

  useEffect(() => {
    loadProcedures()
    loadCategories()
    loadUsersAndGroups()
    loadForms()
  }, [])

  // Filter procedures
  const filteredProcedures = procedures.filter(proc => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return proc.name.toLowerCase().includes(search) || proc.keywords?.toLowerCase().includes(search)
    }
    return true
  })

  // Navigation handlers
  const handleNewProcedure = () => {
    setSelectedProcedure(null)
    setFormData({
      name: '', categoryId: '', keywords: '', checklist: '',
      visibleBy: [], triggerType: 'MANUAL',
      triggerConfig: { frequency: 'daily', dayOfWeek: 1, dayOfMonth: 1, time: '09:00' }
    })
    setCurrentView('form')
  }

  const handleEditProcedure = (procedure: Procedure) => {
    setSelectedProcedure(procedure)
    setFormData({
      name: procedure.name,
      categoryId: procedure.categoryId || '',
      keywords: procedure.keywords || '',
      checklist: procedure.checklist || '',
      visibleBy: procedure.visibleBy || [],
      triggerType: procedure.triggerType,
      triggerConfig: procedure.triggerConfig || { frequency: 'daily', dayOfWeek: 1, dayOfMonth: 1, time: '09:00' }
    })
    setCurrentView('form')
  }

  const handleManageSteps = (procedure: Procedure) => {
    setSelectedProcedure(procedure)
    setSteps(procedure.steps || [])
    setCurrentView('steps')
  }

  const handleBack = () => {
    setCurrentView('list')
    setSelectedProcedure(null)
  }

  // Save procedure
  const handleSaveProcedure = async () => {
    try {
      const payload = {
        ...formData,
        code: selectedProcedure?.code || `PROC_${Date.now()}`,
        isActive: true
      }
      const url = selectedProcedure ? `${API_URL}/api/procedures/${selectedProcedure.id}` : `${API_URL}/api/procedures`
      const response = await fetch(url, {
        method: selectedProcedure ? 'PUT' : 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      if (response.ok) {
        loadProcedures()
        setCurrentView('list')
      }
    } catch (error) {
      console.error('Error saving procedure:', error)
    }
  }

  // Save steps
  const handleSaveSteps = async () => {
    if (!selectedProcedure) return
    try {
      await fetch(`${API_URL}/api/procedures/${selectedProcedure.id}/steps/bulk`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ steps })
      })
      loadProcedures()
      setCurrentView('list')
    } catch (error) {
      console.error('Error saving steps:', error)
    }
  }

  // Delete procedure
  const handleDelete = async () => {
    if (!deletingProcedure) return
    try {
      await fetch(`${API_URL}/api/procedures/${deletingProcedure.id}`, { method: 'DELETE', headers: getHeaders() })
      setShowDeleteModal(false)
      setDeletingProcedure(null)
      loadProcedures()
    } catch (error) {
      console.error('Error deleting procedure:', error)
    }
  }

  // Steps management
  const addStep = () => {
    setSteps([...steps, { name: '', stepNumber: steps.length + 1, responsibles: [], operations: [] }])
  }

  const updateStep = (index: number, field: string, value: any) => {
    setSteps(steps.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 })))
  }

  // Drag and drop
  const handleDragStart = (index: number) => setDraggedStep(index)
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedStep === null || draggedStep === index) return
    const newSteps = [...steps]
    const draggedItem = newSteps[draggedStep]
    newSteps.splice(draggedStep, 1)
    newSteps.splice(index, 0, draggedItem)
    setSteps(newSteps.map((s, i) => ({ ...s, stepNumber: i + 1 })))
    setDraggedStep(index)
  }
  const handleDragEnd = () => setDraggedStep(null)

  // Operations management
  const openOperationsModal = (stepIndex: number) => {
    setEditingStepIndex(stepIndex)
    setOperationForm({ name: '', description: '', formId: '' })
    setShowOperationsModal(true)
  }

  const addOperation = () => {
    if (editingStepIndex === null || !operationForm.name) return
    const step = steps[editingStepIndex]
    const newOperation: StepOperation = {
      ...operationForm,
      formName: forms.find(f => f.id === operationForm.formId)?.name,
      sortOrder: (step.operations?.length || 0) + 1
    }
    updateStep(editingStepIndex, 'operations', [...(step.operations || []), newOperation])
    setOperationForm({ name: '', description: '', formId: '' })
  }

  const removeOperation = (stepIndex: number, opIndex: number) => {
    const step = steps[stepIndex]
    updateStep(stepIndex, 'operations', step.operations?.filter((_, i) => i !== opIndex))
  }

  // Autocomplete helpers
  const filteredUsersGroups = usersAndGroups.filter(ug =>
    ug.name.toLowerCase().includes((currentView === 'form' ? visibleBySearch : responsibleSearch).toLowerCase())
  )

  const addVisibleBy = (item: UserOrGroup) => {
    if (!formData.visibleBy.includes(item.id)) {
      setFormData({ ...formData, visibleBy: [...formData.visibleBy, item.id] })
    }
    setVisibleBySearch('')
    setShowVisibleByDropdown(false)
  }

  const removeVisibleBy = (id: string) => {
    setFormData({ ...formData, visibleBy: formData.visibleBy.filter(v => v !== id) })
  }

  const addResponsible = (stepIndex: number, item: UserOrGroup) => {
    const step = steps[stepIndex]
    if (!step.responsibles?.includes(item.id)) {
      updateStep(stepIndex, 'responsibles', [...(step.responsibles || []), item.id])
    }
    setResponsibleSearch('')
    setShowResponsibleDropdown(null)
  }

  const removeResponsible = (stepIndex: number, id: string) => {
    const step = steps[stepIndex]
    updateStep(stepIndex, 'responsibles', step.responsibles?.filter(r => r !== id))
  }

  const getItemName = (id: string) => usersAndGroups.find(ug => ug.id === id)?.name || id

  // ==================== RENDER VIEWS ====================

  // LIST VIEW
  if (currentView === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800">Gestion des Procédures</h1>
            <p className="text-slate-500 mt-1">{filteredProcedures.length} procédure(s)</p>
          </div>
          <button onClick={handleNewProcedure} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouvelle procédure
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 text-primary-600 animate-spin" /></div>
        ) : filteredProcedures.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Aucune procédure</h3>
            <button onClick={handleNewProcedure} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700">Créer une procédure</button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Procédure</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Catégorie</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Déclenchement</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Étapes</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProcedures.map(proc => (
                  <tr key={proc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{proc.name}</p>
                      {proc.keywords && <p className="text-xs text-slate-500">{proc.keywords}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {proc.category && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${proc.category.color}20`, color: proc.category.color }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: proc.category.color }} />
                          {proc.category.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs ${proc.triggerType === 'MANUAL' ? 'text-blue-600' : 'text-amber-600'}`}>
                        {proc.triggerType === 'MANUAL' ? <Play className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                        {proc.triggerType === 'MANUAL' ? 'Manuel' : 'Automatique'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">{proc.steps?.length || 0} étape(s)</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleManageSteps(proc)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Gérer les étapes">
                          <Layers className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEditProcedure(proc)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="Modifier">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setDeletingProcedure(proc); setShowDeleteModal(true) }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && deletingProcedure && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Supprimer la procédure</h3>
              <p className="text-slate-500 mb-6">Supprimer "{deletingProcedure.name}" ?</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50">Annuler</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700">Supprimer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // FORM VIEW (Create/Edit Procedure)
  if (currentView === 'form') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-slate-800">
            {selectedProcedure ? 'Modifier la procédure' : 'Nouvelle procédure'}
          </h1>
          <button onClick={handleBack} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          {/* Nom + Catégorie sur la même ligne */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom de la procédure *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Investigation foyer épidémique"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie d'événement</label>
              <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500">
                <option value="">Sélectionner une catégorie</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mots clés + Visible par sur la même ligne */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mots clés</label>
              <input type="text" value={formData.keywords} onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="Ex: épidémie, investigation, terrain"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Visible par</label>
              <div className="relative">
                <div className="flex flex-wrap items-center gap-1 min-h-[42px] px-2 py-1 border border-slate-300 rounded-xl focus-within:ring-2 focus-within:ring-primary-500 bg-white">
                  {formData.visibleBy.map(id => (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-lg text-sm">
                      {getItemName(id)}
                      <button type="button" onClick={() => removeVisibleBy(id)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  <input type="text" value={visibleBySearch}
                    onChange={(e) => { setVisibleBySearch(e.target.value); setShowVisibleByDropdown(true) }}
                    onFocus={() => setShowVisibleByDropdown(true)}
                    placeholder={formData.visibleBy.length === 0 ? "Rechercher..." : ""}
                    className="flex-1 min-w-[100px] px-2 py-1 border-0 focus:ring-0 focus:outline-none text-sm" />
                </div>
                {showVisibleByDropdown && visibleBySearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredUsersGroups.length === 0 ? (
                      <p className="px-4 py-2 text-sm text-slate-500">Aucun résultat</p>
                    ) : (
                      filteredUsersGroups.slice(0, 10).map(item => (
                        <button key={item.id} type="button" onClick={() => addVisibleBy(item)}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2">
                          {item.type === 'user' ? <User className="w-4 h-4 text-slate-400" /> : <Users className="w-4 h-4 text-slate-400" />}
                          <span className="text-sm text-slate-700">{item.name}</span>
                          <span className="text-xs text-slate-400">{item.type === 'user' ? 'Utilisateur' : 'Groupe'}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Check liste */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Check liste</label>
            <textarea value={formData.checklist} onChange={(e) => setFormData({ ...formData, checklist: e.target.value })}
              rows={3} placeholder="Liste de vérification (une par ligne)"
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
          </div>

          {/* Déclenchement */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Déclenchement</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="trigger" checked={formData.triggerType === 'MANUAL'}
                  onChange={() => setFormData({ ...formData, triggerType: 'MANUAL' })}
                  className="text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-slate-700">Manuel</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="trigger" checked={formData.triggerType === 'AUTOMATIC'}
                  onChange={() => setFormData({ ...formData, triggerType: 'AUTOMATIC' })}
                  className="text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-slate-700">Automatique</span>
              </label>
            </div>

            {formData.triggerType === 'AUTOMATIC' && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fréquence</label>
                    <select value={formData.triggerConfig.frequency}
                      onChange={(e) => setFormData({ ...formData, triggerConfig: { ...formData.triggerConfig, frequency: e.target.value as any } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                      <option value="daily">Quotidien</option>
                      <option value="weekly">Hebdomadaire</option>
                      <option value="monthly">Mensuel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Heure</label>
                    <input type="time" value={formData.triggerConfig.time}
                      onChange={(e) => setFormData({ ...formData, triggerConfig: { ...formData.triggerConfig, time: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  </div>
                </div>
                {formData.triggerConfig.frequency === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Jour de la semaine</label>
                    <select value={formData.triggerConfig.dayOfWeek}
                      onChange={(e) => setFormData({ ...formData, triggerConfig: { ...formData.triggerConfig, dayOfWeek: parseInt(e.target.value) } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                      {['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((d, i) => (
                        <option key={i} value={i}>{d}</option>
                      ))}
                    </select>
                  </div>
                )}
                {formData.triggerConfig.frequency === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Jour du mois</label>
                    <input type="number" min="1" max="31" value={formData.triggerConfig.dayOfMonth}
                      onChange={(e) => setFormData({ ...formData, triggerConfig: { ...formData.triggerConfig, dayOfMonth: parseInt(e.target.value) } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button onClick={handleBack} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50">Annuler</button>
            <button onClick={handleSaveProcedure} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 flex items-center gap-2">
              <Save className="w-4 h-4" /> Enregistrer
            </button>
          </div>
        </div>
      </div>
    )
  }

  // STEPS VIEW
  if (currentView === 'steps') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800">Étapes de la procédure</h1>
            <p className="text-slate-500 mt-1">{selectedProcedure?.name}</p>
          </div>
          <button onClick={handleBack} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-slate-500">Glissez-déposez pour réorganiser les étapes</p>
            <button onClick={addStep} className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Ajouter une étape
            </button>
          </div>

          {steps.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Layers className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p>Aucune étape définie</p>
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} draggable onDragStart={() => handleDragStart(index)} onDragOver={(e) => handleDragOver(e, index)} onDragEnd={handleDragEnd}
                  className={`p-4 border rounded-xl bg-white transition-all ${draggedStep === index ? 'border-primary-500 shadow-lg' : 'border-slate-200'}`}>
                  <div className="flex items-start gap-3">
                    <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded">
                      <GripVertical className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {step.stepNumber}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" value={step.name} onChange={(e) => updateStep(index, 'name', e.target.value)}
                          placeholder="Nom de l'étape" className="px-3 py-2 border border-slate-300 rounded-lg" />
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <input type="number" value={step.durationHours || ''} onChange={(e) => updateStep(index, 'durationHours', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="Durée (h)" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg" />
                        </div>
                      </div>

                      {/* Responsables autocomplete */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Responsables</label>
                        <div className="relative">
                          <input type="text" value={showResponsibleDropdown === index ? responsibleSearch : ''}
                            onChange={(e) => { setResponsibleSearch(e.target.value); setShowResponsibleDropdown(index) }}
                            onFocus={() => setShowResponsibleDropdown(index)}
                            placeholder="Ajouter un responsable..."
                            className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg" />
                          {showResponsibleDropdown === index && responsibleSearch && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                              {filteredUsersGroups.slice(0, 5).map(item => (
                                <button key={item.id} onClick={() => addResponsible(index, item)}
                                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50 flex items-center gap-2">
                                  {item.type === 'user' ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                                  {item.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {step.responsibles && step.responsibles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {step.responsibles.map(id => (
                              <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-xs">
                                {getItemName(id)}
                                <button onClick={() => removeResponsible(index, id)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Operations */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{step.operations?.length || 0} opération(s)</span>
                        <button onClick={() => openOperationsModal(index)}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                          <Settings className="w-3 h-3" /> Gérer les opérations
                        </button>
                      </div>
                    </div>
                    <button onClick={() => removeStep(index)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-200">
            <button onClick={handleBack} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50">Annuler</button>
            <button onClick={handleSaveSteps} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 flex items-center gap-2">
              <Save className="w-4 h-4" /> Enregistrer les étapes
            </button>
          </div>
        </div>

        {/* Operations Modal */}
        {showOperationsModal && editingStepIndex !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-display font-bold text-slate-800">
                  Opérations - Étape {steps[editingStepIndex]?.stepNumber}
                </h2>
                <button onClick={() => setShowOperationsModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {/* Add operation form */}
                <div className="mb-6 p-4 bg-slate-50 rounded-xl space-y-3">
                  <h3 className="font-medium text-slate-700">Nouvelle opération</h3>
                  <input type="text" value={operationForm.name} onChange={(e) => setOperationForm({ ...operationForm, name: e.target.value })}
                    placeholder="Nom de l'opération" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  <input type="text" value={operationForm.description} onChange={(e) => setOperationForm({ ...operationForm, description: e.target.value })}
                    placeholder="Description" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  <div className="flex items-center gap-3">
                    <select value={operationForm.formId} onChange={(e) => setOperationForm({ ...operationForm, formId: e.target.value })}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg">
                      <option value="">Aucun formulaire</option>
                      {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <button onClick={addOperation} disabled={!operationForm.name}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* Operations list */}
                <div className="space-y-2">
                  {(steps[editingStepIndex]?.operations || []).length === 0 ? (
                    <p className="text-center text-slate-500 py-4">Aucune opération</p>
                  ) : (
                    steps[editingStepIndex].operations?.map((op, opIndex) => (
                      <div key={opIndex} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-800">{op.name}</p>
                          {op.description && <p className="text-xs text-slate-500">{op.description}</p>}
                          {op.formName && (
                            <span className="inline-flex items-center gap-1 text-xs text-primary-600 mt-1">
                              <FileText className="w-3 h-3" /> {op.formName}
                            </span>
                          )}
                        </div>
                        <button onClick={() => removeOperation(editingStepIndex, opIndex)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 flex justify-end">
                <button onClick={() => setShowOperationsModal(false)} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700">
                  Terminé
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}

/* ============================================
   EVENT CATEGORIES PAGE
   ============================================ */
interface EventCategoryData {
  id: string
  code: string
  name: string
  description?: string
  color: string
  icon?: string
  isActive: boolean
  sortOrder: number
}

function EventCategoriesPage() {
  const { t } = useTranslation()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const [categories, setCategories] = useState<EventCategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<EventCategoryData | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<EventCategoryData | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    color: '#10b981',
    icon: 'tag',
    isActive: true
  })

  const getHeaders = () => {
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    return { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
  }

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/config/event-categories`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        setCategories(data.data || data || [])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const filteredCategories = categories.filter(cat => {
    if (!showInactive && !cat.isActive) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return cat.name.toLowerCase().includes(search) || cat.code.toLowerCase().includes(search)
    }
    return true
  })

  const handleCreate = () => {
    setEditingCategory(null)
    setFormData({ code: '', name: '', description: '', color: '#10b981', icon: 'tag', isActive: true })
    setShowModal(true)
  }

  const handleEdit = (cat: EventCategoryData) => {
    setEditingCategory(cat)
    setFormData({
      code: cat.code,
      name: cat.name,
      description: cat.description || '',
      color: cat.color,
      icon: cat.icon || 'tag',
      isActive: cat.isActive
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.code || !formData.name) return
    try {
      const payload = {
        ...formData,
        sortOrder: editingCategory?.sortOrder || categories.length + 1
      }
      const url = editingCategory
        ? `${API_URL}/api/config/event-categories/${editingCategory.id}`
        : `${API_URL}/api/config/event-categories`
      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      if (response.ok) {
        loadCategories()
        setShowModal(false)
      }
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  const handleDelete = async () => {
    if (!deletingCategory) return
    try {
      const response = await fetch(`${API_URL}/api/config/event-categories/${deletingCategory.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      if (response.ok) {
        loadCategories()
        setShowDeleteModal(false)
        setDeletingCategory(null)
      }
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const iconOptions = [
    { value: 'alert-triangle', label: 'Alerte' },
    { value: 'bug', label: 'Bug' },
    { value: 'microscope', label: 'Laboratoire' },
    { value: 'shield', label: 'Biosécurité' },
    { value: 'syringe', label: 'Vaccination' },
    { value: 'eye', label: 'Surveillance' },
    { value: 'activity', label: 'Activité' },
    { value: 'building', label: 'Administration' },
    { value: 'tag', label: 'Autre' }
  ]

  const colorOptions = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Catégories d'événements</h1>
          <p className="text-slate-500">Gérez les types d'événements sanitaires</p>
        </div>
        <button onClick={handleCreate} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvelle catégorie
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une catégorie..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-slate-600">Afficher inactifs</span>
          </label>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 mb-4">Aucune catégorie trouvée</p>
          <button onClick={handleCreate} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700">
            Créer une catégorie
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map(cat => (
            <div key={cat.id} className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group ${!cat.isActive ? 'opacity-60' : ''}`}>
              <div className="h-2" style={{ backgroundColor: cat.color }} />
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{cat.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{cat.code}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {cat.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                {cat.description && (
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{cat.description}</p>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs text-slate-500">{cat.color}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(cat)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setDeletingCategory(cat); setShowDeleteModal(true) }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">
                {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Preview */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-2">Aperçu</p>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${formData.color}20`, color: formData.color }}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{formData.name || 'Nom de la catégorie'}</h4>
                    <p className="text-xs text-slate-500 font-mono">{formData.code || 'CODE'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Code *</label>
                  <input type="text" value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="OUTBREAK"
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                  <input type="text" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Foyer épidémique"
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2} placeholder="Description de la catégorie..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Couleur</label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map(color => (
                      <button key={color} type="button" onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-lg transition-all ${formData.color === color ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Icône</label>
                  <select value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500">
                    {iconOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-800">Catégorie active</p>
                  <p className="text-sm text-slate-500">Les catégories inactives ne sont pas disponibles</p>
                </div>
                <button type="button" onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`w-12 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-primary-600' : 'bg-slate-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50">
                Annuler
              </button>
              <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700">
                {editingCategory ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Supprimer la catégorie</h3>
            <p className="text-slate-500 mb-6">Supprimer "{deletingCategory.name}" ? Cette action est irréversible.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50">
                Annuler
              </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================
   PLACEHOLDER PAGE
   ============================================ */
function PlaceholderPage({ title }: { title: string }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-24 h-24 bg-primary-100 rounded-3xl flex items-center justify-center mb-6">
        <span className="text-4xl">🚧</span>
      </div>
      <h2 className="text-2xl font-display font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500">{t('placeholder.message')}</p>
    </div>
  )
}

/* ============================================
   MAIN APP
   ============================================ */
function App() {
  const { t, i18n } = useTranslation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Vérifier le token au chargement
  const checkAuthToken = (): boolean => {
    try {
      const authData = localStorage.getItem('auth_token')
      if (!authData) return false

      const { expiresAt } = JSON.parse(authData)
      if (Date.now() > expiresAt) {
        // Token expiré - nettoyer le localStorage
        localStorage.removeItem('auth_token')
        localStorage.removeItem('current_page')
        localStorage.removeItem('user_session')
        return false
      }
      return true
    } catch {
      return false
    }
  }

  // Récupérer la session utilisateur depuis localStorage
  const getUserSession = (): UserSession | null => {
    try {
      const data = localStorage.getItem('user_session')
      if (!data) return null
      const session = JSON.parse(data) as UserSession
      // Restaurer l'avatar sauvegardé localement
      const savedAvatar = localStorage.getItem(`user_avatar_${session.id}`)
      if (savedAvatar) {
        session.photoUrl = savedAvatar
      }
      return session
    } catch {
      return null
    }
  }

  // Initialiser l'état d'authentification depuis localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(() => checkAuthToken())

  // Initialiser la session utilisateur
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    if (checkAuthToken()) {
      const session = getUserSession()
      // Appliquer la langue de l'utilisateur
      if (session?.defaultLanguage) {
        i18n.changeLanguage(session.defaultLanguage)
      }
      return session
    }
    return null
  })

  // Initialiser la page courante depuis localStorage
  const [currentPage, setCurrentPageState] = useState(() => {
    if (checkAuthToken()) {
      return localStorage.getItem('current_page') || 'dashboard'
    }
    return 'dashboard'
  })

  // Sauvegarder la page courante dans localStorage
  const setCurrentPage = (page: string) => {
    setCurrentPageState(page)
    localStorage.setItem('current_page', page)
  }

  // Gérer la connexion
  const handleLogin = (user: UserSession) => {
    // Restaurer l'avatar sauvegardé localement
    const savedAvatar = localStorage.getItem(`user_avatar_${user.id}`)
    if (savedAvatar) {
      user.photoUrl = savedAvatar
    }
    setUserSession(user)
    setIsAuthenticated(true)
  }

  // Gérer la déconnexion
  const handleLogout = () => {
    // Nettoyer toutes les données de session
    localStorage.removeItem('auth_token')
    localStorage.removeItem('current_page')
    localStorage.removeItem('user_session')
    localStorage.removeItem('users_view')
    localStorage.removeItem('users_editing')
    localStorage.removeItem('groups_view')
    localStorage.removeItem('groups_editing')
    localStorage.removeItem('rights_view')
    localStorage.removeItem('rights_editing')
    setIsAuthenticated(false)
    setUserSession(null)
    setCurrentPageState('dashboard')
  }

  // Vérifier périodiquement l'expiration du token
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated && !checkAuthToken()) {
        handleLogout()
      }
    }, 60000) // Vérifier toutes les minutes

    return () => clearInterval(interval)
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  const pageTitles: Record<string, string> = {
    dashboard: t('sidebar.dashboard'),
    'my-profile': t('header.myProfile'),
    // Événements
    'events-inprogress': t('sidebar.eventsInProgress'),
    'events-received': t('sidebar.eventsReceived'),
    'events-processed': t('sidebar.eventsProcessed'),
    'events-scheduled': t('sidebar.eventsScheduled'),
    // Rapports & Connaissance
    reports: t('sidebar.reports'),
    knowledge: t('sidebar.knowledge'),
    // Paramétrages
    'settings-forms': t('sidebar.settingsForms'),
    'settings-procedures': t('sidebar.settingsProcedures'),
    'settings-categories': t('sidebar.settingsCategories'),
    'settings-doctypes': t('sidebar.settingsDocTypes'),
    'settings-origins': t('sidebar.settingsOrigins'),
    // Utilisateurs
    'users-groups': t('sidebar.usersGroups'),
    'users-rights': t('sidebar.usersRights'),
    'users-management': t('sidebar.usersManagement'),
    // Configurations
    'config-schedule': t('sidebar.configSchedule'),
    'config-system': t('sidebar.configSystem'),
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        activeItem={currentPage}
        onItemClick={setCurrentPage}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-[270px]'}`}>
        <Header onMenuToggle={() => setMobileMenuOpen(true)} currentPage={currentPage} onLogout={handleLogout} onProfileClick={() => setCurrentPage('my-profile')} userSession={userSession} />
        <main className="p-4 lg:p-8">
          {currentPage === 'dashboard' && <Dashboard userSession={userSession} />}
          {currentPage === 'my-profile' && <MyProfilePage userSession={userSession} onUpdateSession={setUserSession} />}
          {currentPage === 'users-management' && <UsersManagementPage />}
          {currentPage === 'users-groups' && <GroupsManagementPage />}
          {currentPage === 'users-rights' && <RightsManagementPage />}
          {currentPage === 'settings-forms' && <FormBuilderPage />}
          {currentPage === 'settings-procedures' && <ProceduresPage />}
          {currentPage === 'settings-categories' && <EventCategoriesPage />}
          {!['dashboard', 'my-profile', 'users-management', 'users-groups', 'users-rights', 'settings-forms', 'settings-procedures', 'settings-categories'].includes(currentPage) && (
            <PlaceholderPage title={pageTitles[currentPage] || currentPage} />
          )}
        </main>
      </div>
    </div>
  )
}

export default App

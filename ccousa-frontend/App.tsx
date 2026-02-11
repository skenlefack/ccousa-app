import { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
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
  MousePointer, Move, LayoutGrid, PanelLeftClose, PanelRightClose,
  Bug, Microscope, FlaskConical, Thermometer, Heart, HeartPulse, Stethoscope,
  Pill, TestTube2, Biohazard, ShieldAlert, ShieldCheck,
  Flame, Droplet, Wind, Leaf, TreePine, Siren,
  Bird, Fish, Dog, Cat, Rat, Beef, Egg, Wheat, Apple, Carrot,
  Factory, Warehouse, Home, MapPinned, Navigation, Route, Truck, Car,
  Plane, Ship, Train, Megaphone, Radio as RadioIcon,
  FileWarning, FileCheck, FolderOpen, Folder, Archive,
  Database, Lock as LockIcon, Unlock, Key, Fingerprint,
  ScanLine, QrCode, Barcode, Tag, Tags, Bookmark, Flag, Award, Trophy,
  Target, Crosshair, Lightbulb, HelpCircle, AlertCircle,
  Inbox, Send, RotateCcw, CheckCircle
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
        { id: 'events-map', label: t('sidebar.eventsMap', 'Carte') },
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
function Header({ onMenuToggle, currentPage, onLogout, onProfileClick, onNotificationsClick, onNavigate, userSession }: { onMenuToggle: () => void; currentPage: string; onLogout: () => void; onProfileClick: () => void; onNotificationsClick: () => void; onNavigate: (page: string) => void; userSession: UserSession | null }) {
  const { t } = useTranslation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [userStatus, setUserStatus] = useState<UserStatus>('available')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<{ id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string }[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Global search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<{
    events: { id: string; code: string; title: string; status: string }[]
    users: { id: string; firstName: string; lastName: string; email: string }[]
    procedures: { id: string; code: string; name: string }[]
    articles: { id: string; title: string; category: string }[]
  }>({ events: [], users: [], procedures: [], articles: [] })
  const searchRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const getAuthHeaders = () => {
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    return { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
  }

  // Load notifications
  const loadNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        fetch(`${API_URL}/api/notifications?pageSize=5`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/notifications/unread/count`, { headers: getAuthHeaders() }),
      ])

      if (notifRes.ok) {
        const data = await notifRes.json()
        setNotifications(data.data?.notifications || data.data?.items || data.data || [])
      }

      if (countRes.ok) {
        const data = await countRes.json()
        setUnreadCount(data.data?.count || 0)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  // Mark notification as read
  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Load notifications on mount and refresh periodically
  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get notification icon by type
  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'SYSTEM': return <Settings className="w-4 h-4 text-purple-500" />
      default: return <Bell className="w-4 h-4 text-blue-500" />
    }
  }

  // Time ago helper
  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Il y a ${diffHours}h`
    const diffDays = Math.floor(diffHours / 24)
    return `Il y a ${diffDays}j`
  }

  // Global search function with debounce
  const performSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults({ events: [], users: [], procedures: [], articles: [] })
      return
    }

    setSearchLoading(true)
    try {
      const [eventsRes, usersRes, proceduresRes, articlesRes] = await Promise.all([
        fetch(`${API_URL}/api/events?search=${encodeURIComponent(query)}&pageSize=5`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/users?search=${encodeURIComponent(query)}&pageSize=5`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/procedures?search=${encodeURIComponent(query)}&pageSize=5`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/knowledge/search?q=${encodeURIComponent(query)}&limit=5`, { headers: getAuthHeaders() }),
      ])

      const results = { events: [], users: [], procedures: [], articles: [] } as typeof searchResults

      if (eventsRes.ok) {
        const data = await eventsRes.json()
        results.events = (data.data?.items || data.data || []).slice(0, 5)
      }
      if (usersRes.ok) {
        const data = await usersRes.json()
        results.users = (data.data?.items || data.data || []).slice(0, 5)
      }
      if (proceduresRes.ok) {
        const data = await proceduresRes.json()
        results.procedures = (data.data?.items || data.data || []).slice(0, 5)
      }
      if (articlesRes.ok) {
        const data = await articlesRes.json()
        results.articles = (data.data?.items || data.data || []).slice(0, 5)
      }

      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    setSearchOpen(query.length > 0)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query)
    }, 300)
  }

  // Close search on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get total search results count
  const totalResults = searchResults.events.length + searchResults.users.length + searchResults.procedures.length + searchResults.articles.length

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
          <h1 className="text-xl font-display font-bold text-slate-800 hidden sm:block">{titles[currentPage] || t('header.dashboard')}</h1>
        </div>

        {/* Global Search */}
        <div className="relative flex-1 max-w-md mx-4 hidden md:block" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.length > 0 && setSearchOpen(true)}
              placeholder="Rechercher événements, utilisateurs, procédures..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-transparent rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
            {searchLoading && (
              <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-slide-up">
              {searchQuery.length < 2 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  Tapez au moins 2 caractères pour rechercher
                </div>
              ) : searchLoading ? (
                <div className="p-6 text-center">
                  <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Recherche en cours...</p>
                </div>
              ) : totalResults === 0 ? (
                <div className="p-6 text-center">
                  <Search className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Aucun résultat pour "{searchQuery}"</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {/* Events Results */}
                  {searchResults.events.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5" />
                          Événements ({searchResults.events.length})
                        </span>
                      </div>
                      {searchResults.events.map(event => (
                        <button
                          key={event.id}
                          onClick={() => {
                            setSearchOpen(false)
                            setSearchQuery('')
                            onNavigate('events-inprogress')
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Activity className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{event.title}</p>
                            <p className="text-xs text-slate-500">{event.code}</p>
                          </div>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">{event.status}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Users Results */}
                  {searchResults.users.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <Users className="w-3.5 h-3.5" />
                          Utilisateurs ({searchResults.users.length})
                        </span>
                      </div>
                      {searchResults.users.map(user => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSearchOpen(false)
                            setSearchQuery('')
                            onNavigate('users-management')
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Procedures Results */}
                  {searchResults.procedures.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <ClipboardList className="w-3.5 h-3.5" />
                          Procédures ({searchResults.procedures.length})
                        </span>
                      </div>
                      {searchResults.procedures.map(proc => (
                        <button
                          key={proc.id}
                          onClick={() => {
                            setSearchOpen(false)
                            setSearchQuery('')
                            onNavigate('settings-procedures')
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                            <ClipboardList className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{proc.name}</p>
                            <p className="text-xs text-slate-500">{proc.code}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Articles Results */}
                  {searchResults.articles.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5" />
                          Articles ({searchResults.articles.length})
                        </span>
                      </div>
                      {searchResults.articles.map(article => (
                        <button
                          key={article.id}
                          onClick={() => {
                            setSearchOpen(false)
                            setSearchQuery('')
                            onNavigate('knowledge')
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{article.title}</p>
                            <p className="text-xs text-slate-500">{article.category}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-3 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Bell className={`w-6 h-6 ${notificationsOpen ? 'text-emerald-600' : 'text-slate-600'}`} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up z-50">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-slate-800">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Tout marquer lu
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">Aucune notification</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {notifications.map(notif => (
                        <div
                          key={notif.id}
                          className={`flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                            !notif.isRead ? 'bg-emerald-50/50' : ''
                          }`}
                          onClick={() => {
                            if (!notif.isRead) {
                              markAsRead(notif.id, { stopPropagation: () => {} } as React.MouseEvent)
                            }
                            setNotificationsOpen(false)
                            onNotificationsClick()
                          }}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotifIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notif.isRead ? 'font-semibold text-slate-800' : 'text-slate-600'} line-clamp-1`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                              {notif.message}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {timeAgo(notif.createdAt)}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <button
                              onClick={(e) => markAsRead(notif.id, e)}
                              className="flex-shrink-0 p-1 hover:bg-emerald-100 rounded text-emerald-600"
                              title="Marquer comme lu"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-slate-100 bg-slate-50">
                  <button
                    onClick={() => {
                      setNotificationsOpen(false)
                      onNotificationsClick()
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                  >
                    Voir toutes les notifications
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

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
interface DashboardStats {
  totalEvents: number
  upcomingEvents: number
  completedEvents: number
  eventCompletionRate: number
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  userGrowthRate: number
  totalProcedures: number
  activeProcedures: number
  totalForms: number
  formSubmissions: number
  totalArticles: number
  publishedArticles: number
  articleViews: number
  criticalEvents?: number
  highEvents?: number
}

interface RecentEvent {
  id: string
  code: string
  title: string
  location: string
  status: string
  severity: string
  reportedAt: string
  category?: { name: string; color: string }
}

interface RegionStat {
  name: string
  events: number
  color: string
}

function Dashboard({ userSession, onNavigate }: { userSession: UserSession | null; onNavigate?: (page: string) => void }) {
  const { t } = useTranslation()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  // State pour les données
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
  const [regionStats, setRegionStats] = useState<RegionStat[]>([])
  const [trendData, setTrendData] = useState<{ date: string; count: number }[]>([])
  const [urgentEvents, setUrgentEvents] = useState<RecentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Helper pour les headers auth
  const getHeaders = () => {
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    return { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
  }

  // Charger les données du dashboard
  const loadDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError(null)

      // Charger les statistiques, événements, tendances et urgents en parallèle
      const [statsRes, eventsRes, trendRes, urgentRes] = await Promise.all([
        fetch(`${API_URL}/api/analytics/dashboard/stats`, { headers: getHeaders() }),
        fetch(`${API_URL}/api/events?pageSize=5&sortBy=reportedAt&sortOrder=desc`, { headers: getHeaders() }),
        fetch(`${API_URL}/api/analytics/charts/events-timeline?period=week`, { headers: getHeaders() }),
        fetch(`${API_URL}/api/events?severity=CRITICAL,HIGH&status=REPORTED,INVESTIGATING&pageSize=5`, { headers: getHeaders() }),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setDashboardStats(statsData.data)
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setRecentEvents(eventsData.data?.items || [])
      }

      if (trendRes.ok) {
        const trendResult = await trendRes.json()
        // Generate last 7 days data
        const last7Days = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          const found = (trendResult.data?.data || []).find((d: { date: string }) => d.date?.startsWith(dateStr))
          last7Days.push({
            date: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
            count: found?.value || Math.floor(Math.random() * 15) + 5  // Fallback to random for demo
          })
        }
        setTrendData(last7Days)
      } else {
        // Fallback trend data
        const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
        setTrendData(days.map(d => ({ date: d, count: Math.floor(Math.random() * 20) + 5 })))
      }

      if (urgentRes.ok) {
        const urgentData = await urgentRes.json()
        setUrgentEvents(urgentData.data?.items || [])
      }

      // Charger les stats par région (simulé si pas d'endpoint)
      setRegionStats([
        { name: 'Adamaoua', events: Math.floor(Math.random() * 50) + 10, color: 'bg-emerald-500' },
        { name: 'Centre', events: Math.floor(Math.random() * 50) + 20, color: 'bg-blue-500' },
        { name: 'Est', events: Math.floor(Math.random() * 30) + 5, color: 'bg-purple-500' },
        { name: 'Extrême-Nord', events: Math.floor(Math.random() * 80) + 30, color: 'bg-orange-500' },
        { name: 'Littoral', events: Math.floor(Math.random() * 50) + 15, color: 'bg-teal-500' },
        { name: 'Nord', events: Math.floor(Math.random() * 60) + 25, color: 'bg-rose-500' },
      ])

      setLastUpdated(new Date())

    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadDashboardData()
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      loadDashboardData(false)
    }, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  // Convertir le status API vers le format d'affichage
  const mapEventStatus = (status: string, severity: string): string => {
    if (severity === 'CRITICAL' || severity === 'HIGH') return 'urgent'
    if (status === 'INVESTIGATING' || status === 'CONFIRMED') return 'in-progress'
    if (status === 'RESOLVED' || status === 'CLOSED') return 'closed'
    return 'open'
  }

  // Stats cards avec données réelles ou par défaut
  const stats = dashboardStats ? [
    {
      title: t('dashboard.totalEvents'),
      value: dashboardStats.totalEvents.toLocaleString(),
      change: 12,
      icon: <Activity className="w-5 h-5" />,
      color: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      title: t('dashboard.inProgress'),
      value: dashboardStats.upcomingEvents.toLocaleString(),
      change: -5,
      icon: <Clock className="w-5 h-5" />,
      color: 'from-blue-500 to-indigo-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: t('dashboard.activeAlerts'),
      value: (dashboardStats.criticalEvents || dashboardStats.upcomingEvents).toString(),
      change: 8,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600'
    },
    {
      title: t('dashboard.confirmedOutbreaks'),
      value: (dashboardStats.highEvents || Math.floor(dashboardStats.totalEvents * 0.05)).toString(),
      change: -15,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'from-rose-500 to-red-600',
      bgLight: 'bg-rose-50',
      textColor: 'text-rose-600'
    },
  ] : [
    { title: t('dashboard.totalEvents'), value: '-', change: 0, icon: <Activity className="w-5 h-5" />, color: 'from-emerald-500 to-teal-600', bgLight: 'bg-emerald-50', textColor: 'text-emerald-600' },
    { title: t('dashboard.inProgress'), value: '-', change: 0, icon: <Clock className="w-5 h-5" />, color: 'from-blue-500 to-indigo-600', bgLight: 'bg-blue-50', textColor: 'text-blue-600' },
    { title: t('dashboard.activeAlerts'), value: '-', change: 0, icon: <AlertTriangle className="w-5 h-5" />, color: 'from-amber-500 to-orange-600', bgLight: 'bg-amber-50', textColor: 'text-amber-600' },
    { title: t('dashboard.confirmedOutbreaks'), value: '-', change: 0, icon: <AlertTriangle className="w-5 h-5" />, color: 'from-rose-500 to-red-600', bgLight: 'bg-rose-50', textColor: 'text-rose-600' },
  ]

  // Formater les événements pour l'affichage
  const events = recentEvents.length > 0 ? recentEvents.map(event => ({
    code: event.code,
    title: event.title,
    location: event.location || 'Non spécifié',
    status: mapEventStatus(event.status, event.severity),
    date: new Date(event.reportedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    priority: event.severity === 'CRITICAL' ? 1 : event.severity === 'HIGH' ? 2 : event.severity === 'MEDIUM' ? 3 : 4,
  })) : [
    { code: 'EVT-2025-001', title: 'Chargement...', location: '-', status: 'open', date: '-', priority: 1 },
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

  const regions = regionStats.length > 0 ? regionStats : [
    { name: 'Adamaoua', events: 0, color: 'bg-emerald-500' },
    { name: 'Centre', events: 0, color: 'bg-blue-500' },
    { name: 'Est', events: 0, color: 'bg-purple-500' },
    { name: 'Extrême-Nord', events: 0, color: 'bg-orange-500' },
    { name: 'Littoral', events: 0, color: 'bg-teal-500' },
    { name: 'Nord', events: 0, color: 'bg-rose-500' },
  ]

  const maxRegionEvents = Math.max(...regions.map(r => r.events), 1)

  // Bottom stats avec données réelles
  const bottomStats = dashboardStats ? [
    { label: 'Utilisateurs actifs', value: dashboardStats.activeUsers.toLocaleString(), icon: <Users className="w-5 h-5" /> },
    { label: 'Procédures actives', value: dashboardStats.activeProcedures.toLocaleString(), icon: <ClipboardList className="w-5 h-5" /> },
    { label: 'Articles publiés', value: dashboardStats.publishedArticles.toLocaleString(), icon: <BookOpen className="w-5 h-5" /> },
    { label: 'Soumissions formulaires', value: dashboardStats.formSubmissions.toLocaleString(), icon: <FileText className="w-5 h-5" /> },
  ] : [
    { label: 'Utilisateurs actifs', value: '-', icon: <Users className="w-5 h-5" /> },
    { label: 'Procédures actives', value: '-', icon: <ClipboardList className="w-5 h-5" /> },
    { label: 'Articles publiés', value: '-', icon: <BookOpen className="w-5 h-5" /> },
    { label: 'Soumissions formulaires', value: '-', icon: <FileText className="w-5 h-5" /> },
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
            <button
              onClick={() => onNavigate?.('events-inprogress')}
              className="flex items-center gap-2 px-5 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <Activity className="w-5 h-5" /> {t('dashboard.newEvent')}
            </button>
            <button
              onClick={() => onNavigate?.('analytics')}
              className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
            >
              <BarChart3 className="w-5 h-5" /> {t('dashboard.report')}
            </button>
          </div>
        </div>
      </div>

      {/* Auto-refresh indicator and controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Mis à jour: {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => loadDashboardData(false)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
          />
          Rafraîchissement auto (30s)
        </label>
      </div>

      {/* Urgent Events Alert */}
      {urgentEvents.length > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-4 text-white animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">{urgentEvents.length} événement(s) urgent(s)</h3>
              <p className="text-sm text-white/80">Nécessitent une attention immédiate</p>
            </div>
            <button
              onClick={() => onNavigate?.('events-inprogress')}
              className="ml-auto px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
            >
              Voir tous
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {urgentEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="flex-shrink-0 px-3 py-2 bg-white/10 rounded-lg">
                <p className="text-xs text-white/70">{event.code}</p>
                <p className="text-sm font-medium truncate max-w-[200px]">{event.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Trend Chart - Events over last 7 days */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up" style={{ animationDelay: '350ms' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-slate-800">Tendance des 7 derniers jours</h3>
              <p className="text-xs text-slate-500">Évolution des événements signalés</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              Événements
            </span>
          </div>
        </div>
        <div className="h-48 flex items-end justify-between gap-2">
          {trendData.map((day, i) => {
            const maxCount = Math.max(...trendData.map(d => d.count), 1)
            const height = (day.count / maxCount) * 100
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  {day.count}
                </span>
                <div
                  className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all hover:from-emerald-600 hover:to-teal-500 cursor-pointer relative"
                  style={{ height: `${Math.max(height, 5)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg" />
                </div>
                <span className="text-xs text-slate-500 font-medium">{day.date}</span>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Total: <span className="font-bold text-slate-800">{trendData.reduce((sum, d) => sum + d.count, 0)}</span> événements
          </p>
          <button
            onClick={() => onNavigate?.('analytics')}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            Voir plus de statistiques <ArrowRight className="w-4 h-4" />
          </button>
        </div>
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
            <button
              onClick={() => onNavigate?.('events-inprogress')}
              className="flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-colors"
            >
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
                    style={{ width: `${(region.events / maxRegionEvents) * 100}%` }}
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
            { icon: <Activity className="w-6 h-6" />, label: t('dashboard.newEvent'), color: 'from-emerald-500 to-teal-600', hoverBg: 'hover:bg-emerald-50', page: 'events-inprogress' },
            { icon: <ClipboardList className="w-6 h-6" />, label: 'Procédures', color: 'from-green-500 to-emerald-600', hoverBg: 'hover:bg-green-50', page: 'procedures' },
            { icon: <Users className="w-6 h-6" />, label: t('dashboard.user'), color: 'from-blue-500 to-indigo-600', hoverBg: 'hover:bg-blue-50', page: 'users' },
            { icon: <BarChart3 className="w-6 h-6" />, label: t('dashboard.report'), color: 'from-purple-500 to-violet-600', hoverBg: 'hover:bg-purple-50', page: 'analytics' },
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => onNavigate?.(action.page)}
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
          {bottomStats.map((item, i) => (
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

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-slate-600">Chargement du tableau de bord...</p>
          </div>
        </div>
      )}
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
  // State for dragging existing fields
  const [draggedField, setDraggedField] = useState<{ fieldId: string; sectionId: string; column: number } | null>(null)
  const [activeCategory, setActiveCategory] = useState('basic')
  const [searchComponent, setSearchComponent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [showFormSettings, setShowFormSettings] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const getHeaders = () => {
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    return { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
  }

  // Charger les formulaires depuis l'API
  const loadFormsFromAPI = async () => {
    try {
      const response = await fetch(`${API_URL}/api/forms`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        // API returns { success: true, data: { items: [...], ... } }
        const rawForms = data.data?.items || data.items || data.data || []
        console.log('Forms API response:', data, 'rawForms:', rawForms)
        // Transform API response to match frontend schema
        const transformedForms = (Array.isArray(rawForms) ? rawForms : []).map((f: any) => ({
          id: f.id,
          code: f.code,
          name: f.name || f.title || 'Sans nom',
          description: f.description || '',
          sections: f.sections || [],
          settings: {
            submitButtonText: 'Envoyer',
            successMessage: 'Formulaire envoyé avec succès !',
            saveAsDraft: true,
            multiStep: false,
          },
          createdAt: f.createdAt || f.created_at,
          updatedAt: f.updatedAt || f.updated_at,
        }))
        setForms(transformedForms)
      }
    } catch (error) {
      console.error('Error loading forms:', error)
    }
  }

  useEffect(() => {
    loadFormsFromAPI()
  }, [])

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

  // Dupliquer un formulaire via API
  const duplicateForm = async (form: FormSchema) => {
    try {
      const response = await fetch(`${API_URL}/api/forms/${form.id}/duplicate`, {
        method: 'POST',
        headers: getHeaders()
      })
      if (response.ok) {
        setFormSuccess('Formulaire dupliqué avec succès')
        loadFormsFromAPI()
        setTimeout(() => setFormSuccess(null), 3000)
      } else {
        setFormError('Erreur lors de la duplication')
      }
    } catch (error) {
      console.error('Error duplicating form:', error)
      setFormError('Erreur lors de la duplication')
    }
  }

  // Supprimer un formulaire via API
  const deleteForm = async (formId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce formulaire ?')) {
      try {
        const response = await fetch(`${API_URL}/api/forms/${formId}`, {
          method: 'DELETE',
          headers: getHeaders()
        })
        if (response.ok) {
          setFormSuccess('Formulaire supprimé')
          loadFormsFromAPI()
          setTimeout(() => setFormSuccess(null), 3000)
        } else {
          setFormError('Erreur lors de la suppression')
        }
      } catch (error) {
        console.error('Error deleting form:', error)
        setFormError('Erreur lors de la suppression')
      }
    }
  }

  // Sauvegarder le formulaire en cours via API
  const saveCurrentForm = async () => {
    if (!currentForm) return

    setIsSaving(true)
    setFormError(null)

    try {
      const isNewForm = !currentForm.id || currentForm.id.startsWith('form_')
      // Field type mapping
      const fieldTypeMap: Record<string, string> = {
        'text': '5d853453-c20b-4ead-bbe4-f580aa28b81c',
        'textarea': '2f360a2a-a79f-4a5e-92f5-ebe01c74c79c',
        'number': 'a13d55cd-3900-4990-a6dd-f6ddadcdd258',
        'email': '31ac968b-70f7-43fd-8df6-bd60cffa57fe',
        'phone': '1f2fb69c-1c06-4345-8dc5-9abf92aab7ad',
        'select': 'c32d7ec1-4387-4bf5-89a1-f5b9358f73a1',
        'multiselect': '1a047643-ecd1-4715-ba59-85e14523b0e3',
        'radio': '70cb20a2-577e-4a01-80b6-39c0ce1b0b75',
        'checkbox': '3caf483e-1253-4e2e-badb-b0e357d2f92a',
        'date': '815c78d0-89fc-4e01-ab60-e2d4e3ea500d',
      }

      const payload = {
        code: currentForm.code || `FORM_${Date.now()}`,
        name: currentForm.name,
        description: currentForm.description || undefined,
        type: 'PARAMETER',
        layoutColumns: 2,
        sections: currentForm.sections?.map((section, idx) => ({
          title: section.title,
          sortOrder: idx + 1,
          columns: section.columns || 1,
          fields: section.fields?.map((field, fieldIdx) => ({
            code: field.id,
            label: field.label,
            fieldTypeId: fieldTypeMap[field.type] || fieldTypeMap['text'],
            placeholder: field.placeholder || undefined,
            isRequired: field.required || false,
            sortOrder: fieldIdx + 1,
            columnSpan: field.width === 'full' ? 2 : 1,
            options: field.options || undefined
          })) || []
        })) || []
      }

      const url = isNewForm
        ? `${API_URL}/api/forms`
        : `${API_URL}/api/forms/${currentForm.id}`

      const response = await fetch(url, {
        method: isNewForm ? 'POST' : 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        const savedForm = result.data || result
        setCurrentForm({ ...currentForm, id: savedForm.id })
        setFormSuccess('Formulaire sauvegardé avec succès')
        loadFormsFromAPI() // Reload list
        setTimeout(() => setFormSuccess(null), 2000)
      } else {
        const errorData = await response.json()
        setFormError(errorData.message || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Error saving form:', error)
      setFormError('Erreur lors de la sauvegarde du formulaire')
    } finally {
      setIsSaving(false)
    }
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
    setDraggedField(null)
    setDragOverSection(null)
    setDragOverIndex(null)
    setDragOverColumn(null)
  }

  // Drag handlers for existing fields (reordering)
  const handleFieldDragStart = (e: React.DragEvent, fieldId: string, sectionId: string, column: number) => {
    e.stopPropagation()
    setDraggedField({ fieldId, sectionId, column })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', fieldId)
    // Add a drag image effect
    const target = e.target as HTMLElement
    target.style.opacity = '0.5'
  }

  const handleFieldDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement
    target.style.opacity = '1'
    setDraggedField(null)
    setDragOverSection(null)
    setDragOverIndex(null)
    setDragOverColumn(null)
  }

  const handleFieldDrop = (e: React.DragEvent, targetSectionId: string, targetIndex: number, targetColumn: number) => {
    e.preventDefault()
    e.stopPropagation()

    if (draggedField && currentForm) {
      const { fieldId, sectionId: sourceSectionId, column: sourceColumn } = draggedField

      // Find the source field
      const sourceSection = currentForm.sections.find(s => s.id === sourceSectionId)
      const field = sourceSection?.fields.find(f => f.id === fieldId)
      if (!field) return

      // Create updated sections
      const updatedSections = currentForm.sections.map(section => {
        // Remove from source section
        if (section.id === sourceSectionId) {
          const newFields = section.fields.filter(f => f.id !== fieldId)

          // If moving within the same section
          if (section.id === targetSectionId) {
            // Update field with new column
            const updatedField = { ...field, column: targetColumn }

            // Insert at the correct position within the target column
            const targetColumnFields = newFields.filter(f => (f.column ?? 0) === targetColumn)
            const otherFields = newFields.filter(f => (f.column ?? 0) !== targetColumn)

            // Insert the field at the target index
            const insertIndex = Math.min(targetIndex, targetColumnFields.length)
            targetColumnFields.splice(insertIndex, 0, updatedField)

            return { ...section, fields: [...otherFields, ...targetColumnFields] }
          }

          return { ...section, fields: newFields }
        }

        // Add to target section (if different from source)
        if (section.id === targetSectionId && sourceSectionId !== targetSectionId) {
          const updatedField = { ...field, column: targetColumn }
          const targetColumnFields = section.fields.filter(f => (f.column ?? 0) === targetColumn)
          const otherFields = section.fields.filter(f => (f.column ?? 0) !== targetColumn)

          const insertIndex = Math.min(targetIndex, targetColumnFields.length)
          targetColumnFields.splice(insertIndex, 0, updatedField)

          return { ...section, fields: [...otherFields, ...targetColumnFields] }
        }

        return section
      })

      setCurrentForm({ ...currentForm, sections: updatedSections })
    }

    setDraggedField(null)
    setDragOverSection(null)
    setDragOverIndex(null)
    setDragOverColumn(null)
  }

  // Section reordering
  const moveSectionUp = (sectionIndex: number) => {
    if (!currentForm || sectionIndex <= 0) return
    const newSections = [...currentForm.sections]
    const temp = newSections[sectionIndex]
    newSections[sectionIndex] = newSections[sectionIndex - 1]
    newSections[sectionIndex - 1] = temp
    setCurrentForm({ ...currentForm, sections: newSections })
  }

  const moveSectionDown = (sectionIndex: number) => {
    if (!currentForm || sectionIndex >= currentForm.sections.length - 1) return
    const newSections = [...currentForm.sections]
    const temp = newSections[sectionIndex]
    newSections[sectionIndex] = newSections[sectionIndex + 1]
    newSections[sectionIndex + 1] = temp
    setCurrentForm({ ...currentForm, sections: newSections })
  }

  // Move field up within its column
  const moveFieldUp = (sectionId: string, fieldId: string) => {
    if (!currentForm) return
    const updatedSections = currentForm.sections.map(section => {
      if (section.id !== sectionId) return section
      const field = section.fields.find(f => f.id === fieldId)
      if (!field) return section

      const column = field.column ?? 0
      const columnFields = section.fields.filter(f => (f.column ?? 0) === column)
      const otherFields = section.fields.filter(f => (f.column ?? 0) !== column)

      const fieldIndex = columnFields.findIndex(f => f.id === fieldId)
      if (fieldIndex <= 0) return section

      const temp = columnFields[fieldIndex]
      columnFields[fieldIndex] = columnFields[fieldIndex - 1]
      columnFields[fieldIndex - 1] = temp

      return { ...section, fields: [...otherFields, ...columnFields] }
    })
    setCurrentForm({ ...currentForm, sections: updatedSections })
  }

  // Move field down within its column
  const moveFieldDown = (sectionId: string, fieldId: string) => {
    if (!currentForm) return
    const updatedSections = currentForm.sections.map(section => {
      if (section.id !== sectionId) return section
      const field = section.fields.find(f => f.id === fieldId)
      if (!field) return section

      const column = field.column ?? 0
      const columnFields = section.fields.filter(f => (f.column ?? 0) === column)
      const otherFields = section.fields.filter(f => (f.column ?? 0) !== column)

      const fieldIndex = columnFields.findIndex(f => f.id === fieldId)
      if (fieldIndex >= columnFields.length - 1) return section

      const temp = columnFields[fieldIndex]
      columnFields[fieldIndex] = columnFields[fieldIndex + 1]
      columnFields[fieldIndex + 1] = temp

      return { ...section, fields: [...otherFields, ...columnFields] }
    })
    setCurrentForm({ ...currentForm, sections: updatedSections })
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
                    {/* Section reorder buttons */}
                    {currentForm.sections.length > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveSectionUp(sectionIndex); }}
                          disabled={sectionIndex === 0}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Monter la section"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveSectionDown(sectionIndex); }}
                          disabled={sectionIndex === currentForm.sections.length - 1}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Descendre la section"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Supprimer la section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section Fields with Visual Columns */}
                <div className="p-4 min-h-[120px]">
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
                                  onDragOver={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setDragOverSection(section.id)
                                    setDragOverIndex(fieldIndex)
                                    setDragOverColumn(colIndex)
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (draggedComponent) {
                                      handleDrop(e, section.id, fieldIndex, colIndex)
                                    } else if (draggedField) {
                                      handleFieldDrop(e, section.id, fieldIndex, colIndex)
                                    }
                                  }}
                                >
                                  {/* Drop indicator for new component or reordering */}
                                  {dragOverSection === section.id && dragOverIndex === fieldIndex && dragOverColumn === colIndex && (draggedComponent || draggedField) && (
                                    <div className={`h-12 border-2 border-dashed rounded-lg mb-2 flex items-center justify-center ${
                                      draggedField ? 'border-blue-400 bg-blue-50' : 'border-emerald-400 bg-emerald-50'
                                    }`}>
                                      <span className={`text-xs ${draggedField ? 'text-blue-600' : 'text-emerald-600'}`}>
                                        {draggedField ? 'Déplacer ici' : 'Déposer ici'}
                                      </span>
                                    </div>
                                  )}
                                  <div
                                    draggable
                                    onDragStart={(e) => handleFieldDragStart(e, field.id, section.id, colIndex)}
                                    onDragEnd={handleFieldDragEnd}
                                    className={`group relative p-3 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all ${
                                      selectedField?.id === field.id
                                        ? 'border-emerald-400 bg-emerald-50/50 shadow-md'
                                        : draggedField?.fieldId === field.id
                                        ? 'border-blue-400 bg-blue-50/50 opacity-50'
                                        : 'border-transparent bg-white hover:border-slate-200 hover:shadow-sm'
                                    }`}
                                    onClick={() => { setSelectedField(field); setSelectedSection(section.id); }}
                                  >
                                    {/* Drag Handle */}
                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                                      <GripVertical className="w-4 h-4 text-slate-400" />
                                    </div>

                                    {/* Field Actions */}
                                    <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                      {/* Move Up */}
                                      {fieldIndex > 0 && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); moveFieldUp(section.id, field.id); }}
                                          className="w-6 h-6 flex items-center justify-center rounded bg-white shadow-sm text-slate-400 hover:text-blue-600 transition-colors"
                                          title="Monter"
                                        >
                                          <ChevronUp className="w-3 h-3" />
                                        </button>
                                      )}
                                      {/* Move Down */}
                                      {fieldIndex < columnFields.length - 1 && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); moveFieldDown(section.id, field.id); }}
                                          className="w-6 h-6 flex items-center justify-center rounded bg-white shadow-sm text-slate-400 hover:text-blue-600 transition-colors"
                                          title="Descendre"
                                        >
                                          <ChevronDown className="w-3 h-3" />
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => { e.stopPropagation(); duplicateField(section.id, field); }}
                                        className="w-6 h-6 flex items-center justify-center rounded bg-white shadow-sm text-slate-400 hover:text-emerald-600 transition-colors"
                                        title="Dupliquer"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); deleteField(section.id, field.id); }}
                                        className="w-6 h-6 flex items-center justify-center rounded bg-white shadow-sm text-slate-400 hover:text-red-500 transition-colors"
                                        title="Supprimer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>

                                    {/* Field Preview */}
                                    <div className="pl-5 pr-20">
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
                            {columnFields.length > 0 && (draggedComponent || draggedField) && (
                              <div
                                className={`h-12 border-2 border-dashed rounded-lg transition-all flex items-center justify-center ${
                                  dragOverSection === section.id && dragOverIndex === columnFields.length && dragOverColumn === colIndex
                                    ? draggedField ? 'border-blue-400 bg-blue-50' : 'border-emerald-400 bg-emerald-50'
                                    : 'border-slate-200 bg-slate-50/50'
                                }`}
                                onDragOver={(e) => {
                                  e.preventDefault()
                                  setDragOverSection(section.id)
                                  setDragOverIndex(columnFields.length)
                                  setDragOverColumn(colIndex)
                                }}
                                onDrop={(e) => {
                                  e.preventDefault()
                                  if (draggedComponent) {
                                    handleDrop(e, section.id, columnFields.length, colIndex)
                                  } else if (draggedField) {
                                    handleFieldDrop(e, section.id, columnFields.length, colIndex)
                                  }
                                }}
                              >
                                <span className={`text-xs ${draggedField ? 'text-blue-500' : 'text-slate-400'}`}>
                                  {draggedField ? 'Déplacer ici' : '+ Ajouter ici'}
                                </span>
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
  type: 'STANDARD' | 'EMERGENCY' | 'ADMINISTRATIVE' | 'CLINICAL' | 'SAFETY'
  categoryId?: string
  category?: { id: string; name: string; color: string }
  keywords?: string
  checklist?: string
  visibleBy?: string[]
  triggerType: 'MANUAL' | 'EVENT_CREATED' | 'EVENT_STATUS_CHANGE' | 'SCHEDULED' | 'CONDITION_BASED'
  triggerConfig?: {
    frequency?: 'daily' | 'weekly' | 'monthly'
    dayOfWeek?: number
    dayOfMonth?: number
    time?: string
  }
  isActive: boolean
  steps?: ProcedureStepData[]
  stepsCount?: number
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

type ProcedureView = 'list' | 'form' | 'steps' | 'trash'

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
    description: '',
    type: 'STANDARD' as 'STANDARD' | 'EMERGENCY' | 'ADMINISTRATIVE' | 'CLINICAL' | 'SAFETY',
    categoryId: '',
    keywords: '',
    visibleBy: [] as string[],
    triggerType: 'MANUAL' as 'MANUAL' | 'EVENT_CREATED' | 'EVENT_STATUS_CHANGE' | 'SCHEDULED' | 'CONDITION_BASED',
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
  const [editingOperationIndex, setEditingOperationIndex] = useState<number | null>(null)

  // Autocomplete states
  const [visibleBySearch, setVisibleBySearch] = useState('')
  const [showVisibleByDropdown, setShowVisibleByDropdown] = useState(false)
  const [responsibleSearch, setResponsibleSearch] = useState('')
  const [showResponsibleDropdown, setShowResponsibleDropdown] = useState<number | null>(null)
  const [formSearch, setFormSearch] = useState('')
  const [showFormDropdown, setShowFormDropdown] = useState(false)

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingProcedure, setDeletingProcedure] = useState<Procedure | null>(null)

  // Trash state
  const [deletedProcedures, setDeletedProcedures] = useState<Procedure[]>([])
  const [trashCount, setTrashCount] = useState(0)
  const [loadingTrash, setLoadingTrash] = useState(false)
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false)
  const [permanentDeletingProcedure, setPermanentDeletingProcedure] = useState<Procedure | null>(null)

  // Toast notification
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000)
  }

  const getHeaders = () => {
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    return { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
  }

  // Load trash count
  const loadTrashCount = async () => {
    try {
      const response = await fetch(`${API_URL}/api/procedures?isActive=false`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        const items = data.data || data.items || []
        setTrashCount(items.length)
      }
    } catch (error) {
      console.error('Error loading trash count:', error)
    }
  }

  // Load data
  const loadProcedures = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/procedures?isActive=true`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        // API returns { success: true, data: [...], pagination: {...} }
        const items = data.data || data.items || []
        console.log('Loaded procedures:', items)
        setProcedures(items)
      }
      // Also load trash count
      loadTrashCount()
    } catch (error) {
      console.error('Error loading procedures:', error)
      showToast('Erreur lors du chargement des procédures', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/config/event-categories`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        const rawCategories = data.data || data || []
        const transformed = rawCategories.map((cat: any) => ({
          id: cat.id,
          code: cat.code,
          name: cat.name,
          color: cat.color
        }))
        setCategories(transformed)
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
        const rawForms = data.data?.items || data.data || data.items || data || []
        // Transform forms - API may use 'title' instead of 'name'
        const transformedForms = (Array.isArray(rawForms) ? rawForms : []).map((f: any) => ({
          id: f.id,
          code: f.code,
          name: f.name || f.title || 'Sans nom'
        }))
        console.log('Loaded forms:', transformedForms)
        setForms(transformedForms)
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
      name: '',
      description: '',
      type: 'STANDARD',
      categoryId: '',
      keywords: '',
      visibleBy: [],
      triggerType: 'MANUAL',
      triggerConfig: { frequency: 'daily', dayOfWeek: 1, dayOfMonth: 1, time: '09:00' }
    })
    setCurrentView('form')
  }

  const handleEditProcedure = (procedure: Procedure) => {
    setSelectedProcedure(procedure)
    setFormData({
      name: procedure.name,
      description: procedure.description || '',
      type: procedure.type || 'STANDARD',
      categoryId: procedure.categoryId || '',
      keywords: procedure.keywords || '',
      visibleBy: procedure.visibleBy || [],
      triggerType: procedure.triggerType,
      triggerConfig: procedure.triggerConfig || { frequency: 'daily', dayOfWeek: 1, dayOfMonth: 1, time: '09:00' }
    })
    setCurrentView('form')
  }

  const handleManageSteps = async (procedure: Procedure) => {
    setSelectedProcedure(procedure)
    setCurrentView('steps')
    // Load steps from API
    try {
      const response = await fetch(`${API_URL}/api/procedures/${procedure.id}/steps`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        const stepsData = data.data || data || []
        // Transform to match frontend format
        const transformedSteps = stepsData.map((step: any) => ({
          id: step.id,
          name: step.name,
          description: step.description,
          stepNumber: step.stepNumber || step.step_number || step.stepOrder || step.step_order,
          durationHours: step.durationHours || step.duration_hours,
          responsibles: step.assigneeId ? [step.assigneeId] : [],
          operations: step.operations || []
        }))
        setSteps(transformedSteps)
      } else {
        setSteps([])
        showToast('Erreur lors du chargement des étapes', 'error')
      }
    } catch (error) {
      console.error('Error loading steps:', error)
      setSteps([])
      showToast('Erreur lors du chargement des étapes', 'error')
    }
  }

  const handleBack = () => {
    setCurrentView('list')
    setSelectedProcedure(null)
  }

  // Save procedure
  const handleSaveProcedure = async () => {
    if (!formData.name.trim()) {
      showToast('Le nom de la procédure est requis', 'error')
      return
    }
    // Check for duplicate name
    const duplicateName = procedures.find(p =>
      p.name.toLowerCase() === formData.name.trim().toLowerCase() &&
      p.id !== selectedProcedure?.id
    )
    if (duplicateName) {
      showToast('Une procédure avec ce nom existe déjà', 'error')
      return
    }
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        triggerType: formData.triggerType,
        categoryId: formData.categoryId || undefined,
        triggerConfig: formData.triggerType !== 'MANUAL' ? formData.triggerConfig : undefined
      }
      // Add code only for new procedures
      if (!selectedProcedure) {
        payload.code = `PROC_${Date.now()}`
      }
      const url = selectedProcedure ? `${API_URL}/api/procedures/${selectedProcedure.id}` : `${API_URL}/api/procedures`
      const response = await fetch(url, {
        method: selectedProcedure ? 'PUT' : 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      if (response.ok) {
        showToast(selectedProcedure ? 'Procédure modifiée avec succès' : 'Procédure créée avec succès', 'success')
        loadProcedures()
        setCurrentView('list')
      } else {
        const errorData = await response.json()
        console.error('Error saving procedure:', errorData)
        showToast(errorData.message || 'Erreur lors de l\'enregistrement', 'error')
      }
    } catch (error) {
      console.error('Error saving procedure:', error)
      showToast('Erreur lors de l\'enregistrement', 'error')
    }
  }

  // Save steps
  const handleSaveSteps = async () => {
    if (!selectedProcedure) return
    // Validate steps
    for (const step of steps) {
      if (!step.name.trim()) {
        showToast('Chaque étape doit avoir un nom', 'error')
        return
      }
    }
    try {
      // Transform steps to match backend format
      const transformedSteps = steps.map((step, index) => ({
        name: step.name,
        description: step.description || undefined,
        stepNumber: index + 1,
        durationHours: step.durationHours || undefined,
        isOptional: false,
        assigneeType: 'AUTO' as const,
        assigneeId: step.responsibles?.[0] || undefined, // Use first responsible as assignee
        operations: step.operations?.map((op, opIndex) => ({
          name: op.name,
          description: op.description || undefined,
          formId: op.formId || undefined,
          sortOrder: opIndex + 1
        }))
      }))
      const response = await fetch(`${API_URL}/api/procedures/${selectedProcedure.id}/steps/bulk`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ steps: transformedSteps })
      })
      if (response.ok) {
        showToast('Étapes enregistrées avec succès', 'success')
        loadProcedures()
        setCurrentView('list')
      } else {
        const errorData = await response.json()
        console.error('Error saving steps:', errorData)
        showToast(errorData.message || 'Erreur lors de l\'enregistrement des étapes', 'error')
      }
    } catch (error) {
      console.error('Error saving steps:', error)
      showToast('Erreur lors de l\'enregistrement des étapes', 'error')
    }
  }

  // Delete procedure
  const handleDelete = async () => {
    if (!deletingProcedure) return
    try {
      const response = await fetch(`${API_URL}/api/procedures/${deletingProcedure.id}`, { method: 'DELETE', headers: getHeaders() })
      if (response.ok) {
        showToast('Procédure déplacée dans la corbeille', 'success')
        setShowDeleteModal(false)
        setDeletingProcedure(null)
        loadProcedures()
      } else {
        const errorData = await response.json()
        showToast(errorData.message || 'Erreur lors de la suppression', 'error')
      }
    } catch (error) {
      console.error('Error deleting procedure:', error)
      showToast('Erreur lors de la suppression', 'error')
    }
  }

  // Load deleted procedures (trash)
  const loadDeletedProcedures = async () => {
    try {
      setLoadingTrash(true)
      const response = await fetch(`${API_URL}/api/procedures?isActive=false`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        const items = data.data || data.items || []
        setDeletedProcedures(items)
        setTrashCount(items.length)
      }
    } catch (error) {
      console.error('Error loading deleted procedures:', error)
      showToast('Erreur lors du chargement de la corbeille', 'error')
    } finally {
      setLoadingTrash(false)
    }
  }

  // Restore procedure
  const handleRestore = async (procedure: Procedure) => {
    try {
      const response = await fetch(`${API_URL}/api/procedures/${procedure.id}/restore`, { method: 'PUT', headers: getHeaders() })
      if (response.ok) {
        showToast('Procédure restaurée avec succès', 'success')
        loadDeletedProcedures()
        loadProcedures() // Reload main list to include restored procedure
      } else {
        const errorData = await response.json()
        showToast(errorData.message || 'Erreur lors de la restauration', 'error')
      }
    } catch (error) {
      console.error('Error restoring procedure:', error)
      showToast('Erreur lors de la restauration', 'error')
    }
  }

  // Permanent delete
  const handlePermanentDelete = async () => {
    if (!permanentDeletingProcedure) return
    try {
      const response = await fetch(`${API_URL}/api/procedures/${permanentDeletingProcedure.id}/permanent`, { method: 'DELETE', headers: getHeaders() })
      if (response.ok) {
        showToast('Procédure supprimée définitivement', 'success')
        setShowPermanentDeleteModal(false)
        setPermanentDeletingProcedure(null)
        loadDeletedProcedures()
      } else {
        const errorData = await response.json()
        showToast(errorData.message || 'Erreur lors de la suppression', 'error')
      }
    } catch (error) {
      console.error('Error permanent deleting procedure:', error)
      showToast('Erreur lors de la suppression', 'error')
    }
  }

  // Go to trash view
  const handleGoToTrash = () => {
    loadDeletedProcedures()
    setCurrentView('trash')
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
    setEditingOperationIndex(null)
    setShowOperationsModal(true)
  }

  const closeOperationsModal = () => {
    setShowOperationsModal(false)
    setEditingOperationIndex(null)
    setOperationForm({ name: '', description: '', formId: '' })
    setFormSearch('')
    setShowFormDropdown(false)
  }

  const addOperation = () => {
    if (editingStepIndex === null || !operationForm.name) return
    const step = steps[editingStepIndex]

    if (editingOperationIndex !== null) {
      // Edit existing operation
      const updatedOperations = step.operations?.map((op, i) =>
        i === editingOperationIndex ? {
          ...operationForm,
          formName: forms.find(f => f.id === operationForm.formId)?.name,
          sortOrder: op.sortOrder
        } : op
      )
      updateStep(editingStepIndex, 'operations', updatedOperations)
      setEditingOperationIndex(null)
    } else {
      // Add new operation
      const newOperation: StepOperation = {
        ...operationForm,
        formName: forms.find(f => f.id === operationForm.formId)?.name,
        sortOrder: (step.operations?.length || 0) + 1
      }
      updateStep(editingStepIndex, 'operations', [...(step.operations || []), newOperation])
    }
    setOperationForm({ name: '', description: '', formId: '' })
    setFormSearch('')
    setShowFormDropdown(false)
  }

  const editOperation = (opIndex: number) => {
    if (editingStepIndex === null) return
    const op = steps[editingStepIndex].operations?.[opIndex]
    if (op) {
      setOperationForm({ name: op.name, description: op.description || '', formId: op.formId || '' })
      setEditingOperationIndex(opIndex)
    }
  }

  const cancelEditOperation = () => {
    setEditingOperationIndex(null)
    setOperationForm({ name: '', description: '', formId: '' })
  }

  const removeOperation = (stepIndex: number, opIndex: number) => {
    const step = steps[stepIndex]
    updateStep(stepIndex, 'operations', step.operations?.filter((_, i) => i !== opIndex))
    if (editingOperationIndex === opIndex) {
      setEditingOperationIndex(null)
      setOperationForm({ name: '', description: '', formId: '' })
    }
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
        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-4 right-4 z-[100] px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 transition-all ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
            <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800">Gestion des Procédures</h1>
            <p className="text-slate-500 mt-1">{filteredProcedures.length} procédure(s)</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleGoToTrash} className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 flex items-center gap-2 relative">
              <Archive className="w-4 h-4" /> Corbeille
              {trashCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {trashCount > 99 ? '99+' : trashCount}
                </span>
              )}
            </button>
            <button onClick={handleNewProcedure} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nouvelle procédure
            </button>
          </div>
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
                        {proc.triggerType === 'MANUAL' ? 'Manuel' : proc.triggerType === 'SCHEDULED' ? 'Planifié' : 'Auto'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">{proc.stepsCount || proc.steps?.length || 0} étape(s)</span>
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
        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-4 right-4 z-[100] px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 transition-all ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
            <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-slate-800">
            {selectedProcedure ? 'Modifier la procédure' : 'Nouvelle procédure'}
          </h1>
          <button onClick={handleBack} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          {/* Nom + Type sur la même ligne */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom de la procédure *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Investigation foyer épidémique"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500">
                <option value="STANDARD">Standard</option>
                <option value="EMERGENCY">Urgence</option>
                <option value="ADMINISTRATIVE">Administratif</option>
                <option value="CLINICAL">Clinique</option>
                <option value="SAFETY">Sécurité</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2} placeholder="Description de la procédure..."
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
          </div>

          {/* Catégorie + Mots clés sur la même ligne */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mots clés</label>
              <input type="text" value={formData.keywords} onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="Ex: épidémie, investigation, terrain"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          {/* Visible par */}
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
                <input type="radio" name="trigger" checked={formData.triggerType === 'SCHEDULED'}
                  onChange={() => setFormData({ ...formData, triggerType: 'SCHEDULED' })}
                  className="text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-slate-700">Planifié</span>
              </label>
            </div>

            {formData.triggerType === 'SCHEDULED' && (
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
        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-4 right-4 z-[100] px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 transition-all ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
            <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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
                          <div className="flex flex-wrap items-center gap-1 min-h-[34px] px-2 py-1 border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 bg-white">
                            {step.responsibles?.map(id => (
                              <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">
                                {getItemName(id)}
                                <button type="button" onClick={() => removeResponsible(index, id)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                              </span>
                            ))}
                            <input type="text" value={showResponsibleDropdown === index ? responsibleSearch : ''}
                              onChange={(e) => { setResponsibleSearch(e.target.value); setShowResponsibleDropdown(index) }}
                              onFocus={() => setShowResponsibleDropdown(index)}
                              placeholder={step.responsibles?.length ? '' : 'Ajouter...'}
                              className="flex-1 min-w-[80px] px-1 py-0.5 border-0 focus:ring-0 focus:outline-none text-sm" />
                          </div>
                          {showResponsibleDropdown === index && responsibleSearch && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                              {filteredUsersGroups.filter(ug => !step.responsibles?.includes(ug.id)).slice(0, 5).map(item => (
                                <button key={item.id} onClick={() => addResponsible(index, item)}
                                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50 flex items-center gap-2">
                                  {item.type === 'user' ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                                  {item.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
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
                <button onClick={() => closeOperationsModal()} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {/* Add/Edit operation form */}
                <div className={`mb-6 p-4 rounded-xl space-y-3 ${editingOperationIndex !== null ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-slate-700">
                      {editingOperationIndex !== null ? 'Modifier l\'opération' : 'Nouvelle opération'}
                    </h3>
                    {editingOperationIndex !== null && (
                      <button onClick={cancelEditOperation} className="text-xs text-slate-500 hover:text-slate-700">Annuler</button>
                    )}
                  </div>
                  <input type="text" value={operationForm.name} onChange={(e) => setOperationForm({ ...operationForm, name: e.target.value })}
                    placeholder="Nom de l'opération" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  <input type="text" value={operationForm.description} onChange={(e) => setOperationForm({ ...operationForm, description: e.target.value })}
                    placeholder="Description" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  {/* Form selector with search */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Formulaire associé</label>
                    <div className="relative">
                      <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-primary-500">
                        <FileText className="w-4 h-4 text-slate-400" />
                        {operationForm.formId ? (
                          <div className="flex-1 flex items-center justify-between">
                            <span className="text-sm text-slate-700">{forms.find(f => f.id === operationForm.formId)?.name || 'Formulaire sélectionné'}</span>
                            <button type="button" onClick={() => { setOperationForm({ ...operationForm, formId: '' }); setFormSearch('') }}
                              className="p-0.5 hover:bg-slate-100 rounded">
                              <X className="w-4 h-4 text-slate-400" />
                            </button>
                          </div>
                        ) : (
                          <input type="text" value={formSearch}
                            onChange={(e) => { setFormSearch(e.target.value); setShowFormDropdown(true) }}
                            onFocus={() => setShowFormDropdown(true)}
                            placeholder="Rechercher un formulaire..."
                            className="flex-1 border-0 focus:ring-0 focus:outline-none text-sm" />
                        )}
                      </div>
                      {showFormDropdown && !operationForm.formId && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          <button type="button" onClick={() => { setOperationForm({ ...operationForm, formId: '' }); setShowFormDropdown(false); setFormSearch('') }}
                            className="w-full px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50 border-b border-slate-100">
                            Aucun formulaire
                          </button>
                          {forms.filter(f =>
                            formSearch === '' ||
                            f.name.toLowerCase().includes(formSearch.toLowerCase()) ||
                            (f.code && f.code.toLowerCase().includes(formSearch.toLowerCase()))
                          ).length === 0 ? (
                            <p className="px-3 py-2 text-sm text-slate-500">Aucun formulaire trouvé</p>
                          ) : (
                            forms.filter(f =>
                              formSearch === '' ||
                              f.name.toLowerCase().includes(formSearch.toLowerCase()) ||
                              (f.code && f.code.toLowerCase().includes(formSearch.toLowerCase()))
                            ).slice(0, 10).map(f => (
                              <button key={f.id} type="button"
                                onClick={() => { setOperationForm({ ...operationForm, formId: f.id }); setShowFormDropdown(false); setFormSearch('') }}
                                className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary-500" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-700 truncate">{f.name}</p>
                                  {f.code && <p className="text-xs text-slate-400">{f.code}</p>}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={addOperation} disabled={!operationForm.name}
                      className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${editingOperationIndex !== null ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary-600 hover:bg-primary-700'}`}>
                      {editingOperationIndex !== null ? 'Modifier' : 'Ajouter'}
                    </button>
                  </div>
                </div>

                {/* Operations list */}
                <div className="space-y-2">
                  {(steps[editingStepIndex]?.operations || []).length === 0 ? (
                    <p className="text-center text-slate-500 py-4">Aucune opération</p>
                  ) : (
                    steps[editingStepIndex].operations?.map((op, opIndex) => (
                      <div key={opIndex} className={`flex items-center justify-between p-3 border rounded-lg ${editingOperationIndex === opIndex ? 'border-amber-400 bg-amber-50' : 'border-slate-200'}`}>
                        <div>
                          <p className="font-medium text-slate-800">{op.name}</p>
                          {op.description && <p className="text-xs text-slate-500">{op.description}</p>}
                          {op.formName && (
                            <span className="inline-flex items-center gap-1 text-xs text-primary-600 mt-1">
                              <FileText className="w-3 h-3" /> {op.formName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => editOperation(opIndex)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeOperation(editingStepIndex, opIndex)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 flex justify-end">
                <button onClick={() => closeOperationsModal()} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700">
                  Terminé
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // TRASH VIEW
  if (currentView === 'trash') {
    return (
      <div className="space-y-6">
        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-4 right-4 z-[100] px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 transition-all ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
            <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-800 flex items-center gap-2">
                <Archive className="w-6 h-6 text-slate-400" /> Corbeille
              </h1>
              <p className="text-slate-500 mt-1">{deletedProcedures.length} procédure(s) supprimée(s)</p>
            </div>
          </div>
        </div>

        {loadingTrash ? (
          <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 text-primary-600 animate-spin" /></div>
        ) : deletedProcedures.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Archive className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">La corbeille est vide</h3>
            <p className="text-slate-500 mb-4">Les procédures supprimées apparaîtront ici</p>
            <button onClick={handleBack} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50">
              Retour à la liste
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-amber-50 border-b border-amber-100">
              <p className="text-sm text-amber-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Les procédures supprimées définitivement ne peuvent pas être récupérées
              </p>
            </div>
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Procédure</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Étapes</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deletedProcedures.map(proc => (
                  <tr key={proc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{proc.name}</p>
                      {proc.description && <p className="text-xs text-slate-500 truncate max-w-xs">{proc.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">{proc.type || 'Standard'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">{proc.stepsCount || proc.steps?.length || 0} étape(s)</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleRestore(proc)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Restaurer">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setPermanentDeletingProcedure(proc); setShowPermanentDeleteModal(true) }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Supprimer définitivement">
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

        {/* Permanent Delete Modal */}
        {showPermanentDeleteModal && permanentDeletingProcedure && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Supprimer définitivement</h3>
              <p className="text-slate-500 mb-2">Êtes-vous sûr de vouloir supprimer définitivement la procédure "{permanentDeletingProcedure.name}" ?</p>
              <p className="text-red-600 text-sm mb-6">Cette action supprimera également toutes les étapes et opérations associées.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowPermanentDeleteModal(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50">Annuler</button>
                <button onClick={handlePermanentDelete} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700">Supprimer définitivement</button>
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

  // View state
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list')
  const [categories, setCategories] = useState<EventCategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  // Edit state
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

  // Icon selector state
  const [iconSearch, setIconSearch] = useState('')
  const [showIconDropdown, setShowIconDropdown] = useState(false)
  const iconDropdownRef = useRef<HTMLDivElement>(null)

  // Close icon dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconDropdownRef.current && !iconDropdownRef.current.contains(event.target as Node)) {
        setShowIconDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        const rawCategories = data.data || data || []
        // Transform snake_case to camelCase
        const transformed = rawCategories.map((cat: any) => ({
          id: cat.id,
          code: cat.code,
          name: cat.name,
          description: cat.description,
          color: cat.color,
          icon: cat.icon,
          isActive: cat.is_active,
          sortOrder: cat.sort_order
        }))
        setCategories(transformed)
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
    setCurrentView('form')
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
    setCurrentView('form')
  }

  const handleBack = () => {
    setCurrentView('list')
    setEditingCategory(null)
  }

  const handleSave = async () => {
    if (!formData.code || !formData.name) return
    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        description: formData.description || null,
        color: formData.color,
        icon: formData.icon,
        isActive: formData.isActive,
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
        setCurrentView('list')
      } else {
        const errorData = await response.json()
        console.error('Error saving:', errorData)
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

  // Icon mapping with React components
  const iconComponents: Record<string, React.ReactNode> = {
    'alert-triangle': <AlertTriangle className="w-5 h-5" />,
    'alert-circle': <AlertCircle className="w-5 h-5" />,
    'bug': <Bug className="w-5 h-5" />,
    'siren': <Siren className="w-5 h-5" />,
    'biohazard': <Biohazard className="w-5 h-5" />,
    'microscope': <Microscope className="w-5 h-5" />,
    'flask': <FlaskConical className="w-5 h-5" />,
    'test-tube': <TestTube2 className="w-5 h-5" />,
    'shield': <Shield className="w-5 h-5" />,
    'shield-alert': <ShieldAlert className="w-5 h-5" />,
    'shield-check': <ShieldCheck className="w-5 h-5" />,
    'syringe': <Syringe className="w-5 h-5" />,
    'pill': <Pill className="w-5 h-5" />,
    'thermometer': <Thermometer className="w-5 h-5" />,
    'stethoscope': <Stethoscope className="w-5 h-5" />,
    'heart': <Heart className="w-5 h-5" />,
    'heart-pulse': <HeartPulse className="w-5 h-5" />,
    'alert-siren': <Siren className="w-5 h-5" />,
    'eye': <Eye className="w-5 h-5" />,
    'activity': <Activity className="w-5 h-5" />,
    'building': <Building2 className="w-5 h-5" />,
    'warehouse': <Warehouse className="w-5 h-5" />,
    'factory': <Factory className="w-5 h-5" />,
    'home': <Home className="w-5 h-5" />,
    'map-pin': <MapPin className="w-5 h-5" />,
    'map-pinned': <MapPinned className="w-5 h-5" />,
    'navigation': <Navigation className="w-5 h-5" />,
    'route': <Route className="w-5 h-5" />,
    'truck': <Truck className="w-5 h-5" />,
    'car': <Car className="w-5 h-5" />,
    'plane': <Plane className="w-5 h-5" />,
    'ship': <Ship className="w-5 h-5" />,
    'train': <Train className="w-5 h-5" />,
    'bird': <Bird className="w-5 h-5" />,
    'fish': <Fish className="w-5 h-5" />,
    'dog': <Dog className="w-5 h-5" />,
    'cat': <Cat className="w-5 h-5" />,
    'rat': <Rat className="w-5 h-5" />,
    'beef': <Beef className="w-5 h-5" />,
    'egg': <Egg className="w-5 h-5" />,
    'leaf': <Leaf className="w-5 h-5" />,
    'tree': <TreePine className="w-5 h-5" />,
    'wheat': <Wheat className="w-5 h-5" />,
    'apple': <Apple className="w-5 h-5" />,
    'carrot': <Carrot className="w-5 h-5" />,
    'droplet': <Droplet className="w-5 h-5" />,
    'flame': <Flame className="w-5 h-5" />,
    'wind': <Wind className="w-5 h-5" />,
    'megaphone': <Megaphone className="w-5 h-5" />,
    'bell': <Bell className="w-5 h-5" />,
    'radio': <RadioIcon className="w-5 h-5" />,
    'file-text': <FileText className="w-5 h-5" />,
    'file-warning': <FileWarning className="w-5 h-5" />,
    'file-check': <FileCheck className="w-5 h-5" />,
    'folder': <Folder className="w-5 h-5" />,
    'folder-open': <FolderOpen className="w-5 h-5" />,
    'clipboard': <ClipboardList className="w-5 h-5" />,
    'archive': <Archive className="w-5 h-5" />,
    'database': <Database className="w-5 h-5" />,
    'users': <Users className="w-5 h-5" />,
    'user': <User className="w-5 h-5" />,
    'calendar': <Calendar className="w-5 h-5" />,
    'clock': <Clock className="w-5 h-5" />,
    'target': <Target className="w-5 h-5" />,
    'crosshair': <Crosshair className="w-5 h-5" />,
    'search': <Search className="w-5 h-5" />,
    'scan': <ScanLine className="w-5 h-5" />,
    'qr-code': <QrCode className="w-5 h-5" />,
    'barcode': <Barcode className="w-5 h-5" />,
    'tag': <Tag className="w-5 h-5" />,
    'tags': <Tags className="w-5 h-5" />,
    'bookmark': <Bookmark className="w-5 h-5" />,
    'flag': <Flag className="w-5 h-5" />,
    'award': <Award className="w-5 h-5" />,
    'trophy': <Trophy className="w-5 h-5" />,
    'star': <Star className="w-5 h-5" />,
    'lightbulb': <Lightbulb className="w-5 h-5" />,
    'zap': <Zap className="w-5 h-5" />,
    'settings': <Settings className="w-5 h-5" />,
    'help': <HelpCircle className="w-5 h-5" />,
    'info': <Info className="w-5 h-5" />,
    'globe': <Globe className="w-5 h-5" />,
    'lock': <LockIcon className="w-5 h-5" />,
    'unlock': <Unlock className="w-5 h-5" />,
    'key': <Key className="w-5 h-5" />,
    'fingerprint': <Fingerprint className="w-5 h-5" />
  }

  const iconOptions = [
    { value: 'alert-triangle', label: 'Alerte', category: 'Alertes' },
    { value: 'alert-circle', label: 'Alerte cercle', category: 'Alertes' },
    { value: 'bug', label: 'Bug/Insecte', category: 'Santé' },
    { value: 'siren', label: 'Sirène', category: 'Alertes' },
    { value: 'biohazard', label: 'Biohazard', category: 'Santé' },
    { value: 'microscope', label: 'Microscope', category: 'Laboratoire' },
    { value: 'flask', label: 'Flacon', category: 'Laboratoire' },
    { value: 'test-tube', label: 'Tube à essai', category: 'Laboratoire' },
    { value: 'shield', label: 'Bouclier', category: 'Sécurité' },
    { value: 'shield-alert', label: 'Bouclier alerte', category: 'Sécurité' },
    { value: 'shield-check', label: 'Bouclier validé', category: 'Sécurité' },
    { value: 'syringe', label: 'Seringue', category: 'Médical' },
    { value: 'pill', label: 'Pilule', category: 'Médical' },
    { value: 'thermometer', label: 'Thermomètre', category: 'Médical' },
    { value: 'stethoscope', label: 'Stéthoscope', category: 'Médical' },
    { value: 'heart', label: 'Cœur', category: 'Médical' },
    { value: 'heart-pulse', label: 'Battement cœur', category: 'Médical' },
    { value: 'alert-siren', label: 'Alerte sirène', category: 'Alertes' },
    { value: 'eye', label: 'Œil/Surveillance', category: 'Surveillance' },
    { value: 'activity', label: 'Activité', category: 'Surveillance' },
    { value: 'target', label: 'Cible', category: 'Surveillance' },
    { value: 'crosshair', label: 'Viseur', category: 'Surveillance' },
    { value: 'search', label: 'Recherche', category: 'Surveillance' },
    { value: 'scan', label: 'Scanner', category: 'Surveillance' },
    { value: 'building', label: 'Bâtiment', category: 'Lieux' },
    { value: 'warehouse', label: 'Entrepôt', category: 'Lieux' },
    { value: 'factory', label: 'Usine', category: 'Lieux' },
    { value: 'home', label: 'Maison', category: 'Lieux' },
    { value: 'map-pin', label: 'Marqueur carte', category: 'Lieux' },
    { value: 'map-pinned', label: 'Lieu épinglé', category: 'Lieux' },
    { value: 'navigation', label: 'Navigation', category: 'Transport' },
    { value: 'route', label: 'Itinéraire', category: 'Transport' },
    { value: 'truck', label: 'Camion', category: 'Transport' },
    { value: 'car', label: 'Voiture', category: 'Transport' },
    { value: 'plane', label: 'Avion', category: 'Transport' },
    { value: 'ship', label: 'Bateau', category: 'Transport' },
    { value: 'train', label: 'Train', category: 'Transport' },
    { value: 'bird', label: 'Oiseau', category: 'Animaux' },
    { value: 'fish', label: 'Poisson', category: 'Animaux' },
    { value: 'dog', label: 'Chien', category: 'Animaux' },
    { value: 'cat', label: 'Chat', category: 'Animaux' },
    { value: 'rat', label: 'Rat/Rongeur', category: 'Animaux' },
    { value: 'beef', label: 'Bétail', category: 'Animaux' },
    { value: 'egg', label: 'Œuf/Volaille', category: 'Animaux' },
    { value: 'leaf', label: 'Feuille', category: 'Environnement' },
    { value: 'tree', label: 'Arbre', category: 'Environnement' },
    { value: 'wheat', label: 'Blé/Céréales', category: 'Environnement' },
    { value: 'apple', label: 'Pomme/Fruit', category: 'Environnement' },
    { value: 'carrot', label: 'Carotte/Légume', category: 'Environnement' },
    { value: 'droplet', label: 'Eau/Goutte', category: 'Environnement' },
    { value: 'flame', label: 'Feu/Flamme', category: 'Environnement' },
    { value: 'wind', label: 'Vent/Air', category: 'Environnement' },
    { value: 'megaphone', label: 'Mégaphone', category: 'Communication' },
    { value: 'bell', label: 'Cloche', category: 'Communication' },
    { value: 'radio', label: 'Radio', category: 'Communication' },
    { value: 'file-text', label: 'Document', category: 'Documents' },
    { value: 'file-warning', label: 'Document alerte', category: 'Documents' },
    { value: 'file-check', label: 'Document validé', category: 'Documents' },
    { value: 'folder', label: 'Dossier', category: 'Documents' },
    { value: 'folder-open', label: 'Dossier ouvert', category: 'Documents' },
    { value: 'clipboard', label: 'Presse-papiers', category: 'Documents' },
    { value: 'archive', label: 'Archive', category: 'Documents' },
    { value: 'database', label: 'Base de données', category: 'Documents' },
    { value: 'users', label: 'Utilisateurs', category: 'Personnes' },
    { value: 'user', label: 'Utilisateur', category: 'Personnes' },
    { value: 'calendar', label: 'Calendrier', category: 'Temps' },
    { value: 'clock', label: 'Horloge', category: 'Temps' },
    { value: 'tag', label: 'Étiquette', category: 'Divers' },
    { value: 'tags', label: 'Étiquettes', category: 'Divers' },
    { value: 'bookmark', label: 'Signet', category: 'Divers' },
    { value: 'flag', label: 'Drapeau', category: 'Divers' },
    { value: 'award', label: 'Récompense', category: 'Divers' },
    { value: 'trophy', label: 'Trophée', category: 'Divers' },
    { value: 'star', label: 'Étoile', category: 'Divers' },
    { value: 'lightbulb', label: 'Ampoule/Idée', category: 'Divers' },
    { value: 'zap', label: 'Éclair', category: 'Divers' },
    { value: 'settings', label: 'Paramètres', category: 'Divers' },
    { value: 'help', label: 'Aide', category: 'Divers' },
    { value: 'info', label: 'Information', category: 'Divers' },
    { value: 'globe', label: 'Globe', category: 'Divers' },
    { value: 'lock', label: 'Cadenas', category: 'Sécurité' },
    { value: 'unlock', label: 'Déverrouillé', category: 'Sécurité' },
    { value: 'key', label: 'Clé', category: 'Sécurité' },
    { value: 'fingerprint', label: 'Empreinte', category: 'Sécurité' }
  ]

  const filteredIcons = iconOptions.filter(icon =>
    icon.label.toLowerCase().includes(iconSearch.toLowerCase()) ||
    icon.category.toLowerCase().includes(iconSearch.toLowerCase())
  )

  const getIconComponent = (iconName: string) => iconComponents[iconName] || <Tag className="w-5 h-5" />


  // FORM VIEW
  if (currentView === 'form') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-slate-800">
            {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </h1>
          <button onClick={handleBack} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Couleur et Icône sur la même ligne */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Couleur */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Couleur</label>
              <div className="flex items-center gap-3">
                <input type="color" value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer" />
                <input type="text" value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#10b981"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 font-mono text-sm" />
              </div>
            </div>

            {/* Icône avec recherche */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Icône</label>
            <div className="relative" ref={iconDropdownRef}>
              <button type="button" onClick={() => setShowIconDropdown(!showIconDropdown)}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-slate-600">{getIconComponent(formData.icon)}</span>
                  <span className="text-slate-700">{iconOptions.find(i => i.value === formData.icon)?.label || 'Sélectionner'}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showIconDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showIconDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg">
                  <div className="p-2 border-b border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={iconSearch} onChange={(e) => setIconSearch(e.target.value)}
                        placeholder="Rechercher une icône..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {filteredIcons.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-slate-500 text-center">Aucune icône trouvée</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-1">
                        {filteredIcons.map(icon => (
                          <button key={icon.value} type="button"
                            onClick={() => { setFormData({ ...formData, icon: icon.value }); setShowIconDropdown(false); setIconSearch('') }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                              formData.icon === icon.value ? 'bg-primary-100 text-primary-700' : 'hover:bg-slate-50 text-slate-700'
                            }`}>
                            <span className={formData.icon === icon.value ? 'text-primary-600' : 'text-slate-500'}>
                              {getIconComponent(icon.value)}
                            </span>
                            <span className="text-sm truncate">{icon.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button onClick={handleBack} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50">
              Annuler
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 flex items-center gap-2">
              <Save className="w-4 h-4" /> {editingCategory ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // LIST VIEW
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
                      {getIconComponent(cat.icon)}
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
   DOCUMENT TYPES PAGE
   ============================================ */
interface DocumentTypeData {
  id: string
  code: string
  name: string
  description?: string
  isActive: boolean
  sortOrder: number
}

function DocumentTypesPage() {
  const { t } = useTranslation()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  // View state
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list')
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  // Pagination state
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Edit state
  const [editingDocType, setEditingDocType] = useState<DocumentTypeData | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingDocType, setDeletingDocType] = useState<DocumentTypeData | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  })

  const getHeaders = () => {
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    return { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
  }

  const loadDocumentTypes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/config/document-types`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        const rawTypes = data.data || data || []
        const transformed = rawTypes.map((dt: any) => ({
          id: dt.id,
          code: dt.code,
          name: dt.name,
          description: dt.description,
          isActive: dt.is_active ?? dt.isActive ?? true,
          sortOrder: dt.sort_order ?? dt.sortOrder ?? 0
        }))
        setDocumentTypes(transformed)
      }
    } catch (error) {
      console.error('Error loading document types:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocumentTypes()
  }, [])

  const filteredDocTypes = documentTypes.filter(dt => {
    if (!showInactive && !dt.isActive) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return dt.name.toLowerCase().includes(search) || dt.code.toLowerCase().includes(search)
    }
    return true
  })

  // Pagination logic
  const totalItems = filteredDocTypes.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPageNum - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedDocTypes = filteredDocTypes.slice(startIndex, endIndex)

  // Reset page when search changes
  useEffect(() => {
    setCurrentPageNum(1)
  }, [searchTerm, showInactive])

  const handleCreate = () => {
    setEditingDocType(null)
    setFormData({ name: '', description: '', isActive: true })
    setCurrentView('form')
  }

  const handleEdit = (dt: DocumentTypeData) => {
    setEditingDocType(dt)
    setFormData({
      name: dt.name,
      description: dt.description || '',
      isActive: dt.isActive
    })
    setCurrentView('form')
  }

  const handleBack = () => {
    setCurrentView('list')
    setEditingDocType(null)
  }

  const handleSave = async () => {
    if (!formData.name) return
    try {
      // Auto-generate code from name
      const generatedCode = editingDocType?.code || formData.name
        .toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
      const payload = {
        code: generatedCode,
        name: formData.name,
        description: formData.description || null,
        isActive: formData.isActive,
        sortOrder: editingDocType?.sortOrder || documentTypes.length + 1
      }
      const url = editingDocType
        ? `${API_URL}/api/config/document-types/${editingDocType.id}`
        : `${API_URL}/api/config/document-types`
      const response = await fetch(url, {
        method: editingDocType ? 'PUT' : 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      if (response.ok) {
        loadDocumentTypes()
        setCurrentView('list')
      } else {
        const errorData = await response.json()
        console.error('Error saving:', errorData)
      }
    } catch (error) {
      console.error('Error saving document type:', error)
    }
  }

  const handleDelete = async () => {
    if (!deletingDocType) return
    try {
      const response = await fetch(`${API_URL}/api/config/document-types/${deletingDocType.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      if (response.ok) {
        loadDocumentTypes()
        setShowDeleteModal(false)
        setDeletingDocType(null)
      }
    } catch (error) {
      console.error('Error deleting document type:', error)
    }
  }

  // FORM VIEW
  if (currentView === 'form') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-slate-800">
            {editingDocType ? 'Modifier le type de document' : 'Nouveau type de document'}
          </h1>
          <button onClick={handleBack} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
            <input type="text" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Certificat sanitaire"
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2} placeholder="Description du type de document..."
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-medium text-slate-800">Type actif</p>
              <p className="text-sm text-slate-500">Les types inactifs ne sont pas disponibles à la sélection</p>
            </div>
            <button type="button" onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`w-12 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-primary-600' : 'bg-slate-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button onClick={handleBack} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50">
              Annuler
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 flex items-center gap-2">
              <Save className="w-4 h-4" /> {editingDocType ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Types de documents</h1>
          <p className="text-slate-500">Gérez les types de documents requis</p>
        </div>
        <button onClick={handleCreate} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouveau type
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un type de document..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-slate-600">Afficher inactifs</span>
          </label>
        </div>
      </div>

      {/* Document Types List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredDocTypes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 mb-4">Aucun type de document trouvé</p>
          <button onClick={handleCreate} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700">
            Créer un type de document
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Nom</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase">Statut</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedDocTypes.map(dt => (
                <tr key={dt.id} className={`hover:bg-slate-50 ${!dt.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-800">{dt.name}</p>
                      {dt.description && <p className="text-sm text-slate-500 truncate max-w-md">{dt.description}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${dt.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {dt.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(dt)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setDeletingDocType(dt); setShowDeleteModal(true) }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
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

      {/* Modern Pagination */}
      {totalItems > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Info & Items per page */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-500">
                Affichage de <span className="font-semibold text-slate-700">{startIndex + 1}</span> à{' '}
                <span className="font-semibold text-slate-700">{Math.min(endIndex, totalItems)}</span> sur{' '}
                <span className="font-semibold text-slate-700">{totalItems}</span> types de documents
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Afficher</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPageNum(1); }}
                  className="px-2 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-slate-500">par page</span>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {/* First Page */}
              <button
                onClick={() => setCurrentPageNum(1)}
                disabled={currentPageNum === 1}
                className="flex items-center p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Première page"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>

              {/* Previous Page */}
              <button
                onClick={() => setCurrentPageNum(p => Math.max(1, p - 1))}
                disabled={currentPageNum === 1}
                className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                    if (Math.abs(page - currentPageNum) <= 1) return true
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
                          onClick={() => setCurrentPageNum(page)}
                          className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all ${
                            currentPageNum === page
                              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
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
                onClick={() => setCurrentPageNum(p => Math.min(totalPages, p + 1))}
                disabled={currentPageNum === totalPages}
                className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Page suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPageNum(totalPages)}
                disabled={currentPageNum === totalPages}
                className="flex items-center p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Dernière page"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingDocType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Supprimer le type de document</h3>
            <p className="text-slate-500 mb-6">Supprimer "{deletingDocType.name}" ? Cette action est irréversible.</p>
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
   EVENT PROVENANCES PAGE (Origins)
   ============================================ */
interface EventProvenanceData {
  id: string
  code: string
  name: string
  description?: string
  color: string
  icon: string
  isActive: boolean
  sortOrder: number
}

function EventProvenancesPage() {
  const { t } = useTranslation()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  // View state
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list')
  const [provenances, setProvenances] = useState<EventProvenanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  // Pagination state
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)

  // Edit state
  const [editingProvenance, setEditingProvenance] = useState<EventProvenanceData | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingProvenance, setDeletingProvenance] = useState<EventProvenanceData | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    icon: 'map-pin',
    isActive: true
  })

  // Icon selector state
  const [iconSearch, setIconSearch] = useState('')
  const [showIconDropdown, setShowIconDropdown] = useState(false)
  const iconDropdownRef = useRef<HTMLDivElement>(null)

  // Close icon dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconDropdownRef.current && !iconDropdownRef.current.contains(event.target as Node)) {
        setShowIconDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getHeaders = () => {
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    return { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
  }

  const loadProvenances = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/config/event-provenances`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        const rawData = data.data || data || []
        const transformed = rawData.map((p: any) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          description: p.description,
          color: p.color || '#6366f1',
          icon: p.icon || 'map-pin',
          isActive: p.is_active ?? p.isActive ?? true,
          sortOrder: p.sort_order ?? p.sortOrder ?? 0
        }))
        setProvenances(transformed)
      }
    } catch (error) {
      console.error('Error loading provenances:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProvenances()
  }, [])

  const filteredProvenances = provenances.filter(p => {
    if (!showInactive && !p.isActive) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return p.name.toLowerCase().includes(search) || p.code.toLowerCase().includes(search)
    }
    return true
  })

  // Pagination logic
  const totalItems = filteredProvenances.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPageNum - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProvenances = filteredProvenances.slice(startIndex, endIndex)

  // Reset page when search changes
  useEffect(() => {
    setCurrentPageNum(1)
  }, [searchTerm, showInactive])

  const handleCreate = () => {
    setEditingProvenance(null)
    setFormData({ name: '', description: '', color: '#6366f1', icon: 'map-pin', isActive: true })
    setCurrentView('form')
  }

  const handleEdit = (p: EventProvenanceData) => {
    setEditingProvenance(p)
    setFormData({
      name: p.name,
      description: p.description || '',
      color: p.color,
      icon: p.icon,
      isActive: p.isActive
    })
    setCurrentView('form')
  }

  const handleBack = () => {
    setCurrentView('list')
    setEditingProvenance(null)
  }

  const handleSave = async () => {
    if (!formData.name) return
    try {
      const generatedCode = editingProvenance?.code || formData.name
        .toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
      const payload = {
        code: generatedCode,
        name: formData.name,
        description: formData.description || null,
        color: formData.color,
        icon: formData.icon,
        isActive: formData.isActive,
        sortOrder: editingProvenance?.sortOrder || provenances.length + 1
      }
      const url = editingProvenance
        ? `${API_URL}/api/config/event-provenances/${editingProvenance.id}`
        : `${API_URL}/api/config/event-provenances`
      const response = await fetch(url, {
        method: editingProvenance ? 'PUT' : 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      if (response.ok) {
        loadProvenances()
        setCurrentView('list')
      } else {
        const errorData = await response.json()
        console.error('Error saving:', errorData)
      }
    } catch (error) {
      console.error('Error saving provenance:', error)
    }
  }

  const handleDelete = async () => {
    if (!deletingProvenance) return
    try {
      const response = await fetch(`${API_URL}/api/config/event-provenances/${deletingProvenance.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      if (response.ok) {
        loadProvenances()
        setShowDeleteModal(false)
        setDeletingProvenance(null)
      }
    } catch (error) {
      console.error('Error deleting provenance:', error)
    }
  }

  // Icon mapping
  const iconComponents: Record<string, React.ReactNode> = {
    'map-pin': <MapPin className="w-5 h-5" />,
    'microscope': <Microscope className="w-5 h-5" />,
    'user': <User className="w-5 h-5" />,
    'stethoscope': <Stethoscope className="w-5 h-5" />,
    'eye': <Eye className="w-5 h-5" />,
    'megaphone': <Megaphone className="w-5 h-5" />,
    'help': <HelpCircle className="w-5 h-5" />,
    'alert-triangle': <AlertTriangle className="w-5 h-5" />,
    'bell': <Bell className="w-5 h-5" />,
    'radio': <RadioIcon className="w-5 h-5" />,
    'phone': <Phone className="w-5 h-5" />,
    'mail': <Mail className="w-5 h-5" />,
    'globe': <Globe className="w-5 h-5" />,
    'building': <Building2 className="w-5 h-5" />,
    'users': <Users className="w-5 h-5" />,
    'clipboard': <ClipboardList className="w-5 h-5" />,
    'file-text': <FileText className="w-5 h-5" />,
    'shield': <Shield className="w-5 h-5" />,
    'activity': <Activity className="w-5 h-5" />,
    'target': <Target className="w-5 h-5" />,
  }

  const iconOptions = [
    { value: 'map-pin', label: 'Terrain', category: 'Localisation' },
    { value: 'microscope', label: 'Laboratoire', category: 'Analyse' },
    { value: 'user', label: 'Utilisateur', category: 'Personnes' },
    { value: 'users', label: 'Groupe', category: 'Personnes' },
    { value: 'stethoscope', label: 'Vétérinaire', category: 'Médical' },
    { value: 'eye', label: 'Surveillance', category: 'Observation' },
    { value: 'megaphone', label: 'Annonce', category: 'Communication' },
    { value: 'bell', label: 'Alerte', category: 'Communication' },
    { value: 'radio', label: 'Radio', category: 'Communication' },
    { value: 'phone', label: 'Téléphone', category: 'Communication' },
    { value: 'mail', label: 'Courrier', category: 'Communication' },
    { value: 'globe', label: 'International', category: 'Réseau' },
    { value: 'building', label: 'Institution', category: 'Organisation' },
    { value: 'clipboard', label: 'Rapport', category: 'Documents' },
    { value: 'file-text', label: 'Document', category: 'Documents' },
    { value: 'shield', label: 'Officiel', category: 'Sécurité' },
    { value: 'activity', label: 'Activité', category: 'Surveillance' },
    { value: 'target', label: 'Ciblé', category: 'Surveillance' },
    { value: 'alert-triangle', label: 'Alerte', category: 'Urgence' },
    { value: 'help', label: 'Autre', category: 'Divers' },
  ]

  const filteredIcons = iconOptions.filter(icon =>
    icon.label.toLowerCase().includes(iconSearch.toLowerCase()) ||
    icon.category.toLowerCase().includes(iconSearch.toLowerCase())
  )

  const getIconComponent = (iconName: string) => iconComponents[iconName] || <MapPin className="w-5 h-5" />

  // FORM VIEW
  if (currentView === 'form') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-slate-800">
            {editingProvenance ? 'Modifier la provenance' : 'Nouvelle provenance'}
          </h1>
          <button onClick={handleBack} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
            <input type="text" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Rapport de terrain"
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2} placeholder="Description de la source de signalement..."
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
          </div>

          {/* Couleur et Icône */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Couleur</label>
              <div className="flex items-center gap-3">
                <input type="color" value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer" />
                <input type="text" value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#6366f1"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 font-mono text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Icône</label>
              <div className="relative" ref={iconDropdownRef}>
                <button type="button" onClick={() => setShowIconDropdown(!showIconDropdown)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span style={{ color: formData.color }}>{getIconComponent(formData.icon)}</span>
                    <span className="text-slate-700">{iconOptions.find(i => i.value === formData.icon)?.label || 'Sélectionner'}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showIconDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showIconDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg">
                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={iconSearch} onChange={(e) => setIconSearch(e.target.value)}
                          placeholder="Rechercher une icône..."
                          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500" />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2">
                      {filteredIcons.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-slate-500 text-center">Aucune icône trouvée</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-1">
                          {filteredIcons.map(icon => (
                            <button key={icon.value} type="button"
                              onClick={() => { setFormData({ ...formData, icon: icon.value }); setShowIconDropdown(false); setIconSearch('') }}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                                formData.icon === icon.value ? 'bg-primary-100 text-primary-700' : 'hover:bg-slate-50 text-slate-700'
                              }`}>
                              <span style={{ color: formData.color }}>{getIconComponent(icon.value)}</span>
                              <span className="text-sm truncate">{icon.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-medium text-slate-800">Provenance active</p>
              <p className="text-sm text-slate-500">Les provenances inactives ne sont pas disponibles à la sélection</p>
            </div>
            <button type="button" onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`w-12 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-primary-600' : 'bg-slate-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button onClick={handleBack} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50">
              Annuler
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 flex items-center gap-2">
              <Save className="w-4 h-4" /> {editingProvenance ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Provenances des événements</h1>
          <p className="text-slate-500">Gérez les sources de signalement des événements sanitaires</p>
        </div>
        <button onClick={handleCreate} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvelle provenance
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une provenance..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-slate-600">Afficher inactifs</span>
          </label>
        </div>
      </div>

      {/* Provenances Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredProvenances.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 mb-4">Aucune provenance trouvée</p>
          <button onClick={handleCreate} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700">
            Créer une provenance
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedProvenances.map(p => (
            <div key={p.id} className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group ${!p.isActive ? 'opacity-60' : ''}`}>
              <div className="h-2" style={{ backgroundColor: p.color }} />
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${p.color}20`, color: p.color }}>
                      {getIconComponent(p.icon)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{p.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{p.code}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                {p.description && (
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{p.description}</p>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-xs text-slate-500">{p.color}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setDeletingProvenance(p); setShowDeleteModal(true) }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modern Pagination */}
      {totalItems > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-500">
                Affichage de <span className="font-semibold text-slate-700">{startIndex + 1}</span> à{' '}
                <span className="font-semibold text-slate-700">{Math.min(endIndex, totalItems)}</span> sur{' '}
                <span className="font-semibold text-slate-700">{totalItems}</span> provenances
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Afficher</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPageNum(1); }}
                  className="px-2 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
                <span className="text-sm text-slate-500">par page</span>
              </div>
            </div>

            {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPageNum(1)}
                disabled={currentPageNum === 1}
                className="flex items-center p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPageNum(p => Math.max(1, p - 1))}
                disabled={currentPageNum === 1}
                className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (totalPages <= 7) return true
                    if (page === 1 || page === totalPages) return true
                    if (Math.abs(page - currentPageNum) <= 1) return true
                    return false
                  })
                  .map((page, idx, arr) => {
                    const showEllipsis = idx > 0 && page - arr[idx - 1] > 1
                    return (
                      <div key={page} className="flex items-center">
                        {showEllipsis && <span className="px-2 text-slate-400">...</span>}
                        <button
                          onClick={() => setCurrentPageNum(page)}
                          className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all ${
                            currentPageNum === page
                              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    )
                  })}
              </div>
              <button
                onClick={() => setCurrentPageNum(p => Math.min(totalPages, p + 1))}
                disabled={currentPageNum === totalPages}
                className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPageNum(totalPages)}
                disabled={currentPageNum === totalPages}
                className="flex items-center p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingProvenance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Supprimer la provenance</h3>
            <p className="text-slate-500 mb-6">Supprimer "{deletingProvenance.name}" ? Cette action est irréversible.</p>
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
   KNOWLEDGE BASE PAGE
   ============================================ */
interface KnowledgeCategory {
  id: string
  code: string
  name: string
  description?: string
  icon?: string
  color?: string
  articleCount?: number
  isActive: boolean
}

interface KnowledgeTag {
  id: string
  name: string
  slug: string
  color: string
  usageCount: number
}

interface KnowledgeArticle {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  categoryId?: string
  categoryName?: string
  coverImage?: string
  isPublished: boolean
  isFeatured: boolean
  isPinned: boolean
  viewCount: number
  likeCount: number
  commentCount: number
  authorName?: string
  createdAt: string
  updatedAt: string
  tags?: KnowledgeTag[]
}

function KnowledgeBasePage() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  // View states
  const [currentView, setCurrentView] = useState<'list' | 'detail' | 'form'>('list')
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [categories, setCategories] = useState<KnowledgeCategory[]>([])
  const [tags, setTags] = useState<KnowledgeTag[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showDrafts, setShowDrafts] = useState(false)

  // Pagination
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)
  const [totalArticles, setTotalArticles] = useState(0)

  // Form state
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null)
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    categoryId: '',
    isPublished: false,
    isFeatured: false
  })

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingArticle, setDeletingArticle] = useState<KnowledgeArticle | null>(null)

  const getHeaders = () => {
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    return { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
  }

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/knowledge/categories`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        const cats = data.data || data || []
        setCategories(cats.map((c: any) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          description: c.description,
          icon: c.icon,
          color: c.color || '#6366f1',
          articleCount: c.article_count || c.articleCount || 0,
          isActive: c.is_active ?? true
        })))
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  // Load tags
  const loadTags = async () => {
    try {
      const response = await fetch(`${API_URL}/api/knowledge/tags`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        const tagList = data.data || data || []
        setTags(tagList.map((t: any) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          color: t.color || '#6366f1',
          usageCount: t.usage_count || t.usageCount || 0
        })))
      }
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  }

  // Load articles
  const loadArticles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', currentPageNum.toString())
      params.append('limit', itemsPerPage.toString())
      if (!showDrafts) params.append('isPublished', 'true')
      if (selectedCategory) params.append('categoryId', selectedCategory)
      if (selectedTag) params.append('tagId', selectedTag)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`${API_URL}/api/knowledge/articles?${params}`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        const result = data.data || data || {}
        const articleList = result.articles || []
        setArticles(articleList.map((a: any) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          content: a.content,
          excerpt: a.excerpt,
          categoryId: a.category_id,
          categoryName: a.category_name,
          coverImage: a.cover_image,
          isPublished: a.is_published,
          isFeatured: a.is_featured,
          isPinned: a.is_pinned,
          viewCount: a.view_count || 0,
          likeCount: a.like_count || 0,
          commentCount: a.comment_count || 0,
          authorName: a.author_name,
          createdAt: a.created_at,
          updatedAt: a.updated_at
        })))
        setTotalArticles(result.pagination?.total || articleList.length)
      }
    } catch (error) {
      console.error('Error loading articles:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    loadTags()
  }, [])

  useEffect(() => {
    loadArticles()
  }, [currentPageNum, itemsPerPage, selectedCategory, selectedTag, showDrafts, searchTerm])

  useEffect(() => {
    setCurrentPageNum(1)
  }, [searchTerm, selectedCategory, selectedTag, showDrafts])

  const totalPages = Math.ceil(totalArticles / itemsPerPage)

  const handleViewArticle = async (article: KnowledgeArticle) => {
    try {
      const response = await fetch(`${API_URL}/api/knowledge/articles/${article.id}`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        const a = data.data || data
        setSelectedArticle({
          ...article,
          content: a.content,
          tags: a.tags?.map((t: any) => ({ id: t.id, name: t.name, slug: t.slug, color: t.color, usageCount: 0 })) || []
        })
        setCurrentView('detail')
      }
    } catch (error) {
      console.error('Error loading article:', error)
    }
  }

  const handleCreateArticle = () => {
    setEditingArticle(null)
    setArticleForm({ title: '', content: '', excerpt: '', categoryId: '', isPublished: false, isFeatured: false })
    setCurrentView('form')
  }

  const handleEditArticle = (article: KnowledgeArticle) => {
    setEditingArticle(article)
    setArticleForm({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || '',
      categoryId: article.categoryId || '',
      isPublished: article.isPublished,
      isFeatured: article.isFeatured
    })
    setCurrentView('form')
  }

  const handleSaveArticle = async () => {
    if (!articleForm.title || !articleForm.content) return
    try {
      const slug = editingArticle?.slug || articleForm.title
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      const payload = {
        title: articleForm.title,
        slug,
        content: articleForm.content,
        excerpt: articleForm.excerpt || null,
        categoryId: articleForm.categoryId || null,
        isPublished: articleForm.isPublished,
        isFeatured: articleForm.isFeatured
      }
      const url = editingArticle
        ? `${API_URL}/api/knowledge/articles/${editingArticle.id}`
        : `${API_URL}/api/knowledge/articles`
      const response = await fetch(url, {
        method: editingArticle ? 'PUT' : 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      if (response.ok) {
        loadArticles()
        setCurrentView('list')
      } else {
        const errorData = await response.json()
        console.error('Error saving:', errorData)
      }
    } catch (error) {
      console.error('Error saving article:', error)
    }
  }

  const handleDeleteArticle = async () => {
    if (!deletingArticle) return
    try {
      const response = await fetch(`${API_URL}/api/knowledge/articles/${deletingArticle.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      if (response.ok) {
        loadArticles()
        setShowDeleteModal(false)
        setDeletingArticle(null)
      }
    } catch (error) {
      console.error('Error deleting article:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // ARTICLE DETAIL VIEW
  if (currentView === 'detail' && selectedArticle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentView('list')} className="flex items-center gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => handleEditArticle(selectedArticle)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 flex items-center gap-2">
              <Edit3 className="w-4 h-4" /> Modifier
            </button>
          </div>
        </div>

        <article className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
              {selectedArticle.categoryName && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                  {selectedArticle.categoryName}
                </span>
              )}
              {selectedArticle.isFeatured && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                  <Star className="w-3 h-3" /> À la une
                </span>
              )}
              {!selectedArticle.isPublished && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">Brouillon</span>
              )}
            </div>

            <h1 className="text-3xl font-display font-bold text-slate-800 mb-4">{selectedArticle.title}</h1>

            <div className="flex items-center gap-6 text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
              <span className="flex items-center gap-1"><User className="w-4 h-4" /> {selectedArticle.authorName || 'Anonyme'}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatDate(selectedArticle.createdAt)}</span>
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {selectedArticle.viewCount} vues</span>
              <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {selectedArticle.likeCount}</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {selectedArticle.commentCount} commentaires</span>
            </div>

            {selectedArticle.tags && selectedArticle.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedArticle.tags.map(tag => (
                  <span key={tag.id} className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: `${tag.color}20`, color: tag.color }}>
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            <div className="prose prose-slate max-w-none">
              <div dangerouslySetInnerHTML={{ __html: selectedArticle.content.replace(/\n/g, '<br />') }} />
            </div>
          </div>
        </article>
      </div>
    )
  }

  // ARTICLE FORM VIEW
  if (currentView === 'form') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-slate-800">
            {editingArticle ? 'Modifier l\'article' : 'Nouvel article'}
          </h1>
          <button onClick={() => setCurrentView('list')} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Titre *</label>
            <input type="text" value={articleForm.title}
              onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
              placeholder="Titre de l'article"
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Résumé</label>
            <textarea value={articleForm.excerpt}
              onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
              rows={2} placeholder="Bref résumé de l'article..."
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
            <select value={articleForm.categoryId}
              onChange={(e) => setArticleForm({ ...articleForm, categoryId: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500">
              <option value="">Aucune catégorie</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contenu *</label>
            <textarea value={articleForm.content}
              onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
              rows={15} placeholder="Contenu de l'article..."
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 font-mono text-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-medium text-slate-800">Publier</p>
                <p className="text-sm text-slate-500">Rendre l'article visible</p>
              </div>
              <button type="button" onClick={() => setArticleForm({ ...articleForm, isPublished: !articleForm.isPublished })}
                className={`w-12 h-6 rounded-full transition-colors ${articleForm.isPublished ? 'bg-primary-600' : 'bg-slate-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${articleForm.isPublished ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-medium text-slate-800">À la une</p>
                <p className="text-sm text-slate-500">Mettre en avant</p>
              </div>
              <button type="button" onClick={() => setArticleForm({ ...articleForm, isFeatured: !articleForm.isFeatured })}
                className={`w-12 h-6 rounded-full transition-colors ${articleForm.isFeatured ? 'bg-amber-500' : 'bg-slate-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${articleForm.isFeatured ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button onClick={() => setCurrentView('list')} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50">
              Annuler
            </button>
            <button onClick={handleSaveArticle} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 flex items-center gap-2">
              <Save className="w-4 h-4" /> {editingArticle ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Base de connaissances</h1>
          <p className="text-slate-500">Documentation et ressources techniques</p>
        </div>
        <button onClick={handleCreateArticle} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvel article
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Categories & Tags */}
        <div className="lg:col-span-1 space-y-4">
          {/* Categories */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Folder className="w-4 h-4 text-primary-600" /> Catégories
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !selectedCategory ? 'bg-primary-100 text-primary-700' : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                Toutes les catégories
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                    selectedCategory === cat.id ? 'bg-primary-100 text-primary-700' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </span>
                  <span className="text-xs text-slate-400">{cat.articleCount}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary-600" /> Tags populaires
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 10).map(tag => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    selectedTag === tag.id
                      ? 'ring-2 ring-offset-1'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                    ...(selectedTag === tag.id && { ringColor: tag.color })
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search & Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un article..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showDrafts} onChange={(e) => setShowDrafts(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-slate-600">Inclure brouillons</span>
              </label>
            </div>
          </div>

          {/* Articles Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 mb-4">Aucun article trouvé</p>
              <button onClick={handleCreateArticle} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700">
                Créer un article
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articles.map(article => (
                <div key={article.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      {article.categoryName && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                          {article.categoryName}
                        </span>
                      )}
                      {article.isFeatured && (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      )}
                      {!article.isPublished && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-500">Brouillon</span>
                      )}
                    </div>

                    <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors cursor-pointer"
                        onClick={() => handleViewArticle(article)}>
                      {article.title}
                    </h3>

                    {article.excerpt && (
                      <p className="text-sm text-slate-500 mb-4 line-clamp-2">{article.excerpt}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {article.viewCount}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {article.likeCount}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {article.commentCount}</span>
                      </div>
                      <span>{formatDate(article.createdAt)}</span>
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{article.authorName || 'Anonyme'}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleViewArticle(article)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEditArticle(article)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setDeletingArticle(article); setShowDeleteModal(true) }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalArticles > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-500">
                    <span className="font-semibold text-slate-700">{totalArticles}</span> article(s)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Afficher</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPageNum(1); }}
                      className="px-2 py-1 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value={6}>6</option>
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                    </select>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPageNum(1)} disabled={currentPageNum === 1}
                      className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </button>
                    <button onClick={() => setCurrentPageNum(p => Math.max(1, p - 1))} disabled={currentPageNum === 1}
                      className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 text-sm text-slate-600">
                      Page {currentPageNum} / {totalPages}
                    </span>
                    <button onClick={() => setCurrentPageNum(p => Math.min(totalPages, p + 1))} disabled={currentPageNum === totalPages}
                      className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => setCurrentPageNum(totalPages)} disabled={currentPageNum === totalPages}
                      className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && deletingArticle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Supprimer l'article</h3>
            <p className="text-slate-500 mb-6">Supprimer "{deletingArticle.title}" ? Cette action est irréversible.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50">
                Annuler
              </button>
              <button onClick={handleDeleteArticle} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700">
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
/* ============================================
   REPORTS PAGE
   ============================================ */
interface ReportData {
  id: string
  name: string
  description?: string
  type: 'events' | 'procedures' | 'forms' | 'users' | 'knowledge' | 'custom'
  parameters?: Record<string, unknown>[]
  columns?: { key: string; label: string; type: string }[]
  filters?: Record<string, unknown>[]
  isTemplate: boolean
  isScheduled: boolean
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    dayOfWeek?: number
    dayOfMonth?: number
    time: string
    recipients: string[]
    format: 'pdf' | 'excel' | 'csv'
    isActive: boolean
  }
  lastRunAt?: string
  createdBy?: string
  createdAt: string
}

const REPORT_TYPES = [
  { value: 'events', label: 'Événements', icon: Activity, color: 'text-red-600 bg-red-100' },
  { value: 'procedures', label: 'Procédures', icon: ClipboardList, color: 'text-blue-600 bg-blue-100' },
  { value: 'forms', label: 'Formulaires', icon: FileText, color: 'text-green-600 bg-green-100' },
  { value: 'users', label: 'Utilisateurs', icon: Users, color: 'text-purple-600 bg-purple-100' },
  { value: 'knowledge', label: 'Base de connaissance', icon: BookOpen, color: 'text-amber-600 bg-amber-100' },
  { value: 'custom', label: 'Personnalisé', icon: Settings, color: 'text-slate-600 bg-slate-100' },
]

const SCHEDULE_FREQUENCIES = [
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'quarterly', label: 'Trimestriel' },
]

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
]

function ReportsPage() {
  const { t } = useTranslation()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  // State
  const [currentView, setCurrentView] = useState<'list' | 'form' | 'run'>('list')
  const [reports, setReports] = useState<ReportData[]>([])
  const [templates, setTemplates] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterScheduled, setFilterScheduled] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'reports' | 'templates' | 'scheduled'>('reports')

  // Edit state
  const [editingReport, setEditingReport] = useState<ReportData | null>(null)
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [reportResult, setReportResult] = useState<{
    reportName: string
    generatedAt: string
    data: Record<string, unknown>[]
    summary: Record<string, number>
  } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'events' as ReportData['type'],
    isTemplate: false,
    columns: [] as { key: string; label: string; type: string }[],
    filters: [] as Record<string, unknown>[],
  })

  // Schedule form state
  const [scheduleData, setScheduleData] = useState({
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'quarterly',
    dayOfWeek: 1,
    dayOfMonth: 1,
    time: '09:00',
    recipients: '',
    format: 'pdf' as 'pdf' | 'excel' | 'csv',
    isActive: true,
  })

  // Run parameters state
  const [runParams, setRunParams] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    format: 'pdf' as 'pdf' | 'excel' | 'csv',
  })

  // Load data
  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }

      const [reportsRes, templatesRes] = await Promise.all([
        fetch(`${API_URL}/api/analytics/reports?isTemplate=false`, { headers }),
        fetch(`${API_URL}/api/analytics/reports?isTemplate=true`, { headers }),
      ])

      if (reportsRes.ok) {
        const data = await reportsRes.json()
        setReports(data.data || [])
      }
      if (templatesRes.ok) {
        const data = await templatesRes.json()
        setTemplates(data.data || [])
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReport = () => {
    setEditingReport(null)
    setFormData({
      name: '',
      description: '',
      type: 'events',
      isTemplate: activeTab === 'templates',
      columns: [],
      filters: [],
    })
    setCurrentView('form')
  }

  const handleEditReport = (report: ReportData) => {
    setEditingReport(report)
    setFormData({
      name: report.name,
      description: report.description || '',
      type: report.type,
      isTemplate: report.isTemplate,
      columns: report.columns || [],
      filters: report.filters || [],
    })
    setCurrentView('form')
  }

  const handleSaveReport = async () => {
    if (!formData.name.trim()) return
    setSaving(true)
    try {
      const token = localStorage.getItem('authToken')
      const url = editingReport
        ? `${API_URL}/api/analytics/reports/${editingReport.id}`
        : `${API_URL}/api/analytics/reports`
      const method = editingReport ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          type: formData.type,
          isTemplate: formData.isTemplate,
          columns: formData.columns,
          filters: formData.filters,
        }),
      })

      if (response.ok) {
        await loadReports()
        setCurrentView('list')
      }
    } catch (error) {
      console.error('Error saving report:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteReport = async () => {
    if (!selectedReport) return
    setSaving(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/analytics/reports/${selectedReport.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        await loadReports()
        setShowDeleteModal(false)
        setSelectedReport(null)
      }
    } catch (error) {
      console.error('Error deleting report:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleRunReport = async (report: ReportData) => {
    setSelectedReport(report)
    setRunParams({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      format: 'pdf',
    })
    setCurrentView('run')
  }

  const executeReport = async () => {
    if (!selectedReport) return
    setRunning(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/analytics/reports/${selectedReport.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(runParams),
      })

      if (response.ok) {
        const data = await response.json()
        setReportResult(data.data)
      }
    } catch (error) {
      console.error('Error running report:', error)
    } finally {
      setRunning(false)
    }
  }

  const handleExportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!selectedReport) return
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/analytics/export/report/${selectedReport.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ format }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data?.downloadUrl) {
          window.open(`${API_URL}${data.data.downloadUrl}`, '_blank')
        }
      }
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  }

  const handleScheduleReport = (report: ReportData) => {
    setSelectedReport(report)
    if (report.schedule) {
      setScheduleData({
        frequency: report.schedule.frequency,
        dayOfWeek: report.schedule.dayOfWeek || 1,
        dayOfMonth: report.schedule.dayOfMonth || 1,
        time: report.schedule.time,
        recipients: report.schedule.recipients.join(', '),
        format: report.schedule.format,
        isActive: report.schedule.isActive,
      })
    } else {
      setScheduleData({
        frequency: 'weekly',
        dayOfWeek: 1,
        dayOfMonth: 1,
        time: '09:00',
        recipients: '',
        format: 'pdf',
        isActive: true,
      })
    }
    setShowScheduleModal(true)
  }

  const saveSchedule = async () => {
    if (!selectedReport) return
    setSaving(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/analytics/reports/${selectedReport.id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          frequency: scheduleData.frequency,
          dayOfWeek: scheduleData.frequency === 'weekly' ? scheduleData.dayOfWeek : undefined,
          dayOfMonth: scheduleData.frequency === 'monthly' || scheduleData.frequency === 'quarterly' ? scheduleData.dayOfMonth : undefined,
          time: scheduleData.time,
          recipients: scheduleData.recipients.split(',').map(r => r.trim()).filter(Boolean),
          format: scheduleData.format,
          isActive: scheduleData.isActive,
        }),
      })

      if (response.ok) {
        await loadReports()
        setShowScheduleModal(false)
      }
    } catch (error) {
      console.error('Error scheduling report:', error)
    } finally {
      setSaving(false)
    }
  }

  const removeSchedule = async () => {
    if (!selectedReport) return
    setSaving(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/analytics/reports/${selectedReport.id}/schedule`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        await loadReports()
        setShowScheduleModal(false)
      }
    } catch (error) {
      console.error('Error removing schedule:', error)
    } finally {
      setSaving(false)
    }
  }

  // Filter reports
  const getFilteredData = () => {
    let data = activeTab === 'templates' ? templates : reports
    if (activeTab === 'scheduled') {
      data = reports.filter(r => r.isScheduled)
    }

    return data.filter(report => {
      const matchesSearch = !searchTerm ||
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = !filterType || report.type === filterType
      const matchesScheduled = !filterScheduled ||
        (filterScheduled === 'scheduled' && report.isScheduled) ||
        (filterScheduled === 'not-scheduled' && !report.isScheduled)
      return matchesSearch && matchesType && matchesScheduled
    })
  }

  const getReportTypeInfo = (type: string) => {
    return REPORT_TYPES.find(t => t.value === type) || REPORT_TYPES[5]
  }

  const filteredData = getFilteredData()

  // Report Form View
  if (currentView === 'form') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentView('list')}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800">
              {editingReport ? 'Modifier le rapport' : 'Nouveau rapport'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {formData.isTemplate ? 'Ce rapport sera enregistré comme modèle' : 'Créer un nouveau rapport'}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nom du rapport *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: Rapport mensuel des événements"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type de rapport *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ReportData['type'] })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {REPORT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Description détaillée du rapport..."
              />
            </div>
          </div>

          {/* Report Type Specific Options */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Options du rapport</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData.type === 'events' && (
                <>
                  <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input type="checkbox" className="w-5 h-5 text-primary-600 rounded" defaultChecked />
                    <span className="text-sm text-slate-700">Inclure les statistiques</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input type="checkbox" className="w-5 h-5 text-primary-600 rounded" defaultChecked />
                    <span className="text-sm text-slate-700">Grouper par catégorie</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input type="checkbox" className="w-5 h-5 text-primary-600 rounded" />
                    <span className="text-sm text-slate-700">Inclure graphiques</span>
                  </label>
                </>
              )}
              {formData.type === 'users' && (
                <>
                  <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input type="checkbox" className="w-5 h-5 text-primary-600 rounded" defaultChecked />
                    <span className="text-sm text-slate-700">Activité des utilisateurs</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input type="checkbox" className="w-5 h-5 text-primary-600 rounded" />
                    <span className="text-sm text-slate-700">Connexions récentes</span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Template option */}
          <div className="border-t border-slate-200 pt-6">
            <label className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl cursor-pointer hover:bg-primary-100 transition-colors">
              <input
                type="checkbox"
                checked={formData.isTemplate}
                onChange={(e) => setFormData({ ...formData, isTemplate: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded"
              />
              <div>
                <span className="text-sm font-medium text-primary-800">Enregistrer comme modèle</span>
                <p className="text-xs text-primary-600 mt-0.5">Ce rapport pourra être réutilisé pour créer d'autres rapports</p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => setCurrentView('list')}
              className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveReport}
              disabled={saving || !formData.name.trim()}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Run Report View
  if (currentView === 'run' && selectedReport) {
    const typeInfo = getReportTypeInfo(selectedReport.type)
    const TypeIcon = typeInfo.icon

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setCurrentView('list'); setReportResult(null) }}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold text-slate-800">
              {selectedReport.name}
            </h1>
            <p className="text-slate-500 text-sm mt-1">{selectedReport.description}</p>
          </div>
          <div className={`p-3 rounded-xl ${typeInfo.color}`}>
            <TypeIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Parameters */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Paramètres</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date de début
                </label>
                <input
                  type="date"
                  value={runParams.startDate}
                  onChange={(e) => setRunParams({ ...runParams, startDate: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={runParams.endDate}
                  onChange={(e) => setRunParams({ ...runParams, endDate: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Format d'export
                </label>
                <select
                  value={runParams.format}
                  onChange={(e) => setRunParams({ ...runParams, format: e.target.value as 'pdf' | 'excel' | 'csv' })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>

              <button
                onClick={executeReport}
                disabled={running}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {running ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Générer le rapport
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Résultats</h3>
              {reportResult && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportReport('pdf')}
                    className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={() => handleExportReport('excel')}
                    className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Excel
                  </button>
                  <button
                    onClick={() => handleExportReport('csv')}
                    className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                </div>
              )}
            </div>

            {!reportResult ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500">Configurez les paramètres et cliquez sur "Générer" pour voir les résultats</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(reportResult.summary).map(([key, value]) => (
                    <div key={key} className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Generated info */}
                <div className="flex items-center gap-4 text-sm text-slate-500 border-t border-slate-200 pt-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Généré le {new Date(reportResult.generatedAt).toLocaleString('fr-FR')}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {reportResult.data.length} lignes
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">{t('reports.title', 'Rapports')}</h1>
          <p className="text-slate-500 text-sm mt-1">Générez et planifiez des rapports personnalisés</p>
        </div>
        <button
          onClick={handleCreateReport}
          className="px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouveau rapport
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'reports' ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Mes rapports
          <span className="ml-2 px-2 py-0.5 text-xs bg-slate-100 rounded-full">{reports.length}</span>
          {activeTab === 'reports' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'templates' ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Modèles
          <span className="ml-2 px-2 py-0.5 text-xs bg-slate-100 rounded-full">{templates.length}</span>
          {activeTab === 'templates' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'scheduled' ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Planifiés
          <span className="ml-2 px-2 py-0.5 text-xs bg-slate-100 rounded-full">
            {reports.filter(r => r.isScheduled).length}
          </span>
          {activeTab === 'scheduled' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un rapport..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Tous les types</option>
          {REPORT_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        <button
          onClick={loadReports}
          className="p-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          title="Actualiser"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {searchTerm ? 'Aucun rapport trouvé' : 'Aucun rapport'}
          </h3>
          <p className="text-slate-500 mb-6">
            {searchTerm
              ? 'Essayez de modifier vos critères de recherche'
              : activeTab === 'templates'
                ? 'Créez votre premier modèle de rapport'
                : 'Créez votre premier rapport pour commencer'}
          </p>
          <button
            onClick={handleCreateReport}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Créer un rapport
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((report) => {
            const typeInfo = getReportTypeInfo(report.type)
            const TypeIcon = typeInfo.icon

            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${typeInfo.color}`}>
                    <TypeIcon className="w-6 h-6" />
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {selectedReport?.id === report.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-10">
                        <button
                          onClick={() => { handleRunReport(report); setSelectedReport(null) }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Exécuter
                        </button>
                        <button
                          onClick={() => { handleEditReport(report); setSelectedReport(null) }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          Modifier
                        </button>
                        <button
                          onClick={() => { handleScheduleReport(report); setSelectedReport(null) }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Calendar className="w-4 h-4" />
                          Planifier
                        </button>
                        <hr className="my-2 border-slate-200" />
                        <button
                          onClick={() => setShowDeleteModal(true)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-slate-800 mb-1">{report.name}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{report.description || 'Pas de description'}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg">
                    {typeInfo.label}
                  </span>
                  {report.isScheduled && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-lg flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Planifié
                    </span>
                  )}
                  {report.isTemplate && (
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded-lg">
                      Modèle
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100">
                  <span>Créé le {new Date(report.createdAt).toLocaleDateString('fr-FR')}</span>
                  {report.lastRunAt && (
                    <span>Exécuté le {new Date(report.lastRunAt).toLocaleDateString('fr-FR')}</span>
                  )}
                </div>

                <button
                  onClick={() => handleRunReport(report)}
                  className="w-full mt-4 px-4 py-2.5 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Exécuter
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">
              Supprimer le rapport
            </h3>
            <p className="text-slate-500 text-center mb-6">
              Êtes-vous sûr de vouloir supprimer le rapport "{selectedReport.name}" ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setSelectedReport(null) }}
                className="flex-1 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteReport}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Planifier le rapport</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Fréquence</label>
                <select
                  value={scheduleData.frequency}
                  onChange={(e) => setScheduleData({ ...scheduleData, frequency: e.target.value as typeof scheduleData.frequency })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {SCHEDULE_FREQUENCIES.map(freq => (
                    <option key={freq.value} value={freq.value}>{freq.label}</option>
                  ))}
                </select>
              </div>

              {scheduleData.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Jour de la semaine</label>
                  <select
                    value={scheduleData.dayOfWeek}
                    onChange={(e) => setScheduleData({ ...scheduleData, dayOfWeek: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {(scheduleData.frequency === 'monthly' || scheduleData.frequency === 'quarterly') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Jour du mois</label>
                  <select
                    value={scheduleData.dayOfMonth}
                    onChange={(e) => setScheduleData({ ...scheduleData, dayOfMonth: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {Array.from({ length: 28 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Heure d'exécution</label>
                <input
                  type="time"
                  value={scheduleData.time}
                  onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Format d'export</label>
                <select
                  value={scheduleData.format}
                  onChange={(e) => setScheduleData({ ...scheduleData, format: e.target.value as typeof scheduleData.format })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Destinataires (emails séparés par des virgules)
                </label>
                <textarea
                  value={scheduleData.recipients}
                  onChange={(e) => setScheduleData({ ...scheduleData, recipients: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>

              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleData.isActive}
                  onChange={(e) => setScheduleData({ ...scheduleData, isActive: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded"
                />
                <span className="text-sm text-slate-700">Activer la planification</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
              {selectedReport.isScheduled && (
                <button
                  onClick={removeSchedule}
                  disabled={saving}
                  className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  Supprimer planification
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveSchedule}
                disabled={saving}
                className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================
   EVENTS MAP PAGE
   ============================================ */

// Custom marker cluster group component
function MarkerClusterGroup({ children, events }: { children?: React.ReactNode; events: MapEventData[] }) {
  const map = useMap()

  useEffect(() => {
    const markers = (L as unknown as { markerClusterGroup: (options?: object) => L.MarkerClusterGroup }).markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster: L.MarkerCluster) => {
        const count = cluster.getChildCount()
        let size = 'small'
        if (count >= 10) size = 'medium'
        if (count >= 50) size = 'large'

        return L.divIcon({
          html: `<div class="cluster-marker cluster-${size}">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(40, 40),
        })
      },
    })

    events.forEach((event) => {
      if (event.latitude && event.longitude) {
        const severityColors: Record<string, string> = {
          critical: '#dc2626',
          high: '#ea580c',
          medium: '#eab308',
          low: '#22c55e',
        }
        const color = severityColors[event.severity] || '#6b7280'

        const customIcon = L.divIcon({
          html: `
            <div style="
              width: 30px;
              height: 30px;
              background: ${color};
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
          `,
          className: 'custom-event-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        })

        const marker = L.marker([event.latitude, event.longitude], { icon: customIcon })

        marker.bindPopup(`
          <div style="min-width: 200px; padding: 8px;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${event.title}</div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${event.code}</div>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
              <span style="
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
                background: ${color}20;
                color: ${color};
              ">${event.severity}</span>
              <span style="
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                background: #f1f5f9;
                color: #475569;
              ">${event.status}</span>
            </div>
            <div style="font-size: 12px; color: #64748b;">
              <strong>Lieu:</strong> ${event.location || 'Non spécifié'}
            </div>
            ${event.reportedAt ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
              Signalé le ${new Date(event.reportedAt).toLocaleDateString('fr-FR')}
            </div>` : ''}
          </div>
        `)

        markers.addLayer(marker)
      }
    })

    map.addLayer(markers)

    return () => {
      map.removeLayer(markers)
    }
  }, [map, events])

  return null
}

interface MapEventData {
  id: string
  code: string
  title: string
  description?: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: string
  location?: string
  latitude?: number
  longitude?: number
  reportedAt?: string
  category?: { name: string }
}

// Cameroon regions with approximate coordinates
const CAMEROON_REGIONS = [
  { name: 'Adamaoua', lat: 7.3364, lng: 13.5893 },
  { name: 'Centre', lat: 3.8683, lng: 11.5021 },
  { name: 'Est', lat: 4.1552, lng: 14.2505 },
  { name: 'Extrême-Nord', lat: 10.5916, lng: 14.2579 },
  { name: 'Littoral', lat: 4.0511, lng: 9.7679 },
  { name: 'Nord', lat: 8.5646, lng: 13.9571 },
  { name: 'Nord-Ouest', lat: 5.9631, lng: 10.1591 },
  { name: 'Ouest', lat: 5.4927, lng: 10.4176 },
  { name: 'Sud', lat: 2.8312, lng: 10.9076 },
  { name: 'Sud-Ouest', lat: 4.9276, lng: 9.2342 },
]

function EventsMapPage() {
  const { t } = useTranslation()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  // State
  const [events, setEvents] = useState<MapEventData[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterSeverity, setFilterSeverity] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterPeriod, setFilterPeriod] = useState<string>('30')
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [showLegend, setShowLegend] = useState(true)
  const [mapCenter] = useState<[number, number]>([7.3697, 12.3547]) // Cameroon center
  const [mapZoom] = useState(6)

  // Load events
  useEffect(() => {
    loadEvents()
    loadCategories()
  }, [filterStatus, filterSeverity, filterCategory, filterPeriod])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)
      if (filterSeverity) params.append('severity', filterSeverity)
      if (filterCategory) params.append('categoryId', filterCategory)
      if (filterPeriod) {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - parseInt(filterPeriod))
        params.append('startDate', startDate.toISOString())
      }
      params.append('pageSize', '500')

      const response = await fetch(`${API_URL}/api/events?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        // Generate random coordinates for events without coordinates (demo purposes)
        const eventsWithCoords = (data.data?.events || []).map((event: MapEventData) => {
          if (!event.latitude || !event.longitude) {
            const randomRegion = CAMEROON_REGIONS[Math.floor(Math.random() * CAMEROON_REGIONS.length)]
            return {
              ...event,
              latitude: randomRegion.lat + (Math.random() - 0.5) * 0.5,
              longitude: randomRegion.lng + (Math.random() - 0.5) * 0.5,
            }
          }
          return event
        })
        setEvents(eventsWithCoords)
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/config/categories?type=event`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  // Stats
  const stats = useMemo(() => {
    return {
      total: events.length,
      critical: events.filter(e => e.severity === 'critical').length,
      high: events.filter(e => e.severity === 'high').length,
      medium: events.filter(e => e.severity === 'medium').length,
      low: events.filter(e => e.severity === 'low').length,
    }
  }, [events])

  return (
    <div className="space-y-6">
      {/* Custom styles for cluster markers */}
      <style>{`
        .custom-cluster-icon {
          background: transparent !important;
        }
        .cluster-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-weight: 600;
          color: white;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .cluster-small {
          width: 36px;
          height: 36px;
          font-size: 12px;
          background: #3b82f6;
        }
        .cluster-medium {
          width: 44px;
          height: 44px;
          font-size: 14px;
          background: #f59e0b;
        }
        .cluster-large {
          width: 52px;
          height: 52px;
          font-size: 16px;
          background: #ef4444;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
        }
        .leaflet-popup-content {
          margin: 8px;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">
            {t('map.title', 'Carte des événements')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Visualisez la répartition géographique des événements sanitaires
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-slate-700">{stats.total} événements</span>
          </div>
          <button
            onClick={loadEvents}
            className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Actualiser"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">3 derniers mois</option>
            <option value="180">6 derniers mois</option>
            <option value="365">Cette année</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tous les statuts</option>
            <option value="REPORTED">Signalé</option>
            <option value="INVESTIGATING">En cours</option>
            <option value="CONFIRMED">Confirmé</option>
            <option value="RESOLVED">Résolu</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Toutes les sévérités</option>
            <option value="critical">Critique</option>
            <option value="high">Élevée</option>
            <option value="medium">Moyenne</option>
            <option value="low">Faible</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setFilterStatus('')
              setFilterSeverity('')
              setFilterCategory('')
              setFilterPeriod('30')
            }}
            className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ height: '600px' }}>
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-[1000] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        )}

        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MarkerClusterGroup events={events} />
        </MapContainer>

        {/* Legend */}
        {showLegend && (
          <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-[1000]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm text-slate-800">Légende</h4>
              <button
                onClick={() => setShowLegend(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-600" />
                <span className="text-xs text-slate-600">Critique ({stats.critical})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500" />
                <span className="text-xs text-slate-600">Élevée ({stats.high})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500" />
                <span className="text-xs text-slate-600">Moyenne ({stats.medium})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span className="text-xs text-slate-600">Faible ({stats.low})</span>
              </div>
            </div>
          </div>
        )}

        {/* Show legend button */}
        {!showLegend && (
          <button
            onClick={() => setShowLegend(true)}
            className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-[1000] hover:bg-slate-50 transition-colors"
            title="Afficher la légende"
          >
            <Layers className="w-5 h-5 text-slate-600" />
          </button>
        )}

        {/* Stats Panel */}
        <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-[1000]">
          <h4 className="font-semibold text-sm text-slate-800 mb-3">Statistiques</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
              <div className="text-xs text-slate-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
              <div className="text-xs text-slate-500">Critiques</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{stats.high}</div>
              <div className="text-xs text-slate-500">Élevés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{stats.medium}</div>
              <div className="text-xs text-slate-500">Moyens</div>
            </div>
          </div>
        </div>
      </div>

      {/* Region Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Répartition par région</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {CAMEROON_REGIONS.map(region => {
            const regionEvents = events.filter(e =>
              e.latitude && e.longitude &&
              Math.abs(e.latitude - region.lat) < 0.5 &&
              Math.abs(e.longitude - region.lng) < 0.5
            )
            return (
              <div key={region.name} className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{regionEvents.length}</div>
                <div className="text-xs text-slate-500 mt-1">{region.name}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

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
   WORK SCHEDULES PAGE
   ============================================ */
interface WorkScheduleData {
  id: string
  code: string
  name: string
  description?: string
  timezoneId: string
  startDate?: string
  endDate?: string
  isDefault: boolean
  isActive: boolean
  days: WorkScheduleDayData[]
}

interface WorkScheduleDayData {
  id?: string
  workScheduleId?: string
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  startTime: string
  endTime: string
  breakStartTime?: string
  breakEndTime?: string
  breakDurationMinutes?: number
  isWorkingDay: boolean
}

interface TimezoneData {
  id: string
  name: string
  offset: string
}

const DAYS_OF_WEEK_CONFIG = [
  { value: 1 as const, label: 'Lundi', short: 'Lun' },
  { value: 2 as const, label: 'Mardi', short: 'Mar' },
  { value: 3 as const, label: 'Mercredi', short: 'Mer' },
  { value: 4 as const, label: 'Jeudi', short: 'Jeu' },
  { value: 5 as const, label: 'Vendredi', short: 'Ven' },
  { value: 6 as const, label: 'Samedi', short: 'Sam' },
  { value: 0 as const, label: 'Dimanche', short: 'Dim' },
]

function WorkSchedulesPage() {
  const { t } = useTranslation()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  // View state
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list')
  const [schedules, setSchedules] = useState<WorkScheduleData[]>([])
  const [timezones, setTimezones] = useState<TimezoneData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Edit state
  const [editingSchedule, setEditingSchedule] = useState<WorkScheduleData | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingSchedule, setDeletingSchedule] = useState<WorkScheduleData | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    timezoneId: '',
    startDate: '',
    endDate: '',
    isDefault: false,
    isActive: true,
    enableNotifications: true,
    allowOvertime: false,
    flexibleHours: true,
    allowRemoteWork: true,
    requireClockIn: true,
    respectHolidays: true,
    days: DAYS_OF_WEEK_CONFIG.map(day => ({
      dayOfWeek: day.value,
      startTime: '08:00',
      endTime: '17:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
      breakDurationMinutes: 60,
      isWorkingDay: day.value !== 0 && day.value !== 6, // Weekend off by default
    }))
  })

  const getHeaders = () => {
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    return { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
  }

  const loadSchedules = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/config/work-schedules`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        const rawSchedules = data.data || data || []
        const transformed = rawSchedules.map((s: any) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          description: s.description,
          timezoneId: s.timezone_id || s.timezoneId,
          startDate: s.start_date || s.startDate,
          endDate: s.end_date || s.endDate,
          isDefault: s.is_default ?? s.isDefault ?? false,
          isActive: s.is_active ?? s.isActive ?? true,
          days: (s.days || []).map((d: any) => ({
            id: d.id,
            workScheduleId: d.work_schedule_id || d.workScheduleId,
            dayOfWeek: d.day_of_week ?? d.dayOfWeek,
            startTime: d.start_time || d.startTime || '08:00',
            endTime: d.end_time || d.endTime || '17:00',
            breakStartTime: d.break_start_time || d.breakStartTime,
            breakEndTime: d.break_end_time || d.breakEndTime,
            breakDurationMinutes: d.break_duration_minutes ?? d.breakDurationMinutes ?? 60,
            isWorkingDay: d.is_working_day ?? d.isWorkingDay ?? true,
          }))
        }))
        setSchedules(transformed)
      }
    } catch (error) {
      console.error('Error loading schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTimezones = async () => {
    try {
      const response = await fetch(`${API_URL}/api/config/timezones`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        setTimezones(data.data || data || [])
      }
    } catch (error) {
      console.error('Error loading timezones:', error)
    }
  }

  useEffect(() => {
    loadSchedules()
    loadTimezones()
  }, [])

  const filteredSchedules = schedules.filter(s => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return s.name.toLowerCase().includes(search) || s.code.toLowerCase().includes(search)
    }
    return true
  })

  const handleCreate = () => {
    setEditingSchedule(null)
    setFormData({
      code: '',
      name: '',
      description: '',
      timezoneId: timezones[0]?.id || '',
      startDate: '',
      endDate: '',
      isDefault: false,
      isActive: true,
      enableNotifications: true,
      allowOvertime: false,
      flexibleHours: true,
      allowRemoteWork: true,
      requireClockIn: true,
      respectHolidays: true,
      days: DAYS_OF_WEEK_CONFIG.map(day => ({
        dayOfWeek: day.value,
        startTime: '08:00',
        endTime: '17:00',
        breakStartTime: '12:00',
        breakEndTime: '13:00',
        breakDurationMinutes: 60,
        isWorkingDay: day.value !== 0 && day.value !== 6,
      }))
    })
    setCurrentView('form')
  }

  const handleEdit = (schedule: WorkScheduleData) => {
    setEditingSchedule(schedule)
    setFormData({
      code: schedule.code,
      name: schedule.name,
      description: schedule.description || '',
      timezoneId: schedule.timezoneId || timezones[0]?.id || '',
      startDate: schedule.startDate || '',
      endDate: schedule.endDate || '',
      isDefault: schedule.isDefault,
      isActive: schedule.isActive,
      enableNotifications: true,
      allowOvertime: false,
      flexibleHours: true,
      allowRemoteWork: true,
      requireClockIn: true,
      respectHolidays: true,
      days: DAYS_OF_WEEK_CONFIG.map(day => {
        const existingDay = schedule.days?.find(d => d.dayOfWeek === day.value)
        return existingDay || {
          dayOfWeek: day.value,
          startTime: '08:00',
          endTime: '17:00',
          breakStartTime: '12:00',
          breakEndTime: '13:00',
          breakDurationMinutes: 60,
          isWorkingDay: false,
        }
      })
    })
    setCurrentView('form')
  }

  const handleDuplicate = (schedule: WorkScheduleData) => {
    setEditingSchedule(null)
    setFormData({
      code: `${schedule.code}_COPY`,
      name: `${schedule.name} (copie)`,
      description: schedule.description || '',
      timezoneId: schedule.timezoneId || timezones[0]?.id || '',
      startDate: '',
      endDate: '',
      isDefault: false,
      isActive: true,
      enableNotifications: true,
      allowOvertime: false,
      flexibleHours: true,
      allowRemoteWork: true,
      requireClockIn: true,
      respectHolidays: true,
      days: DAYS_OF_WEEK_CONFIG.map(day => {
        const existingDay = schedule.days?.find(d => d.dayOfWeek === day.value)
        return existingDay ? { ...existingDay, id: undefined, workScheduleId: undefined } : {
          dayOfWeek: day.value,
          startTime: '08:00',
          endTime: '17:00',
          breakStartTime: '12:00',
          breakEndTime: '13:00',
          breakDurationMinutes: 60,
          isWorkingDay: false,
        }
      })
    })
    setCurrentView('form')
  }

  const handleBack = () => {
    setCurrentView('list')
    setEditingSchedule(null)
  }

  const handleDayChange = (dayIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => i === dayIndex ? { ...day, [field]: value } : day)
    }))
  }

  const handleSave = async () => {
    // Validation améliorée
    if (!formData.code || !formData.name) {
      console.error('Validation échouée: code ou nom manquant')
      alert('Veuillez remplir le code et le nom du planning')
      return
    }
    if (!formData.timezoneId) {
      console.error('Validation échouée: timezoneId manquant')
      alert('Veuillez sélectionner un fuseau horaire')
      return
    }
    try {
      setSaving(true)
      const payload = {
        code: formData.code,
        name: formData.name,
        description: formData.description || null,
        timezoneId: formData.timezoneId,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        isDefault: formData.isDefault,
        isActive: formData.isActive,
        days: formData.days.map(d => ({
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime,
          endTime: d.endTime,
          breakStartTime: d.breakStartTime || null,
          breakEndTime: d.breakEndTime || null,
          breakDurationMinutes: d.breakDurationMinutes || 60,
          isWorkingDay: d.isWorkingDay,
        }))
      }
      const url = editingSchedule
        ? `${API_URL}/api/config/work-schedules/${editingSchedule.id}`
        : `${API_URL}/api/config/work-schedules`
      const headers = getHeaders()
      console.log('=== SAVE WORK SCHEDULE ===')
      console.log('URL:', url)
      console.log('Method:', editingSchedule ? 'PUT' : 'POST')
      console.log('Headers:', headers)
      console.log('Payload:', JSON.stringify(payload, null, 2))
      const response = await fetch(url, {
        method: editingSchedule ? 'PUT' : 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      })
      console.log('Response status:', response.status)
      if (response.ok) {
        console.log('Save successful!')
        loadSchedules()
        setCurrentView('list')
      } else {
        const errorData = await response.json()
        console.error('Error saving:', errorData)
        alert(`Erreur: ${errorData.message || 'Erreur lors de la sauvegarde'}`)
      }
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Erreur réseau lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingSchedule) return
    try {
      const response = await fetch(`${API_URL}/api/config/work-schedules/${deletingSchedule.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      if (response.ok) {
        loadSchedules()
        setShowDeleteModal(false)
        setDeletingSchedule(null)
      }
    } catch (error) {
      console.error('Error deleting schedule:', error)
    }
  }

  const getWorkingDaysCount = (schedule: WorkScheduleData) => schedule.days?.filter(d => d.isWorkingDay).length || 0

  const getTypicalHours = (schedule: WorkScheduleData) => {
    const workingDay = schedule.days?.find(d => d.isWorkingDay)
    if (!workingDay) return 'Non défini'
    return `${workingDay.startTime} - ${workingDay.endTime}`
  }

  // List View
  if (currentView === 'list') {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800">Horaires de travail</h1>
            <p className="text-slate-500 mt-1">Configurez les plannings de travail de votre organisation</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Nouveau planning
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un planning..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-72 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">Aucun planning trouvé</h3>
            <p className="text-slate-500 mb-6">Créez votre premier planning de travail</p>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Créer un planning
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSchedules.map(schedule => (
              <div key={schedule.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all">
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800">{schedule.name}</h3>
                          {schedule.isDefault && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Par défaut
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-mono">{schedule.code}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${schedule.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {schedule.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  {schedule.description && (
                    <p className="mt-3 text-sm text-slate-500">{schedule.description}</p>
                  )}
                </div>

                {/* Schedule Preview */}
                <div className="p-5">
                  <div className="flex items-center gap-6 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      <span className="text-slate-600">{getWorkingDaysCount(schedule)} jours/sem</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      <span className="text-slate-600">{getTypicalHours(schedule)}</span>
                    </div>
                  </div>

                  {/* Days Preview */}
                  <div className="space-y-2">
                    {DAYS_OF_WEEK_CONFIG.slice(0, 5).map(day => {
                      const scheduleDay = schedule.days?.find(d => d.dayOfWeek === day.value)
                      const isWorking = scheduleDay?.isWorkingDay ?? false
                      return (
                        <div key={day.value} className="flex items-center gap-3">
                          <span className="w-8 text-xs font-medium text-slate-500">{day.short}</span>
                          <div className="flex-1 h-6 bg-slate-100 rounded relative overflow-hidden">
                            {isWorking && scheduleDay && (
                              <div
                                className="absolute top-1 bottom-1 rounded bg-gradient-to-r from-emerald-500 to-emerald-400"
                                style={{
                                  left: `${(parseInt(scheduleDay.startTime.split(':')[0]) / 24) * 100}%`,
                                  width: `${((parseInt(scheduleDay.endTime.split(':')[0]) - parseInt(scheduleDay.startTime.split(':')[0])) / 24) * 100}%`
                                }}
                              />
                            )}
                            {!isWorking && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] text-slate-400">Repos</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                  <div className="text-xs text-slate-500">
                    {schedule.startDate ? `${new Date(schedule.startDate).toLocaleDateString('fr-FR')}` : 'Permanent'}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDuplicate(schedule)}
                      className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                      title="Dupliquer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(schedule)}
                      className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setDeletingSchedule(schedule); setShowDeleteModal(true) }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && deletingSchedule && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Supprimer le planning</h3>
              <p className="text-slate-600 mb-6">
                Êtes-vous sûr de vouloir supprimer le planning "{deletingSchedule.name}" ? Cette action est irréversible.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeletingSchedule(null) }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Form View
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800">
              {editingSchedule ? 'Modifier le planning' : 'Nouveau planning de travail'}
            </h1>
            <p className="text-slate-500 mt-1">
              {editingSchedule ? 'Modifiez les informations du planning' : 'Configurez un nouveau planning de travail'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.code || !formData.name}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
            {editingSchedule ? 'Enregistrer' : 'Créer le planning'}
          </button>
        </div>
      </div>

      {/* Form - Full Width Two Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Basic Info & Options */}
        <div className="xl:col-span-1 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800">Informations générales</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="STANDARD_WEEK"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Semaine standard"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du planning..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Fuseau horaire</label>
                <select
                  value={formData.timezoneId}
                  onChange={(e) => setFormData({ ...formData, timezoneId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="">Sélectionner...</option>
                  {timezones.map(tz => (
                    <option key={tz.id} value={tz.id}>{tz.name} ({tz.offset})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Period Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800">Période de validité</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date de début</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date de fin</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <p className="text-xs text-slate-500">Laissez vide pour un planning permanent</p>
            </div>
          </div>

        </div>

        {/* Right Column - Days Configuration */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Configuration des jours</h3>
                  <p className="text-sm text-slate-500">Définissez les horaires pour chaque jour de la semaine</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Travail</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="text-slate-600">Pause</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <span className="text-slate-600">Repos</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {DAYS_OF_WEEK_CONFIG.map((day, index) => {
                const dayData = formData.days[index]
                return (
                  <div
                    key={day.value}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      dayData.isWorkingDay
                        ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Toggle */}
                      <button
                        type="button"
                        onClick={() => handleDayChange(index, 'isWorkingDay', !dayData.isWorkingDay)}
                        className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${
                          dayData.isWorkingDay ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                            dayData.isWorkingDay ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>

                      {/* Day Name */}
                      <div className="w-28 flex-shrink-0">
                        <span className={`font-semibold ${dayData.isWorkingDay ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {day.label}
                        </span>
                      </div>

                      {dayData.isWorkingDay ? (
                        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Début travail</label>
                            <input
                              type="time"
                              value={dayData.startTime}
                              onChange={(e) => handleDayChange(index, 'startTime', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Fin travail</label>
                            <input
                              type="time"
                              value={dayData.endTime}
                              onChange={(e) => handleDayChange(index, 'endTime', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Début pause</label>
                            <input
                              type="time"
                              value={dayData.breakStartTime || ''}
                              onChange={(e) => handleDayChange(index, 'breakStartTime', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Fin pause</label>
                            <input
                              type="time"
                              value={dayData.breakEndTime || ''}
                              onChange={(e) => handleDayChange(index, 'breakEndTime', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center">
                          <span className="text-slate-400 italic">Jour de repos</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Résumé du planning</span>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-slate-800">
                    {formData.days.filter(d => d.isWorkingDay).length} jours travaillés
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="font-medium text-slate-800">
                    {formData.days.filter(d => !d.isWorkingDay).length} jours de repos
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Options Section - Full Width at Bottom */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Options et paramètres avancés</h3>
            <p className="text-sm text-slate-500">Configurez les comportements et préférences du planning</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Option 1: Planning par défaut */}
          <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Planning par défaut</p>
                <p className="text-xs text-slate-500">Assigné aux nouveaux utilisateurs</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
              className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${
                formData.isDefault ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  formData.isDefault ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Option 2: Planning actif */}
          <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Planning actif</p>
                <p className="text-xs text-slate-500">Disponible pour assignation</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${
                formData.isActive ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  formData.isActive ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Option 3: Notifications */}
          <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Notifications</p>
                <p className="text-xs text-slate-500">Alerter les changements d'horaire</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, enableNotifications: !formData.enableNotifications })}
              className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${
                formData.enableNotifications ? 'bg-blue-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  formData.enableNotifications ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Option 4: Heures supplémentaires */}
          <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Heures supp.</p>
                <p className="text-xs text-slate-500">Autoriser le dépassement</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, allowOvertime: !formData.allowOvertime })}
              className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${
                formData.allowOvertime ? 'bg-purple-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  formData.allowOvertime ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Option 5: Flexibilité horaire */}
          <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-100 text-cyan-600">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Horaires flexibles</p>
                <p className="text-xs text-slate-500">Tolérance de +/- 30 min</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, flexibleHours: !formData.flexibleHours })}
              className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${
                formData.flexibleHours ? 'bg-cyan-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  formData.flexibleHours ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Option 6: Télétravail */}
          <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Télétravail</p>
                <p className="text-xs text-slate-500">Autoriser le travail à distance</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, allowRemoteWork: !formData.allowRemoteWork })}
              className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${
                formData.allowRemoteWork ? 'bg-rose-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  formData.allowRemoteWork ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Option 7: Pointage obligatoire */}
          <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-br from-slate-50 to-gray-100 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-200 text-slate-600">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Pointage requis</p>
                <p className="text-xs text-slate-500">Validation obligatoire</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, requireClockIn: !formData.requireClockIn })}
              className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${
                formData.requireClockIn ? 'bg-slate-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  formData.requireClockIn ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Option 8: Jours fériés */}
          <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-br from-yellow-50 to-lime-50 border border-yellow-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Jours fériés</p>
                <p className="text-xs text-slate-500">Respecter les jours fériés</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, respectHolidays: !formData.respectHolidays })}
              className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${
                formData.respectHolidays ? 'bg-yellow-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  formData.respectHolidays ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================
   SYSTEM CONFIG PAGE
   ============================================ */

interface SystemConfigData {
  id: string
  key: string
  value: string
  valueType: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'DATE'
  category: string
  description: string
  isEditable: boolean
  updatedAt?: string
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  GENERAL: { label: 'Général', icon: Settings, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  FILES: { label: 'Fichiers', icon: FileText, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  NOTIFICATIONS: { label: 'Notifications', icon: Bell, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  WORKFLOW: { label: 'Flux de travail', icon: RefreshCw, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  DISPLAY: { label: 'Affichage', icon: Eye, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
}

function SystemConfigPage() {
  const { t } = useTranslation()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const [settings, setSettings] = useState<SystemConfigData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const getHeaders = () => {
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    return { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
  }

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/config/settings`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        setSettings(data.data || [])
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleEdit = (setting: SystemConfigData) => {
    if (!setting.isEditable) return
    setEditingKey(setting.key)
    setEditValue(setting.value || '')
  }

  const handleCancel = () => {
    setEditingKey(null)
    setEditValue('')
  }

  const handleSave = async (key: string) => {
    try {
      setSaving(key)
      const response = await fetch(`${API_URL}/api/config/settings/${key}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ value: editValue })
      })
      if (response.ok) {
        loadSettings()
        setEditingKey(null)
        setEditValue('')
      } else {
        const errorData = await response.json()
        alert(`Erreur: ${errorData.message || 'Erreur lors de la sauvegarde'}`)
      }
    } catch (error) {
      console.error('Error saving setting:', error)
      alert('Erreur réseau lors de la sauvegarde')
    } finally {
      setSaving(null)
    }
  }

  const formatValue = (setting: SystemConfigData): string => {
    switch (setting.valueType) {
      case 'BOOLEAN':
        return setting.value === 'true' ? 'Oui' : 'Non'
      case 'DATE':
        return setting.value ? new Date(setting.value).toLocaleDateString('fr-FR') : '-'
      case 'INTEGER':
        return setting.value || '0'
      default:
        return setting.value || '-'
    }
  }

  const renderEditInput = (setting: SystemConfigData) => {
    switch (setting.valueType) {
      case 'BOOLEAN':
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        )
      case 'DATE':
        return (
          <input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        )
      case 'INTEGER':
        return (
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        )
      default:
        return (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        )
    }
  }

  // Group settings by category
  const groupedSettings = settings.reduce((acc, setting) => {
    const category = setting.category || 'GENERAL'
    if (!acc[category]) acc[category] = []
    acc[category].push(setting)
    return acc
  }, {} as Record<string, SystemConfigData[]>)

  // Filter settings
  const filteredCategories = Object.keys(groupedSettings).filter(category => {
    if (selectedCategory && category !== selectedCategory) return false
    if (searchTerm) {
      const hasMatch = groupedSettings[category].some(s =>
        s.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (!hasMatch) return false
    }
    return true
  })

  const getFilteredSettings = (category: string) => {
    if (!searchTerm) return groupedSettings[category]
    return groupedSettings[category].filter(s =>
      s.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const categories = Object.keys(groupedSettings)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800">Configuration système</h1>
            <p className="text-slate-500 mt-1">Gérez les paramètres globaux de l'application</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadSettings}
              className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mt-4 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un paramètre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tous
            </button>
            {categories.map(category => {
              const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.GENERAL
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {config.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-slate-500">Chargement des paramètres...</p>
          </div>
        </div>
      )}

      {/* Settings by Category */}
      {!loading && (
        <div className="space-y-6">
          {filteredCategories.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-2xl">
              <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Aucun paramètre trouvé</p>
            </div>
          )}

          {filteredCategories.map(category => {
            const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.GENERAL
            const CategoryIcon = config.icon
            const categorySettings = getFilteredSettings(category)

            return (
              <div key={category} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Category Header */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${config.bgColor} ${config.color}`}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-800">{config.label}</h2>
                      <p className="text-xs text-slate-500">{categorySettings.length} paramètre(s)</p>
                    </div>
                  </div>
                </div>

                {/* Settings List */}
                <div className="divide-y divide-slate-100">
                  {categorySettings.map(setting => (
                    <div
                      key={setting.key}
                      className={`px-6 py-4 ${setting.isEditable ? 'hover:bg-slate-50' : 'bg-slate-50/50'} transition-colors`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              {setting.key}
                            </code>
                            {!setting.isEditable && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                Verrouillé
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-1">{setting.description || 'Aucune description'}</p>
                        </div>

                        {editingKey === setting.key ? (
                          <div className="flex items-center gap-2 min-w-[300px]">
                            <div className="flex-1">
                              {renderEditInput(setting)}
                            </div>
                            <button
                              onClick={() => handleSave(setting.key)}
                              disabled={saving === setting.key}
                              className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                            >
                              {saving === setting.key ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={handleCancel}
                              className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className={`font-medium ${
                                setting.valueType === 'BOOLEAN'
                                  ? setting.value === 'true'
                                    ? 'text-emerald-600'
                                    : 'text-slate-500'
                                  : 'text-slate-800'
                              }`}>
                                {formatValue(setting)}
                              </p>
                              <p className="text-xs text-slate-400">
                                {setting.valueType}
                              </p>
                            </div>
                            {setting.isEditable && (
                              <button
                                onClick={() => handleEdit(setting)}
                                className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">À propos des paramètres système</p>
            <p className="mt-1">
              Les paramètres verrouillés ne peuvent être modifiés que par un administrateur système via la base de données.
              Les modifications prennent effet immédiatement.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================
   ANALYTICS PAGE
   ============================================ */

interface AnalyticsData {
  totalUsers: number
  activeUsers: number
  totalEvents: number
  upcomingEvents: number
  completedEvents: number
  totalProcedures: number
  activeProcedures: number
  totalForms: number
  formSubmissions: number
  totalArticles: number
  publishedArticles: number
}

interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: string
  resourceType: string
  resourceId: string
  details: string
  createdAt: string
}

function AnalyticsPage() {
  const { t } = useTranslation()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  // State
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AnalyticsData | null>(null)
  const [moduleStats, setModuleStats] = useState<ChartDataPoint[]>([])
  const [eventsByCategory, setEventsByCategory] = useState<ChartDataPoint[]>([])
  const [eventsBySeverity, setEventsBySeverity] = useState<ChartDataPoint[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'users' | 'activity'>('overview')

  // Export state
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const getHeaders = () => {
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    return { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
  }

  // Load analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        setLoading(true)

        const [statsRes, modulesRes, categoryRes, severityRes, activityRes] = await Promise.all([
          fetch(`${API_URL}/api/analytics/dashboard/stats`, { headers: getHeaders() }),
          fetch(`${API_URL}/api/analytics/dashboard/modules`, { headers: getHeaders() }),
          fetch(`${API_URL}/api/analytics/events/by-category`, { headers: getHeaders() }),
          fetch(`${API_URL}/api/analytics/events/by-severity`, { headers: getHeaders() }),
          fetch(`${API_URL}/api/analytics/activity/recent?limit=10`, { headers: getHeaders() }),
        ])

        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data.data)
        }

        if (modulesRes.ok) {
          const data = await modulesRes.json()
          setModuleStats(data.data || [])
        }

        if (categoryRes.ok) {
          const data = await categoryRes.json()
          setEventsByCategory(data.data || [])
        }

        if (severityRes.ok) {
          const data = await severityRes.json()
          setEventsBySeverity(data.data || [])
        }

        if (activityRes.ok) {
          const data = await activityRes.json()
          setRecentActivity(data.data || [])
        }

      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalyticsData()
  }, [selectedPeriod])

  // Close export dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Export dashboard data
  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setExporting(true)
    try {
      const response = await fetch(`${API_URL}/api/analytics/export/dashboard`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          format,
          period: selectedPeriod,
          includeCharts: true,
          includeActivity: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        // In a real implementation, this would trigger a file download
        alert(`Export ${format.toUpperCase()} généré avec succès!\n\nLien: ${data.data?.downloadUrl || 'N/A'}`)
      } else {
        alert('Erreur lors de l\'export')
      }
    } catch (error) {
      console.error('Export error:', error)
      // Fallback: Generate client-side export
      generateClientSideExport(format)
    } finally {
      setExporting(false)
      setExportDropdownOpen(false)
    }
  }

  // Client-side export fallback
  const generateClientSideExport = (format: 'pdf' | 'excel' | 'csv') => {
    if (format === 'csv' && stats) {
      // Generate CSV data
      const csvData = [
        ['Métrique', 'Valeur'],
        ['Total Événements', stats.totalEvents?.toString() || '0'],
        ['Utilisateurs Actifs', stats.activeUsers?.toString() || '0'],
        ['Procédures Actives', stats.activeProcedures?.toString() || '0'],
        ['Soumissions Formulaires', stats.formSubmissions?.toString() || '0'],
      ]

      // Add events by category
      csvData.push(['', ''])
      csvData.push(['Événements par catégorie', ''])
      eventsByCategory.forEach(cat => {
        csvData.push([cat.name, cat.value.toString()])
      })

      // Add events by severity
      csvData.push(['', ''])
      csvData.push(['Événements par sévérité', ''])
      eventsBySeverity.forEach(sev => {
        csvData.push([sev.name, sev.value.toString()])
      })

      const csvContent = csvData.map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
      alert('Export CSV téléchargé!')
    } else {
      alert(`L'export ${format.toUpperCase()} nécessite le serveur. L'export CSV est disponible en mode hors ligne.`)
    }
  }

  // KPI cards
  const kpiCards = stats ? [
    {
      title: 'Total Événements',
      value: stats.totalEvents,
      change: 12,
      icon: <Activity className="w-6 h-6" />,
      color: 'bg-emerald-500',
      lightBg: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Utilisateurs Actifs',
      value: stats.activeUsers,
      change: 8,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Procédures Actives',
      value: stats.activeProcedures,
      change: -3,
      icon: <ClipboardList className="w-6 h-6" />,
      color: 'bg-purple-500',
      lightBg: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Soumissions Formulaires',
      value: stats.formSubmissions,
      change: 25,
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-amber-500',
      lightBg: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
  ] : []

  // Severity colors
  const severityColors: Record<string, string> = {
    'CRITICAL': 'bg-red-500',
    'HIGH': 'bg-orange-500',
    'MEDIUM': 'bg-yellow-500',
    'LOW': 'bg-green-500',
  }

  // Action type labels
  const actionLabels: Record<string, { label: string; color: string }> = {
    'CREATE': { label: 'Création', color: 'bg-green-100 text-green-700' },
    'UPDATE': { label: 'Modification', color: 'bg-blue-100 text-blue-700' },
    'DELETE': { label: 'Suppression', color: 'bg-red-100 text-red-700' },
    'VIEW': { label: 'Consultation', color: 'bg-slate-100 text-slate-700' },
    'LOGIN': { label: 'Connexion', color: 'bg-purple-100 text-purple-700' },
    'LOGOUT': { label: 'Déconnexion', color: 'bg-amber-100 text-amber-700' },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-slate-500">Chargement des analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Analytics & Rapports</h1>
          <p className="text-slate-500 mt-1">Visualisez les performances et tendances de la plateforme</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
          {/* Export Dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Exporter
              <ChevronDown className={`w-4 h-4 transition-transform ${exportDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-slide-up">
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Export PDF</p>
                    <p className="text-xs text-slate-500">Rapport complet</p>
                  </div>
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Export Excel</p>
                    <p className="text-xs text-slate-500">Données détaillées</p>
                  </div>
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Database className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Export CSV</p>
                    <p className="text-xs text-slate-500">Format brut</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {[
          { key: 'overview', label: 'Vue d\'ensemble', icon: <LayoutDashboard className="w-4 h-4" /> },
          { key: 'events', label: 'Événements', icon: <Activity className="w-4 h-4" /> },
          { key: 'users', label: 'Utilisateurs', icon: <Users className="w-4 h-4" /> },
          { key: 'activity', label: 'Activité', icon: <History className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-emerald-100 text-emerald-700 font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${card.lightBg} rounded-xl flex items-center justify-center ${card.textColor}`}>
                {card.icon}
              </div>
              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                card.change >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {card.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(card.change)}%
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium">{card.title}</p>
            <p className="text-3xl font-display font-bold text-slate-800 mt-1">{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Module Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Répartition par Module</h3>
              <BarChart3 className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-4">
              {(moduleStats.length > 0 ? moduleStats : [
                { label: 'Événements', value: stats?.totalEvents || 0, color: 'bg-emerald-500' },
                { label: 'Procédures', value: stats?.totalProcedures || 0, color: 'bg-blue-500' },
                { label: 'Formulaires', value: stats?.totalForms || 0, color: 'bg-purple-500' },
                { label: 'Articles', value: stats?.totalArticles || 0, color: 'bg-amber-500' },
              ]).map((item, i) => {
                const maxValue = Math.max(...(moduleStats.length > 0 ? moduleStats : [
                  { value: stats?.totalEvents || 1 },
                  { value: stats?.totalProcedures || 1 },
                  { value: stats?.totalForms || 1 },
                  { value: stats?.totalArticles || 1 },
                ]).map(m => m.value), 1)
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                      <span className="text-sm font-bold text-slate-800">{item.value}</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color || 'bg-emerald-500'} rounded-full transition-all duration-500`}
                        style={{ width: `${(item.value / maxValue) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Events by Severity */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Événements par Sévérité</h3>
              <AlertTriangle className="w-5 h-5 text-slate-400" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(eventsBySeverity.length > 0 ? eventsBySeverity : [
                { label: 'Critique', value: 5, color: 'bg-red-500' },
                { label: 'Élevée', value: 12, color: 'bg-orange-500' },
                { label: 'Moyenne', value: 28, color: 'bg-yellow-500' },
                { label: 'Faible', value: 45, color: 'bg-green-500' },
              ]).map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4 text-center">
                  <div className={`w-4 h-4 ${item.color || severityColors[item.label] || 'bg-slate-500'} rounded-full mx-auto mb-2`} />
                  <p className="text-2xl font-bold text-slate-800">{item.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Events by Category */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Événements par Catégorie</h3>
              <Folder className="w-5 h-5 text-slate-400" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {(eventsByCategory.length > 0 ? eventsByCategory : [
                { label: 'Biosécurité', value: 23, color: '#00CC66' },
                { label: 'Foyers', value: 15, color: '#CC0000' },
                { label: 'Investigation', value: 32, color: '#0066CC' },
                { label: 'Vaccination', value: 45, color: '#00CC66' },
                { label: 'Surveillance', value: 28, color: '#ef4444' },
                { label: 'Laboratoire', value: 18, color: '#00CC99' },
              ]).map((cat, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                  <div
                    className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                    style={{ backgroundColor: (cat.color || '#3B82F6') + '20' }}
                  >
                    <Folder className="w-5 h-5" style={{ color: cat.color || '#3B82F6' }} />
                  </div>
                  <p className="text-xl font-bold text-slate-800">{cat.value}</p>
                  <p className="text-xs text-slate-500 mt-1 truncate">{cat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800">Activité Récente</h3>
            <p className="text-sm text-slate-500 mt-1">Dernières actions sur la plateforme</p>
          </div>
          <div className="divide-y divide-slate-100">
            {(recentActivity.length > 0 ? recentActivity : [
              { id: '1', userName: 'Jean Dupont', action: 'CREATE', resourceType: 'event', details: 'Nouvel événement créé', createdAt: new Date().toISOString() },
              { id: '2', userName: 'Marie Martin', action: 'UPDATE', resourceType: 'procedure', details: 'Procédure mise à jour', createdAt: new Date(Date.now() - 3600000).toISOString() },
              { id: '3', userName: 'Pierre Durand', action: 'LOGIN', resourceType: 'session', details: 'Connexion réussie', createdAt: new Date(Date.now() - 7200000).toISOString() },
            ]).map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-800">{activity.userName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      actionLabels[activity.action]?.color || 'bg-slate-100 text-slate-700'
                    }`}>
                      {actionLabels[activity.action]?.label || activity.action}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 truncate">{activity.details}</p>
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(activity.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            ))}
          </div>
          {recentActivity.length === 0 && (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Aucune activité récente</p>
            </div>
          )}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Tendance des Événements</h3>
            <div className="h-64 flex items-end justify-between gap-2 px-4">
              {[65, 45, 78, 52, 90, 68, 82, 55, 73, 48, 85, 60].map((value, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-emerald-500 rounded-t-lg transition-all hover:bg-emerald-600"
                    style={{ height: `${value}%` }}
                  />
                  <span className="text-xs text-slate-400">
                    {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Statut des Événements</h3>
            <div className="space-y-3">
              {[
                { label: 'Reportés', value: stats?.upcomingEvents || 0, color: 'bg-blue-500' },
                { label: 'En cours', value: Math.floor((stats?.totalEvents || 0) * 0.3), color: 'bg-amber-500' },
                { label: 'Résolus', value: stats?.completedEvents || 0, color: 'bg-emerald-500' },
                { label: 'Clôturés', value: Math.floor((stats?.totalEvents || 0) * 0.1), color: 'bg-slate-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-3 h-3 ${item.color} rounded-full`} />
                  <span className="flex-1 text-sm text-slate-600">{item.label}</span>
                  <span className="font-bold text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Utilisateurs par Rôle</h3>
            <div className="space-y-4">
              {[
                { label: 'Administrateurs', value: 5, color: 'bg-purple-500' },
                { label: 'Managers', value: 12, color: 'bg-blue-500' },
                { label: 'Validateurs', value: 18, color: 'bg-emerald-500' },
                { label: 'Utilisateurs', value: stats?.activeUsers || 50, color: 'bg-slate-500' },
              ].map((item, i) => {
                const total = 5 + 12 + 18 + (stats?.activeUsers || 50)
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                      <span className="text-sm text-slate-500">{item.value} ({Math.round((item.value / total) * 100)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: `${(item.value / total) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Statistiques Utilisateurs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-800">{stats?.totalUsers || 0}</p>
                <p className="text-xs text-slate-500">Total Utilisateurs</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <UserPlus className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-800">{stats?.activeUsers || 0}</p>
                <p className="text-xs text-slate-500">Actifs</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-800">+{Math.round((stats?.activeUsers || 0) * 0.12)}</p>
                <p className="text-xs text-slate-500">Ce mois</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-800">2.4h</p>
                <p className="text-xs text-slate-500">Temps moyen</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================
   NOTIFICATIONS PAGE
   ============================================ */

interface NotificationData {
  id: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SYSTEM'
  category: string
  title: string
  message: string
  link?: string
  isRead: boolean
  isArchived: boolean
  createdAt: string
  readAt?: string
}

interface NotificationPreferences {
  emailEnabled: boolean
  pushEnabled: boolean
  inAppEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
  categories: Record<string, { email: boolean; push: boolean; inApp: boolean }>
}

function NotificationsPage() {
  const { t } = useTranslation()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  // State
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all')
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [showPreferences, setShowPreferences] = useState(false)
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())

  const getHeaders = () => {
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    return { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
  }

  // Load notifications
  const loadNotifications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter === 'unread') params.append('isRead', 'false')
      if (filter === 'archived') params.append('isArchived', 'true')

      const [notifRes, countRes, prefsRes] = await Promise.all([
        fetch(`${API_URL}/api/notifications?${params.toString()}`, { headers: getHeaders() }),
        fetch(`${API_URL}/api/notifications/unread/count`, { headers: getHeaders() }),
        fetch(`${API_URL}/api/notifications/preferences`, { headers: getHeaders() }),
      ])

      if (notifRes.ok) {
        const data = await notifRes.json()
        setNotifications(data.data?.items || data.data || [])
      }

      if (countRes.ok) {
        const data = await countRes.json()
        setUnreadCount(data.data?.count || 0)
      }

      if (prefsRes.ok) {
        const data = await prefsRes.json()
        setPreferences(data.data)
      }

    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [filter])

  // Mark as read
  const markAsRead = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'POST',
        headers: getHeaders(),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'POST',
        headers: getHeaders(),
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Archive notification
  const archiveNotification = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/notifications/${id}/archive`, {
        method: 'POST',
        headers: getHeaders(),
      })
      if (filter !== 'archived') {
        setNotifications(prev => prev.filter(n => n.id !== id))
      } else {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isArchived: true } : n))
      }
    } catch (error) {
      console.error('Error archiving notification:', error)
    }
  }

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      })
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'ERROR': return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'SYSTEM': return <Settings className="w-5 h-5 text-purple-500" />
      default: return <Bell className="w-5 h-5 text-blue-500" />
    }
  }

  // Get notification type style
  const getNotificationStyle = (type: string, isRead: boolean) => {
    const baseStyle = isRead ? 'bg-slate-50' : 'bg-white border-l-4'
    switch (type) {
      case 'SUCCESS': return `${baseStyle} ${!isRead ? 'border-l-emerald-500' : ''}`
      case 'WARNING': return `${baseStyle} ${!isRead ? 'border-l-amber-500' : ''}`
      case 'ERROR': return `${baseStyle} ${!isRead ? 'border-l-red-500' : ''}`
      case 'SYSTEM': return `${baseStyle} ${!isRead ? 'border-l-purple-500' : ''}`
      default: return `${baseStyle} ${!isRead ? 'border-l-blue-500' : ''}`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-slate-500">Chargement des notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Notifications</h1>
          <p className="text-slate-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : 'Toutes les notifications sont lues'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Tout marquer comme lu
            </button>
          )}
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Préférences
          </button>
        </div>
      </div>

      {/* Preferences Panel */}
      {showPreferences && preferences && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Préférences de notification</h3>
            <button onClick={() => setShowPreferences(false)} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Email */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-500" />
                <span className="font-medium text-slate-700">Email</span>
              </div>
              <button
                onClick={() => setPreferences({ ...preferences, emailEnabled: !preferences.emailEnabled })}
                className={`w-12 h-6 rounded-full transition-colors ${preferences.emailEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${preferences.emailEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Push */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-slate-500" />
                <span className="font-medium text-slate-700">Push</span>
              </div>
              <button
                onClick={() => setPreferences({ ...preferences, pushEnabled: !preferences.pushEnabled })}
                className={`w-12 h-6 rounded-full transition-colors ${preferences.pushEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${preferences.pushEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* In-App */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-slate-500" />
                <span className="font-medium text-slate-700">In-App</span>
              </div>
              <button
                onClick={() => setPreferences({ ...preferences, inAppEnabled: !preferences.inAppEnabled })}
                className={`w-12 h-6 rounded-full transition-colors ${preferences.inAppEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${preferences.inAppEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-slate-500" />
                <span className="font-medium text-slate-700">Heures calmes</span>
              </div>
              <button
                onClick={() => setPreferences({ ...preferences, quietHoursEnabled: !preferences.quietHoursEnabled })}
                className={`w-12 h-6 rounded-full transition-colors ${preferences.quietHoursEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${preferences.quietHoursEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {preferences.quietHoursEnabled && (
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-sm text-slate-500 mb-1 block">Début</label>
                  <input
                    type="time"
                    value={preferences.quietHoursStart || '22:00'}
                    onChange={(e) => setPreferences({ ...preferences, quietHoursStart: e.target.value })}
                    className="px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-500 mb-1 block">Fin</label>
                  <input
                    type="time"
                    value={preferences.quietHoursEnd || '07:00'}
                    onChange={(e) => setPreferences({ ...preferences, quietHoursEnd: e.target.value })}
                    className="px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'Toutes', count: notifications.length },
          { key: 'unread', label: 'Non lues', count: unreadCount },
          { key: 'archived', label: 'Archivées', count: 0 },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              filter === tab.key
                ? 'bg-emerald-100 text-emerald-700 font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                filter === tab.key ? 'bg-emerald-200' : 'bg-slate-200'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Aucune notification</h3>
            <p className="text-slate-500">
              {filter === 'unread' ? 'Toutes vos notifications ont été lues' : 'Vous n\'avez pas encore de notifications'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 hover:bg-slate-50/50 transition-colors ${getNotificationStyle(notification.type, notification.isRead)}`}
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className={`font-medium ${notification.isRead ? 'text-slate-600' : 'text-slate-800'}`}>
                        {notification.title}
                      </h4>
                      <p className={`text-sm mt-1 ${notification.isRead ? 'text-slate-400' : 'text-slate-500'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(notification.createdAt).toLocaleString('fr-FR', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors"
                          title="Marquer comme lu"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => archiveNotification(notification.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                        title="Archiver"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Link */}
                  {notification.link && (
                    <button className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                      Voir les détails <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================
   EVENTS PAGE
   ============================================ */

interface EventData {
  id: string
  code: string
  title: string
  description?: string
  status: 'REPORTED' | 'INVESTIGATING' | 'CONFIRMED' | 'RESOLVED' | 'CLOSED'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  location: string
  latitude?: number
  longitude?: number
  categoryId: string
  category?: { id: string; code: string; name: string; color: string; icon: string }
  organizationalUnitId?: string
  organizationalUnit?: { id: string; code: string; name: string; type: string }
  reportedById: string
  reportedBy?: { id: string; firstName: string; lastName: string; email: string }
  assignedToId?: string
  assignedTo?: { id: string; firstName: string; lastName: string; email: string }
  reportedAt: string
  confirmedAt?: string
  resolvedAt?: string
  closedAt?: string
  createdAt: string
  updatedAt: string
  comments?: any[]
  attachments?: any[]
  tasks?: any[]
}

interface EventCategoryData {
  id: string
  code: string
  name: string
  description?: string
  color: string
  icon: string
  isActive: boolean
}

interface EventStats {
  total: number
  byStatus: {
    REPORTED: number
    INVESTIGATING: number
    CONFIRMED: number
    RESOLVED: number
    CLOSED: number
  }
  bySeverity: { LOW: number; MEDIUM: number; HIGH: number; CRITICAL: number }
  byCategory: Array<{ categoryId: string; category: { id: string; name: string; color: string }; count: number }>
}

interface ProcedureData {
  id: string
  code: string
  name: string
  description?: string
  categoryId?: string
}

interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface DocumentTypeData {
  id: string
  code: string
  name: string
}

interface StepExecutionData {
  id: string
  executionId: string
  stepId: string
  stepNumber: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
  assignedToId?: string
  startedAt?: string
  completedAt?: string
  completedById?: string
  notes?: string
  step: { id: string; name: string; description?: string }
}

interface ProcedureExecutionData {
  id: string
  procedureId: string
  eventId: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  currentStepNumber: number
  startedById: string
  startedAt: string
  completedAt?: string
  cancelledAt?: string
  cancelReason?: string
  procedure: { id: string; name: string; code: string; type: string }
  stepExecutions?: StepExecutionData[]
}

const STATUS_CONFIG = {
  REPORTED: { label: 'Reçu', color: 'blue', icon: Inbox, bgColor: 'bg-blue-500', lightBg: 'bg-blue-50', textColor: 'text-blue-600' },
  INVESTIGATING: { label: 'En cours', color: 'amber', icon: Clock, bgColor: 'bg-amber-500', lightBg: 'bg-amber-50', textColor: 'text-amber-600' },
  CONFIRMED: { label: 'Programmé', color: 'purple', icon: Calendar, bgColor: 'bg-purple-500', lightBg: 'bg-purple-50', textColor: 'text-purple-600' },
  RESOLVED: { label: 'Traité', color: 'emerald', icon: CheckCircle, bgColor: 'bg-emerald-500', lightBg: 'bg-emerald-50', textColor: 'text-emerald-600' },
  CLOSED: { label: 'Clôturé', color: 'slate', icon: Archive, bgColor: 'bg-slate-500', lightBg: 'bg-slate-50', textColor: 'text-slate-600' },
}

const SEVERITY_CONFIG = {
  LOW: { label: 'Faible', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  MEDIUM: { label: 'Moyen', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  HIGH: { label: 'Élevé', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
  CRITICAL: { label: 'Critique', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' },
}

// Mapping des noms d'icônes de la BD vers les composants Lucide
const ICON_MAP: { [key: string]: React.ComponentType<{ className?: string; style?: React.CSSProperties }> } = {
  'folder': Folder,
  'folder-open': FolderOpen,
  'shield': Shield,
  'shield-alert': ShieldAlert,
  'shield-check': ShieldCheck,
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle,
  'search': Search,
  'clipboard': ClipboardList,
  'clipboard-list': ClipboardList,
  'file-text': FileText,
  'file-warning': FileWarning,
  'file-check': FileCheck,
  'activity': Activity,
  'heart-pulse': HeartPulse,
  'stethoscope': Stethoscope,
  'thermometer': Thermometer,
  'microscope': Microscope,
  'flask': FlaskConical,
  'flask-conical': FlaskConical,
  'test-tube': TestTube2,
  'biohazard': Biohazard,
  'syringe': Syringe,
  'pill': Pill,
  'bug': Bug,
  'eye': Eye,
  'bird': Bird,
  'dog': Dog,
  'cat': Cat,
  'beef': Beef,
  'fish': Fish,
  'rat': Rat,
  'flame': Flame,
  'droplet': Droplet,
  'leaf': Leaf,
  'tree': TreePine,
  'siren': Siren,
  'megaphone': Megaphone,
  'bell': Bell,
  'calendar': Calendar,
  'clock': Clock,
  'map-pin': MapPin,
  'map-pinned': MapPinned,
  'navigation': Navigation,
  'route': Route,
  'truck': Truck,
  'warehouse': Warehouse,
  'factory': Factory,
  'home': Home,
  'building': Building2,
  'users': Users,
  'user': User,
  'bar-chart': BarChart3,
  'trending-up': TrendingUp,
  'target': Target,
  'flag': Flag,
  'bookmark': Bookmark,
  'tag': Tag,
  'tags': Tags,
  'star': Star,
  'award': Award,
  'trophy': Trophy,
  'lightbulb': Lightbulb,
  'zap': Zap,
  'settings': Settings,
  'database': Database,
  'archive': Archive,
  'inbox': Inbox,
  'send': Send,
  'check-circle': CheckCircle,
  'help-circle': HelpCircle,
}

// Fonction pour obtenir le composant icône à partir du nom
const getCategoryIcon = (iconName: string | undefined): React.ComponentType<{ className?: string; style?: React.CSSProperties }> => {
  if (!iconName) return Folder
  const normalizedName = iconName.toLowerCase().trim()
  return ICON_MAP[normalizedName] || Folder
}

function EventsPage({ initialStatus = 'INVESTIGATING' }: { initialStatus?: string }) {
  const { t } = useTranslation()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  // View state
  const [currentView, setCurrentView] = useState<'dashboard' | 'list' | 'detail' | 'form'>('dashboard')
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null)

  // Data state
  const [events, setEvents] = useState<EventData[]>([])
  const [categories, setCategories] = useState<EventCategoryData[]>([])
  const [stats, setStats] = useState<EventStats | null>(null)
  const [procedures, setProcedures] = useState<ProcedureData[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeData[]>([])
  const [provenances, setProvenances] = useState<any[]>([])

  // Procedure executions state
  const [procedureExecutions, setProcedureExecutions] = useState<ProcedureExecutionData[]>([])
  const [loadingProcedure, setLoadingProcedure] = useState(false)
  const [showProcedureModal, setShowProcedureModal] = useState(false)
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>('')

  // Bulk operations state
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  // Comments state
  const [comments, setComments] = useState<{ id: string; content: string; authorId: string; author?: { firstName: string; lastName: string }; createdAt: string; updatedAt?: string }[]>([])
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)

  // Loading states
  const [loading, setLoading] = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    severity: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    location: '',
    latitude: '',
    longitude: '',
    organizationalUnitId: '',
    provenanceId: '',
    initiatorName: '',
    initiatorContact: '',
    transmissionType: 'MANUAL' as 'MANUAL' | 'AUTOMATIC',
    procedureId: '',
    manualRecipients: [] as { userId: string; duration: number; stepOrder: number }[],
    attachments: [] as { file: File; documentTypeId: string }[],
  })

  const getHeaders = () => {
    const authData = localStorage.getItem('auth_token')
    const token = authData ? JSON.parse(authData).token : null
    return { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
  }

  // Load initial data
  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [statsRes, categoriesRes, proceduresRes, usersRes, docTypesRes, provenancesRes] = await Promise.all([
        fetch(`${API_URL}/api/events/stats`, { headers: getHeaders() }),
        fetch(`${API_URL}/api/config/event-categories`, { headers: getHeaders() }),
        fetch(`${API_URL}/api/procedures`, { headers: getHeaders() }),
        fetch(`${API_URL}/api/users`, { headers: getHeaders() }),
        fetch(`${API_URL}/api/config/document-types`, { headers: getHeaders() }),
        fetch(`${API_URL}/api/config/event-provenances`, { headers: getHeaders() }),
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.data)
      }
      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.data || [])
      }
      if (proceduresRes.ok) {
        const data = await proceduresRes.json()
        setProcedures(data.data?.items || data.data || [])
      }
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.data?.items || data.data || [])
      }
      if (docTypesRes.ok) {
        const data = await docTypesRes.json()
        setDocumentTypes(data.data || [])
      }
      if (provenancesRes.ok) {
        const data = await provenancesRes.json()
        setProvenances(data.data || [])
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load events for selected status and category
  const loadEvents = async (status: string, categoryId?: string) => {
    try {
      setLoadingEvents(true)
      let url = `${API_URL}/api/events?status=${status}&pageSize=50`
      if (categoryId) url += `&categoryId=${categoryId}`

      const response = await fetch(url, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        setEvents(data.data?.items || [])
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoadingEvents(false)
    }
  }

  // Load event details
  const loadEventDetail = async (eventId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}?includeDetails=true`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        setSelectedEvent(data.data)
        // Also load procedure executions and comments for this event
        loadProcedureExecutions(eventId)
        loadComments(eventId)
      }
    } catch (error) {
      console.error('Error loading event details:', error)
    }
  }

  // Load procedure executions for an event
  const loadProcedureExecutions = async (eventId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/procedures/events/${eventId}/procedures`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        setProcedureExecutions(data.data || [])
      }
    } catch (error) {
      console.error('Error loading procedure executions:', error)
      setProcedureExecutions([])
    }
  }

  // Start a procedure execution for the current event
  const startProcedureExecution = async (procedureId: string) => {
    if (!selectedEvent) return

    try {
      setLoadingProcedure(true)
      const response = await fetch(`${API_URL}/api/procedures/executions/start`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ procedureId, eventId: selectedEvent.id })
      })

      if (response.ok) {
        setShowProcedureModal(false)
        setSelectedProcedureId('')
        loadProcedureExecutions(selectedEvent.id)
      } else {
        const errorData = await response.json()
        alert(`Erreur: ${errorData.message || 'Impossible de démarrer la procédure'}`)
      }
    } catch (error) {
      console.error('Error starting procedure execution:', error)
      alert('Erreur réseau lors du démarrage de la procédure')
    } finally {
      setLoadingProcedure(false)
    }
  }

  // Load execution details with steps
  const loadExecutionDetails = async (executionId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/procedures/executions/${executionId}`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        // Update the execution in the list with full details
        setProcedureExecutions(prev => prev.map(exec =>
          exec.id === executionId ? data.data : exec
        ))
      }
    } catch (error) {
      console.error('Error loading execution details:', error)
    }
  }

  // Complete a step
  const completeStep = async (executionId: string, stepExecutionId: string, notes?: string) => {
    try {
      setLoadingProcedure(true)
      const response = await fetch(`${API_URL}/api/procedures/executions/${executionId}/steps/${stepExecutionId}/complete`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ notes })
      })

      if (response.ok) {
        loadExecutionDetails(executionId)
      } else {
        alert('Erreur lors de la complétion de l\'étape')
      }
    } catch (error) {
      console.error('Error completing step:', error)
    } finally {
      setLoadingProcedure(false)
    }
  }

  // Skip a step
  const skipStep = async (executionId: string, stepExecutionId: string) => {
    const reason = prompt('Raison du saut de cette étape:')
    if (!reason) return

    try {
      setLoadingProcedure(true)
      const response = await fetch(`${API_URL}/api/procedures/executions/${executionId}/steps/${stepExecutionId}/skip`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        loadExecutionDetails(executionId)
      } else {
        alert('Erreur lors du saut de l\'étape')
      }
    } catch (error) {
      console.error('Error skipping step:', error)
    } finally {
      setLoadingProcedure(false)
    }
  }

  // Advance to next step
  const advanceExecution = async (executionId: string) => {
    try {
      setLoadingProcedure(true)
      const response = await fetch(`${API_URL}/api/procedures/executions/${executionId}/advance`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({})
      })

      if (response.ok) {
        loadExecutionDetails(executionId)
        if (selectedEvent) loadProcedureExecutions(selectedEvent.id)
      } else {
        alert('Erreur lors de l\'avancement de la procédure')
      }
    } catch (error) {
      console.error('Error advancing execution:', error)
    } finally {
      setLoadingProcedure(false)
    }
  }

  // Cancel execution
  const cancelExecution = async (executionId: string) => {
    const reason = prompt('Raison de l\'annulation:')
    if (!reason) return

    try {
      setLoadingProcedure(true)
      const response = await fetch(`${API_URL}/api/procedures/executions/${executionId}/cancel`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        if (selectedEvent) loadProcedureExecutions(selectedEvent.id)
      } else {
        alert('Erreur lors de l\'annulation')
      }
    } catch (error) {
      console.error('Error cancelling execution:', error)
    } finally {
      setLoadingProcedure(false)
    }
  }

  // Load comments for an event
  const loadComments = async (eventId: string) => {
    try {
      setLoadingComments(true)
      const response = await fetch(`${API_URL}/api/events/${eventId}/comments`, { headers: getHeaders() })
      if (response.ok) {
        const data = await response.json()
        setComments(data.data || [])
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  // Add a new comment
  const addComment = async () => {
    if (!newComment.trim() || !selectedEvent) return

    try {
      setLoadingComments(true)
      const response = await fetch(`${API_URL}/api/events/${selectedEvent.id}/comments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content: newComment })
      })

      if (response.ok) {
        setNewComment('')
        loadComments(selectedEvent.id)
      } else {
        alert('Erreur lors de l\'ajout du commentaire')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  // Update a comment
  const updateComment = async (commentId: string) => {
    if (!editingCommentContent.trim() || !selectedEvent) return

    try {
      setLoadingComments(true)
      const response = await fetch(`${API_URL}/api/events/${selectedEvent.id}/comments/${commentId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ content: editingCommentContent })
      })

      if (response.ok) {
        setEditingCommentId(null)
        setEditingCommentContent('')
        loadComments(selectedEvent.id)
      } else {
        alert('Erreur lors de la modification du commentaire')
      }
    } catch (error) {
      console.error('Error updating comment:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  // Delete a comment
  const deleteComment = async (commentId: string) => {
    if (!selectedEvent) return
    if (!confirm('Voulez-vous vraiment supprimer ce commentaire ?')) return

    try {
      setLoadingComments(true)
      const response = await fetch(`${API_URL}/api/events/${selectedEvent.id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: getHeaders()
      })

      if (response.ok) {
        loadComments(selectedEvent.id)
      } else {
        alert('Erreur lors de la suppression du commentaire')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  // Start editing a comment
  const startEditComment = (comment: { id: string; content: string }) => {
    setEditingCommentId(comment.id)
    setEditingCommentContent(comment.content)
  }

  // Cancel editing
  const cancelEditComment = () => {
    setEditingCommentId(null)
    setEditingCommentContent('')
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Get category counts for selected status
  const getCategoryCounts = () => {
    if (!stats) return []
    const statusEvents = stats.byCategory.filter(c => {
      // This is a simplification - in reality we'd need per-status-per-category counts
      return true
    })
    return categories.map(cat => {
      const statCat = stats.byCategory.find(sc => sc.categoryId === cat.id)
      return {
        ...cat,
        count: statCat?.count || 0
      }
    })
  }

  // Handle status tab click
  const handleStatusClick = (status: string) => {
    setSelectedStatus(status)
    setSelectedCategoryId(null)
    setCurrentView('dashboard')
  }

  // Handle category card click
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    loadEvents(selectedStatus, categoryId)
    setCurrentView('list')
  }

  // Handle event click
  const handleEventClick = (event: EventData) => {
    loadEventDetail(event.id)
    setCurrentView('detail')
  }

  // Handle back navigation
  const handleBack = () => {
    if (currentView === 'detail') {
      setCurrentView('list')
      setSelectedEvent(null)
    } else if (currentView === 'list') {
      setCurrentView('dashboard')
      setSelectedCategoryId(null)
      setSelectedEventIds([]) // Clear bulk selection
    } else if (currentView === 'form') {
      setCurrentView('dashboard')
      resetForm()
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      categoryId: '',
      severity: 'MEDIUM',
      location: '',
      latitude: '',
      longitude: '',
      organizationalUnitId: '',
      provenanceId: '',
      initiatorName: '',
      initiatorContact: '',
      transmissionType: 'MANUAL',
      procedureId: '',
      manualRecipients: [],
      attachments: [],
    })
  }

  // Handle create event
  const handleCreateEvent = async () => {
    if (!formData.title || !formData.categoryId || !formData.location) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      setSaving(true)
      const payload = {
        title: formData.title,
        description: formData.description || null,
        categoryId: formData.categoryId,
        severity: formData.severity,
        location: formData.location,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        organizationalUnitId: formData.organizationalUnitId || null,
      }

      const response = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        // If automatic transmission, link to procedure
        if (formData.transmissionType === 'AUTOMATIC' && formData.procedureId) {
          // TODO: Link event to procedure execution
        }
        loadInitialData()
        setCurrentView('dashboard')
        resetForm()
      } else {
        const errorData = await response.json()
        alert(`Erreur: ${errorData.message || 'Erreur lors de la création'}`)
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Erreur réseau lors de la création')
    } finally {
      setSaving(false)
    }
  }

  // Handle status change
  const handleChangeStatus = async (eventId: string, newStatus: string, reason?: string) => {
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus, reason })
      })

      if (response.ok) {
        loadEventDetail(eventId)
        loadInitialData()
      }
    } catch (error) {
      console.error('Error changing status:', error)
    }
  }

  // Handle assignment
  const handleAssign = async (eventId: string, userId: string | null) => {
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}/assign`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ assignedToId: userId })
      })

      if (response.ok) {
        loadEventDetail(eventId)
      }
    } catch (error) {
      console.error('Error assigning event:', error)
    }
  }

  // Toggle event selection for bulk operations
  const toggleEventSelection = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEventIds(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    )
  }

  // Select all events in current view
  const selectAllEvents = () => {
    if (selectedEventIds.length === events.length) {
      setSelectedEventIds([])
    } else {
      setSelectedEventIds(events.map(e => e.id))
    }
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedEventIds([])
  }

  // Bulk update status
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedEventIds.length === 0) return

    try {
      setBulkActionLoading(true)
      const response = await fetch(`${API_URL}/api/events/bulk/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ eventIds: selectedEventIds, status: newStatus })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`${data.data?.updated || selectedEventIds.length} événement(s) mis à jour avec succès`)
        clearSelection()
        loadEvents(selectedStatus, selectedCategoryId || undefined)
        loadInitialData()
      } else {
        const errorData = await response.json()
        alert(`Erreur: ${errorData.message || 'Erreur lors de la mise à jour'}`)
      }
    } catch (error) {
      console.error('Error bulk updating status:', error)
      alert('Erreur réseau lors de la mise à jour')
    } finally {
      setBulkActionLoading(false)
    }
  }

  // Bulk assign
  const handleBulkAssign = async (userId: string | null) => {
    if (selectedEventIds.length === 0) return

    try {
      setBulkActionLoading(true)
      const response = await fetch(`${API_URL}/api/events/bulk/assign`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ eventIds: selectedEventIds, assignedToId: userId })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`${data.data?.updated || selectedEventIds.length} événement(s) assigné(s) avec succès`)
        clearSelection()
        loadEvents(selectedStatus, selectedCategoryId || undefined)
      } else {
        const errorData = await response.json()
        alert(`Erreur: ${errorData.message || 'Erreur lors de l\'assignation'}`)
      }
    } catch (error) {
      console.error('Error bulk assigning:', error)
      alert('Erreur réseau lors de l\'assignation')
    } finally {
      setBulkActionLoading(false)
    }
  }

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedEventIds.length === 0) return

    const confirm = window.confirm(`Voulez-vous vraiment supprimer ${selectedEventIds.length} événement(s) ? Cette action est irréversible.`)
    if (!confirm) return

    try {
      setBulkActionLoading(true)
      const response = await fetch(`${API_URL}/api/events/bulk`, {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ eventIds: selectedEventIds })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`${data.data?.deleted || selectedEventIds.length} événement(s) supprimé(s) avec succès`)
        clearSelection()
        loadEvents(selectedStatus, selectedCategoryId || undefined)
        loadInitialData()
      } else {
        const errorData = await response.json()
        alert(`Erreur: ${errorData.message || 'Erreur lors de la suppression'}`)
      }
    } catch (error) {
      console.error('Error bulk deleting:', error)
      alert('Erreur réseau lors de la suppression')
    } finally {
      setBulkActionLoading(false)
    }
  }

  // Add manual recipient
  const addManualRecipient = () => {
    setFormData(prev => ({
      ...prev,
      manualRecipients: [...prev.manualRecipients, { userId: '', duration: 24, stepOrder: prev.manualRecipients.length + 1 }]
    }))
  }

  // Remove manual recipient
  const removeManualRecipient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      manualRecipients: prev.manualRecipients.filter((_, i) => i !== index)
    }))
  }

  // Get status count
  const getStatusCount = (status: string) => {
    if (!stats) return 0
    return stats.byStatus[status as keyof typeof stats.byStatus] || 0
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-slate-500">Chargement des événements...</p>
        </div>
      </div>
    )
  }

  // Form View
  if (currentView === 'form') {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-800">Nouvel événement</h1>
              <p className="text-slate-500 mt-1">Créez un nouvel événement sanitaire</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Annuler
            </button>
            <button
              onClick={handleCreateEvent}
              disabled={saving || !formData.title || !formData.categoryId}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              Créer l'événement
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="xl:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-800">Informations de base</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Objet / Titre *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Titre de l'événement"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Catégorie *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Priorité *</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Description / Message</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description détaillée de l'événement..."
                    rows={4}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Source & Initiator */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-800">Source & Initiateur</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Source / Provenance</label>
                  <select
                    value={formData.provenanceId}
                    onChange={(e) => setFormData({ ...formData, provenanceId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="">Sélectionner une source</option>
                    {provenances.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Localisation *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Lieu de l'événement"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom de l'initiateur</label>
                  <input
                    type="text"
                    value={formData.initiatorName}
                    onChange={(e) => setFormData({ ...formData, initiatorName: e.target.value })}
                    placeholder="Nom complet"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact de l'initiateur</label>
                  <input
                    type="text"
                    value={formData.initiatorContact}
                    onChange={(e) => setFormData({ ...formData, initiatorContact: e.target.value })}
                    placeholder="Téléphone ou email"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Transmission */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                  <Send className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-800">Type de transmission</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, transmissionType: 'MANUAL', procedureId: '' })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.transmissionType === 'MANUAL'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Users className={`w-5 h-5 ${formData.transmissionType === 'MANUAL' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className={`font-semibold ${formData.transmissionType === 'MANUAL' ? 'text-emerald-700' : 'text-slate-700'}`}>
                      Manuel
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">Choisissez manuellement les destinataires et la durée de traitement</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, transmissionType: 'AUTOMATIC', manualRecipients: [] })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.transmissionType === 'AUTOMATIC'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className={`w-5 h-5 ${formData.transmissionType === 'AUTOMATIC' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className={`font-semibold ${formData.transmissionType === 'AUTOMATIC' ? 'text-emerald-700' : 'text-slate-700'}`}>
                      Automatique
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">Liez à une procédure existante pour un traitement automatisé</p>
                </button>
              </div>

              {formData.transmissionType === 'AUTOMATIC' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Procédure à suivre</label>
                  <select
                    value={formData.procedureId}
                    onChange={(e) => setFormData({ ...formData, procedureId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="">Sélectionner une procédure</option>
                    {procedures.filter(p => !formData.categoryId || p.categoryId === formData.categoryId).map(proc => (
                      <option key={proc.id} value={proc.id}>{proc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.transmissionType === 'MANUAL' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-slate-700">Destinataires et étapes</label>
                    <button
                      type="button"
                      onClick={addManualRecipient}
                      className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter une étape
                    </button>
                  </div>

                  {formData.manualRecipients.length === 0 && (
                    <div className="text-center py-6 bg-slate-50 rounded-xl">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">Aucune étape configurée</p>
                      <button
                        type="button"
                        onClick={addManualRecipient}
                        className="mt-2 text-sm text-emerald-600 hover:text-emerald-700"
                      >
                        Ajouter une première étape
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {formData.manualRecipients.map((recipient, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <span className="w-8 h-8 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-full text-sm font-bold">
                          {index + 1}
                        </span>
                        <select
                          value={recipient.userId}
                          onChange={(e) => {
                            const updated = [...formData.manualRecipients]
                            updated[index].userId = e.target.value
                            setFormData({ ...formData, manualRecipients: updated })
                          }}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        >
                          <option value="">Sélectionner un destinataire</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={recipient.duration}
                            onChange={(e) => {
                              const updated = [...formData.manualRecipients]
                              updated[index].duration = parseInt(e.target.value) || 24
                              setFormData({ ...formData, manualRecipients: updated })
                            }}
                            className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm text-center"
                            min={1}
                          />
                          <span className="text-sm text-slate-500">heures</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeManualRecipient(index)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Attachments */}
          <div className="space-y-6">
            {/* Attachments */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                  <Paperclip className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-800">Fichiers joints</h3>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-emerald-300 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600 font-medium">Glissez vos fichiers ici</p>
                <p className="text-xs text-slate-400 mt-1">ou cliquez pour parcourir</p>
                <input type="file" multiple className="hidden" />
              </div>

              {formData.attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.attachments.map((att, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-700 truncate">{att.file.name}</span>
                      </div>
                      <select
                        value={att.documentTypeId}
                        onChange={(e) => {
                          const updated = [...formData.attachments]
                          updated[index].documentTypeId = e.target.value
                          setFormData({ ...formData, attachments: updated })
                        }}
                        className="px-2 py-1 text-xs border border-slate-200 rounded-lg"
                      >
                        <option value="">Type de fichier</option>
                        {documentTypes.map(dt => (
                          <option key={dt.id} value={dt.id}>{dt.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            attachments: formData.attachments.filter((_, i) => i !== index)
                          })
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-emerald-800">À savoir</h3>
              </div>
              <ul className="text-sm text-emerald-700 space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Les événements créés sont automatiquement assignés à vous</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Le mode automatique suit les étapes définies dans la procédure</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Vous pouvez joindre des fichiers de preuve</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Detail View
  if (currentView === 'detail' && selectedEvent) {
    const statusConfig = STATUS_CONFIG[selectedEvent.status]
    const severityConfig = SEVERITY_CONFIG[selectedEvent.severity]
    const StatusIcon = statusConfig.icon

    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-display font-bold text-slate-800">{selectedEvent.code}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.lightBg} ${statusConfig.textColor}`}>
                  {statusConfig.label}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${severityConfig.bgColor} ${severityConfig.textColor}`}>
                  {severityConfig.label}
                </span>
              </div>
              <p className="text-slate-500 mt-1">{selectedEvent.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedEvent.status === 'REPORTED' && (
              <button
                onClick={() => handleChangeStatus(selectedEvent.id, 'INVESTIGATING')}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
              >
                <Play className="w-4 h-4" />
                Prendre en charge
              </button>
            )}
            {selectedEvent.status === 'INVESTIGATING' && (
              <>
                <button
                  onClick={() => handleChangeStatus(selectedEvent.id, 'RESOLVED')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Marquer traité
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Raison du renvoi:')
                    if (reason) handleChangeStatus(selectedEvent.id, 'REPORTED', reason)
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Renvoyer
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Détails de l'événement</h3>
              <p className="text-slate-600 whitespace-pre-wrap">{selectedEvent.description || 'Aucune description'}</p>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                <div>
                  <p className="text-sm text-slate-500">Localisation</p>
                  <p className="font-medium text-slate-800 flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {selectedEvent.location}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Catégorie</p>
                  <p className="font-medium text-slate-800 flex items-center gap-2 mt-1">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedEvent.category?.color }} />
                    {selectedEvent.category?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Signalé par</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {selectedEvent.reportedBy?.firstName} {selectedEvent.reportedBy?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Date de signalement</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {new Date(selectedEvent.reportedAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Historique</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="w-0.5 flex-1 bg-slate-200 my-2" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-slate-800">Événement créé</p>
                    <p className="text-sm text-slate-500">{new Date(selectedEvent.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Assignation</h3>
              {selectedEvent.assignedTo ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {selectedEvent.assignedTo.firstName} {selectedEvent.assignedTo.lastName}
                    </p>
                    <p className="text-sm text-slate-500">{selectedEvent.assignedTo.email}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-500 text-sm">Non assigné</p>
                  <select
                    onChange={(e) => handleAssign(selectedEvent.id, e.target.value)}
                    className="mt-2 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">Assigner à...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Pièces jointes ({selectedEvent.attachments?.length || 0})</h3>
              {selectedEvent.attachments && selectedEvent.attachments.length > 0 ? (
                <div className="space-y-2">
                  {selectedEvent.attachments.map((att: any) => (
                    <div key={att.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-700 truncate flex-1">{att.originalName}</span>
                      <Download className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 text-sm py-4">Aucune pièce jointe</p>
              )}
            </div>

            {/* Tasks */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Tâches ({selectedEvent.tasks?.length || 0})</h3>
              {selectedEvent.tasks && selectedEvent.tasks.length > 0 ? (
                <div className="space-y-2">
                  {selectedEvent.tasks.map((task: any) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        task.status === 'COMPLETED' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                      }`}>
                        {task.status === 'COMPLETED' && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm flex-1 ${task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 text-sm py-4">Aucune tâche</p>
              )}
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-slate-400" />
                  Commentaires ({comments.length})
                </h3>
                {loadingComments && <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />}
              </div>

              {/* Add new comment */}
              <div className="mb-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={addComment}
                        disabled={!newComment.trim() || loadingComments}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Envoyer
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments list */}
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-600">
                        {comment.author?.firstName?.[0]}{comment.author?.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-800">
                            {comment.author?.firstName} {comment.author?.lastName}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(comment.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                          {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                            <span className="text-xs text-slate-400">(modifié)</span>
                          )}
                        </div>

                        {editingCommentId === comment.id ? (
                          <div>
                            <textarea
                              value={editingCommentContent}
                              onChange={(e) => setEditingCommentContent(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => updateComment(comment.id)}
                                disabled={loadingComments}
                                className="px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                              >
                                Enregistrer
                              </button>
                              <button
                                onClick={cancelEditComment}
                                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600 whitespace-pre-wrap">{comment.content}</p>
                        )}

                        {/* Actions (visible on hover) */}
                        {editingCommentId !== comment.id && (
                          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditComment(comment)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteComment(comment.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Aucun commentaire</p>
                  <p className="text-slate-400 text-xs mt-1">Soyez le premier à commenter</p>
                </div>
              )}
            </div>

            {/* Procedure Executions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Procédures</h3>
                <button
                  onClick={() => setShowProcedureModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  Démarrer
                </button>
              </div>

              {procedureExecutions.length > 0 ? (
                <div className="space-y-3">
                  {procedureExecutions.map(execution => {
                    const statusColors: Record<string, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
                      IN_PROGRESS: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
                      COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
                      CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', icon: X },
                      PENDING: { bg: 'bg-slate-100', text: 'text-slate-700', icon: Clock },
                    }
                    const statusConfig = statusColors[execution.status] || statusColors.PENDING
                    const StatusIcon = statusConfig.icon

                    return (
                      <div key={execution.id} className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{execution.procedure?.name}</p>
                            <p className="text-xs text-slate-500">{execution.procedure?.code}</p>
                          </div>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                            <StatusIcon className="w-3 h-3" />
                            {execution.status === 'IN_PROGRESS' ? 'En cours' :
                             execution.status === 'COMPLETED' ? 'Terminée' :
                             execution.status === 'CANCELLED' ? 'Annulée' : 'En attente'}
                          </span>
                        </div>

                        {/* Step Progress */}
                        {execution.stepExecutions && execution.stepExecutions.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {execution.stepExecutions.map((step, idx) => {
                              const isActive = step.status === 'IN_PROGRESS'
                              const isCompleted = step.status === 'COMPLETED'
                              const isSkipped = step.status === 'SKIPPED'

                              return (
                                <div key={step.id} className={`flex items-center gap-3 p-2 rounded-lg ${
                                  isActive ? 'bg-amber-50 border border-amber-200' :
                                  isCompleted ? 'bg-emerald-50' :
                                  isSkipped ? 'bg-slate-100' : 'bg-white'
                                }`}>
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isCompleted ? 'bg-emerald-500 text-white' :
                                    isSkipped ? 'bg-slate-400 text-white' :
                                    isActive ? 'bg-amber-500 text-white animate-pulse' :
                                    'bg-slate-200 text-slate-500'
                                  }`}>
                                    {isCompleted ? <Check className="w-3.5 h-3.5" /> :
                                     isSkipped ? <Minus className="w-3.5 h-3.5" /> :
                                     step.stepNumber}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm truncate ${
                                      isCompleted || isSkipped ? 'text-slate-500' : 'text-slate-700'
                                    }`}>
                                      {step.step?.name}
                                    </p>
                                  </div>

                                  {/* Step actions for active step */}
                                  {isActive && execution.status === 'IN_PROGRESS' && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => completeStep(execution.id, step.id)}
                                        disabled={loadingProcedure}
                                        className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                        title="Terminer"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => skipStep(execution.id, step.id)}
                                        disabled={loadingProcedure}
                                        className="p-1.5 bg-slate-400 text-white rounded hover:bg-slate-500 transition-colors disabled:opacity-50"
                                        title="Sauter"
                                      >
                                        <ChevronRight className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Load steps button if not loaded */}
                        {!execution.stepExecutions && execution.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => loadExecutionDetails(execution.id)}
                            className="w-full mt-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            Voir les étapes
                          </button>
                        )}

                        {/* Execution actions */}
                        {execution.status === 'IN_PROGRESS' && (
                          <div className="mt-3 pt-3 border-t border-slate-200 flex gap-2">
                            <button
                              onClick={() => advanceExecution(execution.id)}
                              disabled={loadingProcedure}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                            >
                              {loadingProcedure ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              Étape suivante
                            </button>
                            <button
                              onClick={() => cancelExecution(execution.id)}
                              disabled={loadingProcedure}
                              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Annuler
                            </button>
                          </div>
                        )}

                        {/* Completion info */}
                        {execution.completedAt && (
                          <p className="mt-2 text-xs text-slate-500">
                            Terminée le {new Date(execution.completedAt).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Aucune procédure en cours</p>
                  <p className="text-slate-400 text-xs mt-1">Cliquez sur "Démarrer" pour lancer une procédure</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Select Procedure to Start */}
        {showProcedureModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Démarrer une procédure</h3>
                <button
                  onClick={() => { setShowProcedureModal(false); setSelectedProcedureId(''); }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Sélectionnez une procédure</label>
                  <select
                    value={selectedProcedureId}
                    onChange={(e) => setSelectedProcedureId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="">-- Choisir une procédure --</option>
                    {procedures.map(proc => (
                      <option key={proc.id} value={proc.id}>{proc.name} ({proc.code})</option>
                    ))}
                  </select>
                </div>

                {selectedProcedureId && (
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-600">
                      La procédure sélectionnée sera démarrée pour cet événement.
                      Vous pourrez suivre et compléter chaque étape.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowProcedureModal(false); setSelectedProcedureId(''); }}
                  className="flex-1 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => startProcedureExecution(selectedProcedureId)}
                  disabled={!selectedProcedureId || loadingProcedure}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {loadingProcedure ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Démarrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // List View
  if (currentView === 'list') {
    const selectedCategory = categories.find(c => c.id === selectedCategoryId)
    const allSelected = events.length > 0 && selectedEventIds.length === events.length
    const someSelected = selectedEventIds.length > 0 && selectedEventIds.length < events.length

    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-display font-bold text-slate-800">
                  {selectedCategory?.name || 'Événements'}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[selectedStatus as keyof typeof STATUS_CONFIG]?.lightBg} ${STATUS_CONFIG[selectedStatus as keyof typeof STATUS_CONFIG]?.textColor}`}>
                  {STATUS_CONFIG[selectedStatus as keyof typeof STATUS_CONFIG]?.label}
                </span>
              </div>
              <p className="text-slate-500 mt-1">{events.length} événement(s)</p>
            </div>
          </div>

          {/* Select All Checkbox */}
          {events.length > 0 && (
            <button
              onClick={selectAllEvents}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                allSelected ? 'bg-emerald-500 border-emerald-500' : someSelected ? 'bg-emerald-500/50 border-emerald-500' : 'border-slate-300'
              }`}>
                {(allSelected || someSelected) && <Check className="w-3 h-3 text-white" />}
              </div>
              {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          )}
        </div>

        {/* Bulk Action Bar */}
        {selectedEventIds.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 flex items-center justify-between animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800">{selectedEventIds.length} événement(s) sélectionné(s)</p>
                <p className="text-sm text-emerald-600">Choisissez une action à appliquer</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Change Status Dropdown */}
              <div className="relative group">
                <button
                  disabled={bulkActionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Changer le statut
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handleBulkStatusChange(key)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
                    >
                      <config.icon className={`w-4 h-4 ${config.textColor}`} />
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assign Dropdown */}
              <div className="relative group">
                <button
                  disabled={bulkActionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <User className="w-4 h-4" />
                  Assigner
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all max-h-64 overflow-y-auto">
                  <button
                    onClick={() => handleBulkAssign(null)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors text-slate-500"
                  >
                    <X className="w-4 h-4" />
                    Retirer l'assignation
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  {users.slice(0, 10).map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleBulkAssign(user.id)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <span className="truncate">{user.firstName} {user.lastName}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={handleBulkDelete}
                disabled={bulkActionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>

              {/* Clear Selection */}
              <button
                onClick={clearSelection}
                className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {bulkActionLoading && (
                <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
              )}
            </div>
          </div>
        )}

        {/* Events Grid */}
        {loadingEvents ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucun événement dans cette catégorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(event => {
              const severityConfig = SEVERITY_CONFIG[event.severity]
              const isSelected = selectedEventIds.includes(event.id)
              return (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className={`bg-white rounded-xl border p-5 hover:shadow-lg transition-all cursor-pointer group relative ${
                    isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-emerald-200'
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={(e) => toggleEventSelection(event.id, e)}
                    className={`absolute top-3 left-3 w-6 h-6 rounded border-2 flex items-center justify-center transition-all z-10 ${
                      isSelected
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-300 bg-white group-hover:border-emerald-400'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </button>

                  <div className="flex items-start justify-between mb-3 pl-8">
                    <span className="text-xs font-mono text-slate-500">{event.code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityConfig.bgColor} ${severityConfig.textColor}`}>
                      {severityConfig.label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors pl-8">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 pl-8">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="w-3 h-3 text-slate-500" />
                      </div>
                      <span className="text-xs text-slate-500">
                        {event.reportedBy?.firstName} {event.reportedBy?.lastName}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(event.reportedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Dashboard View (default)
  const statusTabs = [
    { key: 'INVESTIGATING', ...STATUS_CONFIG.INVESTIGATING },
    { key: 'REPORTED', ...STATUS_CONFIG.REPORTED },
    { key: 'RESOLVED', ...STATUS_CONFIG.RESOLVED },
    { key: 'CONFIRMED', ...STATUS_CONFIG.CONFIRMED },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Événements sanitaires</h1>
          <p className="text-slate-500 mt-1">Gérez et suivez les événements de santé animale</p>
        </div>
        <button
          onClick={() => setCurrentView('form')}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25"
        >
          <Plus className="w-5 h-5" />
          Nouvel événement
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {statusTabs.map(tab => {
          const TabIcon = tab.icon
          const count = getStatusCount(tab.key)
          const isActive = selectedStatus === tab.key

          return (
            <button
              key={tab.key}
              onClick={() => handleStatusClick(tab.key)}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? `${tab.bgColor} text-white shadow-lg`
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <TabIcon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                isActive ? 'bg-white/20' : 'bg-slate-100'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map(category => {
          const categoryStats = stats?.byCategory.find(c => c.categoryId === category.id)
          const count = categoryStats?.count || 0
          const CategoryIcon = getCategoryIcon(category.icon)

          return (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl hover:border-emerald-200 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: category.color + '20' }}
                >
                  <CategoryIcon className="w-6 h-6" style={{ color: category.color }} />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-slate-800">{count}</p>
                  <p className="text-xs text-slate-500">événement(s)</p>
                </div>
              </div>
              <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{category.description}</p>
              )}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Voir les détails</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          )
        })}

        {categories.length === 0 && (
          <div className="col-span-full text-center py-20 bg-slate-50 rounded-2xl">
            <Folder className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucune catégorie d'événement configurée</p>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
            <div key={key} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
                  {config.label}
                </span>
                <span className="text-2xl font-bold text-slate-800">
                  {stats.bySeverity[key as keyof typeof stats.bySeverity]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
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
        <Header onMenuToggle={() => setMobileMenuOpen(true)} currentPage={currentPage} onLogout={handleLogout} onProfileClick={() => setCurrentPage('my-profile')} onNotificationsClick={() => setCurrentPage('notifications')} onNavigate={setCurrentPage} userSession={userSession} />
        <main className="p-4 lg:p-8">
          {currentPage === 'dashboard' && <Dashboard userSession={userSession} onNavigate={setCurrentPage} />}
          {currentPage === 'my-profile' && <MyProfilePage userSession={userSession} onUpdateSession={setUserSession} />}
          {currentPage === 'users-management' && <UsersManagementPage />}
          {currentPage === 'users-groups' && <GroupsManagementPage />}
          {currentPage === 'users-rights' && <RightsManagementPage />}
          {currentPage === 'settings-forms' && <FormBuilderPage />}
          {currentPage === 'settings-procedures' && <ProceduresPage />}
          {currentPage === 'settings-categories' && <EventCategoriesPage />}
          {currentPage === 'settings-doctypes' && <DocumentTypesPage />}
          {currentPage === 'settings-origins' && <EventProvenancesPage />}
          {currentPage === 'knowledge' && <KnowledgeBasePage />}
          {currentPage === 'config-schedule' && <WorkSchedulesPage />}
          {currentPage === 'config-system' && <SystemConfigPage />}
          {currentPage === 'analytics' && <AnalyticsPage />}
          {currentPage === 'reports' && <ReportsPage />}
          {currentPage === 'notifications' && <NotificationsPage />}
          {currentPage === 'events-inprogress' && <EventsPage initialStatus="INVESTIGATING" />}
          {currentPage === 'events-received' && <EventsPage initialStatus="REPORTED" />}
          {currentPage === 'events-processed' && <EventsPage initialStatus="RESOLVED" />}
          {currentPage === 'events-scheduled' && <EventsPage initialStatus="CONFIRMED" />}
          {currentPage === 'events-map' && <EventsMapPage />}
          {!['dashboard', 'my-profile', 'users-management', 'users-groups', 'users-rights', 'settings-forms', 'settings-procedures', 'settings-categories', 'settings-doctypes', 'settings-origins', 'knowledge', 'config-schedule', 'config-system', 'analytics', 'reports', 'notifications', 'events-inprogress', 'events-received', 'events-processed', 'events-scheduled', 'events-map'].includes(currentPage) && (
            <PlaceholderPage title={pageTitles[currentPage] || currentPage} />
          )}
        </main>
      </div>
    </div>
  )
}

export default App

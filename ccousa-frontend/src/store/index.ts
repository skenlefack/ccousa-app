import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { User, Theme } from '../types';

// ===========================================
// Auth Store
// ===========================================

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,

        setUser: (user) =>
          set({ user, isAuthenticated: !!user }, false, 'setUser'),

        setTokens: (token, refreshToken) =>
          set({ token, refreshToken, isAuthenticated: true }, false, 'setTokens'),

        logout: () =>
          set(
            {
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
            },
            false,
            'logout'
          ),

        setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),
      }),
      {
        name: 'ccousa-auth',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// ===========================================
// UI Store
// ===========================================

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  language: string;

  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setLanguage: (language: string) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'system',
        sidebarCollapsed: false,
        sidebarMobileOpen: false,
        language: 'fr',

        setTheme: (theme) => set({ theme }, false, 'setTheme'),

        toggleSidebar: () =>
          set(
            (state) => ({ sidebarCollapsed: !state.sidebarCollapsed }),
            false,
            'toggleSidebar'
          ),

        setSidebarCollapsed: (sidebarCollapsed) =>
          set({ sidebarCollapsed }, false, 'setSidebarCollapsed'),

        toggleMobileSidebar: () =>
          set(
            (state) => ({ sidebarMobileOpen: !state.sidebarMobileOpen }),
            false,
            'toggleMobileSidebar'
          ),

        setMobileSidebarOpen: (sidebarMobileOpen) =>
          set({ sidebarMobileOpen }, false, 'setMobileSidebarOpen'),

        setLanguage: (language) => set({ language }, false, 'setLanguage'),
      }),
      {
        name: 'ccousa-ui',
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          language: state.language,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

// ===========================================
// Settings Store
// ===========================================

interface SettingsState {
  // System configurations
  systemConfigs: Record<string, string>;

  // Reference data
  languages: Array<{ code: string; name: string; isDefault: boolean }>;
  countries: Array<{ code: string; name: string }>;
  timezones: Array<{ id: string; name: string; offset: string }>;

  // Settings data
  eventCategories: Array<{
    id: string;
    code: string;
    name: string;
    color: string;
    icon?: string;
    isActive: boolean;
  }>;
  documentTypes: Array<{
    id: string;
    code: string;
    name: string;
    isActive: boolean;
  }>;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  setSystemConfigs: (configs: Record<string, string>) => void;
  setLanguages: (languages: SettingsState['languages']) => void;
  setCountries: (countries: SettingsState['countries']) => void;
  setTimezones: (timezones: SettingsState['timezones']) => void;
  setEventCategories: (categories: SettingsState['eventCategories']) => void;
  setDocumentTypes: (types: SettingsState['documentTypes']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateSystemConfig: (key: string, value: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    (set) => ({
      systemConfigs: {},
      languages: [],
      countries: [],
      timezones: [],
      eventCategories: [],
      documentTypes: [],
      isLoading: false,
      error: null,

      setSystemConfigs: (systemConfigs) =>
        set({ systemConfigs }, false, 'setSystemConfigs'),

      setLanguages: (languages) =>
        set({ languages }, false, 'setLanguages'),

      setCountries: (countries) =>
        set({ countries }, false, 'setCountries'),

      setTimezones: (timezones) =>
        set({ timezones }, false, 'setTimezones'),

      setEventCategories: (eventCategories) =>
        set({ eventCategories }, false, 'setEventCategories'),

      setDocumentTypes: (documentTypes) =>
        set({ documentTypes }, false, 'setDocumentTypes'),

      setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),

      setError: (error) => set({ error }, false, 'setError'),

      updateSystemConfig: (key, value) =>
        set(
          (state) => ({
            systemConfigs: { ...state.systemConfigs, [key]: value },
          }),
          false,
          'updateSystemConfig'
        ),
    }),
    { name: 'SettingsStore' }
  )
);

// ===========================================
// Notifications Store
// ===========================================

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;

  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setNotifications: (notifications: Notification[]) => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  devtools(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) =>
        set(
          (state) => {
            const newNotification: Notification = {
              ...notification,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              read: false,
            };
            return {
              notifications: [newNotification, ...state.notifications],
              unreadCount: state.unreadCount + 1,
            };
          },
          false,
          'addNotification'
        ),

      markAsRead: (id) =>
        set(
          (state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }),
          false,
          'markAsRead'
        ),

      markAllAsRead: () =>
        set(
          (state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
          }),
          false,
          'markAllAsRead'
        ),

      removeNotification: (id) =>
        set(
          (state) => {
            const notification = state.notifications.find((n) => n.id === id);
            return {
              notifications: state.notifications.filter((n) => n.id !== id),
              unreadCount: notification && !notification.read
                ? state.unreadCount - 1
                : state.unreadCount,
            };
          },
          false,
          'removeNotification'
        ),

      clearAll: () =>
        set({ notifications: [], unreadCount: 0 }, false, 'clearAll'),

      setNotifications: (notifications) =>
        set(
          {
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          },
          false,
          'setNotifications'
        ),
    }),
    { name: 'NotificationsStore' }
  )
);

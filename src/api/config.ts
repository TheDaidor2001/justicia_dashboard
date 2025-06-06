// src/api/config.ts

// Configuración base de la API
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
}

// Endpoints de la API
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  PROFILE: '/auth/profile',
  UPDATE_PROFILE: '/auth/profile',
  CHANGE_PASSWORD: '/auth/change-password',

  // Expedientes
  EXPEDIENTES: '/expedientes',
  EXPEDIENTE_DETAIL: (id: string) => `/expedientes/${id}`,
  EXPEDIENTE_SUBMIT: (id: string) => `/expedientes/${id}/submit`,
  EXPEDIENTE_APPROVE: (id: string) => `/expedientes/${id}/approve`,
  EXPEDIENTE_REJECT: (id: string) => `/expedientes/${id}/reject`,
  EXPEDIENTE_RETURN: (id: string) => `/expedientes/${id}/return`,
  EXPEDIENTE_HISTORY: (id: string) => `/expedientes/${id}/history`,
  EXPEDIENTES_STATS: '/expedientes/statistics',

  // Documentos
  DOCUMENTS_UPLOAD: (expedienteId: string) => `/documents/upload/${expedienteId}`,
  DOCUMENTS_BY_EXPEDIENTE: (expedienteId: string) => `/documents/expediente/${expedienteId}`,
  DOCUMENT_DETAIL: (id: string) => `/documents/${id}`,
  DOCUMENT_DOWNLOAD: (id: string) => `/documents/${id}/download`,
  DOCUMENT_DELETE: (id: string) => `/documents/${id}`,
  DOCUMENTS_STATS: '/documents/stats/summary',

  // Noticias
  NEWS_PUBLIC: '/news/public',
  NEWS_PUBLIC_SLUG: (slug: string) => `/news/public/slug/${slug}`,
  NEWS: '/news',
  NEWS_DETAIL: (id: string) => `/news/${id}`,
  NEWS_COURT_SUBMISSION: '/news/court-submission',
  NEWS_SUBMIT_DIRECTOR: (id: string) => `/news/${id}/submit-to-director`,
  NEWS_APPROVE_DIRECTOR: (id: string) => `/news/${id}/approve-director`,
  NEWS_APPROVE_PRESIDENT: (id: string) => `/news/${id}/approve-president`,
  NEWS_REJECT: (id: string) => `/news/${id}/reject`,
  NEWS_STATS: '/news/statistics',
  NEWS_HISTORY: (id: string) => `/news/${id}/history`,

  // Nuevos endpoints de noticias por rol
  NEWS_MY_NEWS: '/news/my-news',
  NEWS_PENDING_APPROVAL: '/news/pending-approval',
  NEWS_CREATED_BY_ME: '/news/created-by-me',

  // Contacto
  CONTACT_PUBLIC: '/contact/public',
  CONTACT: '/contact',
  CONTACT_DETAIL: (id: string) => `/contact/${id}`,
  CONTACT_STATUS: (id: string) => `/contact/${id}/status`,
  CONTACT_ASSIGN: (id: string) => `/contact/${id}/assign`,
  CONTACT_RESPOND: (id: string) => `/contact/${id}/respond`,
  CONTACT_STATS: '/contact/statistics',

  // Auditoría
  AUDIT: '/audit',
  AUDIT_USER: (userId: string) => `/audit/user/${userId}`,
  AUDIT_ENTITY: (type: string, id: string) => `/audit/entity/${type}/${id}`,
  AUDIT_STATS: '/audit/statistics',

  // Usuarios
  USERS_ASSIGNABLE: '/users/assignable',

  // Departamentos
  DEPARTMENTS_PUBLIC: '/departments/public',
  DEPARTMENTS: '/departments',
  DEPARTMENT_DETAIL: (id: string) => `/departments/${id}`,
  DEPARTMENTS_TREE: '/departments/tree',
  DEPARTMENTS_STATS: '/departments/statistics',
  DEPARTMENTS_REORDER: '/departments/reorder',
  DEPARTMENT_TOGGLE: (id: string) => `/departments/${id}/toggle-status`,

  // Biblioteca Digital
  BOOKS_PUBLIC: '/books/public',
  BOOKS: '/books',
  BOOK_DETAIL: (id: string) => `/books/${id}`,
  BOOK_DOWNLOAD: (id: string) => `/books/${id}/download`,
  BOOKS_TAGS_POPULAR: '/books/tags/popular',

  // Notificaciones
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_READ: (id: string) => `/notifications/${id}/read`,
  NOTIFICATIONS_READ_MULTIPLE: '/notifications/read-multiple',
  NOTIFICATIONS_UNREAD_COUNT: '/notifications/unread-count',

  // Dashboard
  DASHBOARD_PENDING_TASKS: '/dashboard/pending-tasks',
  DASHBOARD_SUMMARY: '/dashboard/summary',
  DASHBOARD_STATS_BY_ROLE: '/dashboard/stats-by-role',
}

// Claves de almacenamiento local
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
}

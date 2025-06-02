// src/types/dashboard.ts

export interface DashboardSummary {
    expedientes: {
        total: number;
        draft: number;
        pending: number;
        approved: number;
        rejected: number;
    };
    news?: {
        total: number;
        published: number;
        pending: number;
        draft: number;
    };
    contacts?: {
        total: number;
        pending: number;
        inProgress: number;
        resolved: number;
    };
    documents?: {
        total: number;
        totalSize: number;
        uploadedToday: number;
    };
}

export interface PendingTask {
    id: string;
    type: 'expediente' | 'news' | 'contact';
    title: string;
    description?: string;
    priority: 'alta' | 'media' | 'baja';
    createdAt: string;
    action: string;
    url?: string;
}

export interface DashboardStats {
    label: string;
    value: number | string;
    change?: number;
    changeType?: 'increase' | 'decrease';
    icon: string;
    color: string;
    description?: string;
}

export interface RecentActivity {
    id: string;
    user: string;
    action: string;
    entity: string;
    entityId: string;
    timestamp: string;
    icon?: string;
}

export interface DashboardFilters {
    period: 'day' | 'week' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
}
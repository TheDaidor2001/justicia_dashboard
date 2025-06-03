// src/types/news.ts

export enum NewsType {
    NOTICIA = 'noticia',
    AVISO = 'aviso',
    COMUNICADO = 'comunicado'
}

export enum NewsStatus {
    DRAFT = 'draft',
    PENDING_DIRECTOR = 'pending_director',
    PENDING_PRESIDENT = 'pending_president',
    PUBLISHED = 'published',
    REJECTED = 'rejected'
}

export interface News {
    id: string;
    title: string;
    subtitle?: string;
    content: string;
    type: NewsType;
    status: NewsStatus;
    slug: string;
    imageUrl?: string;
    imagePublicId?: string;
    publishedAt?: string;
    createdBy: string;
    departmentId: string;
    rejectionReason?: string;
    viewCount: number;
    createdAt: string;
    updatedAt: string;

    // Relaciones opcionales
    creator?: {
        id: string;
        fullName: string;
        role: string;
    };
    department?: {
        id: string;
        name: string;
    };
}

export interface CreateNewsDto {
    title: string;
    subtitle?: string;
    content: string;
    type: NewsType;
    image?: File;
}

export interface UpdateNewsDto {
    title?: string;
    subtitle?: string;
    content?: string;
    image?: File;
}

export interface SubmitNewsDto {
    comments?: string;
}

export interface ApproveNewsDto {
    comments?: string;
}

export interface RejectNewsDto {
    comments: string; // Requerido al rechazar
}

export interface CourtSubmissionDto {
    title: string;
    content: string;
    type: 'aviso' | 'comunicado'; // Solo estos dos tipos desde juzgados
    image?: File;
}

export interface NewsFilters {
    page?: number;
    limit?: number;
    search?: string;
    type?: NewsType;
    status?: NewsStatus;
    departmentId?: string;
    createdBy?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface NewsResponse {
    success: boolean;
    message?: string;
    data: News[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface NewsStatistics {
    total: number;
    byType: {
        noticia: number;
        aviso: number;
        comunicado: number;
    };
    byStatus: {
        draft: number;
        pending_director: number;
        pending_president: number;
        published: number;
        rejected: number;
    };
    publishedThisMonth: number;
    viewsThisMonth: number;
}

export interface NewsApprovalHistory {
    id: string;
    action: 'submit' | 'approve_director' | 'approve_president' | 'reject';
    comments?: string;
    createdAt: string;
    user: {
        id: string;
        fullName: string;
        role: string;
    };
}

// Helpers para el frontend
export const getNewsTypeLabel = (type: NewsType): string => {
    const labels: Record<NewsType, string> = {
        [NewsType.NOTICIA]: 'Noticia',
        [NewsType.AVISO]: 'Aviso',
        [NewsType.COMUNICADO]: 'Comunicado'
    };
    return labels[type] || type;
};

export const getNewsStatusLabel = (status: NewsStatus): string => {
    const labels: Record<NewsStatus, string> = {
        [NewsStatus.DRAFT]: 'Borrador',
        [NewsStatus.PENDING_DIRECTOR]: 'Pendiente Director',
        [NewsStatus.PENDING_PRESIDENT]: 'Pendiente Presidente',
        [NewsStatus.PUBLISHED]: 'Publicado',
        [NewsStatus.REJECTED]: 'Rechazado'
    };
    return labels[status] || status;
};

export const getNewsStatusBadge = (status: NewsStatus) => {
    const badges = {
        [NewsStatus.DRAFT]: { severity: 'secondary', icon: 'pi-pencil' },
        [NewsStatus.PENDING_DIRECTOR]: { severity: 'warning', icon: 'pi-clock' },
        [NewsStatus.PENDING_PRESIDENT]: { severity: 'info', icon: 'pi-user' },
        [NewsStatus.PUBLISHED]: { severity: 'success', icon: 'pi-check' },
        [NewsStatus.REJECTED]: { severity: 'danger', icon: 'pi-times' }
    };
    return badges[status] || badges[NewsStatus.DRAFT];
};

export const getNewsTypeColor = (type: NewsType): string => {
    const colors: Record<NewsType, string> = {
        [NewsType.NOTICIA]: 'blue',
        [NewsType.AVISO]: 'orange',
        [NewsType.COMUNICADO]: 'purple'
    };
    return colors[type] || 'gray';
};
// Tipos para gestión de expedientes

export enum ExpedienteStatus {
    DRAFT = 'draft',
    PENDING_APPROVAL = 'pending_approval',
    APPROVED = 'approved',
    REJECTED = 'rejected'
}

export enum ExpedienteLevel {
    JUEZ = 'juez',
    PRESIDENTE_AUDIENCIA = 'presidente_audiencia',
    SECRETARIO_GENERAL = 'secretario_general'
}

export interface Expediente {
    id: string;
    caseNumber: string; // Ej: "2024-00001"
    title: string;
    description?: string;
    status: ExpedienteStatus;
    currentLevel: ExpedienteLevel;
    departmentId: string;
    createdBy: string;
    rejectionReason?: string;
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
    documents?: ExpedienteDocument[];
    approvalHistory?: ApprovalHistoryItem[];
}

export interface ExpedienteDocument {
    id: string;
    filename: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
    uploadedAt: string;
}

export interface ApprovalHistoryItem {
    id: string;
    action: 'submit' | 'approve' | 'reject' | 'return_for_revision';
    comments?: string;
    fromLevel: ExpedienteLevel;
    toLevel?: ExpedienteLevel;
    createdAt: string;
    fromUser: {
        id: string;
        fullName: string;
        role: string;
    };
    toUser?: {
        id: string;
        fullName: string;
        role: string;
    };
}

export interface CreateExpedienteDto {
    title: string;
    description?: string;
    departmentId: string;
}

export interface UpdateExpedienteDto {
    title?: string;
    description?: string;
}

export interface SubmitExpedienteDto {
    comments?: string;
}

export interface ApproveExpedienteDto {
    comments?: string;
}

export interface RejectExpedienteDto {
    comments: string; // Requerido al rechazar
}

export interface ExpedienteFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: ExpedienteStatus;
    departmentId?: string;
    createdBy?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface ExpedientesResponse {
    success: boolean;
    data: Expediente[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ExpedienteStatistics {
    total: number;
    byStatus: {
        draft: number;
        pending_approval: number;
        approved: number;
        rejected: number;
    };
    byDepartment: Array<{
        departmentId: string;
        departmentName: string;
        count: number;
    }>;
    averageApprovalTime: number; // En días
    myPendingApprovals: number;
}
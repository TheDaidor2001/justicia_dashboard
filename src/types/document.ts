// Tipos para gestión de documentos

export interface Document {
    id: string;
    expedienteId: string;
    filename: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
    uploadedAt: string;

    // Relaciones opcionales
    uploader?: {
        id: string;
        fullName: string;
        role: string;
    };
}

export interface DocumentUploadResponse {
    success: boolean;
    message: string;
    data?: Document;
}

export interface DocumentsResponse {
    success: boolean;
    data: Document[];
}

export interface DocumentDownloadResponse {
    success: boolean;
    data?: {
        url: string;
        expiresIn: number; // segundos
        filename: string;
    };
}

export interface DocumentStats {
    totalDocuments: number;
    totalSize: number; // en bytes
    byType: Record<string, number>;
    recentUploads: Document[];
}

// Tipos de archivo permitidos
export const ALLOWED_FILE_TYPES = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'image/jpeg': '.jpg,.jpeg',
    'image/png': '.png',
    'image/gif': '.gif'
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Helpers
export const getFileExtension = (filename: string): string => {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
};

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (mimeType: string): string => {
    const icons: Record<string, string> = {
        'application/pdf': 'pi-file-pdf',
        'application/msword': 'pi-file-word',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'pi-file-word',
        'image/jpeg': 'pi-image',
        'image/png': 'pi-image',
        'image/gif': 'pi-image',
        'default': 'pi-file'
    };

    return icons[mimeType] || icons.default;
};

export const isImageFile = (mimeType: string): boolean => {
    return mimeType.startsWith('image/');
};
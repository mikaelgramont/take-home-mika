// Base entity that both files and folders share
export interface BaseEntity {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null; // null for root level items
}

// Supported file types configuration
export interface FileTypeConfig {
  mimeType: string;
  extension: string;
  maxSize: number; // in bytes
  displayName: string;
}

// Currently supported file types
export const SUPPORTED_FILE_TYPES: Record<string, FileTypeConfig> = {
  pdf: {
    mimeType: "application/pdf",
    extension: ".pdf",
    maxSize: 50 * 1024 * 1024, // 50MB
    displayName: "PDF Document",
  },
  jpeg: {
    mimeType: "image/jpeg",
    extension: ".jpg",
    maxSize: 10 * 1024 * 1024, // 10MB
    displayName: "JPEG Image",
  },
  png: {
    mimeType: "image/png",
    extension: ".png",
    maxSize: 10 * 1024 * 1024, // 10MB
    displayName: "PNG Image",
  },
  txt: {
    mimeType: "text/plain",
    extension: ".txt",
    maxSize: 1 * 1024 * 1024, // 1MB
    displayName: "Text File",
  },
} as const;

// Type for supported file type keys
export type SupportedFileType = keyof typeof SUPPORTED_FILE_TYPES;

// File entity with only fileType reference
export interface File extends BaseEntity {
  type: "file";
  fileType: SupportedFileType; // single source of truth
  size: number; // in bytes
  content: ArrayBuffer; // stored in browser memory
}

// Helper functions to get mimeType and extension
export function getFileMimeType(file: File): string {
  return SUPPORTED_FILE_TYPES[file.fileType].mimeType;
}

export function getFileExtension(file: File): string {
  return SUPPORTED_FILE_TYPES[file.fileType].extension;
}

// Folder entity
export interface Folder extends BaseEntity {
  type: "folder";
  children: (File | Folder)[]; // nested items
}

// Union type for any item in the data room
export type DataRoomItem = File | Folder;

// Main data room structure
export interface DataRoom {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  rootFolder: Folder;
  totalFiles: number;
  totalSize: number; // in bytes
}

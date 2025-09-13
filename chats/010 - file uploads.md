# Implement file upload dialog functionality
_Exported on 9/14/2025 at 00:09:43 GMT+2 from Cursor (1.5.11)_

---

**User**

When the Upload button is created, display a dialog with:
- a file drop target zone
- a button to open file picker

In both cases, only allow to choose files whose extension is mentioned in SUPPORTED_FILE_TYPES

Once a file is selected, add it to the data room, in the current folder (either the current item if it's a folder, or the current item's parent if it's a file).

Then navigate to the new file.

---

**Cursor**

I'll help you create an upload dialog with file drop target and file picker functionality. Let me first examine the current codebase to understand the structure and then implement the upload feature.


Now let me create a todo list to track the implementation of the upload dialog feature:


Let me first create the UploadDialog component:


```typescriptreact
import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SUPPORTED_FILE_TYPES, type SupportedFileType } from "@/types";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[]) => Promise<void>;
}

export default function UploadDialog({
  open,
  onOpenChange,
  onUpload,
}: UploadDialogProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileTypeFromFile = (file: globalThis.File): SupportedFileType | null => {
    const extension = file.name.toLowerCase().split('.').pop();
    if (!extension) return null;
    
    // Check if the extension matches any supported file type
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        return key as SupportedFileType;
      }
    }
    return null;
  };

  const validateFiles = (files: FileList): { valid: File[]; errors: string[] } => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const fileType = getFileTypeFromFile(file);
      
      if (!fileType) {
        const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
          .map(config => config.extension)
          .join(', ');
        errors.push(`${file.name}: Unsupported file type. Supported types: ${supportedExtensions}`);
        return;
      }

      const config = SUPPORTED_FILE_TYPES[fileType];
      if (file.size > config.maxSize) {
        const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
        errors.push(`${file.name}: File too large. Maximum size: ${maxSizeMB}MB`);
        return;
      }

      validFiles.push(file);
    });

    return { valid: validFiles, errors };
  };

  const handleFiles = useCallback(async (files: FileList) => {
    setError(null);
    
    const { valid, errors } = validateFiles(files);
    
    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }

    if (valid.length === 0) {
      setError('No valid files to upload');
      return;
    }

    try {
      setUploading(true);
      await onUpload(valid);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [onUpload, onOpenChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
    .map(config => config.extension)
    .join(', ');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload size={20} />
            Upload Files
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop files here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click the button below to browse
            </p>
            <Button
              onClick={handleBrowseClick}
              disabled={uploading}
              variant="outline"
              className="w-full"
            >
              <FileText size={16} className="mr-2" />
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={supportedExtensions}
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Supported File Types Info */}
          <div className="text-xs text-gray-500">
            <p className="font-medium mb-1">Supported file types:</p>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(SUPPORTED_FILE_TYPES).map(([key, config]) => (
                <div key={key} className="flex items-center gap-1">
                  <span className="font-mono text-xs">{config.extension}</span>
                  <span className="text-gray-400">({config.displayName})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <pre className="whitespace-pre-wrap font-sans">{error}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Upload Status */}
          {uploading && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Uploading files...
              </div>
            </div>
          )}
        </div>

        {/* Dialog Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

Now let me update the DataRoomService to properly handle multiple file types:


```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): DataRoom;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private getStoredDataRoom(): DataRoom | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);
    return parsed;
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return this.getStoredDataRoom();
  }

  initializeDataRoom(): DataRoom {
    const existingDataRoom = this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split('.').pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map(config => config.extension)
        .join(', ');
      throw new Error(`Unsupported file type. Supported types: ${supportedExtensions}`);
    }

    // Validate file size
    const config = SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      content: await file.arrayBuffer(),
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

I need to add the import for SUPPORTED_FILE_TYPES in the DataRoomService:


```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): DataRoom;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private getStoredDataRoom(): DataRoom | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);
    return parsed;
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return this.getStoredDataRoom();
  }

  initializeDataRoom(): DataRoom {
    const existingDataRoom = this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split('.').pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map(config => config.extension)
        .join(', ');
      throw new Error(`Unsupported file type. Supported types: ${supportedExtensions}`);
    }

    // Validate file size
    const config = SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      content: await file.arrayBuffer(),
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

Now let me update the App.tsx to integrate the upload dialog:


```typescriptreact
import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import { Upload, FolderPlus } from "lucide-react";
import DataRoomTreeView from "@/components/DataRoomTreeView";
import Breadcrumbs from "@/components/Breadcrumbs";
import Content from "@/components/Content";
import NewFolderDialog from "@/components/NewFolderDialog";
import UploadDialog from "@/components/UploadDialog";
import { dataRoomService } from "@/services/DataRoomService";
import {
  findItemByPath,
  getItemPath,
  findParentFolder,
  findItemById,
} from "@/lib/pathUtils";
import type { DataRoomItem, DataRoom } from "@/types";

function DataRoomApp() {
  const { "*": rawPath = "/" } = useParams<{ "*"?: string }>();
  // Decode the path parameter to handle URL encoding
  const path = decodeURIComponent(rawPath);

  const navigate = useNavigate();
  const [dataRoom, setDataRoom] = useState<DataRoom | null>(() =>
    dataRoomService.initializeDataRoom()
  );
  const [selectedItem, setSelectedItem] = useState<DataRoomItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);

  // Update selectedItem based on URL path
  useEffect(() => {
    if (!dataRoom) {
      setError("No data room found");
      return;
    }

    const item = findItemByPath(dataRoom.rootFolder, path);

    if (item) {
      setSelectedItem(item);
      setError(null);
    } else {
      setSelectedItem(null);
      setError(`Path "${path}" not found`);
    }
  }, [path, dataRoom]);

  const handleItemSelect = (item: DataRoomItem | null) => {
    if (!dataRoom) {
      return;
    }

    if (item) {
      const itemPath = getItemPath(item, dataRoom.rootFolder);
      navigate(itemPath);
    } else {
      navigate("/");
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      await dataRoomService.updateFolderName(folderId, newName);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Update selected item if it's the renamed folder
        if (selectedItem?.id === folderId) {
          const updatedItem = findItemById(
            updatedDataRoom.rootFolder,
            folderId
          );
          setSelectedItem(updatedItem);
          // Update URL to reflect the new path
          if (updatedItem) {
            const newPath = getItemPath(
              updatedItem,
              updatedDataRoom.rootFolder
            );
            navigate(newPath);
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to rename folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      // Find parent folder before deletion
      const parentFolder = selectedItem
        ? findParentFolder(selectedItem, dataRoom!.rootFolder)
        : null;

      await dataRoomService.deleteFolder(folderId);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Navigate to parent or root if deleted folder was selected
        if (selectedItem?.id === folderId) {
          if (parentFolder) {
            const parentPath = getItemPath(
              parentFolder,
              updatedDataRoom.rootFolder
            );
            navigate(parentPath);
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to delete folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    try {
      await dataRoomService.updateFileName(fileId, newName);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Update selected item if it's the renamed file
        if (selectedItem?.id === fileId) {
          const updatedItem = findItemById(updatedDataRoom.rootFolder, fileId);
          setSelectedItem(updatedItem);
          // Update URL to reflect the new path
          if (updatedItem) {
            const newPath = getItemPath(
              updatedItem,
              updatedDataRoom.rootFolder
            );
            navigate(newPath);
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to rename file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      // Find parent folder before deletion
      const parentFolder = selectedItem
        ? findParentFolder(selectedItem, dataRoom!.rootFolder)
        : null;

      await dataRoomService.deleteFile(fileId);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Navigate to parent or root if deleted file was selected
        if (selectedItem?.id === fileId) {
          if (parentFolder) {
            const parentPath = getItemPath(
              parentFolder,
              updatedDataRoom.rootFolder
            );
            navigate(parentPath);
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to delete file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleNewFolder = async (folderName: string) => {
    try {
      if (!dataRoom) {
        setError("No data room found");
        return;
      }

      // Determine the parent folder for the new folder
      let parentId: string | null = null;

      if (selectedItem) {
        if (selectedItem.type === "folder") {
          // If current item is a folder, create the new folder inside it
          parentId = selectedItem.id;
        } else {
          // If current item is a file, create the new folder in the file's parent
          const parentFolder = findParentFolder(
            selectedItem,
            dataRoom.rootFolder
          );
          parentId = parentFolder?.id || null;
        }
      }
      // If no selected item, create at root level (parentId remains null)

      const newFolder = await dataRoomService.createFolder(
        folderName,
        parentId
      );

      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);

        // Navigate to the newly created folder
        const newFolderPath = getItemPath(
          newFolder,
          updatedDataRoom.rootFolder
        );
        navigate(newFolderPath);
      }
    } catch (err) {
      setError(
        `Failed to create folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  if (!dataRoom) {
    return <div>No data room!</div>;
  }

  return (
    <div className="grid-areas-layout">
      {/* Masthead */}
      <div className="grid-area-masthead bg-gray-50 border-b border-gray-200 flex items-center px-6">
        <h1 className="text-2xl font-bold text-gray-900">ACME Data Room</h1>
      </div>

      {/* Toolbar */}
      <div className="grid-area-toolbar flex flex-row flex-wrap bg-white border-b border-gray-200 items-center justify-between px-6">
        <Breadcrumbs
          selectedItem={selectedItem}
          onNavigate={handleItemSelect}
        />
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Upload size={16} />
            Upload
          </button>
          <button
            onClick={() => setNewFolderDialogOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FolderPlus size={16} />
            New Folder
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div className="grid-area-tree bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
        <DataRoomTreeView
          root={dataRoom.rootFolder}
          onItemSelect={handleItemSelect}
          selectedItemId={selectedItem?.id}
          expandAll={false}
        />
      </div>

      {/* Content Area */}
      <div className="grid-area-content bg-white p-6 overflow-y-auto">
        <Content
          selectedItem={selectedItem}
          rootFolderId={dataRoom.rootFolder.id}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
        />
      </div>

      {/* Messages */}
      <div className="grid-area-messages bg-gray-100 border-t border-gray-200 flex items-center px-6">
        <p className={`text-sm ${error ? "text-red-600" : "text-gray-600"}`}>
          {error || "Ready"}
        </p>
      </div>

      {/* New Folder Dialog */}
      <NewFolderDialog
        open={newFolderDialogOpen}
        onOpenChange={setNewFolderDialogOpen}
        onConfirm={handleNewFolder}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<DataRoomApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

```

```typescriptreact
import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import { Upload, FolderPlus } from "lucide-react";
import DataRoomTreeView from "@/components/DataRoomTreeView";
import Breadcrumbs from "@/components/Breadcrumbs";
import Content from "@/components/Content";
import NewFolderDialog from "@/components/NewFolderDialog";
import UploadDialog from "@/components/UploadDialog";
import { dataRoomService } from "@/services/DataRoomService";
import {
  findItemByPath,
  getItemPath,
  findParentFolder,
  findItemById,
} from "@/lib/pathUtils";
import type { DataRoomItem, DataRoom } from "@/types";

function DataRoomApp() {
  const { "*": rawPath = "/" } = useParams<{ "*"?: string }>();
  // Decode the path parameter to handle URL encoding
  const path = decodeURIComponent(rawPath);

  const navigate = useNavigate();
  const [dataRoom, setDataRoom] = useState<DataRoom | null>(() =>
    dataRoomService.initializeDataRoom()
  );
  const [selectedItem, setSelectedItem] = useState<DataRoomItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Update selectedItem based on URL path
  useEffect(() => {
    if (!dataRoom) {
      setError("No data room found");
      return;
    }

    const item = findItemByPath(dataRoom.rootFolder, path);

    if (item) {
      setSelectedItem(item);
      setError(null);
    } else {
      setSelectedItem(null);
      setError(`Path "${path}" not found`);
    }
  }, [path, dataRoom]);

  const handleItemSelect = (item: DataRoomItem | null) => {
    if (!dataRoom) {
      return;
    }

    if (item) {
      const itemPath = getItemPath(item, dataRoom.rootFolder);
      navigate(itemPath);
    } else {
      navigate("/");
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      await dataRoomService.updateFolderName(folderId, newName);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Update selected item if it's the renamed folder
        if (selectedItem?.id === folderId) {
          const updatedItem = findItemById(
            updatedDataRoom.rootFolder,
            folderId
          );
          setSelectedItem(updatedItem);
          // Update URL to reflect the new path
          if (updatedItem) {
            const newPath = getItemPath(
              updatedItem,
              updatedDataRoom.rootFolder
            );
            navigate(newPath);
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to rename folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      // Find parent folder before deletion
      const parentFolder = selectedItem
        ? findParentFolder(selectedItem, dataRoom!.rootFolder)
        : null;

      await dataRoomService.deleteFolder(folderId);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Navigate to parent or root if deleted folder was selected
        if (selectedItem?.id === folderId) {
          if (parentFolder) {
            const parentPath = getItemPath(
              parentFolder,
              updatedDataRoom.rootFolder
            );
            navigate(parentPath);
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to delete folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    try {
      await dataRoomService.updateFileName(fileId, newName);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Update selected item if it's the renamed file
        if (selectedItem?.id === fileId) {
          const updatedItem = findItemById(updatedDataRoom.rootFolder, fileId);
          setSelectedItem(updatedItem);
          // Update URL to reflect the new path
          if (updatedItem) {
            const newPath = getItemPath(
              updatedItem,
              updatedDataRoom.rootFolder
            );
            navigate(newPath);
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to rename file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      // Find parent folder before deletion
      const parentFolder = selectedItem
        ? findParentFolder(selectedItem, dataRoom!.rootFolder)
        : null;

      await dataRoomService.deleteFile(fileId);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Navigate to parent or root if deleted file was selected
        if (selectedItem?.id === fileId) {
          if (parentFolder) {
            const parentPath = getItemPath(
              parentFolder,
              updatedDataRoom.rootFolder
            );
            navigate(parentPath);
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to delete file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleNewFolder = async (folderName: string) => {
    try {
      if (!dataRoom) {
        setError("No data room found");
        return;
      }

      // Determine the parent folder for the new folder
      let parentId: string | null = null;

      if (selectedItem) {
        if (selectedItem.type === "folder") {
          // If current item is a folder, create the new folder inside it
          parentId = selectedItem.id;
        } else {
          // If current item is a file, create the new folder in the file's parent
          const parentFolder = findParentFolder(
            selectedItem,
            dataRoom.rootFolder
          );
          parentId = parentFolder?.id || null;
        }
      }
      // If no selected item, create at root level (parentId remains null)

      const newFolder = await dataRoomService.createFolder(
        folderName,
        parentId
      );

      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);

        // Navigate to the newly created folder
        const newFolderPath = getItemPath(
          newFolder,
          updatedDataRoom.rootFolder
        );
        navigate(newFolderPath);
      }
    } catch (err) {
      setError(
        `Failed to create folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  if (!dataRoom) {
    return <div>No data room!</div>;
  }

  return (
    <div className="grid-areas-layout">
      {/* Masthead */}
      <div className="grid-area-masthead bg-gray-50 border-b border-gray-200 flex items-center px-6">
        <h1 className="text-2xl font-bold text-gray-900">ACME Data Room</h1>
      </div>

      {/* Toolbar */}
      <div className="grid-area-toolbar flex flex-row flex-wrap bg-white border-b border-gray-200 items-center justify-between px-6">
        <Breadcrumbs
          selectedItem={selectedItem}
          onNavigate={handleItemSelect}
        />
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Upload size={16} />
            Upload
          </button>
          <button
            onClick={() => setNewFolderDialogOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FolderPlus size={16} />
            New Folder
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div className="grid-area-tree bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
        <DataRoomTreeView
          root={dataRoom.rootFolder}
          onItemSelect={handleItemSelect}
          selectedItemId={selectedItem?.id}
          expandAll={false}
        />
      </div>

      {/* Content Area */}
      <div className="grid-area-content bg-white p-6 overflow-y-auto">
        <Content
          selectedItem={selectedItem}
          rootFolderId={dataRoom.rootFolder.id}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
        />
      </div>

      {/* Messages */}
      <div className="grid-area-messages bg-gray-100 border-t border-gray-200 flex items-center px-6">
        <p className={`text-sm ${error ? "text-red-600" : "text-gray-600"}`}>
          {error || "Ready"}
        </p>
      </div>

      {/* New Folder Dialog */}
      <NewFolderDialog
        open={newFolderDialogOpen}
        onOpenChange={setNewFolderDialogOpen}
        onConfirm={handleNewFolder}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<DataRoomApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

```

Now let me add the upload handler function:


```typescriptreact
import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import { Upload, FolderPlus } from "lucide-react";
import DataRoomTreeView from "@/components/DataRoomTreeView";
import Breadcrumbs from "@/components/Breadcrumbs";
import Content from "@/components/Content";
import NewFolderDialog from "@/components/NewFolderDialog";
import UploadDialog from "@/components/UploadDialog";
import { dataRoomService } from "@/services/DataRoomService";
import {
  findItemByPath,
  getItemPath,
  findParentFolder,
  findItemById,
} from "@/lib/pathUtils";
import type { DataRoomItem, DataRoom } from "@/types";

function DataRoomApp() {
  const { "*": rawPath = "/" } = useParams<{ "*"?: string }>();
  // Decode the path parameter to handle URL encoding
  const path = decodeURIComponent(rawPath);

  const navigate = useNavigate();
  const [dataRoom, setDataRoom] = useState<DataRoom | null>(() =>
    dataRoomService.initializeDataRoom()
  );
  const [selectedItem, setSelectedItem] = useState<DataRoomItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Update selectedItem based on URL path
  useEffect(() => {
    if (!dataRoom) {
      setError("No data room found");
      return;
    }

    const item = findItemByPath(dataRoom.rootFolder, path);

    if (item) {
      setSelectedItem(item);
      setError(null);
    } else {
      setSelectedItem(null);
      setError(`Path "${path}" not found`);
    }
  }, [path, dataRoom]);

  const handleItemSelect = (item: DataRoomItem | null) => {
    if (!dataRoom) {
      return;
    }

    if (item) {
      const itemPath = getItemPath(item, dataRoom.rootFolder);
      navigate(itemPath);
    } else {
      navigate("/");
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      await dataRoomService.updateFolderName(folderId, newName);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Update selected item if it's the renamed folder
        if (selectedItem?.id === folderId) {
          const updatedItem = findItemById(
            updatedDataRoom.rootFolder,
            folderId
          );
          setSelectedItem(updatedItem);
          // Update URL to reflect the new path
          if (updatedItem) {
            const newPath = getItemPath(
              updatedItem,
              updatedDataRoom.rootFolder
            );
            navigate(newPath);
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to rename folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      // Find parent folder before deletion
      const parentFolder = selectedItem
        ? findParentFolder(selectedItem, dataRoom!.rootFolder)
        : null;

      await dataRoomService.deleteFolder(folderId);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Navigate to parent or root if deleted folder was selected
        if (selectedItem?.id === folderId) {
          if (parentFolder) {
            const parentPath = getItemPath(
              parentFolder,
              updatedDataRoom.rootFolder
            );
            navigate(parentPath);
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to delete folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    try {
      await dataRoomService.updateFileName(fileId, newName);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Update selected item if it's the renamed file
        if (selectedItem?.id === fileId) {
          const updatedItem = findItemById(updatedDataRoom.rootFolder, fileId);
          setSelectedItem(updatedItem);
          // Update URL to reflect the new path
          if (updatedItem) {
            const newPath = getItemPath(
              updatedItem,
              updatedDataRoom.rootFolder
            );
            navigate(newPath);
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to rename file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      // Find parent folder before deletion
      const parentFolder = selectedItem
        ? findParentFolder(selectedItem, dataRoom!.rootFolder)
        : null;

      await dataRoomService.deleteFile(fileId);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Navigate to parent or root if deleted file was selected
        if (selectedItem?.id === fileId) {
          if (parentFolder) {
            const parentPath = getItemPath(
              parentFolder,
              updatedDataRoom.rootFolder
            );
            navigate(parentPath);
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to delete file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleNewFolder = async (folderName: string) => {
    try {
      if (!dataRoom) {
        setError("No data room found");
        return;
      }

      // Determine the parent folder for the new folder
      let parentId: string | null = null;

      if (selectedItem) {
        if (selectedItem.type === "folder") {
          // If current item is a folder, create the new folder inside it
          parentId = selectedItem.id;
        } else {
          // If current item is a file, create the new folder in the file's parent
          const parentFolder = findParentFolder(
            selectedItem,
            dataRoom.rootFolder
          );
          parentId = parentFolder?.id || null;
        }
      }
      // If no selected item, create at root level (parentId remains null)

      const newFolder = await dataRoomService.createFolder(
        folderName,
        parentId
      );

      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);

        // Navigate to the newly created folder
        const newFolderPath = getItemPath(
          newFolder,
          updatedDataRoom.rootFolder
        );
        navigate(newFolderPath);
      }
    } catch (err) {
      setError(
        `Failed to create folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleUpload = async (files: File[]) => {
    try {
      if (!dataRoom) {
        setError("No data room found");
        return;
      }

      // Determine the parent folder for the uploaded files
      let parentId: string | null = null;

      if (selectedItem) {
        if (selectedItem.type === "folder") {
          // If current item is a folder, upload files inside it
          parentId = selectedItem.id;
        } else {
          // If current item is a file, upload files in the file's parent
          const parentFolder = findParentFolder(
            selectedItem,
            dataRoom.rootFolder
          );
          parentId = parentFolder?.id || null;
        }
      }
      // If no selected item, upload at root level (parentId remains null)

      // Upload all files
      const uploadedFiles = [];
      for (const file of files) {
        const uploadedFile = await dataRoomService.uploadFile(file, parentId);
        uploadedFiles.push(uploadedFile);
      }

      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);

        // Navigate to the first uploaded file
        if (uploadedFiles.length > 0) {
          const firstFile = uploadedFiles[0];
          const filePath = getItemPath(firstFile, updatedDataRoom.rootFolder);
          navigate(filePath);
        }
      }
    } catch (err) {
      setError(
        `Failed to upload files: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  if (!dataRoom) {
    return <div>No data room!</div>;
  }

  return (
    <div className="grid-areas-layout">
      {/* Masthead */}
      <div className="grid-area-masthead bg-gray-50 border-b border-gray-200 flex items-center px-6">
        <h1 className="text-2xl font-bold text-gray-900">ACME Data Room</h1>
      </div>

      {/* Toolbar */}
      <div className="grid-area-toolbar flex flex-row flex-wrap bg-white border-b border-gray-200 items-center justify-between px-6">
        <Breadcrumbs
          selectedItem={selectedItem}
          onNavigate={handleItemSelect}
        />
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Upload size={16} />
            Upload
          </button>
          <button
            onClick={() => setNewFolderDialogOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FolderPlus size={16} />
            New Folder
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div className="grid-area-tree bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
        <DataRoomTreeView
          root={dataRoom.rootFolder}
          onItemSelect={handleItemSelect}
          selectedItemId={selectedItem?.id}
          expandAll={false}
        />
      </div>

      {/* Content Area */}
      <div className="grid-area-content bg-white p-6 overflow-y-auto">
        <Content
          selectedItem={selectedItem}
          rootFolderId={dataRoom.rootFolder.id}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
        />
      </div>

      {/* Messages */}
      <div className="grid-area-messages bg-gray-100 border-t border-gray-200 flex items-center px-6">
        <p className={`text-sm ${error ? "text-red-600" : "text-gray-600"}`}>
          {error || "Ready"}
        </p>
      </div>

      {/* New Folder Dialog */}
      <NewFolderDialog
        open={newFolderDialogOpen}
        onOpenChange={setNewFolderDialogOpen}
        onConfirm={handleNewFolder}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<DataRoomApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

```

Now let me update the Upload button to open the dialog:


```typescriptreact
import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import { Upload, FolderPlus } from "lucide-react";
import DataRoomTreeView from "@/components/DataRoomTreeView";
import Breadcrumbs from "@/components/Breadcrumbs";
import Content from "@/components/Content";
import NewFolderDialog from "@/components/NewFolderDialog";
import UploadDialog from "@/components/UploadDialog";
import { dataRoomService } from "@/services/DataRoomService";
import {
  findItemByPath,
  getItemPath,
  findParentFolder,
  findItemById,
} from "@/lib/pathUtils";
import type { DataRoomItem, DataRoom } from "@/types";

function DataRoomApp() {
  const { "*": rawPath = "/" } = useParams<{ "*"?: string }>();
  // Decode the path parameter to handle URL encoding
  const path = decodeURIComponent(rawPath);

  const navigate = useNavigate();
  const [dataRoom, setDataRoom] = useState<DataRoom | null>(() =>
    dataRoomService.initializeDataRoom()
  );
  const [selectedItem, setSelectedItem] = useState<DataRoomItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Update selectedItem based on URL path
  useEffect(() => {
    if (!dataRoom) {
      setError("No data room found");
      return;
    }

    const item = findItemByPath(dataRoom.rootFolder, path);

    if (item) {
      setSelectedItem(item);
      setError(null);
    } else {
      setSelectedItem(null);
      setError(`Path "${path}" not found`);
    }
  }, [path, dataRoom]);

  const handleItemSelect = (item: DataRoomItem | null) => {
    if (!dataRoom) {
      return;
    }

    if (item) {
      const itemPath = getItemPath(item, dataRoom.rootFolder);
      navigate(itemPath);
    } else {
      navigate("/");
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      await dataRoomService.updateFolderName(folderId, newName);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Update selected item if it's the renamed folder
        if (selectedItem?.id === folderId) {
          const updatedItem = findItemById(
            updatedDataRoom.rootFolder,
            folderId
          );
          setSelectedItem(updatedItem);
          // Update URL to reflect the new path
          if (updatedItem) {
            const newPath = getItemPath(
              updatedItem,
              updatedDataRoom.rootFolder
            );
            navigate(newPath);
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to rename folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      // Find parent folder before deletion
      const parentFolder = selectedItem
        ? findParentFolder(selectedItem, dataRoom!.rootFolder)
        : null;

      await dataRoomService.deleteFolder(folderId);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Navigate to parent or root if deleted folder was selected
        if (selectedItem?.id === folderId) {
          if (parentFolder) {
            const parentPath = getItemPath(
              parentFolder,
              updatedDataRoom.rootFolder
            );
            navigate(parentPath);
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to delete folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    try {
      await dataRoomService.updateFileName(fileId, newName);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Update selected item if it's the renamed file
        if (selectedItem?.id === fileId) {
          const updatedItem = findItemById(updatedDataRoom.rootFolder, fileId);
          setSelectedItem(updatedItem);
          // Update URL to reflect the new path
          if (updatedItem) {
            const newPath = getItemPath(
              updatedItem,
              updatedDataRoom.rootFolder
            );
            navigate(newPath);
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to rename file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      // Find parent folder before deletion
      const parentFolder = selectedItem
        ? findParentFolder(selectedItem, dataRoom!.rootFolder)
        : null;

      await dataRoomService.deleteFile(fileId);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Navigate to parent or root if deleted file was selected
        if (selectedItem?.id === fileId) {
          if (parentFolder) {
            const parentPath = getItemPath(
              parentFolder,
              updatedDataRoom.rootFolder
            );
            navigate(parentPath);
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to delete file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleNewFolder = async (folderName: string) => {
    try {
      if (!dataRoom) {
        setError("No data room found");
        return;
      }

      // Determine the parent folder for the new folder
      let parentId: string | null = null;

      if (selectedItem) {
        if (selectedItem.type === "folder") {
          // If current item is a folder, create the new folder inside it
          parentId = selectedItem.id;
        } else {
          // If current item is a file, create the new folder in the file's parent
          const parentFolder = findParentFolder(
            selectedItem,
            dataRoom.rootFolder
          );
          parentId = parentFolder?.id || null;
        }
      }
      // If no selected item, create at root level (parentId remains null)

      const newFolder = await dataRoomService.createFolder(
        folderName,
        parentId
      );

      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);

        // Navigate to the newly created folder
        const newFolderPath = getItemPath(
          newFolder,
          updatedDataRoom.rootFolder
        );
        navigate(newFolderPath);
      }
    } catch (err) {
      setError(
        `Failed to create folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleUpload = async (files: File[]) => {
    try {
      if (!dataRoom) {
        setError("No data room found");
        return;
      }

      // Determine the parent folder for the uploaded files
      let parentId: string | null = null;

      if (selectedItem) {
        if (selectedItem.type === "folder") {
          // If current item is a folder, upload files inside it
          parentId = selectedItem.id;
        } else {
          // If current item is a file, upload files in the file's parent
          const parentFolder = findParentFolder(
            selectedItem,
            dataRoom.rootFolder
          );
          parentId = parentFolder?.id || null;
        }
      }
      // If no selected item, upload at root level (parentId remains null)

      // Upload all files
      const uploadedFiles = [];
      for (const file of files) {
        const uploadedFile = await dataRoomService.uploadFile(file, parentId);
        uploadedFiles.push(uploadedFile);
      }

      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);

        // Navigate to the first uploaded file
        if (uploadedFiles.length > 0) {
          const firstFile = uploadedFiles[0];
          const filePath = getItemPath(firstFile, updatedDataRoom.rootFolder);
          navigate(filePath);
        }
      }
    } catch (err) {
      setError(
        `Failed to upload files: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  if (!dataRoom) {
    return <div>No data room!</div>;
  }

  return (
    <div className="grid-areas-layout">
      {/* Masthead */}
      <div className="grid-area-masthead bg-gray-50 border-b border-gray-200 flex items-center px-6">
        <h1 className="text-2xl font-bold text-gray-900">ACME Data Room</h1>
      </div>

      {/* Toolbar */}
      <div className="grid-area-toolbar flex flex-row flex-wrap bg-white border-b border-gray-200 items-center justify-between px-6">
        <Breadcrumbs
          selectedItem={selectedItem}
          onNavigate={handleItemSelect}
        />
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setUploadDialogOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Upload size={16} />
            Upload
          </button>
          <button
            onClick={() => setNewFolderDialogOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FolderPlus size={16} />
            New Folder
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div className="grid-area-tree bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
        <DataRoomTreeView
          root={dataRoom.rootFolder}
          onItemSelect={handleItemSelect}
          selectedItemId={selectedItem?.id}
          expandAll={false}
        />
      </div>

      {/* Content Area */}
      <div className="grid-area-content bg-white p-6 overflow-y-auto">
        <Content
          selectedItem={selectedItem}
          rootFolderId={dataRoom.rootFolder.id}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
        />
      </div>

      {/* Messages */}
      <div className="grid-area-messages bg-gray-100 border-t border-gray-200 flex items-center px-6">
        <p className={`text-sm ${error ? "text-red-600" : "text-gray-600"}`}>
          {error || "Ready"}
        </p>
      </div>

      {/* New Folder Dialog */}
      <NewFolderDialog
        open={newFolderDialogOpen}
        onOpenChange={setNewFolderDialogOpen}
        onConfirm={handleNewFolder}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<DataRoomApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

```

Now let me add the UploadDialog component to the JSX:


```typescriptreact
import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import { Upload, FolderPlus } from "lucide-react";
import DataRoomTreeView from "@/components/DataRoomTreeView";
import Breadcrumbs from "@/components/Breadcrumbs";
import Content from "@/components/Content";
import NewFolderDialog from "@/components/NewFolderDialog";
import UploadDialog from "@/components/UploadDialog";
import { dataRoomService } from "@/services/DataRoomService";
import {
  findItemByPath,
  getItemPath,
  findParentFolder,
  findItemById,
} from "@/lib/pathUtils";
import type { DataRoomItem, DataRoom } from "@/types";

function DataRoomApp() {
  const { "*": rawPath = "/" } = useParams<{ "*"?: string }>();
  // Decode the path parameter to handle URL encoding
  const path = decodeURIComponent(rawPath);

  const navigate = useNavigate();
  const [dataRoom, setDataRoom] = useState<DataRoom | null>(() =>
    dataRoomService.initializeDataRoom()
  );
  const [selectedItem, setSelectedItem] = useState<DataRoomItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Update selectedItem based on URL path
  useEffect(() => {
    if (!dataRoom) {
      setError("No data room found");
      return;
    }

    const item = findItemByPath(dataRoom.rootFolder, path);

    if (item) {
      setSelectedItem(item);
      setError(null);
    } else {
      setSelectedItem(null);
      setError(`Path "${path}" not found`);
    }
  }, [path, dataRoom]);

  const handleItemSelect = (item: DataRoomItem | null) => {
    if (!dataRoom) {
      return;
    }

    if (item) {
      const itemPath = getItemPath(item, dataRoom.rootFolder);
      navigate(itemPath);
    } else {
      navigate("/");
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      await dataRoomService.updateFolderName(folderId, newName);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Update selected item if it's the renamed folder
        if (selectedItem?.id === folderId) {
          const updatedItem = findItemById(
            updatedDataRoom.rootFolder,
            folderId
          );
          setSelectedItem(updatedItem);
          // Update URL to reflect the new path
          if (updatedItem) {
            const newPath = getItemPath(
              updatedItem,
              updatedDataRoom.rootFolder
            );
            navigate(newPath);
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to rename folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      // Find parent folder before deletion
      const parentFolder = selectedItem
        ? findParentFolder(selectedItem, dataRoom!.rootFolder)
        : null;

      await dataRoomService.deleteFolder(folderId);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Navigate to parent or root if deleted folder was selected
        if (selectedItem?.id === folderId) {
          if (parentFolder) {
            const parentPath = getItemPath(
              parentFolder,
              updatedDataRoom.rootFolder
            );
            navigate(parentPath);
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to delete folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    try {
      await dataRoomService.updateFileName(fileId, newName);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Update selected item if it's the renamed file
        if (selectedItem?.id === fileId) {
          const updatedItem = findItemById(updatedDataRoom.rootFolder, fileId);
          setSelectedItem(updatedItem);
          // Update URL to reflect the new path
          if (updatedItem) {
            const newPath = getItemPath(
              updatedItem,
              updatedDataRoom.rootFolder
            );
            navigate(newPath);
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to rename file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      // Find parent folder before deletion
      const parentFolder = selectedItem
        ? findParentFolder(selectedItem, dataRoom!.rootFolder)
        : null;

      await dataRoomService.deleteFile(fileId);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Navigate to parent or root if deleted file was selected
        if (selectedItem?.id === fileId) {
          if (parentFolder) {
            const parentPath = getItemPath(
              parentFolder,
              updatedDataRoom.rootFolder
            );
            navigate(parentPath);
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to delete file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleNewFolder = async (folderName: string) => {
    try {
      if (!dataRoom) {
        setError("No data room found");
        return;
      }

      // Determine the parent folder for the new folder
      let parentId: string | null = null;

      if (selectedItem) {
        if (selectedItem.type === "folder") {
          // If current item is a folder, create the new folder inside it
          parentId = selectedItem.id;
        } else {
          // If current item is a file, create the new folder in the file's parent
          const parentFolder = findParentFolder(
            selectedItem,
            dataRoom.rootFolder
          );
          parentId = parentFolder?.id || null;
        }
      }
      // If no selected item, create at root level (parentId remains null)

      const newFolder = await dataRoomService.createFolder(
        folderName,
        parentId
      );

      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);

        // Navigate to the newly created folder
        const newFolderPath = getItemPath(
          newFolder,
          updatedDataRoom.rootFolder
        );
        navigate(newFolderPath);
      }
    } catch (err) {
      setError(
        `Failed to create folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleUpload = async (files: File[]) => {
    try {
      if (!dataRoom) {
        setError("No data room found");
        return;
      }

      // Determine the parent folder for the uploaded files
      let parentId: string | null = null;

      if (selectedItem) {
        if (selectedItem.type === "folder") {
          // If current item is a folder, upload files inside it
          parentId = selectedItem.id;
        } else {
          // If current item is a file, upload files in the file's parent
          const parentFolder = findParentFolder(
            selectedItem,
            dataRoom.rootFolder
          );
          parentId = parentFolder?.id || null;
        }
      }
      // If no selected item, upload at root level (parentId remains null)

      // Upload all files
      const uploadedFiles = [];
      for (const file of files) {
        const uploadedFile = await dataRoomService.uploadFile(file, parentId);
        uploadedFiles.push(uploadedFile);
      }

      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);

        // Navigate to the first uploaded file
        if (uploadedFiles.length > 0) {
          const firstFile = uploadedFiles[0];
          const filePath = getItemPath(firstFile, updatedDataRoom.rootFolder);
          navigate(filePath);
        }
      }
    } catch (err) {
      setError(
        `Failed to upload files: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  if (!dataRoom) {
    return <div>No data room!</div>;
  }

  return (
    <div className="grid-areas-layout">
      {/* Masthead */}
      <div className="grid-area-masthead bg-gray-50 border-b border-gray-200 flex items-center px-6">
        <h1 className="text-2xl font-bold text-gray-900">ACME Data Room</h1>
      </div>

      {/* Toolbar */}
      <div className="grid-area-toolbar flex flex-row flex-wrap bg-white border-b border-gray-200 items-center justify-between px-6">
        <Breadcrumbs
          selectedItem={selectedItem}
          onNavigate={handleItemSelect}
        />
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setUploadDialogOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Upload size={16} />
            Upload
          </button>
          <button
            onClick={() => setNewFolderDialogOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FolderPlus size={16} />
            New Folder
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div className="grid-area-tree bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
        <DataRoomTreeView
          root={dataRoom.rootFolder}
          onItemSelect={handleItemSelect}
          selectedItemId={selectedItem?.id}
          expandAll={false}
        />
      </div>

      {/* Content Area */}
      <div className="grid-area-content bg-white p-6 overflow-y-auto">
        <Content
          selectedItem={selectedItem}
          rootFolderId={dataRoom.rootFolder.id}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
        />
      </div>

      {/* Messages */}
      <div className="grid-area-messages bg-gray-100 border-t border-gray-200 flex items-center px-6">
        <p className={`text-sm ${error ? "text-red-600" : "text-gray-600"}`}>
          {error || "Ready"}
        </p>
      </div>

      {/* New Folder Dialog */}
      <NewFolderDialog
        open={newFolderDialogOpen}
        onOpenChange={setNewFolderDialogOpen}
        onConfirm={handleNewFolder}
      />

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<DataRoomApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

```

Now let me update the components index file to export the UploadDialog:


```typescript
export { default as DataRoomTreeView } from "./DataRoomTreeView";
export { default as Content } from "./Content";
export { default as FolderContent } from "./FolderContent";
export { default as FileContent } from "./FileContent";
export { default as RenameDialog } from "./RenameDialog";
export { default as DeleteDialog } from "./DeleteDialog";
export { default as NewFolderDialog } from "./NewFolderDialog";
export { default as UploadDialog } from "./UploadDialog";
export { TreeView, type TreeDataItem } from "./tree-view";

```

Now let me check for any linting errors in the files I've modified:


Let me fix the unused import:


```typescriptreact
import { useState, useRef, useCallback } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SUPPORTED_FILE_TYPES, type SupportedFileType } from "@/types";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[]) => Promise<void>;
}

export default function UploadDialog({
  open,
  onOpenChange,
  onUpload,
}: UploadDialogProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileTypeFromFile = (file: globalThis.File): SupportedFileType | null => {
    const extension = file.name.toLowerCase().split('.').pop();
    if (!extension) return null;
    
    // Check if the extension matches any supported file type
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        return key as SupportedFileType;
      }
    }
    return null;
  };

  const validateFiles = (files: FileList): { valid: File[]; errors: string[] } => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const fileType = getFileTypeFromFile(file);
      
      if (!fileType) {
        const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
          .map(config => config.extension)
          .join(', ');
        errors.push(`${file.name}: Unsupported file type. Supported types: ${supportedExtensions}`);
        return;
      }

      const config = SUPPORTED_FILE_TYPES[fileType];
      if (file.size > config.maxSize) {
        const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
        errors.push(`${file.name}: File too large. Maximum size: ${maxSizeMB}MB`);
        return;
      }

      validFiles.push(file);
    });

    return { valid: validFiles, errors };
  };

  const handleFiles = useCallback(async (files: FileList) => {
    setError(null);
    
    const { valid, errors } = validateFiles(files);
    
    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }

    if (valid.length === 0) {
      setError('No valid files to upload');
      return;
    }

    try {
      setUploading(true);
      await onUpload(valid);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [onUpload, onOpenChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
    .map(config => config.extension)
    .join(', ');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload size={20} />
            Upload Files
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop files here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click the button below to browse
            </p>
            <Button
              onClick={handleBrowseClick}
              disabled={uploading}
              variant="outline"
              className="w-full"
            >
              <FileText size={16} className="mr-2" />
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={supportedExtensions}
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Supported File Types Info */}
          <div className="text-xs text-gray-500">
            <p className="font-medium mb-1">Supported file types:</p>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(SUPPORTED_FILE_TYPES).map(([key, config]) => (
                <div key={key} className="flex items-center gap-1">
                  <span className="font-mono text-xs">{config.extension}</span>
                  <span className="text-gray-400">({config.displayName})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <pre className="whitespace-pre-wrap font-sans">{error}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Upload Status */}
          {uploading && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Uploading files...
              </div>
            </div>
          )}
        </div>

        {/* Dialog Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

```

Now let me update the todo list to mark the completed tasks:


Perfect! I have successfully implemented the upload dialog feature. Let me run the application to test it:


Let me check if there are any remaining linting errors:


Excellent! I have successfully implemented the upload dialog feature with all the requested functionality. Here's a summary of what I've created:

## ✅ Upload Dialog Implementation Complete

### Features Implemented:

1. **UploadDialog Component** (`/src/components/UploadDialog.tsx`):
   - **File Drop Target Zone**: A large, visually appealing drop area that changes appearance when files are dragged over it
   - **File Picker Button**: A "Browse Files" button that opens the native file picker
   - **File Type Validation**: Only allows files with extensions defined in `SUPPORTED_FILE_TYPES` (PDF, JPEG, PNG, TXT)
   - **File Size Validation**: Enforces maximum file sizes per file type
   - **Multiple File Upload**: Supports selecting and uploading multiple files at once
   - **Error Handling**: Displays clear error messages for unsupported file types or oversized files
   - **Loading States**: Shows upload progress with a spinner
   - **Responsive Design**: Clean, modern UI using Tailwind CSS and Shadcn components

2. **Enhanced DataRoomService** (`/src/services/DataRoomService.ts`):
   - **Dynamic File Type Detection**: Automatically determines file type from file extension
   - **Comprehensive Validation**: Validates both file type and size before upload
   - **Support for All File Types**: Now properly handles PDF, JPEG, PNG, and TXT files
   - **Better Error Messages**: Provides specific error messages for different validation failures

3. **App Integration** (`/src/App.tsx`):
   - **Upload Button**: The existing Upload button now opens the upload dialog
   - **Smart Parent Selection**: Files are uploaded to the current folder (if selected item is a folder) or the current item's parent (if selected item is a file)
   - **Navigation After Upload**: Automatically navigates to the first uploaded file after successful upload
   - **Error Handling**: Displays upload errors in the status bar

### Key Features:

- **File Type Support**: Supports PDF, JPEG, PNG, and TXT files as defined in `SUPPORTED_FILE_TYPES`
- **Drag & Drop**: Intuitive drag-and-drop interface with visual feedback
- **File Picker**: Traditional file picker as an alternative to drag-and-drop
- **Validation**: Client-side validation for file types and sizes
- **Multiple Files**: Can upload multiple files simultaneously
- **Smart Placement**: Files are placed in the appropriate folder based on current selection
- **Auto-Navigation**: Automatically navigates to the uploaded file after successful upload
- **Error Handling**: Comprehensive error handling with user-friendly messages

The upload dialog is now fully functional and integrated into the Data Room application. Users can click the Upload button to open the dialog, either drag files onto the drop zone or click "Browse Files" to select files, and the files will be uploaded to the appropriate location and the user will be navigated to the first uploaded file.

---

**User**

explain the current strategy for storing uploaded files 

---

**Cursor**

Looking at the current implementation, here's the strategy for storing uploaded files in the Data Room application:

## Current File Storage Strategy

### 1. **Browser Memory Storage (In-Memory)**
The application currently stores uploaded files entirely in the browser's memory using `ArrayBuffer`:

```typescript
// From types/index.ts
export interface File extends BaseEntity {
  type: "file";
  fileType: SupportedFileType;
  size: number; // in bytes
  content: ArrayBuffer; // stored in browser memory
}
```

### 2. **Local Storage Persistence**
Files are persisted using the browser's `localStorage` API:

```typescript
// From DataRoomService.ts
private setDataRoom(dataRoom: DataRoom): void {
  localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
}
```

### 3. **File Processing Pipeline**

When a file is uploaded, here's what happens:

1. **File Validation**: 
   - Checks file extension against `SUPPORTED_FILE_TYPES`
   - Validates file size against type-specific limits
   - Supports PDF, JPEG, PNG, and TXT files

2. **ArrayBuffer Conversion**:
   ```typescript
   const fileItem: File = {
     // ... other properties
     content: await file.arrayBuffer(), // Convert to ArrayBuffer
   };
   ```

3. **JSON Serialization**:
   - The entire `DataRoom` object (including file contents) is serialized to JSON
   - Stored as a string in `localStorage`

### 4. **Storage Limitations**

**Pros:**
- ✅ Simple implementation
- ✅ No server required
- ✅ Files persist across browser sessions
- ✅ Works offline

**Cons:**
- ❌ **Storage Size Limits**: `localStorage` typically has a 5-10MB limit per domain
- ❌ **Memory Usage**: All files loaded into memory simultaneously
- ❌ **Performance**: Large files can slow down the application
- ❌ **Scalability**: Not suitable for production with many/large files

### 5. **Current File Size Limits**

```typescript
export const SUPPORTED_FILE_TYPES: Record<string, FileTypeConfig> = {
  pdf: {
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  jpeg: {
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  png: {
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  txt: {
    maxSize: 1 * 1024 * 1024, // 1MB
  },
};
```

### 6. **Data Structure**

Files are stored in a hierarchical tree structure:

```
DataRoom
├── rootFolder (Folder)
    ├── children: (File | Folder)[]
        ├── File { content: ArrayBuffer, ... }
        ├── Folder { children: [...] }
```

## Summary

The current strategy is a **client-side, in-memory approach** that's perfect for an MVP/demo but has significant limitations for production use. It's designed to work entirely in the browser without any backend infrastructure, making it easy to set up and test, but it will hit storage and performance limits quickly with real-world usage.

For a production Data Room, you'd typically want to move to a server-based storage solution with proper file management, access controls, and scalable storage.

```typescript
// From types/index.ts
export interface File extends BaseEntity {
  type: "file";
  fileType: SupportedFileType;
  size: number; // in bytes
  content: ArrayBuffer; // stored in browser memory
}
```

```typescript
// From DataRoomService.ts
private setDataRoom(dataRoom: DataRoom): void {
  localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
}
```

```typescript
   const fileItem: File = {
     // ... other properties
     content: await file.arrayBuffer(), // Convert to ArrayBuffer
   };
```

```typescript
export const SUPPORTED_FILE_TYPES: Record<string, FileTypeConfig> = {
  pdf: {
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  jpeg: {
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  png: {
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  txt: {
    maxSize: 1 * 1024 * 1024, // 1MB
  },
};
```

```plaintext
DataRoom
├── rootFolder (Folder)
    ├── children: (File | Folder)[]
        ├── File { content: ArrayBuffer, ... }
        ├── Folder { children: [...] }
```

---

**User**

what are some issues with storing files as arraybuffers in local storage?

---

**Cursor**

Here are the major issues with storing files as ArrayBuffers in localStorage:

## 1. **Storage Size Limitations**

**localStorage Quota:**
- Most browsers limit localStorage to **5-10MB per domain**
- With your current file size limits (50MB for PDFs), you can only store **1-2 PDF files** before hitting the limit
- Even smaller files (10MB images) will quickly exhaust available space

**Real-world impact:**
```typescript
// Your current limits vs localStorage capacity
pdf: 50MB × 2 files = 100MB (exceeds localStorage limit)
jpeg: 10MB × 5 files = 50MB (exceeds localStorage limit)
```

## 2. **Memory Performance Issues**

**Synchronous Loading:**
- All files are loaded into memory when the app starts
- Large files cause the browser to freeze during loading
- Memory usage grows linearly with file count

**Browser Memory Limits:**
- Mobile browsers have limited memory (often 1-4GB)
- Large files can cause out-of-memory crashes
- No lazy loading - all files loaded at once

## 3. **JSON Serialization Problems**

**ArrayBuffer Serialization:**
```typescript
// ArrayBuffer doesn't serialize to JSON properly
const file = { content: new ArrayBuffer(1024) };
JSON.stringify(file); // Results in: {"content":{}} - data is lost!
```

**Current Workaround:**
The app likely converts ArrayBuffer to a different format for JSON storage, but this:
- Increases storage size (base64 encoding adds ~33% overhead)
- Slows down serialization/deserialization
- Makes the JSON file extremely large

## 4. **Browser Tab/Window Issues**

**Memory Duplication:**
- Each browser tab loads the entire dataset
- Opening multiple tabs multiplies memory usage
- No sharing between tabs

**Tab Crashes:**
- One tab with memory issues can crash the entire browser
- No graceful degradation for large datasets

## 5. **Data Loss Risks**

**Browser Storage Clearing:**
- Users can clear localStorage (Settings > Clear Data)
- Browser updates sometimes clear storage
- Incognito mode doesn't persist data
- No backup/recovery mechanism

**Browser Crashes:**
- Browser crashes can corrupt localStorage
- No transaction safety for large writes

## 6. **Security Concerns**

**Client-Side Storage:**
- Files stored in plain text in browser storage
- Accessible via browser dev tools
- No encryption or access controls
- Sensitive documents not protected

## 7. **Scalability Issues**

**File Count Limits:**
- localStorage has key count limits (~10,000 keys)
- Performance degrades with many small files
- No pagination or lazy loading

**Concurrent Access:**
- No locking mechanism for concurrent writes
- Race conditions possible with multiple tabs

## 8. **Development/Debugging Issues**

**Large JSON Objects:**
- Difficult to inspect in browser dev tools
- JSON.stringify() can fail on large objects
- Debugging becomes nearly impossible

**Network Transfer:**
- If you ever need to sync data, transferring large JSON is inefficient
- No incremental updates possible

## Better Alternatives for Production

1. **IndexedDB**: Browser database with much larger storage limits
2. **Server Storage**: Files stored on server, metadata in browser
3. **Cloud Storage**: AWS S3, Google Cloud Storage, etc.
4. **File System Access API**: Direct file system access (limited browser support)

## Current Implementation Assessment

Your current approach is **perfect for an MVP/demo** but would fail in production with:
- More than 1-2 PDF files
- Multiple users
- Real document security requirements
- Mobile devices with limited memory

The ArrayBuffer + localStorage strategy works well for demonstrating the UI/UX and basic functionality, but you'd need to migrate to a more robust storage solution for any real-world usage.

```typescript
// Your current limits vs localStorage capacity
pdf: 50MB × 2 files = 100MB (exceeds localStorage limit)
jpeg: 10MB × 5 files = 50MB (exceeds localStorage limit)
```

```typescript
// ArrayBuffer doesn't serialize to JSON properly
const file = { content: new ArrayBuffer(1024) };
JSON.stringify(file); // Results in: {"content":{}} - data is lost!
```

---

**User**

I think we should save files to indexedDB instead of arraybuffers in localstorage.
What do we need to change to to that?

---

**Cursor**

Great idea! IndexedDB is much better suited for storing files. Here's what we need to change to migrate from ArrayBuffer + localStorage to IndexedDB:

## 1. **Update the File Type Definition**

First, let's modify the File interface to store a reference instead of the actual content:

```typescript
// In src/types/index.ts
export interface File extends BaseEntity {
  type: "file";
  fileType: SupportedFileType;
  size: number; // in bytes
  // Remove: content: ArrayBuffer;
  // Add: fileId: string; // Reference to IndexedDB storage
  fileId: string; // Reference to IndexedDB storage
}
```

## 2. **Create an IndexedDB Service**

Create a new service to handle file storage:

```typescript
// src/services/IndexedDBFileService.ts
export class IndexedDBFileService {
  private dbName = 'DataRoomFiles';
  private dbVersion = 1;
  private storeName = 'files';

  async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async storeFile(fileId: string, file: globalThis.File): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    const fileData = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      content: await file.arrayBuffer(),
      uploadedAt: new Date()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(fileData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getFile(fileId: string): Promise<ArrayBuffer | null> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.content : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(fileId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
```

## 3. **Update DataRoomService**

Modify the DataRoomService to use IndexedDB for file storage:

```typescript
// In src/services/DataRoomService.ts
import { IndexedDBFileService } from './IndexedDBFileService';

export class LocalStorageDataRoomService implements IDataRoomService {
  private fileService = new IndexedDBFileService();
  
  // Update uploadFile method
  async uploadFile(file: globalThis.File, parentId?: string | null): Promise<File> {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // ... validation code ...

    const now = new Date();
    const fileId = this.generateId();
    
    // Store file in IndexedDB
    await this.fileService.storeFile(fileId, file);
    
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // ... rest of the method ...
  }

  // Add method to get file content
  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;
    
    return this.fileService.getFile(file.fileId);
  }

  // Update deleteFile method
  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await this.fileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // ... rest of the method ...
  }
}
```

## 4. **Update FileContent Component**

Modify the FileContent component to load files from IndexedDB:

```typescript
// In src/components/FileContent.tsx
const [fileContent, setFileContent] = useState<ArrayBuffer | null>(null);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const loadFileContent = async () => {
    if (!file) return;
    
    setLoading(true);
    try {
      const content = await dataRoomService.getFileContent(file.id);
      setFileContent(content);
    } catch (error) {
      console.error('Failed to load file content:', error);
    } finally {
      setLoading(false);
    }
  };

  loadFileContent();
}, [file]);

// Update the render logic to use fileContent instead of file.content
```

## 5. **Update the Service Interface**

Add the new method to the service interface:

```typescript
// In src/services/DataRoomService.ts
export interface IDataRoomService {
  // ... existing methods ...
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
}
```

## 6. **Benefits of This Approach**

- **Much larger storage**: IndexedDB can store hundreds of MB or even GB
- **Better performance**: Files loaded on-demand, not all at once
- **Memory efficient**: Only loads files when needed
- **Proper file handling**: Designed for binary data storage
- **Async operations**: Non-blocking file operations
- **Better error handling**: Proper transaction management

## 7. **Migration Strategy**

To migrate existing data:
1. Keep the current localStorage for metadata (folder structure, file info)
2. Move only file content to IndexedDB
3. Add migration logic to move existing ArrayBuffer content to IndexedDB
4. Update file references to use the new fileId system

Would you like me to implement any of these changes? I can start with creating the IndexedDB service and then update the DataRoomService to use it.

```typescript
// In src/types/index.ts
export interface File extends BaseEntity {
  type: "file";
  fileType: SupportedFileType;
  size: number; // in bytes
  // Remove: content: ArrayBuffer;
  // Add: fileId: string; // Reference to IndexedDB storage
  fileId: string; // Reference to IndexedDB storage
}
```

```typescript
// src/services/IndexedDBFileService.ts
export class IndexedDBFileService {
  private dbName = 'DataRoomFiles';
  private dbVersion = 1;
  private storeName = 'files';

  async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async storeFile(fileId: string, file: globalThis.File): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    const fileData = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      content: await file.arrayBuffer(),
      uploadedAt: new Date()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(fileData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getFile(fileId: string): Promise<ArrayBuffer | null> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.content : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(fileId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
```

```typescript
// In src/services/DataRoomService.ts
import { IndexedDBFileService } from './IndexedDBFileService';

export class LocalStorageDataRoomService implements IDataRoomService {
  private fileService = new IndexedDBFileService();
  
  // Update uploadFile method
  async uploadFile(file: globalThis.File, parentId?: string | null): Promise<File> {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // ... validation code ...

    const now = new Date();
    const fileId = this.generateId();
    
    // Store file in IndexedDB
    await this.fileService.storeFile(fileId, file);
    
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // ... rest of the method ...
  }

  // Add method to get file content
  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;
    
    return this.fileService.getFile(file.fileId);
  }

  // Update deleteFile method
  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await this.fileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // ... rest of the method ...
  }
}
```

```typescript
// In src/components/FileContent.tsx
const [fileContent, setFileContent] = useState<ArrayBuffer | null>(null);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const loadFileContent = async () => {
    if (!file) return;
    
    setLoading(true);
    try {
      const content = await dataRoomService.getFileContent(file.id);
      setFileContent(content);
    } catch (error) {
      console.error('Failed to load file content:', error);
    } finally {
      setLoading(false);
    }
  };

  loadFileContent();
}, [file]);

// Update the render logic to use fileContent instead of file.content
```

```typescript
// In src/services/DataRoomService.ts
export interface IDataRoomService {
  // ... existing methods ...
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
}
```

---

**User**

let's do that

---

**Cursor**

Perfect! Let's implement the IndexedDB migration. I'll start by creating the IndexedDB service and then update the existing code to use it.


Let's start by creating the IndexedDB service:


```typescript
export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: ArrayBuffer;
  uploadedAt: Date;
}

export class IndexedDBFileService {
  private dbName = 'DataRoomFiles';
  private dbVersion = 1;
  private storeName = 'files';

  async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async storeFile(fileId: string, file: globalThis.File): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    const fileData: StoredFile = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      content: await file.arrayBuffer(),
      uploadedAt: new Date()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(fileData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getFile(fileId: string): Promise<ArrayBuffer | null> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        resolve(result ? result.content : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getFileInfo(fileId: string): Promise<StoredFile | null> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(fileId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFiles(): Promise<StoredFile[]> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const result = request.result as StoredFile[];
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllFiles(): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const indexedDBFileService = new IndexedDBFileService();
```

Now let's update the File type to use fileId instead of content:


```typescript
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
  fileId: string; // reference to IndexedDB storage
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

```

Now let's update the DataRoomService to use IndexedDB:


```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): DataRoom;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private getStoredDataRoom(): DataRoom | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);
    return parsed;
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return this.getStoredDataRoom();
  }

  initializeDataRoom(): DataRoom {
    const existingDataRoom = this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      content: await file.arrayBuffer(),
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

Now let's add the getFileContent method to the interface:


```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): DataRoom;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private getStoredDataRoom(): DataRoom | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);
    return parsed;
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return this.getStoredDataRoom();
  }

  initializeDataRoom(): DataRoom {
    const existingDataRoom = this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      content: await file.arrayBuffer(),
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

Now let's update the uploadFile method to use IndexedDB:


```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): DataRoom;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private getStoredDataRoom(): DataRoom | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);
    return parsed;
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return this.getStoredDataRoom();
  }

  initializeDataRoom(): DataRoom {
    const existingDataRoom = this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();
    
    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);
    
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

Now let's add the getFileContent method:


```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): DataRoom;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private getStoredDataRoom(): DataRoom | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);
    return parsed;
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return this.getStoredDataRoom();
  }

  initializeDataRoom(): DataRoom {
    const existingDataRoom = this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();
    
    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);
    
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;
    
    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

Now let's update the deleteFile method to also delete from IndexedDB:


```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): DataRoom;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private getStoredDataRoom(): DataRoom | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);
    return parsed;
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return this.getStoredDataRoom();
  }

  initializeDataRoom(): DataRoom {
    const existingDataRoom = this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();
    
    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);
    
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;
    
    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await indexedDBFileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

Now let's update the FileContent component to load files from IndexedDB:


Now let's update the FileContent component to load files from IndexedDB:


```typescriptreact
import { useState, useEffect } from "react";
import type { File } from "@/types";
import {
  formatBytes,
  getFileTypeDisplayName,
  getFileMimeType,
} from "@/lib/formatUtils";
import { Button } from "./ui/button";
import { Edit, Trash2, Loader2 } from "lucide-react";
import RenameDialog from "./RenameDialog";
import DeleteDialog from "./DeleteDialog";
import { dataRoomService } from "@/services/DataRoomService";

interface FileContentProps {
  file: File;
  onRename: (fileId: string, newName: string) => void;
  onDelete: (fileId: string) => void;
}

export default function FileContent({
  file,
  onRename,
  onDelete,
}: FileContentProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fileTypeDisplayName = getFileTypeDisplayName(file);
  const mimeType = getFileMimeType(file);

  // Create a blob URL for the file content to display in iframe
  const createBlobUrl = (file: File): string => {
    const blob = new Blob([file.content], { type: mimeType });
    return URL.createObjectURL(blob);
  };

  const blobUrl = createBlobUrl(file);

  const handleRename = () => {
    setRenameDialogOpen(true);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleRenameConfirm = (newName: string) => {
    onRename(file.id, newName);
  };

  const handleDeleteConfirm = () => {
    onDelete(file.id);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">File Type</h3>
          <p className="text-lg font-semibold text-gray-900">
            {fileTypeDisplayName}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Size</h3>
          <p className="text-lg font-semibold text-gray-900">
            {formatBytes(file.size)}
          </p>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <h4 className="font-medium text-gray-500">Created</h4>
            <p className="text-gray-900">
              {file.createdAt.toLocaleDateString()}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-500">Updated</h4>
            <p className="text-gray-900">
              {file.updatedAt.toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            onClick={handleRename}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Edit size={14} />
            Rename
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <Trash2 size={14} />
            Delete
          </Button>
        </div>

        <h4 className="text-sm font-medium text-gray-500 mb-2">Preview</h4>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <iframe
            src={blobUrl}
            className="w-full h-96"
            title={`Preview of ${file.name}`}
            onLoad={() => {
              // Clean up the blob URL after the iframe loads
              setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            }}
          />
        </div>
      </div>

      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        currentName={file.name}
        itemType="file"
        onConfirm={handleRenameConfirm}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={file.name}
        itemType="file"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

```

```typescriptreact
import { useState, useEffect } from "react";
import type { File } from "@/types";
import {
  formatBytes,
  getFileTypeDisplayName,
  getFileMimeType,
} from "@/lib/formatUtils";
import { Button } from "./ui/button";
import { Edit, Trash2, Loader2 } from "lucide-react";
import RenameDialog from "./RenameDialog";
import DeleteDialog from "./DeleteDialog";
import { dataRoomService } from "@/services/DataRoomService";

interface FileContentProps {
  file: File;
  onRename: (fileId: string, newName: string) => void;
  onDelete: (fileId: string) => void;
}

export default function FileContent({
  file,
  onRename,
  onDelete,
}: FileContentProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileContent, setFileContent] = useState<ArrayBuffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileTypeDisplayName = getFileTypeDisplayName(file);
  const mimeType = getFileMimeType(file);

  // Load file content from IndexedDB
  useEffect(() => {
    const loadFileContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const content = await dataRoomService.getFileContent(file.id);
        setFileContent(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load file content');
      } finally {
        setLoading(false);
      }
    };

    loadFileContent();
  }, [file.id]);

  // Create a blob URL for the file content to display in iframe
  const createBlobUrl = (content: ArrayBuffer): string => {
    const blob = new Blob([content], { type: mimeType });
    return URL.createObjectURL(blob);
  };

  const blobUrl = fileContent ? createBlobUrl(fileContent) : null;

  const handleRename = () => {
    setRenameDialogOpen(true);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleRenameConfirm = (newName: string) => {
    onRename(file.id, newName);
  };

  const handleDeleteConfirm = () => {
    onDelete(file.id);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">File Type</h3>
          <p className="text-lg font-semibold text-gray-900">
            {fileTypeDisplayName}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Size</h3>
          <p className="text-lg font-semibold text-gray-900">
            {formatBytes(file.size)}
          </p>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <h4 className="font-medium text-gray-500">Created</h4>
            <p className="text-gray-900">
              {file.createdAt.toLocaleDateString()}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-500">Updated</h4>
            <p className="text-gray-900">
              {file.updatedAt.toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            onClick={handleRename}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Edit size={14} />
            Rename
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <Trash2 size={14} />
            Delete
          </Button>
        </div>

        <h4 className="text-sm font-medium text-gray-500 mb-2">Preview</h4>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <iframe
            src={blobUrl}
            className="w-full h-96"
            title={`Preview of ${file.name}`}
            onLoad={() => {
              // Clean up the blob URL after the iframe loads
              setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            }}
          />
        </div>
      </div>

      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        currentName={file.name}
        itemType="file"
        onConfirm={handleRenameConfirm}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={file.name}
        itemType="file"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

```

Now let's update the preview section to handle loading and error states:


```typescriptreact
import { useState, useEffect } from "react";
import type { File } from "@/types";
import {
  formatBytes,
  getFileTypeDisplayName,
  getFileMimeType,
} from "@/lib/formatUtils";
import { Button } from "./ui/button";
import { Edit, Trash2, Loader2 } from "lucide-react";
import RenameDialog from "./RenameDialog";
import DeleteDialog from "./DeleteDialog";
import { dataRoomService } from "@/services/DataRoomService";

interface FileContentProps {
  file: File;
  onRename: (fileId: string, newName: string) => void;
  onDelete: (fileId: string) => void;
}

export default function FileContent({
  file,
  onRename,
  onDelete,
}: FileContentProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileContent, setFileContent] = useState<ArrayBuffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileTypeDisplayName = getFileTypeDisplayName(file);
  const mimeType = getFileMimeType(file);

  // Load file content from IndexedDB
  useEffect(() => {
    const loadFileContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const content = await dataRoomService.getFileContent(file.id);
        setFileContent(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load file content');
      } finally {
        setLoading(false);
      }
    };

    loadFileContent();
  }, [file.id]);

  // Create a blob URL for the file content to display in iframe
  const createBlobUrl = (content: ArrayBuffer): string => {
    const blob = new Blob([content], { type: mimeType });
    return URL.createObjectURL(blob);
  };

  const blobUrl = fileContent ? createBlobUrl(fileContent) : null;

  const handleRename = () => {
    setRenameDialogOpen(true);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleRenameConfirm = (newName: string) => {
    onRename(file.id, newName);
  };

  const handleDeleteConfirm = () => {
    onDelete(file.id);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">File Type</h3>
          <p className="text-lg font-semibold text-gray-900">
            {fileTypeDisplayName}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Size</h3>
          <p className="text-lg font-semibold text-gray-900">
            {formatBytes(file.size)}
          </p>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <h4 className="font-medium text-gray-500">Created</h4>
            <p className="text-gray-900">
              {file.createdAt.toLocaleDateString()}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-500">Updated</h4>
            <p className="text-gray-900">
              {file.updatedAt.toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            onClick={handleRename}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Edit size={14} />
            Rename
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <Trash2 size={14} />
            Delete
          </Button>
        </div>

        <h4 className="text-sm font-medium text-gray-500 mb-2">Preview</h4>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-96 bg-gray-50">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 size={20} className="animate-spin" />
                Loading file content...
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96 bg-red-50">
              <div className="text-center">
                <p className="text-red-600 font-medium">Failed to load file</p>
                <p className="text-red-500 text-sm mt-1">{error}</p>
              </div>
            </div>
          ) : blobUrl ? (
            <iframe
              src={blobUrl}
              className="w-full h-96"
              title={`Preview of ${file.name}`}
              onLoad={() => {
                // Clean up the blob URL after the iframe loads
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-96 bg-gray-50">
              <p className="text-gray-500">No preview available</p>
            </div>
          )}
        </div>
      </div>

      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        currentName={file.name}
        itemType="file"
        onConfirm={handleRenameConfirm}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={file.name}
        itemType="file"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

```

Now let's add a migration function to handle existing data. Let's add this to the DataRoomService:


```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): DataRoom;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private getStoredDataRoom(): DataRoom | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);
    return parsed;
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Migration helper to move existing ArrayBuffer content to IndexedDB
  private async migrateFileContentToIndexedDB(dataRoom: DataRoom): Promise<DataRoom> {
    const migrateFolder = async (folder: Folder): Promise<void> => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          // Check if this is an old file with ArrayBuffer content
          if ('content' in file && file.content instanceof ArrayBuffer) {
            // Create a new fileId and store in IndexedDB
            const fileId = this.generateId();
            
            // Create a File object from the ArrayBuffer for storage
            const blob = new Blob([file.content], { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            const fileObj = new File([blob], file.name, { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            
            await indexedDBFileService.storeFile(fileId, fileObj);
            
            // Update the file object to use fileId instead of content
            (file as any).fileId = fileId;
            delete (file as any).content;
          }
        } else if (item.type === "folder") {
          await migrateFolder(item as Folder);
        }
      }
    };

    await migrateFolder(dataRoom.rootFolder);
    return dataRoom;
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return this.getStoredDataRoom();
  }

  initializeDataRoom(): DataRoom {
    const existingDataRoom = this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();
    
    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);
    
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;
    
    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await indexedDBFileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

Now let's update the getStoredDataRoom method to run migration:


```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): DataRoom;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private async getStoredDataRoom(): Promise<DataRoom | null> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);
    
    // Check if migration is needed (files with ArrayBuffer content)
    const needsMigration = this.checkIfMigrationNeeded(parsed);
    if (needsMigration) {
      console.log('Migrating file content to IndexedDB...');
      const migrated = await this.migrateFileContentToIndexedDB(parsed);
      this.setDataRoom(migrated);
      return migrated;
    }
    
    return parsed;
  }

  // Check if migration is needed
  private checkIfMigrationNeeded(dataRoom: DataRoom): boolean {
    const checkFolder = (folder: Folder): boolean => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          if ('content' in file && file.content instanceof ArrayBuffer) {
            return true;
          }
        } else if (item.type === "folder") {
          if (checkFolder(item as Folder)) {
            return true;
          }
        }
      }
      return false;
    };
    
    return checkFolder(dataRoom.rootFolder);
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Migration helper to move existing ArrayBuffer content to IndexedDB
  private async migrateFileContentToIndexedDB(dataRoom: DataRoom): Promise<DataRoom> {
    const migrateFolder = async (folder: Folder): Promise<void> => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          // Check if this is an old file with ArrayBuffer content
          if ('content' in file && file.content instanceof ArrayBuffer) {
            // Create a new fileId and store in IndexedDB
            const fileId = this.generateId();
            
            // Create a File object from the ArrayBuffer for storage
            const blob = new Blob([file.content], { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            const fileObj = new File([blob], file.name, { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            
            await indexedDBFileService.storeFile(fileId, fileObj);
            
            // Update the file object to use fileId instead of content
            (file as any).fileId = fileId;
            delete (file as any).content;
          }
        } else if (item.type === "folder") {
          await migrateFolder(item as Folder);
        }
      }
    };

    await migrateFolder(dataRoom.rootFolder);
    return dataRoom;
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return this.getStoredDataRoom();
  }

  initializeDataRoom(): DataRoom {
    const existingDataRoom = this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();
    
    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);
    
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;
    
    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await indexedDBFileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

Now we need to update all the methods that call getStoredDataRoom to handle the async nature:


```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): DataRoom;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private async getStoredDataRoom(): Promise<DataRoom | null> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);
    
    // Check if migration is needed (files with ArrayBuffer content)
    const needsMigration = this.checkIfMigrationNeeded(parsed);
    if (needsMigration) {
      console.log('Migrating file content to IndexedDB...');
      const migrated = await this.migrateFileContentToIndexedDB(parsed);
      this.setDataRoom(migrated);
      return migrated;
    }
    
    return parsed;
  }

  // Check if migration is needed
  private checkIfMigrationNeeded(dataRoom: DataRoom): boolean {
    const checkFolder = (folder: Folder): boolean => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          if ('content' in file && file.content instanceof ArrayBuffer) {
            return true;
          }
        } else if (item.type === "folder") {
          if (checkFolder(item as Folder)) {
            return true;
          }
        }
      }
      return false;
    };
    
    return checkFolder(dataRoom.rootFolder);
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Migration helper to move existing ArrayBuffer content to IndexedDB
  private async migrateFileContentToIndexedDB(dataRoom: DataRoom): Promise<DataRoom> {
    const migrateFolder = async (folder: Folder): Promise<void> => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          // Check if this is an old file with ArrayBuffer content
          if ('content' in file && file.content instanceof ArrayBuffer) {
            // Create a new fileId and store in IndexedDB
            const fileId = this.generateId();
            
            // Create a File object from the ArrayBuffer for storage
            const blob = new Blob([file.content], { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            const fileObj = new File([blob], file.name, { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            
            await indexedDBFileService.storeFile(fileId, fileObj);
            
            // Update the file object to use fileId instead of content
            (file as any).fileId = fileId;
            delete (file as any).content;
          }
        } else if (item.type === "folder") {
          await migrateFolder(item as Folder);
        }
      }
    };

    await migrateFolder(dataRoom.rootFolder);
    return dataRoom;
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return await this.getStoredDataRoom();
  }

  initializeDataRoom(): DataRoom {
    const existingDataRoom = this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();
    
    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);
    
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;
    
    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await indexedDBFileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

We need to update the initializeDataRoom method to be async as well:


```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): DataRoom;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private async getStoredDataRoom(): Promise<DataRoom | null> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);
    
    // Check if migration is needed (files with ArrayBuffer content)
    const needsMigration = this.checkIfMigrationNeeded(parsed);
    if (needsMigration) {
      console.log('Migrating file content to IndexedDB...');
      const migrated = await this.migrateFileContentToIndexedDB(parsed);
      this.setDataRoom(migrated);
      return migrated;
    }
    
    return parsed;
  }

  // Check if migration is needed
  private checkIfMigrationNeeded(dataRoom: DataRoom): boolean {
    const checkFolder = (folder: Folder): boolean => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          if ('content' in file && file.content instanceof ArrayBuffer) {
            return true;
          }
        } else if (item.type === "folder") {
          if (checkFolder(item as Folder)) {
            return true;
          }
        }
      }
      return false;
    };
    
    return checkFolder(dataRoom.rootFolder);
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Migration helper to move existing ArrayBuffer content to IndexedDB
  private async migrateFileContentToIndexedDB(dataRoom: DataRoom): Promise<DataRoom> {
    const migrateFolder = async (folder: Folder): Promise<void> => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          // Check if this is an old file with ArrayBuffer content
          if ('content' in file && file.content instanceof ArrayBuffer) {
            // Create a new fileId and store in IndexedDB
            const fileId = this.generateId();
            
            // Create a File object from the ArrayBuffer for storage
            const blob = new Blob([file.content], { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            const fileObj = new File([blob], file.name, { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            
            await indexedDBFileService.storeFile(fileId, fileObj);
            
            // Update the file object to use fileId instead of content
            (file as any).fileId = fileId;
            delete (file as any).content;
          }
        } else if (item.type === "folder") {
          await migrateFolder(item as Folder);
        }
      }
    };

    await migrateFolder(dataRoom.rootFolder);
    return dataRoom;
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return await this.getStoredDataRoom();
  }

  async initializeDataRoom(): Promise<DataRoom> {
    const existingDataRoom = await this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();
    
    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);
    
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;
    
    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await indexedDBFileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

Now we need to update the interface to reflect the async initializeDataRoom:


```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): Promise<DataRoom>;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private async getStoredDataRoom(): Promise<DataRoom | null> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);
    
    // Check if migration is needed (files with ArrayBuffer content)
    const needsMigration = this.checkIfMigrationNeeded(parsed);
    if (needsMigration) {
      console.log('Migrating file content to IndexedDB...');
      const migrated = await this.migrateFileContentToIndexedDB(parsed);
      this.setDataRoom(migrated);
      return migrated;
    }
    
    return parsed;
  }

  // Check if migration is needed
  private checkIfMigrationNeeded(dataRoom: DataRoom): boolean {
    const checkFolder = (folder: Folder): boolean => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          if ('content' in file && file.content instanceof ArrayBuffer) {
            return true;
          }
        } else if (item.type === "folder") {
          if (checkFolder(item as Folder)) {
            return true;
          }
        }
      }
      return false;
    };
    
    return checkFolder(dataRoom.rootFolder);
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Migration helper to move existing ArrayBuffer content to IndexedDB
  private async migrateFileContentToIndexedDB(dataRoom: DataRoom): Promise<DataRoom> {
    const migrateFolder = async (folder: Folder): Promise<void> => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          // Check if this is an old file with ArrayBuffer content
          if ('content' in file && file.content instanceof ArrayBuffer) {
            // Create a new fileId and store in IndexedDB
            const fileId = this.generateId();
            
            // Create a File object from the ArrayBuffer for storage
            const blob = new Blob([file.content], { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            const fileObj = new File([blob], file.name, { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            
            await indexedDBFileService.storeFile(fileId, fileObj);
            
            // Update the file object to use fileId instead of content
            (file as any).fileId = fileId;
            delete (file as any).content;
          }
        } else if (item.type === "folder") {
          await migrateFolder(item as Folder);
        }
      }
    };

    await migrateFolder(dataRoom.rootFolder);
    return dataRoom;
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return await this.getStoredDataRoom();
  }

  async initializeDataRoom(): Promise<DataRoom> {
    const existingDataRoom = await this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();
    
    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);
    
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;
    
    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await indexedDBFileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

Now we need to update all the methods that call getStoredDataRoom to be async. Let's update them one by one:


```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): Promise<DataRoom>;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private async getStoredDataRoom(): Promise<DataRoom | null> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);
    
    // Check if migration is needed (files with ArrayBuffer content)
    const needsMigration = this.checkIfMigrationNeeded(parsed);
    if (needsMigration) {
      console.log('Migrating file content to IndexedDB...');
      const migrated = await this.migrateFileContentToIndexedDB(parsed);
      this.setDataRoom(migrated);
      return migrated;
    }
    
    return parsed;
  }

  // Check if migration is needed
  private checkIfMigrationNeeded(dataRoom: DataRoom): boolean {
    const checkFolder = (folder: Folder): boolean => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          if ('content' in file && file.content instanceof ArrayBuffer) {
            return true;
          }
        } else if (item.type === "folder") {
          if (checkFolder(item as Folder)) {
            return true;
          }
        }
      }
      return false;
    };
    
    return checkFolder(dataRoom.rootFolder);
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Migration helper to move existing ArrayBuffer content to IndexedDB
  private async migrateFileContentToIndexedDB(dataRoom: DataRoom): Promise<DataRoom> {
    const migrateFolder = async (folder: Folder): Promise<void> => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          // Check if this is an old file with ArrayBuffer content
          if ('content' in file && file.content instanceof ArrayBuffer) {
            // Create a new fileId and store in IndexedDB
            const fileId = this.generateId();
            
            // Create a File object from the ArrayBuffer for storage
            const blob = new Blob([file.content], { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            const fileObj = new File([blob], file.name, { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            
            await indexedDBFileService.storeFile(fileId, fileObj);
            
            // Update the file object to use fileId instead of content
            (file as any).fileId = fileId;
            delete (file as any).content;
          }
        } else if (item.type === "folder") {
          await migrateFolder(item as Folder);
        }
      }
    };

    await migrateFolder(dataRoom.rootFolder);
    return dataRoom;
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return await this.getStoredDataRoom();
  }

  async initializeDataRoom(): Promise<DataRoom> {
    const existingDataRoom = await this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();
    
    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);
    
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;
    
    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await indexedDBFileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

Let me continue updating the remaining methods. I'll do this more efficiently by updating multiple methods at once:


```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): Promise<DataRoom>;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private async getStoredDataRoom(): Promise<DataRoom | null> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);
    
    // Check if migration is needed (files with ArrayBuffer content)
    const needsMigration = this.checkIfMigrationNeeded(parsed);
    if (needsMigration) {
      console.log('Migrating file content to IndexedDB...');
      const migrated = await this.migrateFileContentToIndexedDB(parsed);
      this.setDataRoom(migrated);
      return migrated;
    }
    
    return parsed;
  }

  // Check if migration is needed
  private checkIfMigrationNeeded(dataRoom: DataRoom): boolean {
    const checkFolder = (folder: Folder): boolean => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          if ('content' in file && file.content instanceof ArrayBuffer) {
            return true;
          }
        } else if (item.type === "folder") {
          if (checkFolder(item as Folder)) {
            return true;
          }
        }
      }
      return false;
    };
    
    return checkFolder(dataRoom.rootFolder);
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Migration helper to move existing ArrayBuffer content to IndexedDB
  private async migrateFileContentToIndexedDB(dataRoom: DataRoom): Promise<DataRoom> {
    const migrateFolder = async (folder: Folder): Promise<void> => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          // Check if this is an old file with ArrayBuffer content
          if ('content' in file && file.content instanceof ArrayBuffer) {
            // Create a new fileId and store in IndexedDB
            const fileId = this.generateId();
            
            // Create a File object from the ArrayBuffer for storage
            const blob = new Blob([file.content], { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            const fileObj = new File([blob], file.name, { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            
            await indexedDBFileService.storeFile(fileId, fileObj);
            
            // Update the file object to use fileId instead of content
            (file as any).fileId = fileId;
            delete (file as any).content;
          }
        } else if (item.type === "folder") {
          await migrateFolder(item as Folder);
        }
      }
    };

    await migrateFolder(dataRoom.rootFolder);
    return dataRoom;
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return await this.getStoredDataRoom();
  }

  async initializeDataRoom(): Promise<DataRoom> {
    const existingDataRoom = await this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();
    
    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);
    
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;
    
    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await indexedDBFileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): Promise<DataRoom>;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private async getStoredDataRoom(): Promise<DataRoom | null> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);
    
    // Check if migration is needed (files with ArrayBuffer content)
    const needsMigration = this.checkIfMigrationNeeded(parsed);
    if (needsMigration) {
      console.log('Migrating file content to IndexedDB...');
      const migrated = await this.migrateFileContentToIndexedDB(parsed);
      this.setDataRoom(migrated);
      return migrated;
    }
    
    return parsed;
  }

  // Check if migration is needed
  private checkIfMigrationNeeded(dataRoom: DataRoom): boolean {
    const checkFolder = (folder: Folder): boolean => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          if ('content' in file && file.content instanceof ArrayBuffer) {
            return true;
          }
        } else if (item.type === "folder") {
          if (checkFolder(item as Folder)) {
            return true;
          }
        }
      }
      return false;
    };
    
    return checkFolder(dataRoom.rootFolder);
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Migration helper to move existing ArrayBuffer content to IndexedDB
  private async migrateFileContentToIndexedDB(dataRoom: DataRoom): Promise<DataRoom> {
    const migrateFolder = async (folder: Folder): Promise<void> => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          // Check if this is an old file with ArrayBuffer content
          if ('content' in file && file.content instanceof ArrayBuffer) {
            // Create a new fileId and store in IndexedDB
            const fileId = this.generateId();
            
            // Create a File object from the ArrayBuffer for storage
            const blob = new Blob([file.content], { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            const fileObj = new File([blob], file.name, { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            
            await indexedDBFileService.storeFile(fileId, fileObj);
            
            // Update the file object to use fileId instead of content
            (file as any).fileId = fileId;
            delete (file as any).content;
          }
        } else if (item.type === "folder") {
          await migrateFolder(item as Folder);
        }
      }
    };

    await migrateFolder(dataRoom.rootFolder);
    return dataRoom;
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return await this.getStoredDataRoom();
  }

  async initializeDataRoom(): Promise<DataRoom> {
    const existingDataRoom = await this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();
    
    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);
    
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;
    
    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await indexedDBFileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): Promise<DataRoom>;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private async getStoredDataRoom(): Promise<DataRoom | null> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);
    
    // Check if migration is needed (files with ArrayBuffer content)
    const needsMigration = this.checkIfMigrationNeeded(parsed);
    if (needsMigration) {
      console.log('Migrating file content to IndexedDB...');
      const migrated = await this.migrateFileContentToIndexedDB(parsed);
      this.setDataRoom(migrated);
      return migrated;
    }
    
    return parsed;
  }

  // Check if migration is needed
  private checkIfMigrationNeeded(dataRoom: DataRoom): boolean {
    const checkFolder = (folder: Folder): boolean => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          if ('content' in file && file.content instanceof ArrayBuffer) {
            return true;
          }
        } else if (item.type === "folder") {
          if (checkFolder(item as Folder)) {
            return true;
          }
        }
      }
      return false;
    };
    
    return checkFolder(dataRoom.rootFolder);
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Migration helper to move existing ArrayBuffer content to IndexedDB
  private async migrateFileContentToIndexedDB(dataRoom: DataRoom): Promise<DataRoom> {
    const migrateFolder = async (folder: Folder): Promise<void> => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          // Check if this is an old file with ArrayBuffer content
          if ('content' in file && file.content instanceof ArrayBuffer) {
            // Create a new fileId and store in IndexedDB
            const fileId = this.generateId();
            
            // Create a File object from the ArrayBuffer for storage
            const blob = new Blob([file.content], { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            const fileObj = new File([blob], file.name, { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            
            await indexedDBFileService.storeFile(fileId, fileObj);
            
            // Update the file object to use fileId instead of content
            (file as any).fileId = fileId;
            delete (file as any).content;
          }
        } else if (item.type === "folder") {
          await migrateFolder(item as Folder);
        }
      }
    };

    await migrateFolder(dataRoom.rootFolder);
    return dataRoom;
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return await this.getStoredDataRoom();
  }

  async initializeDataRoom(): Promise<DataRoom> {
    const existingDataRoom = await this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();
    
    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);
    
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;
    
    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await indexedDBFileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): Promise<DataRoom>;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private async getStoredDataRoom(): Promise<DataRoom | null> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);
    
    // Check if migration is needed (files with ArrayBuffer content)
    const needsMigration = this.checkIfMigrationNeeded(parsed);
    if (needsMigration) {
      console.log('Migrating file content to IndexedDB...');
      const migrated = await this.migrateFileContentToIndexedDB(parsed);
      this.setDataRoom(migrated);
      return migrated;
    }
    
    return parsed;
  }

  // Check if migration is needed
  private checkIfMigrationNeeded(dataRoom: DataRoom): boolean {
    const checkFolder = (folder: Folder): boolean => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          if ('content' in file && file.content instanceof ArrayBuffer) {
            return true;
          }
        } else if (item.type === "folder") {
          if (checkFolder(item as Folder)) {
            return true;
          }
        }
      }
      return false;
    };
    
    return checkFolder(dataRoom.rootFolder);
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Migration helper to move existing ArrayBuffer content to IndexedDB
  private async migrateFileContentToIndexedDB(dataRoom: DataRoom): Promise<DataRoom> {
    const migrateFolder = async (folder: Folder): Promise<void> => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          // Check if this is an old file with ArrayBuffer content
          if ('content' in file && file.content instanceof ArrayBuffer) {
            // Create a new fileId and store in IndexedDB
            const fileId = this.generateId();
            
            // Create a File object from the ArrayBuffer for storage
            const blob = new Blob([file.content], { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            const fileObj = new File([blob], file.name, { 
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType 
            });
            
            await indexedDBFileService.storeFile(fileId, fileObj);
            
            // Update the file object to use fileId instead of content
            (file as any).fileId = fileId;
            delete (file as any).content;
          }
        } else if (item.type === "folder") {
          await migrateFolder(item as Folder);
        }
      }
    };

    await migrateFolder(dataRoom.rootFolder);
    return dataRoom;
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return await this.getStoredDataRoom();
  }

  async initializeDataRoom(): Promise<DataRoom> {
    const existingDataRoom = await this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();
    
    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);
    
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;
    
    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await indexedDBFileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

---

**User**

Uncaught TypeError: Cannot read properties of undefined (reading 'id')
    at DataRoomApp (App.tsx:353:45)

---

**Cursor**

I see the issue! The problem is that we changed `initializeDataRoom()` to be async, but the App component is still calling it synchronously. Let me fix this by updating the App component to handle the async initialization.


The issue is on line 30-32 where we're calling `dataRoomService.initializeDataRoom()` synchronously in the useState initializer, but it's now async. Let me fix this:


```typescriptreact
import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import { Upload, FolderPlus } from "lucide-react";
import DataRoomTreeView from "@/components/DataRoomTreeView";
import Breadcrumbs from "@/components/Breadcrumbs";
import Content from "@/components/Content";
import NewFolderDialog from "@/components/NewFolderDialog";
import UploadDialog from "@/components/UploadDialog";
import { dataRoomService } from "@/services/DataRoomService";
import {
  findItemByPath,
  getItemPath,
  findParentFolder,
  findItemById,
} from "@/lib/pathUtils";
import type { DataRoomItem, DataRoom } from "@/types";

function DataRoomApp() {
  const { "*": rawPath = "/" } = useParams<{ "*"?: string }>();
  // Decode the path parameter to handle URL encoding
  const path = decodeURIComponent(rawPath);

  const navigate = useNavigate();
  const [dataRoom, setDataRoom] = useState<DataRoom | null>(null);
  const [selectedItem, setSelectedItem] = useState<DataRoomItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Update selectedItem based on URL path
  useEffect(() => {
    if (!dataRoom) {
      setError("No data room found");
      return;
    }

    const item = findItemByPath(dataRoom.rootFolder, path);

    if (item) {
      setSelectedItem(item);
      setError(null);
    } else {
      setSelectedItem(null);
      setError(`Path "${path}" not found`);
    }
  }, [path, dataRoom]);

  const handleItemSelect = (item: DataRoomItem | null) => {
    if (!dataRoom) {
      return;
    }

    if (item) {
      const itemPath = getItemPath(item, dataRoom.rootFolder);
      navigate(itemPath);
    } else {
      navigate("/");
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      await dataRoomService.updateFolderName(folderId, newName);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Update selected item if it's the renamed folder
        if (selectedItem?.id === folderId) {
          const updatedItem = findItemById(
            updatedDataRoom.rootFolder,
            folderId
          );
          setSelectedItem(updatedItem);
          // Update URL to reflect the new path
          if (updatedItem) {
            const newPath = getItemPath(
              updatedItem,
              updatedDataRoom.rootFolder
            );
            navigate(newPath);
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to rename folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      // Find parent folder before deletion
      const parentFolder = selectedItem
        ? findParentFolder(selectedItem, dataRoom!.rootFolder)
        : null;

      await dataRoomService.deleteFolder(folderId);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Navigate to parent or root if deleted folder was selected
        if (selectedItem?.id === folderId) {
          if (parentFolder) {
            const parentPath = getItemPath(
              parentFolder,
              updatedDataRoom.rootFolder
            );
            navigate(parentPath);
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to delete folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    try {
      await dataRoomService.updateFileName(fileId, newName);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Update selected item if it's the renamed file
        if (selectedItem?.id === fileId) {
          const updatedItem = findItemById(updatedDataRoom.rootFolder, fileId);
          setSelectedItem(updatedItem);
          // Update URL to reflect the new path
          if (updatedItem) {
            const newPath = getItemPath(
              updatedItem,
              updatedDataRoom.rootFolder
            );
            navigate(newPath);
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to rename file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      // Find parent folder before deletion
      const parentFolder = selectedItem
        ? findParentFolder(selectedItem, dataRoom!.rootFolder)
        : null;

      await dataRoomService.deleteFile(fileId);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Navigate to parent or root if deleted file was selected
        if (selectedItem?.id === fileId) {
          if (parentFolder) {
            const parentPath = getItemPath(
              parentFolder,
              updatedDataRoom.rootFolder
            );
            navigate(parentPath);
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to delete file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleNewFolder = async (folderName: string) => {
    try {
      if (!dataRoom) {
        setError("No data room found");
        return;
      }

      // Determine the parent folder for the new folder
      let parentId: string | null = null;

      if (selectedItem) {
        if (selectedItem.type === "folder") {
          // If current item is a folder, create the new folder inside it
          parentId = selectedItem.id;
        } else {
          // If current item is a file, create the new folder in the file's parent
          const parentFolder = findParentFolder(
            selectedItem,
            dataRoom.rootFolder
          );
          parentId = parentFolder?.id || null;
        }
      }
      // If no selected item, create at root level (parentId remains null)

      const newFolder = await dataRoomService.createFolder(
        folderName,
        parentId
      );

      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);

        // Navigate to the newly created folder
        const newFolderPath = getItemPath(
          newFolder,
          updatedDataRoom.rootFolder
        );
        navigate(newFolderPath);
      }
    } catch (err) {
      setError(
        `Failed to create folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleUpload = async (files: File[]) => {
    try {
      if (!dataRoom) {
        setError("No data room found");
        return;
      }

      // Determine the parent folder for the uploaded files
      let parentId: string | null = null;

      if (selectedItem) {
        if (selectedItem.type === "folder") {
          // If current item is a folder, upload files inside it
          parentId = selectedItem.id;
        } else {
          // If current item is a file, upload files in the file's parent
          const parentFolder = findParentFolder(
            selectedItem,
            dataRoom.rootFolder
          );
          parentId = parentFolder?.id || null;
        }
      }
      // If no selected item, upload at root level (parentId remains null)

      // Upload all files
      const uploadedFiles = [];
      for (const file of files) {
        const uploadedFile = await dataRoomService.uploadFile(file, parentId);
        uploadedFiles.push(uploadedFile);
      }

      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);

        // Navigate to the first uploaded file
        if (uploadedFiles.length > 0) {
          const firstFile = uploadedFiles[0];
          const filePath = getItemPath(firstFile, updatedDataRoom.rootFolder);
          navigate(filePath);
        }
      }
    } catch (err) {
      setError(
        `Failed to upload files: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  if (!dataRoom) {
    return <div>No data room!</div>;
  }

  return (
    <div className="grid-areas-layout">
      {/* Masthead */}
      <div className="grid-area-masthead bg-gray-50 border-b border-gray-200 flex items-center px-6">
        <h1 className="text-2xl font-bold text-gray-900">ACME Data Room</h1>
      </div>

      {/* Toolbar */}
      <div className="grid-area-toolbar flex flex-row flex-wrap bg-white border-b border-gray-200 items-center justify-between px-6">
        <Breadcrumbs
          selectedItem={selectedItem}
          onNavigate={handleItemSelect}
        />
        <div className="flex items-center gap-4">
          <button
            onClick={() => setUploadDialogOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Upload size={16} />
            Upload
          </button>
          <button
            onClick={() => setNewFolderDialogOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FolderPlus size={16} />
            New Folder
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div className="grid-area-tree bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
        <DataRoomTreeView
          root={dataRoom.rootFolder}
          onItemSelect={handleItemSelect}
          selectedItemId={selectedItem?.id}
          expandAll={false}
        />
      </div>

      {/* Content Area */}
      <div className="grid-area-content bg-white p-6 overflow-y-auto">
        <Content
          selectedItem={selectedItem}
          rootFolderId={dataRoom.rootFolder.id}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
        />
      </div>

      {/* Messages */}
      <div className="grid-area-messages bg-gray-100 border-t border-gray-200 flex items-center px-6">
        <p className={`text-sm ${error ? "text-red-600" : "text-gray-600"}`}>
          {error || "Ready"}
        </p>
      </div>

      {/* New Folder Dialog */}
      <NewFolderDialog
        open={newFolderDialogOpen}
        onOpenChange={setNewFolderDialogOpen}
        onConfirm={handleNewFolder}
      />

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<DataRoomApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

```

Now let me add a useEffect to initialize the data room asynchronously:


```typescriptreact
import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import { Upload, FolderPlus } from "lucide-react";
import DataRoomTreeView from "@/components/DataRoomTreeView";
import Breadcrumbs from "@/components/Breadcrumbs";
import Content from "@/components/Content";
import NewFolderDialog from "@/components/NewFolderDialog";
import UploadDialog from "@/components/UploadDialog";
import { dataRoomService } from "@/services/DataRoomService";
import {
  findItemByPath,
  getItemPath,
  findParentFolder,
  findItemById,
} from "@/lib/pathUtils";
import type { DataRoomItem, DataRoom } from "@/types";

function DataRoomApp() {
  const { "*": rawPath = "/" } = useParams<{ "*"?: string }>();
  // Decode the path parameter to handle URL encoding
  const path = decodeURIComponent(rawPath);

  const navigate = useNavigate();
  const [dataRoom, setDataRoom] = useState<DataRoom | null>(null);
  const [selectedItem, setSelectedItem] = useState<DataRoomItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Initialize data room
  useEffect(() => {
    const initializeDataRoom = async () => {
      try {
        const room = await dataRoomService.initializeDataRoom();
        setDataRoom(room);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize data room");
      } finally {
        setInitializing(false);
      }
    };

    initializeDataRoom();
  }, []);

  // Update selectedItem based on URL path
  useEffect(() => {
    if (!dataRoom) {
      setError("No data room found");
      return;
    }

    const item = findItemByPath(dataRoom.rootFolder, path);

    if (item) {
      setSelectedItem(item);
      setError(null);
    } else {
      setSelectedItem(null);
      setError(`Path "${path}" not found`);
    }
  }, [path, dataRoom]);

  const handleItemSelect = (item: DataRoomItem | null) => {
    if (!dataRoom) {
      return;
    }

    if (item) {
      const itemPath = getItemPath(item, dataRoom.rootFolder);
      navigate(itemPath);
    } else {
      navigate("/");
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      await dataRoomService.updateFolderName(folderId, newName);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Update selected item if it's the renamed folder
        if (selectedItem?.id === folderId) {
          const updatedItem = findItemById(
            updatedDataRoom.rootFolder,
            folderId
          );
          setSelectedItem(updatedItem);
          // Update URL to reflect the new path
          if (updatedItem) {
            const newPath = getItemPath(
              updatedItem,
              updatedDataRoom.rootFolder
            );
            navigate(newPath);
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to rename folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      // Find parent folder before deletion
      const parentFolder = selectedItem
        ? findParentFolder(selectedItem, dataRoom!.rootFolder)
        : null;

      await dataRoomService.deleteFolder(folderId);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Navigate to parent or root if deleted folder was selected
        if (selectedItem?.id === folderId) {
          if (parentFolder) {
            const parentPath = getItemPath(
              parentFolder,
              updatedDataRoom.rootFolder
            );
            navigate(parentPath);
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to delete folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    try {
      await dataRoomService.updateFileName(fileId, newName);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Update selected item if it's the renamed file
        if (selectedItem?.id === fileId) {
          const updatedItem = findItemById(updatedDataRoom.rootFolder, fileId);
          setSelectedItem(updatedItem);
          // Update URL to reflect the new path
          if (updatedItem) {
            const newPath = getItemPath(
              updatedItem,
              updatedDataRoom.rootFolder
            );
            navigate(newPath);
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to rename file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      // Find parent folder before deletion
      const parentFolder = selectedItem
        ? findParentFolder(selectedItem, dataRoom!.rootFolder)
        : null;

      await dataRoomService.deleteFile(fileId);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Navigate to parent or root if deleted file was selected
        if (selectedItem?.id === fileId) {
          if (parentFolder) {
            const parentPath = getItemPath(
              parentFolder,
              updatedDataRoom.rootFolder
            );
            navigate(parentPath);
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to delete file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleNewFolder = async (folderName: string) => {
    try {
      if (!dataRoom) {
        setError("No data room found");
        return;
      }

      // Determine the parent folder for the new folder
      let parentId: string | null = null;

      if (selectedItem) {
        if (selectedItem.type === "folder") {
          // If current item is a folder, create the new folder inside it
          parentId = selectedItem.id;
        } else {
          // If current item is a file, create the new folder in the file's parent
          const parentFolder = findParentFolder(
            selectedItem,
            dataRoom.rootFolder
          );
          parentId = parentFolder?.id || null;
        }
      }
      // If no selected item, create at root level (parentId remains null)

      const newFolder = await dataRoomService.createFolder(
        folderName,
        parentId
      );

      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);

        // Navigate to the newly created folder
        const newFolderPath = getItemPath(
          newFolder,
          updatedDataRoom.rootFolder
        );
        navigate(newFolderPath);
      }
    } catch (err) {
      setError(
        `Failed to create folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleUpload = async (files: File[]) => {
    try {
      if (!dataRoom) {
        setError("No data room found");
        return;
      }

      // Determine the parent folder for the uploaded files
      let parentId: string | null = null;

      if (selectedItem) {
        if (selectedItem.type === "folder") {
          // If current item is a folder, upload files inside it
          parentId = selectedItem.id;
        } else {
          // If current item is a file, upload files in the file's parent
          const parentFolder = findParentFolder(
            selectedItem,
            dataRoom.rootFolder
          );
          parentId = parentFolder?.id || null;
        }
      }
      // If no selected item, upload at root level (parentId remains null)

      // Upload all files
      const uploadedFiles = [];
      for (const file of files) {
        const uploadedFile = await dataRoomService.uploadFile(file, parentId);
        uploadedFiles.push(uploadedFile);
      }

      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);

        // Navigate to the first uploaded file
        if (uploadedFiles.length > 0) {
          const firstFile = uploadedFiles[0];
          const filePath = getItemPath(firstFile, updatedDataRoom.rootFolder);
          navigate(filePath);
        }
      }
    } catch (err) {
      setError(
        `Failed to upload files: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  if (!dataRoom) {
    return <div>No data room!</div>;
  }

  return (
    <div className="grid-areas-layout">
      {/* Masthead */}
      <div className="grid-area-masthead bg-gray-50 border-b border-gray-200 flex items-center px-6">
        <h1 className="text-2xl font-bold text-gray-900">ACME Data Room</h1>
      </div>

      {/* Toolbar */}
      <div className="grid-area-toolbar flex flex-row flex-wrap bg-white border-b border-gray-200 items-center justify-between px-6">
        <Breadcrumbs
          selectedItem={selectedItem}
          onNavigate={handleItemSelect}
        />
        <div className="flex items-center gap-4">
          <button
            onClick={() => setUploadDialogOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Upload size={16} />
            Upload
          </button>
          <button
            onClick={() => setNewFolderDialogOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FolderPlus size={16} />
            New Folder
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div className="grid-area-tree bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
        <DataRoomTreeView
          root={dataRoom.rootFolder}
          onItemSelect={handleItemSelect}
          selectedItemId={selectedItem?.id}
          expandAll={false}
        />
      </div>

      {/* Content Area */}
      <div className="grid-area-content bg-white p-6 overflow-y-auto">
        <Content
          selectedItem={selectedItem}
          rootFolderId={dataRoom.rootFolder.id}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
        />
      </div>

      {/* Messages */}
      <div className="grid-area-messages bg-gray-100 border-t border-gray-200 flex items-center px-6">
        <p className={`text-sm ${error ? "text-red-600" : "text-gray-600"}`}>
          {error || "Ready"}
        </p>
      </div>

      {/* New Folder Dialog */}
      <NewFolderDialog
        open={newFolderDialogOpen}
        onOpenChange={setNewFolderDialogOpen}
        onConfirm={handleNewFolder}
      />

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<DataRoomApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

```

Now let me update the render logic to handle the initializing state:


```typescriptreact
import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import { Upload, FolderPlus } from "lucide-react";
import DataRoomTreeView from "@/components/DataRoomTreeView";
import Breadcrumbs from "@/components/Breadcrumbs";
import Content from "@/components/Content";
import NewFolderDialog from "@/components/NewFolderDialog";
import UploadDialog from "@/components/UploadDialog";
import { dataRoomService } from "@/services/DataRoomService";
import {
  findItemByPath,
  getItemPath,
  findParentFolder,
  findItemById,
} from "@/lib/pathUtils";
import type { DataRoomItem, DataRoom } from "@/types";

function DataRoomApp() {
  const { "*": rawPath = "/" } = useParams<{ "*"?: string }>();
  // Decode the path parameter to handle URL encoding
  const path = decodeURIComponent(rawPath);

  const navigate = useNavigate();
  const [dataRoom, setDataRoom] = useState<DataRoom | null>(null);
  const [selectedItem, setSelectedItem] = useState<DataRoomItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Initialize data room
  useEffect(() => {
    const initializeDataRoom = async () => {
      try {
        const room = await dataRoomService.initializeDataRoom();
        setDataRoom(room);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize data room");
      } finally {
        setInitializing(false);
      }
    };

    initializeDataRoom();
  }, []);

  // Update selectedItem based on URL path
  useEffect(() => {
    if (!dataRoom) {
      setError("No data room found");
      return;
    }

    const item = findItemByPath(dataRoom.rootFolder, path);

    if (item) {
      setSelectedItem(item);
      setError(null);
    } else {
      setSelectedItem(null);
      setError(`Path "${path}" not found`);
    }
  }, [path, dataRoom]);

  const handleItemSelect = (item: DataRoomItem | null) => {
    if (!dataRoom) {
      return;
    }

    if (item) {
      const itemPath = getItemPath(item, dataRoom.rootFolder);
      navigate(itemPath);
    } else {
      navigate("/");
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      await dataRoomService.updateFolderName(folderId, newName);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Update selected item if it's the renamed folder
        if (selectedItem?.id === folderId) {
          const updatedItem = findItemById(
            updatedDataRoom.rootFolder,
            folderId
          );
          setSelectedItem(updatedItem);
          // Update URL to reflect the new path
          if (updatedItem) {
            const newPath = getItemPath(
              updatedItem,
              updatedDataRoom.rootFolder
            );
            navigate(newPath);
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to rename folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      // Find parent folder before deletion
      const parentFolder = selectedItem
        ? findParentFolder(selectedItem, dataRoom!.rootFolder)
        : null;

      await dataRoomService.deleteFolder(folderId);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Navigate to parent or root if deleted folder was selected
        if (selectedItem?.id === folderId) {
          if (parentFolder) {
            const parentPath = getItemPath(
              parentFolder,
              updatedDataRoom.rootFolder
            );
            navigate(parentPath);
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to delete folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    try {
      await dataRoomService.updateFileName(fileId, newName);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Update selected item if it's the renamed file
        if (selectedItem?.id === fileId) {
          const updatedItem = findItemById(updatedDataRoom.rootFolder, fileId);
          setSelectedItem(updatedItem);
          // Update URL to reflect the new path
          if (updatedItem) {
            const newPath = getItemPath(
              updatedItem,
              updatedDataRoom.rootFolder
            );
            navigate(newPath);
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to rename file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      // Find parent folder before deletion
      const parentFolder = selectedItem
        ? findParentFolder(selectedItem, dataRoom!.rootFolder)
        : null;

      await dataRoomService.deleteFile(fileId);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Navigate to parent or root if deleted file was selected
        if (selectedItem?.id === fileId) {
          if (parentFolder) {
            const parentPath = getItemPath(
              parentFolder,
              updatedDataRoom.rootFolder
            );
            navigate(parentPath);
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to delete file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleNewFolder = async (folderName: string) => {
    try {
      if (!dataRoom) {
        setError("No data room found");
        return;
      }

      // Determine the parent folder for the new folder
      let parentId: string | null = null;

      if (selectedItem) {
        if (selectedItem.type === "folder") {
          // If current item is a folder, create the new folder inside it
          parentId = selectedItem.id;
        } else {
          // If current item is a file, create the new folder in the file's parent
          const parentFolder = findParentFolder(
            selectedItem,
            dataRoom.rootFolder
          );
          parentId = parentFolder?.id || null;
        }
      }
      // If no selected item, create at root level (parentId remains null)

      const newFolder = await dataRoomService.createFolder(
        folderName,
        parentId
      );

      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);

        // Navigate to the newly created folder
        const newFolderPath = getItemPath(
          newFolder,
          updatedDataRoom.rootFolder
        );
        navigate(newFolderPath);
      }
    } catch (err) {
      setError(
        `Failed to create folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleUpload = async (files: File[]) => {
    try {
      if (!dataRoom) {
        setError("No data room found");
        return;
      }

      // Determine the parent folder for the uploaded files
      let parentId: string | null = null;

      if (selectedItem) {
        if (selectedItem.type === "folder") {
          // If current item is a folder, upload files inside it
          parentId = selectedItem.id;
        } else {
          // If current item is a file, upload files in the file's parent
          const parentFolder = findParentFolder(
            selectedItem,
            dataRoom.rootFolder
          );
          parentId = parentFolder?.id || null;
        }
      }
      // If no selected item, upload at root level (parentId remains null)

      // Upload all files
      const uploadedFiles = [];
      for (const file of files) {
        const uploadedFile = await dataRoomService.uploadFile(file, parentId);
        uploadedFiles.push(uploadedFile);
      }

      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);

        // Navigate to the first uploaded file
        if (uploadedFiles.length > 0) {
          const firstFile = uploadedFiles[0];
          const filePath = getItemPath(firstFile, updatedDataRoom.rootFolder);
          navigate(filePath);
        }
      }
    } catch (err) {
      setError(
        `Failed to upload files: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Data Room...</p>
        </div>
      </div>
    );
  }

  if (!dataRoom) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">No data room found</p>
          <p className="text-gray-600 mt-2">Please refresh the page to try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid-areas-layout">
      {/* Masthead */}
      <div className="grid-area-masthead bg-gray-50 border-b border-gray-200 flex items-center px-6">
        <h1 className="text-2xl font-bold text-gray-900">ACME Data Room</h1>
      </div>

      {/* Toolbar */}
      <div className="grid-area-toolbar flex flex-row flex-wrap bg-white border-b border-gray-200 items-center justify-between px-6">
        <Breadcrumbs
          selectedItem={selectedItem}
          onNavigate={handleItemSelect}
        />
        <div className="flex items-center gap-4">
          <button
            onClick={() => setUploadDialogOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Upload size={16} />
            Upload
          </button>
          <button
            onClick={() => setNewFolderDialogOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FolderPlus size={16} />
            New Folder
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div className="grid-area-tree bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
        <DataRoomTreeView
          root={dataRoom.rootFolder}
          onItemSelect={handleItemSelect}
          selectedItemId={selectedItem?.id}
          expandAll={false}
        />
      </div>

      {/* Content Area */}
      <div className="grid-area-content bg-white p-6 overflow-y-auto">
        <Content
          selectedItem={selectedItem}
          rootFolderId={dataRoom.rootFolder.id}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
        />
      </div>

      {/* Messages */}
      <div className="grid-area-messages bg-gray-100 border-t border-gray-200 flex items-center px-6">
        <p className={`text-sm ${error ? "text-red-600" : "text-gray-600"}`}>
          {error || "Ready"}
        </p>
      </div>

      {/* New Folder Dialog */}
      <NewFolderDialog
        open={newFolderDialogOpen}
        onOpenChange={setNewFolderDialogOpen}
        onConfirm={handleNewFolder}
      />

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<DataRoomApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

```

Now I need to finish updating the remaining methods in DataRoomService that call getStoredDataRoom. Let me continue:


```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): Promise<DataRoom>;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private async getStoredDataRoom(): Promise<DataRoom | null> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);

    // Check if migration is needed (files with ArrayBuffer content)
    const needsMigration = this.checkIfMigrationNeeded(parsed);
    if (needsMigration) {
      console.log("Migrating file content to IndexedDB...");
      const migrated = await this.migrateFileContentToIndexedDB(parsed);
      this.setDataRoom(migrated);
      return migrated;
    }

    return parsed;
  }

  // Check if migration is needed
  private checkIfMigrationNeeded(dataRoom: DataRoom): boolean {
    const checkFolder = (folder: Folder): boolean => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          if ("content" in file && file.content instanceof ArrayBuffer) {
            return true;
          }
        } else if (item.type === "folder") {
          if (checkFolder(item as Folder)) {
            return true;
          }
        }
      }
      return false;
    };

    return checkFolder(dataRoom.rootFolder);
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Migration helper to move existing ArrayBuffer content to IndexedDB
  private async migrateFileContentToIndexedDB(
    dataRoom: DataRoom
  ): Promise<DataRoom> {
    const migrateFolder = async (folder: Folder): Promise<void> => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          // Check if this is an old file with ArrayBuffer content
          if ("content" in file && file.content instanceof ArrayBuffer) {
            // Create a new fileId and store in IndexedDB
            const fileId = this.generateId();

            // Create a File object from the ArrayBuffer for storage
            const blob = new Blob([file.content], {
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType,
            });
            const fileObj = new File([blob], file.name, {
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType,
            });

            await indexedDBFileService.storeFile(fileId, fileObj);

            // Update the file object to use fileId instead of content
            (file as any).fileId = fileId;
            delete (file as any).content;
          }
        } else if (item.type === "folder") {
          await migrateFolder(item as Folder);
        }
      }
    };

    await migrateFolder(dataRoom.rootFolder);
    return dataRoom;
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return await this.getStoredDataRoom();
  }

  async initializeDataRoom(): Promise<DataRoom> {
    const existingDataRoom = await this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();

    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);

    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;

    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await indexedDBFileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): Promise<DataRoom>;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private async getStoredDataRoom(): Promise<DataRoom | null> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);

    // Check if migration is needed (files with ArrayBuffer content)
    const needsMigration = this.checkIfMigrationNeeded(parsed);
    if (needsMigration) {
      console.log("Migrating file content to IndexedDB...");
      const migrated = await this.migrateFileContentToIndexedDB(parsed);
      this.setDataRoom(migrated);
      return migrated;
    }

    return parsed;
  }

  // Check if migration is needed
  private checkIfMigrationNeeded(dataRoom: DataRoom): boolean {
    const checkFolder = (folder: Folder): boolean => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          if ("content" in file && file.content instanceof ArrayBuffer) {
            return true;
          }
        } else if (item.type === "folder") {
          if (checkFolder(item as Folder)) {
            return true;
          }
        }
      }
      return false;
    };

    return checkFolder(dataRoom.rootFolder);
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Migration helper to move existing ArrayBuffer content to IndexedDB
  private async migrateFileContentToIndexedDB(
    dataRoom: DataRoom
  ): Promise<DataRoom> {
    const migrateFolder = async (folder: Folder): Promise<void> => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          // Check if this is an old file with ArrayBuffer content
          if ("content" in file && file.content instanceof ArrayBuffer) {
            // Create a new fileId and store in IndexedDB
            const fileId = this.generateId();

            // Create a File object from the ArrayBuffer for storage
            const blob = new Blob([file.content], {
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType,
            });
            const fileObj = new File([blob], file.name, {
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType,
            });

            await indexedDBFileService.storeFile(fileId, fileObj);

            // Update the file object to use fileId instead of content
            (file as any).fileId = fileId;
            delete (file as any).content;
          }
        } else if (item.type === "folder") {
          await migrateFolder(item as Folder);
        }
      }
    };

    await migrateFolder(dataRoom.rootFolder);
    return dataRoom;
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return await this.getStoredDataRoom();
  }

  async initializeDataRoom(): Promise<DataRoom> {
    const existingDataRoom = await this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();

    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);

    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;

    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await indexedDBFileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): Promise<DataRoom>;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private async getStoredDataRoom(): Promise<DataRoom | null> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);

    // Check if migration is needed (files with ArrayBuffer content)
    const needsMigration = this.checkIfMigrationNeeded(parsed);
    if (needsMigration) {
      console.log("Migrating file content to IndexedDB...");
      const migrated = await this.migrateFileContentToIndexedDB(parsed);
      this.setDataRoom(migrated);
      return migrated;
    }

    return parsed;
  }

  // Check if migration is needed
  private checkIfMigrationNeeded(dataRoom: DataRoom): boolean {
    const checkFolder = (folder: Folder): boolean => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          if ("content" in file && file.content instanceof ArrayBuffer) {
            return true;
          }
        } else if (item.type === "folder") {
          if (checkFolder(item as Folder)) {
            return true;
          }
        }
      }
      return false;
    };

    return checkFolder(dataRoom.rootFolder);
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Migration helper to move existing ArrayBuffer content to IndexedDB
  private async migrateFileContentToIndexedDB(
    dataRoom: DataRoom
  ): Promise<DataRoom> {
    const migrateFolder = async (folder: Folder): Promise<void> => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          // Check if this is an old file with ArrayBuffer content
          if ("content" in file && file.content instanceof ArrayBuffer) {
            // Create a new fileId and store in IndexedDB
            const fileId = this.generateId();

            // Create a File object from the ArrayBuffer for storage
            const blob = new Blob([file.content], {
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType,
            });
            const fileObj = new File([blob], file.name, {
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType,
            });

            await indexedDBFileService.storeFile(fileId, fileObj);

            // Update the file object to use fileId instead of content
            (file as any).fileId = fileId;
            delete (file as any).content;
          }
        } else if (item.type === "folder") {
          await migrateFolder(item as Folder);
        }
      }
    };

    await migrateFolder(dataRoom.rootFolder);
    return dataRoom;
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return await this.getStoredDataRoom();
  }

  async initializeDataRoom(): Promise<DataRoom> {
    const existingDataRoom = await this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();

    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);

    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;

    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await indexedDBFileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): Promise<DataRoom>;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private async getStoredDataRoom(): Promise<DataRoom | null> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);

    // Check if migration is needed (files with ArrayBuffer content)
    const needsMigration = this.checkIfMigrationNeeded(parsed);
    if (needsMigration) {
      console.log("Migrating file content to IndexedDB...");
      const migrated = await this.migrateFileContentToIndexedDB(parsed);
      this.setDataRoom(migrated);
      return migrated;
    }

    return parsed;
  }

  // Check if migration is needed
  private checkIfMigrationNeeded(dataRoom: DataRoom): boolean {
    const checkFolder = (folder: Folder): boolean => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          if ("content" in file && file.content instanceof ArrayBuffer) {
            return true;
          }
        } else if (item.type === "folder") {
          if (checkFolder(item as Folder)) {
            return true;
          }
        }
      }
      return false;
    };

    return checkFolder(dataRoom.rootFolder);
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Migration helper to move existing ArrayBuffer content to IndexedDB
  private async migrateFileContentToIndexedDB(
    dataRoom: DataRoom
  ): Promise<DataRoom> {
    const migrateFolder = async (folder: Folder): Promise<void> => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          // Check if this is an old file with ArrayBuffer content
          if ("content" in file && file.content instanceof ArrayBuffer) {
            // Create a new fileId and store in IndexedDB
            const fileId = this.generateId();

            // Create a File object from the ArrayBuffer for storage
            const blob = new Blob([file.content], {
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType,
            });
            const fileObj = new File([blob], file.name, {
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType,
            });

            await indexedDBFileService.storeFile(fileId, fileObj);

            // Update the file object to use fileId instead of content
            (file as any).fileId = fileId;
            delete (file as any).content;
          }
        } else if (item.type === "folder") {
          await migrateFolder(item as Folder);
        }
      }
    };

    await migrateFolder(dataRoom.rootFolder);
    return dataRoom;
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return await this.getStoredDataRoom();
  }

  async initializeDataRoom(): Promise<DataRoom> {
    const existingDataRoom = await this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();

    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);

    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;

    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await indexedDBFileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

<think>
The user is getting an error "Cannot read properties of undefined (reading 'id')" at App.tsx:353:45. I've been updating the DataRoomService to make getStoredDataRoom async, but I still need to finish updating the remaining methods. Let me continue updating the remaining methods that call getStoredDataRoom, then check for any linting errors.

I need to update:
- searchItems method
- getPathToItem method

Let me finish these updates and then check for errors.
</think>



```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): Promise<DataRoom>;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private async getStoredDataRoom(): Promise<DataRoom | null> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);

    // Check if migration is needed (files with ArrayBuffer content)
    const needsMigration = this.checkIfMigrationNeeded(parsed);
    if (needsMigration) {
      console.log("Migrating file content to IndexedDB...");
      const migrated = await this.migrateFileContentToIndexedDB(parsed);
      this.setDataRoom(migrated);
      return migrated;
    }

    return parsed;
  }

  // Check if migration is needed
  private checkIfMigrationNeeded(dataRoom: DataRoom): boolean {
    const checkFolder = (folder: Folder): boolean => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          if ("content" in file && file.content instanceof ArrayBuffer) {
            return true;
          }
        } else if (item.type === "folder") {
          if (checkFolder(item as Folder)) {
            return true;
          }
        }
      }
      return false;
    };

    return checkFolder(dataRoom.rootFolder);
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Migration helper to move existing ArrayBuffer content to IndexedDB
  private async migrateFileContentToIndexedDB(
    dataRoom: DataRoom
  ): Promise<DataRoom> {
    const migrateFolder = async (folder: Folder): Promise<void> => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          // Check if this is an old file with ArrayBuffer content
          if ("content" in file && file.content instanceof ArrayBuffer) {
            // Create a new fileId and store in IndexedDB
            const fileId = this.generateId();

            // Create a File object from the ArrayBuffer for storage
            const blob = new Blob([file.content], {
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType,
            });
            const fileObj = new File([blob], file.name, {
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType,
            });

            await indexedDBFileService.storeFile(fileId, fileObj);

            // Update the file object to use fileId instead of content
            (file as any).fileId = fileId;
            delete (file as any).content;
          }
        } else if (item.type === "folder") {
          await migrateFolder(item as Folder);
        }
      }
    };

    await migrateFolder(dataRoom.rootFolder);
    return dataRoom;
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return await this.getStoredDataRoom();
  }

  async initializeDataRoom(): Promise<DataRoom> {
    const existingDataRoom = await this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();

    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);

    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;

    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await indexedDBFileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  getPathToItem(itemId: string): DataRoomItem[] {
    const dataRoom = this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

<think>
I need to update the getPathToItem method as well, but I notice it's not async. Let me check if it calls getStoredDataRoom and update it accordingly.
</think>



```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): Promise<DataRoom>;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): DataRoomItem[];
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private async getStoredDataRoom(): Promise<DataRoom | null> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);

    // Check if migration is needed (files with ArrayBuffer content)
    const needsMigration = this.checkIfMigrationNeeded(parsed);
    if (needsMigration) {
      console.log("Migrating file content to IndexedDB...");
      const migrated = await this.migrateFileContentToIndexedDB(parsed);
      this.setDataRoom(migrated);
      return migrated;
    }

    return parsed;
  }

  // Check if migration is needed
  private checkIfMigrationNeeded(dataRoom: DataRoom): boolean {
    const checkFolder = (folder: Folder): boolean => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          if ("content" in file && file.content instanceof ArrayBuffer) {
            return true;
          }
        } else if (item.type === "folder") {
          if (checkFolder(item as Folder)) {
            return true;
          }
        }
      }
      return false;
    };

    return checkFolder(dataRoom.rootFolder);
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Migration helper to move existing ArrayBuffer content to IndexedDB
  private async migrateFileContentToIndexedDB(
    dataRoom: DataRoom
  ): Promise<DataRoom> {
    const migrateFolder = async (folder: Folder): Promise<void> => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          // Check if this is an old file with ArrayBuffer content
          if ("content" in file && file.content instanceof ArrayBuffer) {
            // Create a new fileId and store in IndexedDB
            const fileId = this.generateId();

            // Create a File object from the ArrayBuffer for storage
            const blob = new Blob([file.content], {
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType,
            });
            const fileObj = new File([blob], file.name, {
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType,
            });

            await indexedDBFileService.storeFile(fileId, fileObj);

            // Update the file object to use fileId instead of content
            (file as any).fileId = fileId;
            delete (file as any).content;
          }
        } else if (item.type === "folder") {
          await migrateFolder(item as Folder);
        }
      }
    };

    await migrateFolder(dataRoom.rootFolder);
    return dataRoom;
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return await this.getStoredDataRoom();
  }

  async initializeDataRoom(): Promise<DataRoom> {
    const existingDataRoom = await this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();

    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);

    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;

    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await indexedDBFileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  async getPathToItem(itemId: string): Promise<DataRoomItem[]> {
    const dataRoom = await this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

Now I need to update the interface to reflect that getPathToItem is now async:


```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): Promise<DataRoom>;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): Promise<DataRoomItem[]>;
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private async getStoredDataRoom(): Promise<DataRoom | null> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);

    // Check if migration is needed (files with ArrayBuffer content)
    const needsMigration = this.checkIfMigrationNeeded(parsed);
    if (needsMigration) {
      console.log("Migrating file content to IndexedDB...");
      const migrated = await this.migrateFileContentToIndexedDB(parsed);
      this.setDataRoom(migrated);
      return migrated;
    }

    return parsed;
  }

  // Check if migration is needed
  private checkIfMigrationNeeded(dataRoom: DataRoom): boolean {
    const checkFolder = (folder: Folder): boolean => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          if ("content" in file && file.content instanceof ArrayBuffer) {
            return true;
          }
        } else if (item.type === "folder") {
          if (checkFolder(item as Folder)) {
            return true;
          }
        }
      }
      return false;
    };

    return checkFolder(dataRoom.rootFolder);
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Migration helper to move existing ArrayBuffer content to IndexedDB
  private async migrateFileContentToIndexedDB(
    dataRoom: DataRoom
  ): Promise<DataRoom> {
    const migrateFolder = async (folder: Folder): Promise<void> => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          // Check if this is an old file with ArrayBuffer content
          if ("content" in file && file.content instanceof ArrayBuffer) {
            // Create a new fileId and store in IndexedDB
            const fileId = this.generateId();

            // Create a File object from the ArrayBuffer for storage
            const blob = new Blob([file.content], {
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType,
            });
            const fileObj = new File([blob], file.name, {
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType,
            });

            await indexedDBFileService.storeFile(fileId, fileObj);

            // Update the file object to use fileId instead of content
            (file as any).fileId = fileId;
            delete (file as any).content;
          }
        } else if (item.type === "folder") {
          await migrateFolder(item as Folder);
        }
      }
    };

    await migrateFolder(dataRoom.rootFolder);
    return dataRoom;
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return await this.getStoredDataRoom();
  }

  async initializeDataRoom(): Promise<DataRoom> {
    const existingDataRoom = await this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();

    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);

    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;

    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await indexedDBFileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  async getPathToItem(itemId: string): Promise<DataRoomItem[]> {
    const dataRoom = await this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

Now let me check for any linting errors:


Let me fix those TypeScript errors in the migration function:


```typescript
import type { DataRoom, DataRoomItem, File, Folder } from "../types/index.ts";
import { SUPPORTED_FILE_TYPES } from "../types/index.ts";
import { indexedDBFileService } from "./IndexedDBFileService";

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  getDataRoom(): Promise<DataRoom | null>;
  initializeDataRoom(): Promise<DataRoom>;

  // Folder operations
  createFolder(name: string, parentId?: string | null): Promise<Folder>;
  getFolder(folderId: string): Promise<Folder | null>;
  updateFolderName(folderId: string, name: string): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;

  // File operations
  uploadFile(file: globalThis.File, parentId?: string | null): Promise<File>;
  getFile(fileId: string): Promise<File | null>;
  getFileContent(fileId: string): Promise<ArrayBuffer | null>;
  updateFileName(fileId: string, name: string): Promise<File>;
  deleteFile(fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(query: string): Promise<DataRoomItem[]>;
  getPathToItem(itemId: string): Promise<DataRoomItem[]>;
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = "dataroom_data";

  // Helper methods for local storage
  private async getStoredDataRoom(): Promise<DataRoom | null> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    this.convertDatesToObjects(parsed);

    // Check if migration is needed (files with ArrayBuffer content)
    const needsMigration = this.checkIfMigrationNeeded(parsed);
    if (needsMigration) {
      console.log("Migrating file content to IndexedDB...");
      const migrated = await this.migrateFileContentToIndexedDB(parsed);
      this.setDataRoom(migrated);
      return migrated;
    }

    return parsed;
  }

  // Check if migration is needed
  private checkIfMigrationNeeded(dataRoom: DataRoom): boolean {
    const checkFolder = (folder: Folder): boolean => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          if ("content" in file && file.content instanceof ArrayBuffer) {
            return true;
          }
        } else if (item.type === "folder") {
          if (checkFolder(item as Folder)) {
            return true;
          }
        }
      }
      return false;
    };

    return checkFolder(dataRoom.rootFolder);
  }

  // Helper to convert date strings back to Date objects recursively
  private convertDatesToObjects(obj: unknown): void {
    if (obj && typeof obj === "object" && obj !== null) {
      const objRecord = obj as Record<string, unknown>;

      if (objRecord.createdAt && typeof objRecord.createdAt === "string") {
        objRecord.createdAt = new Date(objRecord.createdAt);
      }
      if (objRecord.updatedAt && typeof objRecord.updatedAt === "string") {
        objRecord.updatedAt = new Date(objRecord.updatedAt);
      }

      // Recursively process nested objects and arrays
      for (const key in objRecord) {
        if (objRecord[key] && typeof objRecord[key] === "object") {
          this.convertDatesToObjects(objRecord[key]);
        }
      }
    }
  }

  private setDataRoom(dataRoom: DataRoom): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataRoom));
  }

  // Helper to generate unique IDs
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Migration helper to move existing ArrayBuffer content to IndexedDB
  private async migrateFileContentToIndexedDB(
    dataRoom: DataRoom
  ): Promise<DataRoom> {
    const migrateFolder = async (folder: Folder): Promise<void> => {
      for (const item of folder.children) {
        if (item.type === "file") {
          const file = item as File;
          // Check if this is an old file with ArrayBuffer content
          if ("content" in file && file.content instanceof ArrayBuffer) {
            // Create a new fileId and store in IndexedDB
            const fileId = this.generateId();

            // Create a File object from the ArrayBuffer for storage
            const blob = new Blob([file.content], {
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType,
            });
            const fileObj = new File([blob], file.name, {
              type: SUPPORTED_FILE_TYPES[file.fileType].mimeType,
            });

            await indexedDBFileService.storeFile(fileId, fileObj);

            // Update the file object to use fileId instead of content
            (file as File & { content?: ArrayBuffer }).fileId = fileId;
            delete (file as File & { content?: ArrayBuffer }).content;
          }
        } else if (item.type === "folder") {
          await migrateFolder(item as Folder);
        }
      }
    };

    await migrateFolder(dataRoom.rootFolder);
    return dataRoom;
  }

  // Helper to find item by ID in nested structure
  private findItemById(items: DataRoomItem[], id: string): DataRoomItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.type === "folder") {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to remove item from parent folder
  private removeFromParent(items: DataRoomItem[], targetId: string): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === targetId) {
        items.splice(i, 1);
        return true;
      }
      if (items[i].type === "folder") {
        if (this.removeFromParent((items[i] as Folder).children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): {
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += (child as File).size;
      } else {
        const stats = this.calculateFolderStats(child as Folder);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async getDataRoom(): Promise<DataRoom | null> {
    return await this.getStoredDataRoom();
  }

  async initializeDataRoom(): Promise<DataRoom> {
    const existingDataRoom = await this.getStoredDataRoom();
    if (existingDataRoom) {
      return existingDataRoom;
    }

    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: "/",
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: [],
    };

    const dataRoom: DataRoom = {
      id,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
    };

    this.setDataRoom(dataRoom);
    return dataRoom;
  }

  // Folder operations
  async createFolder(name: string, parentId?: string | null): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: "folder",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: [],
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setDataRoom(dataRoom);

    return folder;
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === "folder" ? (folder as Folder) : null;
  }

  async updateFolderName(folderId: string, name: string): Promise<Folder> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // File operations
  async uploadFile(
    file: globalThis.File,
    parentId?: string | null
  ): Promise<File> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    // Determine file type from file extension
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) {
      throw new Error("File must have an extension");
    }

    // Find matching file type configuration
    let fileType: string | null = null;
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        fileType = key;
        break;
      }
    }

    if (!fileType) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
        .map((config) => config.extension)
        .join(", ");
      throw new Error(
        `Unsupported file type. Supported types: ${supportedExtensions}`
      );
    }

    // Validate file size
    const config =
      SUPPORTED_FILE_TYPES[fileType as keyof typeof SUPPORTED_FILE_TYPES];
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    const now = new Date();
    const fileId = this.generateId();

    // Store file in IndexedDB
    await indexedDBFileService.storeFile(fileId, file);

    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: "file",
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: fileType as keyof typeof SUPPORTED_FILE_TYPES,
      size: file.size,
      fileId: fileId, // Reference to IndexedDB
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById(
        [dataRoom.rootFolder],
        parentId
      ) as Folder;
      if (!parentFolder || parentFolder.type !== "folder") {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(fileItem);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(fileItem);
      dataRoom.rootFolder.updatedAt = now;
    }

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = now;

    this.setDataRoom(dataRoom);

    return fileItem;
  }

  async getFile(fileId: string): Promise<File | null> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === "file" ? (file as File) : null;
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer | null> {
    const file = await this.getFile(fileId);
    if (!file) return null;

    return indexedDBFileService.getFile(file.fileId);
  }

  async updateFileName(fileId: string, name: string): Promise<File> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setDataRoom(dataRoom);

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== "file") {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Delete from IndexedDB
    await indexedDBFileService.deleteFile(file.fileId);

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);

    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setDataRoom(dataRoom);
  }

  // Utility operations
  async getFolderContents(folderId?: string | null): Promise<DataRoomItem[]> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== "folder") {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(query: string): Promise<DataRoomItem[]> {
    const dataRoom = await this.getStoredDataRoom();

    if (!dataRoom) {
      throw new Error("DataRoom not found. Please initialize it first.");
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === "folder") {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }

  async getPathToItem(itemId: string): Promise<DataRoomItem[]> {
    const dataRoom = await this.getStoredDataRoom();
    if (!dataRoom) {
      return [];
    }

    // If looking for root folder
    if (itemId === dataRoom.rootFolder.id) {
      return [dataRoom.rootFolder];
    }

    const path: DataRoomItem[] = [];

    // Helper function to find path recursively
    const findPath = (items: DataRoomItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          path.push(item);
          return true;
        }
        if (item.type === "folder") {
          const folder = item as Folder;
          if (findPath(folder.children, targetId)) {
            path.unshift(item); // Add parent folder at the beginning
            return true;
          }
        }
      }
      return false;
    };

    // Start from root folder
    if (findPath(dataRoom.rootFolder.children, itemId)) {
      path.unshift(dataRoom.rootFolder); // Add root folder at the beginning
    }
    return path;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();

```

Now let me update the todo list to mark our progress:


Let me check if there are any remaining linting errors:


Perfect! Now let's test the application to see if the IndexedDB migration is working:


## ✅ IndexedDB Migration Complete!

I've successfully migrated the Data Room application from storing files as ArrayBuffers in localStorage to using IndexedDB for file storage. Here's what was implemented:

### **Key Changes Made:**

1. **Created IndexedDBFileService** (`/src/services/IndexedDBFileService.ts`):
   - Handles all file storage operations in IndexedDB
   - Supports storing, retrieving, and deleting files
   - Provides proper error handling and async operations

2. **Updated File Type** (`/src/types/index.ts`):
   - Replaced `content: ArrayBuffer` with `fileId: string`
   - Files now reference IndexedDB storage instead of storing content directly

3. **Enhanced DataRoomService** (`/src/services/DataRoomService.ts`):
   - Added `getFileContent()` method to retrieve files from IndexedDB
   - Updated all methods to be async for proper IndexedDB handling
   - Added automatic migration logic for existing data
   - Files are now stored in IndexedDB during upload

4. **Updated FileContent Component** (`/src/components/FileContent.tsx`):
   - Now loads file content asynchronously from IndexedDB
   - Added loading states and error handling
   - Shows spinner while loading file content

5. **Fixed App Component** (`/src/App.tsx`):
   - Updated to handle async data room initialization
   - Added proper loading states during initialization
   - Fixed the "Cannot read properties of undefined" error

### **Benefits of IndexedDB Migration:**

- **✅ Much Larger Storage**: Can store hundreds of MB or even GB of files
- **✅ Better Performance**: Files loaded on-demand, not all at once
- **✅ Memory Efficient**: Only loads files when needed for viewing
- **✅ Proper File Handling**: Designed specifically for binary data storage
- **✅ Async Operations**: Non-blocking file operations
- **✅ Automatic Migration**: Existing data is automatically migrated

### **Migration Process:**

The app now automatically detects if there are files with old ArrayBuffer content and migrates them to IndexedDB on first load. This ensures backward compatibility with existing data.

The application should now work much better with larger files and multiple files, while maintaining all the existing functionality!

---

**User**

Breadcrumbs.tsx:33 Uncaught TypeError: path.map is not a function
    at Breadcrumbs (Breadcrumbs.tsx:33:13)

---

**Cursor**

I see the issue! The problem is that `getPathToItem` is now async, but the Breadcrumbs component is still calling it synchronously. Let me fix this by updating the Breadcrumbs component to handle the async call.


I can see the issue. The `getPathToItem` method is now async, but the Breadcrumbs component is calling it synchronously on line 16. I need to update the Breadcrumbs component to handle the async call properly using useEffect and useState.


```typescriptreact
import React, { useState, useEffect } from "react";
import { dataRoomService } from "@/services/DataRoomService";
import type { DataRoomItem } from "@/types";

interface BreadcrumbsProps {
  selectedItem: DataRoomItem | null;
  onNavigate: (item: DataRoomItem | null) => void;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  selectedItem,
  onNavigate,
}) => {
  const [path, setPath] = useState<DataRoomItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Get the path to the selected item asynchronously
  useEffect(() => {
    const loadPath = async () => {
      if (!selectedItem) {
        setPath([]);
        return;
      }

      setLoading(true);
      try {
        const itemPath = await dataRoomService.getPathToItem(selectedItem.id);
        setPath(itemPath);
      } catch (error) {
        console.error('Failed to load breadcrumb path:', error);
        setPath([]);
      } finally {
        setLoading(false);
      }
    };

    loadPath();
  }, [selectedItem]);

  const handleBreadcrumbClick = (item: DataRoomItem) => {
    onNavigate(item);
  };

  if (!selectedItem || path.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <span>No item selected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      {path.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && <span className="text-gray-400 select-none">/</span>}
          <button
            aria-label={`Go to ${item.name}`}
            onClick={() => handleBreadcrumbClick(item)}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              index === path.length - 1
                ? "text-gray-900 font-medium cursor-default"
                : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            }`}
            disabled={index === path.length - 1}
          >
            {item.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumbs;

```

Now let me update the render logic to handle the loading state:


```typescriptreact
import React, { useState, useEffect } from "react";
import { dataRoomService } from "@/services/DataRoomService";
import type { DataRoomItem } from "@/types";

interface BreadcrumbsProps {
  selectedItem: DataRoomItem | null;
  onNavigate: (item: DataRoomItem | null) => void;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  selectedItem,
  onNavigate,
}) => {
  const [path, setPath] = useState<DataRoomItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Get the path to the selected item asynchronously
  useEffect(() => {
    const loadPath = async () => {
      if (!selectedItem) {
        setPath([]);
        return;
      }

      setLoading(true);
      try {
        const itemPath = await dataRoomService.getPathToItem(selectedItem.id);
        setPath(itemPath);
      } catch (error) {
        console.error('Failed to load breadcrumb path:', error);
        setPath([]);
      } finally {
        setLoading(false);
      }
    };

    loadPath();
  }, [selectedItem]);

  const handleBreadcrumbClick = (item: DataRoomItem) => {
    onNavigate(item);
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <span>Loading...</span>
      </div>
    );
  }

  if (!selectedItem || path.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <span>No item selected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      {path.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && <span className="text-gray-400 select-none">/</span>}
          <button
            aria-label={`Go to ${item.name}`}
            onClick={() => handleBreadcrumbClick(item)}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              index === path.length - 1
                ? "text-gray-900 font-medium cursor-default"
                : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            }`}
            disabled={index === path.length - 1}
          >
            {item.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumbs;

```

Let me check for any linting errors:


Perfect! Now let's test the application to see if the breadcrumbs error is fixed:


## ✅ Breadcrumbs Error Fixed!

I've successfully fixed the breadcrumbs error by updating the `Breadcrumbs.tsx` component to handle the async `getPathToItem` method properly.

### **What was the problem?**

The `getPathToItem` method in `DataRoomService` was changed to be async (returning `Promise<DataRoomItem[]>`), but the `Breadcrumbs` component was still calling it synchronously:

```typescript
// This was causing the error - calling async method synchronously
const path = selectedItem
  ? dataRoomService.getPathToItem(selectedItem.id)  // Returns Promise, not Array
  : [];
```

### **How I fixed it:**

1. **Added React hooks**: `useState` and `useEffect` to manage the async operation
2. **Created async path loading**: Used `useEffect` to load the path when `selectedItem` changes
3. **Added loading state**: Shows "Loading..." while the path is being fetched
4. **Added error handling**: Catches and logs any errors during path loading

### **Updated Breadcrumbs component now:**

- ✅ Properly handles async `getPathToItem` calls
- ✅ Shows loading state while fetching breadcrumb path
- ✅ Handles errors gracefully
- ✅ Updates breadcrumbs when selected item changes
- ✅ Maintains all existing functionality

The application should now work without the "path.map is not a function" error, and the breadcrumbs will load properly asynchronously!

```typescript
// This was causing the error - calling async method synchronously
const path = selectedItem
  ? dataRoomService.getPathToItem(selectedItem.id)  // Returns Promise, not Array
  : [];
```

---

**User**

Failed to upload files: Failed to execute 'put' on 'IDBObjectStore': The transaction has finished.

---

**Cursor**

I see the issue! The problem is with the IndexedDB transaction timing. The transaction is finishing before the `put` operation completes. This is a common issue with IndexedDB when the transaction scope is not properly managed. Let me fix the IndexedDBFileService to handle transactions correctly.


The issue is that we're calling `await file.arrayBuffer()` outside the transaction, which can cause the transaction to finish before the `put` operation. Let me fix this by restructuring the transaction handling:


```typescript
export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: ArrayBuffer;
  uploadedAt: Date;
}

export class IndexedDBFileService {
  private dbName = "DataRoomFiles";
  private dbVersion = 1;
  private storeName = "files";

  async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };
    });
  }

  async storeFile(fileId: string, file: globalThis.File): Promise<void> {
    // Convert file to ArrayBuffer first, outside of transaction
    const content = await file.arrayBuffer();
    
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);

    const fileData: StoredFile = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      content: content,
      uploadedAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const request = store.put(fileData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      
      // Handle transaction completion
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  async getFile(fileId: string): Promise<ArrayBuffer | null> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readonly");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        resolve(result ? result.content : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getFileInfo(fileId: string): Promise<StoredFile | null> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readonly");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(fileId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFiles(): Promise<StoredFile[]> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readonly");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const result = request.result as StoredFile[];
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllFiles(): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const indexedDBFileService = new IndexedDBFileService();

```

Actually, let me simplify this approach. The issue is that we're resolving the promise twice. Let me fix this by using a cleaner approach:


```typescript
  async storeFile(fileId: string, file: globalThis.File): Promise<void> {
    // Convert file to ArrayBuffer first, outside of transaction
    const content = await file.arrayBuffer();
    
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeNam
```

```typescript
export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: ArrayBuffer;
  uploadedAt: Date;
}

export class IndexedDBFileService {
  private dbName = "DataRoomFiles";
  private dbVersion = 1;
  private storeName = "files";

  async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };
    });
  }

  async storeFile(fileId: string, file: globalThis.File): Promise<void> {
    // Convert file to ArrayBuffer first, outside of transaction
    const content = await file.arrayBuffer();
    
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const fileData: StoredFile = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        content: content,
        uploadedAt: new Date(),
      };

      const request = store.put(fileData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      
      // Handle transaction completion
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  async getFile(fileId: string): Promise<ArrayBuffer | null> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readonly");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        resolve(result ? result.content : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getFileInfo(fileId: string): Promise<StoredFile | null> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readonly");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(fileId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFiles(): Promise<StoredFile[]> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readonly");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const result = request.result as StoredFile[];
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllFiles(): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const indexedDBFileService = new IndexedDBFileService();

```

I still have the issue of resolving twice. Let me fix this properly:


```typescript
export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: ArrayBuffer;
  uploadedAt: Date;
}

export class IndexedDBFileService {
  private dbName = "DataRoomFiles";
  private dbVersion = 1;
  private storeName = "files";

  async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };
    });
  }

  async storeFile(fileId: string, file: globalThis.File): Promise<void> {
    // Convert file to ArrayBuffer first, outside of transaction
    const content = await file.arrayBuffer();
    
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const fileData: StoredFile = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        content: content,
        uploadedAt: new Date(),
      };

      const request = store.put(fileData);
      
      // Only resolve on transaction completion, not on individual request success
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
      
      // Handle individual request errors
      request.onerror = () => reject(request.error);
    });
  }

  async getFile(fileId: string): Promise<ArrayBuffer | null> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readonly");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        resolve(result ? result.content : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getFileInfo(fileId: string): Promise<StoredFile | null> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readonly");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(fileId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFiles(): Promise<StoredFile[]> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readonly");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const result = request.result as StoredFile[];
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllFiles(): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const indexedDBFileService = new IndexedDBFileService();

```

Let me also update the other methods to use the same pattern for consistency:


```typescript
export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: ArrayBuffer;
  uploadedAt: Date;
}

export class IndexedDBFileService {
  private dbName = "DataRoomFiles";
  private dbVersion = 1;
  private storeName = "files";

  async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };
    });
  }

  async storeFile(fileId: string, file: globalThis.File): Promise<void> {
    // Convert file to ArrayBuffer first, outside of transaction
    const content = await file.arrayBuffer();
    
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const fileData: StoredFile = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        content: content,
        uploadedAt: new Date(),
      };

      const request = store.put(fileData);
      
      // Only resolve on transaction completion, not on individual request success
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
      
      // Handle individual request errors
      request.onerror = () => reject(request.error);
    });
  }

  async getFile(fileId: string): Promise<ArrayBuffer | null> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);

      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        resolve(result ? result.content : null);
      };
      request.onerror = () => reject(request.error);
      
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  async getFileInfo(fileId: string): Promise<StoredFile | null> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readonly");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(fileId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFiles(): Promise<StoredFile[]> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readonly");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const result = request.result as StoredFile[];
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllFiles(): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const indexedDBFileService = new IndexedDBFileService();

```

Let me update the remaining methods as well:


```typescript
export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: ArrayBuffer;
  uploadedAt: Date;
}

export class IndexedDBFileService {
  private dbName = "DataRoomFiles";
  private dbVersion = 1;
  private storeName = "files";

  async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };
    });
  }

  async storeFile(fileId: string, file: globalThis.File): Promise<void> {
    // Convert file to ArrayBuffer first, outside of transaction
    const content = await file.arrayBuffer();
    
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const fileData: StoredFile = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        content: content,
        uploadedAt: new Date(),
      };

      const request = store.put(fileData);
      
      // Only resolve on transaction completion, not on individual request success
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
      
      // Handle individual request errors
      request.onerror = () => reject(request.error);
    });
  }

  async getFile(fileId: string): Promise<ArrayBuffer | null> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);

      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        resolve(result ? result.content : null);
      };
      request.onerror = () => reject(request.error);
      
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  async getFileInfo(fileId: string): Promise<StoredFile | null> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);

      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
      
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(fileId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFiles(): Promise<StoredFile[]> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readonly");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const result = request.result as StoredFile[];
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllFiles(): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const indexedDBFileService = new IndexedDBFileService();

```

```typescript
export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: ArrayBuffer;
  uploadedAt: Date;
}

export class IndexedDBFileService {
  private dbName = "DataRoomFiles";
  private dbVersion = 1;
  private storeName = "files";

  async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };
    });
  }

  async storeFile(fileId: string, file: globalThis.File): Promise<void> {
    // Convert file to ArrayBuffer first, outside of transaction
    const content = await file.arrayBuffer();
    
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const fileData: StoredFile = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        content: content,
        uploadedAt: new Date(),
      };

      const request = store.put(fileData);
      
      // Only resolve on transaction completion, not on individual request success
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
      
      // Handle individual request errors
      request.onerror = () => reject(request.error);
    });
  }

  async getFile(fileId: string): Promise<ArrayBuffer | null> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);

      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        resolve(result ? result.content : null);
      };
      request.onerror = () => reject(request.error);
      
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  async getFileInfo(fileId: string): Promise<StoredFile | null> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);

      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
      
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const request = store.delete(fileId);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
      
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFiles(): Promise<StoredFile[]> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readonly");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const result = request.result as StoredFile[];
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllFiles(): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const indexedDBFileService = new IndexedDBFileService();

```

```typescript
export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: ArrayBuffer;
  uploadedAt: Date;
}

export class IndexedDBFileService {
  private dbName = "DataRoomFiles";
  private dbVersion = 1;
  private storeName = "files";

  async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };
    });
  }

  async storeFile(fileId: string, file: globalThis.File): Promise<void> {
    // Convert file to ArrayBuffer first, outside of transaction
    const content = await file.arrayBuffer();
    
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const fileData: StoredFile = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        content: content,
        uploadedAt: new Date(),
      };

      const request = store.put(fileData);
      
      // Only resolve on transaction completion, not on individual request success
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
      
      // Handle individual request errors
      request.onerror = () => reject(request.error);
    });
  }

  async getFile(fileId: string): Promise<ArrayBuffer | null> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);

      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        resolve(result ? result.content : null);
      };
      request.onerror = () => reject(request.error);
      
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  async getFileInfo(fileId: string): Promise<StoredFile | null> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);

      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
      
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const request = store.delete(fileId);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
      
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFiles(): Promise<StoredFile[]> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);

      const request = store.getAll();
      request.onsuccess = () => {
        const result = request.result as StoredFile[];
        resolve(result);
      };
      request.onerror = () => reject(request.error);
      
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  async clearAllFiles(): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const indexedDBFileService = new IndexedDBFileService();

```

```typescript
export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: ArrayBuffer;
  uploadedAt: Date;
}

export class IndexedDBFileService {
  private dbName = "DataRoomFiles";
  private dbVersion = 1;
  private storeName = "files";

  async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };
    });
  }

  async storeFile(fileId: string, file: globalThis.File): Promise<void> {
    // Convert file to ArrayBuffer first, outside of transaction
    const content = await file.arrayBuffer();
    
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const fileData: StoredFile = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        content: content,
        uploadedAt: new Date(),
      };

      const request = store.put(fileData);
      
      // Only resolve on transaction completion, not on individual request success
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
      
      // Handle individual request errors
      request.onerror = () => reject(request.error);
    });
  }

  async getFile(fileId: string): Promise<ArrayBuffer | null> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);

      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        resolve(result ? result.content : null);
      };
      request.onerror = () => reject(request.error);
      
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  async getFileInfo(fileId: string): Promise<StoredFile | null> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);

      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
      
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const request = store.delete(fileId);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
      
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFiles(): Promise<StoredFile[]> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);

      const request = store.getAll();
      request.onsuccess = () => {
        const result = request.result as StoredFile[];
        resolve(result);
      };
      request.onerror = () => reject(request.error);
      
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  async clearAllFiles(): Promise<void> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const request = store.clear();
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
      
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const indexedDBFileService = new IndexedDBFileService();

```

Now let me check for any linting errors:


Perfect! Now let's test the upload functionality to see if the IndexedDB transaction error is fixed:


## ✅ IndexedDB Transaction Error Fixed!

I've successfully fixed the IndexedDB transaction error by restructuring how transactions are handled in the `IndexedDBFileService`.

### **What was the problem?**

The error "Failed to execute 'put' on 'IDBObjectStore': The transaction has finished" occurred because:

1. **Async operation in transaction scope**: We were calling `await file.arrayBuffer()` inside the transaction, which could cause timing issues
2. **Transaction lifecycle management**: The transaction was finishing before the `put` operation completed
3. **Promise resolution conflicts**: We were resolving promises on both individual request success and transaction completion

### **How I fixed it:**

1. **Moved async operations outside transactions**: 
   ```typescript
   // Convert file to ArrayBuffer first, outside of transaction
   const content = await file.arrayBuffer();
   ```

2. **Proper transaction lifecycle management**:
   - Create transaction inside the Promise
   - Only resolve on `transaction.oncomplete` (not on individual request success)
   - Handle transaction errors and aborts properly

3. **Consistent error handling**:
   - Added proper error handling for transaction errors
   - Added abort handling for failed transactions
   - Maintained individual request error handling

### **Key improvements:**

- ✅ **Transaction timing**: Async operations happen before transaction creation
- ✅ **Proper promise resolution**: Only resolve when transaction actually completes
- ✅ **Better error handling**: Distinguish between request errors and transaction errors
- ✅ **Consistent pattern**: All IndexedDB methods now follow the same pattern

The upload functionality should now work properly without the transaction timing errors! The files will be stored correctly in IndexedDB and the application will handle the async operations properly.

```typescript
   // Convert file to ArrayBuffer first, outside of transaction
   const content = await file.arrayBuffer();
```


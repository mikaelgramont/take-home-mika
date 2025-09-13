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
    if (!data) {
      // Populate with sample data if no data exists
      // This is only to save us time in the development process, you wouldn't run this in prod.
      await this.populateDataRoom();
      const populatedData = localStorage.getItem(this.STORAGE_KEY);
      if (!populatedData) return null;

      const parsed = JSON.parse(populatedData);
      this.convertDatesToObjects(parsed);
      return parsed;
    }

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

  // Helper to create mock PDF content with title
  private createMockPdfContent(title: string): ArrayBuffer {
    // Create a more realistic PDF with actual content
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
  /Font <<
    /F1 4 0 R
  >>
>>
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

5 0 obj
<<
/Length 200
>>
stream
BT
/F1 24 Tf
100 700 Td
(${title}) Tj
0 -50 Td
/F1 12 Tf
(This is a sample document for the ACME Data Room.) Tj
0 -20 Td
(Generated on: ${new Date().toLocaleDateString()}) Tj
0 -40 Td
(This document contains confidential information) Tj
0 -20 Td
(and is intended for due diligence purposes only.) Tj
0 -40 Td
(Please review carefully and contact the team) Tj
0 -20 Td
(with any questions or concerns.) Tj
ET
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000250 00000 n 
0000000320 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
580
%%EOF`;

    const encoder = new TextEncoder();
    return encoder.encode(pdfContent).buffer;
  }

  // Helper to populate DataRoom with sample data
  private async populateDataRoom(): Promise<void> {
    try {
      // Clear existing data
      localStorage.removeItem(this.STORAGE_KEY);
      await indexedDBFileService.clearAllFiles();

      const now = new Date();
      const baseTime = now.getTime();

      // Create root folder
      const rootFolder: Folder = {
        id: this.generateId(),
        name: "ACME",
        type: "folder",
        createdAt: new Date(baseTime - 86400000), // 1 day ago
        updatedAt: now,
        parentId: null,
        children: [],
      };

      // Create sample folders
      const financialFolder: Folder = {
        id: this.generateId(),
        name: "Financial Documents",
        type: "folder",
        createdAt: new Date(baseTime - 86400000),
        updatedAt: new Date(baseTime - 3600000), // 1 hour ago
        parentId: rootFolder.id,
        children: [],
      };

      const legalFolder: Folder = {
        id: this.generateId(),
        name: "Legal Documents",
        type: "folder",
        createdAt: new Date(baseTime - 86400000),
        updatedAt: new Date(baseTime - 7200000), // 2 hours ago
        parentId: rootFolder.id,
        children: [],
      };

      const contractsFolder: Folder = {
        id: this.generateId(),
        name: "Contracts",
        type: "folder",
        createdAt: new Date(baseTime - 43200000), // 12 hours ago
        updatedAt: new Date(baseTime - 1800000), // 30 minutes ago
        parentId: legalFolder.id,
        children: [],
      };

      const dueDiligenceFolder: Folder = {
        id: this.generateId(),
        name: "Due Diligence",
        type: "folder",
        createdAt: new Date(baseTime - 43200000),
        updatedAt: new Date(baseTime - 900000), // 15 minutes ago
        parentId: rootFolder.id,
        children: [],
      };

      // Create sample files with mock content
      const sampleFilesData = [
        {
          name: "Q3_2024_Financial_Statements.pdf",
          parentId: financialFolder.id,
          size: 2048576, // 2MB
          createdAt: new Date(baseTime - 86400000),
          updatedAt: new Date(baseTime - 3600000),
        },
        {
          name: "Audit_Report_2024.pdf",
          parentId: financialFolder.id,
          size: 1536000, // 1.5MB
          createdAt: new Date(baseTime - 172800000), // 2 days ago
          updatedAt: new Date(baseTime - 3600000),
        },
        {
          name: "Balance_Sheet_2024.pdf",
          parentId: financialFolder.id,
          size: 1024000, // 1MB
          createdAt: new Date(baseTime - 259200000), // 3 days ago
          updatedAt: new Date(baseTime - 3600000),
        },
        {
          name: "Acquisition_Agreement.pdf",
          parentId: contractsFolder.id,
          size: 5120000, // 5MB
          createdAt: new Date(baseTime - 604800000), // 1 week ago
          updatedAt: new Date(baseTime - 7200000),
        },
        {
          name: "Non_Disclosure_Agreement.pdf",
          parentId: contractsFolder.id,
          size: 768000, // 768KB
          createdAt: new Date(baseTime - 1209600000), // 2 weeks ago
          updatedAt: new Date(baseTime - 7200000),
        },
        {
          name: "Employee_Agreements.pdf",
          parentId: contractsFolder.id,
          size: 2560000, // 2.5MB
          createdAt: new Date(baseTime - 1209600000),
          updatedAt: new Date(baseTime - 7200000),
        },
        {
          name: "Due_Diligence_Checklist.pdf",
          parentId: dueDiligenceFolder.id,
          size: 512000, // 512KB
          createdAt: new Date(baseTime - 43200000),
          updatedAt: new Date(baseTime - 900000),
        },
        {
          name: "Risk_Assessment_Report.pdf",
          parentId: dueDiligenceFolder.id,
          size: 3072000, // 3MB
          createdAt: new Date(baseTime - 43200000),
          updatedAt: new Date(baseTime - 900000),
        },
        {
          name: "Market_Analysis.pdf",
          parentId: rootFolder.id,
          size: 4096000, // 4MB
          createdAt: new Date(baseTime - 259200000), // 3 days ago
          updatedAt: new Date(baseTime - 1800000), // 30 minutes ago
        },
        {
          name: "Executive_Summary.pdf",
          parentId: rootFolder.id,
          size: 1280000, // 1.28MB
          createdAt: new Date(baseTime - 86400000),
          updatedAt: new Date(baseTime - 1800000),
        },
      ];

      // Create files and store them in IndexedDB
      const sampleFiles: File[] = [];
      for (const fileData of sampleFilesData) {
        const fileId = this.generateId();
        const fileItemId = this.generateId();

        // Generate PDF content with the file name as title
        const pdfContent = this.createMockPdfContent(
          fileData.name.replace(".pdf", "")
        );

        // Store file content in IndexedDB
        await indexedDBFileService.storeFileFromBuffer(
          fileId,
          fileData.name,
          "application/pdf",
          fileData.size,
          pdfContent
        );

        // Create file metadata
        const fileItem: File = {
          id: fileItemId,
          name: fileData.name,
          type: "file",
          createdAt: fileData.createdAt,
          updatedAt: fileData.updatedAt,
          parentId: fileData.parentId,
          fileType: "pdf",
          size: fileData.size,
          fileId: fileId, // Reference to IndexedDB
        };

        sampleFiles.push(fileItem);
      }

      // Add files to their respective folders
      financialFolder.children = sampleFiles.filter(
        (file) => file.parentId === financialFolder.id
      );
      contractsFolder.children = sampleFiles.filter(
        (file) => file.parentId === contractsFolder.id
      );
      dueDiligenceFolder.children = sampleFiles.filter(
        (file) => file.parentId === dueDiligenceFolder.id
      );

      // Add folders to their parents
      legalFolder.children = [contractsFolder];
      rootFolder.children = [
        financialFolder,
        legalFolder,
        dueDiligenceFolder,
        ...sampleFiles.filter((file) => file.parentId === rootFolder.id),
      ];

      // Calculate total files and size
      const stats = this.calculateFolderStats(rootFolder);

      // Create the main DataRoom object
      const dataRoom: DataRoom = {
        id: this.generateId(),
        createdAt: new Date(baseTime - 86400000),
        updatedAt: now,
        rootFolder: rootFolder,
        totalFiles: stats.totalFiles,
        totalSize: stats.totalSize,
      };

      // Store in localStorage
      this.setDataRoom(dataRoom);
    } catch (error) {
      console.error("❌ Error populating DataRoom:", error);
      throw error;
    }
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

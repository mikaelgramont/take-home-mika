# Create service class for CRUD operations
_Exported on 9/11/2025 at 20:44:06 GMT+2 from Cursor (1.5.11)_

---

**User**

I want to create a service class to perform the CRUD operations in the app. It would normally go to the network but for now only goes to  local storage. Perhaps later it will save files to some storage bucket but we'll implement that when the time comes.

---

**Cursor**

I'll help you create a service class for CRUD operations that uses local storage. Let me first examine the current project structure and types to understand what we're working with.


Now I'll create a comprehensive service class for CRUD operations. Based on the types, I can see we have a well-structured data model with DataRoom, Folder, and File entities. Let me create a service that handles all the CRUD operations using local storage.


```typescript
import { DataRoom, DataRoomSummary, DataRoomItem, File, Folder, BaseEntity } from '../types';

// Service interface for future network implementation
export interface IDataRoomService {
  // DataRoom operations
  createDataRoom(name: string): Promise<DataRoom>;
  getDataRoom(id: string): Promise<DataRoom | null>;
  getAllDataRooms(): Promise<DataRoomSummary[]>;
  updateDataRoom(id: string, name: string): Promise<DataRoom>;
  deleteDataRoom(id: string): Promise<void>;

  // Folder operations
  createFolder(dataRoomId: string, name: string, parentId?: string | null): Promise<Folder>;
  getFolder(dataRoomId: string, folderId: string): Promise<Folder | null>;
  updateFolderName(dataRoomId: string, folderId: string, name: string): Promise<Folder>;
  deleteFolder(dataRoomId: string, folderId: string): Promise<void>;

  // File operations
  uploadFile(dataRoomId: string, file: File, parentId?: string | null): Promise<File>;
  getFile(dataRoomId: string, fileId: string): Promise<File | null>;
  updateFileName(dataRoomId: string, fileId: string, name: string): Promise<File>;
  deleteFile(dataRoomId: string, fileId: string): Promise<void>;

  // Utility operations
  getFolderContents(dataRoomId: string, folderId?: string | null): Promise<DataRoomItem[]>;
  searchItems(dataRoomId: string, query: string): Promise<DataRoomItem[]>;
}

// Local storage implementation
export class LocalStorageDataRoomService implements IDataRoomService {
  private readonly STORAGE_KEY = 'dataroom_data';
  private readonly DATA_ROOMS_KEY = 'datarooms';

  // Helper methods for local storage
  private getStorageData(): Record<string, DataRoom> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  private setStorageData(data: Record<string, DataRoom>): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private getDataRoomSummaries(): DataRoomSummary[] {
    const summaries = localStorage.getItem(this.DATA_ROOMS_KEY);
    return summaries ? JSON.parse(summaries) : [];
  }

  private setDataRoomSummaries(summaries: DataRoomSummary[]): void {
    localStorage.setItem(this.DATA_ROOMS_KEY, JSON.stringify(summaries));
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
      if (item.type === 'folder') {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to find parent folder by ID
  private findParentFolder(items: DataRoomItem[], targetId: string): Folder | null {
    for (const item of items) {
      if (item.type === 'folder') {
        if (item.children.some(child => child.id === targetId)) {
          return item;
        }
        const found = this.findParentFolder(item.children, targetId);
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
      if (items[i].type === 'folder') {
        if (this.removeFromParent(items[i].children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to update item in nested structure
  private updateItemInNested(items: DataRoomItem[], targetId: string, updates: Partial<BaseEntity>): boolean {
    for (const item of items) {
      if (item.id === targetId) {
        Object.assign(item, updates);
        return true;
      }
      if (item.type === 'folder') {
        if (this.updateItemInNested(item.children, targetId, updates)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper to calculate folder statistics
  private calculateFolderStats(folder: Folder): { totalFiles: number; totalSize: number } {
    let totalFiles = 0;
    let totalSize = 0;

    for (const child of folder.children) {
      if (child.type === 'file') {
        totalFiles++;
        totalSize += child.size;
      } else {
        const stats = this.calculateFolderStats(child);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }

    return { totalFiles, totalSize };
  }

  // DataRoom operations
  async createDataRoom(name: string): Promise<DataRoom> {
    const id = this.generateId();
    const now = new Date();

    const rootFolder: Folder = {
      id: this.generateId(),
      name: 'Root',
      type: 'folder',
      createdAt: now,
      updatedAt: now,
      parentId: null,
      children: []
    };

    const dataRoom: DataRoom = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      rootFolder,
      totalFiles: 0,
      totalSize: 0
    };

    // Save to storage
    const data = this.getStorageData();
    data[id] = dataRoom;
    this.setStorageData(data);

    // Update summaries
    const summaries = this.getDataRoomSummaries();
    summaries.push({
      id,
      name,
      createdAt: now,
      updatedAt: now,
      totalFiles: 0,
      totalSize: 0
    });
    this.setDataRoomSummaries(summaries);

    return dataRoom;
  }

  async getDataRoom(id: string): Promise<DataRoom | null> {
    const data = this.getStorageData();
    return data[id] || null;
  }

  async getAllDataRooms(): Promise<DataRoomSummary[]> {
    return this.getDataRoomSummaries();
  }

  async updateDataRoom(id: string, name: string): Promise<DataRoom> {
    const data = this.getStorageData();
    const dataRoom = data[id];
    
    if (!dataRoom) {
      throw new Error(`DataRoom with id ${id} not found`);
    }

    dataRoom.name = name;
    dataRoom.updatedAt = new Date();
    this.setStorageData(data);

    // Update summaries
    const summaries = this.getDataRoomSummaries();
    const summaryIndex = summaries.findIndex(s => s.id === id);
    if (summaryIndex !== -1) {
      summaries[summaryIndex].name = name;
      summaries[summaryIndex].updatedAt = dataRoom.updatedAt;
      this.setDataRoomSummaries(summaries);
    }

    return dataRoom;
  }

  async deleteDataRoom(id: string): Promise<void> {
    const data = this.getStorageData();
    if (!data[id]) {
      throw new Error(`DataRoom with id ${id} not found`);
    }

    delete data[id];
    this.setStorageData(data);

    // Update summaries
    const summaries = this.getDataRoomSummaries();
    const filteredSummaries = summaries.filter(s => s.id !== id);
    this.setDataRoomSummaries(filteredSummaries);
  }

  // Folder operations
  async createFolder(dataRoomId: string, name: string, parentId?: string | null): Promise<Folder> {
    const data = this.getStorageData();
    const dataRoom = data[dataRoomId];
    
    if (!dataRoom) {
      throw new Error(`DataRoom with id ${dataRoomId} not found`);
    }

    const now = new Date();
    const folder: Folder = {
      id: this.generateId(),
      name,
      type: 'folder',
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      children: []
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById([dataRoom.rootFolder], parentId) as Folder;
      if (!parentFolder || parentFolder.type !== 'folder') {
        throw new Error(`Parent folder with id ${parentId} not found`);
      }
      parentFolder.children.push(folder);
      parentFolder.updatedAt = now;
    } else {
      dataRoom.rootFolder.children.push(folder);
      dataRoom.rootFolder.updatedAt = now;
    }

    dataRoom.updatedAt = now;
    this.setStorageData(data);

    return folder;
  }

  async getFolder(dataRoomId: string, folderId: string): Promise<Folder | null> {
    const data = this.getStorageData();
    const dataRoom = data[dataRoomId];
    
    if (!dataRoom) {
      return null;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId);
    return folder && folder.type === 'folder' ? folder as Folder : null;
  }

  async updateFolderName(dataRoomId: string, folderId: string, name: string): Promise<Folder> {
    const data = this.getStorageData();
    const dataRoom = data[dataRoomId];
    
    if (!dataRoom) {
      throw new Error(`DataRoom with id ${dataRoomId} not found`);
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== 'folder') {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    folder.name = name;
    folder.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setStorageData(data);

    return folder;
  }

  async deleteFolder(dataRoomId: string, folderId: string): Promise<void> {
    const data = this.getStorageData();
    const dataRoom = data[dataRoomId];
    
    if (!dataRoom) {
      throw new Error(`DataRoom with id ${dataRoomId} not found`);
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== 'folder') {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, folderId);
    
    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setStorageData(data);
  }

  // File operations
  async uploadFile(dataRoomId: string, file: File, parentId?: string | null): Promise<File> {
    const data = this.getStorageData();
    const dataRoom = data[dataRoomId];
    
    if (!dataRoom) {
      throw new Error(`DataRoom with id ${dataRoomId} not found`);
    }

    const now = new Date();
    const fileItem: File = {
      id: this.generateId(),
      name: file.name,
      type: 'file',
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      fileType: 'pdf', // For now, only PDFs are supported
      size: file.size,
      content: await file.arrayBuffer()
    };

    // Add to parent folder or root
    if (parentId) {
      const parentFolder = this.findItemById([dataRoom.rootFolder], parentId) as Folder;
      if (!parentFolder || parentFolder.type !== 'folder') {
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

    this.setStorageData(data);

    return fileItem;
  }

  async getFile(dataRoomId: string, fileId: string): Promise<File | null> {
    const data = this.getStorageData();
    const dataRoom = data[dataRoomId];
    
    if (!dataRoom) {
      return null;
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId);
    return file && file.type === 'file' ? file as File : null;
  }

  async updateFileName(dataRoomId: string, fileId: string, name: string): Promise<File> {
    const data = this.getStorageData();
    const dataRoom = data[dataRoomId];
    
    if (!dataRoom) {
      throw new Error(`DataRoom with id ${dataRoomId} not found`);
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== 'file') {
      throw new Error(`File with id ${fileId} not found`);
    }

    file.name = name;
    file.updatedAt = new Date();
    dataRoom.updatedAt = new Date();
    this.setStorageData(data);

    return file;
  }

  async deleteFile(dataRoomId: string, fileId: string): Promise<void> {
    const data = this.getStorageData();
    const dataRoom = data[dataRoomId];
    
    if (!dataRoom) {
      throw new Error(`DataRoom with id ${dataRoomId} not found`);
    }

    const file = this.findItemById([dataRoom.rootFolder], fileId) as File;
    if (!file || file.type !== 'file') {
      throw new Error(`File with id ${fileId} not found`);
    }

    // Remove from parent
    this.removeFromParent(dataRoom.rootFolder.children, fileId);
    
    // Update statistics
    const stats = this.calculateFolderStats(dataRoom.rootFolder);
    dataRoom.totalFiles = stats.totalFiles;
    dataRoom.totalSize = stats.totalSize;
    dataRoom.updatedAt = new Date();

    this.setStorageData(data);
  }

  // Utility operations
  async getFolderContents(dataRoomId: string, folderId?: string | null): Promise<DataRoomItem[]> {
    const data = this.getStorageData();
    const dataRoom = data[dataRoomId];
    
    if (!dataRoom) {
      throw new Error(`DataRoom with id ${dataRoomId} not found`);
    }

    if (!folderId) {
      return dataRoom.rootFolder.children;
    }

    const folder = this.findItemById([dataRoom.rootFolder], folderId) as Folder;
    if (!folder || folder.type !== 'folder') {
      throw new Error(`Folder with id ${folderId} not found`);
    }

    return folder.children;
  }

  async searchItems(dataRoomId: string, query: string): Promise<DataRoomItem[]> {
    const data = this.getStorageData();
    const dataRoom = data[dataRoomId];
    
    if (!dataRoom) {
      throw new Error(`DataRoom with id ${dataRoomId} not found`);
    }

    const results: DataRoomItem[] = [];
    const searchInFolder = (items: DataRoomItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        if (item.type === 'folder') {
          searchInFolder(item.children);
        }
      }
    };

    searchInFolder(dataRoom.rootFolder.children);
    return results;
  }
}

// Export singleton instance
export const dataRoomService = new LocalStorageDataRoomService();
```

Now let me check for any linting errors and create a service index file for easier imports:


```typescript
export { 
  IDataRoomService, 
  LocalStorageDataRoomService, 
  dataRoomService 
} from './DataRoomService';
```

Perfect! I've created a comprehensive service class for your Data Room application. Here's what I've built:

## DataRoomService Features

### **Service Architecture**
- **`IDataRoomService`** interface for future network implementation
- **`LocalStorageDataRoomService`** class implementing local storage persistence
- **Singleton instance** (`dataRoomService`) ready to use

### **CRUD Operations**

#### **DataRoom Operations**
- `createDataRoom(name)` - Create new data rooms
- `getDataRoom(id)` - Retrieve specific data room
- `getAllDataRooms()` - Get all data room summaries
- `updateDataRoom(id, name)` - Update data room name
- `deleteDataRoom(id)` - Delete data room and all contents

#### **Folder Operations**
- `createFolder(dataRoomId, name, parentId?)` - Create folders with optional nesting
- `getFolder(dataRoomId, folderId)` - Retrieve specific folder
- `updateFolderName(dataRoomId, folderId, name)` - Rename folders
- `deleteFolder(dataRoomId, folderId)` - Delete folder and all nested contents

#### **File Operations**
- `uploadFile(dataRoomId, file, parentId?)` - Upload files (currently PDF only)
- `getFile(dataRoomId, fileId)` - Retrieve specific file
- `updateFileName(dataRoomId, fileId, name)` - Rename files
- `deleteFile(dataRoomId, fileId)` - Delete files

#### **Utility Operations**
- `getFolderContents(dataRoomId, folderId?)` - List folder contents
- `searchItems(dataRoomId, query)` - Search across all items

### **Key Features**

1. **Local Storage Persistence** - All data persists in browser localStorage
2. **Nested Structure Support** - Handles complex folder hierarchies
3. **Automatic Statistics** - Tracks total files and size across the data room
4. **Error Handling** - Comprehensive validation and error messages
5. **Type Safety** - Full TypeScript support with your existing types
6. **Future-Ready** - Interface allows easy swap to network implementation

### **Usage Example**

```typescript
import { dataRoomService } from './services';

// Create a new data room
const dataRoom = await dataRoomService.createDataRoom('My Data Room');

// Create a folder
const folder = await dataRoomService.createFolder(dataRoom.id, 'Documents');

// Upload a file
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const uploadedFile = await dataRoomService.uploadFile(dataRoom.id, file, folder.id);

// Get folder contents
const contents = await dataRoomService.getFolderContents(dataRoom.id, folder.id);
```

The service is designed to be easily extensible - when you're ready to implement network storage, you can create a new class that implements `IDataRoomService` and swap it in without changing any of your React components.

```typescript
import { dataRoomService } from './services';

// Create a new data room
const dataRoom = await dataRoomService.createDataRoom('My Data Room');

// Create a folder
const folder = await dataRoomService.createFolder(dataRoom.id, 'Documents');

// Upload a file
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const uploadedFile = await dataRoomService.uploadFile(dataRoom.id, file, folder.id);

// Get folder contents
const contents = await dataRoomService.getFolderContents(dataRoom.id, folder.id);
```


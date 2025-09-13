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
      transaction.onabort = () => reject(new Error("Transaction aborted"));

      // Handle individual request errors
      request.onerror = () => reject(request.error);
    });
  }

  async storeFileFromBuffer(
    fileId: string,
    name: string,
    type: string,
    size: number,
    content: ArrayBuffer
  ): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const fileData: StoredFile = {
        id: fileId,
        name: name,
        type: type,
        size: size,
        content: content,
        uploadedAt: new Date(),
      };

      const request = store.put(fileData);

      // Only resolve on transaction completion, not on individual request success
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error("Transaction aborted"));

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
      transaction.onabort = () => reject(new Error("Transaction aborted"));
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
      transaction.onabort = () => reject(new Error("Transaction aborted"));
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
      transaction.onabort = () => reject(new Error("Transaction aborted"));

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
      transaction.onabort = () => reject(new Error("Transaction aborted"));
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
      transaction.onabort = () => reject(new Error("Transaction aborted"));

      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const indexedDBFileService = new IndexedDBFileService();

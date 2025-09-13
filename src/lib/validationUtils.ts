import type { DataRoomItem, Folder } from "../types/index.ts";

// Maximum allowed depth for folder nesting
export const MAX_FOLDER_DEPTH = 32;

// Maximum allowed name length
export const MAX_NAME_LENGTH = 255;

/**
 * Validates if a name contains only ASCII characters
 */
export function isAsciiOnly(name: string): boolean {
  // eslint-disable-next-line no-control-regex
  return /^[\x00-\x7F]*$/.test(name);
}

/**
 * Validates name length
 */
export function validateNameLength(name: string): string | null {
  if (name.length > MAX_NAME_LENGTH) {
    return `Name too long. Maximum length is ${MAX_NAME_LENGTH} characters.`;
  }
  return null;
}

/**
 * Validates if name contains only ASCII characters
 */
export function validateAsciiOnly(name: string): string | null {
  if (!isAsciiOnly(name)) {
    return "Name can only contain ASCII characters (letters, numbers, and basic symbols).";
  }
  return null;
}

/**
 * Validates if name is not empty after trimming
 */
export function validateNonEmpty(name: string): string | null {
  if (!name.trim()) {
    return "Name cannot be empty.";
  }
  return null;
}

/**
 * Checks if a name already exists in a list of items (case insensitive)
 */
export function checkDuplicateName(
  name: string,
  existingItems: DataRoomItem[],
  excludeId?: string
): boolean {
  return existingItems.some(
    (item) =>
      item.id !== excludeId && item.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Validates file name with all checks
 */
export function validateFileName(
  name: string,
  existingItems: DataRoomItem[] = [],
  excludeId?: string,
  originalName?: string
): string[] {
  const errors: string[] = [];

  // Check if empty
  const emptyError = validateNonEmpty(name);
  if (emptyError) {
    errors.push(emptyError);
    return errors; // Return early if empty
  }

  // Check length
  const lengthError = validateNameLength(name);
  if (lengthError) {
    errors.push(lengthError);
  }

  // Check ASCII only
  const asciiError = validateAsciiOnly(name);
  if (asciiError) {
    errors.push(asciiError);
  }

  // Check for extension changes (if original name provided)
  if (originalName) {
    const extensionError = validateFileExtensionUnchanged(name, originalName);
    if (extensionError) {
      errors.push(extensionError);
    }
  }

  // Check for duplicates
  if (checkDuplicateName(name, existingItems, excludeId)) {
    errors.push(
      "A file or folder with this name already exists in this location."
    );
  }

  return errors;
}

/**
 * Validates folder name with all checks
 */
export function validateFolderName(
  name: string,
  existingItems: DataRoomItem[] = [],
  excludeId?: string
): string[] {
  const errors: string[] = [];

  // Check if empty
  const emptyError = validateNonEmpty(name);
  if (emptyError) {
    errors.push(emptyError);
    return errors; // Return early if empty
  }

  // Check length
  const lengthError = validateNameLength(name);
  if (lengthError) {
    errors.push(lengthError);
  }

  // Check ASCII only
  const asciiError = validateAsciiOnly(name);
  if (asciiError) {
    errors.push(asciiError);
  }

  // Check for duplicates
  if (checkDuplicateName(name, existingItems, excludeId)) {
    errors.push(
      "A file or folder with this name already exists in this location."
    );
  }

  return errors;
}

/**
 * Calculates the depth of a folder in the hierarchy
 */
export function calculateFolderDepth(
  folderId: string,
  rootFolder: Folder,
  currentDepth: number = 0
): number {
  if (currentDepth > MAX_FOLDER_DEPTH) {
    return currentDepth; // Return current depth if we've exceeded max
  }

  if (folderId === rootFolder.id) {
    return currentDepth;
  }

  // Search through all folders recursively
  const searchInFolder = (items: DataRoomItem[], depth: number): number => {
    for (const item of items) {
      if (item.id === folderId) {
        return depth;
      }
      if (item.type === "folder") {
        const foundDepth = searchInFolder((item as Folder).children, depth + 1);
        if (foundDepth !== -1) {
          return foundDepth;
        }
      }
    }
    return -1;
  };

  return searchInFolder(rootFolder.children, 1);
}

/**
 * Validates if creating a folder at the given parent would exceed max depth
 */
export function validateFolderDepth(
  parentId: string | null,
  rootFolder: Folder
): string | null {
  if (!parentId) {
    return null; // Root level is always valid
  }

  const currentDepth = calculateFolderDepth(parentId, rootFolder);
  if (currentDepth >= MAX_FOLDER_DEPTH) {
    return `Maximum folder depth of ${MAX_FOLDER_DEPTH} levels exceeded.`;
  }

  return null;
}

/**
 * Validates if a file is empty (0 bytes)
 */
export function validateFileNotEmpty(file: globalThis.File): string | null {
  if (file.size === 0) {
    return "Empty files are not allowed.";
  }
  return null;
}

/**
 * Validates that file extension hasn't changed during rename
 */
export function validateFileExtensionUnchanged(
  newName: string,
  originalName: string
): string | null {
  const getExtension = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf(".");
    return lastDotIndex === -1
      ? ""
      : filename.substring(lastDotIndex).toLowerCase();
  };

  const originalExt = getExtension(originalName);
  const newExt = getExtension(newName);

  if (originalExt !== newExt) {
    return "File extension cannot be changed. Please keep the same extension.";
  }

  return null;
}

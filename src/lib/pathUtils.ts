import type { DataRoomItem, Folder } from "@/types";

/**
 * Converts a path string (e.g., "folder1/folder2/file.pdf") to an array of path segments
 * Handles URL decoding for special characters like spaces (%20)
 * Strips file extensions from URLs to avoid Surge static file handling
 */
export function parsePath(path: string): string[] {
  if (!path || path === "/") {
    return [];
  }
  return path
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      const decoded = decodeURIComponent(segment);
      // Strip file extensions for URL routing (but keep them in data structure)
      return stripFileExtension(decoded);
    });
}

/**
 * Strips file extension from a filename for URL routing
 * This prevents Surge from treating URLs as static file requests
 */
function stripFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex > 0) {
    return filename.substring(0, lastDotIndex);
  }
  return filename;
}

/**
 * Converts an array of path segments to a path string
 * Handles URL encoding for special characters like spaces
 */
export function buildPath(segments: string[]): string {
  if (segments.length === 0) {
    return "/";
  }
  return "/" + segments.map((segment) => encodeURIComponent(segment)).join("/");
}

/**
 * Finds an item by its path in the data room structure
 * Handles file extensions by matching against the base name
 */
export function findItemByPath(
  rootFolder: Folder,
  path: string
): DataRoomItem | null {
  const segments = parsePath(path);

  if (segments.length === 0) {
    return rootFolder;
  }

  let current: DataRoomItem = rootFolder;

  for (const segment of segments) {
    if (current.type !== "folder") {
      return null; // Can't navigate into a file
    }

    const folder = current as Folder;
    // Try exact match first, then try matching without file extension
    let found = folder.children.find((child) => child.name === segment);

    if (!found) {
      // If no exact match, try to find by base name (without extension)
      found = folder.children.find((child) => {
        const childBaseName = stripFileExtension(child.name);
        return childBaseName === segment;
      });
    }

    if (!found) {
      return null; // Segment not found
    }

    current = found;
  }

  return current;
}

/**
 * Gets the path string for a given item
 * Strips file extensions from URLs to avoid Surge static file handling
 */
export function getItemPath(item: DataRoomItem, rootFolder: Folder): string {
  if (item.id === rootFolder.id) {
    return "/";
  }

  const path: string[] = [];
  let current: DataRoomItem | null = item;

  // Build path by traversing up to root
  while (current && current.id !== rootFolder.id) {
    // Strip file extension for URL routing
    const nameForUrl = stripFileExtension(current.name);
    path.unshift(nameForUrl);

    // Find parent
    if (current.parentId) {
      current = findItemById(rootFolder, current.parentId);
    } else {
      current = null;
    }
  }

  return buildPath(path);
}

/**
 * Helper function to find an item by ID in the folder structure
 */
export function findItemById(
  rootFolder: Folder,
  id: string
): DataRoomItem | null {
  if (rootFolder.id === id) {
    return rootFolder;
  }

  for (const child of rootFolder.children) {
    if (child.id === id) {
      return child;
    }

    if (child.type === "folder") {
      const found = findItemById(child as Folder, id);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/**
 * Finds the parent folder of a given item
 */
export function findParentFolder(
  item: DataRoomItem,
  rootFolder: Folder
): Folder | null {
  if (item.id === rootFolder.id) {
    return null; // Root folder has no parent
  }

  if (!item.parentId) {
    return null; // Item has no parent
  }

  const parent = findItemById(rootFolder, item.parentId);
  return parent && parent.type === "folder" ? (parent as Folder) : null;
}

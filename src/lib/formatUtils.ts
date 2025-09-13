import type { Folder, File } from "@/types";
import { SUPPORTED_FILE_TYPES } from "@/types";

/**
 * Formats bytes into a human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Recursively calculates the total size of all files in a folder
 */
export function calculateFolderSize(folder: Folder): number {
  let totalSize = 0;

  for (const child of folder.children) {
    if (child.type === "file") {
      totalSize += child.size;
    } else if (child.type === "folder") {
      totalSize += calculateFolderSize(child);
    }
  }

  return totalSize;
}

/**
 * Counts the number of direct children in a folder
 */
export function countDirectChildren(folder: Folder): number {
  return folder.children.length;
}

/**
 * Gets the file type display name from the file type configuration
 */
export function getFileTypeDisplayName(file: File): string {
  return SUPPORTED_FILE_TYPES[file.fileType].displayName;
}

/**
 * Gets the mime type for a file
 */
export function getFileMimeType(file: File): string {
  return SUPPORTED_FILE_TYPES[file.fileType].mimeType;
}

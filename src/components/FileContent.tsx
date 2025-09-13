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

  useEffect(() => {
    console.error("An error occurred while loading file content:", error);
  }, [error]);

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
        setError(
          err instanceof Error ? err.message : "Failed to load file content"
        );
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

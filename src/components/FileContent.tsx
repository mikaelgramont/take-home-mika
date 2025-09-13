import { useState } from "react";
import type { File } from "@/types";
import {
  formatBytes,
  getFileTypeDisplayName,
  getFileMimeType,
} from "@/lib/formatUtils";
import { Button } from "./ui/button";
import RenameDialog from "./RenameDialog";
import DeleteDialog from "./DeleteDialog";

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
          <Button onClick={handleRename} variant="outline" size="sm">
            Rename
          </Button>
          <Button onClick={handleDelete} variant="destructive" size="sm">
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

import { useState } from "react";
import type { Folder } from "@/types";
import {
  calculateFolderSize,
  countDirectChildren,
  formatBytes,
} from "@/lib/formatUtils";
import { Button } from "./ui/button";
import RenameDialog from "./RenameDialog";
import DeleteDialog from "./DeleteDialog";

interface FolderContentProps {
  folder: Folder;
  onRename: (folderId: string, newName: string) => void;
  onDelete: (folderId: string) => void;
}

export default function FolderContent({
  folder,
  onRename,
  onDelete,
}: FolderContentProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const totalSize = calculateFolderSize(folder);
  const directChildrenCount = countDirectChildren(folder);

  const handleRename = () => {
    setRenameDialogOpen(true);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleRenameConfirm = (newName: string) => {
    onRename(folder.id, newName);
  };

  const handleDeleteConfirm = () => {
    onDelete(folder.id);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Total Size</h3>
          <p className="text-lg font-semibold text-gray-900">
            {formatBytes(totalSize)}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Number of Items</h3>
          <p className="text-lg font-semibold text-gray-900">
            {directChildrenCount}
          </p>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-500">Created</h4>
            <p className="text-gray-900">
              {folder.createdAt.toLocaleDateString()}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-500">Updated</h4>
            <p className="text-gray-900">
              {folder.updatedAt.toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex gap-2">
          <Button onClick={handleRename} variant="outline" size="sm">
            Rename
          </Button>
          <Button onClick={handleDelete} variant="destructive" size="sm">
            Delete
          </Button>
        </div>
      </div>

      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        currentName={folder.name}
        itemType="folder"
        onConfirm={handleRenameConfirm}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={folder.name}
        itemType="folder"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

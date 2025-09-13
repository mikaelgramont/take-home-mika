import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { validateFolderName } from "@/lib/validationUtils";
import type { DataRoomItem } from "@/types";

interface NewFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (folderName: string) => void;
  existingItems?: DataRoomItem[];
}

export default function NewFolderDialog({
  open,
  onOpenChange,
  onConfirm,
  existingItems = [],
}: NewFolderDialogProps) {
  const [folderName, setFolderName] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Reset folder name when dialog opens
  useEffect(() => {
    if (open) {
      setFolderName("");
      setValidationErrors([]);
    }
  }, [open]);

  // Validate folder name as user types
  useEffect(() => {
    if (folderName.trim()) {
      const errors = validateFolderName(folderName, existingItems);
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
    }
  }, [folderName, existingItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim() && validationErrors.length === 0) {
      onConfirm(folderName.trim());
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
          <DialogDescription>
            Enter a name for the new folder.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folder-name" className="text-right">
                Name
              </Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className={`col-span-3 ${
                  validationErrors.length > 0 ? "border-red-500" : ""
                }`}
                placeholder="Folder name"
                autoFocus
              />
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="text-sm text-red-700">
                  {validationErrors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!folderName.trim() || validationErrors.length > 0}
            >
              Create Folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

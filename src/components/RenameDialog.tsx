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
import { validateFileName, validateFolderName } from "@/lib/validationUtils";
import type { DataRoomItem } from "@/types";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  itemType: "file" | "folder";
  onConfirm: (newName: string) => void;
  existingItems?: DataRoomItem[];
  itemId?: string;
}

export default function RenameDialog({
  open,
  onOpenChange,
  currentName,
  itemType,
  onConfirm,
  existingItems = [],
  itemId,
}: RenameDialogProps) {
  const [newName, setNewName] = useState(currentName);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Update newName when currentName changes (when dialog opens)
  useEffect(() => {
    setNewName(currentName);
    setValidationErrors([]);
  }, [currentName]);

  // Validate new name as user types
  useEffect(() => {
    if (newName.trim() && newName.trim() !== currentName) {
      const errors =
        itemType === "file"
          ? validateFileName(newName, existingItems, itemId, currentName)
          : validateFolderName(newName, existingItems, itemId);
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
    }
  }, [newName, currentName, itemType, existingItems, itemId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      newName.trim() &&
      newName.trim() !== currentName &&
      validationErrors.length === 0
    ) {
      onConfirm(newName.trim());
      onOpenChange(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setNewName(currentName); // Reset to current name when closing
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              Rename {itemType === "file" ? "File" : "Folder"}
            </DialogTitle>
            <DialogDescription>
              Enter a new name for the {itemType} "{currentName}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className={`col-span-3 ${
                  validationErrors.length > 0 ? "border-red-500" : ""
                }`}
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !newName.trim() ||
                newName.trim() === currentName ||
                validationErrors.length > 0
              }
            >
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

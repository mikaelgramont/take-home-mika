import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType: "file" | "folder";
  onConfirm: () => void;
}

export default function DeleteDialog({
  open,
  onOpenChange,
  itemName,
  itemType,
  onConfirm,
}: DeleteDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const isFolder = itemType === "folder";
  const title = `Delete ${isFolder ? "Folder" : "File"}`;
  const description = isFolder
    ? `Are you sure you want to delete the folder "${itemName}" and all its contents? This action cannot be undone.`
    : `Are you sure you want to delete the file "${itemName}"? This action cannot be undone.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-destructive">{title}</DialogTitle>
          <DialogDescription>
            <span className="break-all">{description}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

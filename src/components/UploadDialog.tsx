import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SUPPORTED_FILE_TYPES,
  type SupportedFileType,
  type DataRoomItem,
} from "@/types";
import { validateFileName, validateFileNotEmpty } from "@/lib/validationUtils";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[]) => Promise<void>;
  existingItems?: DataRoomItem[];
}

export default function UploadDialog({
  open,
  onOpenChange,
  onUpload,
  existingItems = [],
}: UploadDialogProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog is closed
  useEffect(() => {
    if (!open) {
      setIsDragOver(false);
      setUploading(false);
      setError(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  const getFileTypeFromFile = (
    file: globalThis.File
  ): SupportedFileType | null => {
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) return null;

    // Check if the extension matches any supported file type
    for (const [key, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
      if (config.extension.toLowerCase() === `.${extension}`) {
        return key as SupportedFileType;
      }
    }
    return null;
  };

  const validateFiles = (
    files: FileList
  ): { valid: File[]; errors: string[] } => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      // Check for empty files
      const emptyError = validateFileNotEmpty(file);
      if (emptyError) {
        errors.push(`${file.name}: ${emptyError}`);
        return;
      }

      // Validate file name
      const nameErrors = validateFileName(file.name, existingItems);
      if (nameErrors.length > 0) {
        errors.push(`${file.name}: ${nameErrors.join(", ")}`);
        return;
      }

      const fileType = getFileTypeFromFile(file);

      if (!fileType) {
        const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
          .map((config) => config.extension)
          .join(", ");
        errors.push(
          `${file.name}: Unsupported file type. Supported types: ${supportedExtensions}`
        );
        return;
      }

      const config = SUPPORTED_FILE_TYPES[fileType];
      if (file.size > config.maxSize) {
        const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
        errors.push(
          `${file.name}: File too large. Maximum size: ${maxSizeMB}MB`
        );
        return;
      }

      validFiles.push(file);
    });

    return { valid: validFiles, errors };
  };

  const handleFiles = useCallback(
    async (files: FileList) => {
      setError(null);

      const { valid, errors } = validateFiles(files);

      if (errors.length > 0) {
        setError(errors.join("\n"));
        return;
      }

      if (valid.length === 0) {
        setError("No valid files to upload");
        return;
      }

      try {
        setUploading(true);
        await onUpload(valid);
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onUpload, onOpenChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES)
    .map((config) => config.extension)
    .join(", ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload size={20} />
            Upload Files
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop files here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click the button below to browse
            </p>
            <Button
              onClick={handleBrowseClick}
              disabled={uploading}
              variant="outline"
              className="w-full"
            >
              <FileText size={16} className="mr-2" />
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={supportedExtensions}
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Supported File Types Info */}
          <div className="text-xs text-gray-500">
            <p className="font-medium mb-1">Supported file types:</p>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(SUPPORTED_FILE_TYPES).map(([key, config]) => (
                <div key={key} className="flex items-center gap-1">
                  <span className="font-mono text-xs">{config.extension}</span>
                  <span className="text-gray-400">({config.displayName})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <AlertCircle
                  size={16}
                  className="text-red-500 mt-0.5 flex-shrink-0"
                />
                <div className="text-sm text-red-700">
                  <pre className="whitespace-pre-wrap font-sans">{error}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Upload Status */}
          {uploading && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Uploading files...
              </div>
            </div>
          )}
        </div>

        {/* Dialog Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

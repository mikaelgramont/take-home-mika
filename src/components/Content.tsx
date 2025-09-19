import type { DataRoomItem, File, Folder } from "@/types";
import FolderContent from "./FolderContent";
import FileContent from "./FileContent";

interface ContentProps {
  selectedItem: DataRoomItem | null;
  rootFolderId: string;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onDeleteFile: (fileId: string) => void;
  existingItems?: DataRoomItem[];
}

export default function Content({
  selectedItem,
  rootFolderId,
  onRenameFolder,
  onDeleteFolder,
  onRenameFile,
  onDeleteFile,
  existingItems = [],
}: ContentProps) {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
      {selectedItem ? (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 break-all">
              {selectedItem.name}
            </h2>
            <p className="text-sm text-gray-500 capitalize break-all">
              {selectedItem.type}
            </p>
          </div>

          {selectedItem.type === "folder" ? (
            <FolderContent
              folder={selectedItem as Folder}
              isRootFolder={selectedItem.id === rootFolderId}
              onRename={onRenameFolder}
              onDelete={onDeleteFolder}
              existingItems={existingItems}
            />
          ) : (
            <FileContent
              file={selectedItem as File}
              onRename={onRenameFile}
              onDelete={onDeleteFile}
              existingItems={existingItems}
            />
          )}
        </div>
      ) : (
        <p className="text-gray-500">No item selected</p>
      )}
    </div>
  );
}

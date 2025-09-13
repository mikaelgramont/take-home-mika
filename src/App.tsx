import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import { Upload, FolderPlus } from "lucide-react";
import DataRoomTreeView from "@/components/DataRoomTreeView";
import Breadcrumbs from "@/components/Breadcrumbs";
import Content from "@/components/Content";
import NewFolderDialog from "@/components/NewFolderDialog";
import UploadDialog from "@/components/UploadDialog";
import { dataRoomService } from "@/services/DataRoomService";
import {
  findItemByPath,
  getItemPath,
  findParentFolder,
  findItemById,
} from "@/lib/pathUtils";
import type { DataRoomItem, DataRoom } from "@/types";

function DataRoomApp() {
  const { "*": rawPath = "/" } = useParams<{ "*"?: string }>();
  // Decode the path parameter to handle URL encoding
  const path = decodeURIComponent(rawPath);

  const navigate = useNavigate();
  const [dataRoom, setDataRoom] = useState<DataRoom | null>(null);
  const [selectedItem, setSelectedItem] = useState<DataRoomItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Initialize DataRoom
  useEffect(() => {
    const initializeDataRoom = async () => {
      try {
        const initializedDataRoom = await dataRoomService.initializeDataRoom();
        setDataRoom(initializedDataRoom);
      } catch (error) {
        console.error("Failed to initialize DataRoom:", error);
        setError("Failed to initialize DataRoom");
      }
    };

    initializeDataRoom();
  }, []);

  // Update selectedItem based on URL path
  useEffect(() => {
    if (!dataRoom) {
      setError("No data room found");
      return;
    }

    const item = findItemByPath(dataRoom.rootFolder, path);

    if (item) {
      setSelectedItem(item);
      setError(null);
    } else {
      setSelectedItem(null);
      setError(`Path "${path}" not found`);
    }
  }, [path, dataRoom]);

  // Get current folder's children for validation
  const getCurrentFolderChildren = (): DataRoomItem[] => {
    if (!dataRoom) return [];

    if (selectedItem && selectedItem.type === "folder") {
      return selectedItem.children;
    }

    // If no folder is selected, return root folder children
    return dataRoom.rootFolder.children;
  };

  const handleItemSelect = (item: DataRoomItem | null) => {
    if (!dataRoom) {
      return;
    }

    if (item) {
      const itemPath = getItemPath(item, dataRoom.rootFolder);
      navigate(itemPath);
    } else {
      navigate("/");
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      await dataRoomService.updateFolderName(folderId, newName);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Update selected item if it's the renamed folder
        if (selectedItem?.id === folderId) {
          const updatedItem = findItemById(
            updatedDataRoom.rootFolder,
            folderId
          );
          setSelectedItem(updatedItem);
          // Update URL to reflect the new path
          if (updatedItem) {
            const newPath = getItemPath(
              updatedItem,
              updatedDataRoom.rootFolder
            );
            navigate(newPath);
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to rename folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      // Find parent folder before deletion
      const parentFolder = selectedItem
        ? findParentFolder(selectedItem, dataRoom!.rootFolder)
        : null;

      await dataRoomService.deleteFolder(folderId);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Navigate to parent or root if deleted folder was selected
        if (selectedItem?.id === folderId) {
          if (parentFolder) {
            const parentPath = getItemPath(
              parentFolder,
              updatedDataRoom.rootFolder
            );
            navigate(parentPath);
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to delete folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    try {
      await dataRoomService.updateFileName(fileId, newName);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Update selected item if it's the renamed file
        if (selectedItem?.id === fileId) {
          const updatedItem = findItemById(updatedDataRoom.rootFolder, fileId);
          setSelectedItem(updatedItem);
          // Update URL to reflect the new path
          if (updatedItem) {
            const newPath = getItemPath(
              updatedItem,
              updatedDataRoom.rootFolder
            );
            navigate(newPath);
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to rename file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      // Find parent folder before deletion
      const parentFolder = selectedItem
        ? findParentFolder(selectedItem, dataRoom!.rootFolder)
        : null;

      await dataRoomService.deleteFile(fileId);
      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);
        // Navigate to parent or root if deleted file was selected
        if (selectedItem?.id === fileId) {
          if (parentFolder) {
            const parentPath = getItemPath(
              parentFolder,
              updatedDataRoom.rootFolder
            );
            navigate(parentPath);
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setError(
        `Failed to delete file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleNewFolder = async (folderName: string) => {
    try {
      if (!dataRoom) {
        setError("No data room found");
        return;
      }

      // Determine the parent folder for the new folder
      let parentId: string | null = null;

      if (selectedItem) {
        if (selectedItem.type === "folder") {
          // If current item is a folder, create the new folder inside it
          parentId = selectedItem.id;
        } else {
          // If current item is a file, create the new folder in the file's parent
          const parentFolder = findParentFolder(
            selectedItem,
            dataRoom.rootFolder
          );
          parentId = parentFolder?.id || null;
        }
      }
      // If no selected item, create at root level (parentId remains null)

      const newFolder = await dataRoomService.createFolder(
        folderName,
        parentId
      );

      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);

        // Navigate to the newly created folder
        const newFolderPath = getItemPath(
          newFolder,
          updatedDataRoom.rootFolder
        );
        navigate(newFolderPath);
      }
    } catch (err) {
      setError(
        `Failed to create folder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleUpload = async (files: File[]) => {
    try {
      if (!dataRoom) {
        setError("No data room found");
        return;
      }

      // Determine the parent folder for the uploaded files
      let parentId: string | null = null;

      if (selectedItem) {
        if (selectedItem.type === "folder") {
          // If current item is a folder, upload files inside it
          parentId = selectedItem.id;
        } else {
          // If current item is a file, upload files in the file's parent
          const parentFolder = findParentFolder(
            selectedItem,
            dataRoom.rootFolder
          );
          parentId = parentFolder?.id || null;
        }
      }
      // If no selected item, upload at root level (parentId remains null)

      // Upload all files
      const uploadedFiles = [];
      for (const file of files) {
        const uploadedFile = await dataRoomService.uploadFile(file, parentId);
        uploadedFiles.push(uploadedFile);
      }

      // Refresh the data room from storage
      const updatedDataRoom = await dataRoomService.getDataRoom();
      if (updatedDataRoom) {
        setDataRoom(updatedDataRoom);

        // Navigate to the first uploaded file
        if (uploadedFiles.length > 0) {
          const firstFile = uploadedFiles[0];
          const filePath = getItemPath(firstFile, updatedDataRoom.rootFolder);
          navigate(filePath);
        }
      }
    } catch (err) {
      setError(
        `Failed to upload files: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  if (!dataRoom) {
    return <div>No data room!</div>;
  }

  return (
    <div className="grid-areas-layout">
      {/* Masthead */}
      <div className="grid-area-masthead bg-gray-50 border-b border-gray-200 flex items-center px-6">
        <h1 className="text-2xl font-bold text-gray-900">ACME Data Room</h1>
      </div>

      {/* Toolbar */}
      <div className="grid-area-toolbar flex flex-row flex-wrap bg-white border-b border-gray-200 items-center justify-between px-6">
        <Breadcrumbs
          selectedItem={selectedItem}
          onNavigate={handleItemSelect}
        />
        <div className="flex items-center gap-4">
          <button
            onClick={() => setUploadDialogOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Upload size={16} />
            Upload
          </button>
          <button
            onClick={() => setNewFolderDialogOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FolderPlus size={16} />
            New Folder
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div className="grid-area-tree bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
        <DataRoomTreeView
          root={dataRoom.rootFolder}
          onItemSelect={handleItemSelect}
          selectedItemId={selectedItem?.id}
          expandAll={false}
        />
      </div>

      {/* Content Area */}
      <div className="grid-area-content bg-white p-6 overflow-y-auto">
        <Content
          selectedItem={selectedItem}
          rootFolderId={dataRoom.rootFolder.id}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
          existingItems={getCurrentFolderChildren()}
        />
      </div>

      {/* Messages */}
      <div className="grid-area-messages bg-gray-100 border-t border-gray-200 flex items-center px-6">
        <p className={`text-sm ${error ? "text-red-600" : "text-gray-600"}`}>
          {error || "Ready"}
        </p>
      </div>

      {/* New Folder Dialog */}
      <NewFolderDialog
        open={newFolderDialogOpen}
        onOpenChange={setNewFolderDialogOpen}
        onConfirm={handleNewFolder}
        existingItems={getCurrentFolderChildren()}
      />

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
        existingItems={getCurrentFolderChildren()}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<DataRoomApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

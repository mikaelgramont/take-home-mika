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
  const [dataRoom, setDataRoom] = useState<DataRoom | null>(() =>
    dataRoomService.initializeDataRoom()
  );
  const [selectedItem, setSelectedItem] = useState<DataRoomItem | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Upload size={16} />
            Upload
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2">
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
        />
      </div>

      {/* Messages */}
      <div className="grid-area-messages bg-gray-100 border-t border-gray-200 flex items-center px-6">
        <p className={`text-sm ${error ? "text-red-600" : "text-gray-600"}`}>
          {error || "Ready"}
        </p>
      </div>
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

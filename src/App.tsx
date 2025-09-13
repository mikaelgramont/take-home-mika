import { useState } from "react";
import DataRoomTreeView from "@/components/DataRoomTreeView";
import { dataRoomService } from "@/services/DataRoomService";
import type { DataRoomItem, File, Folder } from "@/types";

function App() {
  const dataRoom = dataRoomService.initializeDataRoom();
  const [selectedItem, setSelectedItem] = useState<DataRoomItem | null>(null);

  const handleItemSelect = (item: DataRoomItem | null) => {
    setSelectedItem(item);
  };

  if (!dataRoom) {
    // TODO: log error, show a message to the user
    return <div>No data room!</div>;
  }

  return (
    <div className="grid-areas-layout">
      {/* Masthead */}
      <div className="grid-area-masthead bg-gray-50 border-b border-gray-200 flex items-center px-6">
        <h1 className="text-2xl font-bold text-gray-900">ACME Data Room</h1>
      </div>

      {/* Toolbar */}
      <div className="grid-area-toolbar bg-white border-b border-gray-200 flex items-center px-6">
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Upload File
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
            New Folder
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div className="grid-area-tree bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          File Structure
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <DataRoomTreeView
            root={dataRoom.rootFolder}
            onItemSelect={handleItemSelect}
            expandAll={false}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="grid-area-content bg-white p-6 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Selected Item
        </h2>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          {selectedItem ? (
            <div className="space-y-3">
              <p>
                <strong>Name:</strong> {selectedItem.name}
              </p>
              <p>
                <strong>Type:</strong> {selectedItem.type}
              </p>
              <p>
                <strong>ID:</strong> {selectedItem.id}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {selectedItem.createdAt.toLocaleDateString()}
              </p>
              <p>
                <strong>Updated:</strong>{" "}
                {selectedItem.updatedAt.toLocaleDateString()}
              </p>
              {selectedItem.type === "file" && (
                <p>
                  <strong>Size:</strong> {(selectedItem as File).size} bytes
                </p>
              )}
              {selectedItem.type === "folder" && (
                <p>
                  <strong>Children:</strong>{" "}
                  {(selectedItem as Folder).children.length} items
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No item selected</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="grid-area-messages bg-gray-100 border-t border-gray-200 flex items-center px-6">
        <p className="text-sm text-gray-600">Ready</p>
      </div>
    </div>
  );
}

export default App;

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
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Data Room</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">File Structure</h2>
          <div className="border rounded-lg p-4">
            <DataRoomTreeView
              root={dataRoom.rootFolder}
              onItemSelect={handleItemSelect}
              expandAll={false}
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Selected Item</h2>
          <div className="border rounded-lg p-4">
            {selectedItem ? (
              <div>
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
      </div>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from "react";
import { dataRoomService } from "@/services/DataRoomService";
import type { DataRoomItem } from "@/types";

interface BreadcrumbsProps {
  selectedItem: DataRoomItem | null;
  onNavigate: (item: DataRoomItem | null) => void;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  selectedItem,
  onNavigate,
}) => {
  const [path, setPath] = useState<DataRoomItem[]>([]);

  // Get the path to the selected item using the rootFolder prop
  useEffect(() => {
    const getPath = async () => {
      if (selectedItem) {
        try {
          const itemPath = await dataRoomService.getPathToItem(selectedItem.id);
          setPath(itemPath);
        } catch (error) {
          console.error("Failed to get path to item:", error);
          setPath([]);
        }
      } else {
        setPath([]);
      }
    };

    getPath();
  }, [selectedItem]);

  const handleBreadcrumbClick = (item: DataRoomItem) => {
    onNavigate(item);
  };

  if (!selectedItem || path.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <span>No item selected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-sm overflow-x-auto scrollbar-hide min-w-0 flex-1">
      {path.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && (
            <span className="text-gray-400 select-none whitespace-nowrap flex-shrink-0">
              /
            </span>
          )}
          <button
            aria-label={`Go to ${item.name}`}
            onClick={() => handleBreadcrumbClick(item)}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              index === path.length - 1
                ? "text-gray-900 font-medium cursor-default text-left break-all whitespace-normal min-w-0 flex-1"
                : "text-blue-600 hover:text-blue-800 hover:bg-blue-50 whitespace-nowrap flex-shrink-0"
            }`}
            disabled={index === path.length - 1}
          >
            {item.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumbs;

import React from "react";
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
  // Get the path to the selected item using the rootFolder prop
  const path = selectedItem
    ? dataRoomService.getPathToItem(selectedItem.id)
    : [];

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
    <div className="flex items-center space-x-2 text-sm">
      {path.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && <span className="text-gray-400 select-none">/</span>}
          <button
            aria-label={`Go to ${item.name}`}
            onClick={() => handleBreadcrumbClick(item)}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              index === path.length - 1
                ? "text-gray-900 font-medium cursor-default"
                : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
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

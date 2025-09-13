import React, { useState, useEffect } from "react";
import { TreeView, type TreeDataItem } from "./TreeView.tsx";
import type { Folder, DataRoomItem } from "../types/index.ts";
import {
  FolderIcon,
  FileIcon,
  FolderOpenIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface DataRoomTreeViewProps {
  root: Folder;
  onItemSelect?: (item: DataRoomItem | null) => void;
  selectedItemId?: string;
  expandAll?: boolean;
  className?: string;
}

const DataRoomTreeView: React.FC<DataRoomTreeViewProps> = ({
  root,
  onItemSelect,
  selectedItemId,
  expandAll = false,
  className,
}) => {
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Update expanded items when selectedItemId changes
  useEffect(() => {
    if (!selectedItemId) {
      setExpandedItemIds([]);
      return;
    }

    // Find path to selected item and expand it
    const pathToSelected: string[] = [];

    function findPath(
      items: DataRoomItem[],
      targetId: string,
      currentPath: string[]
    ): boolean {
      for (const item of items) {
        const newPath = [...currentPath, item.id];

        if (item.id === targetId) {
          // Found the target! Add all items in the path to expanded list
          pathToSelected.push(...newPath);
          return true;
        }

        if (item.type === "folder") {
          const found = findPath((item as Folder).children, targetId, newPath);
          if (found) {
            // Target found in this branch, add current item to path
            pathToSelected.push(item.id);
            return true;
          }
        }
      }
      return false;
    }

    findPath([root], selectedItemId, []);
    setExpandedItemIds(pathToSelected);
  }, [selectedItemId, root]);
  // Convert DataRoomItem to TreeDataItem
  const convertToTreeDataItem = (item: DataRoomItem): TreeDataItem => {
    const baseItem: TreeDataItem = {
      id: item.id,
      name: item.name,
      onClick: () => {
        onItemSelect?.(item);
      },
    };

    if (item.type === "folder") {
      const folder = item as Folder;
      return {
        ...baseItem,
        icon: FolderIcon,
        openIcon: FolderOpenIcon,
        selectedIcon: FolderOpenIcon,
        children: folder.children.map(convertToTreeDataItem),
        draggable: true,
        droppable: true,
      };
    } else {
      return {
        ...baseItem,
        icon: FileIcon,
        selectedIcon: FileIcon,
        draggable: true,
        droppable: false,
      };
    }
  };

  // Convert the root folder to TreeDataItem format
  const treeData = convertToTreeDataItem(root);

  const handleSelectChange = (item: TreeDataItem | undefined) => {
    if (item) {
      // Find the original DataRoomItem by ID
      const findItemById = (
        items: DataRoomItem[],
        id: string
      ): DataRoomItem | null => {
        for (const dataItem of items) {
          if (dataItem.id === id) {
            return dataItem;
          }
          if (dataItem.type === "folder") {
            const found = findItemById((dataItem as Folder).children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const originalItem = findItemById([root], item.id);
      onItemSelect?.(originalItem);
    } else {
      onItemSelect?.(null);
    }
  };

  // Find the selected item by ID for collapsed view
  const findSelectedItem = (): DataRoomItem | null => {
    if (!selectedItemId) return null;

    const findItemById = (
      items: DataRoomItem[],
      id: string
    ): DataRoomItem | null => {
      for (const dataItem of items) {
        if (dataItem.id === id) {
          return dataItem;
        }
        if (dataItem.type === "folder") {
          const found = findItemById((dataItem as Folder).children, id);
          if (found) return found;
        }
      }
      return null;
    };

    return findItemById([root], selectedItemId);
  };

  const selectedItem = findSelectedItem();

  return (
    <div className={`relative ${className || ""}`}>
      {/* Collapse/Expand Button - Mobile Only */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors md:hidden"
        title={isCollapsed ? "Expand tree view" : "Collapse tree view"}
      >
        {isCollapsed ? (
          <ChevronRight size={16} className="text-gray-600" />
        ) : (
          <ChevronLeft size={16} className="text-gray-600" />
        )}
      </button>

      {/* Collapsed View */}
      {isCollapsed ? (
        <div className="p-4 bg-gray-50 rounded-md border border-gray-200  flex items-center justify-center">
          {selectedItem ? (
            <div className="flex items-center gap-2 text-gray-700">
              {selectedItem.type === "folder" ? (
                <FolderIcon size={20} className="text-blue-600" />
              ) : (
                <FileIcon size={20} className="text-gray-600" />
              )}
              <span className="font-medium">{selectedItem.name}</span>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No item selected</div>
          )}
        </div>
      ) : (
        /* Expanded View */
        <TreeView
          data={treeData}
          onSelectChange={handleSelectChange}
          initialSelectedItemId={selectedItemId}
          expandAll={expandAll}
          expandedItemIds={expandedItemIds}
          onExpandedChange={setExpandedItemIds}
          defaultNodeIcon={FolderIcon}
          defaultLeafIcon={FileIcon}
        />
      )}
    </div>
  );
};

export default DataRoomTreeView;

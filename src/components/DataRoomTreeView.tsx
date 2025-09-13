import React, { useState, useEffect } from "react";
import { TreeView, type TreeDataItem } from "./tree-view";
import type { Folder, DataRoomItem } from "../types/index.ts";
import { FolderIcon, FileIcon, FolderOpenIcon } from "lucide-react";

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

  return (
    <TreeView
      data={treeData}
      onSelectChange={handleSelectChange}
      initialSelectedItemId={selectedItemId}
      expandAll={expandAll}
      expandedItemIds={expandedItemIds}
      onExpandedChange={setExpandedItemIds}
      defaultNodeIcon={FolderIcon}
      defaultLeafIcon={FileIcon}
      className={className}
    />
  );
};

export default DataRoomTreeView;

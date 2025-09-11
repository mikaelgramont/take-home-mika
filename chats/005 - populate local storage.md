# Populate local storage for UI testing
_Exported on 9/11/2025 at 22:52:32 GMT+2 from Cursor (1.5.11)_

---

**User**

Write a bit of javascript I can run once to populate the dataroom in local storage for the sake of building the UI rendering part of this app

---

**Cursor**

I'll help you create a JavaScript script to populate the DataRoom in local storage. First, let me examine the current DataRoom service and types to understand the data structure.


Now I'll create a JavaScript script that populates the DataRoom with sample data. Based on the code structure, I can see that the data is stored in localStorage with the key "dataroom_data" and follows a specific structure.


```javascript
// Script to populate the DataRoom with sample data for UI development
// Run this in the browser console or as a script

// Helper function to generate unique IDs (matching the service implementation)
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Helper function to create a mock PDF file content (ArrayBuffer)
function createMockPdfContent() {
  // Create a simple PDF header as ArrayBuffer
  const pdfHeader = "%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF";
  const encoder = new TextEncoder();
  return encoder.encode(pdfHeader).buffer;
}

// Create sample data
function createSampleDataRoom() {
  const now = new Date();
  const baseTime = now.getTime();
  
  // Create root folder
  const rootFolder = {
    id: generateId(),
    name: "Acme Corp Data Room",
    type: "folder",
    createdAt: new Date(baseTime - 86400000), // 1 day ago
    updatedAt: now,
    parentId: null,
    children: []
  };

  // Create sample folders
  const financialFolder = {
    id: generateId(),
    name: "Financial Documents",
    type: "folder",
    createdAt: new Date(baseTime - 86400000),
    updatedAt: new Date(baseTime - 3600000), // 1 hour ago
    parentId: rootFolder.id,
    children: []
  };

  const legalFolder = {
    id: generateId(),
    name: "Legal Documents",
    type: "folder",
    createdAt: new Date(baseTime - 86400000),
    updatedAt: new Date(baseTime - 7200000), // 2 hours ago
    parentId: rootFolder.id,
    children: []
  };

  const contractsFolder = {
    id: generateId(),
    name: "Contracts",
    type: "folder",
    createdAt: new Date(baseTime - 43200000), // 12 hours ago
    updatedAt: new Date(baseTime - 1800000), // 30 minutes ago
    parentId: legalFolder.id,
    children: []
  };

  const dueDiligenceFolder = {
    id: generateId(),
    name: "Due Diligence",
    type: "folder",
    createdAt: new Date(baseTime - 43200000),
    updatedAt: new Date(baseTime - 900000), // 15 minutes ago
    parentId: rootFolder.id,
    children: []
  };

  // Create sample files
  const sampleFiles = [
    {
      id: generateId(),
      name: "Q3_2024_Financial_Statements.pdf",
      type: "file",
      createdAt: new Date(baseTime - 86400000),
      updatedAt: new Date(baseTime - 3600000),
      parentId: financialFolder.id,
      fileType: "pdf",
      size: 2048576, // 2MB
      content: createMockPdfContent()
    },
    {
      id: generateId(),
      name: "Audit_Report_2024.pdf",
      type: "file",
      createdAt: new Date(baseTime - 172800000), // 2 days ago
      updatedAt: new Date(baseTime - 3600000),
      parentId: financialFolder.id,
      fileType: "pdf",
      size: 1536000, // 1.5MB
      content: createMockPdfContent()
    },
    {
      id: generateId(),
      name: "Balance_Sheet_2024.pdf",
      type: "file",
      createdAt: new Date(baseTime - 259200000), // 3 days ago
      updatedAt: new Date(baseTime - 3600000),
      parentId: financialFolder.id,
      fileType: "pdf",
      size: 1024000, // 1MB
      content: createMockPdfContent()
    },
    {
      id: generateId(),
      name: "Acquisition_Agreement.pdf",
      type: "file",
      createdAt: new Date(baseTime - 604800000), // 1 week ago
      updatedAt: new Date(baseTime - 7200000),
      parentId: contractsFolder.id,
      fileType: "pdf",
      size: 5120000, // 5MB
      content: createMockPdfContent()
    },
    {
      id: generateId(),
      name: "Non_Disclosure_Agreement.pdf",
      type: "file",
      createdAt: new Date(baseTime - 1209600000), // 2 weeks ago
      updatedAt: new Date(baseTime - 7200000),
      parentId: contractsFolder.id,
      fileType: "pdf",
      size: 768000, // 768KB
      content: createMockPdfContent()
    },
    {
      id: generateId(),
      name: "Employee_Agreements.pdf",
      type: "file",
      createdAt: new Date(baseTime - 1209600000),
      updatedAt: new Date(baseTime - 7200000),
      parentId: contractsFolder.id,
      fileType: "pdf",
      size: 2560000, // 2.5MB
      content: createMockPdfContent()
    },
    {
      id: generateId(),
      name: "Due_Diligence_Checklist.pdf",
      type: "file",
      createdAt: new Date(baseTime - 43200000),
      updatedAt: new Date(baseTime - 900000),
      parentId: dueDiligenceFolder.id,
      fileType: "pdf",
      size: 512000, // 512KB
      content: createMockPdfContent()
    },
    {
      id: generateId(),
      name: "Risk_Assessment_Report.pdf",
      type: "file",
      createdAt: new Date(baseTime - 43200000),
      updatedAt: new Date(baseTime - 900000),
      parentId: dueDiligenceFolder.id,
      fileType: "pdf",
      size: 3072000, // 3MB
      content: createMockPdfContent()
    },
    {
      id: generateId(),
      name: "Market_Analysis.pdf",
      type: "file",
      createdAt: new Date(baseTime - 259200000), // 3 days ago
      updatedAt: new Date(baseTime - 1800000), // 30 minutes ago
      parentId: rootFolder.id,
      fileType: "pdf",
      size: 4096000, // 4MB
      content: createMockPdfContent()
    },
    {
      id: generateId(),
      name: "Executive_Summary.pdf",
      type: "file",
      createdAt: new Date(baseTime - 86400000),
      updatedAt: new Date(baseTime - 1800000),
      parentId: rootFolder.id,
      fileType: "pdf",
      size: 1280000, // 1.28MB
      content: createMockPdfContent()
    }
  ];

  // Add files to their respective folders
  financialFolder.children = sampleFiles.filter(file => file.parentId === financialFolder.id);
  contractsFolder.children = sampleFiles.filter(file => file.parentId === contractsFolder.id);
  dueDiligenceFolder.children = sampleFiles.filter(file => file.parentId === dueDiligenceFolder.id);
  
  // Add folders to their parents
  legalFolder.children = [contractsFolder];
  rootFolder.children = [financialFolder, legalFolder, dueDiligenceFolder, ...sampleFiles.filter(file => file.parentId === rootFolder.id)];

  // Calculate total files and size
  function calculateStats(folder) {
    let totalFiles = 0;
    let totalSize = 0;
    
    for (const child of folder.children) {
      if (child.type === "file") {
        totalFiles++;
        totalSize += child.size;
      } else if (child.type === "folder") {
        const stats = calculateStats(child);
        totalFiles += stats.totalFiles;
        totalSize += stats.totalSize;
      }
    }
    
    return { totalFiles, totalSize };
  }

  const stats = calculateStats(rootFolder);

  // Create the main DataRoom object
  const dataRoom = {
    id: generateId(),
    createdAt: new Date(baseTime - 86400000),
    updatedAt: now,
    rootFolder: rootFolder,
    totalFiles: stats.totalFiles,
    totalSize: stats.totalSize
  };

  return dataRoom;
}

// Function to populate localStorage
function populateDataRoom() {
  try {
    // Clear existing data
    localStorage.removeItem("dataroom_data");
    
    // Create and store sample data
    const sampleDataRoom = createSampleDataRoom();
    localStorage.setItem("dataroom_data", JSON.stringify(sampleDataRoom));
    
    console.log("✅ DataRoom populated successfully!");
    console.log("📊 Sample data includes:");
    console.log(`   - ${sampleDataRoom.totalFiles} files`);
    console.log(`   - ${(sampleDataRoom.totalSize / 1024 / 1024).toFixed(2)} MB total size`);
    console.log("📁 Folder structure:");
    console.log("   - Acme Corp Data Room (root)");
    console.log("     ├── Financial Documents (3 files)");
    console.log("     ├── Legal Documents");
    console.log("     │   └── Contracts (3 files)");
    console.log("     ├── Due Diligence (2 files)");
    console.log("     ├── Market Analysis.pdf");
    console.log("     └── Executive Summary.pdf");
    
    return sampleDataRoom;
  } catch (error) {
    console.error("❌ Error populating DataRoom:", error);
    throw error;
  }
}

// Function to clear DataRoom data
function clearDataRoom() {
  localStorage.removeItem("dataroom_data");
  console.log("🗑️ DataRoom data cleared from localStorage");
}

// Export functions for use
if (typeof window !== 'undefined') {
  window.populateDataRoom = populateDataRoom;
  window.clearDataRoom = clearDataRoom;
  window.createSampleDataRoom = createSampleDataRoom;
}

// Auto-run if this script is executed directly
if (typeof window !== 'undefined' && window.location) {
  console.log("🚀 DataRoom Population Script Loaded");
  console.log("📝 Available functions:");
  console.log("   - populateDataRoom() - Populate with sample data");
  console.log("   - clearDataRoom() - Clear all data");
  console.log("   - createSampleDataRoom() - Create sample data object");
  console.log("\n💡 Run populateDataRoom() to get started!");
}

// If running in Node.js environment (for testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    populateDataRoom,
    clearDataRoom,
    createSampleDataRoom
  };
}
```

Perfect! I've created a comprehensive JavaScript script that will populate your DataRoom with sample data. Here's what the script does:

## Features

**�� Sample Folder Structure:**
- **Acme Corp Data Room** (root)
  - **Financial Documents** (3 PDF files)
  - **Legal Documents**
    - **Contracts** (3 PDF files)
  - **Due Diligence** (2 PDF files)
  - **Market Analysis.pdf** (root level)
  - **Executive Summary.pdf** (root level)

**📄 Sample Files:**
- 10 PDF files with realistic names and sizes
- Proper timestamps (created/updated at different times)
- Mock PDF content (ArrayBuffer format)
- Various file sizes (512KB to 5MB)

## How to Use

### Option 1: Browser Console
1. Open your app in the browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Copy and paste the entire script content
5. Run `populateDataRoom()` to populate the data

### Option 2: Include in HTML
Add this script tag to your `index.html`:
```html
<script src="./populate-dataroom.js"></script>
```

### Option 3: Run as Module
```javascript
// Import and use
import { populateDataRoom, clearDataRoom } from './populate-dataroom.js';
populateDataRoom();
```

## Available Functions

- `populateDataRoom()` - Populates localStorage with sample data
- `clearDataRoom()` - Clears all DataRoom data from localStorage
- `createSampleDataRoom()` - Returns the sample data object (without storing)

## Data Structure

The script creates data that matches your existing TypeScript interfaces:
- Proper `DataRoom` structure with statistics
- Nested `Folder` and `File` objects
- Correct timestamps and IDs
- Mock PDF content as ArrayBuffer
- Realistic file sizes and names

This will give you a rich dataset to work with while building and testing your UI components!

```html
<script src="./populate-dataroom.js"></script>
```

```javascript
// Import and use
import { populateDataRoom, clearDataRoom } from './populate-dataroom.js';
populateDataRoom();
```


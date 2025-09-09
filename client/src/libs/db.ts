import { hostAPI } from "./host-api";
import type { AppTable } from "@/types";

type App = AppTable;

// Simple event emitter for pub/sub
type DBEvent = "appsChanged";
type Listener = () => void;
const listeners: Record<DBEvent, Listener[]> = {
  appsChanged: [],
};

export function subscribeDB(event: DBEvent, listener: Listener) {
  listeners[event].push(listener);
  return () => {
    listeners[event] = listeners[event].filter((l) => l !== listener);
  };
}

function publishDB(event: DBEvent) {
  listeners[event].forEach((listener) => listener());
}

// Initialize apps in the server-side database
async function initializeApps() {
  try {
    const randomVersion = () =>
      `${Math.floor(Math.random() * 3) + 1}.${Math.floor(
        Math.random() * 10
      )}.${Math.floor(Math.random() * 10)}`;
    const randomPrice = () => Number((Math.random() * 9.99).toFixed(2));

    // Check if apps already exist
    const existingApps = await hostAPI.db.list("apps");

    if (existingApps.documents.length === 0) {
      // Create default apps
      const defaultApps = [
        {
          id: "notepad",
          name: "Notepad",
          description: "A simple notepad for quick notes and ideas.",
          version: randomVersion(),
          price: 0,
          icon: "📝",
          installed: 1,
        },
        {
          id: "db-viewer",
          name: "DB Viewer",
          description:
            "Browse and manage your database collections and documents.",
          version: randomVersion(),
          price: 0,
          icon: "🗃️",
          installed: 1,
        },
        {
          id: "to-do-list",
          name: "To-Do List",
          description: "Manage your tasks and stay organized.",
          version: randomVersion(),
          price: randomPrice(),
          icon: "✅",
          installed: 0,
        },
        {
          id: "calendar",
          name: "Calendar",
          description: "View and schedule your events easily.",
          version: randomVersion(),
          price: randomPrice(),
          icon: "📅",
          installed: 0,
        },
        {
          id: "chess",
          name: "Chess",
          description: "Play chess and challenge your mind.",
          version: randomVersion(),
          price: randomPrice(),
          icon: "♟️",
          installed: 0,
        },
        {
          id: "file-drive",
          name: "File Drive",
          description: "Store and access your files securely.",
          version: randomVersion(),
          price: randomPrice(),
          icon: "🗂️",
          installed: 0,
        },
        {
          id: "calculator",
          name: "Calculator",
          description: "Perform quick calculations and solve equations.",
          version: randomVersion(),
          price: randomPrice(),
          icon: "🧮",
          installed: 0,
        },
        {
          id: "stocks",
          name: "Stocks",
          description: "Track stock prices and market trends.",
          version: randomVersion(),
          price: randomPrice(),
          icon: "📈",
          installed: 0,
        },
      ];

      // Create all apps
      for (const app of defaultApps) {
        await hostAPI.db.create("apps", app);
      }

      publishDB("appsChanged");
    }
  } catch (error) {
    console.error("Failed to initialize apps:", error);
  }
}

// Database operations for apps
const db = {
  // Initialize the database
  init: initializeApps,

  // Get all apps
  getAllApps: async (): Promise<App[]> => {
    try {
      const result = await hostAPI.db.list("apps");
      return result.documents.map((doc) => ({
        id: String(doc.data.id || ""),
        name: String(doc.data.name || ""),
        description: String(doc.data.description || ""),
        version: doc.data.version ? String(doc.data.version) : undefined,
        price:
          doc.data.price !== undefined ? Number(doc.data.price) : undefined,
        icon: String(doc.data.icon || ""),
        installed:
          doc.data.installed !== undefined ? Number(doc.data.installed) : 0,
      }));
    } catch (error) {
      console.error("Failed to get apps:", error);
      return [];
    }
  },

  // Update an app
  updateApp: async (appId: string, updates: Partial<App>): Promise<void> => {
    try {
      const apps = await hostAPI.db.list("apps");
      const appDoc = apps.documents.find((doc) => doc.data.id === appId);

      if (appDoc) {
        const updatedData = { ...appDoc.data, ...updates };
        await hostAPI.db.update("apps", appDoc.id, updatedData);
        publishDB("appsChanged");
      }
    } catch (error) {
      console.error(`Failed to update app ${appId}:`, error);
    }
  },
};

// Initialize apps on module load
initializeApps();

export default db;

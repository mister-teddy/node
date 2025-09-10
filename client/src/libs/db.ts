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

// Database operations for apps
const db = {
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

  // Get a single app by ID (with source_code)
  getAppById: async (appId: string): Promise<App | undefined> => {
    try {
      const apps = await hostAPI.db.list("apps");
      const appDoc = apps.documents.find((doc) => doc.data.id === appId);

      if (!appDoc) {
        return undefined;
      }

      return {
        id: String(appDoc.data.id || ""),
        name: String(appDoc.data.name || ""),
        description: String(appDoc.data.description || ""),
        version: appDoc.data.version ? String(appDoc.data.version) : undefined,
        price:
          appDoc.data.price !== undefined
            ? Number(appDoc.data.price)
            : undefined,
        icon: String(appDoc.data.icon || ""),
        installed:
          appDoc.data.installed !== undefined
            ? Number(appDoc.data.installed)
            : 0,
        source_code: appDoc.data.source_code
          ? String(appDoc.data.source_code)
          : undefined,
      };
    } catch (error) {
      console.error(`Failed to get app ${appId}:`, error);
      return undefined;
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

export default db;

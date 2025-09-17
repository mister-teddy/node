import { miniServer } from "./mini-server";

/**
 * Host API Client
 * Provides methods to interact with the server-side SQLite database
 * through the REST API endpoints provided by the Rust server.
 * Now uses the typed miniServer client for better type safety.
 */
interface DatabaseDocument {
  id: string;
  collection: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface DatabaseResponse<T> {
  data: T;
  links?: {
    self?: string;
    collection?: string;
    collections?: string;
  };
  meta?: {
    count: number;
    limit: number;
    offset: number;
  };
}

class HostAPI {
  constructor() {
    // Constructor no longer needs baseUrl since miniServer handles this
  }

  /**
   * Database operations
   */
  db = {
    /**
     * Create a new document in a collection
     */
    create: async (
      collection: string,
      data: Record<string, unknown>,
    ): Promise<DatabaseDocument> => {
      const response = await miniServer.POST("/api/db/{collection}", {
        params: {
          path: { collection }
        },
        body: { data },
      } as any);

      if (!response.data) {
        throw new Error(`HTTP error! Failed to create document`);
      }

      // Type assertion needed since schema returns 'unknown'
      const typedData = response.data as DatabaseResponse<DatabaseDocument>;
      return typedData.data;
    },

    /**
     * Get a document by ID from a collection
     */
    get: async (
      collection: string,
      id: string,
    ): Promise<DatabaseDocument | null> => {
      const response = await miniServer.GET("/api/db/{collection}/{id}", {
        params: {
          path: { collection, id }
        },
      } as any);

      if (!response.data) {
        return null;
      }

      // Type assertion needed since schema returns 'unknown'
      const typedData = response.data as DatabaseResponse<DatabaseDocument>;
      return typedData.data;
    },

    /**
     * Update a document by ID in a collection
     */
    update: async (
      collection: string,
      id: string,
      data: Record<string, unknown>,
    ): Promise<DatabaseDocument | null> => {
      const response = await miniServer.PUT("/api/db/{collection}/{id}", {
        params: {
          path: { collection, id }
        },
        body: { data },
      } as any);

      if (!response.data) {
        return null;
      }

      // Type assertion needed since schema returns 'unknown'
      const typedData = response.data as DatabaseResponse<DatabaseDocument>;
      return typedData.data;
    },

    /**
     * Delete a document by ID from a collection
     */
    delete: async (collection: string, id: string): Promise<boolean> => {
      await miniServer.DELETE("/api/db/{collection}/{id}", {
        params: {
          path: { collection, id }
        },
      } as any);

      // Delete operations might not return data, so we check if the call succeeded
      return true;
    },

    /**
     * List documents in a collection with pagination
     */
    list: async (
      collection: string,
      limit = 100,
      offset = 0,
    ): Promise<{ documents: DatabaseDocument[]; count: number }> => {
      const response = await miniServer.GET("/api/db/{collection}", {
        params: {
          path: { collection },
          query: { limit, offset }
        },
      } as any);

      if (!response.data) {
        throw new Error(`HTTP error! Failed to list documents`);
      }

      // Type assertion needed since schema returns 'unknown'
      const typedData = response.data as DatabaseResponse<DatabaseDocument[]>;
      return {
        documents: typedData.data,
        count: typedData.meta?.count || 0,
      };
    },

    /**
     * List all collections
     */
    collections: async (): Promise<string[]> => {
      const response = await miniServer.GET("/api/db", {} as any);

      if (!response.data) {
        throw new Error(`HTTP error! Failed to get collections`);
      }

      // Type assertion needed since schema returns 'unknown'
      const typedData = response.data as DatabaseResponse<string[]>;
      return typedData.data;
    },

    /**
     * Reset the entire database (clear all data)
     */
    reset: async (): Promise<string> => {
      const response = await miniServer.POST("/api/db/reset", {} as any);

      if (!response.data) {
        throw new Error(`HTTP error! Failed to reset database`);
      }

      // Type assertion needed since schema returns 'unknown'
      const typedData = response.data as { message: string };
      return typedData.message;
    },
  };
}

// Export a singleton instance
export const hostAPI = new HostAPI();
export default hostAPI;

// Export types for external use
export type { DatabaseDocument, DatabaseResponse };

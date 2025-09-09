import CONFIG from "@/config";

/**
 * Host API Client
 * Provides methods to interact with the server-side SQLite database
 * through the REST API endpoints provided by the Rust server.
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
  private baseUrl: string;

  constructor() {
    // Use the development server URL by default, will work in production too
    this.baseUrl = CONFIG.API.BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return null as T;
    }

    return response.json();
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
      const response = await this.request<DatabaseResponse<DatabaseDocument>>(
        `/api/db/${collection}`,
        {
          method: "POST",
          body: JSON.stringify({ data }),
        },
      );
      return response.data;
    },

    /**
     * Get a document by ID from a collection
     */
    get: async (
      collection: string,
      id: string,
    ): Promise<DatabaseDocument | null> => {
      try {
        const response = await this.request<DatabaseResponse<DatabaseDocument>>(
          `/api/db/${collection}/${id}`,
        );
        return response.data;
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("404")) {
          return null;
        }
        throw error;
      }
    },

    /**
     * Update a document by ID in a collection
     */
    update: async (
      collection: string,
      id: string,
      data: Record<string, unknown>,
    ): Promise<DatabaseDocument | null> => {
      try {
        const response = await this.request<DatabaseResponse<DatabaseDocument>>(
          `/api/db/${collection}/${id}`,
          {
            method: "PUT",
            body: JSON.stringify({ data }),
          },
        );
        return response.data;
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("404")) {
          return null;
        }
        throw error;
      }
    },

    /**
     * Delete a document by ID from a collection
     */
    delete: async (collection: string, id: string): Promise<boolean> => {
      try {
        await this.request<null>(`/api/db/${collection}/${id}`, {
          method: "DELETE",
        });
        return true;
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("404")) {
          return false;
        }
        throw error;
      }
    },

    /**
     * List documents in a collection with pagination
     */
    list: async (
      collection: string,
      limit = 100,
      offset = 0,
    ): Promise<{ documents: DatabaseDocument[]; count: number }> => {
      const response = await this.request<DatabaseResponse<DatabaseDocument[]>>(
        `/api/db/${collection}?limit=${limit}&offset=${offset}`,
      );
      return {
        documents: response.data,
        count: response.meta?.count || 0,
      };
    },

    /**
     * List all collections
     */
    collections: async (): Promise<string[]> => {
      const response =
        await this.request<DatabaseResponse<string[]>>("/api/db");
      return response.data;
    },

    /**
     * Reset the entire database (clear all data)
     */
    reset: async (): Promise<string> => {
      const response = await this.request<{ message: string }>(
        "/api/db/reset",
        {
          method: "POST",
        },
      );
      return response.message;
    },
  };
}

// Export a singleton instance
export const hostAPI = new HostAPI();
export default hostAPI;

// Export types for external use
export type { DatabaseDocument, DatabaseResponse };

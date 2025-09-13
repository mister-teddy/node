import CONFIG from "@/config";
import type { AppProject } from "@/types/app-project";

export interface CreateProjectRequest {
  name: string;
  description: string;
  icon: string;
  prompt: string;
  model?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  icon?: string;
  status?: "draft" | "published";
}

export interface CreateVersionRequest {
  prompt: string;
  source_code: string;
  model?: string;
}

export interface ConvertToAppRequest {
  version: number;
  price?: number;
}

export interface ProjectVersion {
  id: string;
  project_id: string;
  version_number: number;
  prompt: string;
  source_code: string;
  model?: string;
  created_at: string;
}

export class ProjectAPI {
  private static baseUrl = `${CONFIG.API.BASE_URL}/api/projects`;

  static async createProject(request: CreateProjectRequest): Promise<AppProject> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to create project: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  }

  static async updateProject(id: string, request: UpdateProjectRequest): Promise<AppProject> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to update project: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  }

  static async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete project: ${response.status}`);
    }
  }

  static async getProject(id: string): Promise<AppProject> {
    const response = await fetch(`${this.baseUrl}/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to get project: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  }

  static async createVersion(projectId: string, request: CreateVersionRequest): Promise<ProjectVersion> {
    const response = await fetch(`${this.baseUrl}/${projectId}/versions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to create version: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  }

  static async getVersions(projectId: string): Promise<ProjectVersion[]> {
    const response = await fetch(`${this.baseUrl}/${projectId}/versions`);

    if (!response.ok) {
      throw new Error(`Failed to get versions: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  }

  static async convertToApp(projectId: string, request: ConvertToAppRequest): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${projectId}/convert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to convert to app: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  }
}
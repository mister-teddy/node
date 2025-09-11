import { generateId } from "./utils";
import type {
  AppProject,
  AppProjectVersion,
  CreateAppProjectParams,
  UpdateAppProjectParams,
  ModifyCodeParams,
} from "@/types/app-project";

const STORAGE_KEY = "app_projects";

// Local storage operations for app projects
export class AppProjectStorage {
  static getAll(): AppProject[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const projects: AppProject[] = JSON.parse(stored);
      return projects.map((project: AppProject) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        // Ensure versioning fields exist for legacy projects
        currentVersion: project.currentVersion || 1,
        versions: project.versions?.map(v => ({
          ...v,
          createdAt: new Date(v.createdAt)
        })) || [],
      }));
    } catch (error) {
      console.error("Failed to load app projects:", error);
      return [];
    }
  }

  static save(projects: AppProject[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error("Failed to save app projects:", error);
    }
  }

  static create(params: CreateAppProjectParams): AppProject {
    const initialVersion: AppProjectVersion = {
      id: generateId(),
      versionNumber: 1,
      sourceCode: "",
      prompt: params.prompt,
      createdAt: new Date(),
      model: params.model,
    };

    const project: AppProject = {
      id: generateId(),
      name: "Untitled App",
      description: "Generated from: " + params.prompt,
      icon: "🪄",
      price: 0,
      version: "1.0.0",
      sourceCode: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "draft",
      model: params.model,
      originalPrompt: params.prompt,
      currentVersion: 1,
      versions: [initialVersion],
    };

    const projects = this.getAll();
    projects.unshift(project);
    this.save(projects);

    return project;
  }

  static update(params: UpdateAppProjectParams): AppProject | null {
    const projects = this.getAll();
    const index = projects.findIndex((p) => p.id === params.id);

    if (index === -1) return null;

    const project = projects[index];
    const updatedProject = {
      ...project,
      ...params,
      updatedAt: new Date(),
    };

    // If source code is being updated, update the current version
    if (params.sourceCode !== undefined && project.versions.length > 0) {
      const currentVersionIndex = project.versions.findIndex(
        v => v.versionNumber === project.currentVersion
      );
      
      if (currentVersionIndex !== -1) {
        updatedProject.versions = [...project.versions];
        updatedProject.versions[currentVersionIndex] = {
          ...project.versions[currentVersionIndex],
          sourceCode: params.sourceCode,
        };
      }
    }

    projects[index] = updatedProject;
    this.save(projects);

    return updatedProject;
  }

  static delete(id: string): boolean {
    const projects = this.getAll();
    const filteredProjects = projects.filter((p) => p.id !== id);

    if (filteredProjects.length === projects.length) return false;

    this.save(filteredProjects);
    return true;
  }

  static getById(id: string): AppProject | null {
    const projects = this.getAll();
    return projects.find((p) => p.id === id) || null;
  }

  static duplicate(id: string): AppProject | null {
    const original = this.getById(id);
    if (!original) return null;

    const duplicate: AppProject = {
      ...original,
      id: generateId(),
      name: original.name + " (Copy)",
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "draft",
    };

    const projects = this.getAll();
    projects.unshift(duplicate);
    this.save(projects);

    return duplicate;
  }

  static createVersion(params: ModifyCodeParams, newCode: string): AppProject | null {
    const projects = this.getAll();
    const index = projects.findIndex((p) => p.id === params.projectId);

    if (index === -1) return null;

    const project = projects[index];
    const newVersionNumber = Math.max(...project.versions.map(v => v.versionNumber), 0) + 1;

    const newVersion: AppProjectVersion = {
      id: generateId(),
      versionNumber: newVersionNumber,
      sourceCode: newCode,
      prompt: params.modificationPrompt,
      createdAt: new Date(),
      model: params.model,
    };

    const updatedProject = {
      ...project,
      sourceCode: newCode,
      currentVersion: newVersionNumber,
      versions: [...project.versions, newVersion],
      updatedAt: new Date(),
    };

    projects[index] = updatedProject;
    this.save(projects);

    return updatedProject;
  }

  static switchToVersion(projectId: string, versionNumber: number): AppProject | null {
    const projects = this.getAll();
    const index = projects.findIndex((p) => p.id === projectId);

    if (index === -1) return null;

    const project = projects[index];
    const targetVersion = project.versions.find(v => v.versionNumber === versionNumber);
    
    if (!targetVersion) return null;

    const updatedProject = {
      ...project,
      sourceCode: targetVersion.sourceCode,
      currentVersion: versionNumber,
      updatedAt: new Date(),
    };

    projects[index] = updatedProject;
    this.save(projects);

    return updatedProject;
  }

  static getVersion(projectId: string, versionNumber: number): AppProjectVersion | null {
    const project = this.getById(projectId);
    if (!project) return null;
    
    return project.versions.find(v => v.versionNumber === versionNumber) || null;
  }

  static deleteVersion(projectId: string, versionNumber: number): AppProject | null {
    const projects = this.getAll();
    const index = projects.findIndex((p) => p.id === projectId);

    if (index === -1) return null;

    const project = projects[index];
    
    // Don't allow deleting the only version
    if (project.versions.length <= 1) return null;
    
    // Don't allow deleting the current version
    if (project.currentVersion === versionNumber) return null;

    const updatedVersions = project.versions.filter(v => v.versionNumber !== versionNumber);
    
    const updatedProject = {
      ...project,
      versions: updatedVersions,
      updatedAt: new Date(),
    };

    projects[index] = updatedProject;
    this.save(projects);

    return updatedProject;
  }
}

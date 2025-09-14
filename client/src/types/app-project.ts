export interface AppProjectVersion {
  id: string;
  versionNumber: number;
  sourceCode: string;
  prompt: string;
  createdAt: Date;
  model?: string;
}

export interface AppProject {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji for now
  price: number;
  createdAt: Date;
  updatedAt: Date;
  status: "draft" | "published";
  model?: string; // AI model used for generation
  originalPrompt?: string;
  // Version control
  currentVersion: number;
  versions: AppProjectVersion[];
}

export interface AppMetadata {
  name: string;
  description: string;
  icon: string;
  price: number;
  version: string;
}

export interface CreateAppProjectParams {
  prompt: string;
  model?: string;
}

export interface UpdateAppProjectParams {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  price?: number;
  version?: string;
  sourceCode?: string;
  status?: "draft" | "published";
}

export interface ModifyCodeParams {
  projectId: string;
  modificationPrompt: string;
  model?: string;
}

export interface AppGenerationResult {
  sourceCode: string;
  metadata: AppMetadata;
}

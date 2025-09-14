import type React from "react";

export type SqlValue = string | number | boolean | null;

export type QueryExecResult = {
  columns: string[];
  values: SqlValue[][];
};

export interface AppTable {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number | undefined;
  version: string | undefined;
  installed: number;
  source_code?: string;
}

export interface DB {
  apps: AppTable;
}

export type AppProps = {
  app: AppTable;
  React: typeof React;
};

export interface WindowConfig {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  isMinimized: boolean;
  isMaximized: boolean;
  isVisible: boolean;
  zIndex: number;
  width?: number;
  height?: number;
  title?: string;
  content?: React.ReactNode;
}

export interface WindowManagerActions {
  createWindow: (id: string, options?: Partial<WindowConfig>) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  repositionWindows: () => void;
}

export interface FrameConfig {
  id: string;
  title: string;
  position: [number, number, number];
  size: [number, number];
  isVisible: boolean;
  component: React.ComponentType;
}

export interface Active3DWindow {
  title?: string;
  icon?: string;
  component: React.ComponentType;
  position: [number, number, number];
  size?: [number, number];
  biFoldContent?: React.ReactNode;
}

// Server API types
export interface ServerResponse<T> {
  data: T;
  meta?: {
    count: number;
    limit: number;
    offset: number;
  };
  links: {
    self: string;
    collections?: string;
  };
}

export interface VersionData {
  id: string;
  project_id: string;
  version_number: number;
  prompt: string;
  source_code: string;
  model?: string;
  created_at: string;
}

export interface ServerVersion {
  id: string;
  collection: string;
  data: VersionData;
  created_at: string;
  source_code?: string;
  updated_at: string;
}

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "draft" | "published";
  current_version: number;
  initial_prompt?: string;
  initial_model?: string;
  versions: ServerVersion[];
  created_at: string;
  updated_at: string;
}

export interface ServerProject {
  id: string;
  collection: string;
  data: ProjectData;
  created_at: string;
  updated_at: string;
}

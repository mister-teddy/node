import { createContext, useContext, useState, type ReactNode } from "react";
import type { AppProject } from "@/types/app-project";

interface ProjectDetailContextValue {
  project: AppProject | null;
  currentCode: string;
  setCurrentCode: (code: string) => void;
  isStreamingCode: boolean;
  setIsStreamingCode: (streaming: boolean) => void;
}

const ProjectDetailContext = createContext<ProjectDetailContextValue | null>(null);

interface ProjectDetailProviderProps {
  children: ReactNode;
  project: AppProject | null;
  initialCode?: string;
}

export function ProjectDetailProvider({
  children,
  project,
  initialCode = ""
}: ProjectDetailProviderProps) {
  const [currentCode, setCurrentCode] = useState(initialCode);
  const [isStreamingCode, setIsStreamingCode] = useState(false);

  const value: ProjectDetailContextValue = {
    project,
    currentCode,
    setCurrentCode,
    isStreamingCode,
    setIsStreamingCode,
  };

  return (
    <ProjectDetailContext.Provider value={value}>
      {children}
    </ProjectDetailContext.Provider>
  );
}

export function useProjectDetail() {
  const context = useContext(ProjectDetailContext);
  if (!context) {
    throw new Error("useProjectDetail must be used within a ProjectDetailProvider");
  }
  return context;
}
import AppRenderer from "@/components/app-renderer";
import { AppPreviewErrorBoundary } from "./app-preview-error-boundary";
import { useProjectDetail } from "./project-detail-context";
import ProjectCode from "./project-code";

export default function ProjectPreview() {
  const { project, currentCode, isStreamingCode } = useProjectDetail();

  if (!project || !currentCode) {
    return <></>;
  }

  if (isStreamingCode) {
    return <ProjectCode />;
  }

  return (
    <AppPreviewErrorBoundary>
      <AppRenderer
        app={{
          id: project.id,
          name: project.name,
          source_code: currentCode,
          description: project.description,
          icon: project.icon,
          price: project.price,
          version: `${project.currentVersion}`,
          installed: 1,
        }}
      />
    </AppPreviewErrorBoundary>
  );
}

import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import FormRenderer, { type FormFieldConfig } from "@/components/form-renderer";
import CONFIG from "@/config";
import { useProjectDetail } from "./project-detail-context";

interface ProjectFormData {
  name: string;
  icon: string;
  description: string;
  status: boolean;
}

export function ProjectSettings() {
  const { project } = useProjectDetail();

  if (!project) {
    return (
      <>
        <CardHeader>
          <CardTitle>Project Settings</CardTitle>
          <CardDescription>Loading project settings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p>Loading project...</p>
            </div>
          </div>
        </CardContent>
        <CardFooter />
      </>
    );
  }

  const formFields: FormFieldConfig<ProjectFormData>[] = [
    {
      name: "name",
      label: "App Name",
      type: "text",
      required: true,
      placeholder: "Enter app name",
      validation: {
        min: 1,
      },
    },
    {
      name: "icon",
      label: "Icon (Emoji)",
      type: "text",
      required: true,
      placeholder: "📱",
      validation: {
        min: 1,
        max: 2,
      },
    },
    {
      name: "description",
      label: "Description",
      type: "text",
      required: true,
      placeholder: "Describe what your app does and its key features...",
      validation: {
        min: 1,
      },
    },
    {
      name: "status",
      label: "Publication Status",
      type: "toggle",
      required: false,
      description: "Publish your project to make it publicly available",
    },
  ];

  const handleFormSubmit = async (values: ProjectFormData) => {
    try {
      // Prepare update data
      const updateData: Record<string, any> = {};

      if (values.name !== project.name) {
        updateData.name = values.name;
      }
      if (values.icon !== project.icon) {
        updateData.icon = values.icon;
      }
      if (values.description !== project.description) {
        updateData.description = values.description;
      }

      // Convert toggle to status string
      const newStatus = values.status ? "published" : "draft";
      if (newStatus !== project.status) {
        updateData.status = newStatus;
      }

      if (Object.keys(updateData).length === 0) {
        return true; // No changes to save
      }

      // Make API call
      const response = await fetch(
        `${CONFIG.API.BASE_URL}/api/projects/${project.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.status}`);
      }

      // Reload to reflect changes
      window.location.reload();
      return true;
    } catch (error) {
      return error instanceof Error
        ? error
        : new Error("Failed to update project");
    }
  };

  return (
    <>
      <CardContent>
        <FormRenderer<ProjectFormData>
          fields={formFields}
          defaultValues={{
            name: project.name,
            icon: project.icon,
            description: project.description,
            status: project.status === "published",
          }}
          onSubmit={handleFormSubmit}
          submitButtonProps={{
            children: "Save Changes",
            variant: "default",
            size: "default",
          }}
        />
      </CardContent>

      <CardFooter />
    </>
  );
}

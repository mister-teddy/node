import { useNavigate } from "react-router-dom";
import { CardContent } from "@/components/ui/card";
import Spinner from "@/components/spinner";
import { createProject } from "@/libs/anthropic";
import { useAtom, useAtomValue } from "jotai";
import {
  modelsAtom,
  currentSelectedModelAtom,
  projectsAtom,
} from "@/state/app-ecosystem";
import { useAtomCallback } from "jotai/utils";
import { ModelSelector } from "../../components/model-selector";
import { Sparkles } from "lucide-react";
import FormRenderer, { type FormFieldConfig } from "@/components/form-renderer";
import { useState } from "react";

// Define form interface
interface CreateProjectForm {
  prompt: string;
}

export function CreateNewProjectPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  // Use atoms for models and selected model
  const models = useAtomValue(modelsAtom);
  const [selectedModel, setSelectedModel] = useAtom(currentSelectedModelAtom);

  // Callback to refresh projects list after creation
  const refreshProjects = useAtomCallback((_get, set) => {
    set(projectsAtom);
  });

  // Auto-select first model if none selected
  const effectiveSelectedModel =
    selectedModel || (models.length > 0 ? models[0].id : "");

  // Define form fields configuration
  const formFields: FormFieldConfig<CreateProjectForm>[] = [
    {
      name: "prompt",
      label: "Describe your app",
      type: "text",
      required: true,
      placeholder: "Build a todo app with local storage, drag and drop functionality...",
      description: "Be specific about the features you want. The more detail, the better the result.",
      validation: {
        min: 10,
        custom: (value: string) => {
          if (value.length < 10) {
            return "Please provide a more detailed description (at least 10 characters).";
          }
          return true;
        },
      },
    },
  ];

  const handleSubmit = async (values: CreateProjectForm): Promise<true | Error> => {
    if (isGenerating) return new Error("Already generating project");

    setIsGenerating(true);

    try {
      // Create project directly with prompt - server will handle metadata generation
      const projectResponse = await createProject({
        prompt: values.prompt.trim(),
        model: effectiveSelectedModel,
      });

      const projectId = projectResponse.data.data.id; // Extract project ID from server response

      // Refresh projects list to show the new project
      refreshProjects();

      // Navigate to editor page where code will be generated via streaming
      navigate(`/projects/${projectId}/editor`);

      return true;
    } catch (err) {
      console.error("Failed to create project:", err);
      return new Error("Failed to create project");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <CardContent className="space-y-6 h-full">
      <div className="space-y-6">
        <ModelSelector
          models={models}
          selectedModel={effectiveSelectedModel}
          onModelSelect={setSelectedModel}
          disabled={isGenerating}
        />

        <FormRenderer
          fields={formFields}
          onSubmit={handleSubmit}
          defaultValues={{ prompt: "" }}
          submitButtonProps={{
            children: isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4">
                  <Spinner />
                </div>
                Creating App...
              </div>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Create App
              </>
            ),
            size: "lg",
            className: "w-full h-12",
          }}
        />
      </div>
    </CardContent>
  );
}

export default CreateNewProjectPage;

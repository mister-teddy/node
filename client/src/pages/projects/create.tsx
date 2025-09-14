import { type FC } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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

export function CreateAppGenerator() {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
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

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError("");

    try {
      // Create project directly with prompt - server will handle metadata generation
      const projectResponse = await createProject({
        prompt: prompt.trim(),
        model: effectiveSelectedModel,
      });

      const projectId = projectResponse.data.data.id; // Extract project ID from server response

      // Refresh projects list to show the new project
      refreshProjects();

      // Navigate to editor page where code will be generated via streaming
      navigate(`/projects/${projectId}/editor`);
      setPrompt("");
    } catch (err) {
      setError((err as Error).message || "Failed to create project.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="space-y-6">
        {error && (
          <div className="p-4 text-destructive text-sm bg-destructive/5 border border-destructive/20 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <ModelSelector
            models={models}
            selectedModel={effectiveSelectedModel}
            onModelSelect={setSelectedModel}
            disabled={isGenerating}
          />
        </div>

        <div className="space-y-3">
          <label
            htmlFor="app-prompt"
            className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Describe your app
          </label>
          <Input
            id="app-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleGenerate();
            }}
            placeholder="Build a todo app with local storage, drag and drop functionality..."
            disabled={isGenerating}
            className="text-base h-12"
          />
          <p className="text-xs text-muted-foreground">
            Be specific about the features you want. The more detail, the better
            the result.
          </p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full h-12"
          size="lg"
        >
          {isGenerating ? (
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
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

const CreateNewProjectPage: FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New App</h1>
          <p className="text-muted-foreground mt-2">
            Use AI to generate your app from a simple description
          </p>
        </div>
      </div>
      <CreateAppGenerator />
    </div>
  );
};

export default CreateNewProjectPage;

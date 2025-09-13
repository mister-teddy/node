import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModelSelector } from "@/components/create-app/model-selector";
import Spinner from "@/components/spinner";
import { createProject } from "@/libs/anthropic";
import { useAtom, useAtomValue } from "jotai";
import { modelsAtom, currentSelectedModelAtom, projectsAtom } from "@/state/app-ecosystem";
import { useAtomCallback } from "jotai/utils";

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🪄</span>
          Generate New App
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-4 text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg">
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

        <div>
          <label
            htmlFor="app-prompt"
            className="block text-sm font-medium text-gray-700 mb-2"
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
            placeholder="Build a todo app with local storage..."
            disabled={isGenerating}
            className="text-base"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full"
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
            "Create App"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

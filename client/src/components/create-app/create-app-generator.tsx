import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModelSelector } from "@/components/create-app/model-selector";
import { AppProjectStorage } from "@/libs/app-projects";
import type { AppProject } from "@/types/app-project";
import { useAtom, useAtomValue } from "jotai";
import { modelsAtom, currentSelectedModelAtom } from "@/state/app-ecosystem";

interface CreateAppGeneratorProps {
  onProjectCreated: (project: AppProject) => void;
}

export function CreateAppGenerator({
  onProjectCreated,
}: CreateAppGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");

  // Use atoms for models and selected model
  const models = useAtomValue(modelsAtom);
  const [selectedModel, setSelectedModel] = useAtom(currentSelectedModelAtom);

  // Auto-select first model if none selected
  const effectiveSelectedModel =
    selectedModel || (models.length > 0 ? models[0].id : "");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    try {
      // Create a new project immediately
      const project = AppProjectStorage.create({
        prompt: prompt.trim(),
        model: effectiveSelectedModel,
      });

      // Navigate immediately to the editor page
      onProjectCreated(project);
      setPrompt("");
    } catch (err) {
      setError((err as Error).message || "Failed to create project.");
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
            disabled={false}
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
            disabled={false}
            className="text-base"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim()}
          className="w-full"
          size="lg"
        >
          Create App
        </Button>
      </CardContent>
    </Card>
  );
}

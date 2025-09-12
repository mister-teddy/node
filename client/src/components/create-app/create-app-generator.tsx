import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModelSelector } from "@/components/create-app/model-selector";
import { AppProjectStorage } from "@/libs/app-projects";
import { generateAppWithMetadata } from "@/libs/anthropic";
import { useAtom, useAtomValue } from "jotai";
import { modelsAtom, currentSelectedModelAtom } from "@/state/app-ecosystem";

export function CreateAppGenerator() {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  // Use atoms for models and selected model
  const models = useAtomValue(modelsAtom);
  const [selectedModel, setSelectedModel] = useAtom(currentSelectedModelAtom);

  // Auto-select first model if none selected
  const effectiveSelectedModel =
    selectedModel || (models.length > 0 ? models[0].id : "");

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError("");

    try {
      // Call Rust mini server API to generate app with metadata
      const { sourceCode, metadata } = await generateAppWithMetadata(
        prompt.trim(),
        effectiveSelectedModel
      );

      // Create project with generated metadata and code
      const project = AppProjectStorage.create({
        prompt: prompt.trim(),
        model: effectiveSelectedModel,
      });

      // Update project with generated data
      AppProjectStorage.update({
        id: project.id,
        name: metadata.name,
        description: metadata.description,
        icon: metadata.icon,
        price: metadata.price,
        version: metadata.version,
        sourceCode: sourceCode,
      });

      // Navigate to editor page to begin streaming
      navigate(`/projects/${project.id}/editor`);
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
          {isGenerating ? "Creating App..." : "Create App"}
        </Button>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModelSelector } from "@/components/create-app/model-selector";
import Spinner from "@/components/spinner";
import { generateAppMetadata, createApp } from "@/libs/anthropic";
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
      // Step 1: Generate app metadata first
      const metadata = await generateAppMetadata(
        prompt.trim(),
        effectiveSelectedModel
      );

      // Step 2: Create app in server database with metadata (without source code yet)
      const appResponse = await createApp({
        prompt: prompt.trim(),
        model: effectiveSelectedModel,
        name: metadata.name,
        description: metadata.description,
        version: metadata.version,
        price: metadata.price,
        icon: metadata.icon,
        // source_code will be added later via streaming
      });

      const appId = appResponse.data.data.id; // Extract app ID from server response

      // Navigate to editor page where code will be generated via streaming
      navigate(`/projects/${appId}/editor`);
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

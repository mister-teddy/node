import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { projectByIdAtom } from "@/state/app-ecosystem";
import toast from "react-hot-toast";
import CONFIG from "@/config";

interface NextPromptProps {
  onStreamingUpdate?: (isStreaming: boolean, streamingContent?: string) => void;
}

export function NextPrompt({ onStreamingUpdate }: NextPromptProps) {
  const { id } = useParams<{ id: string }>();
  const project = useAtomValue(projectByIdAtom(id || ""));
  const [modificationPrompt, setModificationPrompt] = useState("");
  const [isModifying, setIsModifying] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  const createNewVersion = async (sourceCode: string, prompt: string) => {
    try {
      const response = await fetch(
        `${CONFIG.API.BASE_URL}/api/projects/${id}/versions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            source_code: sourceCode,
            model: "claude-3-haiku-20240307",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create version: ${response.status}`);
      }

      // Refresh the project to show the new version
      window.location.reload();
      toast.success("Code improved and new version created!");
    } catch (error) {
      console.error("Failed to create version:", error);
      toast.error("Failed to save improved code");
    }
  };

  const handleSubmit = async () => {
    if (!modificationPrompt.trim()) {
      toast.error("Please enter a modification prompt");
      return;
    }

    if (!project?.sourceCode) {
      toast.error("No existing code to modify");
      return;
    }

    try {
      setIsModifying(true);
      setIsStreaming(true);

      // Notify parent component about streaming state
      onStreamingUpdate?.(true, "");

      const response = await fetch(`${CONFIG.API.BASE_URL}/generate/modify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          existing_code: project.sourceCode,
          modification_prompt: modificationPrompt.trim(),
          model: "claude-3-haiku-20240307",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullCode = "";

      const readStream = async (): Promise<void> => {
        const { done, value } = await reader.read();

        if (done) {
          setIsStreaming(false);
          onStreamingUpdate?.(false, fullCode);

          // Create new version with the generated code
          await createNewVersion(fullCode, modificationPrompt.trim());
          setModificationPrompt("");
          return;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("data: ")) {
            const data = trimmedLine.substring(6);

            if (data === "[DONE]") {
              setIsStreaming(false);
              onStreamingUpdate?.(false, fullCode);

              // Create new version with the generated code
              await createNewVersion(fullCode, modificationPrompt.trim());
              setModificationPrompt("");
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "token" && parsed.text) {
                fullCode += parsed.text;
                onStreamingUpdate?.(true, fullCode);
              }
            } catch (e) {
              // Handle non-JSON data as plain text
              if (data && !data.includes("{")) {
                console.log("Status:", data);
              }
            }
          }
        }

        readStream();
      };

      await readStream();
    } catch (error) {
      console.error("Failed to modify code:", error);
      toast.error("Failed to modify code. Please try again.");
      setIsStreaming(false);
      onStreamingUpdate?.(false);
    } finally {
      setIsModifying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <span>Improve it further</span>
          <span className="text-sm text-gray-500 font-normal">
            (Version {project.currentVersion})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label
            htmlFor="modification-prompt"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Describe what you want to change:
          </label>
          <Textarea
            id="modification-prompt"
            placeholder="E.g., Add a dark mode toggle, Fix the button styling, Add a new feature for user profiles..."
            value={modificationPrompt}
            onChange={(e) => setModificationPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[100px] resize-none"
            disabled={isModifying || isStreaming}
          />
        </div>

        {isStreaming && (
          <div className="space-y-2">
            <div className="text-center">
              <p className="text-sm text-blue-600 font-medium mb-2">
                Improving code...
              </p>
              <div className="animate-pulse h-1.5 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button
            onClick={handleSubmit}
            disabled={isModifying || isStreaming || !modificationPrompt.trim()}
            className="space-x-2 w-full"
            variant="outline"
          >
            {isModifying || isStreaming ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {isStreaming ? "Improving..." : "Saving..."}
              </>
            ) : (
              <>
                <span>🪄 Improve </span>
                <kbd className="px-2 py-1 text-xs bg-gray-100 rounded whitespace-nowrap">
                  ⌘ + Enter
                </kbd>
              </>
            )}
          </Button>
        </div>

        {project.versions.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-2">Recent prompts:</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {project.versions
                .slice()
                .sort((a, b) => b.versionNumber - a.versionNumber)
                .slice(0, 3)
                .map((version) => (
                  <button
                    key={version.id}
                    onClick={() => setModificationPrompt(version.prompt)}
                    className="block w-full text-left text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 p-2 rounded transition-colors"
                    disabled={isModifying || isStreaming}
                  >
                    <span className="font-medium">
                      v{version.versionNumber}:
                    </span>{" "}
                    {version.prompt.length > 80
                      ? version.prompt.slice(0, 80) + "..."
                      : version.prompt}
                  </button>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { AppProject } from "@/types/app-project";
import toast from "react-hot-toast";

interface CodeModifierProps {
  project: AppProject;
  onModifyCode: (modificationPrompt: string) => Promise<void>;
  isModifying?: boolean;
}

export function CodeModifier({
  project,
  onModifyCode,
  isModifying = false,
}: CodeModifierProps) {
  const [modificationPrompt, setModificationPrompt] = useState("");

  const handleSubmit = async () => {
    if (!modificationPrompt.trim()) {
      toast.error("Please enter a modification prompt");
      return;
    }

    try {
      await onModifyCode(modificationPrompt.trim());
      setModificationPrompt("");
      toast.success("Code modification started");
    } catch (error) {
      console.error("Failed to modify code:", error);
      toast.error("Failed to start code modification");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          ✏️ Modify Code
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
            disabled={isModifying}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Press <kbd className="px-2 py-1 text-xs bg-gray-100 rounded">⌘ + Enter</kbd> to modify
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setModificationPrompt("")}
              disabled={isModifying || !modificationPrompt.trim()}
            >
              Clear
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isModifying || !modificationPrompt.trim()}
              className="min-w-[120px]"
            >
              {isModifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Modifying...
                </>
              ) : (
                <>
                  🚀 Modify Code
                </>
              )}
            </Button>
          </div>
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
                    disabled={isModifying}
                  >
                    <span className="font-medium">v{version.versionNumber}:</span>{" "}
                    {version.prompt.length > 80
                      ? version.prompt.slice(0, 80) + "..."
                      : version.prompt
                    }
                  </button>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
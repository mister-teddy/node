import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import CONFIG from "@/config";
import { promptState } from "@/state/app-ecosystem";
import { useProjectDetail } from "./project-detail-context";
import { CardContent } from "@/components/ui";
import { useEffect } from "react";
import { miniServer } from "@/libs/mini-server";

export function ProjectEditor() {
  const [prompt, setPrompt] = useAtom(promptState);
  const {
    project,
    isStreamingCode,
    currentCode,
    setCurrentCode,
    setIsStreamingCode,
  } = useProjectDetail();

  const createVersion = async (sourceCode: string, prompt: string) => {
    try {
      const response = await miniServer.POST(
        "/api/projects/{project_id}/versions" as any,
        {
          params: {
            path: { project_id: project.id },
          },
          body: {
            prompt,
            source_code: sourceCode,
            model: project.model,
          },
        } as any,
      );

      if (response.error) {
        throw new Error(`Failed to create version: ${response.error}`);
      }
      toast.success("Code improved and new version created!");
    } catch (error) {
      console.error("Failed to create version:", error);
      toast.error("Failed to save improved code");
    }
  };

  const handleStreamingCodeGeneration = async (isInitial: boolean = false) => {
    if (!project) return;

    let userPrompt: string;
    let apiEndpoint: string;
    let requestBody: unknown;

    if (isInitial) {
      // Initial code generation
      userPrompt = project.originalPrompt || project.name;
      apiEndpoint = `${CONFIG.API.BASE_URL}/generate`;
      requestBody = {
        prompt: `Create a React TypeScript component for: ${userPrompt}`,
      };
    } else {
      // Code modification
      if (!prompt.trim()) {
        toast.error("Please enter a modification prompt");
        return;
      }
      if (
        !project?.versions[project.versions.length - 1]?.sourceCode ||
        !currentCode
      ) {
        toast.error("No existing code to modify");
        return;
      }

      userPrompt = prompt.trim();
      apiEndpoint = `${CONFIG.API.BASE_URL}/generate/modify`;
      requestBody = {
        existing_code:
          project.versions[project.versions.length - 1]?.sourceCode ||
          currentCode,
        modification_prompt: userPrompt,
        model: "claude-3-haiku-20240307",
      };
    }

    try {
      setIsStreamingCode(true);
      setCurrentCode("");

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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
          await createVersion(fullCode, userPrompt);
          if (!isInitial) setPrompt("");
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
              await createVersion(fullCode, userPrompt);
              if (!isInitial) setPrompt("");
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "token" && parsed.text) {
                fullCode += parsed.text;
                setCurrentCode(fullCode);
              }
            } catch {
              // Handle non-JSON data as plain text
              if (data && !data.includes("{")) {
                console.log("Status:", data);
              }
            }
          }
        }

        await readStream();
      };

      await readStream();
    } catch (error) {
      console.error("Code generation failed:", error);
      toast.error("Code generation failed. Please try again.");
    } finally {
      setIsStreamingCode(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleStreamingCodeGeneration(false);
    }
  };

  const isInitialGeneration = project.currentVersion === 0;
  useEffect(() => {
    if (isInitialGeneration) {
      handleStreamingCodeGeneration(true);
    }
  }, [isInitialGeneration]);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  const headerTitle = isInitialGeneration
    ? "Generate Initial Code"
    : "Improve it further";
  const headerSubtitle = isInitialGeneration
    ? `${project.name} - ${project.description}`
    : `(Version ${project.currentVersion})`;
  const buttonText = isInitialGeneration ? "Generate Initial Code" : "Improve";
  const placeholderText = isInitialGeneration
    ? `Generate React TypeScript component for: ${project.originalPrompt || project.name}`
    : "E.g., Add a new feature for user profiles, Fix the button click...";

  return (
    <CardContent>
      <div className="mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>{headerTitle}</span>
          <span className="text-sm text-muted-foreground font-normal">
            {headerSubtitle}
          </span>
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="modification-prompt"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Describe what you want to change:
          </label>
          <Textarea
            id="modification-prompt"
            placeholder={placeholderText}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[100px] resize-none"
            disabled={isStreamingCode}
          />
        </div>

        <div className="flex items-center justify-between">
          <Button
            onClick={() => handleStreamingCodeGeneration(false)}
            disabled={isStreamingCode || !prompt.trim()}
            className="space-x-2 w-full"
            variant="outline"
          >
            {isStreamingCode ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {isStreamingCode ? "Improving..." : "Saving..."}
              </>
            ) : (
              <>
                <span>🪄 {buttonText} </span>
                <kbd className="px-2 py-1 text-xs bg-muted rounded whitespace-nowrap">
                  ⌘ + Enter
                </kbd>
              </>
            )}
          </Button>
        </div>

        {project.versions.length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">
              Recent prompts:
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {project.versions
                .slice()
                .sort((a, b) => b.versionNumber - a.versionNumber)
                .slice(0, 3)
                .map((version) => (
                  <button
                    key={version.id}
                    onClick={() => setPrompt(version.prompt)}
                    className="block w-full text-left text-xs text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded transition-colors"
                    disabled={isStreamingCode}
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
      </div>
    </CardContent>
  );
}

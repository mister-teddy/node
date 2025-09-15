import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import toast from "react-hot-toast";
import CONFIG from "@/config";
import { EditorPrompt } from "./editor-prompt";
import { useProjectDetail } from "./project-detail-context";
import { Zap } from "lucide-react";

export function ProjectEditor() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const {
    project,
    currentCode,
    isStreamingCode,
    setCurrentCode,
    setIsStreamingCode,
  } = useProjectDetail();

  const generateInitialCode = async () => {
    if (!project) return;

    setIsGenerating(true);
    setIsStreamingCode(true);
    setCurrentCode("");
    setGeneratedCode("");

    try {
      // Get the initial prompt from project data
      const initialPrompt = project.originalPrompt || project.name;

      const response = await fetch(`${CONFIG.API.BASE_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `Create a React TypeScript component for: ${initialPrompt}`,
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
          setIsStreamingCode(false);
          setGeneratedCode(fullCode);

          // Create the first version with the generated code
          await createFirstVersion(fullCode, initialPrompt);
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
              setIsStreamingCode(false);
              setGeneratedCode(fullCode);

              // Create the first version with the generated code
              await createFirstVersion(fullCode, initialPrompt);
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

        readStream();
      };

      await readStream();
    } catch (error) {
      console.error("Code generation failed:", error);
      toast.error("Code generation failed. Please try again.");
      setIsStreamingCode(false);
      setIsGenerating(false);
    }
  };

  const createFirstVersion = async (sourceCode: string, prompt: string) => {
    try {
      const response = await fetch(
        `${CONFIG.API.BASE_URL}/api/projects/${project?.id}/versions`,
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
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to create version: ${response.status}`);
      }

      // Refresh the project to show the new version
      window.location.reload();
      toast.success("Code generated and first version created!");
    } catch (error) {
      console.error("Failed to create first version:", error);
      toast.error("Failed to save generated code");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStreamingUpdate = () => {
    // This will be handled by the EditorPrompt component directly updating the context
    // We don't need local state anymore
  };

  if (!project) {
    return (
      <>
        <CardHeader>
          <CardTitle>Project Editor</CardTitle>
          <CardDescription>Loading project details...</CardDescription>
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

  // If project has no versions (current_version === 0), show code generation UI
  if (project.currentVersion === 0) {
    return (
      <>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="text-4xl opacity-80">{project.icon}</div>
            <div>
              <CardTitle>Generate Initial Code</CardTitle>
              <CardDescription>
                {project.name} - {project.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-full">
            <div className="w-full max-w-2xl space-y-6">
              {!isGenerating && !generatedCode && (
                <div className="text-center space-y-6">
                  <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                    This project doesn't have any code yet. Click the button
                    below to generate the initial code using AI.
                  </p>
                  <Button
                    onClick={generateInitialCode}
                    size="lg"
                    className="h-12 px-8 gap-2"
                    disabled={isGenerating}
                  >
                    <Zap className="h-5 w-5" />
                    Generate Initial Code
                  </Button>
                </div>
              )}

              {isStreamingCode && (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Generating code...
                    </p>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-primary rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  {currentCode && (
                    <div className="h-80 border border-primary/20 rounded-lg relative overflow-hidden">
                      <div className="absolute top-2 left-2 z-10 bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        Generating
                      </div>
                      <SyntaxHighlighter
                        language="tsx"
                        style={tomorrow}
                        customStyle={{
                          margin: 0,
                          padding: "2rem 0.75rem 0.75rem",
                          fontSize: "0.75rem",
                          borderRadius: "0.5rem",
                          height: "100%",
                          overflow: "auto",
                          background: "transparent",
                        }}
                        wrapLongLines={true}
                      >
                        {currentCode}
                      </SyntaxHighlighter>
                    </div>
                  )}
                </div>
              )}

              {generatedCode && !isStreamingCode && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                    <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                    Code generated successfully! Saving as first version...
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter />
      </>
    );
  }

  // Project has versions - show editing UI
  return (
    <>
      <CardContent>
        <EditorPrompt onStreamingUpdate={handleStreamingUpdate} />
      </CardContent>
      <CardFooter />
    </>
  );
}

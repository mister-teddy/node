import { useEffect, useState } from "react";
import StyledInput from "@/components/forms/input";
import { generateAppCodeStream } from "@/libs/anthropic";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { generatedCodeState, promptState } from "@/state/app-ecosystem";
import { adaptiveIs3DModeAtom, windowsStatesAtom } from "@/state/3d";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import AppRenderer from "@/components/app-renderer";
import React from "react";

interface AppPreviewErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AppPreviewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  AppPreviewErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AppPreviewErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AppRenderer error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-8 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              App Preview Error
            </h3>
            <p className="text-sm text-red-600 mb-3">
              The generated code contains errors and cannot be previewed.
            </p>
            <details className="text-xs text-red-500">
              <summary className="cursor-pointer hover:text-red-700">
                Show error details
              </summary>
              <pre className="mt-2 p-2 bg-red-100 rounded text-left whitespace-pre-wrap">
                {this.state.error?.message || "Unknown error"}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const CreateAppPage: React.FC = () => {
  const [prompt, setPrompt] = useAtom(promptState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [generatedCode, setGeneratedCode] = useAtom(generatedCodeState);
  const [streamingCode, setStreamingCode] = useState("");
  const setActiveWindows = useSetAtom(windowsStatesAtom);
  const is3DMode = useAtomValue(adaptiveIs3DModeAtom);

  const detectLanguage = (code: string): string => {
    if (
      code.includes("import React") ||
      code.includes("export default") ||
      code.includes(".tsx")
    )
      return "tsx";
    if (
      code.includes("function ") ||
      code.includes("const ") ||
      code.includes("=>")
    )
      return "javascript";
    if (
      code.includes("interface ") ||
      code.includes("type ") ||
      code.includes(": string")
    )
      return "typescript";
    return "javascript";
  };

  useEffect(() => {
    // Open the generated code window when there's generated code
    if (generatedCode) {
      setActiveWindows((prev) => {
        const createdAppWindow = prev.find((w) => w.title === "Create App");
        if (createdAppWindow) {
          // If the window already exists, just bring it to front
          const mockApp = {
            id: "preview-app",
            name: "Generated App Preview",
            source_code: generatedCode,
            description: "Preview of generated app",
            icon: "🪄",
            price: 0,
            version: "1.0.0",
            installed: 1,
          };
          createdAppWindow.biFoldContent = (
            <AppPreviewErrorBoundary>
              <AppRenderer app={mockApp} isPreview={true} />
            </AppPreviewErrorBoundary>
          );
          return [...prev];
        }
        return prev;
      });
    }
  }, [generatedCode, setActiveWindows]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setStatus("Initializing...");
    setStreamingCode("");

    try {
      const code = await generateAppCodeStream(
        prompt,
        (statusUpdate) => {
          setStatus(statusUpdate);
        },
        (token) => {
          setStreamingCode((prev) => prev + token);
        },
      );
      setGeneratedCode(code);
      setStatus("Generation complete!");
      // Clear success status after a short delay
      setTimeout(() => setStatus(""), 2000);
    } catch (err) {
      setError((err as Error).message || "Failed to generate code.");
      setStatus("");
    } finally {
      setLoading(false);
      setStreamingCode("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
        {error && (
          <div className="p-4 text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
            {error}
          </div>
        )}

        {streamingCode || generatedCode ? (
          <div className="flex-1 rounded-lg shadow-lg overflow-hidden max-w-full min-h-0">
            {loading && streamingCode ? (
              <div className="relative h-full overflow-auto">
                <SyntaxHighlighter
                  language={detectLanguage(streamingCode)}
                  style={tomorrow}
                  customStyle={{
                    margin: 0,
                    padding: "1rem",
                    fontSize: "0.875rem",
                    borderRadius: "0.5rem",
                    maxWidth: "100%",
                    overflowX: "auto",
                    height: "100%",
                  }}
                  wrapLongLines={true}
                >
                  {streamingCode}
                </SyntaxHighlighter>
                <span className="absolute bottom-4 right-4 inline-block w-2 h-5 bg-gray-200 animate-pulse"></span>
              </div>
            ) : (
              <div className="h-full flex overflow-hidden">
                <SyntaxHighlighter
                  language={detectLanguage(generatedCode)}
                  style={tomorrow}
                  customStyle={{
                    margin: 0,
                    padding: "1rem",
                    fontSize: "0.875rem",
                    borderRadius: "0.5rem",
                    maxWidth: "100%",
                    overflowX: "auto",
                    height: "100%",
                  }}
                  wrapLongLines={true}
                >
                  {generatedCode}
                </SyntaxHighlighter>
                {!is3DMode && !!generatedCode && (
                  <div className="flex-none basis-1/2">
                    <AppPreviewErrorBoundary>
                      <AppRenderer
                        app={{
                          id: "preview-app",
                          name: "Generated App Preview",
                          source_code: generatedCode,
                          description: "Preview of generated app",
                          icon: "🪄",
                          price: 0,
                          version: "1.0.0",
                          installed: 1,
                        }}
                        isPreview={true}
                      />
                    </AppPreviewErrorBoundary>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-500 text-center">
              <div className="text-lg mb-2">🪄</div>
              <p>Enter a prompt to generate code</p>
            </div>
          </div>
        )}
      </div>

      {/* Prompt input bar */}
      <div className="w-full px-4 py-3 bg-gray-100 border-t border-gray-200 flex items-center gap-2 flex-none">
        <StyledInput
          as="input"
          className="flex-1 h-10 px-3 rounded-xl border border-gray-300 bg-white text-base focus:border-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Build anything"
          value={`${prompt}${status ? ` [${status}]` : ""}`}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPrompt(e.target.value)
          }
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" && !loading) handleGenerate();
          }}
          disabled={loading}
          type="text"
          autoComplete="off"
        />
        <button
          className={`w-10 h-10 rounded-full flex items-center justify-center bg-white shadow transition ${
            loading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
          }`}
          onClick={handleGenerate}
          disabled={loading}
          aria-label={loading ? "Generating..." : "Send"}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default CreateAppPage;

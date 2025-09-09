import { useEffect, useState } from "react";
import StyledInput from "@/components/forms/input";
import { generateAppCodeStream } from "@/libs/anthropic";
import { useAtom, useSetAtom } from "jotai";
import { generatedCodeState, promptState } from "@/state/app-ecosystem";
import { windowsStatesAtom } from "@/state/3d";
import StatusIndicator from "@/components/status-indicator";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CreateAppPage: React.FC = () => {
  const [prompt, setPrompt] = useAtom(promptState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [generatedCode, setGeneratedCode] = useAtom(generatedCodeState);
  const [streamingCode, setStreamingCode] = useState("");
  const setActiveWindows = useSetAtom(windowsStatesAtom);

  const detectLanguage = (code: string): string => {
    if (code.includes('import React') || code.includes('export default') || code.includes('.tsx')) return 'tsx';
    if (code.includes('function ') || code.includes('const ') || code.includes('=>')) return 'javascript';
    if (code.includes('interface ') || code.includes('type ') || code.includes(': string')) return 'typescript';
    return 'javascript';
  };

  useEffect(() => {
    // Open the generated code window when there's generated code
    if (generatedCode) {
      setActiveWindows((prev) => {
        const createdAppWindow = prev.find((w) => w.title === "Create App");
        if (createdAppWindow) {
          // If the window already exists, just bring it to front
          createdAppWindow.biFoldContent = (
            <div dangerouslySetInnerHTML={{ __html: generatedCode }}></div>
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
          setStreamingCode(prev => prev + token);
        }
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
        {error ? (
          <div className="p-4 text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
            {error}
          </div>
        ) : loading || status ? (
          <div className="flex-shrink-0">
            <StatusIndicator status={status} isLoading={loading} />
          </div>
        ) : null}
        
        {(streamingCode || generatedCode) ? (
          <div className="flex-1 rounded-lg shadow-lg overflow-hidden max-w-full min-h-0">
            {loading && streamingCode ? (
              <div className="relative h-full overflow-auto">
                <SyntaxHighlighter
                  language={detectLanguage(streamingCode)}
                  style={tomorrow}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '0.875rem',
                    borderRadius: '0.5rem',
                    maxWidth: '100%',
                    overflowX: 'auto',
                    height: '100%'
                  }}
                  wrapLongLines={true}
                >
                  {streamingCode}
                </SyntaxHighlighter>
                <span className="absolute bottom-4 right-4 inline-block w-2 h-5 bg-gray-200 animate-pulse"></span>
              </div>
            ) : (
              <div className="h-full overflow-auto">
                <SyntaxHighlighter
                  language={detectLanguage(generatedCode)}
                  style={tomorrow}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '0.875rem',
                    borderRadius: '0.5rem',
                    maxWidth: '100%',
                    overflowX: 'auto',
                    height: '100%'
                  }}
                  wrapLongLines={true}
                >
                  {generatedCode}
                </SyntaxHighlighter>
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
      <div className="w-full px-4 py-3 bg-[#e3e3e3] border-t border-gray-200 flex items-center gap-2 flex-none">
        <StyledInput
          as="input"
          className="flex-1 h-10 px-3 rounded-xl border border-gray-300 bg-white text-base focus:border-blue-400 transition"
          placeholder="Build anything"
          value={prompt}
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

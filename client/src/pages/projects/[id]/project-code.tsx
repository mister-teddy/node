import { Button } from "@/components/ui";
import { Copy } from "lucide-react";
import toast from "react-hot-toast";
import SyntaxHighlighter from "react-syntax-highlighter";
import {
  atomOneLight,
  atomOneDark,
} from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useProjectDetail } from "./project-detail-context";

export default function ProjectCode() {
  const { isStreamingCode, currentCode } = useProjectDetail();

  return (
    <div className="relative">
      {currentCode && (
        <Button
          className="absolute bottom-3 right-3 z-10 gap-2"
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(currentCode);
              toast.success("Code copied to clipboard!");
            } catch (error) {
              console.error("Failed to copy:", error);
              toast.error("Failed to copy code");
            }
          }}
        >
          <Copy className="h-4 w-4" />
          Copy
        </Button>
      )}
      {isStreamingCode && (
        <div className="absolute -top-3 left-3 z-10 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          Live update
        </div>
      )}
      <SyntaxHighlighter
        language="javascript"
        style={
          typeof window !== "undefined" &&
          document.documentElement.classList.contains("dark")
            ? atomOneDark
            : atomOneLight
        }
        customStyle={{
          margin: 0,
          padding: "1rem",
          fontSize: "0.75rem",
          borderRadius: "0.5rem",
          height: "100%",
          overflow: "auto",
          background: "transparent",
        }}
        wrapLongLines={true}
        showLineNumbers={false}
      >
        {currentCode}
      </SyntaxHighlighter>
    </div>
  );
}

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface AppPreviewErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class AppPreviewErrorBoundary extends React.Component<
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
        <div className="flex items-center justify-center h-full p-8">
          <Card className="w-full max-w-md border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6 text-center">
              <div className="mb-4">
                <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                App Preview Error
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                The generated code contains errors and cannot be previewed.
              </p>
              <details className="text-xs text-muted-foreground text-left">
                <summary className="cursor-pointer hover:text-foreground transition-colors">
                  Show error details
                </summary>
                <pre className="mt-2 p-3 bg-muted rounded text-xs whitespace-pre-wrap overflow-auto max-h-32">
                  {this.state.error?.message || "Unknown error"}
                </pre>
              </details>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

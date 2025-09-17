import type { AppTable } from "@/types";
import React, {
  memo,
  useMemo,
  useState,
  type ComponentType,
  type FunctionComponent,
} from "react";
import { createPortal } from "react-dom";
import CloseIcon from "./icons/close";
import FullscreenIcon from "./icons/fullscreen";
import { adaptiveIs3DModeAtom } from "@/state/3d";
import { useAtomValue, useSetAtom } from "jotai";
import { hostAPI } from "@/libs/host-api";
import { promptState } from "@/state/app-ecosystem";
import { Button } from "./ui/button";

// Import all UI components from components/ui/*
import * as ui from "./ui";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface AppRendererProps {
  app: AppTable;
  component?: ComponentType<{ app: AppTable; ui: typeof ui }>;
}

const AppRenderer: FunctionComponent<AppRendererProps> = ({
  app,
  component,
}) => {
  const is3D = useAtomValue(adaptiveIs3DModeAtom);
  const [fullscreen, setFullscreen] = useState(false);

  // Compose context to pass to AppComponent
  const context = { app, React, ui, toast, hostAPI };

  const DynamicComponent = useMemo(() => {
    if (app.source_code) {
      // Convert source code string to a React component factory, then call it to get the component
      const factory = new Function(app.source_code) as () => FunctionComponent<
        typeof context
      >;
      return factory();
    }
    return component!;
  }, [app, component]);

  const content = <DynamicComponent {...context} />;

  // Always show buttons, but handle different layouts for fullscreen vs normal mode
  if (is3D) {
    // In 3D mode, don't show fullscreen controls
    return content;
  }

  // Shared fullscreen toggle overlay
  const fullscreenToggle = (
    <div className="absolute top-4 right-4 flex gap-2">
      <Button
        variant="secondary"
        size="icon"
        onClick={() => {
          if (document.startViewTransition) {
            document.startViewTransition(() => setFullscreen((f) => !f));
          } else {
            setFullscreen((f) => !f);
          }
        }}
        title={fullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {fullscreen ? <CloseIcon /> : <FullscreenIcon />}
      </Button>
    </div>
  );

  const contentWithContainer = (
    <div className="w-full h-full relative">
      {content}
      {fullscreenToggle}
    </div>
  );

  if (fullscreen) {
    return createPortal(
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {contentWithContainer}
      </div>,
      document.body,
    );
  }

  return contentWithContainer;
};

const MemoizedAppRenderer = memo(AppRenderer, (prev, next) => {
  return prev.app.id === next.app.id;
});

class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    setPrompt: (prompt: string) => void;
    onFix?: () => void;
  },
  { hasError: boolean; errorMessage: string | null }
> {
  constructor(props: {
    children: React.ReactNode;
    setPrompt: (prompt: string) => void;
  }) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center max-w-md mx-auto">
            <div className="text-6xl mb-4">🚧</div>
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
              {`App Execution Error`}
            </h2>
            <p className="text-muted-foreground mb-4">
              {this.state.errorMessage}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                this.props.setPrompt(`Fix ${this.state.errorMessage}`);
                this.props.onFix?.();
              }}
            >
              Fix this error
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppRendererWithBoundary: FunctionComponent<AppRendererProps> = (
  props,
) => {
  const navigate = useNavigate();
  const setPrompt = useSetAtom(promptState);
  return (
    <ErrorBoundary
      setPrompt={setPrompt}
      onFix={() => navigate(`/projects/${props.app.id}/editor`)}
    >
      <MemoizedAppRenderer {...props} />
    </ErrorBoundary>
  );
};

export default AppRendererWithBoundary;

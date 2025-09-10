import type { AppTable } from "@/types";
import React, {
  createElement,
  memo,
  useMemo,
  type ComponentType,
  type FunctionComponent,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import CloseIcon from "./icons/close";
import { adaptiveIs3DModeAtom } from "@/state/3d";
import { useAtomValue } from "jotai";
import { hostAPI } from "@/libs/host-api";

interface AppRendererProps {
  app: AppTable;
  component?: ComponentType<{ app: AppTable }>;
}

const CloseButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => {
        navigate(-1);
      }}
      className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
    >
      <CloseIcon />
    </button>
  );
};

const AppRenderer: FunctionComponent<AppRendererProps> = ({
  app,
  component,
}) => {
  const is3D = useAtomValue(adaptiveIs3DModeAtom);

  // Execute JavaScript code if provided, otherwise use component prop
  const DynamicComponent = useMemo(() => {
    if (app.source_code) {
      try {
        // Create a safe execution context
        const createAppComponent = new Function(
          "React",
          "app",
          "hostAPI",
          app.source_code
        );

        // Execute the code and get the component
        const AppComponent = createAppComponent(React, app, hostAPI);

        // Return a wrapper component that passes the right props
        return () => AppComponent({ React, app, hostAPI });
      } catch (error) {
        console.error("Failed to execute app source code:", error);
        return () =>
          React.createElement(
            "div",
            {
              className: "flex items-center justify-center min-h-screen p-8",
            },
            React.createElement(
              "div",
              {
                className: "text-center",
              },
              React.createElement("div", { className: "text-6xl mb-4" }, "⚠️"),
              React.createElement(
                "h2",
                {
                  className: "text-xl font-bold text-red-600 mb-2",
                },
                "App Execution Error"
              ),
              React.createElement(
                "p",
                {
                  className: "text-gray-600",
                },
                `Failed to execute ${app.name}: ${
                  error instanceof Error ? error.message : String(error)
                }`
              )
            )
          );
      }
    }

    // Fallback to component prop if no source code
    return component ? () => createElement(component, { app }) : null;
  }, [app, component]);

  if (!DynamicComponent) {
    return React.createElement(
      "div",
      {
        className: "flex items-center justify-center min-h-screen p-8",
      },
      React.createElement(
        "div",
        {
          className: "text-center",
        },
        React.createElement("div", { className: "text-6xl mb-4" }, "📱"),
        React.createElement(
          "h2",
          {
            className: "text-xl font-bold text-gray-800 mb-2",
          },
          "App Not Available"
        ),
        React.createElement(
          "p",
          {
            className: "text-gray-600",
          },
          `${app.name} could not be loaded`
        )
      )
    );
  }

  const content = React.createElement(DynamicComponent);

  if (is3D) {
    return content;
  }

  return createPortal(
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {content}
      <CloseButton />
    </div>,
    document.body
  );
};

export default memo(AppRenderer, (prev, next) => {
  return prev.app.id === next.app.id;
});

import { useNavigate } from "react-router-dom";
import type { AppTable } from "@/types";

interface AppErrorFallbackProps {
  error: Error;
  app?: AppTable;
}

export const AppErrorFallback = ({ error, app }: AppErrorFallbackProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-foreground mb-4">App Failed to Load</h2>
        <p className="text-muted-foreground mb-2">
          {app ? (
            <>Unable to load <strong>{app.name}</strong></>
          ) : (
            "An error occurred while loading the application"
          )}
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          {error.message || "The app could not be found or failed to load"}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
          >
            Go Back
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
};
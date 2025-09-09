import React from "react";
import Spinner from "./spinner";

interface StatusIndicatorProps {
  status: string;
  isLoading: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, isLoading }) => {
  if (!isLoading && !status) return null;

  return (
    <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      {isLoading && <Spinner />}
      <span className="text-blue-700 text-sm font-medium">{status}</span>
    </div>
  );
};

export default StatusIndicator;
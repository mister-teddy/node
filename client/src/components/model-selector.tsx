import { type FC } from "react";
import type { ModelInfo } from "@/types";
import { StarRating } from "./star-rating";
import { Badge } from "./ui/badge";

interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
  disabled?: boolean;
}

export const ModelSelector: FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelSelect,
  disabled = false,
}) => {
  if (models.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Loading models...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-foreground mb-3">
        Choose AI Model
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {models.map((model) => {
          const isSelected = selectedModel === model.id;

          return (
            <button
              key={model.id}
              type="button"
              onClick={() => onModelSelect(model.id)}
              disabled={disabled}
              className={`
                relative p-4 border-2 rounded-xl overflow-hidden text-left transition-all
                ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-border/80 hover:shadow-sm"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <div className="flex items-start justify-between h-full">
                <div className="flex gap-3 min-w-0 flex-1 h-full">
                  <span className="text-2xl flex-shrink-0">{model.icon}</span>
                  <div className="min-w-0 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-medium text-card-foreground text-sm">
                        {model.name}
                      </h3>
                      <div className="mb-1 flex items-start gap-2">
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {model.description}
                        </p>
                        {model.special_label && (
                          <Badge color="red">{model.special_label}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Rating bars */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Power</span>
                        <StarRating rating={model.power} size="sm" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Cost</span>
                        <StarRating rating={model.cost} size="sm" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Speed</span>
                        <StarRating rating={model.speed} size="sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

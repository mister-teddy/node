import { Star } from "lucide-react";
import { type FC } from "react";

interface StarRatingProps {
  rating: number; // 1-5
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const StarRating: FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = "sm",
  className = "",
}) => {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={`flex items-center ${sizeClasses[size]} ${className}`}>
      {Array.from({ length: maxRating }, (_, i) => {
        const starIndex = i + 1;
        const isGolden = starIndex <= rating;
        return (
          <span key={i} className={`transition-all duration-200`}>
            <Star
              size={14}
              fill={isGolden ? "#f59e0b" : "#d1d5db"}
              color={isGolden ? "#f59e0b" : "#d1d5db"}
            />
          </span>
        );
      })}
    </div>
  );
};

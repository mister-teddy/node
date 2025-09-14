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
          <span
            key={i}
            className={`transition-all duration-200 ${isGolden ? "" : "grayscale opacity-40"}`}
            style={{
              textShadow: isGolden ? "0 0 4px rgba(245, 158, 11, 0.6)" : "none",
              filter: isGolden ? "drop-shadow(0 1px 2px rgba(245, 158, 11, 0.3))" : "none",
            }}
          >
            ⭐️
          </span>
        );
      })}
    </div>
  );
};

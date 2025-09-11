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
        const starIndex = i + 1; // Convert 0-based index to 1-based
        const isGolden = starIndex <= rating;
        return (
          <span
            key={i}
            className={isGolden ? "" : "grayscale"}
            style={{
              textShadow: isGolden ? "0 0 2px rgba(245, 158, 11, 0.5)" : "none",
            }}
          >
            ⭐️
          </span>
        );
      })}
    </div>
  );
};

import clsx from "clsx";

interface GridRendererProps<T> {
  items: T[];
  render: (item: T) => React.ReactNode;
  onClick?: (item: T, e: React.MouseEvent) => void;
  keyExtractor: (item: T) => string | number;
  className?: string;
}

export default function GridRenderer<T>({
  items,
  render,
  onClick,
  keyExtractor,
  className = "flex-1 min-w-0 box-border overflow-y-auto h-full",
}: GridRendererProps<T>) {
  // Handle empty state gracefully
  if (items.length === 0) {
    return (
      <main className={className}>
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          <p className="text-sm">No items to display</p>
        </div>
      </main>
    );
  }

  return (
    <main className={className}>
      <div className="w-full max-w-7xl mx-auto">
        {/* Responsive CSS Grid: Single column on mobile, multiple columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {items.map((item) => (
            <div
              key={keyExtractor(item)}
              className={clsx(
                "group relative",
                "bg-card rounded-lg border border-border/50",
                "transition-all duration-200 ease-in-out",
                "hover:border-border hover:shadow-sm",
                onClick && [
                  "cursor-pointer",
                  "hover:bg-accent/30",
                  "active:scale-[0.998]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                ],
              )}
              onClick={(e) => onClick?.(item, e)}
              tabIndex={onClick ? 0 : undefined}
              role={onClick ? "button" : undefined}
              onKeyDown={(e) => {
                if (onClick && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onClick(item, e as any);
                }
              }}
            >
              <div className="p-4">{render(item)}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

import clsx from "clsx";
import { useMemo } from "react";

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
  className = "flex-1 px-8 pb-8 min-w-0 box-border overflow-y-auto h-full",
}: GridRendererProps<T>) {
  // Split items into 3 chunks, memoized
  const itemChunks = useMemo(() => {
    const chunkSize = Math.ceil(items.length / 3);
    return [
      items.slice(0, chunkSize),
      items.slice(chunkSize, chunkSize * 2),
      items.slice(chunkSize * 2),
    ];
  }, [items]);

  return (
    <main className={className}>
      <section className="w-full grid grid-cols-1 xl:grid-cols-3 xl:gap-10">
        {itemChunks.map((chunk, i) => (
          <div
            key={i}
            className="flex flex-col border-b border-border xl:border-none last:border-none"
          >
            {chunk.map((item) => (
              <div
                key={keyExtractor(item)}
                className={clsx(
                  "border-b border-border last:border-none",
                  onClick && "cursor-pointer",
                )}
                onClick={(e) => onClick?.(item, e)}
              >
                {render(item)}
              </div>
            ))}
          </div>
        ))}
      </section>
    </main>
  );
}

import { useMemo } from "react";

interface GridRendererProps<T> {
  items: T[];
  render: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  className?: string;
}

export default function GridRenderer<T>({
  items,
  render,
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
            className="flex flex-col border-b border-gray-200 xl:border-none last:border-none"
          >
            {chunk.map((item) => (
              <div
                key={keyExtractor(item)}
                className="border-b border-gray-200 last:border-none"
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
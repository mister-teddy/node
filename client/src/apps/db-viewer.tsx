import type { AppProps } from "@/types";
import { hostAPI } from "@/libs/host-api";

interface Collection {
  name: string;
  count: number;
}

interface Document {
  id: string;
  collection: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export default function DBViewer({ React }: AppProps) {
  const [collections, setCollections] = React.useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] =
    React.useState<string>("");
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingData, setLoadingData] = React.useState(false);
  const [error, setError] = React.useState<string>("");

  const loadDocuments = React.useCallback(async (collection: string) => {
    try {
      setLoadingData(true);
      setError("");

      const data = await hostAPI.db.list(collection, 100);
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Failed to load documents:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load documents"
      );
      setDocuments([]);
    } finally {
      setLoadingData(false);
    }
  }, []);

  const loadCollections = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Get collections from the database API
      const collectionNames = await hostAPI.db.collections();

      const collectionsWithCounts: Collection[] = [];

      for (const collectionName of collectionNames) {
        try {
          const countData = await hostAPI.db.list(collectionName, 1);

          collectionsWithCounts.push({
            name: collectionName,
            count: countData.count || 0,
          });
        } catch {
          collectionsWithCounts.push({
            name: collectionName,
            count: 0,
          });
        }
      }

      setCollections(collectionsWithCounts);

      // Auto-select first collection if available
      if (collectionsWithCounts.length > 0 && !selectedCollection) {
        setSelectedCollection(collectionsWithCounts[0].name);
      }
    } catch (error) {
      console.error("Failed to load collections:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load collections"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCollection]);

  // Load all collections on mount
  React.useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // Load documents when collection changes
  React.useEffect(() => {
    if (selectedCollection) {
      loadDocuments(selectedCollection);
    }
  }, [selectedCollection, loadDocuments]);

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === "string" && value.length > 100) {
      return value.substring(0, 100) + "...";
    }
    return String(value);
  };

  const getColumns = (): string[] => {
    if (documents.length === 0) return [];

    const allKeys = new Set<string>();
    documents.forEach((doc: Document) => {
      Object.keys(doc).forEach((key) => allKeys.add(key));
      if (doc.data && typeof doc.data === "object") {
        Object.keys(doc.data).forEach((key) => allKeys.add(`data.${key}`));
      }
    });

    return Array.from(allKeys).sort();
  };

  const getValue = (doc: Document, column: string): unknown => {
    if (column.startsWith("data.")) {
      const dataKey = column.substring(5);
      return doc.data?.[dataKey];
    }
    return doc[column as keyof Document];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-50 flex overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-72 bg-white/80 backdrop-blur-md shadow-md border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-2">🗃️</span>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              DB Viewer
            </h1>
          </div>
          <button
            onClick={loadCollections}
            className="w-full bg-black hover:bg-neutral-800 focus:bg-neutral-900 text-white py-2 px-4 shadow-sm transition-colors text-sm font-medium active:scale-95 focus:outline-none focus:ring-2 focus:ring-black"
          >
            <span className="mr-2">🔄</span> Refresh
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Collections ({collections.length})
            </h2>

            {collections.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No collections found</p>
                <p className="text-xs mt-2">Create some data first!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {collections.map((collection: Collection) => (
                  <button
                    key={collection.name}
                    onClick={() => setSelectedCollection(collection.name)}
                    className={`w-full text-left px-3 py-2 transition-colors duration-100 shadow-sm ${
                      selectedCollection === collection.name
                        ? "bg-gray-100/80 text-gray-900 border-l-4 border-gray-400"
                        : "hover:bg-gray-100/80 text-gray-700"
                    }`}
                  >
                    <div className="font-medium tracking-tight">
                      {collection.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {collection.count} document
                      {collection.count !== 1 ? "s" : ""}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
                {selectedCollection
                  ? `${selectedCollection}`
                  : "Select a collection"}
              </h2>
              {selectedCollection && (
                <p className="text-sm text-gray-500">
                  {documents.length} document{documents.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8">
          {error && (
            <div className="bg-red-50/80 border border-red-200 p-4 mb-4 shadow-sm">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {!selectedCollection ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Select a Collection
              </h3>
              <p className="text-gray-500">
                Choose a collection from the sidebar to view its data
              </p>
            </div>
          ) : loadingData ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading data...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No Data Found
              </h3>
              <p className="text-gray-500">The selected collection is empty</p>
            </div>
          ) : (
            <div className="bg-white/90 shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50/80 sticky top-0">
                      <tr>
                        {getColumns().map((column) => (
                          <th
                            key={column}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white/80 divide-y divide-gray-100">
                      {documents.map((doc: Document, index: number) => (
                        <tr
                          key={doc.id}
                          className={
                            index % 2 === 0 ? "bg-white/80" : "bg-gray-50/80"
                          }
                        >
                          {getColumns().map((column) => (
                            <td
                              key={column}
                              className="px-4 py-3 text-gray-900 max-w-xs"
                            >
                              <div
                                className="truncate text-xs bg-gray-100/60 px-2 py-1"
                                title={formatValue(getValue(doc, column))}
                              >
                                {formatValue(getValue(doc, column))}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{Column, Pool, Row, Sqlite, SqlitePool};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct Database {
    pool: Pool<Sqlite>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Document {
    pub id: String,
    pub collection: String,
    pub data: Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDocumentRequest {
    pub data: Value,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDocumentRequest {
    pub data: Value,
}

#[derive(Debug, Serialize)]
pub struct QueryResult {
    pub documents: Vec<Document>,
    pub count: i64,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self, sqlx::Error> {
        let pool = SqlitePool::connect(database_url).await?;

        // Create documents table if it doesn't exist
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                collection TEXT NOT NULL,
                data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            "#,
        )
        .execute(&pool)
        .await?;

        // Create indexes for better performance
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_collection ON documents(collection)")
            .execute(&pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_created_at ON documents(created_at)")
            .execute(&pool)
            .await?;

        let database = Database { pool };

        // Seed default apps if none exist
        database.seed_default_apps().await?;

        Ok(database)
    }

    pub async fn seed_default_apps(&self) -> Result<(), sqlx::Error> {
        // Check if any apps already exist
        let existing_apps = self.list_documents("apps", Some(1), Some(0)).await?;

        if existing_apps.documents.is_empty() {
            tracing::info!("No apps found, seeding default apps");

            let default_apps = vec![
                serde_json::json!({
                    "id": "notepad",
                    "name": "Notepad",
                    "description": "A simple notepad for quick notes and ideas.",
                    "version": "1.0.0",
                    "price": 0,
                    "icon": "📝",
                    "installed": 1,
                    "source_code": r#"function Notepad({ React, app, hostAPI }) {
  const [note, setNote] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadNote = async () => {
      try {
        const documents = await hostAPI.db.list("notepad_settings");
        const noteDoc = documents.documents.find((doc) => doc.data.key === "note");
        if (noteDoc && typeof noteDoc.data.value === "string") {
          setNote(noteDoc.data.value);
        }
      } catch (error) {
        console.error("Failed to load note:", error);
      } finally {
        setLoading(false);
      }
    };
    loadNote();
  }, []);

  const saveNote = async (value) => {
    setNote(value);
    try {
      const documents = await hostAPI.db.list("notepad_settings");
      const existingDoc = documents.documents.find((doc) => doc.data.key === "note");
      if (existingDoc) {
        await hostAPI.db.update("notepad_settings", existingDoc.id, { key: "note", value });
      } else {
        await hostAPI.db.create("notepad_settings", { key: "note", value });
      }
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  return React.createElement("div", {
    className: "min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center font-sans"
  },
    React.createElement("div", {
      className: "bg-white/90 backdrop-blur-lg shadow-2xl rounded-3xl p-10 w-full max-w-lg border border-gray-100"
    },
      React.createElement("div", { className: "flex items-center justify-center mb-6" },
        React.createElement("span", { className: "text-3xl mr-2" }, "📝"),
        React.createElement("h1", { className: "font-bold text-3xl tracking-tight text-gray-900" }, "Notepad")
      ),
      React.createElement("textarea", {
        value: note,
        onChange: (e) => saveNote(e.currentTarget.value),
        rows: 1,
        style: { minHeight: "120px", maxHeight: "320px", overflow: "auto" },
        className: "w-full text-base font-mono bg-gray-50 border border-gray-300 rounded-2xl p-5 resize-y text-gray-900 outline-none shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition",
        placeholder: loading ? "Loading..." : "Type your notes here...",
        disabled: loading,
        autoFocus: true
      }),
      React.createElement("div", { className: "flex justify-end mt-4" },
        React.createElement("span", { className: "text-xs text-gray-400" }, "Saved automatically")
      )
    )
  );
}

return Notepad;"#
                }),
                serde_json::json!({
                    "id": "db-viewer",
                    "name": "DB Viewer",
                    "description": "Browse and manage your database collections and documents.",
                    "version": "1.0.0",
                    "price": 0,
                    "icon": "🗃️",
                    "installed": 1,
                    "source_code": r#"function DBViewer({ React, app, hostAPI }) {
  const [collections, setCollections] = React.useState([]);
  const [selectedCollection, setSelectedCollection] = React.useState("");
  const [documents, setDocuments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingData, setLoadingData] = React.useState(false);
  const [error, setError] = React.useState("");

  const loadDocuments = React.useCallback(async (collection) => {
    try {
      setLoadingData(true);
      setError("");

      const data = await hostAPI.db.list(collection, 100);
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Failed to load documents:", error);
      setError(error instanceof Error ? error.message : "Failed to load documents");
      setDocuments([]);
    } finally {
      setLoadingData(false);
    }
  }, []);

  const loadCollections = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const collectionNames = await hostAPI.db.collections();
      const collectionsWithCounts = [];

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

      if (collectionsWithCounts.length > 0 && !selectedCollection) {
        setSelectedCollection(collectionsWithCounts[0].name);
      }
    } catch (error) {
      console.error("Failed to load collections:", error);
      setError(error instanceof Error ? error.message : "Failed to load collections");
    } finally {
      setLoading(false);
    }
  }, [selectedCollection]);

  React.useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  React.useEffect(() => {
    if (selectedCollection) {
      loadDocuments(selectedCollection);
    }
  }, [selectedCollection, loadDocuments]);

  const formatValue = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === "string" && value.length > 100) {
      return value.substring(0, 100) + "...";
    }
    return String(value);
  };

  const getColumns = () => {
    if (documents.length === 0) return [];
    const allKeys = new Set();
    documents.forEach((doc) => {
      Object.keys(doc).forEach((key) => allKeys.add(key));
      if (doc.data && typeof doc.data === "object") {
        Object.keys(doc.data).forEach((key) => allKeys.add(`data.${key}`));
      }
    });
    return Array.from(allKeys).sort();
  };

  const getValue = (doc, column) => {
    if (column.startsWith("data.")) {
      const dataKey = column.substring(5);
      return doc.data?.[dataKey];
    }
    return doc[column];
  };

  if (loading) {
    return React.createElement("div", {
      className: "min-h-screen bg-gray-50 flex items-center justify-center"
    },
      React.createElement("div", { className: "text-center" },
        React.createElement("div", {
          className: "animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"
        }),
        React.createElement("p", { className: "mt-4 text-gray-600" }, "Loading database...")
      )
    );
  }

  return React.createElement("div", {
    className: "min-h-screen bg-gradient-to-br from-gray-100 to-gray-50 flex overflow-hidden"
  },
    React.createElement("div", {
      className: "w-72 bg-white/80 backdrop-blur-md shadow-md border-r border-gray-200 flex flex-col"
    },
      React.createElement("div", { className: "p-5 border-b border-gray-200" },
        React.createElement("div", { className: "flex items-center mb-4" },
          React.createElement("span", { className: "text-2xl mr-2" }, "🗃️"),
          React.createElement("h1", {
            className: "text-xl font-semibold text-gray-900 tracking-tight"
          }, "DB Viewer")
        ),
        React.createElement("button", {
          onClick: loadCollections,
          className: "w-full bg-black hover:bg-neutral-800 focus:bg-neutral-900 text-white py-2 px-4 shadow-sm transition-colors text-sm font-medium active:scale-95 focus:outline-none focus:ring-2 focus:ring-black"
        },
          React.createElement("span", { className: "mr-2" }, "🔄"),
          " Refresh"
        )
      ),
      React.createElement("div", { className: "flex-1 overflow-y-auto" },
        React.createElement("div", { className: "p-4" },
          React.createElement("h2", {
            className: "text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3"
          }, `Collections (${collections.length})`),
          collections.length === 0 ?
            React.createElement("div", { className: "text-center py-8 text-gray-400" },
              React.createElement("p", null, "No collections found"),
              React.createElement("p", { className: "text-xs mt-2" }, "Create some data first!")
            ) :
            React.createElement("div", { className: "space-y-1" },
              collections.map((collection) =>
                React.createElement("button", {
                  key: collection.name,
                  onClick: () => setSelectedCollection(collection.name),
                  className: `w-full text-left px-3 py-2 transition-colors duration-100 shadow-sm ${
                    selectedCollection === collection.name
                      ? "bg-gray-100/80 text-gray-900 border-l-4 border-gray-400"
                      : "hover:bg-gray-100/80 text-gray-700"
                  }`
                },
                  React.createElement("div", {
                    className: "font-medium tracking-tight"
                  }, collection.name),
                  React.createElement("div", { className: "text-xs text-gray-500" },
                    `${collection.count} document${collection.count !== 1 ? "s" : ""}`
                  )
                )
              )
            )
        )
      )
    ),
    React.createElement("div", { className: "flex-1 flex flex-col overflow-hidden" },
      React.createElement("div", {
        className: "bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 px-6 py-4"
      },
        React.createElement("div", { className: "flex items-center justify-between" },
          React.createElement("div", null,
            React.createElement("h2", {
              className: "text-lg font-semibold text-gray-900 tracking-tight"
            }, selectedCollection ? `${selectedCollection}` : "Select a collection"),
            selectedCollection &&
              React.createElement("p", { className: "text-sm text-gray-500" },
                `${documents.length} document${documents.length !== 1 ? "s" : ""}`
              )
          )
        )
      ),
      React.createElement("div", { className: "flex-1 p-8" },
        error &&
          React.createElement("div", {
            className: "bg-red-50/80 border border-red-200 p-4 mb-4 shadow-sm"
          },
            React.createElement("div", { className: "flex items-center" },
              React.createElement("span", { className: "text-red-500 mr-2" }, "⚠️"),
              React.createElement("p", { className: "text-red-800" }, error)
            )
          ),
        !selectedCollection ?
          React.createElement("div", { className: "text-center py-16" },
            React.createElement("div", { className: "text-6xl mb-4" }, "📋"),
            React.createElement("h3", {
              className: "text-xl font-medium text-gray-900 mb-2"
            }, "Select a Collection"),
            React.createElement("p", { className: "text-gray-500" },
              "Choose a collection from the sidebar to view its data"
            )
          ) :
          loadingData ?
            React.createElement("div", { className: "text-center py-16" },
              React.createElement("div", {
                className: "animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 mx-auto"
              }),
              React.createElement("p", { className: "mt-4 text-gray-500" }, "Loading data...")
            ) :
            documents.length === 0 ?
              React.createElement("div", { className: "text-center py-16" },
                React.createElement("div", { className: "text-6xl mb-4" }, "📭"),
                React.createElement("h3", {
                  className: "text-xl font-medium text-gray-900 mb-2"
                }, "No Data Found"),
                React.createElement("p", { className: "text-gray-500" },
                  "The selected collection is empty"
                )
              ) :
              React.createElement("div", {
                className: "bg-white/90 shadow-md border border-gray-200 overflow-hidden"
              },
                React.createElement("div", { className: "overflow-x-auto" },
                  React.createElement("div", { className: "max-h-96 overflow-y-auto" },
                    React.createElement("table", { className: "w-full text-sm" },
                      React.createElement("thead", {
                        className: "bg-gray-50/80 sticky top-0"
                      },
                        React.createElement("tr", null,
                          getColumns().map((column) =>
                            React.createElement("th", {
                              key: column,
                              className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                            }, column)
                          )
                        )
                      ),
                      React.createElement("tbody", {
                        className: "bg-white/80 divide-y divide-gray-100"
                      },
                        documents.map((doc, index) =>
                          React.createElement("tr", {
                            key: doc.id,
                            className: index % 2 === 0 ? "bg-white/80" : "bg-gray-50/80"
                          },
                            getColumns().map((column) =>
                              React.createElement("td", {
                                key: column,
                                className: "px-4 py-3 text-gray-900 max-w-xs"
                              },
                                React.createElement("div", {
                                  className: "truncate text-xs bg-gray-100/60 px-2 py-1",
                                  title: formatValue(getValue(doc, column))
                                }, formatValue(getValue(doc, column)))
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                )
              )
      )
    )
  );
}

return DBViewer;"#
                }),
                serde_json::json!({
                    "id": "to-do-list",
                    "name": "To-Do List",
                    "description": "Manage your tasks and stay organized.",
                    "version": "1.2.3",
                    "price": 2.99,
                    "icon": "✅",
                    "installed": 0
                }),
                serde_json::json!({
                    "id": "calendar",
                    "name": "Calendar",
                    "description": "View and schedule your events easily.",
                    "version": "2.1.0",
                    "price": 4.99,
                    "icon": "📅",
                    "installed": 0
                }),
                serde_json::json!({
                    "id": "chess",
                    "name": "Chess",
                    "description": "Play chess and challenge your mind.",
                    "version": "1.8.7",
                    "price": 7.50,
                    "icon": "♟️",
                    "installed": 0
                }),
                serde_json::json!({
                    "id": "file-drive",
                    "name": "File Drive",
                    "description": "Store and access your files securely.",
                    "version": "3.0.2",
                    "price": 9.99,
                    "icon": "🗂️",
                    "installed": 0
                }),
                serde_json::json!({
                    "id": "calculator",
                    "name": "Calculator",
                    "description": "Perform quick calculations and solve equations.",
                    "version": "2.4.1",
                    "price": 1.99,
                    "icon": "🧮",
                    "installed": 0
                }),
                serde_json::json!({
                    "id": "stocks",
                    "name": "Stocks",
                    "description": "Track stock prices and market trends.",
                    "version": "1.5.9",
                    "price": 8.99,
                    "icon": "📈",
                    "installed": 0
                }),
            ];

            for app_data in default_apps {
                self.create_document("apps", app_data).await?;
            }

            tracing::info!("Successfully seeded {} default apps", 8);
        } else {
            tracing::info!("Apps already exist, skipping seeding");
        }

        Ok(())
    }

    pub async fn create_document(
        &self,
        collection: &str,
        data: Value,
    ) -> Result<Document, sqlx::Error> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();
        let data_str = serde_json::to_string(&data).unwrap();

        let document = Document {
            id: id.clone(),
            collection: collection.to_string(),
            data,
            created_at: now,
            updated_at: now,
        };

        sqlx::query(
            r#"
            INSERT INTO documents (id, collection, data, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(collection)
        .bind(&data_str)
        .bind(&now.to_rfc3339())
        .bind(&now.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(document)
    }

    pub async fn get_document(
        &self,
        collection: &str,
        id: &str,
    ) -> Result<Option<Document>, sqlx::Error> {
        let row = sqlx::query(
            r#"
            SELECT id, collection, data, created_at, updated_at
            FROM documents
            WHERE collection = ? AND id = ?
            "#,
        )
        .bind(collection)
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        match row {
            Some(row) => {
                let data: Value = serde_json::from_str(row.get("data")).unwrap();
                let created_at = DateTime::parse_from_rfc3339(row.get("created_at"))
                    .unwrap()
                    .with_timezone(&Utc);
                let updated_at = DateTime::parse_from_rfc3339(row.get("updated_at"))
                    .unwrap()
                    .with_timezone(&Utc);

                Ok(Some(Document {
                    id: row.get("id"),
                    collection: row.get("collection"),
                    data,
                    created_at,
                    updated_at,
                }))
            }
            None => Ok(None),
        }
    }

    pub async fn update_document(
        &self,
        collection: &str,
        id: &str,
        data: Value,
    ) -> Result<Option<Document>, sqlx::Error> {
        let now = Utc::now();
        let data_str = serde_json::to_string(&data).unwrap();

        let affected_rows = sqlx::query(
            r#"
            UPDATE documents
            SET data = ?, updated_at = ?
            WHERE collection = ? AND id = ?
            "#,
        )
        .bind(data_str)
        .bind(now.to_rfc3339())
        .bind(collection)
        .bind(id)
        .execute(&self.pool)
        .await?
        .rows_affected();

        if affected_rows == 0 {
            Ok(None)
        } else {
            self.get_document(collection, id).await
        }
    }

    pub async fn delete_document(&self, collection: &str, id: &str) -> Result<bool, sqlx::Error> {
        let affected_rows = sqlx::query(
            r#"
            DELETE FROM documents
            WHERE collection = ? AND id = ?
            "#,
        )
        .bind(collection)
        .bind(id)
        .execute(&self.pool)
        .await?
        .rows_affected();

        Ok(affected_rows > 0)
    }

    pub async fn list_documents(
        &self,
        collection: &str,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<QueryResult, sqlx::Error> {
        let limit = limit.unwrap_or(100).min(1000); // Cap at 1000 for performance
        let offset = offset.unwrap_or(0);

        let rows = sqlx::query(
            r#"
            SELECT id, collection, data, created_at, updated_at
            FROM documents
            WHERE collection = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            "#,
        )
        .bind(collection)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        let documents: Vec<Document> = rows
            .into_iter()
            .map(|row| {
                let data: Value = serde_json::from_str(row.get("data")).unwrap();
                let created_at = DateTime::parse_from_rfc3339(row.get("created_at"))
                    .unwrap()
                    .with_timezone(&Utc);
                let updated_at = DateTime::parse_from_rfc3339(row.get("updated_at"))
                    .unwrap()
                    .with_timezone(&Utc);

                Document {
                    id: row.get("id"),
                    collection: row.get("collection"),
                    data,
                    created_at,
                    updated_at,
                }
            })
            .collect();

        let count_row = sqlx::query("SELECT COUNT(*) as count FROM documents WHERE collection = ?")
            .bind(collection)
            .fetch_one(&self.pool)
            .await?;

        Ok(QueryResult {
            documents,
            count: count_row.get("count"),
        })
    }

    pub async fn list_collections(&self) -> Result<Vec<String>, sqlx::Error> {
        let rows = sqlx::query("SELECT DISTINCT collection FROM documents ORDER BY collection")
            .fetch_all(&self.pool)
            .await?;

        Ok(rows.into_iter().map(|row| row.get("collection")).collect())
    }

    pub async fn execute_raw_query(
        &self,
        query: &str,
    ) -> Result<Vec<serde_json::Value>, sqlx::Error> {
        let trimmed_query = query.trim().to_lowercase();

        // Only allow SELECT and PRAGMA queries for security
        if !trimmed_query.starts_with("select") && !trimmed_query.starts_with("pragma") {
            return Err(sqlx::Error::Configuration(
                "Only SELECT and PRAGMA queries are allowed".into(),
            ));
        }

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let mut results = Vec::new();

        for row in rows {
            let mut json_row = serde_json::Map::new();

            // Get all column names and values
            for (i, column) in row.columns().iter().enumerate() {
                let column_name = column.name();

                // Try to get the value as different types
                let value = if let Ok(val) = row.try_get::<String, _>(i) {
                    serde_json::Value::String(val)
                } else if let Ok(val) = row.try_get::<i64, _>(i) {
                    serde_json::Value::Number(val.into())
                } else if let Ok(val) = row.try_get::<f64, _>(i) {
                    serde_json::Value::Number(serde_json::Number::from_f64(val).unwrap_or(0.into()))
                } else if let Ok(val) = row.try_get::<bool, _>(i) {
                    serde_json::Value::Bool(val)
                } else {
                    // If we can't convert it, try as string or null
                    row.try_get::<Option<String>, _>(i)
                        .map(|opt| {
                            opt.map(serde_json::Value::String)
                                .unwrap_or(serde_json::Value::Null)
                        })
                        .unwrap_or(serde_json::Value::Null)
                };

                json_row.insert(column_name.to_string(), value);
            }

            results.push(serde_json::Value::Object(json_row));
        }

        Ok(results)
    }

    pub async fn reset_database(&self) -> Result<(), sqlx::Error> {
        // Drop the documents table
        sqlx::query("DROP TABLE IF EXISTS documents")
            .execute(&self.pool)
            .await?;

        // Recreate the documents table with indexes
        sqlx::query(
            r#"
            CREATE TABLE documents (
                id TEXT PRIMARY KEY,
                collection TEXT NOT NULL,
                data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Recreate indexes
        sqlx::query("CREATE INDEX idx_collection ON documents(collection)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX idx_created_at ON documents(created_at)")
            .execute(&self.pool)
            .await?;

        // Re-seed default apps after reset
        self.seed_default_apps().await?;

        Ok(())
    }
}

use serde_json::json;

use crate::database::Database;

impl Database {
    pub async fn seed_default_apps(&self) -> Result<(), sqlx::Error> {
        // Check if any apps already exist
        let existing_apps = self.list_documents("apps", Some(1), Some(0)).await?;

        if existing_apps.documents.is_empty() {
            tracing::info!("No apps found, seeding default apps");

            let default_apps = vec![
                json!({
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
                json!({
                    "id": "db-viewer",
                    "name": "DB Viewer",
                    "description": "Browse and manage your database collections and documents.",
                    "version": "1.0.0",
                    "price": 0,
                    "icon": "🗃️",
                    "installed": 1,
                    "source_code": include_str!("../assets/db-viewer.js")
                }),
                json!({
                    "id": "to-do-list",
                    "name": "To-Do List",
                    "description": "Manage your tasks and stay organized.",
                    "version": "1.2.3",
                    "price": 2.99,
                    "icon": "✅",
                    "installed": 0
                }),
                json!({
                    "id": "calendar",
                    "name": "Calendar",
                    "description": "View and schedule your events easily.",
                    "version": "2.1.0",
                    "price": 4.99,
                    "icon": "📅",
                    "installed": 0
                }),
                json!({
                    "id": "chess",
                    "name": "Chess",
                    "description": "Play chess and challenge your mind.",
                    "version": "1.8.7",
                    "price": 7.50,
                    "icon": "♟️",
                    "installed": 0
                }),
                json!({
                    "id": "file-drive",
                    "name": "File Drive",
                    "description": "Store and access your files securely.",
                    "version": "3.0.2",
                    "price": 9.99,
                    "icon": "🗂️",
                    "installed": 0
                }),
                json!({
                    "id": "calculator",
                    "name": "Calculator",
                    "description": "Perform quick calculations and solve equations.",
                    "version": "2.4.1",
                    "price": 1.99,
                    "icon": "🧮",
                    "installed": 0
                }),
                json!({
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
}
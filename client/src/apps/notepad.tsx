import type { AppProps } from "@/types";
import { hostAPI } from "@/libs/host-api";

/**
 * Each app in our ecosystem is a [React functional component](https://react.dev/learn/your-first-component#defining-a-component).
 * If you are unfamiliar with React, it is just a simple JavaScript function, which receive props as the input, and return a special kind of HTML, called JSX, as the output.
 * We use TypeScript by default for better IDE support and code autocomplete. There are more benefits to this as well, such as improved type safety and easier refactoring.
 *
 * @param React The React instance used by the host application. You must use this instance to make sure your app and the host app use the same React instance. In the future, when we have the micro-frontend architecture, this is not necessary.
 * @returns [JSX](https://react.dev/learn/writing-markup-with-jsx)
 */
export default function Notepad({ React }: AppProps) {
  const [note, setNote] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  /**
   * Load saved note from server-side database on component mount
   */
  React.useEffect(() => {
    const loadNote = async () => {
      try {
        // Find the note document by looking through all documents in the collection
        const documents = await hostAPI.db.list("notepad_settings");
        const noteDoc = documents.documents.find(
          (doc) => doc.data.key === "note",
        );
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

  /**
   * Handle events the React way
   */
  const saveNote = async (value: string) => {
    setNote(value);
    try {
      // Find existing note document by key, or create a new one
      const documents = await hostAPI.db.list("notepad_settings");
      const existingDoc = documents.documents.find(
        (doc) => doc.data.key === "note",
      );

      if (existingDoc) {
        await hostAPI.db.update("notepad_settings", existingDoc.id, {
          key: "note",
          value,
        });
      } else {
        await hostAPI.db.create("notepad_settings", { key: "note", value });
      }
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  /**
   * For more complex apps, you can split this into multiple components inside the same file.
   * For example: <Sidebar /><MainContent /><FAB />
   * You can also add state management libraries like Redux or Jotai.
   */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center font-sans">
      <div className="bg-white/90 backdrop-blur-lg shadow-2xl rounded-3xl p-10 w-full max-w-lg border border-gray-100">
        <div className="flex items-center justify-center mb-6">
          <span className="text-3xl mr-2">📝</span>
          <h1 className="font-bold text-3xl tracking-tight text-gray-900">
            Notepad
          </h1>
        </div>
        <textarea
          value={note}
          onChange={(e) => {
            /**
             * This code would send an update command to the server on every keystroke, you may want to debounce this in a real app.
             * We keep this app simple for reference purposes.
             */
            saveNote(e.currentTarget.value);
          }}
          rows={1}
          style={{ minHeight: "120px", maxHeight: "320px", overflow: "auto" }}
          className="w-full text-base font-mono bg-gray-50 border border-gray-300 rounded-2xl p-5 resize-y text-gray-900 outline-none shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
          placeholder={loading ? "Loading..." : "Type your notes here..."}
          disabled={loading}
          autoFocus
        />
        <div className="flex justify-end mt-4">
          <span className="text-xs text-gray-400">Saved automatically</span>
        </div>
      </div>
    </div>
  );
}

/**
 * That's it!
 */

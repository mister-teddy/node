import type { AppProps } from "@/types";

/**
 * Each app in our ecosystem is a [React functional component](https://react.dev/learn/your-first-component#defining-a-component).
 * If you are unfamiliar with React, it is just a simple JavaScript function, which receive props as the input, and return a special kind of HTML, called JSX, as the output.
 * We use TypeScript by default for better IDE support and code autocomplete. There are more benefits to this as well, such as improved type safety and easier refactoring.
 *
 * @param db The SQLite instance, scoped to your app's own schema. You can define the tables you will use in the generic type parameter.
 * @param React The React instance used by the host application. You must use this instance to make sure your app and the host app use the same React instance. In the future, when we have the micro-frontend architecture, this is not necessary.
 * @returns [JSX](https://react.dev/learn/writing-markup-with-jsx)
 */
export default function Notepad({
  db,
  React,
}: AppProps<{
  /**
   * This app will use a `settings` table
   * This table have 2 columns: `key` and `value`
   */
  settings: {
    key: string;
    value: string;
  };
}>) {
  const [note, setNote] = React.useState("");

  /**
   * Every app is a React functional component, so you can use React hooks for most operations.
   * For example, to setup a one-time task, like creating a database table, you can use the useEffect with `db` as a dependency.
   */
  React.useEffect(() => {
    /**
     * The generic type above defines the shape of the data in the table, so that the TypeScript compiler can understand your schema.
     * This code contains the actual logic that will be executed to create the table.
     */
    db.schema
      .createTable("settings")
      .ifNotExists()
      .addColumn("key", "text")
      .addColumn("value", "text")
      .addPrimaryKeyConstraint("pk_settings", ["key"])
      .execute()
      .then(async () => {
        /**
         * Load saved note
         */
        const savedNote = await db
          .selectFrom("settings")
          .select("value")
          .where("key", "=", "note")
          .executeTakeFirst();
        if (savedNote) {
          setNote(savedNote.value ?? "");
        }
      });
  }, [db]);

  /**
   * Handle events the React way
   */
  const saveNote = async (value: string) => {
    setNote(value);
    try {
      await db
        .insertInto("settings")
        .values({ key: "note", value })
        .onConflict((oc) => oc.column("key").doUpdateSet({ value }))
        .execute();
    } catch (e) {
      console.error(e);
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
             * This code would send an update command to SQLite on every keystroke, you may want to debounce this in a real app.
             * We keep this app simple for reference purposes.
             */
            saveNote(e.currentTarget.value);
          }}
          rows={1}
          style={{ minHeight: "120px", maxHeight: "320px", overflow: "auto" }}
          className="w-full text-base font-mono bg-gray-50 border border-gray-300 rounded-2xl p-5 resize-y text-gray-900 outline-none shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
          placeholder="Type your notes here..."
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

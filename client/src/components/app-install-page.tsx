import type { AppTable } from "@/types";
import AppIcon from "./app-icon";
import { Button } from "@/components/ui/button";

interface AppInstallPageProps {
  onInstall: () => void;
  app: AppTable;
}

function AppInstallPage({ onInstall, app }: AppInstallPageProps) {
  return (
    <div className="bg-background min-h-screen px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-6">
        <AppIcon app={app} />
        <div>
          <h1 className="text-3xl font-semibold">{app.name}</h1>
          <p className="text-muted-foreground text-sm">{app.description}</p>
        </div>
        <div className="ml-auto flex flex-col items-end">
          <Button
            size="lg"
            onClick={onInstall}
            className="font-semibold text-lg"
          >
            {app.price ? `${app.price}đ` : "Install"}
          </Button>
        </div>
      </div>

      {/* Info Row */}
      <div className="flex gap-8 mt-8 text-center">
        <div>
          <div className="text-xl font-bold">5.0</div>
          <div className="flex justify-center text-yellow-400 mb-1">
            {/* Star icons */}
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.049 9.393c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.966z" />
              </svg>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">1 Rating</div>
        </div>
        <div>
          <div className="flex justify-center mb-1">
            <svg
              className="w-5 h-5 text-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19V6m0 0l-7 7m7-7l7 7"
              />
            </svg>
          </div>
          <div className="text-xs text-muted-foreground">Productivity</div>
        </div>
        <div>
          <div className="flex justify-center mb-1">
            <svg
              className="w-5 h-5 text-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.607 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div className="text-xs text-muted-foreground">Node</div>
        </div>
        <div>
          <div className="text-xl font-bold">{app.version}</div>
          <div className="text-xs text-muted-foreground">Version</div>
        </div>
        <div>
          <div className="text-xl font-bold">17,5</div>
          <div className="text-xs text-muted-foreground">MB</div>
        </div>
      </div>

      {/* Screenshots */}
      <div className="flex gap-6 mt-10">
        {["screenshot-1.png", "screenshot-2.png"].map((src, index) => (
          <div
            key={index}
            className="flex-none min-w-96 max-w-[60vh] bg-muted rounded-xl flex items-center justify-center"
          >
            <img
              src={`/apps/${app.id}/${src}`}
              alt={`Screenshot ${index + 1}`}
            />
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="mt-10">
        <blockquote className="text-xl font-serif font-medium mb-4">
          <span className="font-bold">{app.name}</span> is ideal for everything
          from note-taking to academic writing
        </blockquote>
        <div className="text-foreground text-sm mb-4">
          A minimalist writing environment with powerful tools to help write,
          think & communicate clearly.
          <br />
          Author features an integrated concept Map, ‘Ask AI’ to help you write
          (not write for you), Journal and a streamlines citation system, along
          with many other functions to augment how you write to think and
          communicate. To try Author for free, (without Export or AI), download
          'Author | Basic'.
        </div>
      </div>
    </div>
  );
}

export default AppInstallPage;

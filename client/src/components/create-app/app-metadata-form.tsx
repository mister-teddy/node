import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppProject } from "@/types/app-project";

interface AppMetadataFormProps {
  project: AppProject;
  onUpdate: (updates: Partial<AppProject>) => void;
  onPublish: () => void;
}

export function AppMetadataForm({ project, onUpdate, onPublish }: AppMetadataFormProps) {
  const handleInputChange = (field: keyof AppProject, value: string | number) => {
    onUpdate({ [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">{project.icon}</span>
          App Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="app-name" className="block text-sm font-medium text-gray-700 mb-1">
              App Name
            </label>
            <Input
              id="app-name"
              value={project.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter app name"
            />
          </div>

          <div>
            <label htmlFor="app-icon" className="block text-sm font-medium text-gray-700 mb-1">
              Icon (Emoji)
            </label>
            <Input
              id="app-icon"
              value={project.icon}
              onChange={(e) => handleInputChange('icon', e.target.value)}
              placeholder="📱"
              className="text-center text-2xl"
              maxLength={2}
            />
          </div>
        </div>

        <div>
          <label htmlFor="app-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <Textarea
            id="app-description"
            value={project.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe what your app does"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="app-version" className="block text-sm font-medium text-gray-700 mb-1">
              Version
            </label>
            <Input
              id="app-version"
              value={project.version}
              onChange={(e) => handleInputChange('version', e.target.value)}
              placeholder="1.0.0"
            />
          </div>

          <div>
            <label htmlFor="app-price" className="block text-sm font-medium text-gray-700 mb-1">
              Price (sats)
            </label>
            <Input
              id="app-price"
              type="number"
              value={project.price}
              onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="flex gap-2">
              <Button
                variant={project.status === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleInputChange('status', 'draft')}
              >
                Draft
              </Button>
              <Button
                variant={project.status === 'published' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPublish()}
              >
                Publish
              </Button>
            </div>
          </div>
        </div>

        {project.originalPrompt && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Prompt
            </label>
            <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-600">
              {project.originalPrompt}
            </div>
          </div>
        )}

        {project.model && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AI Model Used
            </label>
            <div className="p-2 bg-blue-50 rounded-md text-sm text-blue-700">
              {project.model}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { type FC } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CreateAppGenerator } from "@/components/create-app/create-app-generator";

const CreateNewAppPage: FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 pt-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New App</h1>
          <Button 
            variant="outline" 
            onClick={() => navigate("/projects")}
          >
            Back to Projects
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full overflow-auto">
          <div className="max-w-2xl mx-auto">
            <CreateAppGenerator />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNewAppPage;
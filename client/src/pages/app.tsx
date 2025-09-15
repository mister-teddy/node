import AppRenderer from "@/components/app-renderer";
import { appByIdAtom } from "@/state/app-ecosystem";
import { useAtomValue } from "jotai";
import { useParams } from "react-router-dom";
import NotFound from "./404";
import { useCustomCrumb } from "@/hooks";

function AppPage() {
  const { id } = useParams();
  const app = useAtomValue(appByIdAtom(id!));
  useCustomCrumb(app?.name);

  if (!app) {
    return <NotFound />;
  }

  // AppRenderer handles dynamic JavaScript execution from app.source_code
  return <AppRenderer app={app} />;
}

export default AppPage;

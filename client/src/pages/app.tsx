import AppRenderer from "@/components/app-renderer";
import { appByIdAtom } from "@/state/app-ecosystem";
import { useAtomValue } from "jotai";
import { useParams } from "react-router-dom";
import NotFound from "./404";

function AppPage() {
  const { id } = useParams();
  const app = useAtomValue(appByIdAtom(id!));

  if (!app) {
    return <NotFound />;
  }

  return <AppRenderer app={app} />;
}

export default AppPage;

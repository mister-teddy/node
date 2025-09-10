import { adaptiveIs3DModeAtom } from "@/state/3d";
import type { AppTable } from "@/types";
import { useAtomValue } from "jotai";
import { type FunctionComponent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useOpenAppAsWindow } from "@/hooks";
import { appByIdAtom } from "@/state/app-ecosystem";

interface AppEntryProps {
  app: AppTable;
  preferedSize?: [number, number];
  children: (renderProps: { onClick: () => void }) => ReactNode;
}

const AppEntry2D: FunctionComponent<AppEntryProps> = ({ app, children }) => {
  const navigate = useNavigate();

  return children({
    onClick: () => {
      if (app.price === 0) {
        navigate(`/apps/${app.id}`);
      } else {
        alert("Payment with Lightning Network is to be implemented");
      }
    },
  });
};

const AppEntry3D: FunctionComponent<AppEntryProps> = ({
  app,
  preferedSize,
  children,
}) => {
  const fullAppInfo = useAtomValue(appByIdAtom(app.id))!;
  const [onClick] = useOpenAppAsWindow({ app: fullAppInfo, preferedSize });

  return children({ onClick });
};

function AppEntry(props: AppEntryProps) {
  const is3D = useAtomValue(adaptiveIs3DModeAtom);
  if (is3D) {
    return <AppEntry3D {...props} />;
  }
  return <AppEntry2D {...props} />;
}

export default AppEntry;

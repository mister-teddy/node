import type { AppTable } from "@/types";
import React, {
  createElement,
  lazy,
  memo,
  Suspense,
  type ComponentType,
  type FunctionComponent,
} from "react";
import { createPortal } from "react-dom";
import db from "@/libs/db";
import Spinner from "./spinner";
import { useNavigate } from "react-router-dom";
import CloseIcon from "./icons/close";
import { adaptiveIs3DModeAtom } from "@/state/3d";
import { useAtomValue } from "jotai";

interface AppRendererProps {
  app: AppTable;
  component?: ComponentType;
}

const CloseButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => {
        navigate(-1);
      }}
      className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
    >
      <CloseIcon />
    </button>
  );
};

const AppRenderer: FunctionComponent<AppRendererProps> = ({
  app,
  component,
}) => {
  const is3D = useAtomValue(adaptiveIs3DModeAtom);

  const content = (
    <Suspense fallback={<Spinner />}>
      {component
        ? createElement(component)
        : createElement(
            lazy(() =>
              import.meta.env.DEV
                ? import(`../apps/${app.id}`)
                : import(`/apps/${app.id}.js`)
            ),
            {
              app,
              db,
              React,
            }
          )}
    </Suspense>
  );

  if (is3D) {
    return content;
  }

  return createPortal(
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {content}
      <CloseButton />
    </div>,
    document.body
  );
};

export default memo(AppRenderer, (prev, next) => {
  return prev.app.id === next.app.id;
});

/* eslint-disable import/prefer-default-export */
import { contextBridge, ipcRenderer } from "electron";
import { ExtractInvoke, HandlesKeys, HandlesNamespace } from "../types/preload";
import { Handles } from "../types/api";

type HandlerMaker<T extends HandlesNamespace> = (
  key: HandlesKeys<T>,
  invoke?: ExtractInvoke<Handles[T][HandlesKeys<T>]>
) => void;

export const bind = <T extends HandlesNamespace>(
  context: T,
  setter: (h: HandlerMaker<T>, i: typeof ipcRenderer.invoke) => void
) => {
  type Keys = HandlesKeys<T>;
  let handlers = {};

  const makeHandler = <K extends Keys>(
    key: K,
    invoke?: ExtractInvoke<Handles[T][K]>
  ) => {
    handlers = {
      ...handlers,
      [key]:
        invoke ?? (() => ipcRenderer.invoke(`${context}:${key as string}`)),
    };
  };

  console.log(`Context Binded: ${context}`);
  setter(makeHandler, ipcRenderer.invoke);

  contextBridge.exposeInMainWorld(context, handlers);
};

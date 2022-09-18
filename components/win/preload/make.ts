/* eslint-disable import/prefer-default-export */
import { contextBridge, ipcRenderer } from "electron";
import { ExtractInvoke, HandlesKeys, HandlesNamespace } from "../types/preload";
import { Handles } from "../types/api";

type HandlerMaker<T extends HandlesNamespace> = (
  key: HandlesKeys<T>,
  invoke?: (key: string) => (...args: any[]) => any
) => void;

export const bind = <T extends HandlesNamespace>(
  context: T,
  setter: (
    h: HandlerMaker<T>,
    invoker: (key: string) => (...args: any[]) => any,
    listener: (key: string) => (...args: any[]) => any
  ) => void
) => {
  type Keys = HandlesKeys<T>;
  let handlers = {};

  const invoker =
    (key: string) =>
    (...args: any[]) =>
      ipcRenderer.invoke(`${context}:${key}`, ...args);

  const listener = (key: string) => (callback: (data: any) => void) =>
    ipcRenderer.on(`${context}:${key}`, (_evt, data) => {
      callback(data);
    });

  const makeHandler = <K extends Keys>(
    key: K,
    invoke?: (key: string) => (...args: any[]) => any
  ) => {
    handlers = {
      ...handlers,
      [key]: invoke?.(key as string) as ExtractInvoke<Handles[T][K]>,
    };
  };

  setter(makeHandler, invoker, listener);

  contextBridge.exposeInMainWorld(context, handlers);
};

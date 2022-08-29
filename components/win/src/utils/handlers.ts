import { HandlesNamespace, HandlesKeys, ExtractHandle } from "types/preload";
import { Handles } from "types/api";
import { ipcMain } from "electron";

/* eslint-disable import/prefer-default-export */
export class Handlers {
  static register<
    Namespace extends HandlesNamespace,
    Key extends HandlesKeys<Namespace>
  >(
    namespace: Namespace,
    name: Key,
    handler: ExtractHandle<Handles[Namespace][Key]>
  ) {
    const handlerKey = `${namespace}:${name as string}`;
    if (typeof handler === "function")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ipcMain.handle(handlerKey, handler as unknown as (...args: any[]) => any);
  }
}

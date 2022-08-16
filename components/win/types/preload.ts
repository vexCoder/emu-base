import { IpcMainInvokeEvent } from "electron";
import { Handles } from "./api";
import { Connection } from "./preload-utils";

export type ExtractInvoke<T> = T extends Connection<any, any>
  ? T["invoker"]
  : T;

export type ExtractHandle<T> = T extends Connection<any, any> ? T["handle"] : T;

export type HandlesNamespace = keyof Handles;

export type HandlesKeys<T extends HandlesNamespace> = keyof Handles[T];

export type RemoveIPC<T> = T extends []
  ? []
  : T extends [infer H, ...infer R]
  ? H extends IpcMainInvokeEvent
    ? RemoveIPC<R>
    : [H, ...RemoveIPC<R>]
  : never;

export type WindowFunction<T> = T extends (...args: any[]) => any
  ? (...p: RemoveIPC<Parameters<T>>) => ReturnType<T>
  : T;

export type ExtendWindow = {
  [K in keyof Handles]: {
    [K2 in HandlesKeys<K>]: WindowFunction<ExtractHandle<Handles[K][K2]>>;
  };
};

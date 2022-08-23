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

export type WindowFunction<T extends InferConnection<any>> = T extends {
  parameters: any;
  return: any;
}
  ? (...p: T["parameters"]) => T["return"]
  : T;

type InferConnection<T> = T extends Connection<infer P, infer R>
  ? {
      parameters: P;
      return: R;
    }
  : T;

export type ExtendWindow = {
  [K in keyof Handles]: {
    [K2 in HandlesKeys<K>]: WindowFunction<InferConnection<Handles[K][K2]>>;
  };
};

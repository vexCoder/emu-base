import { IpcMainInvokeEvent } from "electron";

export type Invoker<P extends any[]> = (...args: P) => any;

export type Handle<P extends any[], R> = (
  evt: IpcMainInvokeEvent,
  ...args: P
) => R;

export type Connection<P extends any[] = [], R = void> = {
  invoker: Invoker<P>;
  handle: Handle<P, R>;
};

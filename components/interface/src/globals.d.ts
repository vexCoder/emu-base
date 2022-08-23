declare global {
  type Extension = import("win/types/preload").ExtendWindow;
  interface Window extends Extension {}
}

export {};

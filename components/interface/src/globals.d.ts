declare global {
  type Extension = import("win/types/preload").ExtendWindow;
  interface Window extends Extension {}

  namespace JSX {
    interface IntrinsicElements {
      divider: ReactElementProps<HTMLDivElement>;
      placeholder: ReactElementProps<HTMLDivElement>;
    }
  }
}

export {};

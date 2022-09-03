declare global {
  type Extension = import("win/types/preload").ExtendWindow;
  interface Window extends Extension {
    custom: {
      buttonState?: Record<ButtonKeys, boolean>;
      [key: string]: any;
    }
  }

  namespace JSX {
    interface IntrinsicElements {
      divider: ReactElementProps<HTMLDivElement>;
      placeholder: ReactElementProps<HTMLDivElement>;
    }

  }
}

export {};

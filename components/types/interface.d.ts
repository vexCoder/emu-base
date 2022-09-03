interface Children {
  children?: React.ReactNode;
}

interface BaseProps {
  style?: React.CSSProperties;
  className?: string;
}

type BasePropsWithChildren = BaseProps & Children;

type BaseComponentProps<T extends keyof import("react").ReactHTML> = BaseProps &
  JSX.IntrinsicElements[T];

type ReactElementProps<T extends HTMLElement> = import("react").DetailedHTMLProps<
  React.HTMLAttributes<T>,
  T
>;

type ReactElementProps<T extends HTMLElement> = import("react").DetailedHTMLProps<
  React.HTMLAttributes<T>,
  T
>;

type Easing = [number, number, number, number] | "linear" | "easeIn" | "easeOut" | "easeInOut" | "circIn" | "circOut" | "circInOut" | "backIn" | "backOut" | "backInOut" | "anticipate"
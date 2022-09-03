import { useCreation } from "ahooks";
import { forwardRef } from "react";
import { siPlaystation } from "simple-icons/icons";

type ConsoleIconProps = BaseProps & {
  console: string;
  title?: string;
  size?: React.CSSProperties["width"];
  color?: React.CSSProperties["color"];
};

const ConsoleIcon = forwardRef<SVGSVGElement, ConsoleIconProps>(
  (
    {
      console: cons,
      size = "1em",
      color = "white",
      title,
      ...rest
    }: ConsoleIconProps,
    ref
  ) => {
    const iconPath = useCreation(() => {
      if (cons?.toLowerCase() === "ps1") {
        return siPlaystation.path;
      }

      return null;
    }, [cons]);

    if (!iconPath) return null;
    return (
      <svg
        {...rest}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        color={color}
        fill={color}
        ref={ref}
      >
        <title>{title}</title>
        <path d={iconPath} />
      </svg>
    );
  }
);

export default ConsoleIcon;

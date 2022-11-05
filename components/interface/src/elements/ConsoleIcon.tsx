/* eslint-disable max-len */
import { useCreation } from "ahooks";
import { forwardRef } from "react";
import { siPlaystation, siPlaystation2 } from "simple-icons/icons";

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

      if (cons?.toLowerCase() === "psp") {
        return "M 7.46 13.779 v 0.292 h 4.142 v -3.85 h 3.796 V 9.93 h -4.115 v 3.85 z m 16.248 -3.558 v 1.62 h -7.195 v 2.23 h 0.292 v -1.938 H 24 V 9.929 h -7.487 v 0.292 z m -16.513 0 v 1.62 H 0 v 2.23 h 0.292 v -1.938 H 7.46 V 9.929 H 0 v 0.292 Z";
      }

      if (cons?.toLowerCase() === "ps2") {
        return siPlaystation2.path;
      }
      return null;
    }, [cons]);

    // if (cons?.toLowerCase() === "psp") {
    //   return (
    //     <PSPIcon {...rest} width={size} height={size} fill={color} ref={ref} />
    //   );
    // }

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

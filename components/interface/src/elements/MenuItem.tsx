import clsx from "clsx";
import React, { cloneElement, isValidElement, SVGProps } from "react";

type MenuItemProps = BaseComponentProps<"div"> & {
  focused?: boolean;
  selected?: boolean;
  label: string;
  icon?: React.ReactSVGElement | React.FC<SVGProps<SVGSVGElement>>;
  classes?: {
    root?: string;
    icon?: string;
  };
};

const MenuItem = (props: MenuItemProps) => {
  const {
    children,
    className,
    selected,
    focused,
    label,
    icon,
    classes,
    ...rest
  } = props;

  const IconComponent = isValidElement(icon) ? null : icon;
  return (
    <div
      {...rest}
      className={clsx(
        className,
        classes?.root,
        "h-stack items-center gap-6 py-2 px-3 border rounded-xl justify-between",
        focused && selected && "border-focus",
        !focused && !selected && "border-secondary/50",
        selected && !focused && "border-highlight"
      )}
    >
      <div className="h-stack items-center gap-3 flex-2">
        {icon &&
          isValidElement(icon) &&
          cloneElement(icon, {
            width: "1.5em",
            height: "1.5em",
            className: clsx(
              classes?.icon,
              focused && selected && "!text-focus",
              (!focused || !selected) && "!text-text"
            ),
          })}

        {IconComponent && !isValidElement(icon) && (
          <IconComponent
            width="1.5em"
            height="1.5em"
            className={clsx(
              classes?.icon,
              focused && selected && "!text-focus",
              (!focused || !selected) && "!text-text"
            )}
          />
        )}
        <p
          className={clsx(
            "font-bold text-sm",
            focused && selected && "!text-focus",
            (!focused || !selected) && "!text-text"
          )}
        >
          {label}
        </p>
      </div>

      {typeof children === "string" ? (
        <p
          className={clsx(
            "text-sm",
            focused && selected && "!text-focus",
            (!focused || !selected) && "!text-text"
          )}
        >
          {children}
        </p>
      ) : (
        children
      )}
    </div>
  );
};

export default MenuItem;

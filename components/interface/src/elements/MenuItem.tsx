import clsx from "clsx";
import React, { cloneElement, isValidElement, SVGProps } from "react";

type MenuItemProps = BaseComponentProps<"div"> & {
  focused?: boolean;
  selected?: boolean;
  highlighted?: boolean;
  disabled?: boolean;
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
    highlighted,
    label,
    icon,
    classes,
    disabled,
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
        highlighted && "border-highlight",
        disabled && "!border-secondary/20"
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
              (!focused || !selected) && "!text-text",
              disabled && "!text-text/20"
            ),
          })}

        {IconComponent && !isValidElement(icon) && (
          <IconComponent
            width="1.5em"
            height="1.5em"
            className={clsx(
              classes?.icon,
              focused && selected && "!text-focus",
              (!focused || !selected) && "!text-text",
              disabled && "!text-text/20"
            )}
          />
        )}
        <p
          className={clsx(
            "font-bold text-lg line-clamp-1",
            focused && selected && "!text-focus",
            (!focused || !selected) && "!text-text",
            disabled && "!text-text/20"
          )}
        >
          {label}
        </p>
      </div>

      {typeof children === "string" ? (
        <p
          className={clsx(
            "text-lg line-clamp-1",
            focused && selected && "!text-focus",
            (!focused || !selected) && "!text-text",
            disabled && "!text-text/20"
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

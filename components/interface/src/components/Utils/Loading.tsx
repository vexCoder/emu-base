import Spinner from "@elements/Spinner";
import { Theme } from "@root/themes";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";

type LoadingProps = BaseComponentProps<"div"> & {
  loading: boolean;
  color?: keyof Theme;
  align?: "left" | "center" | "right";
  message?: string;
};

const Loading = ({ loading, color, align, message, ...rest }: LoadingProps) => {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="loading"
          className={clsx(
            "absolute top-0 left-0 w-full h-full",
            rest.className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className={clsx(
              "h-stack gap-3 items-center p-2 w-full h-full bg-black/80",
              align === "left" && "justify-start",
              align === "center" && "justify-center",
              align === "right" && "justify-end"
            )}
          >
            <Spinner
              className={clsx(
                "w-[1.75em] h-[1.75em] animate-spin text-gray-600",
                color === "primary" && "fill-primary",
                color === "secondary" && "fill-secondary",
                color === "text" && "fill-text",
                color === "contrastText" && "fill-contrastText",
                color === "focus" && "fill-focus",
                color === "highlight" && "fill-highlight",
                !color && "fill-green-400"
              )}
            />
            <span className="text-secondary text-xl font-bold">
              {message || "Loading..."}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Loading;

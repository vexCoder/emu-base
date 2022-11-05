import ImageCache from "@components/Cache/ImageCache";
import { useMainStore } from "@utils/store.utils";
import { useInViewport, useMemoizedFn } from "ahooks";
import clsx from "clsx";
import { join, pick } from "ramda";
import { memo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { deepEqual } from "fast-equals";

type GameImageProps = BaseComponentProps<"div"> & {
  focused: boolean;
  cover?: string;
  unique?: string;
  isRef: boolean;
  isActive: boolean;
  loading: boolean;
  left: number;
  onViewport: (inViewport: boolean) => void;
};

const GameImage = memo(
  ({
    focused,
    cover,
    unique,
    isRef,
    isActive,
    left,
    loading,
    onViewport,
  }: GameImageProps) => {
    const store = useMainStore((v) => pick(["console", "selected"], v));

    const pathToGame = useMemoizedFn((...args: string[]) => {
      return join("/", [store.console, unique, ...args]);
    });

    const ref = useRef<HTMLDivElement>(null);
    const [, r] = useInViewport(ref, {
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });

    const isInViewport = typeof r === "number" && r > 0;

    useEffect(() => {
      if (isRef && onViewport) {
        onViewport(isInViewport);
      }
    }, [isInViewport, isRef, onViewport]);

    return (
      <div
        ref={ref}
        className="fixed v-stack"
        style={{
          left: `${left}rem`,
          top: `${isActive ? 7 : 12}rem`,
          transition: "left 0.35s linear, top 0.35s linear",
          transformOrigin: "center center",
        }}
      >
        <AnimatePresence mode="popLayout">
          {isInViewport && !loading && (
            <motion.div
              key={`${unique}-image`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              {cover && (
                <ImageCache
                  className={clsx(
                    "shadow-gentle-fade shadow-black/20",
                    isActive
                      ? "game-item-image-selected"
                      : "game-item-image-unselected",
                    "linear",
                    focused && isActive && "border-2 border-focus"
                  )}
                  path={pathToGame("cover.png")}
                  url={cover}
                  style={{
                    width: isActive ? "20rem" : "10rem",
                    height: isActive ? "20rem" : "10rem",
                    transition: "all 0.35s linear, border 0s",
                  }}
                  imageProps={{
                    className: "shadow-gentle-fade shadow-black/20",
                  }}
                />
              )}
            </motion.div>
          )}

          {!isInViewport && (
            <motion.div
              key={`${unique}-image-unselected`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { delay: 1, duration: 0.5 } }}
              transition={{ duration: 0.1 }}
            >
              <div
                className="p-[5rem] "
                style={{
                  width: isActive ? "20rem" : "10rem",
                  height: isActive ? "20rem" : "10rem",
                  transition: "all 0.35s linear",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
  deepEqual
);

export default GameImage;

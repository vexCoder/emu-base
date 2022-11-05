import ImageCache from "@components/Cache/ImageCache";
import { useMainStore } from "@utils/store.utils";
import { useCounter, useInterval, useMemoizedFn } from "ahooks";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import _ from "lodash";
import { join, pick } from "ramda";

type GameBackgroundImagesProps = BaseComponentProps<"div">;

const GameBackgroundImages = (props: GameBackgroundImagesProps) => {
  const store = useMainStore((v) => pick(["console", "selected"], v));

  const pathToGame = useMemoizedFn((...args: string[]) => {
    return join("/", [store.console, store?.selected?.unique, ...args]);
  });

  const images = store.selected?.screenshots;
  const [active, activeAction] = useCounter(0, {
    max: images?.length ? images.length - 1 : 0,
    min: 0,
  });

  useInterval(() => {
    const range = _.range(images?.length ?? 0)
      .map((__, i) => i)
      .filter((v) => v !== active);

    activeAction.set(_.shuffle(range)[0]);
  }, 5000);

  return (
    <div className="fixed bottom-0 right-0 z-[-10]" {...props}>
      <AnimatePresence>
        {images?.map((image, i) => {
          if (i !== active) return null;
          return (
            <motion.div
              key={image}
              className="fixed bottom-[-10vh] right-[-10vw]"
              initial={{ z: -20, opacity: 0 }}
              animate={{ z: -10, opacity: 1 }}
              exit={{ z: -20, opacity: 0 }}
            >
              <div
                className={clsx(
                  "fixed w-full h-full bottom-[5px] right-[5px] z-[10]",
                  "bg-gradient-to-b from-primary/100 to-primary/0"
                )}
              />
              <div
                className={clsx(
                  "fixed w-full h-full bottom-[5px] right-[5px] z-[10]",
                  "bg-gradient-to-r from-primary/100 to-primary/0"
                )}
              />
              <div
                className={clsx(
                  "fixed w-full h-full bottom-[5px] right-[5px] z-[10]",
                  "bg-gradient-to-br from-primary/100 to-primary/0"
                )}
              />
              <ImageCache
                path={pathToGame(`screenshot-${i}.png`)}
                url={image}
                className="w-[100vw] max-w-[1100px] min-w-[800px] h-auto !bg-transparent"
                imageProps={{
                  className: "w-full h-full",
                  style: {
                    background: "transparent",
                  },
                }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default GameBackgroundImages;

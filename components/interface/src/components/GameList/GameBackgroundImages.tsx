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
    return join("/", [store.console, store?.selected?.id, ...args]);
  });

  const images = store.selected?.screenshots;
  const [active, activeAction] = useCounter(0, {
    max: images?.length ? images.length - 1 : 0,
    min: 0,
  });

  const randomize = () => {
    const range = _.range(images?.length ?? 0)
      .map((__, i) => i)
      .filter((v) => v !== active);

    const random = _.shuffle(range)[0];
    if (typeof random === "number") activeAction.set(random);
  };

  // useUpdateEffect(() => {
  //   if (store.selected.id) {
  //     randomize();
  //   }
  // }, [store.selected.id]);

  useInterval(
    () => {
      randomize();
    },
    15000,
    {
      immediate: true,
    }
  );

  return (
    <div className="fixed bottom-0 right-0 z-[-10]" {...props}>
      <AnimatePresence>
        {images?.map((image, i) => {
          if (i !== active) return null;
          return (
            <motion.div
              key={image}
              className="fixed bottom-0 right-0"
              initial={{ z: -20, opacity: 0 }}
              animate={{ z: -10, opacity: 1 }}
              exit={{ z: -20, opacity: 0 }}
              transition={{ duration: 1.5 }}
            >
              <div
                className={clsx(
                  "fixed w-full h-full top-[-5px] left-[-5px] z-[10]",
                  "bg-gradient-to-b from-primary/100 via-primary/50 to-primary/0"
                )}
                style={{
                  height: "calc(100% + 5px)",
                  width: "calc(100% + 15px)",
                }}
              />
              <div
                className={clsx(
                  "fixed w-full h-full top-[-5px] left-[-5px] z-[10]",
                  "bg-gradient-to-r from-primary/100 via-primary/50 to-primary/0"
                )}
                style={{
                  height: "calc(100% + 5px)",
                  width: "calc(100% + 15px)",
                }}
              />
              <div
                className={clsx(
                  "fixed w-full h-[100vh] top-[-5px] left-[-5px] z-[10]",
                  "bg-gradient-to-br from-primary/100 via-primary/50 to-primary/0"
                )}
                style={{
                  height: "calc(100% + 5px)",
                  width: "calc(100% + 15px)",
                }}
              />
              <ImageCache
                path={pathToGame(`screenshot-${i}.png`)}
                url={image}
                className="!bg-transparent"
                imageProps={{
                  className: "max-w-[70vw] min-w-[800px] h-[80vh]",
                  style: {
                    objectFit: "cover",
                    background: "transparent",
                    // objectPosition: "center right",
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

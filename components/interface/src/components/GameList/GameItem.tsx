import ImageCache from "@components/Cache/ImageCache";
import { useMainStore } from "@utils/store.utils";
import { useMemoizedFn } from "ahooks";
import clsx from "clsx";
import { join, pick } from "ramda";
import { useMemo } from "react";

type GameItemProps = BaseComponentProps<"div"> & {
  game: ConsoleGameData;
  index: number;
};

const GameItem = ({ game, index: idx }: GameItemProps) => {
  const index = idx - 1;
  const store = useMainStore((v) => pick(["console", "selected"], v));

  const pathToGame = useMemoizedFn((...args: string[]) => {
    return join("/", [store.console, game.unique, ...args]);
  });

  const isActive = index === 1;

  const x = useMemo(() => {
    const base = index >= 2 ? 16 : 4;
    const gap = 16;
    if (index < -1) return base + 9999 * gap;
    return base + index * gap;
  }, [index]);

  return (
    <div
      className="absolute v-stack"
      style={{
        left: `${x}rem`,
        top: `${isActive ? 1 : 6}rem`,
        transition: "left 0.4s ease-in-out, top 0.375s ease-in-out",
      }}
    >
      <ImageCache
        className={clsx(
          isActive ? "game-item-image-selected" : "game-item-image-unselected",
          "transition-[width,height] ease-in-out duration-500"
        )}
        path={pathToGame("cover.png")}
        url={game.cover}
      />
    </div>
  );
};

export default GameItem;

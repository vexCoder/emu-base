import ImageCache from "@components/Cache/ImageCache";
import { useMainStore } from "@utils/store.utils";
import { useMemoizedFn } from "ahooks";
import clsx from "clsx";
import { join, pick } from "ramda";
import { forwardRef } from "react";

type GameImageProps = BaseComponentProps<"div"> & {
  focused: boolean;
  baseIndex: number;
  segmentLength: number;
  game?: ConsoleGameData;
  selected: number;
  index: number;
  loading: boolean;
};

const GameImage = forwardRef<HTMLDivElement, GameImageProps>(
  (
    {
      focused,
      game,
      selected,
      index: i,
      baseIndex,
      segmentLength,
      loading,
    }: GameImageProps,
    ref
  ) => {
    const store = useMainStore((v) => pick(["console", "selected"], v));

    const pathToGame = useMemoizedFn((...args: string[]) => {
      return join("/", [store.console, game?.unique, ...args]);
    });

    const idx = baseIndex + i;
    const isActive = selected === idx;

    // positioning
    const index = idx + 1 - selected;
    const base = index >= 2 ? 16 : 4;
    const gap = 16;
    const left = base + index * gap;

    return (
      <div className="v-stack">
        <div
          className="fixed"
          ref={i === segmentLength - 1 ? ref : null}
          style={{
            left: `${left}rem`,
            top: `${selected === idx ? 10 : 15}rem`,
            transition: "left 0.4s ease-in-out, top 0.375s ease-in-out",
          }}
        >
          {game && !loading && (
            <ImageCache
              className={clsx(
                isActive
                  ? "game-item-image-selected"
                  : "game-item-image-unselected",
                "transition-[width,height] ease-in-out duration-500",
                focused && isActive && "border-2 border-focus"
              )}
              path={pathToGame("cover.png")}
              url={game.cover}
            />
          )}
        </div>
      </div>
    );
  }
);

export default GameImage;

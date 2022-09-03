import YoutubeAudio from "@elements/YoutubeAudio";
import useGamePad from "@hooks/useGamePad";
import useGetGames from "@hooks/useGetGames";
import { MainStore, useMainStore } from "@utils/store.utils";
import {
  useCounter,
  useCreation,
  useDeepCompareEffect,
  useInViewport,
  useToggle,
  useWhyDidYouUpdate,
} from "ahooks";
import { nanoid } from "nanoid";
import { pick, range } from "ramda";
import { useEffect, useRef } from "react";
import GameDetails from "./GameDetails";
import GameImage from "./GameImage";

const selector = (v: MainStore) =>
  pick(["selected", "select", "count", "cycle", "set", "games"], v);

const GameList = () => {
  const [max, maxCounter] = useCounter(0);
  const [selected, actions] = useCounter(0, {
    min: 0,
    max: max - 1,
  });

  const store = useMainStore(selector);

  useGamePad({
    events: {
      D_PAD_LEFT: (p) => {
        if (p) {
          actions.dec();
        }
      },
      D_PAD_RIGHT: (p) => {
        if (p) {
          actions.inc();
        }
      },
    },
  });

  const tag = store.selected?.opening.split("https://youtu.be/")[1];
  useWhyDidYouUpdate("GameList", { selected, max });
  return (
    <div className="relative mt-[15vh] w-full h-[75vh]">
      <div className="h-[22rem]">
        <Segment
          keyword="final fantasy"
          selected={selected}
          increaseMax={(n: number) => maxCounter.inc(n)}
        />
      </div>

      <GameDetails />

      {/* {store.selected && (
        <div className="absolute left-[48rem] top-[24rem] w-[40vw] text-text">
          <RenderString
            container="div"
            html={store.selected?.description ?? ""}
            nodeRender={renderer}
            className="relative max-h-[40vh] w-full overflow-auto scroll1 pr-3 "
          />
        </div>
      )} */}

      {tag && tag.length && <YoutubeAudio tag={tag} />}
    </div>
  );
};

interface SegmentProps {
  page?: number;
  selected?: number;
  keyword: string;
  increaseMax: (n: number) => void;
}

const Segment = ({
  page = 0,
  keyword,
  selected = 0,
  increaseMax,
}: SegmentProps) => {
  const [shown, actions] = useToggle(false);
  const items = useCreation<string[]>(
    () => range(0, 5).map(() => `${Segment.name}-${nanoid()}`),
    []
  );

  const store = useMainStore(selector);

  const { data, loading } = useGetGames({
    keyword: keyword ?? "final fantasy",
    console: "ps1",
    limit: 5,
    page,
  });

  const ref = useRef(null);
  const [inViewport] = useInViewport(ref);

  const baseIndex = page * 5;

  useDeepCompareEffect(() => {
    if (!loading && data) {
      increaseMax(data.res.length);
    }
  }, [loading, data]);

  useEffect(() => {
    if (inViewport) actions.set(true);
  }, [inViewport, actions]);

  useDeepCompareEffect(() => {
    if (typeof selected === "number" && !loading && data) {
      const idx = selected - baseIndex;
      const d = data.res[idx];

      if (d) {
        store.select(d);
      }
    }
  }, [loading, selected, data]);

  return (
    <>
      {items.map((v, i) => {
        const game = data?.res?.[i];
        return (
          <GameImage
            key={game?.id ?? v}
            game={game}
            segmentLength={items.length}
            baseIndex={baseIndex}
            index={i}
            selected={selected}
            loading={loading}
          />
        );
      })}

      {(inViewport || shown) && !loading && !!data?.hasNext && (
        <Segment
          page={page + 1}
          keyword={keyword}
          selected={selected}
          increaseMax={increaseMax}
        />
      )}
    </>
  );
};

export default GameList;

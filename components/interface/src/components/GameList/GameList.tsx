import YoutubeAudio from "@elements/YoutubeAudio";
import useGetGames from "@hooks/useGetGames";
import useNavigate from "@hooks/useNavigate";
import { MainStore, useMainStore } from "@utils/store.utils";
import {
  useCreation,
  useDeepCompareEffect,
  useInViewport,
  useMemoizedFn,
  useSize,
} from "ahooks";
import { nanoid } from "nanoid";
import { pick, range } from "ramda";
import { useRef, useEffect } from "react";
import GameDetails from "./GameDetails";
import GameImage from "./GameImage";

const selector = (v: MainStore) =>
  pick(
    [
      "selected",
      "select",
      "count",
      "cycle",
      "set",
      "games",
      "disc",
      "search",
      "selectedIndex",
      "list",
    ],
    v
  );

const GameList = () => {
  const ref = useRef(null);
  const size = useSize(ref);

  const store = useMainStore(selector);
  const { focused } = useNavigate("game-list", {
    // autoFocus: true,
    actions: {
      left() {
        store.list.dec();
      },
      right() {
        store.list.inc();
      },
      bottom(setFocus) {
        setFocus("game-details");
      },
      up(setFocus) {
        setFocus("game-header");
      },
    },
  });

  const count = size?.width ? Math.ceil(size.width / 200) : 5;
  const storeSet = useMemoizedFn(store.set);
  useEffect(() => {
    storeSet({ selectedIndex: 0, maxSelectedIndex: count });
  }, [store.search, storeSet, count]);

  const tag = store.selected?.opening?.match(
    /^.*(youtu.be\/|v\/|embed\/|watch\?|youtube.com\/user\/[^#]*#([^/]*?\/)*)\??v?=?([^#&?]*).*/
  )?.[3];

  return (
    <div ref={ref} className="relative mt-[-4vh] w-full h-[75vh]">
      <div className="h-[22rem]">
        {size?.width && (
          <Segment
            focused={focused}
            keyword={store.search}
            selected={store.selectedIndex}
            count={count}
            increaseMax={(n: number) => store.list.incMax(n)}
          />
        )}
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

      {tag && tag.length && !store.disc && <YoutubeAudio tag={tag} />}
    </div>
  );
};

interface SegmentProps {
  focused: boolean;
  page?: number;
  selected?: number;
  keyword: string;
  count?: number;
  increaseMax: (n: number) => void;
}

const Segment = ({
  focused,
  page = 0,
  keyword,
  selected = 0,
  increaseMax,
  count = 5,
}: SegmentProps) => {
  const ref = useRef(null);
  const [inViewport] = useInViewport(ref);

  const items = useCreation<string[]>(
    () => range(0, count).map(() => `${Segment.name}-${nanoid()}`),
    [count]
  );

  const store = useMainStore(selector);

  const { data, loading } = useGetGames({
    keyword: keyword ?? "final fantasy",
    console: "ps1",
    limit: count,
    page,
  });

  const baseIndex = page * count;

  useDeepCompareEffect(() => {
    if (!loading && data) {
      increaseMax(data.res.length);
    }
  }, [loading, data]);

  useDeepCompareEffect(() => {
    if (typeof selected === "number" && !loading && data) {
      const idx = selected - baseIndex;
      const d = data.res[idx];

      if (d) {
        store.select(d);
      }
    }
  }, [loading, selected, data]);

  const showCheck = selected >= (page + 1) * count;

  return (
    <>
      {items.map((v, i) => {
        const game = data?.res?.[i];
        return (
          <GameImage
            focused={focused}
            key={game?.id ?? v}
            game={game}
            segmentLength={items.length}
            baseIndex={baseIndex}
            index={i}
            selected={selected}
            loading={loading}
            {...(i === items.length - 1 && { ref })}
          />
        );
      })}

      {(inViewport || showCheck) && !loading && !!data?.hasNext && (
        <Segment
          focused={focused}
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

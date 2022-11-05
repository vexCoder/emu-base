import YoutubeAudio from "@elements/YoutubeAudio";
import useGetGames from "@hooks/useGetGames";
import useNavigate from "@hooks/useNavigate";
import { MainStore, useMainStore } from "@utils/store.utils";
import {
  useCreation,
  useDeepCompareEffect,
  useMemoizedFn,
  useSize,
  useToggle,
  useUpdateEffect,
} from "ahooks";
import { nanoid } from "nanoid";
import { pick, range } from "ramda";
import { useRef } from "react";
import GameBackgroundImages from "./GameBackgroundImages";
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
      "console",
    ],
    v
  );

const GameList = () => {
  const ref = useRef(null);
  const size = useSize(ref);

  const store = useMainStore(selector);
  const { focused, current } = useNavigate("game-list", {
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
  useUpdateEffect(() => {
    const count2 = size?.width ? Math.ceil(size.width / 200) : 5;
    storeSet({ selectedIndex: 0, maxSelectedIndex: count2 });
  }, [store.search, storeSet, store.console]);

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
            console={store.console}
            count={count}
            lastMax={0}
            increaseMax={(n: number) => store.list.incMax(n)}
          />
        )}
      </div>

      <GameDetails />

      <div className="fixed bg-black/20 w-[18rem] h-[100vh] top-0 left-[10rem] z-[-5]" />
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

      {current !== "game-troubleshoot-opening" &&
        tag &&
        tag.length &&
        !store.disc && <YoutubeAudio tag={tag} />}
      {store.selected && <GameBackgroundImages />}
    </div>
  );
};

interface SegmentProps {
  focused: boolean;
  page?: number;
  selected?: number;
  keyword: string;
  console: string;
  count?: number;
  lastMax: number;
  increaseMax: (n: number) => void;
}

const Segment = ({
  focused,
  page = 0,
  keyword,
  selected = 0,
  increaseMax,
  count = 5,
  console: cons,
  lastMax,
}: SegmentProps) => {
  const [isInViewport, toggle] = useToggle(false);

  const items = useCreation<string[]>(
    () => range(0, count).map(() => `${Segment.name}-${nanoid()}`),
    [count]
  );

  const store = useMainStore(selector);

  const { data, loading } = useGetGames({
    keyword,
    console: cons,
    limit: count,
    page,
  });

  const baseIndex = page * count;

  useDeepCompareEffect(() => {
    if (!loading && data) {
      // increaseMax(data.res.length);
      store.list.setMax(lastMax + (data.res.length - 1));
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

  const handleViewport = useMemoizedFn((check: boolean) => {
    toggle.set(check);
  });

  const showCheck = selected >= (page + 1) * count;

  return (
    <>
      {items.map((v, i) => {
        const game = data?.res?.[i];

        const idx = baseIndex + i;
        const isActive = selected === idx;

        // positioning
        const index = idx + 1 - selected;
        const base = index >= 2 ? 7 : -3;
        const gap = 12;
        const left = base + index * gap;

        const isRef = i === items.length - 1;

        return (
          <GameImage
            focused={focused}
            key={game?.id ?? v}
            cover={game?.cover}
            id={game?.id}
            isRef={isRef}
            isActive={isActive}
            left={left}
            loading={loading}
            onViewport={handleViewport}
          />
        );
      })}

      {(isInViewport || showCheck) && !loading && !!data?.hasNext && (
        <Segment
          focused={focused}
          page={page + 1}
          keyword={keyword}
          selected={selected}
          increaseMax={increaseMax}
          console={store.console}
          lastMax={lastMax + (data.res.length - 1)}
        />
      )}
    </>
  );
};

export default GameList;

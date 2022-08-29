import RenderString from "@elements/RenderString";
import YoutubeAudio from "@elements/YoutubeAudio";
import useGamePad from "@hooks/useGamePad";
import useGetGames from "@hooks/useGetGames";
import { useMainStore } from "@utils/store.utils";
import {
  useCounter,
  useDeepCompareEffect,
  useMemoizedFn,
  useWhyDidYouUpdate,
} from "ahooks";
import { pick, range } from "ramda";
import GameItem from "./GameItem";

const GameList = () => {
  const [offset, offsetActions] = useCounter(2);

  const store = useMainStore((v) =>
    pick(["selected", "select", "count", "cycle", "set", "games"], v)
  );

  const { data, loading } = useGetGames({
    keyword: "final fantasy",
    console: "ps1",
  });

  const positioned: (ConsoleGameData | null)[] = range(0, 9).map((_v, i) => {
    const idx = (i - offset) % 9;
    if (i - offset > data.length) return null;
    return store.games[idx] || null;
  });

  const handleCycle = (prev: boolean = false) => {
    if (prev) offsetActions.inc();
    if (!prev) offsetActions.dec();

    store.cycle(prev);
  };

  if (!store.games.length && !loading && data?.length) {
    store.set({ games: data });
  }

  if (!store.selected && !loading && data?.length) {
    store.select(store.games[0]);
  }

  const { buttonState } = useGamePad({
    delay: 600,
    events: {
      D_PAD_LEFT: (p) => p && handleCycle(true),
      D_PAD_RIGHT: (p) => p && handleCycle(),
    },
  });

  useWhyDidYouUpdate("GameList", {
    buttonState,
  });

  useDeepCompareEffect(() => {
    if (!loading) store.set({ games: [] });
  }, [loading]);

  const renderer = useMemoizedFn((c: ChildNode) => {
    if (c.nodeName === "BR")
      return <divider is="" className="block relative mb-4 w-full" />;
    if (c.nodeType === Node.TEXT_NODE)
      return <p className=" text-sm w-full indent-8"> {c.textContent} </p>;

    return undefined;
  });

  const tag = store.selected?.opening.split("https://youtu.be/")[1];

  return (
    <div className="relative mt-[15vh] w-full h-[75vh]">
      <button onClick={() => handleCycle(true)}>Prev</button>
      <button onClick={() => handleCycle()}>Next</button>
      <div className="relative overflow-hidden h-full">
        {data.map((game) =>
          game ? (
            <GameItem
              key={game.id}
              game={game}
              index={positioned.findIndex((v) => v?.id === game.id)}
            />
          ) : (
            <placeholder />
          )
        )}
      </div>

      {store.selected && (
        <div className="absolute left-[48rem] top-[24rem] w-[40vw] text-text">
          <RenderString
            container="div"
            html={store.selected?.description ?? ""}
            nodeRender={renderer}
            className="relative max-h-[40vh] w-full overflow-auto scroll1 pr-3 font-[]"
          />
        </div>
      )}

      {tag && tag.length && <YoutubeAudio tag={tag} mute />}
    </div>
  );
};

export default GameList;

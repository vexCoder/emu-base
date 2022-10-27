import Modal from "@elements/Modal";
import RenderString from "@elements/RenderString";
import Transition from "@elements/Transition";
import useGetGameFiles from "@hooks/useGetGameFiles";
import { extractString } from "@utils/helper";
import { MainStore, useMainStore } from "@utils/store.utils";
import {
  useCounter,
  useDebounce,
  useDeepCompareEffect,
  useToggle,
  useUpdateEffect,
} from "ahooks";
import clsx from "clsx";
import { clamp, pick } from "ramda";
import { useEffect, useRef } from "react";
import useNavigate from "@hooks/useNavigate";
import useGetGame from "@hooks/useGetGame";
import { HeartIcon, PlayIcon, WrenchIcon } from "@heroicons/react/24/outline";
import GameRegionSettings from "./GameRegionSettings";
import GameDiscList from "./GameDiscList";
import GameTroubleshoot from "./GameTroubleshoot";

const selector = (v: MainStore) => pick(["selected", "console", "play"], v);

const renderer = (c: ChildNode) => {
  if (c.nodeName === "BR")
    return <divider className="block relative w-full h-1" />;

  let text = c.textContent?.toString();
  const lis = [/(?:\s)(-)(?:\s)/g, /((?<=;)(-))/g, /(^-)/g];
  if (!text) return null;
  if (text.indexOf("&nbsp;") !== 1) text = text.replace(/&nbsp;/g, " ");
  const check = lis.some((v) => extractString(v, text ?? "", false));
  const find = lis.find((v) => !!extractString(v, text ?? "", false));
  if (check && find) text = text.replace(find, " • ");
  if (c.nodeType === Node.TEXT_NODE) {
    return (
      <>
        {text}
        <divider className="block relative w-full h-1" />
      </>
    );
  }

  return <strong>{text}</strong>;
};

const GameDetails = () => {
  const [btnSlected, navActions] = useCounter(0, {
    min: 0,
    max: 2,
  });

  const [kbdOpen, kbdActions] = useToggle(false);
  const [open, actions] = useToggle(false);
  const [modalOpen, actionsModal] = useToggle(false);
  const [isFavorite, favoriteActions] = useToggle(false);
  const [tsOpen, tsActions] = useToggle(false);
  const [downloaderOpen, actionsDownloader] = useToggle(false);
  const store = useMainStore(selector);
  const { selected } = store;
  const cons = store.console;

  const { data: gameData, refresh: gameRefreshData } = useGetGame({
    console: cons,
    id: selected?.id,
  });

  const descriptRef = useRef<HTMLDivElement>(null);

  const { data, loading, refresh } = useGetGameFiles({
    id: selected?.id ?? "",
    console: cons,
  });

  if (!open) {
    descriptRef?.current?.scrollTo({
      top: 0,
    });
  }

  useEffect(() => {
    refresh();
  }, [modalOpen, refresh]);

  useDeepCompareEffect(() => {
    favoriteActions.set(!!gameData?.isFavorite);
  }, [gameData]);

  const debouncedValue = useDebounce(isFavorite, { wait: 150 });

  useUpdateEffect(() => {
    if (selected?.id) {
      window.data
        .toggleFavorite(selected.id, cons, isFavorite)
        .then(() => gameRefreshData());
    }
  }, [debouncedValue]);

  const { focused, setFocus } = useNavigate("game-details", {
    actions: {
      up() {
        if (btnSlected === 0) setFocus("game-list");
        else navActions.dec();
      },
      bottom() {
        navActions.inc();
      },
      right() {
        setFocus("game-descript");
      },
      btnBottom() {
        if (btnSlected === 0) {
          handlePlay();
          if (!data) {
            setFocus?.("game-disc");
          } else {
            setFocus?.("game-play");
          }
        }

        if (btnSlected === 1 && selected) {
          favoriteActions.toggle();
        }

        if (btnSlected === 2 && selected) {
          tsActions.set(true);
          setFocus("game-troubleshoot");
        }
      },
    },
  });

  const { focused: focusedDescription } = useNavigate("game-descript", {
    actions: {
      left() {
        if (!open) setFocus("game-details");
      },
      up() {
        if (!open) setFocus("game-list");
        if (open) {
          const scrollHeight = descriptRef.current?.scrollHeight ?? 0;
          const scrollTop = descriptRef.current?.scrollTop ?? 0;
          descriptRef.current?.scrollTo({
            behavior: "smooth",
            top: clamp(0, scrollHeight, scrollTop - scrollHeight * 0.1),
          });
        }
      },
      bottom() {
        if (open) {
          const scrollHeight = descriptRef.current?.scrollHeight ?? 0;
          const scrollTop = descriptRef.current?.scrollTop ?? 0;
          descriptRef.current?.scrollTo({
            behavior: "smooth",
            top: clamp(0, scrollHeight, scrollTop + scrollHeight * 0.1),
          });
        }
      },
      btnBottom() {
        actions.toggle();
      },
    },
  });

  if (!gameData) return null;

  const handlePlay = () => {
    refresh();
    if (!data) actionsModal.set(true);
    actionsDownloader.set(true);
  };

  return (
    <>
      {gameData && (
        <Modal
          duration={0.3}
          open={tsOpen}
          handleClose={() => tsActions.set(false)}
          className={clsx("transition-[top]", kbdOpen && "top-1/4")}
        >
          <GameTroubleshoot
            onKeyboardOpen={(bool) => kbdActions.set(!!bool)}
            onClose={() => tsActions.set(false)}
          />
        </Modal>
      )}
      {gameData && (
        <GameRegionSettings
          id={gameData.id}
          console={store.console}
          open={modalOpen}
          onLinksSave={() => {
            setFocus("game-play");
            actionsModal.set(false);
          }}
          onClose={() => {
            setFocus("game-details");
            actionsModal.set(false);
          }}
        />
      )}
      {gameData && data && (
        <Modal
          className="max-w-[150px]"
          duration={0.3}
          open={downloaderOpen}
          handleClose={() => actionsDownloader.set(false)}
        >
          <GameDiscList
            open={downloaderOpen}
            game={gameData}
            settings={data}
            console={store.console}
            onDownload={() => {
              refresh();
            }}
            onPlay={(serial) => {
              store.play(serial);
            }}
            onClose={() => actionsDownloader.set(false)}
          />
        </Modal>
      )}
      <section className="h-stack ml-[20rem]">
        <Transition
          in={!!gameData}
          ease="easeInOut"
          duration={[0.5, 2.25]}
          preset="SlideY"
        >
          <aside className="v-stack gap-4 mt-[4rem] [&>*:first-child]:mt-5">
            <button
              type="button"
              className={clsx(
                "game-item-button mt-5 text-text bg-green-500/20",
                focused && btnSlected === 0 && "border-focus",
                (!focused || btnSlected !== 0) && "border-green-700"
              )}
              onClick={handlePlay}
              disabled={loading}
            >
              <div className="inline-flex flex-row items-center justify-between w-full px-5">
                <p className="flex-auto flex-grow-0 leading-[1em]">Play</p>
                <PlayIcon width="1.5em" height="1.5em" />
              </div>
            </button>
            <button
              type="button"
              className={clsx(
                "game-item-button text-text bg-secondary/20",
                focused && btnSlected === 1 && "border-focus",
                (!focused || btnSlected !== 1) && "border-secondary"
              )}
            >
              <div className="inline-flex flex-row items-center justify-between w-full px-5">
                <p className="flex-auto flex-grow-0 leading-[1em]">Favorite</p>
                <HeartIcon
                  width="1.5em"
                  height="1.5em"
                  className={clsx(
                    "transition-colors",
                    isFavorite && "fill-red-500 text-red-700"
                  )}
                />
              </div>
            </button>
            <button
              type="button"
              className={clsx(
                "game-item-button text-text bg-secondary/20",
                focused && btnSlected === 2 && "border-focus",
                (!focused || btnSlected !== 2) && "border-secondary"
              )}
            >
              <div className="inline-flex flex-row items-center justify-between w-full px-5">
                <p className="flex-auto flex-grow-0 leading-[1em]">
                  Troubleshoot
                </p>
                <WrenchIcon width="1.5em" height="1.5em" />
              </div>
            </button>
          </aside>
        </Transition>

        <section className="v-stack gap-2 ml-[4rem] max-w-md">
          <p className="font-[LibreBaskerville] tracking-wider capitalize text-text text-3xl">
            {gameData.official}
          </p>
          <p className="font-[JosefinSans] text-text text-lg">
            {`${gameData.developer} / ${gameData.publisher}`}
          </p>
          <p className="h-stack gap-3 font-[JosefinSans] text-text text-sm">
            {gameData.genre.map((v) => (
              <span key={v} className="bg-secondary/10 rounded-2xl px-3 py-1">
                {v}
              </span>
            ))}
          </p>

          <section
            onClick={() => actions.toggle()}
            onKeyDown={() => {}}
            role="button"
            tabIndex={0}
            className=""
            style={{ transition: "background 0.15s ease-in-out" }}
          >
            {open && (
              <div className="w-[100vw] h-[100vh] fixed z-40 top-0 left-0 bg-black/50" />
            )}
            <div
              className={clsx(
                "p-4 rounded-2xl box-border cursor-pointer mt-1",
                !open && "bg-secondary/10",
                open &&
                  "bg-primary p-4 fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                focusedDescription && "border-2 border-focus"
              )}
              style={{ transition: "all 0.15s ease-in-out" }}
            >
              <RenderString
                ref={descriptRef}
                html={gameData.description}
                container="div"
                nodeRender={renderer}
                className={clsx(
                  !open && "overflow-hidden line-clamp-6",
                  open && "overflow-auto line-clamp-none",
                  "indent-8 text-sm text-text max-w-md text-justify pr-2 max-h-[45vh]"
                )}
                style={{ transition: "all 0.5s ease-in-out" }}
              />
            </div>
          </section>
        </section>
      </section>
    </>
  );
};

export default GameDetails;

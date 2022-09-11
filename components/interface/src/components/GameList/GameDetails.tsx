import Modal from "@elements/Modal";
import RenderString from "@elements/RenderString";
import Transition from "@elements/Transition";
import useGetGameFiles from "@hooks/useGetGameFiles";
import { extractString } from "@utils/helper";
import { MainStore, useMainStore } from "@utils/store.utils";
import { useToggle } from "ahooks";
import clsx from "clsx";
import { pick } from "ramda";
import { useEffect } from "react";
import GameRegionSettings from "./GameRegionSettings";
import GameDiscList from "./GameDiscList";

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
  const [open, actions] = useToggle(false);
  const [modalOpen, actionsModal] = useToggle(false);
  const [downloaderOpen, actionsDownloader] = useToggle(false);
  const store = useMainStore(selector);
  const { selected } = store;
  const cons = store.console;

  const { data, loading, refresh } = useGetGameFiles({
    id: selected?.id ?? "",
    console: cons,
  });

  useEffect(() => {
    refresh();
  }, [modalOpen, refresh]);

  if (!store.selected) return null;

  const handlePlay = () => {
    refresh();
    if (!data) actionsModal.set(true);
    actionsDownloader.set(true);
  };

  return (
    <>
      {store.selected && (
        <Modal
          duration={0.3}
          open={modalOpen}
          handleClose={() => actionsModal.set(false)}
        >
          <GameRegionSettings
            id={store.selected.id}
            console={store.console}
            onLinksSave={() => actionsModal.set(false)}
          />
        </Modal>
      )}
      {store.selected && data && (
        <Modal
          duration={0.3}
          open={downloaderOpen}
          handleClose={() => actionsDownloader.set(false)}
        >
          <GameDiscList
            game={store.selected}
            settings={data}
            console={store.console}
            onDownload={() => {
              refresh();
            }}
            onPlay={(serial) => {
              store.play(serial);
            }}
          />
        </Modal>
      )}
      <section className="h-stack ml-[20rem]">
        <Transition
          in={!!store.selected}
          ease="easeInOut"
          duration={[0.5, 2.25]}
          preset="SlideY"
        >
          <aside className="v-stack gap-4 mt-[4rem] [&>*:first-child]:mt-5">
            <button
              type="button"
              className="game-item-button bg-highlight mt-5 text-text "
              onClick={handlePlay}
              disabled={loading}
            >
              Play
            </button>
            <button
              type="button"
              className="game-item-button bg-secondary text-contrastText "
            >
              Favorite
            </button>
            <button
              type="button"
              className="game-item-button bg-secondary text-contrastText "
            >
              Troubleshoot
            </button>
          </aside>
        </Transition>

        <section className="v-stack gap-2 ml-[4rem] max-w-md">
          <p className="font-[LibreBaskerville] tracking-wider capitalize text-text text-3xl">
            {store.selected.official}
          </p>
          <p className="font-[JosefinSans] text-text text-lg">
            {`${store.selected.developer} / ${store.selected.publisher}`}
          </p>
          <p className="h-stack gap-3 font-[JosefinSans] text-text text-sm">
            {store.selected.genre.map((v) => (
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
                  "bg-primary p-4 fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              )}
              style={{ transition: "all 0.15s ease-in-out" }}
            >
              <RenderString
                html={store.selected.description}
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

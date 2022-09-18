import Modal from "@elements/Modal";
import {
  BookmarkSquareIcon,
  ChartBarIcon,
  ForwardIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import MountSubscriber from "@providers/MountSubscriber";
import { useOverlayStore } from "@utils/store.utils";
import { useMount } from "ahooks";
import clsx from "clsx";
import _ from "lodash";
import { tail } from "ramda";
import { useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import "virtual:fonts.css";

const rootElement =
  document.getElementById("root") ?? document.createElement("body");

const root = ReactDOM.createRoot(rootElement);

const Overlay = () => {
  return (
    <MountSubscriber>
      <div className="w-[100vw] h-[100vh] p-4">
        <div className="w-[250px] h-[75px] font-bold text-text rounded-xl z-[100]">
          <FPS />
        </div>

        <Menu />
        <States />
      </div>
    </MountSubscriber>
  );
};

const Menu = () => {
  const store = useOverlayStore();

  useMount(() => {
    if (window.emulator) {
      window.emulator.onKey((val) => {
        if (val === "key.down")
          store.set((prev) => ({
            ...prev,
            focus: _.clamp(prev.focus + 1, 0, 3),
          }));

        if (val === "key.up")
          store.set((prev) => ({
            ...prev,
            focus: _.clamp(prev.focus - 1, 0, 3),
          }));

        if (val === "key.ps") {
          store.set((prev) => ({
            ...prev,
            route: prev.route ? undefined : "menu",
          }));
        }

        if (val === "key.cross") {
          store.set((prev) => {
            if (prev.route === "states") return prev;
            if (prev.focus === 3) {
              window.emulator.quit();
            }

            if (prev.focus === 2) {
              window.emulator.toggleTurbo();
            }

            if (prev.focus === 1) {
              return { ...prev, fps: !prev.fps };
            }

            if (prev.focus === 0) {
              return { ...prev, route: "states" };
            }

            return prev;
          });
        }
      });

      window.emulator.onData((val) => {
        if (val?.evt === "event.toggleTurbo") {
          store.set({ turbo: val?.value });
        }

        if (val?.evt === "event.toggleFPS") {
          store.set({ fps: val?.value });
        }

        if (val?.evt === "event.play") {
          store.set(val?.value ?? {});
        }
      });
    }
  });

  if (store.route !== "menu") return null;
  return (
    <Modal
      classes={{
        backdrop: "bg-transparent",
      }}
      open={store.route === "menu"}
      handleClose={() => store.set({ route: undefined })}
    >
      <div className="v-stack gap-2">
        <button
          className={clsx(
            "overlay-menu-button",
            store.focus === 0 && "bg-highlight/20"
          )}
          type="button"
        >
          <div className="h-stack items-center gap-2">
            <BookmarkSquareIcon
              className="text-text"
              width="1em"
              height="1em"
            />
            <p>Save/Load</p>
          </div>
        </button>
        <button
          className={clsx(
            "overlay-menu-button",
            store.focus === 1 && "bg-highlight/20"
          )}
          type="button"
        >
          <div className="h-stack items-center gap-2 w-full">
            <ChartBarIcon className="text-text" width="1em" height="1em" />
            <p>FPS:</p>
            <p
              className={clsx(
                "ml-auto font-bold",
                store.fps && "text-green-400",
                !store.fps && "text-red-400"
              )}
            >
              {store.fps ? "On" : "Off"}
            </p>
          </div>
        </button>
        <button
          className={clsx(
            "overlay-menu-button",
            store.focus === 2 && "bg-highlight/20"
          )}
          type="button"
        >
          <div className="h-stack items-center gap-2 w-full">
            <ForwardIcon className="text-text" width="1em" height="1em" />
            <p>Turbo:</p>
            <p
              className={clsx(
                "ml-auto font-bold",
                store.turbo && "text-green-400",
                !store.turbo && "text-red-400"
              )}
            >
              {store.turbo ? "On" : "Off"}
            </p>
          </div>
        </button>
        <button
          className={clsx(
            "overlay-menu-button",
            store.focus === 3 && "bg-highlight/20"
          )}
          type="button"
        >
          <div className="h-stack items-center gap-2 w-full">
            <XCircleIcon className="text-text" width="1em" height="1em" />
            <p>Quit</p>
          </div>
        </button>
      </div>
    </Modal>
  );
};

const States = () => {
  const store = useOverlayStore();

  const slots = _.range(0, 4);

  useMount(() => {
    if (window.emulator) {
      window.emulator.onKey((val) => {
        if (val === "key.down")
          store.set((prev) => ({
            ...prev,
            stateFocus: _.clamp(prev.stateFocus + 1, 0, 4),
            stateFocusDecide: 0,
          }));

        if (val === "key.up")
          store.set((prev) => ({
            ...prev,
            stateFocus: _.clamp(prev.stateFocus - 1, 0, 4),
            stateFocusDecide: 0,
          }));

        if (val === "key.left")
          store.set((prev) => ({
            ...prev,
            stateFocusDecide: prev.stateFocusDecide === 1 ? 0 : 1,
          }));

        if (val === "key.right")
          store.set((prev) => ({
            ...prev,
            stateFocusDecide: prev.stateFocusDecide === -1 ? 0 : -1,
          }));

        if (val === "key.cross") {
          store.set((prev) => {
            if (prev.route === "menu") return prev;

            if (prev.focus === 4) {
              return { ...prev, route: "menu" };
            }

            if (prev.stateFocusDecide === 1) {
              window.emulator.saveToSlot(prev.stateFocus);
            }

            if (prev.stateFocusDecide === -1) {
              window.emulator.loadFromSlot(prev.stateFocus);
            }

            return {
              ...prev,
              stateFocusDecide: 0,
              stateFocus: 0,
            };
          });
        }
      });
    }
  });

  if (store.route !== "states") return null;
  return (
    <Modal
      classes={{
        backdrop: "bg-transparent",
      }}
      open={store.route === "states"}
      handleClose={() => store.set({ route: undefined })}
    >
      <div className="v-stack gap-2">
        {slots.map((v) => (
          <div
            className={clsx(
              "overlay-menu-button relative overflow-hidden",
              store.focus === v && "bg-highlight/20"
            )}
            key={`${v}_slot`}
          >
            {store.stateFocus === v && (
              <>
                <div
                  className={clsx(
                    "absolute top-0 w-[50%] h-full bg-focus text-text font-boold",
                    store.stateFocusDecide === -1 && "left-[50%]",
                    store.stateFocusDecide !== -1 && "left-[-50%]"
                  )}
                >
                  Load
                </div>
                <div
                  className={clsx(
                    "absolute top-0 w-[50%] h-full bg-green-400 text-text font-boold",
                    store.stateFocusDecide === 1 && "right-[50%]",
                    store.stateFocusDecide !== 1 && "left-[-50%]"
                  )}
                >
                  Save
                </div>
              </>
            )}
            <div className="h-stack items-center gap-2 w-full">
              <p>Slot {v}</p>
            </div>
          </div>
        ))}
        <div
          className={clsx(
            "overlay-menu-button",
            store.stateFocus === 4 && "bg-highlight/20"
          )}
        >
          <div className="h-stack items-center gap-2 w-full">
            <XCircleIcon className="text-text" width="1em" height="1em" />
            <p>Return</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const FPS = () => {
  const store = useOverlayStore();
  const recentFpsRef = useRef<number[]>([]);
  const [fps, setFps] = useState(0);
  const [refreshRate, setRefreshRate] = useState(0);

  useMount(() => {
    if (window.emulator) {
      window.emulator.onFPS((val) => {
        setFps(val?.fps ?? 0);
        setRefreshRate(val?.refreshRate ?? 0);
        const { length } = recentFpsRef.current;
        recentFpsRef.current = [
          ...(length > 10 ? tail(recentFpsRef.current) : recentFpsRef.current),
          val?.fps ?? 0,
        ];
      });
    }
  });

  const percent = (fps / refreshRate) * 100;
  const ave = recentFpsRef.current.length
    ? recentFpsRef.current.reduce((a, b) => a + b) / recentFpsRef.current.length
    : 0;

  if (!store.fps) return null;
  return (
    <p className="text-xs">
      <span className="text-yellow-400">FPS</span>&nbsp;
      <span
        className={clsx(
          percent > 80 && "text-green-400",
          percent > 60 && "text-yellow-400",
          percent < 60 && "text-red-400"
        )}
      >
        {`${fps} (${percent.toFixed(0)}%)`}
      </span>
      <br />
      <span className="text-yellow-400">AVE</span>&nbsp;
      {`${ave.toFixed(0)}`}
    </p>
  );
};

root.render(<Overlay />);

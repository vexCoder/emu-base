import Modal from "@elements/Modal";
import {
  BookmarkSquareIcon,
  ChartBarIcon,
  ForwardIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useOverlayStore } from "@utils/store.utils";
import { useMount } from "ahooks";
import clsx from "clsx";
import _ from "lodash";

const OverlayMenu = () => {
  const store = useOverlayStore();

  useMount(() => {
    if (window.emulator) {
      window.emulator.onKey((opts) => {
        const { key, payload } = opts ?? {};
        if (key === "key.down")
          store.set((prev) => ({
            ...prev,
            focus: _.clamp(prev.focus + 1, 0, 3),
          }));

        if (key === "key.up")
          store.set((prev) => ({
            ...prev,
            focus: _.clamp(prev.focus - 1, 0, 3),
          }));

        if (key === "key.ps") {
          store.set((prev) => ({
            ...prev,
            route: !payload ? undefined : "menu",
          }));
        }

        if (key === "key.cross") {
          store.set((prev) => {
            if (prev.route !== "menu") return prev;
            if (prev.focus === 3) {
              window.emulator.quit();
            }

            if (prev.focus === 2 && !prev.disableTurbo) {
              window.emulator.toggleTurbo();
              setTimeout(() => {
                store.set({ disableTurbo: false });
              }, 1500);
              return { ...prev, disableTurbo: true };
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
            store.focus === 2 && "bg-highlight/20",
            store.disableTurbo && "text-gray-400/50 border-gray-400/40"
          )}
          type="button"
          disabled={store.disableTurbo}
        >
          <div className="h-stack items-center gap-2 w-full">
            <ForwardIcon
              className={clsx(
                "text-text",
                store.disableTurbo && "text-gray-400/50"
              )}
              width="1em"
              height="1em"
            />
            <p>Turbo:</p>
            <p
              className={clsx(
                "ml-auto font-bold",
                store.turbo && "text-green-400",
                !store.turbo && "text-red-400",
                store.disableTurbo && "text-gray-400/50"
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

export default OverlayMenu;

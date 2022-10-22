import Modal from "@elements/Modal";
import {
  BookmarkSquareIcon,
  ChartBarIcon,
  ForwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useOverlayStore } from "@utils/store.utils";
import clsx from "clsx";
import _ from "lodash";

const OverlayMenuContent = () => {
  const store = useOverlayStore();

  return (
    <div className="v-stack gap-2">
      <button
        className={clsx(
          "overlay-menu-button",
          store.focus === 0 && "bg-highlight/20"
        )}
        type="button"
      >
        <div className="h-stack items-center gap-2">
          <BookmarkSquareIcon className="text-text" width="1em" height="1em" />
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
          {!store.mute && (
            <SpeakerWaveIcon className="text-text" width="1em" height="1em" />
          )}
          {store.mute && (
            <SpeakerXMarkIcon className="text-text" width="1em" height="1em" />
          )}
          <p>Volume:</p>
          <div
            className={clsx(
              "h-stack ml-auto font-bold h-6 py-[0.1rem] gap-1 items-end"
            )}
          >
            {_.range(5).map((v) => (
              <div
                className={clsx(
                  "w-2 bg-green-500",
                  store.volume <= v && "bg-red-400",
                  store.mute && "bg-gray-400"
                )}
                style={{ height: `${v * 20 + 20}%` }}
              />
            ))}
          </div>
        </div>
      </button>
      <button
        className={clsx(
          "overlay-menu-button",
          store.focus === 3 && "bg-highlight/20",
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
          store.focus === 4 && "bg-highlight/20"
        )}
        type="button"
      >
        <div className="h-stack items-center gap-2 w-full">
          <XCircleIcon className="text-text" width="1em" height="1em" />
          <p>Quit</p>
        </div>
      </button>
    </div>
  );
};

const OverlayMenu = () => {
  const store = useOverlayStore();

  return (
    <Modal
      classes={{
        backdrop: "bg-transparent",
      }}
      open={store.route === "menu" && store.open}
      handleClose={() => store.set({ open: false })}
    >
      <OverlayMenuContent />
    </Modal>
  );
};

export default OverlayMenu;

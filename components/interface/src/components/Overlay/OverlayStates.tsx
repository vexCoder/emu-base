import Modal from "@elements/Modal";
import {
  ArrowPathIcon,
  BookmarkSquareIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useOverlayStore } from "@utils/store.utils";
import { useMount } from "ahooks";
import clsx from "clsx";
import _ from "lodash";

const OverlayStates = () => {
  const store = useOverlayStore();

  const slots = _.range(0, 4);

  useMount(() => {
    if (window.emulator) {
      window.emulator.onKey((opts) => {
        const { key } = opts ?? {};
        if (key === "key.down")
          store.set((prev) => ({
            ...prev,
            stateFocus: _.clamp(prev.stateFocus + 1, 0, 4),
            stateFocusDecide: 0,
          }));

        if (key === "key.up")
          store.set((prev) => ({
            ...prev,
            stateFocus: _.clamp(prev.stateFocus - 1, 0, 4),
            stateFocusDecide: 0,
          }));

        if (key === "key.left")
          store.set((prev) => ({
            ...prev,
            stateFocusDecide: prev.stateFocusDecide === 1 ? 0 : 1,
          }));

        if (key === "key.right")
          store.set((prev) => ({
            ...prev,
            stateFocusDecide: prev.stateFocusDecide === -1 ? 0 : -1,
          }));

        if (key === "key.cross") {
          store.set((prev) => {
            if (prev.route !== "states") return prev;
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
              route: undefined,
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
                    "absolute top-0 w-[50%] rounded-md  h-full bg-focus text-text font-bold",
                    "rounded-md px-2 py-1",
                    "transition-all duration-75 ease-in-out",
                    store.stateFocusDecide === -1 && "right-[0%]",
                    store.stateFocusDecide !== -1 && "right-[-50%]"
                  )}
                >
                  <div className="h-stack items-center gap-2 w-full">
                    <ArrowPathIcon
                      className="text-text"
                      width="1em"
                      height="1em"
                    />
                    <p>Load</p>
                  </div>
                </div>
                <div
                  className={clsx(
                    "absolute top-0 w-[50%] h-full bg-green-500 text-text font-bold",
                    "rounded-md px-2 py-1",
                    "transition-all duration-75 ease-in-out",
                    store.stateFocusDecide === 1 && "left-[0%]",
                    store.stateFocusDecide !== 1 && "left-[-50%]"
                  )}
                >
                  <div className="h-stack items-center gap-2 w-full">
                    <BookmarkSquareIcon
                      className="text-text"
                      width="1em"
                      height="1em"
                    />
                    <p>Save</p>
                  </div>
                </div>
              </>
            )}
            <div
              className={clsx(
                "h-stack items-center gap-2 w-full",
                "transition-all duration-75 ease-in-out",
                store.stateFocus === v &&
                  store.stateFocusDecide === 1 &&
                  "pl-[52%]"
              )}
            >
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

export default OverlayStates;

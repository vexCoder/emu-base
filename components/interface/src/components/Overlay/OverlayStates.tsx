import Modal from "@elements/Modal";
import SlotImage from "@elements/SlotImage";
import {
  ArrowPathIcon,
  BookmarkSquareIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useOverlayStore } from "@utils/store.utils";
import clsx from "clsx";
import dayjs from "dayjs";
import _ from "lodash";
import { nanoid } from "nanoid";

const slots = _.range(0, 4).map((i) => ({
  index: i,
  id: nanoid(5),
}));

const OverlayStatesContent = () => {
  const store = useOverlayStore();

  return (
    <div className="v-stack gap-2">
      <div className="h-stack gap-3">
        <div className="relative rounded-xl overflow-hidden flex-grow-0 flex-shrink-0 flex-[182px] max-w-24">
          {store.game && store.console && (
            <SlotImage
              className="w-full h-full"
              console={store.console}
              game={store.game}
              slot={store.stateFocus}
              timestamp={store.states[store.stateFocus] ?? 0}
              imageProps={{
                className: "w-full h-full object-contain",
              }}
            />
          )}
        </div>
        <div className="v-stack flex-[3] gap-2">
          {slots.map(({ index: v, id }) => {
            const lastSaved = dayjs.unix(store.states[v]);
            return (
              <div
                className={clsx(
                  "overlay-menu-button relative overflow-hidden h-9",
                  store.stateFocus === v && "bg-highlight/20",
                  store.stateFocus !== v && "bg-transparent"
                )}
                key={`${id}_slot`}
              >
                {store.stateFocus === v && (
                  <>
                    <div
                      className={clsx(
                        "absolute top-0 w-[70%] rounded-md  h-full bg-focus text-text font-bold z-20",
                        "rounded-md px-2 py-1",
                        "transition-all duration-75 ease-in-out",
                        store.stateFocusDecide === 1 && "right-[0%]",
                        store.stateFocusDecide !== 1 && "right-[-70%]"
                      )}
                    >
                      <div className="h-stack items-center gap-2 w-full">
                        <ArrowPathIcon
                          className="text-text"
                          width="1.25rem"
                          height="1.25rem"
                        />
                        <p className="text-lg">Load</p>
                      </div>
                    </div>
                    <div
                      className={clsx(
                        "absolute top-0 w-[70%] h-full bg-green-500 text-text font-bold z-20",
                        "rounded-md px-2 py-1",
                        "transition-all duration-75 ease-in-out",
                        store.stateFocusDecide === -1 && "left-[0%]",
                        store.stateFocusDecide !== -1 && "left-[-70%]"
                      )}
                    >
                      <div className="h-stack items-center gap-2 w-full">
                        <BookmarkSquareIcon
                          className="text-text"
                          width="1.25rem"
                          height="1.25rem"
                        />
                        <p className="text-lg">Save</p>
                      </div>
                    </div>
                  </>
                )}

                <div
                  className={clsx(
                    "absolute h-stack items-center justify-between gap-2",
                    "h-full w-[calc(100%-1rem)] px-2 box-content",
                    "transition-all duration-75 ease-in-out left-0 top-0 z-10",
                    store.stateFocus === v &&
                      store.stateFocusDecide === -1 &&
                      "left-[72%]"
                  )}
                >
                  <p className="text-lg">Slot {v}</p>
                  <p className="text-lg">
                    {lastSaved.isValid()
                      ? lastSaved.format("MM-DD-YY HH:MM:ss")
                      : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div
        className={clsx(
          "overlay-menu-button",
          store.stateFocus === 4 && "bg-highlight/20"
        )}
      >
        <div className="h-stack items-center gap-2 w-full">
          <XCircleIcon className="text-text" width="1.25rem" height="1.25rem" />
          <p className="text-lg">Return</p>
        </div>
      </div>
    </div>
  );
};

const OverlayStates = () => {
  const store = useOverlayStore();

  return (
    <Modal
      classes={{
        backdrop: "bg-transparent",
        content: "top-[45%]",
      }}
      open={store.route === "states" && store.open}
      handleClose={() => store.set({ open: false })}
    >
      <OverlayStatesContent />
    </Modal>
  );
};

export default OverlayStates;

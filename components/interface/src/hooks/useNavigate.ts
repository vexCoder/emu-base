import { useMainStore } from "@utils/store.utils";
import { useLatest, useMemoizedFn, useMount } from "ahooks";
import { useEffect, useState } from "react";
import useGamePad from "./useGamePad";

type ActionType =
  | "left"
  | "right"
  | "up"
  | "bottom"
  | "btnBottom"
  | "btnLeft"
  | "btnRight"
  | "btnUp"
  | "ctrlMiddle"
  | "ctrlRight"
  | "ctrlLeft";

type Actions = Record<ActionType, (setFocus: (focus: string) => void) => void>;

interface UseNavigateOptions {
  onFocus?: (key: string) => void;
  autoFocus?: boolean;
  actions?: Partial<Actions>;
  globalActions?: Partial<Actions>;
}

const useNavigate = (
  key: string,
  options?: UseNavigateOptions,
  deps: any[] = []
) => {
  const store = useMainStore();
  const [active, setActive] = useState(false);
  const isFocused = store.focused === key;
  const onFocus = useMemoizedFn(options?.onFocus ?? (() => {}));

  const latestData = useLatest({
    key,
    gamepad: store.gamepad,
    active,
    isFocused,

    actions: options?.actions,
    globalActions: options?.globalActions,
  });

  useMount(() => {
    if (options?.autoFocus) {
      setFocus(key);
    }
  });

  useEffect(() => {
    if (isFocused) {
      onFocus?.(key);
      setActive(true);
    } else {
      setActive(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, key, onFocus, ...deps]);

  const setFocus = (focus: string) => {
    store.set({ focused: focus });
  };

  const press = (fn: ActionType) => {
    if (
      latestData.current.gamepad &&
      latestData.current.active &&
      latestData.current.actions?.[fn]
    ) {
      latestData.current.actions?.[fn]?.(setFocus);
    }

    if (latestData.current.globalActions?.[fn]) {
      latestData.current.globalActions[fn]?.(setFocus);
    }
  };

  useGamePad(
    {
      onConnect: (gp) => {
        store.set({ gamepad: gp });
      },
      events: {
        D_PAD_LEFT: (p) => p && press("left"),
        D_PAD_RIGHT: (p) => p && press("right"),
        D_PAD_UP: (p) => p && press("up"),
        D_PAD_BOTTOM: (p) => p && press("bottom"),
        BUTTON_BOTTOM: (p) => p && press("btnBottom"),
        BUTTON_TOP: (p) => p && press("btnUp"),
        BUTTON_LEFT: (p) => p && press("btnLeft"),
        BUTTON_RIGHT: (p) => p && press("btnRight"),
        BUTTON_CONTROL_LEFT: (p) => p && press("ctrlLeft"),
        BUTTON_CONTROL_RIGHT: (p) => p && press("ctrlRight"),
        BUTTON_CONTROL_MIDDLE: (p) => p && press("ctrlMiddle"),
      },
    },
    [key, isFocused, ...deps]
  );

  return { focused: isFocused, setFocus, focus: () => setFocus(key) };
};

export default useNavigate;

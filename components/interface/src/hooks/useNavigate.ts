import { useMainStore } from "@utils/store.utils";
import {
  useInterval,
  useLatest,
  useMemoizedFn,
  useMount,
  useSetState,
} from "ahooks";
import { keys } from "ramda";
import { useEffect, useRef, useState } from "react";
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
  const mapRef = useRef(new Map());
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
    store.set((prev) => ({ focused: focus, lastFocused: prev.focused }));
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

  const [down, setDown] = useSetState<Record<ActionType, boolean>>({
    left: false,
    right: false,
    up: false,
    bottom: false,
    btnBottom: false,
    btnLeft: false,
    btnRight: false,
    btnUp: false,
    ctrlMiddle: false,
    ctrlRight: false,
    ctrlLeft: false,
  });

  const handlePress = (action: ActionType, bool: boolean) => {
    // if (action === "bottom") console.log(action, bool);
    if (bool) {
      mapRef.current.set(action, true);

      setTimeout(() => {
        const pressed = mapRef.current.get(action);

        if (pressed) {
          setDown((prev) => ({ ...prev, [action]: true }));
        }
      }, 750);
    } else {
      const pressed = mapRef.current.get(action);
      if (pressed) {
        mapRef.current.set(action, false);
        press(action);
        setDown((prev) => ({ ...prev, [action]: false }));
      }
    }
  };

  useInterval(() => {
    if (down.left) press("left");
    if (down.right) press("right");
    if (down.up) press("up");
    if (down.bottom) press("bottom");
    if (down.btnBottom) press("btnBottom");
    if (down.btnLeft) press("btnLeft");
    if (down.btnRight) press("btnRight");
    if (down.btnUp) press("btnUp");
    if (down.ctrlLeft) press("ctrlLeft");
    if (down.ctrlMiddle) press("ctrlMiddle");
    if (down.ctrlRight) press("ctrlRight");
  }, 100);

  const globalKeys = keys(options?.globalActions ?? {});
  useGamePad(
    {
      focused: isFocused || !!globalKeys.length,
      onConnect: (gp) => {
        store.set({ gamepad: gp });
      },
      events: {
        // D_PAD_LEFT: (p) => p && press("left"),
        // D_PAD_RIGHT: (p) => p && press("right"),
        // D_PAD_UP: (p) => p && press("up"),
        // D_PAD_BOTTOM: (p) => p && press("bottom"),
        // BUTTON_BOTTOM: (p) => p && press("btnBottom"),
        // BUTTON_TOP: (p) => p && press("btnUp"),
        // BUTTON_LEFT: (p) => p && press("btnLeft"),
        // BUTTON_RIGHT: (p) => p && press("btnRight"),
        // BUTTON_CONTROL_LEFT: (p) => p && press("ctrlLeft"),
        // BUTTON_CONTROL_RIGHT: (p) => p && press("ctrlRight"),
        // BUTTON_CONTROL_MIDDLE: (p) => p && press("ctrlMiddle"),
        D_PAD_LEFT: (p) => handlePress("left", !!p),
        D_PAD_RIGHT: (p) => handlePress("right", !!p),
        D_PAD_UP: (p) => handlePress("up", !!p),
        D_PAD_BOTTOM: (p) => handlePress("bottom", !!p),
        BUTTON_BOTTOM: (p) => handlePress("btnBottom", !!p),
        BUTTON_TOP: (p) => handlePress("btnUp", !!p),
        BUTTON_LEFT: (p) => handlePress("btnLeft", !!p),
        BUTTON_RIGHT: (p) => handlePress("btnRight", !!p),
        BUTTON_CONTROL_LEFT: (p) => handlePress("ctrlLeft", !!p),
        BUTTON_CONTROL_RIGHT: (p) => handlePress("ctrlRight", !!p),
        BUTTON_CONTROL_MIDDLE: (p) => handlePress("ctrlMiddle", !!p),
      },
      delay: 50,
    },
    [key, isFocused, ...deps]
  );

  return { focused: isFocused, setFocus, focus: () => setFocus(key) };
};

export default useNavigate;

import { mapButtons } from "@utils/gamepad.utils";
import { useMainStore, useSoundStore } from "@utils/store.utils";
import {
  useInterval,
  useLatest,
  useMemoizedFn,
  useMount,
  // useSetState,
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

const mapActionToButtonType: Record<ActionType, ButtonKeys> = {
  left: "D_PAD_LEFT",
  right: "D_PAD_RIGHT",
  up: "D_PAD_UP",
  bottom: "D_PAD_BOTTOM",
  btnBottom: "BUTTON_BOTTOM",
  btnLeft: "BUTTON_LEFT",
  btnRight: "BUTTON_RIGHT",
  btnUp: "BUTTON_TOP",
  ctrlMiddle: "BUTTON_CONTROL_MIDDLE",
  ctrlRight: "BUTTON_CONTROL_RIGHT",
  ctrlLeft: "BUTTON_CONTROL_LEFT",
};

type Actions = Record<ActionType, (setFocus: (focus: string) => void) => void>;

interface UseNavigateOptions {
  onFocus?: (key: string, setFocus: (focus: string) => void) => void;
  onBlur?: (key: string, setFocus: (focus: string) => void) => void;
  autoFocus?: boolean;
  actions?: Partial<Actions>;
  globalActions?: Partial<Actions>;
  directionalSound?: boolean;
  confirmSound?: boolean;
}

const useNavigate = (
  key: string,
  options?: UseNavigateOptions,
  deps: any[] = []
) => {
  const mapRef = useRef(new Map());
  const mapStateRef = useRef(new Map());
  const store = useMainStore();
  const soundStore = useSoundStore();
  const [active, setActive] = useState(false);
  const isFocused = store.focused === key;
  const onFocus = useMemoizedFn(options?.onFocus ?? (() => {}));
  const onBlur = useMemoizedFn(options?.onBlur ?? (() => {}));

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
      onFocus?.(key, setFocus);
      setActive(true);
    } else {
      onBlur?.(key, setFocus);
      setActive(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, key, onFocus, onBlur, ...deps]);

  const setFocus = (focus: string) => {
    store.set((prev) => ({ lastFocused: prev.focused, focused: focus }));
  };

  const beepSound = options?.directionalSound ?? true;
  const confirmSound = options?.confirmSound ?? true;

  const beep = (fn: ActionType) => {
    if (["left", "right", "up", "bottom"].includes(fn)) {
      if (beepSound) {
        soundStore.play("beep");
      }
    }

    if (["btnBottom"].includes(fn)) {
      if (confirmSound) {
        soundStore.play("accept");
      }
    }
  };

  const checkButton = (fn: ActionType, check: boolean) => {
    if (check) {
      const gamePad = navigator
        .getGamepads()
        .find((v) => v?.id === store.gamepad?.id);
      let pressed3 = false;

      if (gamePad && fn) {
        const mapped = mapButtons(gamePad.buttons as any);
        pressed3 = mapped[mapActionToButtonType[fn]];

        if (!pressed3) {
          // setDown((prev) => ({ ...prev, [fn]: false }));
          downRef.current[fn] = false;
        }
      }
    }
  };

  const press = (fn: ActionType, checkBtn = true) => {
    if (latestData.current.globalActions?.[fn]) {
      checkButton(fn, checkBtn);
      beep(fn);
      latestData.current.globalActions[fn]?.(setFocus);
    }

    if (store.focused !== key) return;

    if (
      latestData.current.gamepad &&
      latestData.current.active &&
      latestData.current.actions?.[fn]
    ) {
      checkButton(fn, checkBtn);
      beep(fn);
      latestData.current.actions?.[fn]?.(setFocus);
    }
  };

  const downRef = useRef<Record<ActionType, boolean>>({
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

  const handlePress = useMemoizedFn((action: ActionType, bool: boolean) => {
    // if (action === "bottom") console.log(action, bool);
    const pressed = mapRef.current.get(action);

    if (bool) {
      mapRef.current.set(action, true);
      mapStateRef.current.set(action, true);

      setTimeout(() => {
        const pressed2 = mapRef.current.get(action);

        if (pressed2) {
          downRef.current[action] = true;
          // setDown((prev) => ({ ...prev, [action]: true }));
        }
      }, 750);
    } else if (pressed) {
      mapRef.current.set(action, false);
      press(action, false);
      downRef.current[action] = false;
    }
  });

  useInterval(() => {
    if (downRef.current.left) press("left");
    if (downRef.current.right) press("right");
    if (downRef.current.up) press("up");
    if (downRef.current.bottom) press("bottom");
    if (downRef.current.btnBottom) press("btnBottom");
    if (downRef.current.btnLeft) press("btnLeft");
    if (downRef.current.btnRight) press("btnRight");
    if (downRef.current.btnUp) press("btnUp");
    if (downRef.current.ctrlLeft) press("ctrlLeft");
    if (downRef.current.ctrlMiddle) press("ctrlMiddle");
    if (downRef.current.ctrlRight) press("ctrlRight");
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

  return {
    focused: isFocused,
    setFocus,
    focus: () => setFocus(key),
    current: store.focused,
  };
};

export default useNavigate;

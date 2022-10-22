import useGamePad from "@hooks/useGamePad";
import MountSubscriber from "@providers/MountSubscriber";
import { OverlaySettings, useOverlayStore } from "@utils/store.utils";
import { useMount } from "ahooks";
import _ from "lodash";
import OverlayMenu from "./OverlayMenu";
import OverlayPerformance from "./OverlayPerformance";
import OverlayStates from "./OverlayStates";

const Overlay = () => {
  return (
    <MountSubscriber>
      <OverlayContent />
    </MountSubscriber>
  );
};

const cycleNum = (num: number, min: number, max: number) => {
  // eslint-disable-next-line no-nested-ternary
  return num > max ? min : num < min ? max : num;
};

const handleMenu = (
  prev: OverlaySettings,
  opts?: { key: string; payload: any }
): Partial<OverlaySettings> => {
  if (!prev.open) return prev;
  const { key } = opts ?? {};
  if (key === "key.down")
    return {
      ...prev,
      focus: cycleNum(prev.focus + 1, 0, 4),
    };

  if (key === "key.up")
    return {
      ...prev,
      focus: cycleNum(prev.focus - 1, 0, 4),
    };

  if (key === "key.circle" && prev.open) {
    return { ...prev, focus: 0, open: false };
  }

  if (key === "key.left") {
    if (prev.focus === 2 && !prev.mute) {
      window.emulator.volume(-1);
      return {
        ...prev,
        volume: _.clamp(prev.volume - 1, 0, 5),
      };
    }
  }

  if (key === "key.right") {
    if (prev.focus === 2 && !prev.mute) {
      window.emulator.volume(1);
      return {
        ...prev,
        volume: _.clamp(prev.volume + 1, 0, 5),
      };
    }
  }

  if (key === "key.cross") {
    if (prev.focus === 4) {
      window.emulator.quit();
      return {
        ...prev,
        open: false,
      };
    }

    if (prev.focus === 3) {
      window.emulator.toggleTurbo();
      return prev;
    }

    if (prev.focus === 2) {
      const newMute = !prev.mute;
      window.emulator.mute(newMute);
      return { ...prev, mute: newMute };
    }

    if (prev.focus === 1) {
      window.emulator.toggleFPS();
      return prev;
    }

    if (prev.focus === 0) {
      return { ...prev, route: "states" };
    }
  }

  return prev;
};

const handleStates = (
  prev: OverlaySettings,
  opts?: { key: string; payload: any }
): Partial<OverlaySettings> => {
  if (!prev.open) return prev;
  const { key, payload } = opts ?? {};
  if (key === "key.down")
    return {
      ...prev,
      stateFocus: cycleNum(prev.stateFocus + 1, 0, 4),
      stateFocusDecide: 0,
    };

  if (key === "key.up")
    return {
      ...prev,
      stateFocus: cycleNum(prev.stateFocus - 1, 0, 4),
      stateFocusDecide: 0,
    };

  if (key === "key.left")
    return {
      ...prev,
      stateFocusDecide: prev.stateFocusDecide === 1 ? 0 : 1,
    };

  if (key === "key.right")
    return {
      ...prev,
      stateFocusDecide: prev.stateFocusDecide === -1 ? 0 : -1,
    };

  if (key === "key.ps") {
    return {
      ...prev,
      focus: 0,
      open: payload,
      ...(!payload && {
        route: "menu",
      }),
    };
  }

  if (key === "key.circle") {
    return { ...prev, stateFocus: 0, route: "menu" };
  }

  if (key === "key.cross") {
    if (prev.stateFocus === 4) {
      return { ...prev, stateFocus: 0, route: "menu" };
    }

    if (prev.stateFocusDecide === -1) {
      window.emulator.saveToSlot(prev.stateFocus);

      return {
        ...prev,
        stateFocusDecide: 0,
        stateFocus: 0,
        focus: 0,
        route: "menu",
        open: false,
      };
    }

    if (prev.stateFocusDecide === 1) {
      window.emulator.loadFromSlot(prev.stateFocus);

      return {
        ...prev,
        stateFocusDecide: 0,
        stateFocus: 0,
        focus: 0,
        route: "menu",
        open: false,
      };
    }

    return prev;
  }

  return prev;
};

const OverlayContent = () => {
  const store = useOverlayStore();

  const handlePress = (opts: { key: string; payload: any }) => {
    store.set((prev) => {
      if (prev.route === "menu") {
        return handleMenu(prev, opts);
      }
      if (prev.route === "states") {
        return handleStates(prev, opts);
      }

      return prev;
    });
  };

  useGamePad({
    onConnect: (gp) => {
      store.set({ id: gp.id });
    },
    events: {
      D_PAD_UP: (p) => {
        if (p) {
          handlePress({ key: "key.up", payload: null });
        }
      },
      D_PAD_BOTTOM: (p) => {
        if (p) {
          handlePress({ key: "key.down", payload: null });
        }
      },
      D_PAD_LEFT: (p) => {
        if (p) {
          handlePress({ key: "key.left", payload: null });
        }
      },
      D_PAD_RIGHT: (p) => {
        if (p) {
          handlePress({ key: "key.right", payload: null });
        }
      },
      BUTTON_BOTTOM: (p) => {
        if (p) {
          handlePress({ key: "key.cross", payload: null });
        }
      },
      BUTTON_RIGHT: (p) => {
        if (p) {
          handlePress({ key: "key.circle", payload: null });
        }
      },
      BUTTON_CONTROL_MIDDLE: (p) => {
        if (p) {
          store.set((prev) => {
            const open = !prev.open;
            window.emulator.intercept(open);
            return {
              ...prev,
              focus: 0,
              open,
            };
          });
        }
      },
    },
  });

  useMount(() => {
    if (window.emulator) {
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

        if (val?.evt === "event.update") {
          store.set(val?.value ?? {});
        }
      });
    }
  });
  return (
    <div className="w-[100vw] h-[100vh] p-4">
      <OverlayPerformance />
      <OverlayMenu />
      <OverlayStates />
    </div>
  );
};

export default Overlay;

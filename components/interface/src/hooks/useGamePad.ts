import { getButtonName } from "@utils/gamepad.utils";
import {
  createCustomEvent,
  createTimer,
  CustomEventFactory,
} from "@utils/helper";
import { useGamepadStore } from "@utils/store.utils";
import {
  useEventListener,
  useLatest,
  useMemoizedFn,
  useMount,
  useUnmount,
} from "ahooks";
import { nanoid } from "nanoid";
import { filter, find, isNil, keys, pipe, propEq, propOr } from "ramda";
import { useEffect, useRef, useState } from "react";

interface UseGamePadProps {
  pressOnly?: boolean;
  /** If keypress is attached to animation add a delay equals to anumation duration * 2 */
  delay?: number;
  /** Only pass boolean for exact matches & combinations */
  events?:
    | Partial<Record<ButtonKeys, (isPressed?: boolean) => void>>
    | Record<string, (isPressed?: boolean) => void>;

  focused?: boolean;
  onConnect?: (gp: Gamepad) => void;
  onDisconnect?: (gp: Gamepad) => void;
}

interface EventData {
  data: [ButtonKeys, boolean];
}

const useGamePad = (props?: UseGamePadProps, deps: any[] = []) => {
  const {
    events,
    delay = 100,
    pressOnly,
    onConnect,
    onDisconnect,
    focused,
  } = props || {};
  const [id] = useState(() => nanoid(21));
  const gpRef = useRef<Gamepad>();
  const buttonStateRef = useRef<Partial<Record<ButtonKeys, boolean>>>({});
  const timerRef = useRef<() => void>();
  const eventRef = useRef<CustomEventFactory<EventData>>();
  const store = useGamepadStore();

  const getIndex = propOr(-1, "index") as (gp: Maybe<Gamepad>) => number;
  const gamepadIndex = getIndex(store.gamepad);
  const event = eventRef.current;

  const latestData = useLatest({
    gamepadIndex,
    events,
    event: eventRef.current,
  });

  const startTimer = () => {
    if (timerRef.current) timerRef.current();
    timerRef.current = createTimer(() => {
      if (typeof focused === "boolean" && !focused) return;
      const getGamepad = pipe(
        filter((gp: Maybe<Gamepad>) => !!gp),
        find<Gamepad>(propEq("index", latestData.current.gamepadIndex))
      );

      const current = getGamepad(navigator.getGamepads());

      if (!isNil(current) && latestData.current.event) {
        current.buttons.forEach((button, index) => {
          const name = getButtonName(index);
          if (name) {
            const last = buttonStateRef.current[name];
            if (last !== button.pressed) {
              if (button.pressed && name && pressOnly) {
                latestData.current.event?.dispatch({
                  data: [name, button.pressed],
                });
              } else if (name) {
                latestData.current.event?.dispatch({
                  data: [name, button.pressed],
                });
              }
            }

            buttonStateRef.current[name] = button.pressed;
          }
        });
      }
    }, delay);
  };

  const listener = (_e: CustomEvent<EventData>, { data }: EventData) => {
    const eventKeys = keys(latestData.current.events);

    for (let i = 0; i < eventKeys.length; i++) {
      const key = eventKeys[i];
      if (data[0] === key) {
        if (pressOnly && data[1]) {
          latestData.current.events?.[key]?.(true);
        } else if (!pressOnly) {
          latestData.current.events?.[key]?.(data[1]);
        }
      }
    }
  };

  useMount(() => {
    eventRef.current = createCustomEvent("onpressgamepad", id);
    eventRef.current.subscribe(listener);
    startTimer();
  });

  useUnmount(() => {
    timerRef.current?.();
    event?.unsubscribe(listener);
  });

  useEffect(() => {
    startTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.gamepad?.id, ...deps]);

  const setGamepad = useMemoizedFn((ev: GamepadEvent) => {
    const gamepads = navigator.getGamepads().filter((v): v is Gamepad => !!v);

    store.set((prev) => ({
      gamepads,
      gamepad: !prev.gamepad ? ev.gamepad : prev.gamepad,
      connected: !ev.gamepad && !prev.gamepad,
    }));

    gpRef.current = ev.gamepad;

    const connectedGamepads = gamepads.filter((v) => v.connected).length;
    // if (!timerRef.current) startTimer();
    if (timerRef.current && !connectedGamepads) timerRef.current = undefined;
  });

  useEventListener("gamepadconnected", (ev) => {
    // console.log(`${ev.gamepad.id} connected`);
    onConnect?.(ev.gamepad);
    setGamepad(ev);
  });

  useEventListener("gamepaddisconnected", (ev) => {
    // console.log(`${ev.gamepad.id} disconnected`);
    onDisconnect?.(ev.gamepad);
    setGamepad(ev);
  });

  useUnmount(() => {
    store.resetLoop(id);
  });

  return store.get();
};

export default useGamePad;

import CONSTANTS from "@utils/constants.utils";
import { mapAxes, mapButtons } from "@utils/gamepad.utils";
import {
  createCustomEvent,
  createTimer,
  CustomEventFactory,
} from "@utils/helper";
import { useGamepadStore } from "@utils/store.utils";
import { useEventListener, useMemoizedFn, useMount, useUnmount } from "ahooks";
import {} from "crypto";
import { debounce } from "lodash";
import { nanoid } from "nanoid";
import {
  allPass,
  clamp,
  curry,
  equals,
  evolve,
  filter,
  find,
  is,
  isNil,
  keys,
  mapObjIndexed,
  mergeRight,
  not,
  pickBy,
  pipe,
  propEq,
  propOr,
  slice,
  tail,
} from "ramda";
import { useRef, useState } from "react";

interface UseGamePadProps {
  pressOnly?: boolean;
  deadZone?: Partial<Record<AxesKeys, number>>;
  /** If keypress is attached to animation add a delay equals to anumation duration * 2 */
  delay?: number;
  /** Only pass boolean for exact matches & combinations */
  events?:
    | Partial<Record<ButtonKeys, (isPressed?: boolean) => void>>
    | Record<string, (isPressed?: boolean) => void>;
}

interface EventData {
  lastButtonState: Record<ButtonKeys, boolean>;
  buttonState: Record<ButtonKeys, boolean>;
  lastAxesState: Record<AxesKeys, number>;
  axesState: Record<AxesKeys, number>;
}

const useGamePad = (props?: UseGamePadProps) => {
  const {
    deadZone = CONSTANTS.DEFAULT_DEADZONE,
    events: evs = {},
    delay = 50,
    pressOnly,
  } = props || {};
  const [id] = useState(() => nanoid(21));
  const timerRef = useRef<() => void>();
  const evRef = useRef<CustomEventFactory<EventData>>(
    createCustomEvent("onpressgamepad", id)
  );
  const historyRef = useRef<ButtonKeys[]>([]);
  const combinationRef = useRef<Pair<ButtonKeys>>();
  const buttonStatesRef = useRef<Record<ButtonKeys, boolean>>();
  const axesRef = useRef<Record<AxesKeys, number>>();
  const subscriptionRef = useRef<boolean>(false);
  const store = useGamepadStore();

  const [events] = useState(() => evs);

  const getIndex = propOr(-1, "index") as (gp: Maybe<Gamepad>) => number;
  const gamepadIndex = getIndex(store.gamepad);

  const getGamepad = pipe(
    filter((gp: Maybe<Gamepad>) => !!gp),
    find<Gamepad>(propEq("index", gamepadIndex))
  );

  const dz = pipe<
    [Partial<Record<AxesKeys, number>>],
    Partial<Record<AxesKeys, number>>,
    Record<AxesKeys, number>
  >(
    pickBy(is(Number)),
    mergeRight(CONSTANTS.DEFAULT_DEADZONE)
  )(deadZone);

  const event = evRef.current;

  const clampAxes = useMemoizedFn(
    curry((clamper: number, value: number) =>
      value < 0 ? clamp(-1, -clamper, value) : clamp(clamper, 1, value)
    )
  );

  const startTimer = () => {
    timerRef.current = createTimer(() => {
      const current = getGamepad(navigator.getGamepads());
      if (!isNil(current)) {
        const mappedButtons = mapButtons([...current.buttons]);

        const mappedAxes = mapAxes([...current.axes]);
        const evolverDz = mapObjIndexed((v: number) => clampAxes(v), dz);
        const clampedAxesState = evolve(evolverDz, mappedAxes);

        const check = [
          not(equals(buttonStatesRef.current, mappedButtons)),
          isNil(combinationRef.current),
          isNil(historyRef.current),
        ].some(equals(true));

        if (check) {
          const lastButtonState = buttonStatesRef.current;
          const lastAxesState = axesRef.current;
          buttonStatesRef.current = mappedButtons;
          axesRef.current = mappedAxes;

          event.dispatch({
            lastButtonState: lastButtonState ?? mappedButtons,
            buttonState: mappedButtons,
            lastAxesState: lastAxesState ?? clampedAxesState,
            axesState: clampedAxesState,
          });
        }
      }
    }, delay);
  };

  const listener = (_e: CustomEvent<EventData>, data: EventData) => {
    const { lastButtonState, buttonState } = data;
    const eventKeys = keys(events);

    let combination = (combinationRef.current ?? []) as Pair<ButtonKeys>;
    let history = (historyRef.current ?? []) as ButtonKeys[];

    const diff = pipe<
      [Record<ButtonKeys, boolean>],
      ButtonKeys[],
      ButtonKeys[]
    >(
      keys<Record<ButtonKeys, boolean>>,
      filter((key: ButtonKeys) => {
        const last = lastButtonState[key];
        const now = buttonState[key];
        return !equals(now, last);
      })
    )(buttonState);

    for (let i = 0; i < diff.length; i++) {
      const key = diff[i];
      if (key) {
        const isPressed = buttonState[key];
        const wasNotPressed = lastButtonState[key];
        if (wasNotPressed && isPressed) {
          combination = [...tail(combination), key] as Pair<ButtonKeys>;
        }

        if (wasNotPressed && isPressed) {
          history = [...(history.length >= 5 ? tail(history) : history), key];
        }

        if (!isPressed) {
          const wasPressed = combination.includes(key);
          if (wasPressed) combination.filter((o) => o !== key);
        }
      }
    }

    combinationRef.current = combination;
    historyRef.current = history;

    for (let i = 0; i < eventKeys.length; i++) {
      const key = eventKeys[i];
      if (key.indexOf("+") > -1) {
        const [first, second] = key
          .split("+")
          .filter((v) => v.length) as Pair<ButtonKeys>;

        const pass = allPass([propEq(0, first), propEq(1, second)]);

        if (pass(combination)) {
          events[key](true);
        }
      } else if (key.indexOf(" ") > -1) {
        const matchKeys = key
          .split(" ")
          .filter((v) => v.length) as ButtonKeys[];

        const newHistory = slice(-matchKeys.length, history.length, history);

        if (equals(matchKeys, newHistory)) {
          events[key]();
        }
      } else if (diff.includes(key as ButtonKeys)) {
        if (pressOnly && buttonState[key as ButtonKeys]) {
          events[key](true);
        } else if (!pressOnly) {
          events[key](buttonState[key as ButtonKeys]);
        }
      }
    }
  };

  useMount(() => {
    if (!subscriptionRef.current) {
      console.log(subscriptionRef.current);
      subscriptionRef.current = true;
      console.log(subscriptionRef.current);
      event.subscribe(listener);
    }
  });

  useUnmount(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current = false;
      timerRef.current?.();
      event.unsubscribe(listener);
    }
  });

  const setGamepad = useMemoizedFn((ev: GamepadEvent) => {
    const gamepads = navigator.getGamepads().filter((v): v is Gamepad => !!v);
    store.set((prev) => ({
      gamepads,
      gamepad: !prev.gamepad ? ev.gamepad : prev.gamepad,
      connected: !ev.gamepad && !prev.gamepad,
    }));

    const connectedGamepads = gamepads.filter((v) => v.connected).length;
    if (!timerRef.current) startTimer();
    if (timerRef.current && !connectedGamepads) timerRef.current = undefined;
  });

  useEventListener("gamepadconnected", (ev) => {
    // console.log(`${ev.gamepad.id} connected`);
    setGamepad(ev);
  });

  useEventListener("gamepaddisconnected", (ev) => {
    // console.log(`${ev.gamepad.id} disconnected`);
    setGamepad(ev);
  });

  useUnmount(() => {
    store.resetLoop(id);
  });

  return store.get();
};

export default useGamePad;

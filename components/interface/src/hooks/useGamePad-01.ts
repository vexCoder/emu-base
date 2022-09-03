import CONSTANTS from "@utils/constants.utils";
import { mapAxes, mapButtons } from "@utils/gamepad.utils";
import { useGamepadStore } from "@utils/store.utils";
import {
  useDeepCompareEffect,
  useMemoizedFn,
  useMount,
  useUnmount,
} from "ahooks";
import {} from "crypto";
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
  pickBy,
  pipe,
  propEq,
  propOr,
  slice,
} from "ramda";
import { useRef, useState } from "react";

interface UseGamePadProps {
  deadZone?: Partial<Record<AxesKeys, number>>;
  /** If keypress is attached to animation add a delay equals to anumation duration * 2 */
  delay?: number;
  /** Only pass boolean for exact matches & combinations */
  events?:
    | Partial<Record<ButtonKeys, (isPressed?: boolean) => void>>
    | Record<string, (isPressed?: boolean) => void>;
}

const useGamePad = (props?: UseGamePadProps) => {
  const {
    deadZone = CONSTANTS.DEFAULT_DEADZONE,
    events: evs = {},
    delay = 50,
  } = props || {};
  const historyRef = useRef<ButtonKeys[]>([]);
  const combinationRef = useRef<ButtonKeys[]>([]);
  const buttonStatesRef = useRef<Record<ButtonKeys, boolean>>();
  const axesRef = useRef<Record<AxesKeys, number>>();
  const parsingRef = useRef<[boolean, boolean]>([false, false]);
  const store = useGamepadStore();
  const [id] = useState(() => nanoid(21));

  const [events] = useState(() => evs);

  const getIndex = propOr(-1, "index") as (gp: Maybe<Gamepad>) => number;
  const gamepadIndex = getIndex(store.gamepad);

  const dz = pipe<
    [Partial<Record<AxesKeys, number>>],
    Partial<Record<AxesKeys, number>>,
    Record<AxesKeys, number>
  >(
    pickBy(is(Number)),
    mergeRight(CONSTANTS.DEFAULT_DEADZONE)
  )(deadZone);

  const clampAxes = useMemoizedFn(
    curry((clamper: number, value: number) =>
      value < 0 ? clamp(-1, -clamper, value) : clamp(clamper, 1, value)
    )
  );

  const getGamepad = pipe(
    filter((gp: Maybe<Gamepad>) => !!gp),
    find<Gamepad>(propEq("index", gamepadIndex))
  );

  useDeepCompareEffect(() => {
    if (gamepadIndex >= 0) {
      const listener = () => {
        if (!isNil(gamepadIndex)) {
          const current = getGamepad(navigator.getGamepads());

          if (current) {
            const mappedButtons = mapButtons([...current.buttons]);
            const check = equals(mappedButtons, buttonStatesRef.current);

            if (!check || !buttonStatesRef.current) {
              if (parsingRef.current[0]) return;
              parsingRef.current[0] = true;
              const diff = pipe<
                [Record<ButtonKeys, boolean>],
                ButtonKeys[],
                ButtonKeys[]
              >(
                keys<Record<ButtonKeys, boolean>>,
                filter((key: ButtonKeys) => {
                  const last = buttonStatesRef.current?.[key];
                  const now = mappedButtons[key];
                  return !equals(now, last);
                })
              )(mappedButtons);

              const lastCombination = [
                ...combinationRef.current,
              ] as Pair<ButtonKeys>;

              for (let i = 0; i < diff.length; i++) {
                const key = diff[i];
                const last = buttonStatesRef.current?.[key];
                const now = mappedButtons[key];
                const pressed = !last && now;
                const released = last && !now;
                if (pressed) {
                  combinationRef.current = [
                    ...combinationRef.current.slice(-1),
                    key,
                  ];
                } else if (released) {
                  // combinationRef.current = filter(
                  //   (k: ButtonKeys) => !equals(k, key),
                  //   combinationRef.current
                  // );

                  historyRef.current =
                    historyRef.current.length === 5
                      ? [...historyRef.current.slice(1), key]
                      : [...historyRef.current, key];
                }
              }

              const newCombination = combinationRef.current as Pair<ButtonKeys>;
              const eventKeys = keys(events);
              for (let i = 0; i < eventKeys.length; i++) {
                const key = eventKeys[i];
                if (key.indexOf("+") > -1) {
                  const [first, second] = key
                    .split("+")
                    .filter((v) => v.length) as Pair<ButtonKeys>;

                  const pass = allPass([propEq(0, first), propEq(1, second)]);

                  if (pass(newCombination)) {
                    events[key](true);
                  } else if (pass(lastCombination)) {
                    events[key](false);
                  }
                } else if (key.indexOf(" ") > -1) {
                  const matchKeys = key
                    .split(" ")
                    .filter((v) => v.length) as ButtonKeys[];

                  const history = slice(
                    -matchKeys.length,
                    historyRef.current.length,
                    historyRef.current
                  );

                  if (equals(matchKeys, history)) {
                    events[key]();
                  }
                } else if (diff.includes(key as ButtonKeys)) {
                  events[key](mappedButtons[key as ButtonKeys]);
                }
              }

              buttonStatesRef.current = mappedButtons;
              store.setMappedButtons(mappedButtons);

              setTimeout(() => {
                parsingRef.current[0] = false;
              }, delay);
            }

            const mappedAxes = mapAxes([...current.axes]);
            const evolverDz = mapObjIndexed((v: number) => clampAxes(v), dz);
            const clampedAxesState = evolve(evolverDz, mappedAxes);
            const checkAxes = equals(clampedAxesState, axesRef.current);

            if (!checkAxes || !axesRef.current) {
              // axesRef.current = clampedAxesState;
              // store.setMappedAxes(clampedAxesState);
            }
          }
        }
      };

      store.resetLoop(id, listener);
    }
  }, [gamepadIndex, dz, events, delay]);

  useMount(() => {
    const connected = (ev: GamepadEvent) => {
      const gamepads = navigator.getGamepads().filter((v): v is Gamepad => !!v);
      store.set((prev) => ({
        gamepads,
        gamepad: !prev.gamepad ? ev.gamepad : prev.gamepad,
        connected: true,
      }));
    };

    const disconnected = (ev: GamepadEvent) => {
      const gamepads = navigator.getGamepads().filter((v): v is Gamepad => !!v);
      store.set((prev) => ({
        gamepads,
        gamepad:
          prev.gamepad && prev.gamepad.id === ev.gamepad.id
            ? undefined
            : prev.gamepad,
        connected: false,
      }));
    };

    window.addEventListener("gamepadconnected", connected);
    window.addEventListener("gamepaddisconnected", disconnected);

    return () => {
      window.removeEventListener("gamepadconnected", connected);
      window.removeEventListener("gamepaddisconnected", disconnected);
    };
  });

  useUnmount(() => {
    store.resetLoop(id);
  });

  return store.get();
};

export default useGamePad;

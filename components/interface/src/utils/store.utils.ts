import { ThemeKeys, themeKeys } from "@root/themes";
import _ from "lodash";
import { clamp } from "ramda";
import create from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { Howl } from "howler";
import CONSTANTS from "./constants.utils";

export interface ThemeStore {
  theme: ThemeKeys;
  set(theme: ThemeKeys): void;
  cycle(): void;
}

export const useThemeStore = create(
  subscribeWithSelector<ThemeStore>((set) => ({
    theme: themeKeys[0],
    set(theme: ThemeKeys) {
      set({ theme });
    },
    cycle() {
      const index = themeKeys.indexOf(this.theme);
      const next = themeKeys[(index + 1) % themeKeys.length];
      set({ theme: next });
    },
  }))
);

export interface SoundSettings {
  beep: Howl;
  accept: Howl;
}

export interface SoundActions {
  play(key: keyof SoundSettings): void;
}

export type SoundStore = SoundSettings & SoundActions;

export const useSoundStore = create(
  subscribeWithSelector<SoundStore>((_set, get) => ({
    beep: new Howl({
      src: "./beep.wav",
      volume: 2,
    }),
    accept: new Howl({
      src: "./accept.mp3",
    }),
    play(key: keyof SoundSettings) {
      get()[key].play();
    },
  }))
);

export interface GamepadSettings {
  gamepad?: Gamepad;
  gamepads: Gamepad[];
  connected: boolean;
  deadZone?: Partial<Record<AxesKeys, number>>;
  timers: Record<string, NodeJS.Timer>;

  buttonState?: Record<ButtonKeys, boolean>;
  axisState?: Record<AxesKeys, number>;
}

export interface GamepadActions {
  setGamepad: (gamepad: Gamepad) => void;
  setGamepads: (gamepads: Gamepad[]) => void;
  setMappedButtons: (buttons: Record<ButtonKeys, boolean>) => void;
  setMappedAxes: (axes: Record<AxesKeys, number>) => void;
  resetLoop: (id: string, loop?: () => void) => void;
  set: Setter<GamepadSettings>;
  get: Getter<GamepadSettings>;
}

export type GamepadStore = GamepadSettings & GamepadActions;

export const useGamepadStore = create(
  subscribeWithSelector<GamepadStore>((set, get) => ({
    // properties
    gamepads: [],
    connected: false,
    deadZone: CONSTANTS.DEFAULT_DEADZONE,
    timers: {},

    // setters
    setGamepads(gamepads) {
      set({ gamepads });
    },

    setGamepad(gamepad) {
      set({ gamepad });
    },

    setMappedButtons(buttons) {
      set({ buttonState: buttons });
    },

    setMappedAxes(axes) {
      set({ axisState: axes });
    },

    resetLoop(id, loop) {
      const prevLoop = get().timers[id];
      if (prevLoop) clearInterval(prevLoop);
      if (!loop) {
        const newtimers = { ...get().timers };
        delete newtimers[id];
        set({ timers: newtimers });
        return;
      }

      const loopTimer = setInterval(loop, 10);
      set({ timers: { ...get().timers, [id]: loopTimer } });
    },

    set(state) {
      set(typeof state === "function" ? state(get()) : state);
    },

    get() {
      return get();
    },
  }))
);

export interface MainSettings {
  search: string;
  console: string;
  games: ConsoleGameData[];
  selected?: ConsoleGameData;
  selectedIndex: number;
  maxSelectedIndex: number;
  count: number;
  disc?: string;
  focused: string;
  lastFocused?: string;
  gamepad?: Gamepad;
  shutdown?: boolean;
}

export interface MainActions {
  set: Setter<MainSettings>;
  get: Getter<MainSettings>;
  cycle: (prev?: boolean) => void;
  select: (game: ConsoleGameData) => void;
  play: (serial: string) => void;
  eject: () => void;
  list: {
    inc: () => void;
    dec: () => void;
    incMax: (val: number) => void;
    setMax: (val: number) => void;
  };
}

export type MainStore = MainSettings & MainActions;

export const useMainStore = create(
  subscribeWithSelector<MainStore>((set, get) => ({
    // properties
    search: "",
    focused: "game-list",
    console: "ps1",
    games: [],

    // games-list
    selectedIndex: 0,
    maxSelectedIndex: 0,
    list: {
      inc() {
        set({
          selectedIndex: _.clamp(
            get().selectedIndex + 1,
            0,
            get().maxSelectedIndex
          ),
        });
      },
      dec() {
        set({
          selectedIndex: _.clamp(
            get().selectedIndex - 1,
            0,
            get().maxSelectedIndex
          ),
        });
      },
      incMax(val: number) {
        set({
          maxSelectedIndex: get().maxSelectedIndex + val,
        });
      },
      setMax(val: number) {
        set({
          maxSelectedIndex: val,
        });
      },
    },

    count: 5,
    // setters
    set(state) {
      set(typeof state === "function" ? state(get()) : state);
    },
    get() {
      return get();
    },
    cycle(prev = false) {
      const { games, selected } = get();
      if (!selected) return set({ selected: games[0] });
      const index = games.findIndex((v) => v.id === selected.id);
      const newIndex = clamp(0, games.length, index + (prev ? -1 : 1));
      const next = games[newIndex % games.length];
      return set({ selected: next });
    },
    select(game) {
      return set({ selected: game });
    },
    play(serial) {
      return set({ disc: serial });
    },
    eject() {
      return set({ disc: undefined });
    },
  }))
);

export interface DebugStore {
  test: number;
}

export const useDebugStore = create<
  DebugStore,
  [
    ["zustand/subscribeWithSelector", DebugStore],
    ["zustand/persist", DebugStore]
  ]
>(subscribeWithSelector(persist(() => ({ test: 0 }), { name: "debug" })));

export interface OverlaySettings {
  open: boolean;
  route: "menu" | "states" | undefined;
  stateFocus: number;
  stateFocusDecide: number;
  fps: boolean;
  turbo: boolean;
  disableTurbo: boolean;
  focus: number;
  volume: number;
  mute: boolean;
  game?: string;
  console?: string;
  slot: number;
  states: number[];
  id?: string;
}
export interface OverlayActions {
  set: Setter<OverlaySettings>;
}

export type OverlayStore = OverlaySettings & OverlayActions;

export const useOverlayStore = create(
  subscribeWithSelector<OverlayStore>((set, get) => ({
    // properties
    slot: 0,
    open: false,
    route: "menu",
    stateFocus: 0,
    stateFocusDecide: 0,
    volume: 3,
    mute: false,
    fps: false,
    turbo: false,
    disableTurbo: false,
    focus: 0,
    states: [],
    set(state) {
      set(typeof state === "function" ? state(get()) : state);
    },
  }))
);

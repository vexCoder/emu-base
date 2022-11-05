import { keys } from "ramda";

export interface Theme {
  primary: string;
  secondary: string;
  text: string;
  contrastText: string;
  focus: string;
  highlight: string;
}

export type MappedTheme = {
  [K in keyof Theme as `--color-${K}`]: string | null;
};

export type ThemeKeys = keyof typeof themes;

export const ThemeDark = {
  primary: "22, 22, 23",
  secondary: "178, 196, 196",
  text: "250, 247, 232",
  contrastText: "33, 32, 30",
  // focus: "255, 158, 83",
  // focus: "125, 175, 255",
  focus: "247, 179, 43",
  highlight: "254, 74, 73",
};

export const ThemeDark2 = {
  primary: "47, 41, 45",
  secondary: "178, 196, 196",
  text: "250, 247, 232",
  contrastText: "33, 32, 30",
  focus: "255, 158, 83",
  highlight: "254, 74, 73",
};

export const themes = {
  dark: ThemeDark,
  dark2: ThemeDark2,
} as const;

export const themeKeys: ThemeKeys[] = keys(themes);

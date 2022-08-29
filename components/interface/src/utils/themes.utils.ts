import { MappedTheme, Theme, ThemeKeys, themes } from "@root/themes";
import { forEach, keys, pipe } from "ramda";

export const mapTheme = (variables: Theme): MappedTheme => {
  return {
    "--color-primary": variables.primary || "",
    "--color-secondary": variables.secondary || "",
    "--color-text": variables.text || "",
    "--color-contrastText": variables.contrastText || "",
    "--color-focus": variables.focus || "",
    "--color-highlight": variables.highlight || "",
  };
};

export const applyTheme = (theme: ThemeKeys): void => {
  const themeObject: MappedTheme = mapTheme(themes[theme]);
  if (!themeObject) return;

  const root: HTMLStyleElement | null = document.querySelector(":root");

  if (root) {
    pipe<[theme: MappedTheme], (keyof MappedTheme)[], void>(
      keys<MappedTheme>,
      forEach((property) => {
        if (root) {
          root.style.setProperty(property, themeObject[property]);
        }
      })
    )(themeObject);
  }
};

import { BrowserWindow, Rectangle, screen } from "electron";
import { dirname, join } from "path";

/* eslint-disable import/prefer-default-export */

import fs from "fs-extra";
import got from "got";

export interface WinSettings {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export const moveToMonitor = (
  selected: number,
  win: BrowserWindow,
  rect: WinSettings | ((rect: Rectangle) => WinSettings) = { x: 0, y: 0 },
  maximize?: boolean
) => {
  const displays = screen.getAllDisplays();
  if (selected >= displays.length) throw new Error("Primary monitor not found");
  const { x, y } = displays[selected].workArea;

  const result =
    typeof rect === "function" ? rect(displays[selected].workArea) : rect;

  win.setPosition(x + result.x, y + result.y);
  win.setSize(
    result.width ?? win.getSize()[0],
    result.height ?? win.getSize()[1],
    true
  );

  if (maximize) win.maximize();
};

export interface CreateWindowOptions {
  isDev?: boolean;
  isRestarted?: boolean;
  monitor?: number;
  browserOptions?: Partial<Electron.BrowserWindowConstructorOptions>;
}

export const createWindow = (opts?: CreateWindowOptions) => {
  const {
    isRestarted = false,
    browserOptions = {},
    isDev = true,
    monitor = 1,
  } = opts ?? {};

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    ...browserOptions,
    ...(browserOptions.webPreferences && {
      webPreferences: {
        preload: join(__dirname, "preload.js"),
        contextIsolation: true,
        devTools: true,
        ...browserOptions.webPreferences,
      },
    }),
  });

  if (isDev) {
    win.loadURL("http://localhost:3001");
    win.webContents.openDevTools();
  } else {
    win.loadFile("./index.html");
  }

  if (isRestarted && isDev) {
    // Bring to front
    win.minimize();
    win.showInactive();
    win.blur();

    win.once("blur", () => {
      // Select which monitor to use
      moveToMonitor(monitor, win, undefined, true);
    });
  } else {
    // Select which monitor to use
    moveToMonitor(monitor, win, undefined, true);
  }

  if (browserOptions.alwaysOnTop) {
    win.setAlwaysOnTop(true, "normal");
  }

  return win;
};

export const fetchImage = async (url: string) => {
  const test = await got(url, {
    responseType: "buffer",
  });

  // @ts-ignore
  const image = Buffer.from(test.body).toString("base64");

  return image;
};

export const saveImage = async (path: string, url: string) => {
  const base64 = await fetchImage(url);

  await fs.ensureDir(dirname(path));
  await fs.writeFile(path, base64, "base64");
};

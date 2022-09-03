import { app, BrowserWindow, Rectangle, screen } from "electron";
import { dirname, join } from "path";
import FileAsync from "lowdb/adapters/FileAsync";
import low from "lowdb";

import fs, { ensureDirSync } from "fs-extra";
import got from "got";
import {
  toLower,
  split,
  map,
  trim,
  replace,
  filter,
  intersection,
  curry,
  mean,
  pipe,
} from "ramda";
import { findBestMatch } from "string-similarity";

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
      moveToMonitor(monitor, win, undefined, false);
    });
  } else {
    // Select which monitor to use
    moveToMonitor(monitor, win, undefined, false);
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

export const getDumpPath = (consoleName?: string) => {
  const isDev = process.env.NODE_ENV === "development";

  const base = isDev ? __dirname : app.getPath("appData");
  const path = consoleName
    ? join(base, "dump", consoleName)
    : join(base, "dump");

  ensureDirSync(path);
  return path;
};

export const getEmuSettings = async () => {
  const pathToDump = getDumpPath();
  fs.removeSync(pathToDump);
  fs.ensureDirSync(pathToDump);
  const adapter = new FileAsync<AppSettings>(join(pathToDump, `settings.json`));
  const db = await low(adapter);
  await db.read();
  return db;
};

export const getConsoleDump = async (consoleName: string) => {
  const pathToDump = getDumpPath(consoleName);
  fs.ensureDirSync(pathToDump);
  const adapter = new FileAsync<ConsoleGameData[]>(
    join(pathToDump, `dump.json`)
  );
  const db = await low(adapter);
  await db.read();
  return db;
};

export const getConsoleLinks = async (consoleName: string) => {
  const pathToDump = getDumpPath(consoleName);
  fs.ensureDirSync(pathToDump);
  const adapter = new FileAsync<ConsoleLinks>(join(pathToDump, `links.json`));
  const db = await low(adapter);
  await db.read();
  return db;
};

export const scoreMatchStrings = (
  src: string,
  target: string
  // outliers: number = 0.25
) => {
  const targetSegment = pipe(
    toLower,
    split(" "),
    map(trim),
    map(replace(/([^a-z0-9])/g, ""))
  )(target);

  // const bestMatch = (src2: string) => curry(findBestMatch)(src2)(keywords);

  const sourceSegment = pipe(
    split(" "),
    map(toLower),
    map(replace(/([^a-z0-9])/g, "")),
    map(trim),
    filter((v: string) => !!v.length)
  )(src);

  const intersected = intersection(sourceSegment, targetSegment);

  // const ratings = pipe(
  //   map(bestMatch),
  //   map((m) => m.bestMatch.rating),
  //   (list) => reject((o: number) => o <= outliers, list)
  // )(intersected);

  // const averageScore = mean(ratings);

  return intersected.length / targetSegment.length;
};

export const scoreMatchStringsSc = (
  src: string[],
  target: string
  // outliers: number = 0.25
) => {
  const keywords = pipe(toLower, split(" "), map(trim))(target);
  const bestMatch = (src2: string) => curry(findBestMatch)(src2)(keywords);

  const check = src.some((v) => {
    const sourceSegment = pipe(
      split(" "),
      map(replace(/([^a-z0-9])/g, "")),
      map(trim),
      map(toLower)
    )(v);

    const ratings = pipe(
      map(bestMatch),
      map((m) => m.bestMatch.rating),
      (list) => list.filter((o) => o > 0.5)
    )(sourceSegment);

    const averageScore = mean(ratings);

    const match = averageScore > 0.7;

    return match;
  });

  return check;
};
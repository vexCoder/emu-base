import { app, BrowserWindow, screen } from "electron";
import { basename, dirname, join, resolve as pathResolve } from "path";
import FileAsync from "lowdb/adapters/FileAsync";
import low from "lowdb";
import fs, { ensureDir, ensureDirSync, stat } from "fs-extra";
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
  sum,
  keys,
  reduce,
  slice,
} from "ramda";
import * as R2 from "ramda";
import * as R from "rambda";
import { findBestMatch } from "string-similarity";
import execa from "execa";
import _ from "lodash";
import dayjs from "dayjs";
import { youtube } from "scrape-youtube";
import recursiveReadDir from "recursive-readdir";
import pMap from "p-map";
import cp from "cp-file";
import { setActiveWindow, setWindowRect, ShowWindowFlags } from "./ffi";

export interface WinSettings {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export const moveToMonitor = (
  selected: number,
  win: BrowserWindow,
  maximize?: boolean
) => {
  const displays = screen.getAllDisplays();
  if (selected >= displays.length) throw new Error("Primary monitor not found");
  const winBounds = win.getBounds();
  const whichScreen = screen.getDisplayNearestPoint({
    x: winBounds.x,
    y: winBounds.y,
  });
  const { x, y } = displays[selected].bounds;

  win.setPosition(x, y);
  if (!maximize) {
    const newWinSizeX =
      (winBounds.width / whichScreen.bounds.width) *
      displays[selected].bounds.width;
    const newWinSizeY =
      (winBounds.height / whichScreen.bounds.height) *
      displays[selected].bounds.height;

    win.setSize(newWinSizeX, newWinSizeY, false);
  }

  if (maximize) {
    win.setSize(
      displays[selected].bounds.width,
      displays[selected].bounds.height,
      true
    );
  }

  setActiveWindow(
    win.getNativeWindowHandle().readUInt32LE(0),
    ShowWindowFlags.SW_SHOW
  );
};

export const moveToMonitorRA = (handle: number, selected: number) => {
  const displays = screen.getAllDisplays();
  if (selected >= displays.length) throw new Error("Primary monitor not found");
  const { x, y, width, height } = displays[selected].bounds;

  setWindowRect(handle, {
    left: x,
    top: y,
    width,
    height,
  });

  setActiveWindow(handle, ShowWindowFlags.SW_SHOW);
};

export const logToFile = async (msg: any) => {
  const isDev = process.env.NODE_ENV === "development";
  const logPath = join(
    isDev ? app.getPath("desktop") : join(app.getPath("appData"), "emu-base"),
    "log.txt"
  );
  let msgString = msg;
  if (typeof msg === "object") msgString = JSON.stringify(msg);
  if (msg instanceof Error)
    msgString = JSON.stringify({
      name: msg.name,
      message: msg.message,
      stack: msg.stack,
    });

  await fs.appendFile(
    logPath,
    `${dayjs().format("HH:mm:ss")}::${msgString}\n`,
    "utf-8"
  );
};

export interface CreateWindowOptions {
  urlOrPath?: string;
  loadNone?: boolean;
  isDev?: boolean;
  isRestarted?: boolean;
  monitor?: number;
  browserOptions?: Partial<Electron.BrowserWindowConstructorOptions>;
  fullscreen?: boolean;
}

export const createWindow = (opts?: CreateWindowOptions) => {
  const {
    isRestarted = false,
    browserOptions = {},
    isDev = true,
    monitor = 0,
    fullscreen = false,
  } = opts ?? {};

  const win = new BrowserWindow({
    width: 1080,
    height: 810,
    ...browserOptions,
  });

  if (opts?.loadNone) {
    logToFile("loadNone");
    console.log("loadNone");
    win.loadURL("http://google.com");
  } else if (opts?.urlOrPath) {
    logToFile(opts?.urlOrPath);
    const isUrl = opts.urlOrPath.startsWith("http");
    logToFile({ isUrl });
    console.log({ isUrl, url: opts.urlOrPath });
    if (isUrl) win.loadURL(opts.urlOrPath);
    if (!isUrl) win.loadFile(opts.urlOrPath);
  } else if (isDev) {
    logToFile("isDev");
    win.loadURL("http://localhost:3001");
    win.webContents.openDevTools();
  } else {
    logToFile("default");
    win.loadFile("./index.html");
  }

  if (isRestarted && isDev) {
    // Bring to front
    win.minimize();
    win.showInactive();
    win.blur();

    moveToMonitor(monitor, win, fullscreen);
    win.once("blur", () => {
      // Select which monitor to use
      console.log(opts?.urlOrPath, monitor);
      moveToMonitor(monitor, win, fullscreen);
    });
  } else {
    // Select which monitor to use
    console.log(opts?.urlOrPath, monitor);
    moveToMonitor(monitor, win, fullscreen);
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

export const getSettingsPath = () => {
  const isDev = process.env.NODE_ENV === "development";

  const path = isDev ? __dirname : join(app.getPath("appData"), "emu-base");

  ensureDirSync(path);
  return path;
};

export const getDumpPath = (consoleName?: string, root?: string) => {
  const settingsPath = join(getSettingsPath(), "dump");
  const base = root ?? settingsPath;
  const path = consoleName ? join(base, consoleName) : join(base);

  ensureDirSync(path);
  return path;
};

export const getEmuSettings = async () => {
  const pathToSettings = getSettingsPath();
  fs.ensureDirSync(pathToSettings);
  const adapter = new FileAsync<AppSettings>(
    join(pathToSettings, `settings.json`)
  );
  const db = await low(adapter);
  await db.read();
  return db;
};

export const getDumpSettingsPath = async (consoleName?: string) => {
  const settings = await getEmuSettings();
  const dumpRoot = settings.get("pathing.dump").value();
  const pathToDump = getDumpPath(consoleName, dumpRoot);

  return pathToDump;
};

export const getDiscMappings = async (consoleName: string) => {
  const pathToDump = await getDumpSettingsPath(consoleName);
  fs.ensureDirSync(pathToDump);
  const adapter = new FileAsync<GameDiscMappings>(
    join(pathToDump, `mappings.json`)
  );
  const db = await low(adapter);
  await db.read();
  return db;
};

export const getConsoleDump = async (consoleName: string) => {
  const pathToDump = await getDumpSettingsPath(consoleName);
  fs.ensureDirSync(pathToDump);
  const adapter = new FileAsync<ConsoleGameData[]>(
    join(pathToDump, `dump.json`)
  );
  const db = await low(adapter);
  await db.read();
  return db;
};

export const getConsolePatchDump = async (consoleName: string) => {
  const pathToDump = await getDumpSettingsPath(consoleName);
  fs.ensureDirSync(pathToDump);
  const adapter = new FileAsync<ConsoleGameData[]>(
    join(pathToDump, `dump.patch.json`),
    {
      defaultValue: [],
    }
  );
  const db = await low(adapter);
  await db.read();
  return db;
};

export const getConsoleLinks = async (consoleName: string) => {
  const pathToDump = await getDumpSettingsPath(consoleName);
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

export const scoreMatchStrings2 = (src: string, target: string) => {
  const keywords = pipe(toLower, split(" "), map(trim))(target);
  const bestMatch = (src2: string) => curry(findBestMatch)(src2)(keywords);

  const sourceSegment = pipe(
    split(" "),
    map(replace(/([^a-z0-9])/g, "")),
    map(trim),
    map(toLower)
  )(src);

  const ratings = pipe(
    map(bestMatch),
    map((m) => m.bestMatch.rating),
    (list) => list.filter((o) => o > 0.5)
  )(sourceSegment);

  const averageScore = mean(ratings);

  return averageScore;
};

export const getDisplayById = (id?: number) => {
  const displays = screen.getAllDisplays();
  const display = displays.find((d) => d.id === id);
  return display ?? displays[0];
};

export const getDisplayByIndex = (idx: number) => {
  const displays = screen.getAllDisplays();
  const display = displays.find((__, i) => i === idx);
  return display;
};

export const getDisplayIndex = (id: number) => {
  const displays = screen.getAllDisplays();
  const idx = displays.findIndex((d) => d.id === id);
  return idx;
};

export const parseDisplay = (d?: Electron.Display) => ({
  id: d?.id ?? 0,
  position: {
    x: d?.bounds.x ?? 0,
    y: d?.bounds.y ?? 0,
  },
  size: {
    width: d?.bounds.width ?? 0,
    height: d?.bounds.height ?? 0,
  },
});

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

export const extractString = curry(
  (regexp: RegExp, text: string, trimText?: boolean) => {
    const res = new RegExp(regexp).exec(text)?.[1];

    return trimText ? res?.trim() : res;
  }
);

export const extractMatches = curry(
  (regexp: RegExp, text: string, trimText?: boolean) => {
    const arr = text.match(new RegExp(regexp)) ?? [];
    return arr?.map((o) => (trimText ? o.trim() : o));
  }
);

export const substr = (text: string, start: number, end?: number) =>
  `${text}`.substring(start, end);

export const sumIndices = curry((arr: number[], start: number, end: number) =>
  sum(arr.slice(start, end + 1))
);

export const getExeList2 = async (filterNames?: string[]) => {
  const proc = await execa("wmic", [
    "process",
    "get",
    "name,description,handle,ProcessId",
  ]);

  type ExeData = {
    name: string;
    handle: number;
    exe: string;
    pid: number;
  };

  const res = pipe<
    [string],
    string[],
    string[][],
    string[][],
    string[][],
    ExeData[]
  >(
    split(/(\r\n|\n)/),
    map((x) =>
      x
        .split("  ")
        .map((o) => o.trim())
        .filter((v) => v.length >= 1)
    ),
    (v) => filter((o) => o.length >= 1, v),
    slice(1, Infinity),
    map((v) => ({
      name: v[0],
      handle: parseInt(v[1] ?? "-1", 10),
      exe: v[2],
      pid: parseInt(v[3] ?? "-1", 10),
    }))
  )(proc.stdout);

  const filtered = res.filter((v) =>
    (filterNames ?? []).find((o) => v.name.toLowerCase().indexOf(o) >= 0)
  );

  return filtered;
};

export const getExeList = async () => {
  const proc = await execa(`tasklist`, ["/v"]);

  type ProcessData = {
    task: string;
    pid: string;
    session: string;
    sessionNo: string;
    memUsage: string;
    status: string;
    user: string;
    cpuTime: string;
    title: string;
    raw: string;
  };

  const cols = [26, 9, 17, 12, 13, 16, 51, 13, 72];
  const processes = pipe<
    [string],
    string[],
    string[],
    ProcessData[],
    ProcessData[]
  >(
    split(/(\r\n|\n)/),
    filter((v: string) => v.length > cols[0]),
    map<string, ProcessData>((v): ProcessData => {
      const colsum = sumIndices(cols, 0);
      return {
        task: substr(v, 0, colsum(0) - 1).trim(),
        pid: substr(v, colsum(0), colsum(1) - 1).trim(),
        session: substr(v, colsum(1), colsum(2) - 1).trim(),
        sessionNo: substr(v, colsum(2), colsum(3) - 1).trim(),
        memUsage: substr(v, colsum(3), colsum(4) - 1).trim(),
        status: substr(v, colsum(4), colsum(5) - 1).trim(),
        user: substr(v, colsum(5), colsum(6) - 1).trim(),
        cpuTime: substr(v, colsum(6), colsum(7) - 1).trim(),
        title: substr(v, colsum(7)).trim(),
        raw: v,
      };
    }),
    filter(
      (v: ProcessData) => !!v && !!extractMatches(/(.*)\.exe/)(v.task)?.length
    )
  )(proc.stdout);

  return processes;
};

export const retry = async <T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number
): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    console.error(e);
    if (retries === 0) {
      throw e;
    }

    await new Promise((r) => {
      setTimeout(r, delay);
    });

    return retry(fn, retries - 1, delay);
  }
};

export const updateCfg = async (cfg: PartialCFG, cons: string) => {
  const dumpPath = await getDumpSettingsPath(cons);
  const emu = await getEmuSettings();
  const settings = emu.value();

  if (!settings) throw new Error("No settings found");

  const { pathing } = settings;
  const defaultConfig = join(pathing.backend, "retroarch.cfg");
  const configPath = join(dumpPath, "config.cfg");

  if (!(await fs.pathExists(configPath)))
    await fs.copyFile(defaultConfig, configPath);

  const cfgFile = await fs.readFile(configPath, "utf-8");

  const configReplacement = pipe<
    [PartialCFG],
    CFGKeys[],
    [CFGKeys, string, RegExp][]
  >(
    keys<PartialCFG>,
    map((k: CFGKeys) => [
      k,
      cfg[k] || "",
      new RegExp(`^(${k} = ")(.*)(")$`, "m"),
    ])
  )(cfg);

  let replaced = cfgFile;
  for (let i = 0; i < configReplacement.length; i++) {
    const [, value, replacer] = configReplacement[i];
    replaced = replaced.replace(replacer, `$1${value}$3`);
  }

  await fs.writeFile(configPath, replaced, "utf-8");
};

export const sleep = async (ms: number) => {
  await new Promise((r) => {
    setTimeout(r, ms);
  });
};

type MapObjectValue<
  K extends string,
  R = any,
  O extends object | None = undefined
> = O extends None
  ? <O2 extends object>(obj: O2) => MapObjectValue<K, R, O2>
  : Record<K, R>;

const mapObject = <K extends string, V, R, O extends object | None = undefined>(
  fn: (value: V, key: K, obj: Record<K, V>) => R,
  obj?: O
): MapObjectValue<K, R, typeof obj> => {
  if (!obj) {
    const $fn = (o: O) => {
      const z = mapObject(fn, o) as Record<K, R>;
      return z;
    };

    return $fn as any;
  }

  const objKeys = Object.keys(obj) as (keyof O)[];
  return objKeys.reduce(
    (acc, key) => ({
      ...acc,
      [key]: fn((obj as any)[key], key as any, obj as any),
    }),
    {} as MapObjectValue<K, R, typeof obj>
  );
};

export const getDriveList = async () => {
  type Column = keyof DiskData;

  const res = await new Promise<DiskData[]>((resolve) => {
    const proc = execa(`wmic`, ["logicaldisk"]);
    let stdout = "";

    proc.stdout?.on("data", (buf: Buffer) => {
      const line = buf.toString();
      stdout += line;
    });

    proc.stdout?.on("end", () => {
      const rows = stdout.split("\r\r\n");
      const header = rows[0];
      const fields = extractMatches(/\w+\s*/g, header, false);

      const data = rows.slice(1).map((row) => {
        const parse = pipe<[string[]], DiskData, DiskData, DiskData>(
          reduce((acc, field) => {
            const start = header.indexOf(field);
            const end = start + field.length;
            const value = row.substring(start, end).trim();
            const key = _.camelCase(field.trim()) as Column;

            return {
              ...acc,
              [key]: value,
            };
          }, {} as DiskData),
          mapObject((v, k, o) => {
            let newValue = (v ?? "") as string;

            if (k === "volumeName" && !newValue.length)
              newValue = `Local Disk ${o.deviceId}`;

            return newValue;
          }),
          (d) => d
        )(fields);

        return parse;
      });
      resolve(data);
    });
  });

  return res;
};

export const scoreTitlesMusic = (video: Video) => {
  const cleanedString = R.pipe(
    R.toLower,
    R.replace(/([^a-z0-9 ])/g, ""),
    R.trim
  )(video.title);

  const priority: Record<string, number> = {
    "ost|prelude": 3,
    opening: 0.75,
    "intro|title": 0.5,
    "jukebox|theme|track|music": 0.5,
    "main menu": 0.25,
    "ps1|playstation": 0.25,
    hd: 0.25,
    "1|01|2|02|3|03|4|04|5|05": 0.2,
  };

  const avoid = [
    "remake",
    "longplay",
    "gameplay",
    "fmv",
    "loop",
    "full game",
    "long play",
    "game play",
    "extended",
  ];

  const score = R.keys(priority).reduce((acc, curr) => {
    const check = curr
      .split("|")
      .some((v) => cleanedString.split(" ").includes(v));
    if (check) {
      return acc + priority[curr];
    }

    return acc;
  }, 0);

  // console.log(video.title, score, matched);

  const avoided = avoid.some((a) => cleanedString.indexOf(a) > -1);

  if (avoided) {
    return 0;
  }

  return score;
};

export const searchMusicVideo = async (keyword: string, cons: string) => {
  const search = `${keyword} ${cons} music opening`;
  const search2 = `${keyword} ${cons} ost`;
  const search3 = `${keyword} ${cons} intro`;
  const search4 = `${keyword} ${cons} theme song`;
  const results = await youtube.search(search);
  const results2 = await youtube.search(search2);
  const results3 = await youtube.search(search3);
  const results4 = await youtube.search(search4);
  const merge = results.videos
    .concat(results2.videos)
    .concat(results3.videos)
    .concat(results4.videos);

  const uniquesIds = R2.pipe<
    [Video[]],
    Record<string, Video[]>,
    any,
    any,
    any,
    string[]
  >(
    R.groupBy(R.prop("id")),
    (v) => R2.map(R.pluck("id"), v),
    R2.map(R2.flatten),
    R2.map(R.uniq),
    R2.keys
  )(merge);

  const uniques = uniquesIds
    .map((id) => merge.find((v) => v.id === id))
    .filter(Boolean) as Video[];

  const videos = R2.pipe<
    [Video[]],
    { item: Video; score: number; scoreMatch: number }[],
    { item: Video; score: number; scoreMatch: number }[],
    { item: Video; score: number; scoreMatch: number }[],
    { item: Video; score: number; scoreMatch: number }[],
    Video[]
  >(
    R2.map((v) => ({
      item: v,
      score: 0,
      scoreMatch: scoreMatchStrings(v.title, keyword),
    })),
    R.filter((v) => v.scoreMatch >= 0.35 && v.item.duration < 300),
    R.map((v) => ({
      ...v,
      score: scoreTitlesMusic(v.item),
    })),
    R2.sort((a, b) => b.score - a.score),
    R.map((v) => v.item)
  )(uniques);

  return videos;
};

export const bytesFormat = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(3)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(3)} MB`;
  return `${(bytes / 1073741824).toFixed(3)} GB`;
};

interface CopyFilesOptions {
  onProgress?: (progress: ProgressData) => void | Promise<void>;
  concurrency?: number;
  delay?: number;
}

export const copyFiles = async (
  target: string,
  dest: string,
  options?: CopyFilesOptions
) => {
  const { onProgress } = options ?? {};
  const t = pathResolve(target);
  const d = pathResolve(dest);

  const files = await new Promise<string[]>((rsv) => {
    recursiveReadDir(t, [], (err, res) => {
      if (err) console.error(err);
      rsv(res);
    });
  });

  await ensureDir(d);

  const fileSizes = (
    await pMap(files, async (file) => {
      const { size } = await stat(file);
      const isDirectory = (await stat(file)).isDirectory();
      return {
        size,
        isDirectory,
      };
    })
  ).filter((v) => !v.isDirectory);

  const totalSize = fileSizes.reduce((p, b) => p + b.size, 0);

  const progress = {
    current: undefined,
    currentSize: undefined,
    currentTotalSize: undefined,
    completedFiles: 0,
    totalFiles: files.length,
    totalSize,
    completedSize: 0,
    percent: 0,
  } as ProgressData;

  const currentSizes: Record<string, number> = {};

  await pMap(
    files,
    async (v) => {
      const newPath = v.replace(t, d);
      await ensureDir(dirname(newPath));
      currentSizes[v] = 0;
      await cp(v, newPath, {
        overwrite: true,
      }).on("progress", (cpProg) => {
        progress.current = basename(cpProg.sourcePath);
        progress.currentSize = cpProg.writtenBytes;
        progress.currentTotalSize = cpProg.size;
        currentSizes[v] = cpProg.writtenBytes;
        progress.completedSize = _.values(currentSizes).reduce(
          (p, c) => p + c,
          0
        );
        progress.percent = progress.completedSize / progress.totalSize;
        if (cpProg.percent >= 1) {
          progress.completedFiles++;
        }
        onProgress?.(progress);
      });

      if (options?.delay) await sleep(options.delay);
    },
    {
      concurrency: options?.concurrency ?? Infinity,
    }
  );
};

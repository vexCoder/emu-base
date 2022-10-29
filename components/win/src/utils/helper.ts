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
  sum,
  keys,
  reduce,
} from "ramda";
import { findBestMatch } from "string-similarity";
import execa from "execa";
import _ from "lodash";
import dayjs from "dayjs";

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
  if (!maximize) {
    win.setSize(
      result.width ?? win.getSize()[0],
      result.height ?? win.getSize()[1],
      false
    );
  }

  if (maximize) {
    win.maximize();
    win.setFullScreen(true);
  }
};

export const logToFile = async (msg: any) => {
  const logPath = join(app.getAppPath(), "log.txt");
  let msgString = msg;
  if (typeof msg === "object") msgString = JSON.stringify(msg);
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
    fullscreen = true,
  } = opts ?? {};

  const win = new BrowserWindow({
    width: 800,
    height: 600,
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

    moveToMonitor(monitor, win, undefined, fullscreen);
    win.once("blur", () => {
      // Select which monitor to use
      console.log(opts?.urlOrPath, monitor);
      moveToMonitor(monitor, win, undefined, fullscreen);
    });
  } else {
    // Select which monitor to use
    console.log(opts?.urlOrPath, monitor);
    moveToMonitor(monitor, win, undefined, fullscreen);
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

  logToFile({ path });
  ensureDirSync(path);
  return path;
};

export const getDumpPath = (consoleName?: string) => {
  const base = getSettingsPath();
  const path = consoleName
    ? join(base, "dump", consoleName)
    : join(base, "dump");

  logToFile({ path });
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

export const getDiscMappings = async (consoleName: string) => {
  const pathToDump = getDumpPath(consoleName);
  fs.ensureDirSync(pathToDump);
  const adapter = new FileAsync<GameDiscMappings>(
    join(pathToDump, `mappings.json`)
  );
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
  const dumpPath = getDumpPath(cons);
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

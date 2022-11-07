/* eslint-disable import/prefer-default-export */
import { setActiveWindow, ShowWindowFlags } from "@utils/ffi";
import {
  createWindow,
  getDisplayById,
  getDisplayIndex,
  getDumpPath,
  getEmuSettings,
  logToFile,
} from "@utils/helper";
import { app, BrowserWindow, Tray } from "electron";
import { copy, ensureDir, pathExists, readJSON, remove } from "fs-extra";
import pMap from "p-map";
import { join } from "path";
import Emulator from "./emulator";
import OverlayWindow from "./overlay";
import { MountDataHandles } from "./register";

export class Application {
  win?: BrowserWindow;
  overlay?: OverlayWindow;
  emulator?: Emulator;
  icon = "";
  tray?: Tray;

  async init() {
    // NOTE do some initialization like seeding the database
    const isProd = process.env.NODE_ENV === "production";
    if (isProd) {
      const defaultPath = join(app.getPath("appData"), "emu-base", "defaults");
      const hasDefault = await pathExists(defaultPath);

      if (hasDefault) {
        const defaultSettings = (await readJSON(
          join(defaultPath, "settings.json")
        )) as Pick<AppSettings, "consoles">;
        logToFile(defaultSettings)
        const settings = await getEmuSettings();

        const consoles = settings.get("consoles").value();
        logToFile(consoles)

        const newConsoles = consoles.map((v) => {
          const cons = defaultSettings.consoles.find((c) => c.key === v.key);
          logToFile(cons)
          if (!cons) return v;
          return {
            ...v,
            id: cons.id,
            description: cons.description,
            lastUpdated: cons.lastUpdated,
            retroarch: {
              ...v.retroarch,
              core: cons.retroarch.core,
            },
          };
        });

        settings.set("consoles", newConsoles).write();
        const dumpRoot = settings.get("pathing.dump").value();

        await pMap(newConsoles, async (v) => {
          const key = v.key;
          const dumpPath = join(defaultPath, key);
          const hasDump = await pathExists(dumpPath);

          logToFile(dumpPath);
          logToFile(hasDump);
          if (!hasDump) return;

          const consoleDumpPath = getDumpPath(key, dumpRoot);
          await ensureDir(consoleDumpPath);

          logToFile(join(dumpPath, "dump.json"))
          logToFile(join(consoleDumpPath, "dump.json"))
          await copy(
            join(dumpPath, "dump.json"),
            join(consoleDumpPath, "dump.json"),
            { overwrite: true }
          );

          await copy(
            join(dumpPath, "links.json"),
            join(consoleDumpPath, "links.json"),
            { overwrite: true }
          );
        });

        await remove(defaultPath)
      }
    }


    return this;
  }

  makeWindow(settings: AppSettings) {
    // NOTE create a window
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) this.icon = join(process.cwd(), "assets/game-controller128.ico");
    else this.icon = join(__dirname, "..", "assets/game-controller128.ico");

    const path = isDev
      ? "http://localhost:3001"
      : join(__dirname, "..", "view", "index.html");

    logToFile(path);

    const monitor = getDisplayById(settings.display);
    const target = getDisplayIndex(monitor?.id ?? 0);

    if (target === -1) throw new Error("Invalid monitor");

    this.win = createWindow({
      urlOrPath: path,
      isDev,
      monitor: target,
      fullscreen: true,
      browserOptions: {
        icon: this.icon,
        frame: false,
        fullscreen: false,
        webPreferences: {
          preload: join(__dirname, "preload.js"),
          contextIsolation: true,
          devTools: true,
          webSecurity: false,
        },
      },
    });

    this.overlay = new OverlayWindow(this, {
      monitor,
      onDetach: () => {
        console.log("Ejecting");
        if (this.win) {
          this.win?.moveTop();
          setActiveWindow(
            this.win?.getNativeWindowHandle().readUInt32LE(0),
            ShowWindowFlags.SW_SHOW
          );
          this.win?.webContents.send("emulator:onDetach");
          this.win?.webContents?.send("event.quit", {
            value: {
              enabled: false,
            },
          });
        }
      },
    });

    return this;
  }

  setEmulator(emu: Emulator) {
    this.emulator = emu;
  }

  startEvents() {
    // NOTE start listening to events
    if (!this.win) return this;

    app.on("window-all-closed", () => {
      console.log("window-all-closed");
      if (process.platform !== "darwin") {
        app.quit();
      }
    });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    this.win.on("focus", () => {});

    this.win.on("closed", () => {
      console.log("close");
      this.win?.destroy();
      this.overlay?.win?.close();
      this.overlay?.win?.destroy();
    });

    return this;
  }

  attachHandlers() {
    MountDataHandles(this);

    return this;
  }

  static async boot() {
    if (require("electron-squirrel-startup")) return;

    logToFile("booting");
    await app.whenReady();
    logToFile("booted");

    const settings = (await getEmuSettings()).value();
    // eslint-disable-next-line prettier/prettier
    const appn = new Application();
    await appn.init();
    appn.makeWindow(settings).startEvents().attachHandlers();
  }
}

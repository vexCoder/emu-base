/* eslint-disable import/prefer-default-export */
import { setActiveWindow, ShowWindowFlags } from "@utils/ffi";
import {
  createWindow,
  getDisplayById,
  getDisplayIndex,
  getEmuSettings,
  logToFile
} from "@utils/helper";
import { app, BrowserWindow, Tray } from "electron";
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

  init() {
    // NOTE do some initialization like seeding the database
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
      fullscreen: !isDev,
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

    const settings = (await getEmuSettings()).value()
    // eslint-disable-next-line prettier/prettier
    new Application().init().makeWindow(settings).startEvents().attachHandlers();
  }
}

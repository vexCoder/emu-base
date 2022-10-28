/* eslint-disable import/prefer-default-export */
import { createWindow, logToFile } from "@utils/helper";
import { app, BrowserWindow, Menu, Tray } from "electron";
import { join } from "path";
import Emulator from "./emulator";
import OverlayWindow from "./overlay";
import { MountDataHandles } from "./register";

export class Application {
  win?: BrowserWindow;
  overlay?: OverlayWindow;
  emulator?: Emulator;
  icon = '';
  quitting = false;
  tray?: Tray;

  init() {
    // NOTE do some initialization like seeding the database
    return this;
  }

  makeWindow() {
    // NOTE create a window
    const isDev = process.env.NODE_ENV === "development";
    if(isDev) this.icon = join(process.cwd(), "assets/game-controller128.ico");
    else this.icon = join(__dirname, "..", "assets/game-controller128.ico");
    this.tray = new Tray(this.icon);

    this.tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: "Show",
          click: () => {
            this.win?.show();
            this.win?.webContents.send("eject-game");
          },
        },
        {
          label: "Quit",
          click: () => {
            this.quitting = true;
            this.win?.destroy();
            this.overlay?.cleanUp();
            app.quit();
          },
        },
      ])
    );

    const path = isDev
      ? "http://localhost:3001"
      : join(__dirname, '..', 'view', 'index.html');

    logToFile(path);

    this.win = createWindow({
      urlOrPath: path,
      isDev,
      browserOptions: {
        icon: this.icon,
        webPreferences: {
          preload: join(__dirname, "preload.js"),
          contextIsolation: true,
          devTools: true,
          webSecurity: false,
        },
      },
    });

    this.overlay = new OverlayWindow(this);

    this.overlay.createWindow(this.icon, {
      onDetach: () => {
        console.log("Ejecting");
        this.win?.show();
        this.win?.moveTop();
        this.win?.webContents.send("emulator:onDetach");
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
      if (process.platform !== "darwin") app.quit();
    });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    app.on("before-quit", async () => {
      console.log("qutting");
      this.quitting = true;
      this.overlay?.cleanUp();
    });

    this.win.on("focus", () => {});

    this.win.on("close", (ev) => {
      console.log("close");
      if (!this.quitting) {
        ev.preventDefault();
        this.win?.hide();
        ev.returnValue = false;
      }else {
        this.win?.destroy();
        this.tray?.destroy()
      }
    });

    return this;
  }

  attachHandlers() {
    MountDataHandles(this);

    return this;
  }

  static async boot() {
    if (require("electron-squirrel-startup")) return;


    logToFile('booting');
    await app.whenReady();
    logToFile('booted');

    // eslint-disable-next-line prettier/prettier
    new Application().init().makeWindow().startEvents().attachHandlers();
  }
}

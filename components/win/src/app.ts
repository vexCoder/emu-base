/* eslint-disable import/prefer-default-export */
import { app, BrowserWindow } from "electron";
import { Handlers } from "./handlers";
import { createWindow } from "./helper";
import {ProgressionParser} from 'core/node'

export class Application {
  win?: BrowserWindow;

  init() {
    // NOTE do some initialization like seeding the database
    return this;
  }

  makeWindow() {
    // NOTE create a window
    const isDev = process.env.NODE_ENV === "development";
    this.win = createWindow({
      isDev,
      browserOptions: {
        webPreferences: {
          webSecurity: false
        }
      }
    });
    
    return this;
  }

  startEvents() {
    // NOTE start listening to events
    if (!this.win) return this;

    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") app.quit();
    });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    this.win.on("focus", () => {});

    return this;
  }

  attachHandlers() {
    // NOTE attach handlers for preload scripts

    Handlers.register("win", "minimize",  () => this.win?.minimize());
    Handlers.register("core", "progression",  async () => {
      const parser = new ProgressionParser()
      await parser.parse()
      return parser.parsedData.progression
    });

    return this;
  }

  static async boot() {
    if(require('electron-squirrel-startup')) return;
    
    await app.whenReady();
    // eslint-disable-next-line prettier/prettier
    new Application().init().makeWindow().startEvents().attachHandlers();
  }
}

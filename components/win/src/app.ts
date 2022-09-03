/* eslint-disable import/prefer-default-export */
import { app, BrowserWindow } from "electron";
import { DataApi } from "./api/data";
import { Handlers } from "@utils/handlers";
import { createWindow } from "@utils/helper";

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
          webSecurity: false,
        },
      },
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
    const Data = new DataApi.Resolver();

    Handlers.register("win", "minimize", () => this.win?.minimize());

    Handlers.register(
      "data",
      "getGames",
      async (_evt, keyword, cns, page, limit) => await Data.getGames({ console: cns, keyword, page, limit })
    );

    Handlers.register(
      "data",
      "getGameFiles",
      async (_evt, id, cons) => await Data.getGameFiles({ id, console: cons })
    );

    Handlers.register(
      "data",
      "getImage",
      async (_evt, path, url) => await Data.getImage({ path, url })
    );

    Handlers.register(
      "data",
      "getGameLinks",
      async (_evt, keyword, tags, cons) => await Data.getGameLinks({ keyword, tags, console: cons })
    );

    Handlers.register(
      "data",
      "setGameLinks",
      async (_evt, id, serials, links, cons) => await Data.setGameLinks({ id, serials, links, console: cons })
    );

    return this;
  }

  static async boot() {
    if (require("electron-squirrel-startup")) return;

    await app.whenReady();

    // eslint-disable-next-line prettier/prettier
    new Application().init().makeWindow().startEvents().attachHandlers();
  }
}

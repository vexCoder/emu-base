/* eslint-disable @typescript-eslint/no-unused-vars */
import { DataApi } from "@api/data";
import { WinApi } from "@api/win";
import { Handlers } from "@utils/handlers";
import fs from "fs-extra";
import nodePath from "path";

// eslint-disable-next-line import/prefer-default-export
export const MountDataHandles = (app: Application) => {
  // NOTE attach handlers for preload scripts
  const Data = new DataApi.Resolver();
  const Win = new WinApi.Resolver();

  Handlers.register("win", "close", async () => {
    if (app) {
      // eslint-disable-next-line no-param-reassign
      app.quitting = true;
      app.win?.close();
    }
  });

  Handlers.register("win", "minimize", async () => app?.win?.minimize());

  Handlers.register("win", "isDirectory", async (_evt, path) => {
    let check: boolean = true;
    if (path) check = fs.statSync(path).isDirectory();

    return check;
  });

  Handlers.register("win", "isFile", async (_evt, path) => {
    if (path) {
      return fs.statSync(path).isFile();
    }

    return false;
  });

  Handlers.register("path", "join", async (_evt, ...args: string[]) =>
    nodePath.join(...args)
  );

  Handlers.register("path", "resolve", async (_evt, ...args: string[]) =>
    nodePath.resolve(...args)
  );

  Handlers.register("path", "basename", async (_evt, arg: string) =>
    nodePath.basename(arg)
  );

  Handlers.register("path", "dirname", async (_evt, arg: string) =>
    nodePath.dirname(arg)
  );

  Handlers.register("win", "openPath", (_evt, options) =>
    Win.getPathFilesAndFolder(options)
  );

  Handlers.register(
    "data",
    "getGames",
    async (_evt, keyword, cns, page, limit) =>
      Data.getGames({ console: cns, keyword, page, limit })
  );

  Handlers.register("data", "getGame", async (_evt, id, cns) =>
    Data.getGame({ id, console: cns })
  );

  Handlers.register("data", "setGame", async (_evt, id, cns, data) =>
    Data.setGame({ id, console: cns, data })
  );

  Handlers.register("data", "getGameFiles", async (_evt, id, cons) =>
    Data.getGameFiles({ id, console: cons })
  );

  Handlers.register("data", "getGameRegionSettings", async (_evt, id, cons) =>
    Data.getGameRegionSettings({ id, console: cons })
  );

  Handlers.register("data", "getImage", async (_evt, path, url) =>
    Data.getImage({ path, url })
  );

  Handlers.register("data", "getGameLinks", async (_evt, keyword, tags, cons) =>
    Data.getGameLinks({ keyword, tags, console: cons })
  );

  Handlers.register(
    "data",
    "setGameLinks",
    async (_evt, id, serials, links, cons) =>
      Data.setGameLinks({ id, serials, links, console: cons })
  );

  Handlers.register("data", "downloadDisc", async (_evt, serial, id, cons) =>
    Data.downloadDisc({ serial, id, console: cons })
  );

  Handlers.register("data", "getConsoles", async (_evt) =>
    (await Data.getConsoles()).map((c) => c.id)
  );

  Handlers.register("data", "getConsole", async (_evt, id) =>
    Data.getConsole({ id })
  );

  Handlers.register("data", "getConsoleByKey", async (_evt, key) =>
    Data.getConsoleByKey({ key })
  );

  Handlers.register("data", "countConsoleGames", async (_evt, key) =>
    Data.countConsoleGames({ key })
  );

  Handlers.register("data", "setConsoleSettings", async (_evt, id, settings) =>
    Data.setConsoleSettings({ id, settings })
  );

  Handlers.register("data", "getGlobalSettings", async (_evt) =>
    Data.getGlobalSettings()
  );

  Handlers.register("data", "setGlobalSettings", async (_evt, pathing) =>
    Data.setGlobalSettings({
      app,
      pathing,
    })
  );

  Handlers.register("data", "getDownloadProgress", async (_evt, serial) =>
    Data.getDownloadProgress({ serial })
  );

  Handlers.register("data", "play", async (_evt, serial, id, cons) =>
    Data.play({ serial, id, console: cons, app })
  );

  Handlers.register("data", "toggleFavorite", async (_evt, id, console, bool) =>
    Data.toggleFavorite({ id, console, bool })
  );

  Handlers.register("emulator", "toggleTurbo", async (_evt) => {
    app?.emulator?.toggleTurbo();
  });

  Handlers.register("emulator", "toggleFPS", async (_evt) => {
    app?.emulator?.toggleFPS();
  });

  Handlers.register("emulator", "quit", async (_evt) => {
    app?.emulator?.quit();
  });

  Handlers.register("emulator", "saveToSlot", async (_evt, slot) => {
    console.log(`Slot ${slot}`);
    app?.emulator?.saveToSlot(slot);
  });

  Handlers.register("emulator", "loadFromSlot", async (_evt, slot) => {
    app?.emulator?.loadFromSlot(slot);
  });

  Handlers.register("emulator", "volume", async (_evt, volume) => {
    app?.emulator?.setVolume(volume);
  });

  Handlers.register("emulator", "init", async (_evt) => {
    app?.emulator?.init();
  });

  Handlers.register("emulator", "mute", async (_evt, bool) => {
    app?.emulator?.muteGame(bool);
  });

  Handlers.register("emulator", "intercept", async (_evt, bool) => {
    if (app.overlay && app.overlay.attached) {
      app?.overlay?.intercept(bool);
      app?.emulator?.sendMessage("PAUSE_TOGGLE");
    }
  });
};

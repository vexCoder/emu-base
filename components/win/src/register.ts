/* eslint-disable @typescript-eslint/no-unused-vars */
import { DataApi } from "@api/data";
import { WinApi } from "@api/win";
import { Handlers } from "@utils/handlers";

// eslint-disable-next-line import/prefer-default-export
export const MountDataHandles = (app: Application) => {
  // NOTE attach handlers for preload scripts
  const Data = new DataApi.Resolver();
  const Win = new WinApi.Resolver();

  Handlers.register("win", "close", () => {
    if (app) {
      // eslint-disable-next-line no-param-reassign
      app.quitting = true;
      app.win?.close();
    }
  });

  Handlers.register("win", "minimize", () => app?.win?.minimize());

  Handlers.register(
    "data",
    "getGames",
    async (_evt, keyword, cns, page, limit) =>
      Data.getGames({ console: cns, keyword, page, limit })
  );

  Handlers.register("win", "openPath", (_evt, options) =>
    Win.getPathFilesAndFolder(options)
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

  Handlers.register("data", "getDownloadProgress", async (_evt, serial) =>
    Data.getDownloadProgress({ serial })
  );

  Handlers.register("data", "play", async (_evt, serial, id, cons) =>
    Data.play({ serial, id, console: cons, app })
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
    app?.overlay?.intercept(bool);
    app?.emulator?.sendMessage("PAUSE_TOGGLE");
  });
};

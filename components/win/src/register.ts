/* eslint-disable @typescript-eslint/no-unused-vars */
import { DataApi } from "@api/data";
import { Handlers } from "@utils/handlers";

// eslint-disable-next-line import/prefer-default-export
export const MountDataHandles = (app: Application) => {
  // NOTE attach handlers for preload scripts
  const Data = new DataApi.Resolver();

  Handlers.register("win", "minimize", () => app?.win?.minimize());

  Handlers.register(
    "data",
    "getGames",
    async (_evt, keyword, cns, page, limit) =>
      Data.getGames({ console: cns, keyword, page, limit })
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

  Handlers.register("data", "getDownloadProgress", async (_evt, serial) =>
    Data.getDownloadProgress({ serial })
  );

  Handlers.register("data", "play", async (_evt, serial, id, cons) =>
    Data.play({ serial, id, console: cons, app })
  );

  Handlers.register("emulator", "toggleTurbo", async (_evt) => {
    app?.emulator?.toggleTurbo();
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
};

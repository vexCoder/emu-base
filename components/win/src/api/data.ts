/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/prefer-default-export */
import Emulator from "@root/emulator";
import Constants from "@utils/constants";
import Globals from "@utils/globals";
import {
  getConsoleDump,
  getConsoleLinks,
  getDiscMappings,
  getDumpPath,
  getEmuSettings,
  saveImage,
  scoreMatchStrings,
} from "@utils/helper";
import extract from "extract-zip";
import fs, { createWriteStream } from "fs-extra";
import got from "got";
import { ObjectChain } from "lodash";
import pMap from "p-map";
import { extname, join } from "path";
import { filter, head, intersection, is, toLower } from "ramda";
import { DownloadStatus } from "types/enums";

export namespace DataApi {
  export class Resolver {
    async getGames({ console: cns, keyword, page, limit }: GetGamesParams) {
      const settings = await getEmuSettings();
      const db = await getConsoleDump(cns);

      const filtered = db.filter(
        ({ official }: ConsoleGameData) =>
          scoreMatchStrings(official, keyword) > 0.5
      );
      const counter = page * limit;

      const favorites = settings.get("favorites").value() ?? [];
      const sorted = filtered
        .sort(
          (a, b) =>
            scoreMatchStrings((b as ConsoleGameData).official, keyword) -
            scoreMatchStrings((a as ConsoleGameData).official, keyword)
        )
        .slice(counter, counter + limit)
        .value() as ConsoleGameData[];

      const nextCounter = counter + limit;
      const next = filtered.slice(nextCounter, nextCounter + limit).value();

      return {
        res: sorted.map((game) => ({
          ...game,
          isFavorite: favorites.indexOf(game.id) > -1,
        })),
        hasNext: next.length > 0,
      };
    }

    async getGame({ id, console: cns }: GetGameParams) {
      const settings = await getEmuSettings();
      const db = await getConsoleDump(cns);

      const favorites = settings.get("favorites").value() ?? [];

      const game = db.find({ id }).value() as ConsoleGameData;

      return {
        ...game,
        isFavorite: favorites.indexOf(game.id) > -1,
      };
    }

    async setGame({ id, console: cns, data }: SetGameParams) {
      const db = await getConsoleDump(cns);

      const game = db
        .find({ id })
        .set("opening", data.opening)
        .write() as ConsoleGameData;

      return game;
    }

    async getImage({ path, url }: GetImageParams) {
      // NOTE: Check if prod use electron static paths
      const file = join(__dirname, "dump", path);
      try {
        const base64 = await fs.readFile(file, "base64");
        return `data:image/png;base64,${base64}`;
      } catch (error) {
        if (url) saveImage(file, url);
        return undefined;
      }
    }

    async getGameFiles({ id, console: cons }: GetGameFilesParams) {
      const pathToDump = getDumpPath(cons);
      const db = await getConsoleDump(cons);
      const mappings = await getDiscMappings(cons);
      const game = db.find({ id }).value() as ConsoleGameData;
      const serialMappings = Object.keys(mappings.get(id).value() ?? {});
      const region = game?.regions.find(
        ({ serials }) =>
          intersection(serials, serialMappings).length === serials.length
      );

      if (!game || !game?.regions.length || !serialMappings || !region)
        return undefined;

      const gameFilePath = join(pathToDump, game.unique);
      const gameFiles = await pMap(region.serials, async (serial) => {
        const exts = ["iso", "bin"];
        const extFiles = await pMap(exts, async (ext) => {
          const pathToFile = join(gameFilePath, serial, `${serial}.${ext}`);
          const check = await fs.pathExists(pathToFile);
          return check ? pathToFile : undefined;
        });

        return {
          serial,
          playable: extFiles.some(is(String)),
          link: mappings.get(`${id}.${serial}`).value(),
          path: head(filter(is(String), extFiles)),
        };
      });

      return {
        title: region.title,
        region: region.region,
        gameFiles,
      };
    }

    async getGameRegionSettings({ id, console: cons }: GetGameFilesParams) {
      const pathToDump = getDumpPath(cons);
      const db = await getConsoleDump(cons);
      const mappings = await getDiscMappings(cons);
      const game = db.find({ id }).value() as ConsoleGameData;

      if (!game || !game.regions.length) return [];
      const gameFilePath = join(pathToDump, game.unique);
      const regionFiles = await pMap(game.regions, async (region) => {
        const gameFiles = await pMap(region.serials, async (serial) => {
          const exts = ["iso", "bin"];
          const extFiles = await pMap(exts, async (ext) => {
            const pathToFile = join(gameFilePath, serial, `${serial}.${ext}`);
            const check = await fs.pathExists(pathToFile);
            return check ? pathToFile : undefined;
          });

          return {
            serial,
            playable: extFiles.some(is(String)),
            link: mappings.get(`${id}.${serial}`).value(),
            path: head(filter(is(String), extFiles)),
          };
        });

        return {
          title: region.title,
          region: region.region,
          gameFiles,
        };
      });

      return regionFiles;
    }

    async getGameLinks({ keyword, tags, console: cons }: GetGameLinksParams) {
      const db = await getConsoleLinks(cons);

      const filtered = db.filter(({ title, tags: linkTags }: ParsedLinks) => {
        const score = scoreMatchStrings(title, keyword) > 0.5;
        const isPal =
          linkTags.some((t) =>
            Constants.PAL.map(toLower).includes(t.toLowerCase())
          ) && tags.map(toLower).includes("pal");

        const isNTSCU =
          linkTags.some((t) =>
            Constants.NTSCU.map(toLower).includes(t.toLowerCase())
          ) && tags.map(toLower).includes("ntsc-u");

        const isNTSCJ =
          linkTags.some((t) =>
            Constants.NTSCJ.map(toLower).includes(t.toLowerCase())
          ) && tags.map(toLower).includes("ntsc-j");

        return score && (isPal || isNTSCU || isNTSCJ);
      });

      const sorted = filtered
        .sort(
          (a, b) =>
            scoreMatchStrings((b as ParsedLinks).title, keyword) -
            scoreMatchStrings((a as ParsedLinks).title, keyword)
        )
        .value() as ConsoleLinks;

      return sorted;
    }

    async setGameLinks({
      id,
      serials,
      links,
      console: cons,
    }: SetGameLinksParams) {
      const db = await getConsoleDump(cons);
      const mappings = await getDiscMappings(cons);

      const find = db.find(
        (v: ConsoleGameData) =>
          v.id === id &&
          v.regions.some((r) => r.serials.every((s) => serials.includes(s)))
      ) as ObjectChain<ConsoleGameData>;

      const value = find.value();

      if (!value) return false;

      let newMappings = {};
      for (let i = 0; i < serials.length; i++) {
        const serial = serials[i];
        mappings.set(`${value.id}.${serial}`, links[i]).write();
        newMappings = { ...newMappings, [serial]: links[i] };
      }

      return newMappings;
    }

    async downloadDisc({ console: cons, id, serial }: DownloadDiscParams) {
      const db = await getConsoleDump(cons);
      const mappings = await getDiscMappings(cons);

      const pathToDump = getDumpPath(cons);
      const game = db.find({ id }).value() as ConsoleGameData;
      const link = mappings.get(`${id}.${serial}`).value();
      if (!game || !link) return false;

      const gameFilePath = join(pathToDump, game.unique, serial);
      const gameFile = join(pathToDump, game.unique, `${serial}.zip`);
      const downloadStream = got.stream(link.link);
      const fileWriterStream = createWriteStream(gameFile);

      await fs.ensureDir(gameFilePath);
      const handleRemove = (reason: string, error = true) => {
        if (error) console.error(reason);
        else console.log(reason);
        Globals.merge(`download-${serial}-progress`, {
          status: DownloadStatus.Completed,
        });

        setTimeout(() => {
          Globals.remove(`download-${serial}-progress`);
        }, 5000);
      };

      downloadStream
        .on("downloadProgress", ({ transferred, total, percent }) => {
          console.log(percent);
          const percentage = Math.round(percent * 100);
          Globals.merge(`download-${serial}-progress`, {
            percentage,
            transferred,
            total,
          });
        })
        .on("error", (error) => {
          handleRemove(`Download failed: ${error.message}`);
        });

      fileWriterStream
        .on("error", (error) => {
          handleRemove(`Could not write file to system: ${error.message}`);
        })
        .on("finish", () => {
          console.log(`File downloaded to ${gameFile}`);

          Globals.merge(`download-${serial}-progress`, {
            status: DownloadStatus.Extracting,
          });

          extract(gameFile, { dir: gameFilePath }).then(() => {
            fs.readdirSync(gameFilePath).forEach((v) => {
              const ext = extname(v);
              const newPath = join(gameFilePath, `${serial}${ext}`);
              fs.renameSync(join(gameFilePath, v), newPath);
            });

            handleRemove(`File downloaded to ${gameFilePath}`, false);
          });
        });

      downloadStream.pipe(fileWriterStream);

      Globals.set(`download-${serial}-progress`, {
        percentage: 0,
        status: DownloadStatus.Downloading,
        transferred: 0,
        total: 0,
      });

      return true;
    }

    async getDownloadProgress({ serial }: GetDownloadProgressParams) {
      const progress = Globals.get(`download-${serial}-progress`) as
        | DownloadProgress
        | undefined;

      return (
        progress ?? {
          percentage: 0,
          status: DownloadStatus.NotDownloading,
          transferred: 0,
          total: 0,
        }
      );
    }

    async play({ id, console: cons, serial, app }: PlayParams) {
      const settings = await getEmuSettings();
      const consoleData = settings
        .get("consoles")
        .find((v) => v.key === cons)
        .value();

      if (app && settings && consoleData) {
        const emulator = new Emulator(settings.value(), app, consoleData);

        app.setEmulator(emulator);
        await emulator.play(id, serial);
      }

      return false;
    }

    async toggleFavorite({ id, console: cns, bool }: ToggleFavoriteParams) {
      const settings = await getEmuSettings();
      const db = await getConsoleDump(cns);
      const game = db.find({ id }).value() as ConsoleGameData;

      if (!game) return false;

      const favorites = settings.get("favorites").value() ?? [];
      const isFavorite =
        typeof bool === "boolean" ? !bool : favorites.includes(game.id);

      const isInside = favorites.includes(game.id);
      let newFavorites = isFavorite
        ? favorites.filter((v) => v !== game.id)
        : [...favorites, game.id];

      if (isInside && !isFavorite) newFavorites = favorites;

      console.log(isFavorite, newFavorites);
      settings.set("favorites", newFavorites).write();

      return !isFavorite;
    }

    async getConsoles() {
      const db = await getEmuSettings();
      return db.get("consoles").value();
    }

    async getConsole({ id }: GetConsoleParams) {
      const db = await getEmuSettings();
      return db
        .get("consoles")
        .find((v) => v.id === id)
        .value();
    }

    async getConsoleByKey({ key }: GetConsoleByKeyParams) {
      const db = await getEmuSettings();
      return db
        .get("consoles")
        .find((v) => v.key === key)
        .value();
    }

    async setConsoleSettings({ id, settings }: SetConsoleSettingsParams) {
      const db = await getEmuSettings();
      const console = db
        .get("consoles")
        .find((v) => v.id === id)
        .value();

      if (!console) return;

      db.get("consoles")
        .find((v) => v.id === id)
        .assign({
          ...console,
          retroarch: {
            ...console.retroarch,
            fullscreen: settings.fullscreen ?? console.retroarch.fullscreen,
            mute: settings.mute ?? console.retroarch.mute,
            volume: settings.volume ?? console.retroarch.volume,
            showFps: settings.showFps ?? console.retroarch.showFps,
            turboRate: settings.turboRate ?? console.retroarch.turboRate,
          },
        })
        .write();
    }

    async countConsoleGames({ key }: CountConsoleGamesParams) {
      const db = await getConsoleDump(key);
      return db.size().value();
    }

    async getGlobalSettings() {
      const db = await getEmuSettings();

      console.log(db.value());

      const pathing = db.get("pathing").value();

      return {
        pathing,
      };
    }

    async setGlobalSettings({ pathing: p }: SetGlobalSettingsParams) {
      const db = await getEmuSettings();

      const pathing = await db.get("pathing").assign(p).write();

      return {
        pathing,
      };
    }
  }

  interface Base {
    app?: Application;
  }

  interface PlayParams extends Base {
    id: string;
    serial: string;
    console: string;
  }
  interface GetDownloadProgressParams extends Base {
    serial: string;
  }

  interface DownloadDiscParams extends Base {
    serial: string;
    id: string;
    console: string;
  }

  interface GetGamesParams extends Base {
    keyword: string;
    console: string;
    page: number;
    limit: number;
  }

  interface GetGameParams extends Base {
    id: string;
    console: string;
  }

  interface SetGameParams extends Base {
    id: string;
    console: string;
    data: Partial<ConsoleGameData>;
  }

  interface GetImageParams extends Base {
    path: string;
    url?: string;
  }

  interface GetGameFilesParams extends Base {
    id: string;
    console: string;
  }

  interface GetGameLinksParams extends Base {
    keyword: string;
    tags: string[];
    console: string;
  }

  interface SetGameLinksParams extends Base {
    id: string;
    serials: string[];
    links: ParsedLinks[];
    console: string;
  }

  interface ToggleFavoriteParams extends Base {
    id: string;
    console: string;
    bool?: boolean;
  }

  interface GetConsoleParams extends Base {
    id: string;
  }

  interface GetConsoleByKeyParams extends Base {
    key: string;
  }

  interface SetConsoleSettingsParams extends Base {
    id: string;
    settings: Partial<EditableConsoleSettings>;
  }

  interface CountConsoleGamesParams extends Base {
    key: string;
  }

  interface SetGlobalSettingsParams extends Base {
    pathing?: Partial<EmuPathing>;
  }
}

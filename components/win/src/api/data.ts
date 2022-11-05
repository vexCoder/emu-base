/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/prefer-default-export */
import Emulator from "@root/emulator";
import Constants from "@utils/constants";
import Globals from "@utils/globals";
import {
  copyFiles,
  getConsoleDump,
  getConsoleLinks,
  getConsolePatchDump,
  getDiscMappings,
  getDumpPath,
  getEmuSettings,
  logToFile,
  saveImage,
  scoreMatchStrings,
  searchMusicVideo,
} from "@utils/helper";
import dayjs from "dayjs";
import extract from "extract-zip";
import { createWriteStream } from "fs";
import fs, { readdir } from "fs-extra";
import got from "got";
import _, { CollectionChain, ObjectChain } from "lodash";
import pMap from "p-map";
import { extname, join, resolve } from "path";
import { filter, head, intersection, is, toLower } from "ramda";
import { DownloadStatus } from "types/enums";
import Xray from "x-ray";
import * as R2 from "ramda";
import parseUrl from "parse-url";

export namespace DataApi {
  export class Resolver {
    async getGames({ console: cns, keyword, page, limit }: GetGamesParams) {
      const settings = await getEmuSettings();
      const db = await getConsoleDump(cns);
      const patch = await getConsolePatchDump(cns);

      const recent = settings.get("recentSearch").value() ?? [];
      let newRecent = _.uniq([...recent, keyword]);
      if (recent.length >= 10) newRecent = _.tail(newRecent);

      settings.set("recentSearch", newRecent).write();

      const favorites = settings.get("favorites").value() ?? [];
      const counter = page * limit;
      const nextCounter = counter + limit;

      if (!keyword || keyword.length < 3) {
        const games = db
          .map((v: ConsoleGameData) => ({
            ...v,
            ...((patch.find({ id: v.id }).value() as ConsoleGameData) ?? {}),
            isFavorite: favorites.indexOf(v.id) > -1,
          }))
          .orderBy(
            ["title", "isFavorite"],
            ["asc", "desc"]
          ) as any as CollectionChain<ConsoleGameData>;

        const sorted = games
          .slice(counter, counter + limit)
          .value() as ConsoleGameData[];

        const next = games.slice(nextCounter, nextCounter + limit).value();

        return {
          res: sorted,
          hasNext: next.length > 0,
        };
      }

      const filtered = db
        .filter(
          ({ official }: ConsoleGameData) =>
            scoreMatchStrings(official, keyword) > 0.5
        )
        .map((v: ConsoleGameData) => ({
          ...v,
          ...((patch.find({ id: v.id }).value() as ConsoleGameData) ?? {}),
          isFavorite: favorites.indexOf(v.id) > -1,
        }))
        .orderBy(
          ["title", "isFavorite"],
          ["asc", "desc"]
        ) as any as CollectionChain<ConsoleGameData>;

      const sorted = filtered
        .sort(
          (a, b) =>
            scoreMatchStrings((b as ConsoleGameData).official, keyword) -
            scoreMatchStrings((a as ConsoleGameData).official, keyword)
        )
        .slice(counter, counter + limit)
        .value() as ConsoleGameData[];

      const next = filtered.slice(nextCounter, nextCounter + limit).value();

      return {
        res: sorted,
        hasNext: next.length > 0,
      };
    }

    async getRecentSearches() {
      const settings = await getEmuSettings();
      const recent = settings.get("recentSearch").value() ?? [];
      return recent;
    }

    async getGame({ id, console: cns }: GetGameParams) {
      const settings = await getEmuSettings();
      const db = await getConsoleDump(cns);
      const patch = await getConsolePatchDump(cns);

      const favorites = settings.get("favorites").value() ?? [];

      const game = db.find({ id }).value() as ConsoleGameData;

      return {
        ...game,
        ...((patch.find({ id }).value() as ConsoleGameData) ?? {}),
        isFavorite: favorites.indexOf(game.id) > -1,
      };
    }

    async setGame({ id, console: cns, data }: SetGameParams) {
      const db = await getConsoleDump(cns);
      const patch = await getConsolePatchDump(cns);

      const gameData = db.find({ id }).value() as ConsoleGameData;
      const patchedGame = patch.find({ id }).value() as ConsoleGameData;

      const patchValue = <T extends keyof ConsoleGameData>(
        key: T
      ): ConsoleGameData[typeof key] => {
        const dataVal = data[key];
        if (key in data && !!dataVal) {
          return dataVal;
        }

        if (
          patchedGame &&
          key in patchedGame &&
          patchedGame[key] !== undefined
        ) {
          return patchedGame[key];
        }

        return gameData[key];
      };

      const newData = {
        ...gameData,
        opening: patchValue("opening"),
        description: patchValue("description"),
        publisher: patchValue("publisher"),
        developer: patchValue("developer"),
        released: patchValue("released"),
        cover: patchValue("cover"),
        ratings: patchValue("ratings"),
        genre: patchValue("genre"),
        screenshots: patchValue("screenshots"),
      };

      if (patchedGame) {
        const find = patch.find(
          (v: ConsoleGameData) => v.id === id
        ) as ObjectChain<ConsoleGameData>;

        find.assign(newData).write();
      } else {
        const list = patch.value() ?? [];
        patch.setState([...list, newData]).write();
      }

      return newData;
    }

    async searchTGDB({ keyword, console: cons }: SearchTGDBParams) {
      const platform =
        cons in Constants.TGDBPlatform
          ? Constants.TGDBPlatform[cons as keyof typeof Constants.TGDBPlatform]
          : undefined;

      const x = Xray();

      const url = `https://thegamesdb.net/search.php?name=${keyword
        .trim()
        .replace(/\s/g, "+")
        .replace(Constants.VALID_CHAR_REGEX, "")}${
        platform ? `&platform_id[]=${platform}` : ""
      }`;

      const results = (await x(url, "div#display > div > div", [
        "a@href",
      ])) as string[];

      const games = await pMap(results, async (tgdbUrl) => {
        const { id } = parseUrl(tgdbUrl).query;

        if (!id) return null;

        const left = "div.container-fluid > div.row > div:first-child";
        const right = "div.container-fluid > div.row > div:last-child";

        let img = "";
        try {
          img = await x(tgdbUrl, `${left} > div.row > div.col > div a img@src`);
        } catch (error) {
          console.error(error);
        }

        const lSect = (await x(
          tgdbUrl,
          `${left} > div.row > div.col > div > div:last-child`,
          ["p"]
        )) as string[];

        const topSect: string[] = await x(
          tgdbUrl,
          `${right} > div.row:nth-child(1) > div.col > div > div.card-body`,
          ["p@html"]
        );

        const bottomSect: string[] = await x(
          tgdbUrl,
          `${right} > div.row:nth-child(2) > div.col > div > div.card-body > div.row > div`,
          ["a@href"]
        );

        const name: string = await x(
          tgdbUrl,
          `${right} > div.row:nth-child(1) > div.col > div > div.card-header`,
          "*@html"
        );

        type ImageKey = "fanart" | "screenshots" | "clearlogo";
        const images = R2.groupBy((v: string) => {
          const m1 = v.indexOf("fanart") > -1 || v.indexOf("fanarts") > -1;
          if (m1) return "fanart";
          const m2 =
            v.indexOf("screenshots") > -1 || v.indexOf("screenshot") > -1;
          if (m2) return "screenshots";
          const m3 =
            v.indexOf("clearlogo") > -1 || v.indexOf("clearlogos") > -1;
          if (m3) return "clearlogo";

          return "";
        }, bottomSect) as Record<ImageKey, string[]>;

        const parseField = <T = string>(
          text: string,
          mapValue?: (v: string) => T
        ): { key: string; value: T } => {
          const [key, value, ...rest] =
            text?.split(":").map((v) => v.trim()) ?? [];
          const val = [value, ...rest].join(":");
          return { key, value: (mapValue?.(val) ?? val) as T };
        };

        const fields = topSect.map((v) => parseField(v));
        const lFields = lSect.map((v) => parseField(v));

        const released = lFields.find(
          (v) => v.key.toLowerCase().indexOf("releasedate") > -1
        );
        const formattedRelease = released
          ? dayjs(released.value, "YYYY-MM-DD").unix()
          : dayjs().unix();

        const publisher = lFields.find(
          (v) => v.key.toLowerCase().indexOf("publisher") > -1
        );

        const publisherValue = publisher?.value?.split("|")[0] ?? "n/a";

        const developer = lFields.find(
          (v) => v.key.toLowerCase().indexOf("developer") > -1
        );
        const developerValue = developer?.value?.split("|")[0] ?? "n/a";

        const description = topSect[0];
        const genre = fields.find(
          (v) => v.key.toLowerCase().indexOf("genre") > -1
        );
        const ratings = fields.find(
          (v) => v.key.toLowerCase().indexOf("rating") > -1
        );

        return {
          id: tgdbUrl.split("/").pop(),
          name,
          description: description ?? "",
          publisher: publisherValue,
          developer: developerValue,
          released: formattedRelease,
          cover: img,
          ratings: ratings?.value ?? "n/a",
          genre: genre?.value?.split("|").map((v) => v.trim()) ?? [],
          screenshots: images.fanart,
        };
      });

      return games.filter((v): v is TGDBResult => !!v);
    }

    async getGameOpenings({ id, console: cns }: GetOpeningParams) {
      const db = await getConsoleDump(cns);

      const game = db.find({ id }).value() as ConsoleGameData;

      const videos = await searchMusicVideo(game.official, cns);

      return videos;
    }

    async migrate(argp: string) {
      const setting = await getEmuSettings();
      const op = setting.get("pathing.dump").value();
      const np = argp;

      const oldPath = resolve(op);
      const newPath = resolve(np);
      try {
        await fs.access(oldPath);
        const exists = await fs.pathExists(newPath);
        if (exists) await fs.emptyDir(newPath);
        Globals.set(`dump-migrate-${newPath}}`, {
          current: undefined,
          currentSize: undefined,
          currentTotalSize: undefined,
          completedFiles: 0,
          totalFiles: 0,
          totalSize: 0,
          completedSize: 0,
          percent: 0,
        } as ProgressData);
        if (oldPath === newPath) return;

        await copyFiles(oldPath, newPath, {
          concurrency: 1,
          async onProgress(progress) {
            Globals.set(`dump-migrate-${newPath}`, progress as ProgressData);
            if (progress.percent === 1) {
              const settingIn = await getEmuSettings();
              settingIn.set("pathing.dump", newPath).write();
            }
          },
        });

        await fs.remove(oldPath);
      } catch (error) {
        console.error(error);
      }
    }

    async queryMigrateProgress(argp: string) {
      const newPath = resolve(argp);
      const progress = Globals.get(`dump-migrate-${newPath}`) as ProgressData;
      if (progress && progress.percent === 1) {
        Globals.remove(`dump-migrate-${newPath}`);
      }

      return (
        progress ?? {
          current: undefined,
          currentSize: undefined,
          currentTotalSize: undefined,
          completedFiles: 0,
          totalFiles: 0,
          totalSize: 0,
          completedSize: 0,
          percent: 0,
        }
      );
    }

    async getImage({ path, url }: GetImageParams) {
      // NOTE: Check if prod use electron static paths
      const pathToDump = getDumpPath();
      const file = join(pathToDump, path);
      try {
        if (url) await saveImage(file, url);
        const base64 = await fs.readFile(file, "base64");
        return `data:image/png;base64,${base64}`;
      } catch (error) {
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

      const gameFilePath = join(pathToDump, game.id);
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
      const gameFilePath = join(pathToDump, game.id);
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
        newMappings = { ...newMappings, [serial]: links[i] };
      }

      mappings.set(`${value.id}`, newMappings).write();

      return newMappings;
    }

    async downloadDisc({ console: cons, id, serial }: DownloadDiscParams) {
      const db = await getConsoleDump(cons);
      const mappings = await getDiscMappings(cons);

      const pathToDump = getDumpPath(cons);
      const game = db.find({ id }).value() as ConsoleGameData;
      const link = mappings.get(`${id}.${serial}`).value();
      if (!game || !link) return false;

      const gameFilePath = join(pathToDump, game.id, serial);
      const gameFileExists = (await readdir(gameFilePath)).some((v) => {
        const ext = extname(v);
        return (ext === ".iso" || ext === ".bin") && v.indexOf(serial) > -1;
      });

      if (gameFileExists) await fs.remove(gameFilePath);

      await fs.ensureDir(gameFilePath);
      const gameFile = join(pathToDump, game.id, `${serial}.zip`);
      const zipFileExists = await fs.pathExists(gameFile);
      if (zipFileExists) await fs.remove(gameFile);
      const downloadStream = got.stream(link.link);
      const fileWriterStream = createWriteStream(gameFile, { flags: "a" });

      const handleRemove = (reason: string, error = true) => {
        logToFile(reason);
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

    async getDownloadProgress({
      console: cons,
      id,
      serial,
    }: GetDownloadProgressParams) {
      const defaultRes = {
        percentage: 0,
        status: DownloadStatus.NotDownloading,
        transferred: 0,
        total: 0,
      };
      const progress = Globals.get(`download-${serial}-progress`) as
        | DownloadProgress
        | undefined;

      const db = await getConsoleDump(cons);
      const pathToDump = getDumpPath(cons);
      const game = db.find({ id }).value() as ConsoleGameData;

      if (!game) return defaultRes;
      const gameFilePath = join(pathToDump, game.id, serial);

      await fs.ensureDir(gameFilePath);
      const check = (await readdir(gameFilePath)).some((v) => {
        const ext = extname(v);
        return (ext === ".iso" || ext === ".bin") && v.indexOf(serial) > -1;
      });

      if (check && !progress) {
        return {
          percentage: 100,
          status: DownloadStatus.Completed,
          transferred: 0,
          total: 0,
        };
      }

      return progress ?? defaultRes;
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

      await settings.set("favorites", newFavorites).write();

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

      const pathing = db.get("pathing").value();
      const display = db.get("display").value();

      return {
        pathing,
        display,
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
    console: string;
    id: string;
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
  interface GetOpeningParams extends Base {
    id: string;
    console: string;
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

  interface SearchTGDBParams extends Base {
    keyword: string;
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

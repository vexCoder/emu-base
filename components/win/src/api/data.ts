/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/prefer-default-export */
import {
  getConsoleDump,
  getConsoleLinks,
  getDumpPath,
  saveImage,
  scoreMatchStrings,
} from "@utils/helper";
import fs from "fs-extra";
import { ObjectChain } from "lodash";
import pMap from "p-map";
import { join } from "path";
import { filter, head, is, mergeRight, toLower } from "ramda";

export namespace DataApi {
  export class Resolver {
    async getGames({ console: cns, keyword, page, limit }: GetGameParams) {
      const db = await getConsoleDump(cns);

      const filtered = db.filter(
        ({ official }: ConsoleGameData) =>
          scoreMatchStrings(official, keyword) > 0.5
      );
      const counter = page * limit;
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
        res: sorted,
        hasNext: next.length > 0,
      };
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

    async getGameFiles({ id, console: cons }: CheckGameParams) {
      const pathToDump = getDumpPath(cons);
      const db = await getConsoleDump(cons);
      const game = db.find({ id }).value() as ConsoleGameData;

      if (!game || !game.regions.length) return [];
      const gameFilePath = join(pathToDump, game.unique);
      const regionFiles = await pMap(game.regions, async (region) => {
        const gameFiles = await pMap(region.serials, async (serial) => {
          const exts = ["iso", "bin"];
          const extFiles = await pMap(exts, async (ext) => {
            const pathToFile = join(gameFilePath, `${serial}.${ext}`);
            const check = await fs.pathExists(pathToFile);
            return check ? pathToFile : undefined;
          });

          return {
            serial,
            playable: extFiles.some(is(String)),
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

      const PalRegions = [
        "Germany",
        "Sweden",
        "Finland",
        "Denmark",
        "Norway",
        "France",
        "Spain",
        "Italy",
        "Netherlands",
        "Belgium",
        "Austria",
      ];

      const NTSCURegions = [
        "USA",
        "Canada",
        "Mexico",
        "Brazil",
        "Argentina",
        "Chile",
      ];

      const NTSCJRegions = ["Japan", "Korea", "Taiwan"];

      const filtered = db.filter(({ title, tags: linkTags }: ParsedLinks) => {
        const score = scoreMatchStrings(title, keyword) > 0.5;
        const isPal =
          linkTags.some((t) =>
            PalRegions.map(toLower).includes(t.toLowerCase())
          ) && tags.map(toLower).includes("pal");

        const isNTSCU =
          linkTags.some((t) =>
            NTSCURegions.map(toLower).includes(t.toLowerCase())
          ) && tags.map(toLower).includes("ntsc-u");

        const isNTSCJ =
          linkTags.some((t) =>
            NTSCJRegions.map(toLower).includes(t.toLowerCase())
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

      const find = db.find(
        (v: ConsoleGameData) =>
          v.id === id &&
          v.regions.some((r) => r.serials.every((s) => serials.includes(s)))
      ) as ObjectChain<ConsoleGameData>;

      const value = find.value();

      const newRegions = value.regions.map((r) => {
        console.log(r);
        const check = r.serials.every((s) => serials.includes(s));

        if (check) {
          return mergeRight(r, { links });
        }

        return r;
      });

      const newValue = mergeRight(value, { regions: newRegions });

      const game = await find.assign(newValue).write();

      console.log(game);
      return game;
    }
  }

  interface GetGameParams {
    keyword: string;
    console: string;
    page: number;
    limit: number;
  }

  interface GetImageParams {
    path: string;
    url?: string;
  }

  interface CheckGameParams {
    id: string;
    console: string;
  }

  interface GetGameLinksParams {
    keyword: string;
    tags: string[];
    console: string;
  }

  interface SetGameLinksParams {
    id: string;
    serials: string[];
    links: string[];
    console: string;
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/prefer-default-export */
import { join } from "path";
import fs from "fs-extra";
import { saveImage } from "@root/helper";
import Db from "@root/api/db";

export namespace DataApi {
  export class Resolver {
    async getGames({
      keyword,
      console: cns,
      limit = 10,
      offset = 1,
    }: GetGameParams) {
      const db = new Db(cns);

      const arr = ((await db.getData("/parsed")) ?? []) as ConsoleGameData[];

      const filter = arr.filter(({ official, common }) => {
        const check = [official, common].some((v) => {
          const lc = v.toLowerCase();

          return !!lc.match(new RegExp(keyword.toLowerCase(), "g"));
        });

        return check;
      });

      return filter.slice(offset, offset + limit);
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
  }

  interface GetGameParams {
    keyword: string;
    console: string;
    limit?: number;
    offset?: number;
  }

  interface GetImageParams {
    path: string;
    url?: string;
  }
}

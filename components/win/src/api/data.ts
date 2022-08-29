/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/prefer-default-export */
import { getConsoleDump, saveImage } from "@utils/helper";
import fs from "fs-extra";
import { join } from "path";

export namespace DataApi {
  export class Resolver {
    async getGames({ console: cns }: GetGameParams) {
      const db = await getConsoleDump(cns);

      return db.value();
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
    console: string;
  }

  interface GetImageParams {
    path: string;
    url?: string;
  }
}

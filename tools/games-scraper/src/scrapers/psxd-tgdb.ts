/* eslint-disable no-promise-executor-return */
import chalk from "chalk";
import dayjs from "dayjs";
import pMap from "p-map";
import { ARCH, PSXD, TGDB } from "../parsers/index.js";
import { tgdbToConsoleData } from "../parsers/TGDB.js";
import {
  generateSerialId,
  getConsoleDump,
  getTGDBPlatform,
  searchMusicVideo,
} from "../utils.js";

interface GetLinksParams {
  console: GameConsole;
}

interface GetDescriptionsParams {
  console: GameConsole;
  listOptions?: PSXD.UlistOptions;
}

export const getLinks = async (opts: GetLinksParams) =>
  ARCH.compileLinks(opts.console.parts);

export const getDescriptions = async (opts: GetDescriptionsParams) => {
  const gc = opts.console;
  const db = getConsoleDump(gc.name);
  await db.read();
  db.data = [];

  const platformId = getTGDBPlatform(gc.name);

  if (!platformId) throw new Error(`Platform ${gc.name} not found`);

  const list = await PSXD.parseUlist(gc.mapping, opts.listOptions);

  const defaultData = {
    description: "",
    publisher: "n/a",
    developer: "n/a",
    released: dayjs().unix(),
    cover: "",
    ratings: "n/a",
    genre: [],
    opening: "",
    screenshots: [],
  };

  let counter = 0;
  await pMap(
    list,
    async (item) => {
      counter++;

      const id = generateSerialId(item.serial);

      console.log(
        `${chalk.bgCyan(
          chalk.black(`[${counter}/${list.length}]`)
        )} ${chalk.blue("Fetching:")} (${item.serial}) ${item.title}`
      );

      const tgdb = await TGDB.search({
        keyword: item.title,
        platform: platformId,
        firstOnly: true,
      });

      const region = {
        region: "NTSC-U",
        title: item.title,
        serials: item.serial,
      };

      const opening = await searchMusicVideo(item.title, gc.name);

      const data = {
        id,
        official: item.title,
        common: [item.title],
        ...defaultData,
        regions: [region],
        opening,
      };

      if (!tgdb.results.length) {
        console.error(
          chalk.red(`Failed to find game: ${item.title} (${tgdb.url})`)
        );

        db.data?.push(data);
        return;
      }

      db.data?.push({
        ...data,
        ...tgdbToConsoleData(tgdb.results[0]),
      });

      if (counter % 3 === 0) {
        await db.write();
      }
    },
    { concurrency: 5 }
  );

  await db.write();
};

export default {
  getLinks,
  getDescriptions,
};

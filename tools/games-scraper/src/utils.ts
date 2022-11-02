/* eslint-disable import/prefer-default-export */

import fs from "fs-extra";
import got from "got";
import { JSONFile, Low } from "lowdb";
import meow from "meow";
import { join } from "path";
import * as R from "ramda";
import * as R2 from "rambda";
import { Video, youtube } from "scrape-youtube";

export const fetchImage = async (url: string) => {
  const test = await got(url, {
    responseType: "buffer",
  });

  // @ts-ignore
  const image = Buffer.from(test.body).toString("base64");

  return image;
};

export const saveImage = async (
  base: string,
  id: string,
  name: string,
  url: string,
  folder?: string
) => {
  const base64 = await fetchImage(url);

  const imageBase = join(base, id, folder ?? "");
  await fs.ensureDir(imageBase);
  const path = join(imageBase, name);
  await fs.writeFile(path, base64, "base64");
};

export const getConfig = async () => {
  const config: Config = await fs.readJSON(join(process.cwd(), "config.json"));

  const consoles = Object.keys(config.consoles);

  return {
    config,
    consoles,
  };
};

export type CLIInput = "scrape" | "migrate";
export type CLISettings = ReturnType<typeof getCli>["cli"];
export const getCli = () => {
  const cli = meow(``, {
    importMeta: import.meta,
    flags: {
      platform: {
        type: "string",
        alias: "P",
      },
      linkOnly: {
        type: "boolean",
        alias: "L",
      },
    },
  });

  const command: CLIInput | undefined = cli.input?.[0] as CLIInput;

  return {
    cli,
    command,
  };
};

export const extractString = R.curry(
  (regexp: RegExp, text: string, trim?: boolean) => {
    const res = new RegExp(regexp).exec(text)?.[1];

    return trim ? res?.trim() : res;
  }
);

export const extractMatches = R.curry(
  (regexp: RegExp, text: string, trim?: boolean) => {
    const arr = text.match(new RegExp(regexp)) ?? [];
    return arr?.map((o) => (trim ? o.trim() : o));
  }
);

export const getDumpPath = (consoleName?: string) =>
  consoleName
    ? join(process.cwd(), "dump", consoleName)
    : join(process.cwd(), "dump");

export const getEmuSettings = () => {
  const pathToDump = getDumpPath();
  fs.removeSync(pathToDump);
  fs.ensureDirSync(pathToDump);
  const adapter = new JSONFile<AppSettings>(join(pathToDump, `settings.json`));
  const db = new Low(adapter);
  return db;
};

export const getConsoleDump = (consoleName: string) => {
  const pathToDump = getDumpPath(consoleName);
  console.log(pathToDump);
  fs.ensureDirSync(pathToDump);
  const adapter = new JSONFile<ConsoleGameData[]>(
    join(pathToDump, `dump.json`)
  );
  const db = new Low(adapter);
  return db;
};

export const getConsoleLinks = (consoleName: string) => {
  const pathToDump = getDumpPath(consoleName);
  fs.ensureDirSync(pathToDump);
  const adapter = new JSONFile<ConsoleLinks>(join(pathToDump, `links.json`));
  const db = new Low(adapter);
  return db;
};

export const scoreMatchStrings = (
  src: string,
  target: string
  // outliers: number = 0.25
) => {
  const keywords = R.pipe(
    R.toLower,
    R.split(" "),
    R.map(R.trim),
    R.map(R.replace(/([^a-z0-9])/g, ""))
  )(target);

  // const bestMatch = (src2: string) => R.curry(findBestMatch)(src2)(keywords);

  const split = R.pipe(
    R.split(" "),
    R.map(R.toLower),
    R.map(R.replace(/([^a-z0-9])/g, "")),
    R.map(R.trim),
    R.filter((v: string) => !!v.length)
  )(src);

  const intersected = R.intersection(split, keywords);

  // const ratings = R.pipe(
  //   R.map(bestMatch),
  //   R.map((m) => m.bestMatch.rating),
  //   (list) => R.reject((o: number) => o <= outliers, list)
  // )(intersected);

  // const averageScore = R.mean(ratings);

  return intersected.length / keywords.length;
};

export const scoreTitlesMusic = (video: Video) => {
  const cleanedString = R.pipe(
    R.toLower,
    R.replace(/([^a-z0-9 ])/g, ""),
    R.trim
  )(video.title);

  const priority: Record<string, number> = {
    "ost|prelude": 3,
    opening: 0.75,
    "intro|title": 0.5,
    "jukebox|theme|track|music": 0.5,
    "main menu": 0.25,
    "ps1|playstation": 0.25,
    hd: 0.25,
    "1|01|2|02|3|03|4|04|5|05": 0.2,
  };

  const avoid = [
    "remake",
    "longplay",
    "gameplay",
    "fmv",
    "loop",
    "full game",
    "long play",
    "game play",
    "extended",
  ];

  const score = R.keys(priority).reduce((acc, curr) => {
    const check = curr
      .split("|")
      .some((v) => cleanedString.split(" ").includes(v));
    if (check) {
      return acc + priority[curr];
    }

    return acc;
  }, 0);

  // console.log(video.title, score, matched);

  const avoided = avoid.some((a) => cleanedString.indexOf(a) > -1);

  if (avoided) {
    return 0;
  }

  return score;
};

export const sleep = async (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
// export const getRegion = (serial: string) => {
//   switch(serial.toLowerCase()) {
//     case "slus":
//   }
// }

export const searchMusicVideo = async (keyword: string, console: string) => {
  const search = `${keyword} ${console} music opening`;
  const search2 = `${keyword} ${console} ost`;
  const results = await youtube.search(search);
  const results2 = await youtube.search(search2);

  const openingVideo = R2.pipe<
    [Video[]],
    { item: Video; score: number; scoreMatch: number }[],
    { item: Video; score: number; scoreMatch: number }[],
    { item: Video; score: number; scoreMatch: number }[],
    { item: Video; score: number; scoreMatch: number }[],
    { item: Video; score: number; scoreMatch: number }
  >(
    R2.map((v) => ({
      item: v,
      score: 0,
      scoreMatch: scoreMatchStrings(v.title, keyword),
    })),
    R2.filter((v) => v.scoreMatch >= 0.35 && v.item.duration < 300),
    R2.map((v) => ({
      ...v,
      score: scoreTitlesMusic(v.item),
    })),
    R2.sort((a, b) => b.score - a.score),
    R2.head
  )(results.videos.concat(results2.videos));

  const opening: string = openingVideo
    ? (R2.path(["item", "link"])(openingVideo) as string)
    : "";

  return opening;
};

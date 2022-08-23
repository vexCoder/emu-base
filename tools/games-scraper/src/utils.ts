/* eslint-disable import/prefer-default-export */

import fs from "fs-extra";
import got from "got";
import meow from "meow";
import * as R from "ramda";
import { join } from "path";
import { JSONFile, Low } from "lowdb";

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
    const res = regexp.exec(text)?.[0];
    return trim ? res?.trim() : res;
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

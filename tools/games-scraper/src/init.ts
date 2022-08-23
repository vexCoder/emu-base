import dayjs from "dayjs";
import fs from "fs-extra";
import { customAlphabet } from "nanoid";
import pMap from "p-map";
import { join } from "path";
import * as R from "ramda";
import { getConfig, getDumpPath, getEmuSettings } from "./utils.js";

const init = async () => {
  const db = getEmuSettings();
  const { consoles } = await getConfig();
  const pathToDump = getDumpPath();

  await fs.remove(pathToDump);
  await fs.ensureDir(pathToDump);

  const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);

  await db.read();

  db.data ||= {
    consoles: [],
  };

  const settings = db.data;

  if (!settings) throw new Error("Failed to initialize emu settings");

  const ids: string[] = [];
  const consoleSettings = await pMap(consoles, async (consoleName) => {
    const pathToConsoleDump = getDumpPath(consoleName);

    const consoleData = settings.consoles.find((v) => v.key === consoleName);

    const id =
      consoleData?.id ??
      R.reduceWhile(
        (p, c) => p !== c,
        () => nanoid(4),
        nanoid(4),
        ids
      );

    ids.push(id);

    const lastUpdated =
      consoleData?.lastUpdated ?? dayjs().format("YYYY-MM-DD HH:mm:ss");

    const pathToData =
      consoleData?.pathToData ?? join(pathToConsoleDump, "dump.json");

    settings.consoles.push();

    return {
      id,
      lastUpdated,
      pathToData,
      name: consoleName,
      key: consoleName,
    };
  });

  db.data.consoles = consoleSettings.filter((v): v is ConsoleSettings => !!v);

  await db.write();
};

export default init;

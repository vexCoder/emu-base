import { customAlphabet } from "nanoid";
import pMap from "p-map";
import * as R from "ramda";
import {
  CLISettings,
  getConfig,
  getConsoleDump,
  getEmuSettings,
} from "./utils.js";

const postprocess = async (cli: CLISettings) => {
  const { consoles } = await getConfig();
  const settings = getEmuSettings();
  const platforms = cli.flags.platform?.split(",");
  if (!platforms?.length) throw new Error("No platforms specified");

  await pMap(consoles, async (consoleName) => {
    const db = getConsoleDump(consoleName);

    await settings.read();
    await db.read();

    const consoleData = settings.data?.consoles.find(
      (v) => v.key === consoleName
    );

    if (!consoleData) throw new Error("No console data");

    db.data ||= [];
    const prefix = consoleData.id;

    const ids: string[] = [];
    const newParsed = db.data ?? [];

    const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);

    const generateId = () =>
      `${prefix}-${nanoid(4)}-${nanoid(4)}-${nanoid(4)}-${nanoid(4)}`;

    for (let i = 0; i < newParsed.length; i++) {
      const newId = R.reduceWhile(
        (p, c) => p !== c,
        () => generateId(),
        generateId(),
        ids
      );

      newParsed[i].id = newId;
      ids.push(newId);

      console.log(`Updated ${newParsed[i].unique}: ${newId}`);
    }

    db.data = newParsed;

    await db.write();
  });
};

export default postprocess;

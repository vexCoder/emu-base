import dayjs from "dayjs";
import fs from "fs-extra";
import pMap from "p-map";
import { join } from "path";
import { generateId, getConfig, getDumpPath, getEmuSettings } from "./utils.js";

const init = async () => {
  const db = getEmuSettings();
  const { consoles, config } = await getConfig();
  const pathToDump = getDumpPath();

  await fs.ensureDir(pathToDump);

  await db.read();

  db.data ||= {
    consoles: [],
  };

  const settings = db.data;

  if (!settings) throw new Error("Failed to initialize emu settings");

  const ids: string[] = [];
  const consoleSettings = await pMap(consoles, async (consoleName) => {
    const pathToConsoleDump = getDumpPath(consoleName);
    await fs.ensureDir(pathToConsoleDump);

    const consoleData = settings.consoles.find((v) => v.key === consoleName);

    const id = generateId(consoleName);

    ids.push(id);

    const lastUpdated =
      consoleData?.lastUpdated ?? dayjs().format("YYYY-MM-DD HH:mm:ss");

    const pathToData =
      consoleData?.pathToData ?? join(pathToConsoleDump, "dump.json");

    settings.consoles.push();

    const consoleConfig = config.consoles[consoleName];

    return {
      id,
      lastUpdated,
      pathToData,
      name: consoleName,
      key: consoleName,
      description: consoleConfig.description,
      retroarch: {
        core: consoleConfig.core,
        fullscreen: true,
        turboRate: 2,
        input: "dinput",
        turbo: false,
        volume: 3,
        showFps: false,
        mute: false,
      },
    };
  });

  db.data.consoles = consoleSettings.filter((v): v is ConsoleSettings => !!v);

  await db.write();
};

export default init;

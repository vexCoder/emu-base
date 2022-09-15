import { getConsoleDump, getDumpPath, updateCfg } from "@utils/helper";
import execa, { ExecaChildProcess } from "execa";
import { extname, join } from "path";
import fs from "fs-extra";
import pMap from "p-map";
import { is, head, range } from "ramda";
import { sendKeyToWindow, setActiveWindow } from "@utils/ffi";
import Constants from "@utils/constants";

class Emulator {
  console: ConsoleSettings;

  settings: AppSettings;

  app: Application;

  process: ExecaChildProcess<string> | undefined;

  state_slot: number = 0;

  handle: number | any;

  constructor(settings: AppSettings, app: Application, cons: ConsoleSettings) {
    this.settings = settings;
    this.console = cons;
    this.app = app;
  }

  async saveToSlot(slot: number) {
    if (this.process && this.handle) {
      setActiveWindow(this.handle);
      const diff = Math.abs(this.state_slot - slot);
      const isDecrease = slot < this.state_slot;
      await pMap(range(0, diff), async () => {
        if (isDecrease) await sendKeyToWindow("f6");
        else await sendKeyToWindow("f7");
      });

      await sendKeyToWindow("f5");
      this.state_slot = slot;
    }
  }

  async play(id: string, serial: string) {
    const isDev = process.env.NODE_ENV === "development";
    const { pathing } = this.settings;
    const db = await getConsoleDump(this.console.key);
    const pathToDump = getDumpPath(this.console.key);

    const game = db.find({ id }).value() as ConsoleGameData;
    const gameFilePath = join(pathToDump, game.unique, serial);
    const exts = [".iso", ".bin"];
    const gameFile = await pMap(await fs.readdir(gameFilePath), async (v) => {
      const ext = extname(v);
      if (exts.includes(ext)) return join(gameFilePath, v);
      return false;
    });

    const disc = head(gameFile.filter(is(String))) as string;
    const corePath = join(
      pathing.backend,
      "cores",
      this.console.retroarch.core
    );

    const config = join(pathToDump, "config.cfg");

    await updateCfg(
      {
        ...Constants.DEFAULT_CFG,
        libretro_directory: join(pathing.backend, "cores"),
        system_directory: join(pathing.backend, "system"),
        savestate_directory: join(pathToDump, game.unique, serial, "saves"),
        input_joypad_driver: this.console.retroarch.input,
        ...(this.console.retroarch.fullscreen && {
          video_fullscreen: isDev ? "false" : "true",
          video_windowed_fullscreen: isDev ? "false" : "true",
        }),
      },
      this.console.key
    );

    if (this.app.win?.isFocused()) this.app?.win?.hide();
    this.process = execa(`retroarch`, [
      "-L",
      corePath,
      "--config",
      config,
      disc,
    ]);

    await this.app?.overlay?.attach();
    this.handle = this.app?.overlay?.parentHandle;
  }
}

export default Emulator;

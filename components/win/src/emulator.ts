/* eslint-disable @typescript-eslint/naming-convention */
import {
  getConsoleDump,
  getDumpPath,
  getEmuSettings,
  updateCfg,
} from "@utils/helper";
import execa, { ExecaChildProcess } from "execa";
import { extname, join } from "path";
import fs from "fs-extra";
import pMap from "p-map";
import { is, head, range } from "ramda";
import { getWindowRect, sendKeyToWindow } from "@utils/ffi";
import Constants from "@utils/constants";
import { Screenshot, ImageFormat } from "win-screenshot";

class Emulator {
  console: ConsoleSettings;

  settings: AppSettings;

  app: Application;

  process: ExecaChildProcess<string> | undefined;

  state_slot: number = 0;

  handle: number | any;

  turbo: boolean = false;

  turboRate: number = 2;

  showFps: boolean = false;

  game: string | undefined;

  constructor(settings: AppSettings, app: Application, cons: ConsoleSettings) {
    this.settings = settings;
    this.console = cons;
    this.app = app;
  }

  async saveToSlot(slot: number) {
    if (this.process && this.handle) {
      const diff = Math.abs(this.state_slot - slot);
      const isDecrease = slot < this.state_slot;
      await pMap(range(0, diff), async () => {
        if (isDecrease) await sendKeyToWindow("f6");
        else await sendKeyToWindow("f7");
      });

      await sendKeyToWindow("f5");
      const pos = getWindowRect(this.handle);
      console.log(pos);
      if (pos && this.game) {
        Screenshot.captureByCoordinates({
          coords: {
            x1: pos.left,
            y1: pos.top,
            x2: pos.right,
            y2: pos.bottom,
          },
          imageFormat: ImageFormat.PNG,
        }).then(async (res) => {
          const db = await getConsoleDump(this.console.key);
          const pathToDump = getDumpPath(this.console.key);
          const game = db.find({ id: this.game }).value() as ConsoleGameData;
          const pathToGame = join(pathToDump, game.unique);
          const savestate_directory = join(pathToGame, "savestate");
          await fs.writeFile(
            join(savestate_directory, `slot_${slot}.png`),
            Buffer.from(res.imageBuffer, "base64")
          );
        });
      }
      this.state_slot = slot;
    }
  }

  async loadFromSlot(slot: number) {
    if (this.process && this.handle) {
      const diff = Math.abs(this.state_slot - slot);
      const isDecrease = slot < this.state_slot;
      await pMap(range(0, diff), async () => {
        if (isDecrease) await sendKeyToWindow("f6");
        else await sendKeyToWindow("f7");
      });

      await sendKeyToWindow("f4");
      this.state_slot = slot;
    }
  }

  async toggleTurbo() {
    if (this.process && this.handle) {
      const db = await getEmuSettings();
      await sendKeyToWindow("space");
      this.turbo = !this.turbo;
      await db
        .get("consoles")
        .find((v) => v.id === this.console.id)
        .assign({ turbo: this.turbo })
        .write();

      this.app?.overlay?.sendData({
        evt: "event.toggleTurbo",
        value: this.turbo,
      });
    }
  }

  async toggleFPS() {
    if (this.process && this.handle) {
      await sendKeyToWindow("f3");
      this.showFps = !this.showFps;
      this.app?.overlay?.sendData({
        evt: "event.toggleFPS",
        value: this.showFps,
      });
    }
  }

  async quit() {
    if (this.process && this.handle) {
      await sendKeyToWindow("f12");
    }
  }

  async play(id: string, serial: string) {
    const isDev = process.env.NODE_ENV === "development";
    const { pathing } = this.settings;
    const db = await getConsoleDump(this.console.key);
    const pathToDump = getDumpPath(this.console.key);

    const game = db.find({ id }).value() as ConsoleGameData;
    this.game = game.id;
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

    const libretro_directory = join(pathing.backend, "cores");
    const system_directory = join(pathing.backend, "system");

    const pathToGame = join(pathToDump, game.unique);
    const savestate_directory = join(pathToGame, "savestate");
    const savefile_directory = join(pathToGame, "saves");
    const screenshot_directory = join(pathToGame, "screenshots");

    await fs.ensureDir(savestate_directory);
    await fs.ensureDir(savefile_directory);
    await fs.ensureDir(screenshot_directory);

    await updateCfg(
      {
        ...Constants.DEFAULT_CFG,
        libretro_directory,
        system_directory,
        savestate_directory,
        savefile_directory,
        screenshot_directory,
        input_joypad_driver: this.console.retroarch.input,
        fastforward_ratio: `${
          this.console.retroarch.turboRate ?? this.turboRate
        }.000000`,
        ...(this.console.retroarch.fullscreen && {
          video_fullscreen: isDev ? "false" : "true",
          video_windowed_fullscreen: isDev ? "false" : "true",
        }),
      },
      this.console.key
    );

    if (this.app.win?.isFocused()) this.app?.win?.hide();
    this.process = execa(join(pathing.backend, "retroarch.exe"), [
      "-L",
      corePath,
      "--config",
      config,
      disc,
    ]);

    await this.app?.overlay?.attach();
    this.handle = this.app?.overlay?.parentHandle;
    this.app?.overlay?.setOnAttach(() => {
      this.app?.overlay?.sendData({
        evt: "event.play",
        value: {
          fps: this.showFps,
          turbo: this.turbo,
        },
      });
    });
  }
}

export default Emulator;

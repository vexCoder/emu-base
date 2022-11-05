/* eslint-disable @typescript-eslint/naming-convention */
import Constants from "@utils/constants";
import { getWindowRect } from "@utils/ffi";
import {
  getConsoleDump,
  getDisplayIndex,
  getDumpPath,
  getEmuSettings,
  logToFile,
  sleep,
  updateCfg,
} from "@utils/helper";
import execa, { ExecaChildProcess } from "execa";
import fs from "fs-extra";
import dgram from "dgram";
import pMap from "p-map";
import { extname, join } from "path";
import { head, is, range } from "ramda";
import screenshot from "screenshot-desktop";
import sharp from "sharp";
import _ from "lodash";
import fastq from "fastq";
import { screen } from "electron";

class Emulator {
  console: ConsoleSettings;

  client?: dgram.Socket;

  settings: AppSettings;

  app: Application;

  process: ExecaChildProcess<string> | undefined;

  state_slot: number = 0;

  handle: number | any;

  turbo: boolean = false;

  turboRate: number = 2;

  showFps: boolean = false;

  showMenu: boolean = false;

  game: string | undefined;

  rawVolume: number = -3.6;

  volume: number = 3;

  mute: boolean = false;

  constructor(settings: AppSettings, app: Application, cons: ConsoleSettings) {
    this.settings = settings;
    this.console = cons;
    this.app = app;
  }

  async saveToSlot(slot: number) {
    if (this.process && this.handle) {
      console.log("save");
      const emu = await getEmuSettings();
      const diff = Math.abs(this.state_slot - slot);
      const isDecrease = slot < this.state_slot;
      if (slot !== this.state_slot)
        await pMap(
          range(0, diff),
          async (__, i) => {
            console.log(`Savestate Slot: ${this.state_slot + i}`);
            await sleep(150);
            if (isDecrease) await this.sendMessage("STATE_SLOT_MINUS");
            else await this.sendMessage("STATE_SLOT_PLUS");
          },
          { concurrency: 1 }
        );

      const pos = getWindowRect(this.handle);
      emu
        .set(
          `savestates.${this.game}.${slot}`,
          parseInt((Date.now() / 1000).toFixed(0), 10)
        )
        .write();

      const dp = emu.get("display").value();

      const savestates = emu?.get(`savestates.${this.game}`).value();
      this.app?.overlay?.sendData({
        evt: "event.update",
        value: {
          states: savestates,
        },
      });

      await sleep(250);
      if (pos && this.game) {
        await sleep(500);
        const dps = await screenshot.listDisplays();
        const target = dps[getDisplayIndex(dp)];
        screenshot({
          format: "png",
          ...(!!target && { screen: target.id }),
        }).then(async (buf) => {
          const db = await getConsoleDump(this.console.key);
          const pathToDump = getDumpPath(this.console.key);
          const game = db.find({ id: this.game }).value() as ConsoleGameData;
          const pathToGame = join(pathToDump, game.id);
          const savestate_directory = join(pathToGame, "savestate");

          logToFile({ savestate_directory });

          console.log({
            left: pos.left,
            top: pos.top,
            width: pos.right - pos.left - 10,
            height: pos.bottom - pos.top - 10,
          });

          return sharp(buf)
            .extract({
              left: 0,
              top: 0,
              width: pos.right - pos.left,
              height: pos.bottom - pos.top,
            })
            .toFile(join(savestate_directory, `slot_${slot}.png`))
            .catch((err) => {
              logToFile(err.message);
            });
        });
      }

      await this.sendMessage("PAUSE_TOGGLE");
      await sleep(50);
      await this.sendMessage("SAVE_STATE");
      this.state_slot = slot;
    }
  }

  async loadFromSlot(slot: number) {
    if (this.process && this.handle && this.app.overlay) {
      console.log("load");
      const diff = Math.abs(this.state_slot - slot);
      const isDecrease = slot < this.state_slot;

      if (slot !== this.state_slot)
        await pMap(
          range(0, diff),
          async () => {
            await sleep(150);
            if (isDecrease) await this.sendMessage("STATE_SLOT_MINUS");
            else await this.sendMessage("STATE_SLOT_PLUS");
          },
          { concurrency: 1 }
        );

      await sleep(250);
      await this.sendMessage("PAUSE_TOGGLE");
      await sleep(50);
      await this.sendMessage("LOAD_STATE");
      this.state_slot = slot;
    }
  }

  volumeQueue = fastq.promise<number>(async (vol: number) => {
    if (this.process && this.handle && this.app.overlay) {
      const db = await getEmuSettings();
      const newVolume = _.clamp(this.volume + vol, 0, 4);
      const isDecrease = this.volume + vol < this.volume;
      const count = Math.abs((this.volume - newVolume) * 8);
      if (this.volume !== newVolume && count > 0) {
        await pMap(
          range(0, count + 1),
          async () => {
            await sleep(50);
            if (isDecrease) await this.sendMessage("VOLUME_DOWN");
            else await this.sendMessage("VOLUME_UP");
          },
          { concurrency: 1 }
        );

        this.volume = _.clamp(this.volume + vol, 0, 4);
      }

      await db
        .get("consoles")
        .find((v) => v.id === this.console.id)
        .set("retroarch.volume", this.volume)
        .write();
    }
  }, 1);

  async setVolume(volume: number) {
    await this.volumeQueue.push(volume);
  }

  async muteGame(bool: boolean) {
    if (this.process && this.handle && this.app.overlay) {
      const db = await getEmuSettings();

      await this.sendMessage("MUTE");

      await db
        .get("consoles")
        .find((v) => v.id === this.console.id)
        .set("retroarch.mute", bool)
        .write();

      this.mute = bool;
    }
  }

  async toggleTurbo() {
    if (this.process && this.handle && this.app.overlay) {
      console.log("toggle turbo");
      const db = await getEmuSettings();
      this.turbo = !this.turbo;
      await this.sendMessage("PAUSE_TOGGLE");
      await sleep(50);
      await this.sendMessage("FAST_FORWARD");
      await sleep(50);
      await this.sendMessage("PAUSE_TOGGLE");
      await db
        .get("consoles")
        .find((v) => v.id === this.console.id)
        .set("retroarch.turbo", this.turbo)
        .write();

      this.app?.overlay?.sendData({
        evt: "event.toggleTurbo",
        value: this.turbo,
      });
    }
  }

  async toggleFPS() {
    if (this.process && this.handle) {
      const db = await getEmuSettings();
      this.showFps = !this.showFps;

      await db
        .get("consoles")
        .find((v) => v.id === this.console.id)
        .set("retroarch.showFps", this.showFps)
        .write();

      this.app?.overlay?.sendData({
        evt: "event.toggleFPS",
        value: this.showFps,
      });
    }
  }

  async quit() {
    if (this.process && this.handle) {
      console.log("quit");

      await this.sendMessage("QUIT", () => {
        setTimeout(() => {
          this.client?.close();
        }, 1500);
      });
    }
  }

  async sendMessage(
    message: NetMessage,
    callback?: (msg: NetMessage) => void,
    hideMessage?: boolean
  ) {
    const buf = Buffer.from(message);
    await new Promise<void>((resolve) => {
      this.client?.send(buf, 55355, "localhost", (err) => {
        if (err) console.log(err);
        if (!hideMessage) console.log(`Sent ${message} to emulator`);
        callback?.(message);
        resolve();
      });
    });
  }

  async init() {
    const games = await getConsoleDump(this.console.key);
    const emu = await getEmuSettings();

    const game = games.find({ id: this.game }).value() as ConsoleGameData;
    const settings = emu
      .get("consoles")
      .find({ id: this.console.id })
      .get("retroarch")
      .value();
    const savestates = emu.get(`savestates.${game.id}`).value() ?? [];

    this.turbo = !!settings.turbo;
    if (settings.turbo) {
      await this.sendMessage("FAST_FORWARD");
    }

    this.showFps = !!settings.showFps;

    const newVolume = settings.volume ?? 3;
    const isDecrease = newVolume < this.volume;
    const count = Math.abs((newVolume - this.volume) * 8);
    if (this.volume !== newVolume && count > 0) {
      await pMap(
        range(0, count + 1),
        async () => {
          await sleep(50);
          if (isDecrease) await this.sendMessage("VOLUME_DOWN");
          else await this.sendMessage("VOLUME_UP");
        },
        { concurrency: 1 }
      );

      this.volume = newVolume;
    }

    this.mute = !!settings.mute;
    if (this.mute) {
      await this.sendMessage("MUTE");
    }

    this.showFps = !!this.console.retroarch?.showFps;
    this.app?.overlay?.sendData({
      evt: "event.play",
      value: {
        fps: this.showFps,
        turbo: this.turbo,
        console: this.console.key,
        game: game.id,
        slot: this.state_slot,
        states: savestates,
        volume: this.volume,
        mute: this.mute,
      },
    });
  }

  async play(id: string, serial: string) {
    const isDev = process.env.NODE_ENV === "development";
    const { pathing } = this.settings;
    const db = await getConsoleDump(this.console.key);
    const settings = await getEmuSettings();
    const pathToDump = getDumpPath(this.console.key);

    const monitor = settings.get("display").value();
    const display = screen.getAllDisplays();
    const target = display.findIndex((v, i) =>
      monitor ? v.id === monitor : i === 0
    );
    const game = db.find({ id }).value() as ConsoleGameData;
    this.game = game.id;
    const gameFilePath = join(pathToDump, game.id, serial);
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

    const pathToGame = join(pathToDump, game.id);
    const savestate_directory = join(pathToGame, "savestate");
    const savefile_directory = join(pathToGame, "saves");
    const screenshot_directory = join(pathToGame, "screenshots");

    await fs.ensureDir(savestate_directory);
    await fs.ensureDir(savefile_directory);
    await fs.ensureDir(screenshot_directory);

    await updateCfg(
      {
        ...Constants.DEFAULT_CFG,
        network_cmd_enable: "true",
        libretro_directory,
        system_directory,
        savestate_directory,
        savefile_directory,
        screenshot_directory,
        input_joypad_driver: this.console.retroarch.input,
        fastforward_ratio: `${
          this.console.retroarch.turboRate ?? this.turboRate
        }.000000`,
        video_monitor_index: `${target !== -1 ? target : 0}`,
        video_font_enable: "false",
        ...(this.console.retroarch.fullscreen && {
          video_fullscreen: isDev ? "false" : "true",
          video_windowed_fullscreen: isDev ? "false" : "true",
        }),
      },
      this.console.key
    );

    // if (this.app.win?.isFocused()) this.app?.win?.hide();
    this.process = execa(join(pathing.backend, "retroarch.exe"), [
      "-L",
      corePath,
      "--config",
      config,
      disc,
    ]);

    this.client = dgram.createSocket("udp4");

    await this.app?.overlay?.attach();
    await this.app?.overlay?.setOnInit(async () => {
      await this.init();
    });
    this.handle = this.app?.overlay?.parent?.windowId;
  }
}

export default Emulator;

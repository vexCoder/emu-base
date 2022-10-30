import pMap from "p-map";
import fs from "fs-extra";
import {
  getDriveList,
  getEmuSettings,
  logToFile,
  moveToMonitor,
} from "@utils/helper";
import { join, resolve } from "path";
import { BrowserWindow, screen } from "electron";
import Globals from "@utils/globals";
import execa from "execa";

export namespace WinApi {
  export class Resolver {
    async getPathFilesAndFolder(
      opts?: GetPathFilesAndFolder
    ): Promise<FileItem[]> {
      const { options, path } = opts ?? {};
      if (!path) {
        const drive = await getDriveList();
        return drive
          .filter((v) => v.driveType === "3")
          .map((v) => {
            const drivePath = resolve(`${v.deviceId}//`);
            return {
              path: drivePath,
              name: v.deviceId,
              isDirectory: fs.statSync(drivePath).isDirectory(),
            };
          });
      }

      let contents = await fs.readdir(path, { withFileTypes: true });
      if (options?.folderOnly) {
        contents = contents.filter((v) => v.isDirectory());
      }

      const parsed = await pMap(contents, async (v) => ({
        path: join(path, v.name),
        name: v.name,
        isDirectory: v.isDirectory(),
      }));

      return parsed;
    }

    async getDisplay() {
      const display = screen.getAllDisplays();
      return display.map((v) => ({
        id: v.id,
        size: {
          width: v.size.width,
          height: v.size.height,
        },
        position: {
          x: v.bounds.x,
          y: v.bounds.y,
        },
      }));
    }

    async setDisplay(id: number, win: BrowserWindow) {
      const settings = await getEmuSettings();
      const display = screen.getAllDisplays();
      const target = display.findIndex((v) => v.id === id);
      if (target === -1) {
        throw new Error("Display not found");
      }

      moveToMonitor(target, win, undefined, win.isMaximized());
      await settings.set("display", id).write();
    }

    async shutdown({ timeout, abort, app }: ShutdownParams) {
      if (abort) {
        Globals.set("shutdown", {
          abort: true,
          timeout: 0,
        });

        return;
      }

      if (app) {
        Globals.set("shutdown", {
          abort: false,
          timeout: timeout / 1000,
        });

        setInterval(() => {
          const shutdown = Globals.get<ShutdownSettings>("shutdown");

          if (shutdown.abort) {
            return;
          }

          if (shutdown.timeout === 0) {
            if (app.overlay && app.overlay.win) {
              app.overlay.win?.close();
              if (!app.overlay.win.isDestroyed()) app.overlay.win?.destroy();
            }

            if (app.win) {
              app.win?.close();
            }

            execa("shutdown", ["/s", "/t", "0"]);
          } else {
            const msg = `Shutting down in ${shutdown.timeout - 1} seconds`;
            logToFile(msg);
            console.log(msg);
            Globals.set("shutdown", {
              ...shutdown,
              timeout: shutdown.timeout - 1,
            });
          }
        }, 1000);
      }
    }

    async isShutdown() {
      return Globals.get<ShutdownSettings>("shutdown");
    }
  }

  interface Base {
    app?: Application;
  }

  type GetPathFilesAndFolder = OpenPathOptions & Base;

  interface ShutdownParams extends Base {
    timeout: number;
    abort: boolean;
  }
}

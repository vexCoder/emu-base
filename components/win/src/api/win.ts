import pMap from "p-map";
import fs from "fs-extra";
import { getDriveList, getEmuSettings, moveToMonitor } from "@utils/helper";
import { join, resolve } from "path";
import { BrowserWindow, screen } from "electron";

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
  }

  interface Base {
    app?: Application;
  }

  type GetPathFilesAndFolder = OpenPathOptions & Base;
}

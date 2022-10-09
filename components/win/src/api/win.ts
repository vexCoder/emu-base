import pMap from "p-map";
import fs from "fs-extra";
import { getDriveList } from "@utils/helper";
import { join, resolve } from "path";

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
  }

  interface Base {
    app?: Application;
  }

  type GetPathFilesAndFolder = OpenPathOptions & Base;
}

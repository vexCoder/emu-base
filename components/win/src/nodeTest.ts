import { ensureDir, stat } from "fs-extra";
import pMap from "p-map";
import recursive from "recursive-readdir";
import { copyFile } from "cp-file";
import { dirname } from "path";

const main = async () => {
  const target = "W:\\Projects\\emu-base\\.artifacts\\dev\\dump";
  const files = await new Promise<string[]>((resolve) => {
    recursive(target, [], (err, res) => {
      if (err) console.error(err);
      resolve(res);
    });
  });

  const onProgress = (progress: ProgressData) => {
    console.log(progress.percent);
  };

  const totalSize = (
    await pMap(files, async (file) => {
      const { size } = await stat(file);
      return size;
    })
  ).reduce((a, b) => a + b, 0);

  const progress = {
    completedFiles: 0,
    totalFiles: files.length,
    totalSize,
    completedSize: 0,
    percent: 0,
  } as ProgressData;

  const dest = "W:\\Projects\\emu-base\\.artifacts\\dev\\dump2";
  await pMap(files, async (v) => {
    const newPath = v.replace(target, dest);
    await ensureDir(dirname(newPath));
    const currentSize = progress.completedSize;
    await copyFile(v, v.replace(target, dest), {
      overwrite: true,
      onProgress: (cpProg) => {
        progress.completedSize = currentSize + cpProg.writtenBytes;
        progress.percent = progress.completedSize / progress.totalSize;
        onProgress(progress);
        if (cpProg.percent >= 1) {
          progress.completedFiles++;
        }
      },
    });
  });
};

main();

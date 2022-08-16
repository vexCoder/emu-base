import dotenv from "dotenv";
import { join } from "path";
import fs from "fs-extra";
import electron from "./electron";
import obfuscator from "./obfuscator";
import makeEsbuild from "./utils";

dotenv.config({
  path: join(process.cwd(), ".env"),
});

const build = async () => {
  const args = process.argv.slice(1);
  const isDev = args.includes("--dev") || args.includes("-D");
  const pathToBuild = join(
    process.cwd(),
    "..",
    "..",
    ".artifacts",
    isDev ? "dev" : "build"
  );

  const plugins = [];
  if (isDev) {
    plugins.push(
      electron({
        dir: pathToBuild,
      })
    );
  }

  if (isDev) plugins.push(obfuscator());

  const xmlConfig = join(process.cwd(), "..", "..", ".config");
  await fs.copy(xmlConfig, join(pathToBuild, ".config"));

  await makeEsbuild(["src/index.ts", "preload/preload.ts"], pathToBuild, {
    watch: isDev,
    plugins,
    external: ["electron"],
    entryNames: `[name]`,
  });
};

build().catch((err) => {
  console.error(err);
  process.exit(1);
});

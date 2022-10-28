import dotenv from "dotenv";
import { join } from "path";
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
    isDev ? "dev" : "dist"
  );

  const plugins = [];
  if (isDev) {
    plugins.push(
      electron({
        dir: pathToBuild,
      })
    );
  }

  if (!isDev) plugins.push(obfuscator());

  await makeEsbuild(["src/index.ts", "preload/preload.ts"], pathToBuild, {
    watch: isDev,
    plugins,
    external: [
      "electron",
      "electron-overlay-window",
      "ffi-napi",
      "ref-napi",
      "ref-struct-napi",
      "ref-union-napi",
      "node-ovhook",
      "electron-overlay",
      "sharp",
      "screenshot-desktop",
    ],
    entryNames: `[name]`,
    define: {
      "process.env.NODE_ENV": isDev ? `"development"` : `"production"`,
    },
  });
};

build().catch((err) => {
  console.error(err);
  process.exit(1);
});

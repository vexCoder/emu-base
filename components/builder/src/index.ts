// eslint-disable-next-line import/no-extraneous-dependencies
import * as builder from "electron-builder";
import consola from "consola";
import { join } from "path";
import { copy, ensureDir, readJSON, remove, writeJSON } from "fs-extra";
import { PackageJson } from "type-fest";
import semver from "semver";
import meow from "meow";

consola.wrapConsole();

const root = join(process.cwd(), "..", "..");
const components = join(root, "components");
const tools = join(root, "tools");

const externals = [
  "electron-overlay-window",
  "ffi-napi",
  "ref-napi",
  "ref-struct-napi",
  "ref-union-napi",
  "sharp",
  "screenshot-desktop",
];

const main = async () => {
  const cli = meow({
    flags: {
      type: {
        alias: "t",
        type: "string",
        default: "debug",
      },
    },
  });

  const releaseType = cli.flags.type as "debug" | "major" | "minor" | "patch";
  const test = true;

  const iconPath = join(components, "win", "assets", "game-controller128.ico");
  const json = (await readJSON(
    join(process.cwd(), "package.json")
  )) as PackageJson;

  let { version = "0.0.0" } = json;
  if (json.version && releaseType !== "debug") {
    version = semver.inc(json.version, releaseType) || "0.0.0";
    await writeJSON(
      join(process.cwd(), "package.json"),
      {
        ...json,
        version,
      },
      { spaces: 2 }
    );
  }

  console.log(`Releasing (${releaseType}): ${version}`);

  if (test) {
    await remove(join(root, ".artifacts", "release"));
    await ensureDir(join(root, ".artifacts", "release"));
    await ensureDir(join(root, ".artifacts", "release", "dist"));
    await ensureDir(join(root, ".artifacts", "release", "view"));
    await ensureDir(join(root, ".artifacts", "build"));

    await copy(
      join(components, "win", "assets"),
      join(root, ".artifacts", "release", "assets")
    );

    await copy(
      join(components, "interface", "dist"),
      join(root, ".artifacts", "release", "view")
    );

    await copy(
      join(root, ".artifacts", "dist"),
      join(root, ".artifacts", "release", "dist")
    );

    await copy(
      join(tools, "node-ovhook"),
      join(root, ".artifacts", "release", "node_modules", "node-ovhook")
    );

    await copy(
      join(tools, "electron-overlay"),
      join(root, ".artifacts", "release", "node_modules", "electron-overlay")
    );

    await copy(
      join(tools, "games-scraper", "dump"),
      join(root, ".artifacts", "release", "dump")
    );

    await Promise.all(
      externals.map(async (v) => {
        await copy(
          join(root, "node_modules", v),
          join(root, ".artifacts", "release", "node_modules", v)
        );
      })
    );

    const prebuilts = join(root, ".artifacts", "prebuilt");

    const ovRelease = join(
      root,
      ".artifacts",
      "release",
      "node_modules",
      "node-ovhook",
      "build",
      "release"
    );

    await copy(
      join(prebuilts, "injector_helper.x64.exe"),
      join(ovRelease, "injector_helper.x64.exe")
    );
    await copy(
      join(prebuilts, "n_overlay.x64.dll"),
      join(ovRelease, "n_overlay.x64.dll")
    );

    const target = join(
      root,
      "node_modules",
      "node-ovhook",
      "build",
      "Release"
    );

    const copyPath = join(root, "scripts", "copy.js");

    const externalsWithTools = [
      ...externals,
      "node-ovhook",
      "electron-overlay",
    ];

    await writeJSON(join(root, ".artifacts", "release", "package.json"), {
      name: "emu-base",
      main: "./dist/index.js",
      version,
      dependencies: externalsWithTools.reduce(
        (acc, v) => ({
          ...acc,
          [v]: `file:./node_modules/${v}`,
        }),
        {}
      ),
      scripts: {
        postinstall: `node ${copyPath} ${prebuilts} ${target}`,
      },
    } as PackageJson);

    builder.build({
      config: {
        appId: "com.deamorta.emu.base",
        productName: "Emu Base",
        copyright: "© 2022 Deamorta",
        win: {
          asar: false,
          target: "nsis",
          icon: iconPath,
          extraFiles: [
            {
              from: join(root, ".artifacts", "release", "dump"),
              to: "defaults",
            },
          ],
        },
        nsis: {
          oneClick: false,
          perMachine: true,
          allowToChangeInstallationDirectory: true,
          installerIcon: iconPath,
          installerHeaderIcon: iconPath,
          include: join(components, "builder", "install.nsh"),
        },
        buildDependenciesFromSource: true,
        // nodeGypRebuild: true,
        buildVersion: version,

        files: [
          "dist",
          "view",
          "assets/**/*",
          "node_modules/**/*",
          "package.json",
        ],

        includeSubNodeModules: true,
        npmRebuild: false,
        directories: {
          app: join(root, ".artifacts", "release"),
          output: join(root, ".artifacts", "build"),
        },
        electronVersion: "20.3.0",
      },
    });
  }
};

main().catch(console.error);

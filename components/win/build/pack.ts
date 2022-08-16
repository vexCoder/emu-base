import { Configuration, Platform, build } from "electron-builder";

const config: Configuration = {
  appId: "com.vexCoder.vex-palette",
  productName: "Vex Palette",
  asar: true,
  // Windows Top-Level Config
  win: {
    // NOTE: Certificate for production app
    // certificateFile: "",
    // certificatePassword: "",
    target: [{ target: "nsis", arch: ["x64"] }],
    icon: "assets/icon128.ico",
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
  directories: {
    output: "package",
  },
};

const pack = async () => {
  try {
    await build({
      targets: Platform.WINDOWS.createTarget(),
      config,
    });
  } catch (error) {
    console.error(error);
  }
};

pack().then(() => {
  console.log("Build complete");
});

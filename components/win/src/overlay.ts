import { createWindow, getExeList, retry } from "@utils/helper";
import { sendKeyToWindow, setActiveWindow } from "@utils/ffi";
import { BrowserWindow } from "electron";
import { overlayWindow as OW } from "electron-overlay-window";

class OverlayWindow {
  win: BrowserWindow | undefined;

  attached = false;

  focused = false;

  parentName: string | undefined;

  constructor(icon: string) {
    const isDev = process.env.NODE_ENV === "development";
    const path = isDev
      ? "http://localhost:3001/overlay/"
      : `file://${__dirname}/index.html`;

    this.win = createWindow({
      urlOrPath: path,
      browserOptions: {
        ...OW.WINDOW_OPTS,
        alwaysOnTop: true,
        icon,
        webPreferences: {
          nodeIntegration: true,
          devTools: false,
        },
      },
    });
  }

  events() {
    OW.on("attach", () => {
      console.log("attached");
      if (this.win) {
        this.attached = true;
        OW.activateOverlay();
      }
    });

    OW.on("blur", () => {
      this.focused = false;
    });

    OW.on("focus", () => {
      this.focused = true;
      console.log("focused");
      setTimeout(() => {
        sendKeyToWindow("enter");
      }, 1000);
    });
  }

  async queryRetroarch() {
    const exe = await retry(
      async () => {
        const list = await getExeList();

        const find = list.find(
          (e) => e.title?.toLowerCase().indexOf("retroarch ") !== -1
        );

        if (!find) throw new Error("Retroarch not found");

        this.parentName = find.title;

        return find;
      },
      5,
      5000
    );

    return exe;
  }

  async attach() {
    // const exe = { title: "Untitled - Notepad" };
    const exe = await this.queryRetroarch();
    if (!exe || !this.win) throw new Error("Retroarch not found");

    this.win.webContents.openDevTools({ mode: "detach", activate: false });
    this.win.setIgnoreMouseEvents(true);

    OW.attachTo(this.win, exe.title);

    this.events();
    this.win.show();
    if (this.parentName) {
      setActiveWindow(this.parentName);
    }
  }

  destroy() {
    if (this.win) {
      this.win.destroy();
      this.win.close();
      this.win = undefined;
    }
    this.attached = false;
  }
}

export default OverlayWindow;

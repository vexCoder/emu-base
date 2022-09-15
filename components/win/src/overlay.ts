import {
  getWindowRect,
  getWindowText,
  listWindows,
  setActiveWindow,
  ShowWindowFlags,
} from "@utils/ffi";
import { createWindow, extractMatches, retry } from "@utils/helper";
import { BrowserWindow, screen } from "electron";
import IOverlay from "electron-overlay";
import OVHook from "node-ovhook";
import { join } from "path";

interface OverlayOptions {
  onDetach: () => void;
}
class OverlayWindow {
  win: BrowserWindow | undefined;

  attached = false;

  focused = false;

  parentName: string | undefined;

  parentHandle: number | any;

  started: boolean = false;

  onDetach?: () => void;

  constructor(icon: string, options?: OverlayOptions) {
    const isDev = process.env.NODE_ENV === "development";
    const path = isDev
      ? "http://localhost:3001/overlay/"
      : `file://${__dirname}/index.html`;

    this.onDetach = options?.onDetach;

    this.win = createWindow({
      urlOrPath: path,
      browserOptions: {
        fullscreenable: true,
        skipTaskbar: true,
        frame: false,
        show: false,
        alwaysOnTop: true,
        icon,
        transparent: true,
        resizable: true,
        webPreferences: {
          preload: join(__dirname, "preload.js"),
          nodeIntegration: true,
          devTools: false,
          webSecurity: false,
        },
      },
    });

    console.log(join(__dirname, "preload.js"));

    IOverlay.start();
    this.events();
  }

  events() {
    IOverlay.setEventCallback((evt, args: any) => {
      if (this.win) {
        console.log(evt, args);
        if (evt === "game.input") {
          const inputEvent = IOverlay.translateInputEvent(args);
          this.win.webContents.sendInputEvent(inputEvent);
        } else if (evt === "graphics.window.event.focus") {
          if (this.started) {
            if (!args.focused) {
              this.win?.hide();
            }

            if (args.focused) {
              this.win?.show();
              setActiveWindow(this.parentHandle, ShowWindowFlags.SW_SHOW);
            }
          }
        } else if (evt === "graphics.fps") {
          this.win?.webContents.send("fps", args.fps);

          if (!this.started) {
            this.started = true;
            this.win?.show();
            setActiveWindow(this.parentHandle, ShowWindowFlags.SW_SHOW);
          }
        } else if (
          evt === "graphics.window.event.resize" ||
          evt === "graphics.window"
        ) {
          this.win?.setSize(args.width, args.height);
        }

        const position = getWindowRect(this.parentHandle);
        if (position) {
          const offsetY = this.win.isMaximized() ? 0 : 50;
          const offsetX = this.win.isMaximized() ? 0 : 8;
          this.win?.setPosition(
            position.left + offsetX,
            position.top + offsetY
          );
        }
      }
    });
  }

  poll = () => {
    if (this.parentHandle) {
      const title = getWindowText(this.parentHandle);

      if (this.win && !this.attached && title) {
        const display = screen.getDisplayNearestPoint(
          screen.getCursorScreenPoint()
        );

        IOverlay.addWindow(this.win.id, {
          name: "overlay",
          transparent: true,
          resizable: true,
          nativeHandle: this.win.getNativeWindowHandle().readUInt32LE(0),
          rect: this.win.getBounds(),
          maxWidth: display.bounds.width,
          maxHeight: display.bounds.height,
          minWidth: 100,
          minHeight: 100,
        });

        const parent = OVHook.getTopWindows().find(
          (v) => v.windowId === this.parentHandle
        );

        if (parent) OVHook.injectProcess(parent);

        this.attached = true;
        return;
      }

      setTimeout(this.poll, 1000);
    }
  };

  async queryRetroarch() {
    const exe = await retry(
      async () => {
        const list = listWindows();

        const find = list.find(
          (e) => extractMatches(/retroarch .* .*/gi, e.title, false).length >= 1
        );

        console.log(find);

        if (!find) throw new Error("Retroarch not found");

        return find;
      },
      100,
      1000
    );

    this.parentHandle = exe.handle;
    return exe;
  }

  async attach() {
    // const exe = { title: "Untitled - Notepad" };
    const exe = await this.queryRetroarch();
    if (!exe || !this.win) throw new Error("Retroarch not found");

    this.win.setIgnoreMouseEvents(true);

    this.poll();

    return this.parentName;
  }

  cleanUp() {
    this.win?.hide();
    if (this.win) IOverlay.closeWindow(this.win.id);
    this.attached = false;
    this.started = false;
  }
}

export default OverlayWindow;
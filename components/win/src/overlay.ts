import {
  getWindowRect,
  getWindowText,
  setActiveWindow,
  setWindowRect,
  ShowWindowFlags,
} from "@utils/ffi";
import {
  createWindow,
  extractString,
  getExeList2,
  logToFile,
  retry,
} from "@utils/helper";
import { BrowserWindow, screen } from "electron";
import IOverlay from "electron-overlay";
import OVHook from "node-ovhook";
import { join } from "path";

interface OverlayOptions {
  monitor?: Electron.Display;
  onDetach?: () => void;
  onAttach?: () => void;
  onInit?: () => void;
}
class OverlayWindow {
  win: BrowserWindow | undefined;

  url: string = "";

  attached = false;

  focused = false;

  parentName: string | undefined;

  parentHandle: number | any;

  started: boolean = false;

  app: Application;

  displayBound: Electron.Rectangle = {
    height: 0,
    width: 0,
    x: 0,
    y: 0,
  };

  onDetach?: () => void;

  onAttach?: () => void;

  onInit?: () => void;

  constructor(app: Application, options?: OverlayOptions) {
    const isDev = process.env.NODE_ENV === "development";
    this.app = app;

    this.onDetach = options?.onDetach;
    this.onAttach = options?.onAttach;
    this.onInit = options?.onInit;
    this.displayBound = {
      height: isDev ? 600 : options?.monitor?.size.height || 0,
      width: isDev ? 800 : options?.monitor?.size.width || 0,
      x: options?.monitor?.bounds.x || 0,
      y: options?.monitor?.bounds.y || 0,
    };
  }

  createWindow(icon: string) {
    const isDev = process.env.NODE_ENV === "development";
    const path = isDev
      ? "http://localhost:3001/overlay/"
      : join(__dirname, "..", "view", "overlay.html");

    this.url = path;
    this.win = createWindow({
      urlOrPath: path,
      browserOptions: {
        fullscreenable: true,
        skipTaskbar: true,
        frame: false,
        show: true,
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

    console.log({ url: this.win.webContents.getURL() });
  }

  setOnInit(onInit: () => void) {
    this.onInit = onInit;
  }

  setOnAttach(onAttach: () => void) {
    this.onAttach = onAttach;
  }

  sendData(value: Record<string, any> & { evt: string }) {
    this.win?.webContents.send("emulator:onData", value);
  }

  async intercept(bool: boolean) {
    IOverlay.sendCommand({
      command: "input.intercept",
      intercept: !bool,
    });
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
            if (args.focused) {
              setActiveWindow(this.parentHandle, ShowWindowFlags.SW_SHOW);
              this.win.show();
            } else {
              this.win.hide();
            }
          }
        } else if (evt === "graphics.fps") {
          this.win?.webContents.send("emulator:onFPS", {
            fps: args.fps,
            refreshRate: screen.getDisplayNearestPoint(
              screen.getCursorScreenPoint()
            ).displayFrequency,
          });

          if (!this.started) {
            this.started = true;
            setActiveWindow(this.parentHandle, ShowWindowFlags.SW_SHOW);
            this.onInit?.();
          }
        } else if (
          evt === "graphics.window.event.resize" ||
          evt === "graphics.window"
        ) {
          if (evt === "graphics.window")
            setActiveWindow(this.parentHandle, ShowWindowFlags.SW_SHOW);
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

      setTimeout(() => {
        if (this.win && this.parentHandle) {
          const list = OVHook.getTopWindows();
          const parent = list.find(
            (v) =>
              v.windowId === this.parentHandle &&
              !!extractString(/(retroarch\s[^\s]+\s[^\s]+)/gi, v.title, true)
          );

          if (!parent) {
            this.closeWindow();
            this.cleanUp();
            this.onDetach?.();
          }
        }
      }, 1500);
    });
  }

  poll = () => {
    if (this.parentHandle) {
      const title = getWindowText(this.parentHandle);

      if (this.win && !this.attached && title && this.displayBound) {
        IOverlay.start();

        const isUrl = this.url.startsWith("http");
        if (isUrl) this.win.loadURL(this.url);
        if (!isUrl) this.win.loadFile(this.url);

        IOverlay.addWindow(this.win.id, {
          name: "overlay",
          transparent: true,
          resizable: true,
          nativeHandle: this.win.getNativeWindowHandle().readUInt32LE(0),
          rect: this.displayBound,
          maxWidth: this.displayBound.width,
          maxHeight: this.displayBound.height,
          minWidth: 100,
          minHeight: 100,
        });

        const parent = OVHook.getTopWindows().find(
          (v) => v.windowId === this.parentHandle
        );

        if (parent) {
          setWindowRect(this.parentHandle, {
            left: this.displayBound.x,
            top: this.displayBound.y,
            width: this.displayBound.width,
            height: this.displayBound.height,
          });

          OVHook.injectProcess(parent);

          this.events();
        }

        this.attached = true;
        return;
      }

      setTimeout(this.poll, 1000);
    }
  };

  async closeWindow() {
    if (this.win) {
      IOverlay.closeWindow(this.win?.id);
      IOverlay.stop();
      this.win?.close();
      this.win?.destroy();
      this.win = undefined;
    }
  }

  async queryRetroarch() {
    const exe = await retry(
      async () => {
        const list = OVHook.getTopWindows();
        const testList = await getExeList2(["retroarch"]);

        const filtered2 = testList.filter(
          (e) => e.name.toLowerCase().indexOf("retroarch") !== -1
        );
        const pids = filtered2.map((o) => o.pid);
        const find2 = list.find(
          (v) =>
            pids.includes(v.processId) &&
            !!extractString(/(retroarch\s[^\s]+\s[^\s]+)/gi, v.title, true)
        );

        logToFile([...filtered2.map((v) => v.name), pids, find2]);
        if (!find2) throw new Error("Retroarch not found");

        console.log(
          list.map((v) => `${v.title} ${v.processId} ${v.windowId}`),
          testList.map((v) => `${v.name} ${v.handle}`),
          find2.windowId
        );
        return find2;
      },
      100,
      1000
    );

    this.parentHandle = exe.windowId;
    return exe;
  }

  async attach() {
    const exe = await this.queryRetroarch();
    if (!exe) throw new Error("Retroarch not found");

    setActiveWindow(this.parentHandle, ShowWindowFlags.SW_SHOW);

    this.createWindow(this.app.icon);
    this.win?.setIgnoreMouseEvents(true);

    this.poll();

    return this.parentName;
  }

  cleanUp() {
    console.log("clean up");
    this.attached = false;
    this.started = false;
  }
}

export default OverlayWindow;

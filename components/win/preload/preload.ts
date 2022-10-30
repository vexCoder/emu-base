import { bind } from "./make";

bind("win", (h, invoker) => {
  h("minimize", invoker);
  h("maximize", invoker);
  h("shutdown", invoker);
  h("isShuttingDown", invoker);
  h("openPath", invoker);
  h("isDirectory", invoker);
  h("isFile", invoker);
  h("getDisplays", invoker);
  h("setDisplay", invoker);
});

bind("path", (h, invoker) => {
  h("join", invoker);
  h("resolve", invoker);
  h("basename", invoker);
  h("dirname", invoker);
});

bind("data", (h, invoker) => {
  h("getGames", invoker);
  h("getRecentSearches", invoker);
  h("getGame", invoker);
  h("setGame", invoker);
  h("getImage", invoker);
  h("getGameFiles", invoker);
  h("getGameRegionSettings", invoker);
  h("getGameLinks", invoker);
  h("setGameLinks", invoker);
  h("downloadDisc", invoker);
  h("getDownloadProgress", invoker);
  h("play", invoker);
  h("setConsoleSettings", invoker);
  h("getConsole", invoker);
  h("getConsoles", invoker);
  h("getConsoleByKey", invoker);
  h("countConsoleGames", invoker);
  h("getGlobalSettings", invoker);
  h("setGlobalSettings", invoker);
  h("toggleFavorite", invoker);
});

bind("emulator", (h, invoker, listener) => {
  h("onFPS", listener);
  h("onDetach", listener);
  h("onData", listener);
  h("toggleTurbo", invoker);
  h("quit", invoker);
  h("saveToSlot", invoker);
  h("loadFromSlot", invoker);
  h("init", invoker);
  h("volume", invoker);
  h("mute", invoker);
  h("toggleFPS", invoker);
  h("intercept", invoker);
});

// bind("data", (h, invoker, listener) => {
//   h(
//     "getGames",
//     (keyword: string, console: string, page?: number, limit?: number) =>
//       ipcRenderer.invoke(`data:getGames`, keyword, console, page, limit)
//   );

//   h("getImage", (path: string, url?: string) =>
//     ipcRenderer.invoke(`data:getImage`, path, url)
//   );

//   h("getGameFiles", (id: string, console: string) =>
//     ipcRenderer.invoke(`data:getGameFiles`, id, console)
//   );

//   h("getGameRegionSettings", (id: string, console: string) =>
//     ipcRenderer.invoke(`data:getGameRegionSettings`, id, console)
//   );

//   h("getGameLinks", (keywords: string, tags: string[], console: string) =>
//     ipcRenderer.invoke(`data:getGameLinks`, keywords, tags, console)
//   );

//   h(
//     "setGameLinks",
//     (id: string, serials: string[], links: ParsedLinks[], console: string) =>
//       ipcRenderer.invoke(`data:setGameLinks`, id, serials, links, console)
//   );

//   h("downloadDisc", (serial: string, id: string, cons: string) =>
//     ipcRenderer.invoke(`data:downloadDisc`, serial, id, cons)
//   );

//   h("getDownloadProgress", (serial: string) =>
//     ipcRenderer.invoke(`data:getDownloadProgress`, serial)
//   );

//   h("play", (serial: string, id: string, console: string) =>
//     ipcRenderer.invoke(`data:play`, serial, id, console)
//   );

//   // h("onDetach", (callback: (data: any) => void) =>
//   //   ir("eject-game", (_evt, data) => callback(data))
//   // );

//   h("onFPS", (callback: (data: any) => void) =>
//     ipcRenderer.on("fps", (_evt, data) => {
//       callback(data);
//     })
//   );
// });

import { Connection } from "./preload-utils";

export interface Handles {
  debug: {
    log: Connection<[message: any]>;
  };

  win: {
    minimize: Connection;
    maximize: Connection;
    shutdown: Connection<[timeout?: number, abort?: boolean]>;
    isShuttingDown: Connection<[], ShutdownSettings>;
    openPath: Connection<[options?: OpenPathOptions], FileItem[]>;
    isDirectory: Connection<[path?: string], Promise<boolean>>;
    isFile: Connection<[path?: string], Promise<boolean>>;
    getDisplays: Connection<[], Promise<Display[]>>;
    setDisplay: Connection<[id: number]>;
  };

  path: {
    join: Connection<[...args: string[]], string>;
    resolve: Connection<[...args: string[]], string>;
    basename: Connection<[p: string], string>;
    dirname: Connection<[p: string], string>;
  };

  data: {
    // Paginate
    getGames: Connection<
      [keyword: string, console: string, limit: number, page: number],
      { res: ConsoleGameData[]; hasNext: boolean }
    >;
    getRecentSearches: Connection<[], string[]>;

    getGame: Connection<[id: string, console: string], ConsoleGameData>;
    setGame: Connection<
      [id: string, console: string, data: Partial<ConsoleGameData>],
      ConsoleGameData
    >;

    getImage: Connection<
      [console: string, url?: string],
      Promise<string | undefined>
    >;

    migrate: Connection<[new: string]>;
    queryMigrateProgress: Connection<[new: string], ProgressData>;

    setConsoleSettings: Connection<
      [console: string, settings: Partial<EditableConsoleSettings>],
      void
    >;

    setGlobalSettings: Connection<
      [pathing?: Partial<EmuPathing>],
      Pick<AppSettings, "pathing">
    >;
    getGlobalSettings: Connection<[], Pick<AppSettings, "pathing" | "display">>;
    getConsole: Connection<[id: string], ConsoleSettings>;
    getConsoleByKey: Connection<[key: string], ConsoleSettings>;

    getConsoles: Connection<[], string[]>;

    getGameFiles: Connection<
      [id: string, console: string],
      Promise<GameRegionFiles | undefined>
    >;

    searchTGDB: Connection<[keyword: string, console: string], TGDBResult[]>;

    getGameRegionSettings: Connection<
      [id: string, console: string],
      GameRegionFiles[]
    >;

    getGameLinks: Connection<
      [keywords: string, tags: string[], console: string],
      ConsoleLinks
    >;

    setGameLinks: Connection<
      [id: string, serials: string[], links: ParsedLinks[], console: string],
      { [key: string]: string }
    >;

    downloadDisc: Connection<
      [serial: string, id: string, cons: string],
      Promise<boolean>
    >;

    getDownloadProgress: Connection<
      [serial: string, console: string, id: string],
      Promise<DownloadProgress | undefined>
    >;

    play: Connection<
      [serial: string, id: string, console: string],
      Promise<boolean>
    >;

    countConsoleGames: Connection<[console: string], number>;

    toggleFavorite: Connection<
      [id: string, console: string, bool?: boolean],
      Promise<boolean>
    >;

    getOpenings: Connection<[id: string, console: string], Video[]>;

    setOpening: Connection<[url: string]>;
  };

  emulator: {
    onFPS: Connection<
      [callback: (data?: { fps: number; refreshRate: number }) => void]
    >;

    onDetach: Connection<[callback: (data?: any) => void]>;

    onData: Connection<
      [callback: (data?: Record<string, any> & { evt: string }) => void]
    >;

    saveToSlot: Connection<[slot: number]>;
    loadFromSlot: Connection<[slot: number]>;
    quit: Connection;
    toggleTurbo: Connection;
    toggleFPS: Connection;
    togglePause: Connection;
    init: Connection;
    volume: Connection<[offset: number]>;
    mute: Connection<[mute: boolean]>;
    intercept: Connection<[payload: boolean]>;
  };
}

import { Connection } from "./preload-utils";

export interface Handles {
  win: {
    minimize: Connection;
    maximize: Connection;
  };

  data: {
    // Paginate
    getGames: Connection<
      [keyword: string, console: string, limit: number, page: number],
      Promise<{ res: ConsoleGameData[]; hasNext: boolean }>
    >;

    getGame: Connection<[unique: number], Promise<ConsoleGameData>>;

    getImage: Connection<
      [path: string, url?: string],
      Promise<string | undefined>
    >;

    getGameFiles: Connection<
      [id: string, console: string],
      Promise<GameRegionFiles | undefined>
    >;

    getGameRegionSettings: Connection<
      [id: string, console: string],
      Promise<GameRegionFiles[]>
    >;

    getGameLinks: Connection<
      [keywords: string, tags: string[], console: string],
      Promise<ConsoleLinks>
    >;

    setGameLinks: Connection<
      [id: string, serials: string[], links: ParsedLinks[], console: string],
      Promise<{ [key: string]: string }>
    >;

    downloadDisc: Connection<
      [serial: string, id: string, cons: string],
      Promise<boolean>
    >;

    getDownloadProgress: Connection<
      [serial: string],
      Promise<DownloadProgress | undefined>
    >;

    play: Connection<
      [serial: string, id: string, console: string],
      Promise<boolean>
    >;
  };

  emulator: {
    onFPS: Connection<
      [callback: (data?: { fps: number; refreshRate: number }) => void]
    >;

    onDetach: Connection<[callback: (data?: any) => void]>;

    onKey: Connection<
      [callback: (data?: { key: string; payload: any }) => void]
    >;

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
  };
}

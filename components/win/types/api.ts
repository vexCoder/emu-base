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
      Promise<GameRegionFiles[]>
    >;

    getGameLinks: Connection<
      [keywords: string, tags: string[], console: string],
      Promise<ConsoleLinks>
    >;

    setGameLinks: Connection<
      [id: string, serials: string[], links: string[], console: string],
      Promise<ConsoleGameData>
    >;
  };
}

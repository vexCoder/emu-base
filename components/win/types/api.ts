import { Connection } from "./preload-utils";

export interface Handles {
  win: {
    minimize: Connection;
    maximize: Connection;
  };

  data: {
    // Paginate
    getGames: Connection<
      [keyword: string, console: string, limit?: number, offset?: number],
      Promise<ConsoleGameData[]>
    >;

    getGame: Connection<[unique: number], Promise<ConsoleGameData>>;

    getImage: Connection<
      [path: string, url?: string],
      Promise<string | undefined>
    >;
  };
}

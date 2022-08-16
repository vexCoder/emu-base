import { Connection } from "./preload-utils";

export interface Handles {
  win: {
    minimize: Connection;
    maximize: Connection;
  };

  core: {
    progression: Connection<
      any[],
      Promise<XMLConfig.Progression["progression"]>
    >;
  };
}

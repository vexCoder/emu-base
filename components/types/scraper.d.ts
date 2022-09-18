interface Config {
  consoles: {
    ps1: GameConsole;
    [key: string]: GameConsole;
  };
}

interface GameConsole {
  name: string;
  gameDb: string;
  parts: string[];
}

interface ResultLinks {
  title: string;
  link: string;
  lastModified: string;
  size: string;
}

interface DescriptionLinks {
  list: {
    title: string;
    link: string;
    games: {
      titles: string[];
    };
  }[];
}

interface ResultDescriptions {
  J: DescriptionLinks;
  P: DescriptionLinks;
  U: DescriptionLinks;
  [key: string]: DescriptionLinks;
}

interface ParsedLinks {
  id: string;
  baseUrl: string;
  title: string;
  link: string;
  tags: string[];
  size: number;
  fileName: string;
}

interface Scraper {
  getLinks: (parts: string[]) => Promise<ConsoleLinks>;
  getDescriptions: (db: GameConsole) => Promise<ConsoleGameData[]>;
}

interface BasicDescription {
  cover: string;
  official: string;
  common: string[];
  serial: string[];
  region: string;
  genre: string[];
  developer: string;
  publisher: string;
  released: number;
  ratings: string;
  unique: string;
}

type BasicDescriptionRaw = {
  [K in keyof BasicDescription]: string;
};

interface DescriptionRaw {
  basic: BasicDescriptionRaw;
}

interface GameRegion {
  title: string;
  serials: string[];
  links?: string[];
  region: string;
}

interface ConsoleGameData {
  id: string;
  // Description
  official: string;
  common: string[];
  genre: string[];
  developer: string;
  publisher: string;
  released: number;
  unique: string;
  regions: GameRegion[];
  description: string;

  // Images
  ratings: string;
  screenshots: string[];
  cover: string;

  // Music
  opening: string;

  // Parsed Links
  links: string[];
}

interface ConsoleSettings {
  id: string;
  name: string;
  key: string;
  description?: string;
  pathToData: string;
  lastUpdated: string;
  retroarch: {
    core: string;
    fullscreen: boolean;
    input: 'dinput' | 'xinput' | 'hdl2' | 'sdl2' | string;
    turboRate: number,
  };
}

type ConsoleLinks = ParsedLinks[];

interface EmuPathing {
  backend: string;
  dump: string;
}

interface AppSettings {
  pathing: EmuPathing;
  consoles: ConsoleSettings[];
  showFps: boolean;
}

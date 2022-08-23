interface Config {
  consoles: {
    ps1: GameConsole;
    [key: string]: GameConsole;
  };
}

interface GameConsole {
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
    }
  }[]
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
  getLinks: (parts: string[]) => Promise<ParsedLinks[]>;
  getDescriptions: (db: string) => Promise<Description[]>;
}

interface BasicDescription {
  id: string;
  cover: string;
  official: string;
  common: string;
  serial: string[];
  region: string;
  genre: string[];
  developer: string;
  publisher: string;
  released: number;
  ratings: string;
  unique: string;
}

interface Description extends BasicDescription {
  screenshots: string[];
}

type BasicDescriptionRaw = {
  [K in keyof BasicDescription]: string;
}

interface DescriptionRaw {
  basic: BasicDescriptionRaw;
}

interface ConsoleGameData {
  id: string;
  // Description
  official: string;
  common: string;
  serial: string[];
  region: string;
  genre: string[];
  developer: string;
  publisher: string;
  released: number;
  unique: string;
  
  // Images
  ratings: string;
  screenshots: string[];
  cover: string;

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
}

type ConsoleLinks = ParsedLinks[]

interface AppSettings {
  consoles: ConsoleSettings[]
}
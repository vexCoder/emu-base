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
  core: string;
  description: string;
  mapping: string;
  scraper: 'psxd-tgdb'
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
  regions: GameRegion[];
  description: string;
  isFavorite?: boolean;

  // Images
  ratings: string;
  screenshots: string[];
  cover: string;

  // Music
  opening?: string;
}

interface ConsoleSettings {
  id: string;
  name: string;
  key: string;
  description?: string;
  pathToData: string;
  lastUpdated: string;
  retroarch: {
    basePath: string;
    core: string;
    fullscreen: boolean;
    input: 'dinput' | 'xinput' | 'hdl2' | 'sdl2' | string;
    turboRate: number,
    showFps?: boolean;
    volume?: number;
    mute?: boolean;
    turbo?: boolean;
  };
}

interface EditableConsoleSettings {
  turboRate?: number;
  volume?: number;
  showFps?: boolean;
  fullscreen?: boolean;
  mute?: boolean;
  display?: number;
}

type ConsoleLinks = ParsedLinks[];

interface EmuPathing {
  backend: string;
  dump: string;
}

interface Display {
  id: number;
  size: {
    width: number;
    height: number;
  },
  position: {
    x: number;
    y: number;
  }
}

interface AppSettings {
  pathing: EmuPathing;
  consoles: ConsoleSettings[];
  savestates: Record<string, number[]>;
  favorites?: string[];
  recentSearch?: string[];
  display?: number;
}

interface Result {
  id: string;
  title: string;
  link: string;
  thumbnail: string;
  channel: Channel;
}
interface Video extends Result {
  views: number;
  uploaded: string;
  duration: number;
  description: string;
}

type TGDBResult = Pick<
ConsoleGameData,
| "description"
| "publisher"
| "developer"
| "released"
| "cover"
| "ratings"
| "genre"
| "screenshots"
> & { id: string; name: string }

type ProgressData = {
  current?: string;
  currentSize?: number;
  currentTotalSize?: number;
  completedFiles:number;
  totalFiles: number;
  totalSize: number;
  percent: number;
  completedSize: number;
}
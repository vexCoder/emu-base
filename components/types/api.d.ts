interface GameRegionFiles {
    title: string;
    region: string;
    gameFiles: {
        serial: string;
        playable: boolean;
        link: ParsedLinks;
        path: string | undefined;
    }[];
}

interface GameDiscMappings {
    [key: string]: ParsedLinks;
}

interface DownloadProgress {
    percentage: number;
    total: number;
    transferred: number;
    status: string;
}
interface GameRegionFiles {
    title: string;
    region: string;
    gameFiles: {
        serial: string;
        playable: boolean;
        path: string | undefined;
    }[];
}
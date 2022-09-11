import ConsoleIcon from "@elements/ConsoleIcon";
import {
  ArchiveBoxIcon,
  ArchiveBoxArrowDownIcon,
  ArchiveBoxXMarkIcon,
  ArrowDownTrayIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import useDownloadDisc from "@hooks/useDownloadDisc";
import useGetDownloadProgress from "@hooks/useGetDownloadProgress";
import usePlay from "@hooks/usePlay";
import { useInterval, useMemoizedFn, useToggle } from "ahooks";
import { useEffect, useState } from "react";
// eslint-disable-next-line import/no-extraneous-dependencies
import { DownloadStatus } from "types/enums";

type GameDiscListProps = BaseProps & {
  game: ConsoleGameData;
  settings: GameRegionFiles;
  console: string;
  onPlay: (serial: string) => void;
  onDownload: (serial: string) => void;
};

const GameDiscList = ({
  game,
  settings,
  console: cons,
  onPlay,
  onDownload,
}: GameDiscListProps) => {
  const [, download] = useDownloadDisc();
  const [, play] = usePlay();

  const handleDownload = (serial: string) => {
    download(serial, game.id, cons);
  };

  const handlePlay = (serial: string) => {
    play(serial, game.id, cons);
    onPlay(serial);
  };

  // const downloadAll = () => {
  //   settings.gameFiles.forEach((v) => {
  //     if (v.link) download(v.serial, game.id, cons);
  //   });
  // };

  return (
    <div className="v-stack gap-4">
      <div className="h-stack items-center gap-3">
        <ConsoleIcon console={cons} size="2em" />
        <h6 className="font-bold text-text leading-[1em]">
          {game.official} Files
        </h6>
      </div>

      <div className="v-stack gap-2">
        {settings.gameFiles.map((setting) => (
          <Disc
            key={setting.serial}
            setting={setting}
            onDownload={onDownload}
            handleDownload={handleDownload}
            handlePlay={handlePlay}
          />
        ))}
      </div>
    </div>
  );
};

interface DiscProps {
  setting: GameRegionFiles["gameFiles"][number];
  handleDownload: (serial: string) => void;
  handlePlay: (serial: string) => void;
  onDownload: (serial: string) => void;
}

const Disc = ({
  setting,
  handleDownload,
  handlePlay: _handlePlay,
  onDownload,
}: DiscProps) => {
  const [downloading, actions] = useToggle(false);
  const [progress, setProgress] = useState(0);

  const handleDownloading = useMemoizedFn((p: number, bool?: boolean) => {
    setProgress(p);

    if (progress >= 1) {
      actions.set(!!bool);
      if (!bool) {
        onDownload(setting.serial);
      }
    }
  });

  const handlePlay = () => {
    _handlePlay(setting.serial);
  };

  return (
    <div className="h-stack gap-3 items-center border border-secondary/50 rounded-xl py-2 pl-4 pr-4">
      <div>
        {!setting.playable && !downloading && (
          <ArchiveBoxXMarkIcon
            className="text-highlight"
            width="1.5em"
            height="1.5em"
          />
        )}
        {!setting.playable && downloading && (
          <ArchiveBoxArrowDownIcon
            className="text-focus"
            width="1.5em"
            height="1.5em"
          />
        )}
        {setting.playable && (
          <ArchiveBoxIcon
            className="text-green-600"
            width="1.5em"
            height="1.5em"
          />
        )}
      </div>

      <div className="v-stack w-full">
        <span className="text-text font-bold leading-[1em]">
          {setting.link.fileName}
        </span>
        <span className="text-text text-xs">{setting.serial}</span>
        {!setting.playable && (
          <Download
            serial={setting.serial}
            handleDownloading={handleDownloading}
          />
        )}
      </div>

      {!setting.playable && !downloading && (
        <button
          type="button"
          className="h-stack cursor-pointer items-center gap-2 text-text font-bold bg-highlight px-3 py-1 rounded-lg"
          onClick={() => handleDownload(setting.serial)}
        >
          <ArrowDownTrayIcon width="1em" height="1em" />
          <span>Download</span>
        </button>
      )}

      {!setting.playable && downloading && (
        <button
          type="button"
          disabled
          className="h-stack items-center gap-2 text-text font-bold bg-secondary/50 px-3 py-1 rounded-lg"
        >
          <ArrowDownTrayIcon width="1em" height="1em" />
          <span>{progress}%</span>
        </button>
      )}

      {setting.playable && (
        <button
          type="button"
          className="h-stack cursor-pointer items-center gap-2 text-text font-bold bg-green-600 px-3 py-1 rounded-lg"
          onClick={handlePlay}
        >
          <PlayIcon width="1em" height="1em" />
          <span>Play</span>
        </button>
      )}
    </div>
  );
};

interface DownloadProps {
  serial: string;
  handleDownloading: (progress: number, bool?: boolean) => void;
}

const Download = ({ serial, handleDownloading }: DownloadProps) => {
  const { data, refresh } = useGetDownloadProgress({
    serial,
  });

  useInterval(() => {
    refresh();
  }, 1000);

  useEffect(() => {
    if (data?.status === DownloadStatus.Downloading) {
      handleDownloading(data?.percentage, true);
    }
    if (data?.status === DownloadStatus.Completed) {
      handleDownloading(data?.percentage, false);
    }
  }, [data?.status, data?.percentage, handleDownloading]);

  return (
    <div className="relative w-full h-1 bg-secondary/50 rounded-xl overflow-hidden mt-1">
      <div
        className="block h-full bg-highlight"
        style={{ width: `${data?.percentage ?? 0}%` }}
      />
    </div>
  );
};

export default GameDiscList;

import ConsoleIcon from "@elements/ConsoleIcon";
import Spinner from "@elements/Spinner";
import { ArrowDownTrayIcon, PlayIcon } from "@heroicons/react/24/outline";
import useDownloadDisc from "@hooks/useDownloadDisc";
import useGetDownloadProgress from "@hooks/useGetDownloadProgress";
import useNavigate from "@hooks/useNavigate";
import usePlay from "@hooks/usePlay";
import { useMainStore } from "@utils/store.utils";
import {
  useCounter,
  useDeepCompareEffect,
  useInterval,
  useMemoizedFn,
} from "ahooks";
import clsx from "clsx";
import { useState } from "react";
// eslint-disable-next-line import/no-extraneous-dependencies
import { DownloadStatus } from "types/enums";

type GameDiscListProps = BaseProps & {
  open: boolean;
  game: ConsoleGameData;
  settings: GameRegionFiles;
  console: string;
  onPlay: (serial: string) => void;
  onDownload: (serial: string) => void;
  onClose: () => void;
};

const GameDiscList = ({
  open,
  game,
  settings,
  console: cons,
  onPlay,
  onDownload,
  onClose,
}: GameDiscListProps) => {
  const store = useMainStore();
  const [, download] = useDownloadDisc();
  const [, play] = usePlay();
  const countFiles = settings.gameFiles ? settings.gameFiles.length - 1 : 0;
  const [discSelected, navActions] = useCounter(0, {
    min: 0,
    max: countFiles,
  });

  const handleDownload = (serial: string) => {
    download(serial, game.id, cons);
    onDownload?.(serial);
  };

  const handlePlay = (serial: string) => {
    if (!store.disc) {
      play(serial, game.id, cons);
      onPlay(serial);
    }
  };

  const { focused } = useNavigate(
    "game-play",
    {
      onFocus: () => {
        navActions.reset();
      },
      actions: {
        up() {
          navActions.dec();
        },
        bottom() {
          navActions.inc();
        },
        btnBottom() {
          const selected = settings.gameFiles?.[discSelected];
          if (selected && selected.playable) {
            handlePlay(selected.serial);
          } else {
            handleDownload(selected.serial);
          }
        },
        btnRight(setFocus) {
          setFocus("game-details");
          onClose();
        },
      },
    },
    [open]
  );

  // const downloadAll = () => {
  //   settings.gameFiles.forEach((v) => {
  //     if (v.link) download(v.serial, game.id, cons);
  //   });
  // };

  return (
    <div className="v-stack gap-4">
      <div className="h-stack items-center gap-3">
        <ConsoleIcon console={cons} size="2em" />
        <h6 className="font-bold text-text text-xl leading-[1em]">
          {game.official} Files
        </h6>
      </div>

      <div className="v-stack gap-2">
        {settings.gameFiles.map((setting, i) => (
          <Disc
            focused={focused && discSelected === i}
            key={setting.serial}
            console={cons}
            id={game.id}
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
  console: string;
  id: string;
  focused: boolean;
  setting: GameRegionFiles["gameFiles"][number];
  handleDownload: (serial: string) => void;
  handlePlay: (serial: string) => void;
  onDownload: (serial: string) => void;
}

type DiscStatus = "checking" | "idle" | "playable" | "downloading";

const Disc = ({
  console: cons,
  id,
  setting,
  handleDownload,
  handlePlay: _handlePlay,
  onDownload,
  focused,
}: DiscProps) => {
  const [state, setState] = useState<DiscStatus>("checking");
  const [progress, setProgress] = useState(0);

  const handleDownloading = useMemoizedFn(
    (p: DownloadProgress, st: DiscStatus) => {
      if (p.transferred > 0 && p.total > 0) setProgress(p.percentage);

      if (st === "playable") {
        onDownload(setting.serial);
      }

      setState(st);
    }
  );

  const handlePlay = () => {
    _handlePlay(setting.serial);
  };

  const handleClick = () => {
    if (setting.playable) {
      handlePlay();
    } else {
      handleDownload(setting.serial);
    }
  };

  const isChecking = state === "checking";
  const isDownloading = state === "downloading";
  const isPlayable = state === "playable";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        "relative h-stack gap-3 items-center border rounded-xl py-2 pl-4 pr-4",
        focused && "border-focus",
        !focused && "border-secondary/50"
      )}
    >
      <div>
        {!setting.playable && (isChecking || isDownloading) && (
          <Spinner className="w-[1.5em] h-[1.5em] animate-spin text-gray-600 fill-green-400" />
        )}
        {!setting.playable && !isDownloading && !isChecking && (
          <ArrowDownTrayIcon
            className="text-green-400"
            width="1.5em"
            height="1.5em"
          />
        )}
        {setting.playable && (
          <PlayIcon className="text-cyan-400" width="1.5em" height="1.5em" />
        )}
      </div>

      <div className="v-stack items-start w-full">
        <span className="text-text text-xl !line-clamp-1 text-start font-bold leading-[1em]">
          {setting.link.fileName}
        </span>
        <span className="text-text text-lg">{setting.serial}</span>
        {(!setting.playable || isPlayable) && (
          <Download
            serial={setting.serial}
            console={cons}
            id={id}
            handleDownloading={handleDownloading}
          />
        )}
      </div>

      {!setting.playable && isDownloading && (
        <button
          type="button"
          disabled
          className={clsx(
            "h-stack flex-grow-0  items-center gap-2 text-text text-xl",
            "font-bold px-3 py-1 rounded-lg box-border"
          )}
        >
          <span>{progress}%</span>
        </button>
      )}
    </button>
  );
};

interface DownloadProps {
  serial: string;
  console: string;
  id: string;
  handleDownloading: (progress: DownloadProgress, state: DiscStatus) => void;
}

const Download = ({
  serial,
  console: cons,
  id,
  handleDownloading,
}: DownloadProps) => {
  const { data, refresh } = useGetDownloadProgress({
    serial,
    console: cons,
    id,
  });

  useInterval(() => {
    refresh();
  }, 500);

  useDeepCompareEffect(() => {
    if (data?.status === DownloadStatus.Downloading) {
      handleDownloading(data, "downloading");
    }
    if (data?.status === DownloadStatus.Completed) {
      handleDownloading(data, "playable");
    }
    if (data?.status === DownloadStatus.NotDownloading) {
      handleDownloading(data, "idle");
    }
  }, [data, handleDownloading]);

  if (data?.status === DownloadStatus.NotDownloading || !data) return null;
  if (data?.status !== DownloadStatus.Downloading || !data) return null;
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

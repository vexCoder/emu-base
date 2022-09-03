import ConsoleIcon from "@elements/ConsoleIcon";
import useGetGameLinks from "@hooks/useGetGameLinks";
import useGetGameFiles from "@hooks/useGetGamesFiles";
import useSetGameLinks from "@hooks/useSetGameLinks";
import { useDynamicList } from "ahooks";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { equals } from "ramda";
import { useState } from "react";

interface GameDiscListProps {
  id: string;
  console: string;
}

const GameDiscList = ({ id, console: cons }: GameDiscListProps) => {
  const { data, loading } = useGetGameFiles({
    id,
    console: cons,
  });

  const gameFiles = data ?? [];

  const [edit, setEdit] = useState<GameRegionFiles>();
  const [selected, select] = useState<GameRegionFiles>();

  const selectedDiscs = selected?.gameFiles ?? [];
  const isComplete =
    selectedDiscs.filter((o) => !!o.playable)?.length >= selectedDiscs?.length;

  return (
    <div className="v-stack max-h-[75vh]">
      <div className="h-stack items-center gap-3">
        <ConsoleIcon console={cons} size="2em" />
        <h6 className="font-bold text-text leading-[1em]">Disc List</h6>
      </div>

      {!!edit && selected && (
        <LinksList id={id} selected={selected} console={cons} />
      )}
      {!edit && (
        <RegionList
          gameFiles={gameFiles}
          handleSelect={(v) => select(v)}
          selected={selected}
          loading={loading}
          handleEdit={() => setEdit(selected)}
          isComplete={isComplete}
        />
      )}
    </div>
  );
};

interface LinksListProps {
  selected: GameRegionFiles;
  console: string;
  id: string;
}

const LinksList = ({ selected, console: cons, id }: LinksListProps) => {
  const { list: links, resetList, replace } = useDynamicList<string | null>([]);
  const files = selected.gameFiles;

  const { data, loading } = useGetGameLinks({
    keyword: selected.title,
    console: cons,
    tags: [selected.region],
  });

  const [, execute, saving] = useSetGameLinks();

  const handleSet = () => {
    const serials = files.map((o) => o.serial);

    if (links.length !== serials.length) {
      return;
    }

    if (links.includes(null)) {
      return;
    }

    console.log(serials, links);

    execute(id, serials, links as string[], cons);
  };

  const gameLinks = data ?? [];
  return (
    <div className="v-stack">
      <p className="text-text  mt-4">Select Links In Order:</p>
      <p className={clsx("text-text mt-6 mb-6")}>
        {files.map((v, i) => (
          <span
            key={v.serial}
            className={clsx(
              "mr-2 rounded-xl p-2 bg-transparent border",
              !links[i] &&
                "text-secondary/30 border-secondary/30 bg-transparent",
              !!links[i] && "!border-highlight !bg-highlight/10 !text-text"
            )}
          >
            {v.serial}
          </span>
        ))}
      </p>

      <AnimatePresence>
        {!loading && (
          <motion.div
            key="disc-list"
            className="v-stack gap-4 overflow-auto py-2 pr-4 origin-top scroll1"
            initial={{ opacity: 0, maxHeight: "0vh" }}
            animate={{ opacity: 1, maxHeight: "50vh" }}
            exit={{ opacity: 0, maxHeight: "0vh" }}
            transition={{
              maxHeight: {
                delay: 0.15,
                duration: 0.3,
                ease: "easeInOut",
              },
              opacity: {
                delay: 0.2,
                duration: 0.5,
                ease: "easeInOut",
              },
            }}
          >
            {gameLinks.map((v) => {
              const isActive = links.includes(v.link);
              const linksIndex = links.findIndex((o) => o === v.link);
              return (
                <button
                  type="button"
                  key={JSON.stringify(v)}
                  className={clsx(
                    "v-stack p-2 rounded-xl border border-secondary/50",
                    isActive && "bg-secondary/20 border-focus"
                  )}
                  onClick={() => {
                    if (!isActive) {
                      const nullIndex = links.indexOf(null);
                      if (nullIndex === -1) resetList([...links, v.link]);
                      else replace(nullIndex, v.link);
                    } else {
                      const index = links.indexOf(v.link);
                      replace(index, null);
                    }
                  }}
                >
                  <p className="w-full h-stack justify-between text-text text-sm font-bold">
                    <span>
                      {!!files[linksIndex] && (
                        <span className="text-contrastText bg-highlight px-2 rounded-xl text-sm font-bold mr-2">
                          {files[linksIndex].serial}
                        </span>
                      )}
                      <span>{v.fileName}</span>
                    </span>

                    <span className="text-contrastText bg-highlight px-2 rounded-xl text-sm font-bold">
                      {v.size}Mb
                    </span>
                  </p>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <div>
        <button
          type="button"
          disabled={saving}
          className="bg-focus text-contrastText font-[JosefinSans] font-bold text-xl w-full rounded-xl py-2 mt-4"
          onClick={handleSet}
        >
          Save Files
        </button>
        <p className="text-xs mt-1 text-secondary">
          * make sure to add disc for each serials
        </p>
      </div>
    </div>
  );
};

interface RegionListProps {
  gameFiles: GameRegionFiles[];
  loading?: boolean;
  handleSelect?: (region: GameRegionFiles) => void;
  handleEdit?: () => void;
  selected?: GameRegionFiles;
  isComplete?: boolean;
}

const RegionList = ({
  gameFiles,
  loading,
  handleSelect,
  handleEdit,
  selected,
  isComplete,
}: RegionListProps) => {
  return (
    <div className="v-stack ">
      <p className="text-text  mt-4">Select Game Region:</p>

      <AnimatePresence>
        {!loading && (
          <motion.div
            key="disc-list"
            className="v-stack gap-4 overflow-auto py-2 pr-4 origin-top scroll1"
            initial={{ opacity: 0, maxHeight: "0vh" }}
            animate={{ opacity: 1, maxHeight: "50vh" }}
            exit={{ opacity: 0, maxHeight: "0vh" }}
            transition={{
              maxHeight: {
                delay: 0.15,
                duration: 0.3,
                ease: "easeInOut",
              },
              opacity: {
                delay: 0.2,
                duration: 0.5,
                ease: "easeInOut",
              },
            }}
          >
            {gameFiles.map((v) => {
              const discs = v.gameFiles ?? [];
              const unsetDiscs = discs.filter((o) => !o.playable);
              const isActive = equals(selected, v);
              return (
                <button
                  type="button"
                  key={JSON.stringify(v)}
                  className={clsx(
                    "v-stack p-2 rounded-xl border border-secondary/50",
                    isActive && "bg-secondary/20 border-focus"
                  )}
                  onClick={() => handleSelect?.(v)}
                >
                  <p className="w-full h-stack justify-between text-text text-sm font-bold">
                    <span>{v.title}</span>

                    <span className="text-contrastText bg-highlight px-2 rounded-xl text-sm font-bold">
                      {v.region}
                    </span>
                  </p>
                  <p className="w-full mt-2 h-stack justify-between text-text text-xs">
                    <span>{`${discs.map((o) => o.serial).join(", ")}`}</span>
                    <span className="mr-1">{`${
                      discs.length - unsetDiscs.length
                    } / ${unsetDiscs.length} Disc(s)`}</span>
                  </p>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {!isComplete && (
        <div>
          <button
            type="button"
            className="bg-focus text-contrastText font-[JosefinSans] font-bold text-xl w-full rounded-xl py-2 mt-4"
            onClick={handleEdit}
          >
            Set Links
          </button>
          <p className="text-xs mt-1 text-secondary">
            * some discs are unset please set links for each disc
          </p>
        </div>
      )}
    </div>
  );
};

export default GameDiscList;

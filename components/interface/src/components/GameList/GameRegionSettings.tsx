import Modal from "@elements/Modal";
import useGetGameLinks from "@hooks/useGetGameLinks";
import useGetGameRegionSettings from "@hooks/useGetGameRegionSettings";
import useNavigate from "@hooks/useNavigate";
import useSetGameLinks from "@hooks/useSetGameLinks";
import { useCounter, useDynamicList, useInViewport } from "ahooks";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { equals } from "ramda";
import { useEffect, useRef, useState } from "react";

interface GameDiscListProps {
  id: string;
  console: string;
  focusKey?: string;
  focusLinkKey?: string;
  onLinksSave?: (v: GameRegionFiles) => void;
  onRegionSet?: (v: GameRegionFiles) => void;
  open: boolean;
  onClose?: () => void;
}

const GameRegionSettings = ({
  focusKey,
  focusLinkKey,
  id,
  console: cons,
  onLinksSave,
  onRegionSet,
  open,
  onClose,
}: GameDiscListProps) => {
  const { data, loading } = useGetGameRegionSettings({
    id,
    console: cons,
  });

  const gameFiles = data ?? [];

  const [regionSelected, regionActions] = useCounter(0, {
    min: 0,
    max: gameFiles.length - 1,
  });

  const [edit, setEdit] = useState<GameRegionFiles>();
  const [selected, select] = useState<GameRegionFiles>();

  const selectedDiscs = selected?.gameFiles ?? [];
  const isComplete =
    selectedDiscs.filter((o) => !!o.playable)?.length >= selectedDiscs?.length;

  const { focused, setFocus } = useNavigate(
    focusKey ?? "game-disc",
    {
      onFocus() {
        regionActions.set(0);
      },
      actions: {
        up() {
          regionActions.dec();
        },
        bottom() {
          regionActions.inc();
        },
        btnBottom() {
          const sel = gameFiles[regionSelected];
          if (sel) {
            setEdit(sel);
            setFocus(focusLinkKey ?? "game-links");
          }
        },
        btnRight() {
          handleClose();
        },
      },
    },
    [id]
  );

  const handleClose = () => {
    setEdit(undefined);
    onClose?.();
  };

  const handleSelect = (v: GameRegionFiles) => {
    select(v);
    onRegionSet?.(v);
  };

  return (
    <>
      <Modal open={!edit && open}>
        <RegionList
          focused={focused}
          gameFiles={gameFiles}
          handleSelect={handleSelect}
          selected={selected}
          loading={loading}
          handleEdit={() => {
            setEdit(selected);
          }}
          regionSelected={regionSelected}
          isComplete={isComplete}
        />
      </Modal>
      <Modal
        open={!!edit && open}
        classes={{
          content: "!min-w-[450px] !w-[70vw] !max-w-[800px]",
        }}
      >
        <LinksList
          id={id}
          selected={edit}
          console={cons}
          onClose={() => {
            setFocus(focusKey ?? "game-disc");
            setEdit(undefined);
          }}
          focusLinkKey={focusLinkKey}
          onLinksSave={() => {
            if (edit) onLinksSave?.(edit);
          }}
        />
      </Modal>
      {/* <div className="v-stack max-h-[75vh]">
        <div className="h-stack items-center gap-3">
          <ConsoleIcon console={cons} size="2em" />
          <h6 className="font-bold text-text leading-[1em]">Disc List</h6>
        </div>
      </div> */}
    </>
  );
};

interface LinksListProps {
  selected?: GameRegionFiles;
  console: string;
  id: string;
  onLinksSave?: () => void;
  focusLinkKey?: string;
  onClose: () => void;
}

const LinksList = ({
  selected,
  console: cons,
  id,
  onLinksSave,
  focusLinkKey,
  onClose,
}: LinksListProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const {
    list: links,
    resetList,
    replace,
    remove,
  } = useDynamicList<ParsedLinks | null>([]);
  const files = selected?.gameFiles ?? [];
  const regions = selected?.region ? [selected?.region] : [];

  const { data, loading } = useGetGameLinks({
    keyword: selected?.title || "",
    console: cons,
    tags: regions,
  });

  const gameLinks = data ?? [];

  const [linkSelected, linksActions] = useCounter(0, {
    min: 0,
    max: gameLinks.length - 1,
  });

  const [, execute] = useSetGameLinks();

  const handleSet = () => {
    const serials = files.map((o) => o.serial);

    if (links.length !== serials.length) {
      return;
    }

    if (links.includes(null)) {
      return;
    }

    execute(id, serials, links as ParsedLinks[], cons);
    onLinksSave?.();
  };

  const handleSelect = (link: ParsedLinks, isActive: boolean) => {
    if (!isActive) {
      if (links.length >= files.length) return;
      const nullIndex = links.indexOf(null);
      if (nullIndex === -1) resetList([...links, link]);
      else replace(nullIndex, link);
    } else {
      const index = links.indexOf(link);
      remove(index);
    }
  };

  const { focused } = useNavigate(
    focusLinkKey ?? "game-links",
    {
      onFocus() {
        linksActions.set(0);
      },
      actions: {
        up() {
          linksActions.dec();
        },
        bottom() {
          linksActions.inc();
        },
        btnBottom() {
          const sel = gameLinks[linkSelected];
          if (sel) {
            const isActive = !!links.find((o) => o?.link === sel.link);
            handleSelect(sel, isActive);
          }
        },
        ctrlRight() {
          handleSet();
        },
        btnRight() {
          onClose();
        },
      },
    },
    [id]
  );

  return (
    <div className="v-stack">
      <p className="text-text mt-4 text-xl font-bold">Select Links In Order:</p>
      <p className={clsx("h-stack gap-3 text-text mt-4 mb-4")}>
        {files.map((v, i) => (
          <span
            key={v.serial}
            className={clsx(
              "rounded-xl p-2 bg-transparent border",
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
            ref={ref}
            key="disc-list"
            className="v-stack gap-4 overflow-auto py-2 origin-top scroll1"
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
            {gameLinks.map((v, i) => {
              const isActive = links.find((o) => o?.link === v.link);
              const linksIndex = links.findIndex((o) => o?.link === v.link);
              return (
                <LinkItem
                  key={JSON.stringify(v)}
                  files={files}
                  focused={focused}
                  handleSelect={handleSelect}
                  index={i}
                  isActive={!!isActive}
                  item={v}
                  linkSelected={linkSelected}
                  linksIndex={linksIndex}
                  parent={ref.current}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      {/* <div>
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
      </div> */}
    </div>
  );
};

interface LinkItemProps {
  item: ParsedLinks;
  isActive: boolean;
  linksIndex: number;
  index: number;
  linkSelected: number;
  focused: boolean;
  parent: HTMLDivElement | null;
  files: GameRegionFiles["gameFiles"];
  handleSelect: (link: ParsedLinks, isActive: boolean) => void;
}

const LinkItem = ({
  item,
  files,
  isActive,
  linksIndex,
  focused,
  parent,
  handleSelect,
  index: i,
  linkSelected,
}: LinkItemProps) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [, ratio] = useInViewport(ref, {
    threshold: [0, 0.25, 0.5, 0.75, 1],
    root: () => parent,
  });

  useEffect(() => {
    if (
      focused &&
      linkSelected === i &&
      typeof ratio === "number" &&
      ratio < 1
    ) {
      ref.current?.scrollIntoView();
    }
  }, [focused, linkSelected, i, ratio]);

  return (
    <button
      ref={ref}
      type="button"
      key={JSON.stringify(item)}
      className={clsx(
        "v-stack p-2 rounded-xl",
        (!focused || linkSelected !== i) &&
          !isActive &&
          "border border-secondary/50",
        focused && linkSelected === i && `border border-focus`,
        isActive && "bg-secondary/20"
      )}
      onClick={() => handleSelect(item, !!isActive)}
    >
      <p className="w-full h-stack justify-between text-text text-md line-clamp-1 font-bold">
        <span className="h-stack">
          {!!files[linksIndex] && (
            <span
              className={clsx(
                "text-contrastText px-1 bg-highlight rounded-xl",
                "text-xl !line-clamp-1 text-start font-bold mr-2 flex-[0_0_auto]"
              )}
            >
              {files[linksIndex].serial}
            </span>
          )}
          <span className="text-xl !line-clamp-1 text-start font-bold mr-2 flex-[0_0_auto]">
            {item.fileName}
          </span>
        </span>

        <span className="text-contrastText bg-highlight px-2 rounded-xl text-xl font-bold">
          {item.size}Mb
        </span>
      </p>
    </button>
  );
};

interface RegionListProps {
  gameFiles: GameRegionFiles[];
  loading?: boolean;
  handleSelect?: (region: GameRegionFiles) => void;
  handleEdit?: () => void;
  selected?: GameRegionFiles;
  isComplete?: boolean;
  focused: boolean;
  regionSelected: number;
}

const RegionList = ({
  gameFiles,
  loading,
  handleSelect,
  handleEdit,
  selected,
  isComplete,
  focused,
  regionSelected,
}: RegionListProps) => {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className="v-stack">
      <p className="text-text text-xl font-bold mb-2">Select Game Region:</p>

      <AnimatePresence>
        {!loading && (
          <motion.div
            key="disc-list"
            className="v-stack gap-4 overflow-auto py-2 pr-2 origin-top scroll1"
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
            {gameFiles.map((v, i) => {
              const discs = v.gameFiles ?? [];
              const unsetDiscs = discs.filter((o) => !o.playable);
              const isActive = equals(selected, v);
              return (
                <RegionItem
                  discs={discs}
                  focused={focused}
                  handleSelect={handleSelect}
                  index={i}
                  isActive={isActive}
                  item={v}
                  parent={ref.current}
                  regionSelected={regionSelected}
                  unsetDiscs={unsetDiscs}
                  key={JSON.stringify(v)}
                />
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

interface RegionItemProps {
  item: GameRegionFiles;
  isActive: boolean;
  index: number;
  regionSelected: number;
  focused: boolean;
  parent: HTMLDivElement | null;
  discs: GameRegionFiles["gameFiles"];
  unsetDiscs: GameRegionFiles["gameFiles"];
  handleSelect?: (item: GameRegionFiles) => void;
}

const RegionItem = ({
  item,
  discs,
  unsetDiscs,
  isActive,
  focused,
  parent,
  handleSelect,
  index: i,
  regionSelected,
}: RegionItemProps) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [, ratio] = useInViewport(ref, {
    threshold: [0, 0.25, 0.5, 0.75, 1],
    root: () => parent,
  });

  useEffect(() => {
    if (
      focused &&
      regionSelected === i &&
      typeof ratio === "number" &&
      ratio < 1
    ) {
      ref.current?.scrollIntoView();
    }
  }, [focused, regionSelected, i, ratio]);

  return (
    <button
      ref={ref}
      type="button"
      className={clsx(
        "v-stack p-2 rounded-xl",
        (!focused || regionSelected !== i) && "border border-secondary/50",
        focused && regionSelected === i && `border border-focus`,
        isActive && "bg-secondary/20 border-focus"
      )}
      onClick={() => handleSelect?.(item)}
    >
      <p className="w-full h-stack items-center justify-between text-text text-lg font-bold">
        <span>{item.title}</span>

        <span className="text-contrastText text-xl bg-highlight px-2 rounded-xl font-bold">
          {item.region}
        </span>
      </p>
      <p className="w-full mt-2 h-stack justify-between text-text text-sm line-clamp-1">
        <p className="!line-clamp-1 text-start">{`${discs
          .map((o) => o.serial)
          .join(", ")}`}</p>
        <p className="mr-1 !line-clamp-1 flex-[0_0_auto] ml-4">{`${
          discs.length - unsetDiscs.length
        } / ${unsetDiscs.length} Disc(s)`}</p>
      </p>
    </button>
  );
};

export default GameRegionSettings;

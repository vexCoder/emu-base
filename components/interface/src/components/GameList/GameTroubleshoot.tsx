import Keyboard from "@elements/Keyboard";
import MenuItem from "@elements/MenuItem";
import Modal from "@elements/Modal";
import {
  CircleStackIcon,
  GlobeAltIcon,
  MusicalNoteIcon,
  WrenchIcon,
} from "@heroicons/react/24/outline";
import useGetGame from "@hooks/useGetGame";
import useNavigate from "@hooks/useNavigate";
import { MainStore, useMainStore } from "@utils/store.utils";
import { useCounter, useMemoizedFn, useMount, useToggle } from "ahooks";
import clsx from "clsx";
import { pick } from "ramda";
import { useState } from "react";
import { createPortal } from "react-dom";
import GameOpenings from "./GameOpenings";
import GameRegionSettings from "./GameRegionSettings";
import GameTGDB from "./GameTGDB";

const selector = (v: MainStore) =>
  pick(["selected", "console", "play", "lastFocused"], v);

interface GameTroubleshootProps {
  onClose?: () => void;
}

const GameTroubleshoot = ({ onClose }: GameTroubleshootProps) => {
  const store = useMainStore(selector);
  const [selected, menuActions] = useCounter(0, {
    min: 0,
    max: 2,
  });

  const [modalOpen, actionsModal] = useToggle(false);
  const [openOpenings, setOpenOpenings] = useState(false);
  const { data: game, refresh } = useGetGame({
    console: store.console,
    id: store.selected?.id,
  });

  const [tgdbOpen, tgdbModal] = useToggle(false);
  const [keyOpen, keyModal] = useToggle(false);

  const { setFocus, focused } = useNavigate("game-troubleshoot", {
    actions: {
      up() {
        menuActions.dec();
      },
      bottom() {
        menuActions.inc();
      },
      btnBottom() {
        if (selected === 0) {
          setOpenOpenings(true);
          setFocus("game-troubleshoot-opening");
        }

        if (selected === 1) {
          tgdbModal.set(true);
          setFocus("game-tgdb");
        }

        if (selected === 2) {
          actionsModal.set(true);
          setFocus("game-troubleshoot-region-settings");
        }
      },
      btnRight() {
        setFocus("game-details");
        onClose?.();
      },
    },
  });

  const setKeyOpen = useMemoizedFn(keyModal.set);
  const setOpen = useMemoizedFn(tgdbModal.set);

  if (!game) return null;

  return (
    <>
      {game && (
        <GameRegionSettings
          focusKey="game-troubleshoot-region-settings"
          focusLinkKey="game-troubleshoot-link-settings"
          id={game.id}
          console={store.console}
          open={modalOpen}
          onLinksSave={() => {
            actionsModal.set(false);
            setFocus("game-troubleshoot");
          }}
          onClose={() => {
            actionsModal.set(false);
            setFocus("game-troubleshoot");
          }}
        />
      )}
      <Modal open={openOpenings}>
        <GameOpenings
          onClose={() => {
            refresh();
            setOpenOpenings(false);
          }}
        />
      </Modal>
      <TGDB
        open={tgdbOpen}
        keyOpen={keyOpen}
        setKeyOpen={setKeyOpen}
        setOpen={setOpen}
        lastFocused={store.lastFocused}
        title={game.official}
        setFocus={setFocus}
        refresh={refresh}
      />
      <div className="v-stack gap-4">
        <div className="h-stack items-center gap-3">
          <WrenchIcon width="2em" height="2em" className="text-text" />
          <h6 className="font-bold text-text text-xl leading-[1em]">
            Troubleshoot: {game.official}
          </h6>
        </div>

        <div className="v-stack gap-2">
          <MenuItem
            selected={selected === 0}
            focused={focused}
            label="Game Opening"
            icon={MusicalNoteIcon}
          >
            {game.opening}
          </MenuItem>
          <MenuItem
            selected={selected === 1}
            focused={focused}
            label="Search TGDB"
            icon={CircleStackIcon}
          />
          <MenuItem
            selected={selected === 2}
            focused={focused}
            label="Select Region"
            icon={GlobeAltIcon}
          />
        </div>
      </div>
    </>
  );
};

interface TGDBProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  keyOpen: boolean;
  setKeyOpen: (v: boolean) => void;
  refresh: () => void;
  setFocus: (key: string) => void;
  lastFocused?: string;
  title: string;
}

const TGDB = ({
  open,
  keyOpen,
  setKeyOpen,
  setOpen,
  refresh,
  setFocus,
  lastFocused,
  title,
}: TGDBProps) => {
  const [inputVal, setInputVal] = useState<string>();
  const [search, setSearch] = useState<string>();
  const [recent, setRecent] = useState<string[]>([]);

  useMount(() => {
    window.data.getRecentSearches().then(setRecent);
    setSearch(title);
    setInputVal(title);
  });

  const handleInputChange = (v: string) => {
    setInputVal(v);
  };

  const handleChange = (v: string) => {
    setSearch(v);
    setKeyOpen(false);
    setTimeout(() => {
      setFocus(
        lastFocused !== "game-search"
          ? lastFocused ?? "game-header"
          : "game-header"
      );
    }, 100);
  };

  const handleClose = () => {
    setKeyOpen(false);
    setFocus("game-tgdb");
  };

  return (
    <>
      <Modal
        open={open}
        className={clsx("transition-[top]", keyOpen && "top-1/4")}
        classes={{
          content: "!min-w-[450px] !w-[70vw] !max-w-[800px]",
        }}
      >
        <GameTGDB
          search={search ?? ""}
          input={inputVal ?? ""}
          onClose={() => {
            refresh();
            setOpen(false);
            setInputVal("");
          }}
          onKeyboard={(b) => {
            setKeyOpen(b);
            setFocus("game-tgdb-keyboard");
          }}
        />
      </Modal>
      {createPortal(
        <div
          className={clsx(
            "center-transform rounded-xl p-4 transition-[top] min-w-[75vw] z-50 bg-primary",
            keyOpen && "!top-[65%]",
            !keyOpen && "!top-[145%]"
          )}
        >
          <Keyboard
            recent={recent}
            hideInput
            placeholder="Enter Game Title"
            value={inputVal}
            focusKey="game-tgdb-keyboard"
            onInputChange={handleInputChange}
            onChange={handleChange}
            onClose={handleClose}
          />
        </div>,
        document.body
      )}
    </>
  );
};

export default GameTroubleshoot;

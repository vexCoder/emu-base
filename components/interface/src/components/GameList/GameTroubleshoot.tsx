import Keyboard from "@elements/Keyboard";
import MenuItem from "@elements/MenuItem";
import Modal from "@elements/Modal";
import {
  GlobeAltIcon,
  MusicalNoteIcon,
  WrenchIcon,
} from "@heroicons/react/24/outline";
import useGetGame from "@hooks/useGetGame";
import useNavigate from "@hooks/useNavigate";
import { MainStore, useMainStore } from "@utils/store.utils";
import { useCounter, useDebounceEffect, useSetState, useToggle } from "ahooks";
import { pick } from "ramda";
import { useEffect, useState } from "react";
import GameRegionSettings from "./GameRegionSettings";

const selector = (v: MainStore) => pick(["selected", "console", "play"], v);

interface GameTroubleshootProps {
  onKeyboardOpen?: (bool?: boolean) => void;
  onClose?: () => void;
}

const GameTroubleshoot = ({
  onKeyboardOpen,
  onClose,
}: GameTroubleshootProps) => {
  const store = useMainStore(selector);
  const [selected, menuActions] = useCounter(0, {
    min: 0,
    max: 1,
  });

  const [modalOpen, actionsModal] = useToggle(false);
  const [toEdit, setToEdit] = useState<"music">();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useSetState<Partial<ConsoleGameData>>({});
  const { data: game } = useGetGame({
    console: store.console,
    id: store.selected?.id,
  });

  useDebounceEffect(
    () => {
      if (store.selected && value.opening) {
        window.data.setGame(store.selected.id, store.console, {
          opening: value.opening,
        });
      }
    },
    [value],
    { wait: 500 }
  );

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
          setOpen(true);
          setToEdit("music");
          setFocus("game-troubleshoot-keyboard");
        }

        if (selected === 1) {
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

  useEffect(() => {
    onKeyboardOpen?.(open);
  }, [open, onKeyboardOpen]);

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
      <Modal
        open={open}
        className="transition-[top] min-w-[75vw] top-3/4"
        classes={{ backdrop: "bg-black/0" }}
      >
        <Keyboard
          placeholder="Enter Game Music Opening (Link)"
          value={value.opening}
          focusKey="game-troubleshoot-keyboard"
          onClose={() => {
            setFocus("game-troubleshoot");
            setOpen(false);
            setToEdit(undefined);
          }}
          onChange={(v) => {
            if (toEdit === "music") setValue({ opening: v });
          }}
        />
      </Modal>
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
            label="Select Region"
            icon={GlobeAltIcon}
          />
        </div>
      </div>
    </>
  );
};

export default GameTroubleshoot;

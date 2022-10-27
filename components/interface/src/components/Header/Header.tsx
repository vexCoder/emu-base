import ConsoleIcon from "@elements/ConsoleIcon";
import Keyboard from "@elements/Keyboard";
import Modal from "@elements/Modal";
import {
  Cog8ToothIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import useNavigate from "@hooks/useNavigate";
import { useMainStore } from "@utils/store.utils";
import { useCounter, useMount, useToggle } from "ahooks";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ConsoleList from "./ConsoleList";
import GameSearch from "./GameSearch";
import Settings from "./Settings";

const Header = () => {
  const store = useMainStore();
  const [inputVal, setInputVal] = useState<string>();
  const [selected, setSelected] = useState<string>();
  const [recent, setRecent] = useState<string[]>([]);
  const [searchOpen, toggleSearch] = useToggle(false);
  const [settingsOpen, toggleSettings] = useToggle(false);
  const [consolesOpen, toggleConsoles] = useToggle(false);
  const [btnSelected, navActions] = useCounter(0, {
    min: 0,
    max: 2,
  });

  useMount(() => {
    if (store.console) {
      window.data.getConsoleByKey(store.console).then((v) => setSelected(v.id));
    } else {
      window.data.getConsoles().then((consoles) => {
        if (consoles.length) {
          setSelected(consoles[0]);
        }
      });
    }

    window.data.getRecentSearches().then(setRecent);
  });

  const requiredFocus = ["game-header", "game-list", "game-details"];

  const { focused, setFocus } = useNavigate("game-header", {
    globalActions: {
      ctrlLeft() {
        if (store.focused !== "game-console-list") {
          setFocus("game-console-list");
          toggleConsoles.set(true);
        }
      },
      ctrlMiddle() {
        if (
          store.focused !== "game-search" &&
          requiredFocus.includes(store.focused)
        ) {
          setFocus("game-search");
          toggleSearch.set(true);
        }

        if (store.focused === "game-search" && store.lastFocused) {
          setFocus(store.lastFocused);
          toggleSearch.set(false);
        }
      },
    },
    actions: {
      left() {
        navActions.dec();
      },
      right() {
        navActions.inc();
      },
      bottom() {
        setFocus("game-list");
      },
      btnBottom() {
        if (btnSelected === 3) {
          window.win.close();
        }
        if (btnSelected === 2) {
          toggleSettings.set(true);
          setFocus("game-settings");
        }
        if (btnSelected === 1) {
          toggleSearch.set(true);
          setFocus("game-search");
        }
        if (btnSelected === 0) {
          toggleConsoles.set(true);
          setFocus("game-console-list");
        }
      },
    },
  });

  const handleInputChange = (v: string) => {
    setInputVal(v);
  };

  const handleChange = (v: string) => {
    setFocus(store.lastFocused ?? "game-header");
    toggleSearch.set(false);
    store.set({ search: v });
  };

  useEffect(() => {
    if (searchOpen) {
      window.data.getRecentSearches().then((v) => {
        setRecent(v);
      });
    }
  }, [searchOpen]);

  return (
    <>
      <Modal
        duration={0.3}
        open={searchOpen}
        handleClose={() => toggleSearch.set(false)}
        className={clsx("transition-[top]", searchOpen && "top-1/4")}
      >
        <GameSearch value={inputVal} />
      </Modal>
      {createPortal(
        <div
          className={clsx(
            "center-transform rounded-xl p-4 transition-[top] min-w-[75vw] z-50 bg-primary",
            searchOpen && "!top-3/4",
            !searchOpen && "!top-[125%]"
          )}
        >
          <Keyboard
            recent={recent}
            hideInput
            placeholder="Enter Game Title"
            value={store.search}
            focusKey="game-search"
            onClose={() => {
              setFocus("game-header");
              toggleSearch.set(false);
            }}
            onInputChange={handleInputChange}
            onChange={handleChange}
          />
        </div>,
        document.body
      )}
      <Modal
        duration={0.3}
        open={settingsOpen}
        handleClose={() => toggleSettings.set(false)}
      >
        <Settings id={selected} onClose={() => toggleSettings.set(false)} />
      </Modal>
      <Modal
        duration={0.3}
        open={consolesOpen}
        handleClose={() => toggleConsoles.set(false)}
      >
        <ConsoleList
          selected={selected}
          setSelected={setSelected}
          onClose={() => toggleConsoles.set(false)}
        />
      </Modal>
      <div className="h-stack justify-between p-4 w-full">
        <button type="button" onClick={() => toggleConsoles.set(true)}>
          <ConsoleIcon
            console={store.console}
            size="3em"
            className={clsx(
              focused && btnSelected === 0 && "!fill-focus ",
              (!focused || btnSelected !== 0) && "!fill-text"
            )}
          />
        </button>

        <div className="h-stack gap-4">
          <div className="h-stack items-center">
            <button
              className="h-stack items-center gap-2 py-1 px-2 rounded-full bg-secondary/50"
              type="button"
              onClick={() => toggleSearch.set(true)}
            >
              <MagnifyingGlassIcon
                className={clsx(
                  "w-[1.5em] h-[1.5em] text-text",
                  focused && btnSelected === 1 && "!text-focus ",
                  (!focused || btnSelected !== 1) && "!text-text"
                )}
              />
              <p className="text-text leading-[1em] min-w-[75px]">
                {store.search}
              </p>
            </button>
          </div>
          <button type="button" onClick={() => toggleSettings.set(true)}>
            <Cog8ToothIcon
              className={clsx(
                "w-[3em] h-[3em] text-text",
                focused && btnSelected === 2 && "!text-focus ",
                (!focused || btnSelected !== 2) && "!text-text"
              )}
            />
          </button>
          <button type="button" onClick={() => window.win.close()}>
            <XCircleIcon
              className={clsx(
                "w-[3em] h-[3em] text-text",
                focused && btnSelected === 3 && "!text-focus ",
                (!focused || btnSelected !== 3) && "!text-text"
              )}
            />
          </button>
        </div>
      </div>
    </>
  );
};

export default Header;

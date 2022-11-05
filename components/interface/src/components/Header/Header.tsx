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
    max: 3,
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
          store.set({ shutdown: true });
          setFocus("shutdown");
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
    store.set({ search: v });
    toggleSearch.set(false);
    setTimeout(() => {
      setFocus(
        store.lastFocused !== "game-search"
          ? store.lastFocused ?? "game-header"
          : "game-header"
      );
    }, 100);
  };

  const handleClose = () => {
    toggleSearch.set(false);
    setFocus(store.lastFocused ?? "game-header");
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
            searchOpen && "!top-[65%]",
            !searchOpen && "!top-[145%]"
          )}
        >
          <Keyboard
            recent={recent}
            hideInput
            placeholder="Enter Game Title"
            value={store.search}
            focusKey="game-search"
            onInputChange={handleInputChange}
            onChange={handleChange}
            onClose={handleClose}
          />
        </div>,
        document.body
      )}
      <Modal
        duration={0.3}
        open={settingsOpen}
        handleClose={() => toggleSettings.set(false)}
        classes={{
          content: "!min-w-[450px] !w-[70vw] !max-w-[800px]",
        }}
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
      <div className="h-stack justify-between p-12 w-full z-10">
        <button type="button" onClick={() => toggleConsoles.set(true)}>
          <ConsoleIcon
            console={store.console}
            size="3em"
            className={clsx(
              focused && btnSelected === 0 && "!fill-focus text-focus ",
              (!focused || btnSelected !== 0) && "!fill-text text-text "
            )}
          />
        </button>

        <div className="h-stack gap-4">
          <div className="h-stack items-center">
            <button
              className={clsx(
                "h-stack items-center gap-2 h-[3em] py-1 px-4 rounded-full bg-secondary/10",
                focused && btnSelected === 1 && "border-2 border-focus",
                (!focused || btnSelected !== 1) && "border-2 border-transparent"
              )}
              type="button"
              onClick={() => toggleSearch.set(true)}
            >
              <MagnifyingGlassIcon
                className={clsx(
                  "w-[1.5em] h-[1.5em] text-text",
                  focused && btnSelected === 1 && "!text-focus",
                  (!focused || btnSelected !== 1) && "!text-text"
                )}
              />
              <p className="text-text text-xl leading-[1em] min-w-[125px]">
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
          <button type="button">
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

import ConsoleIcon from "@elements/ConsoleIcon";
import Modal from "@elements/Modal";
import { Cog8ToothIcon, XCircleIcon } from "@heroicons/react/24/outline";
import useNavigate from "@hooks/useNavigate";
import { useMainStore } from "@utils/store.utils";
import { useCounter, useMount, useToggle } from "ahooks";
import clsx from "clsx";
import { useState } from "react";
import ConsoleList from "./ConsoleList";
import Settings from "./Settings";

const Header = () => {
  const store = useMainStore();
  const [selected, setSelected] = useState<string>();
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
  });

  const { focused } = useNavigate("game-header", {
    actions: {
      left() {
        navActions.dec();
      },
      right() {
        navActions.inc();
      },
      bottom(setFocus) {
        setFocus("game-list");
      },
      btnBottom(setFocus) {
        if (btnSelected === 2) {
          window.win.close();
        }
        if (btnSelected === 1) {
          toggleSettings.set(true);
          setFocus("game-settings");
        }
        if (btnSelected === 0) {
          toggleConsoles.set(true);
          setFocus("game-console-list");
        }
      },
    },
  });

  return (
    <>
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
          <button type="button" onClick={() => toggleSettings.set(true)}>
            <Cog8ToothIcon
              className={clsx(
                "w-[3em] h-[3em] text-text",
                focused && btnSelected === 1 && "!text-focus ",
                (!focused || btnSelected !== 1) && "!text-text"
              )}
            />
          </button>
          <button type="button" onClick={() => window.win.close()}>
            <XCircleIcon
              className={clsx(
                "w-[3em] h-[3em] text-text",
                focused && btnSelected === 2 && "!text-focus ",
                (!focused || btnSelected !== 2) && "!text-text"
              )}
            />
          </button>
        </div>
      </div>
    </>
  );
};

export default Header;

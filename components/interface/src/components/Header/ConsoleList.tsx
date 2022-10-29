import ConsoleIcon from "@elements/ConsoleIcon";
import useNavigate from "@hooks/useNavigate";
import { useMainStore } from "@utils/store.utils";
import { useCounter, useMount } from "ahooks";
import clsx from "clsx";
import { useState } from "react";

interface ConsoleListProps {
  selected?: string;
  setSelected: (id: string) => void;
  onClose: () => void;
}

const ConsoleList = ({ selected, setSelected, onClose }: ConsoleListProps) => {
  const store = useMainStore();
  const [consoles, setConsoles] = useState<string[]>([]);
  const [consoleSelected, consoleActions] = useCounter(0, {
    min: 0,
    max: consoles.length ?? 0,
  });

  useMount(() => {
    window.data.getConsoles().then(setConsoles);
  });

  const { focused } = useNavigate("game-console-list", {
    onFocus: () => {
      consoleActions.set(0);
    },
    actions: {
      up() {
        consoleActions.dec();
      },
      bottom() {
        consoleActions.inc();
      },
      btnBottom(setFocus) {
        const sel = consoles[consoleSelected];
        if (sel) {
          setSelected(sel);
          setFocus("game-header");
          onClose();
        }
      },
      btnRight(setFocus) {
        if (store.lastFocused) {
          setFocus(store.lastFocused);
        } else {
          setFocus("game-header");
        }
        onClose();
      },
    },
  });

  return (
    <div>
      {consoles.map((v, i) => (
        <Console
          id={v}
          focused={focused && consoleSelected === i}
          setSelected={(settings) => {
            setSelected(settings.id);
            store.set({ console: settings.key });
          }}
          selected={selected === v}
        />
      ))}
    </div>
  );
};

interface ConsoleProps {
  id: string;
  setSelected: (settings: ConsoleSettings) => void;
  selected?: boolean;
  focused?: boolean;
}

const Console = ({
  id,
  setSelected,
  focused = false,
  selected = false,
}: ConsoleProps) => {
  const [console, setConsole] = useState<ConsoleSettings>();
  const [count, setCount] = useState<number>(0);

  useMount(() => {
    window.data.getConsole(id).then((v) => {
      setConsole(v);
      window.data.countConsoleGames(v.key).then(setCount);
    });
  });

  if (!console) return null;
  return (
    <button
      className={clsx(
        "h-stack items-center gap-3 py-2 px-3 border rounded-xl",
        focused && "border-focus",
        !focused && !selected && "border-secondary/50",
        selected && !focused && "border-highlight"
      )}
      type="button"
      onClick={() => setSelected(console)}
    >
      <div className="flex-2">
        <ConsoleIcon
          console={console?.key}
          size="3em"
          className={clsx(focused && "!fill-focus ", !focused && "!fill-text")}
        />
      </div>
      <div>
        <p className="text-text font-bold text-2xl text-left">{`${console.name} (${count} Games)`}</p>
        <p className="text-text text-lg text-left line-clamp-2">
          {console.description}
        </p>
      </div>
    </button>
  );
};

export default ConsoleList;

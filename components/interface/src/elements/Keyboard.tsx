import {
  ArrowLeftIcon,
  ArrowUpIcon,
  ArrowUturnRightIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import useNavigate from "@hooks/useNavigate";
import { cycleCounter } from "@utils/helper";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

type KeyboardProps = BaseProps & {
  focusKey?: string;
  value?: string;
  onClose?: () => void;
  onChange?: (val: string) => void;
  placeholder?: string;
};

const useCoordinate = () => {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  const set = useCallback((xval: number, yval: number) => {
    setX(xval);
    setY(yval);
  }, []);

  return { x, y, set };
};

const keyMap = [
  `esc|1|2|3|4|5|6|7|8|9|0|-|bck`.split("|"),
  `q|w|e|r|t|y|u|i|o|p`.split("|"),
  `a|s|d|f|g|h|j|k|l|enter`.split("|"),
  `shf|,|z|x|c|v|b|n|m|?|.|shf`.split("|"),
  `spc|pst|clr|done`.split("|"),
];

const Keyboard = ({
  focusKey,
  onClose,
  onChange,
  placeholder,
  value: initialValue,
}: KeyboardProps) => {
  const { x, y, set } = useCoordinate();

  const [value, setValue] = useState("");
  const [shift, setShift] = useState(false);

  useEffect(() => {
    if (initialValue) setValue(initialValue);
  }, [initialValue]);

  const { focused } = useNavigate(focusKey ?? "game-keyboard", {
    actions: {
      left() {
        set(cycleCounter(x - 1, 0, keyMap[y].length - 1), y);
      },
      right() {
        set(cycleCounter(x + 1, 0, keyMap[y].length - 1), y);
      },
      up() {
        const idx = cycleCounter(y - 1, 0, 4);
        // const newX = Math.min(x, keyMap[idx].length - 1);
        const newX = Math.floor((x / keyMap[y].length) * keyMap[idx].length);
        set(newX, idx);
      },
      bottom() {
        const idx = cycleCounter(y + 1, 0, 4);
        // const newX = Math.min(x, keyMap[idx].length - 1);
        const max = keyMap[idx].length;
        const newX = Math.floor((x / keyMap[y].length) * max);
        set(newX, cycleCounter(y + 1, 0, 4));
      },
      btnRight() {
        handleButton("bck");
      },
      btnBottom() {
        const mapVal = keyMap[y][x];
        handleButton(mapVal);
      },
    },
  });

  const handleButton = (val: string) => {
    if (val === "bck") {
      setValue((prev) => prev.slice(0, -1));
    } else if (val === "esc") {
      onClose?.();
    } else if (val === "spc") {
      setValue((prev) => `${prev} `);
    } else if (val === "enter") {
      setValue((prev) => `${prev}\n`);
    } else if (val === "shf") {
      setShift((prev) => !prev);
      return;
    } else if (val === "pst") {
      navigator.clipboard.readText().then(setValue);
    } else if (val === "clr") {
      setValue("");
    } else if (val === "done") {
      onChange?.(value);
      onClose?.();
    } else {
      setValue((prev) => prev + (shift ? val.toUpperCase() : val));
    }

    setShift(false);
  };

  return (
    <div>
      <div className="p-1">
        {value && value.length && (
          <div className="p-4 text-lg rounded-sm bg-secondary/20 font-[JosefinSans] font-bold text-text">
            {value}
          </div>
        )}

        {(!value || !value?.length) && placeholder && (
          <div className="p-4 text-lg rounded-sm bg-secondary/20 font-[JosefinSans] font-bold text-text/20">
            {placeholder}
          </div>
        )}
      </div>
      <div className="flex flex-row">
        {keyMap[0].map((v, i) => (
          <button
            type="button"
            key={v}
            className={clsx("p-1 min-h-[75px] flex-[1_0_auto]")}
            onClick={() => {
              handleButton(v);
            }}
          >
            <p
              className={clsx(
                "keyboard-button",
                focused && y === 0 && x === i && "border border-focus m-[-1px]",
                v === "esc" && "bg-highlight"
              )}
            >
              {v === "bck" ? (
                <div className="h-stack center-flex gap-3">
                  <ArrowLeftIcon width="1em" height="1em" />
                  <p>Backspace</p>
                </div>
              ) : (
                v.toUpperCase()
              )}
            </p>
          </button>
        ))}
      </div>
      <div className="flex flex-row">
        {keyMap[1].map((v, i) => (
          <button
            type="button"
            key={v}
            className={clsx("p-1 min-h-[75px] flex-[1_0_auto]")}
            onClick={() => {
              handleButton(v);
            }}
          >
            <p
              className={clsx(
                "keyboard-button",
                focused && y === 1 && x === i && "border border-focus m-[-1px]"
              )}
            >
              {v}
            </p>
          </button>
        ))}
      </div>
      <div className="flex flex-row">
        {keyMap[2].map((v, i) => (
          <button
            type="button"
            key={v}
            className={clsx(
              "p-1 min-h-[75px]",
              v === "enter" && "flex-[1.5_0_auto]",
              v !== "enter" && "flex-[1_0_auto]"
            )}
            onClick={() => {
              handleButton(v);
            }}
          >
            <p
              className={clsx(
                "keyboard-button",
                v === "enter" && "bg-green-700",
                focused && y === 2 && x === i && "border border-focus m-[-1px]"
              )}
            >
              {v === "enter" ? (
                <div className="h-stack center-flex gap-3">
                  <ArrowUturnRightIcon
                    width="1em"
                    height="1em"
                    className="rotate-180"
                  />
                  <p>Enter</p>
                </div>
              ) : (
                v
              )}
            </p>
          </button>
        ))}
      </div>
      <div className="flex flex-row">
        {keyMap[3].map((v, i) => (
          <button
            type="button"
            // eslint-disable-next-line react/no-array-index-key
            key={`${v}-${i}`}
            className={clsx("p-1 min-h-[75px] flex-[1_0_auto]")}
            onClick={() => {
              handleButton(v);
            }}
          >
            <p
              className={clsx(
                "keyboard-button",
                focused && y === 3 && x === i && "border border-focus m-[-1px]",
                shift && v === "shf" && "bg-focus"
              )}
            >
              {v === "shf" ? <ArrowUpIcon width="1em" height="1em" /> : v}
            </p>
          </button>
        ))}
      </div>
      <div className="flex flex-row">
        {Array.from(new Set(keyMap[4]).values()).map((v, i) => {
          const isActive = focused && y === 4 && x === i;

          return (
            <button
              type="button"
              key={v}
              className={clsx(
                "p-1 min-h-[75px]",
                v === "spc" && "flex-[5_0_auto]",
                v !== "spc" && "flex-[1.5_0_auto]",
                v === "pst" && "flex-[0_0_75px]",
                v === "clr" && "flex-[0_0_75px]"
              )}
              onClick={() => {
                handleButton(v);
              }}
            >
              <p
                className={clsx(
                  "keyboard-button",
                  v === "done" && "bg-green-700",
                  isActive && "border border-focus m-[-1px]"
                )}
              >
                {v === "spc" && "Space"}
                {v === "done" && "Done"}
                {v === "pst" && <ClipboardIcon width="1em" height="1em" />}
                {v === "clr" && "Clear"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Keyboard;

import {
  ArrowLeftIcon,
  ArrowUpIcon,
  ArrowUturnRightIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import useNavigate from "@hooks/useNavigate";
import { cycleCounter } from "@utils/helper";
import { useUpdateEffect } from "ahooks";
import clsx from "clsx";
import _ from "lodash";
import { useCallback, useEffect, useState } from "react";

type KeyboardProps = BaseProps & {
  focusKey?: string;
  value?: string;
  onClose?: () => void;
  onChange?: (val: string) => void;
  onInputChange?: (val: string) => void;
  placeholder?: string;
  hideInput?: boolean;
  recent?: string[];
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
  `q|w|e|r|t|y|u|i|o|p|p|p|p`.split("|"),
  `a|s|d|f|g|h|j|k|l|enter|enter|enter|enter`.split("|"),
  `lshf|,|z|x|c|v|b|n|m|?|.|rshf|rshf`.split("|"),
  `spc|spc|spc|spc|spc|spc|spc|pst|clr|clr|done|done|done`.split("|"),
];

const keyRender = [
  `esc|1|2|3|4|5|6|7|8|9|0|-|bck`.split("|"),
  `q|w|e|r|t|y|u|i|o|p`.split("|"),
  `a|s|d|f|g|h|j|k|l|enter`.split("|"),
  `lshf|,|z|x|c|v|b|n|m|?|.|rshf`.split("|"),
  `spc|pst|clr|done`.split("|"),
];

const Keyboard = ({
  focusKey,
  onClose,
  onChange,
  placeholder,
  value: initialValue,
  hideInput,
  onInputChange,
  recent,
}: KeyboardProps) => {
  const { x, y, set } = useCoordinate();

  const [value, setValue] = useState("");
  const [shift, setShift] = useState(false);

  const hasRecent = recent && recent.length;
  const baseY = hasRecent ? 1 : 0;

  useEffect(() => {
    if (initialValue) setValue(initialValue);
  }, [initialValue]);

  useUpdateEffect(() => {
    if (onInputChange) {
      onInputChange(value);
    }
  }, [value, onInputChange]);

  const { focused } = useNavigate(focusKey ?? "game-keyboard", {
    actions: {
      left() {
        const isRecent = y === 0 && !!hasRecent;
        if (!isRecent)
          set(cycleCounter(x - 1, 0, keyRender[y - baseY].length - 1), y);
        if (isRecent && recent)
          set(cycleCounter(x - 1, 0, recent.length - 1), y);
      },
      right() {
        const isRecent = y === 0 && !!hasRecent;
        if (!isRecent)
          set(cycleCounter(x + 1, 0, keyRender[y - baseY].length - 1), y);
        if (isRecent && recent)
          set(cycleCounter(x + 1, 0, recent.length - 1), y);
      },
      up() {
        const idx = cycleCounter(y - 1, 0, 4 + baseY);
        // const newX = Math.min(x, keyMap[idx].length - 1);
        // const newX = Math.floor(
        //   (x / newKeyMap[y].length) * newKeyMap[idx].length
        // );
        const isRecent = idx === 0 && !!hasRecent;
        const isRecentOut = y === 0 && !!hasRecent;
        const keySub = hasRecent ? 1 : 0;

        if (idx < 0) return;

        if (isRecent) {
          const newX = _.clamp(
            Math.floor(((x + 1) / keyRender[0].length) * recent.length),
            recent.length - 1
          );

          set(newX, idx);
        } else if (isRecentOut) {
          const newX = _.clamp(
            Math.floor(((x + 1) / recent.length) * keyRender[4].length),
            keyRender[4].length - 1
          );

          set(newX, idx);
        } else {
          const currX = keyMap[idx - keySub + 1].findIndex(
            (key) => key === keyRender[idx - keySub + 1][x]
          );
          const currentKey = keyMap[idx - keySub + 1][currX];
          const currentDuplicates = keyMap[idx - keySub + 1].filter(
            (key) => key === currentKey
          );
          const isCurrDup = currentDuplicates.length > 1;
          const last = keyMap[idx - keySub + 1].lastIndexOf(currentKey);
          const first = keyMap[idx - keySub + 1].indexOf(currentKey);
          const range = last - first;

          const newKey = keyMap[idx - keySub][isCurrDup ? last : currX];
          const duplicates = keyMap[idx - keySub].filter(
            (key) => key === newKey
          );
          const isNewDup = duplicates.length > 1;

          let newX = x;
          if (isNewDup)
            newX = keyRender[idx - keySub].findIndex((key) => key === newKey);
          if (!isNewDup && !isCurrDup)
            newX = keyRender[idx - keySub].findIndex((key) => key === newKey);
          if (!isNewDup && isCurrDup) newX = first + Math.floor(range / 2);
          if (newX === -1) newX = 0;

          set(newX, idx);
        }
      },
      bottom() {
        const idx = cycleCounter(y + 1, 0, 4 + baseY);
        // const newX = Math.min(x, keyMap[idx].length - 1);
        // const max = newKeyMap[idx].length;
        // const newX = Math.floor((x / newKeyMap[y].length) * max);
        const isRecent = idx === 0 && !!hasRecent;
        const isRecentOut = y === 0 && !!hasRecent;
        const keySub = hasRecent ? 1 : 0;

        if (idx > 4 + baseY) return;

        if (isRecent) {
          const newX = _.clamp(
            Math.floor(((x + 1) / keyRender[4].length) * recent.length),
            recent.length
          );

          set(newX, idx);
        } else if (isRecentOut) {
          const newX = _.clamp(
            Math.floor(((x + 1) / recent.length) * keyRender[0].length),
            keyRender[0].length - 1
          );

          set(newX, idx);
        } else {
          const currX = keyMap[idx - keySub - 1].findIndex(
            (key) => key === keyRender[idx - keySub - 1][x]
          );
          const currentKey = keyMap[idx - keySub - 1][currX];
          const currentDuplicates = keyMap[idx - keySub - 1].filter(
            (key) => key === currentKey
          );
          const isCurrDup = currentDuplicates.length > 1;
          const first = keyMap[idx - keySub - 1].indexOf(currentKey);
          const last = keyMap[idx - keySub - 1].lastIndexOf(currentKey);
          const range = last - first;

          const newKey = keyMap[idx - keySub][isCurrDup ? last : currX];
          const duplicates = keyMap[idx - keySub].filter(
            (key) => key === newKey
          );
          const isNewDup = duplicates.length > 1;

          let newX = x;
          if (isNewDup)
            newX = keyRender[idx - keySub].findIndex((key) => key === newKey);
          if (!isNewDup && !isCurrDup)
            newX = keyRender[idx - keySub].findIndex((key) => key === newKey);
          if (!isNewDup && isCurrDup) newX = first + Math.floor(range / 2);
          if (newX === -1) newX = 0;

          set(newX, idx);
        }
      },
      btnRight() {
        handleButton("bck", false);
      },
      btnBottom() {
        const idY = y - baseY;

        if (idY === -1 && recent && recent[x]) {
          handleButton(recent[x], true);
        }
        const mapVal = keyRender[idY][x];

        handleButton(mapVal);
      },
    },
  });

  const handleButton = (val: string, useRecent = false) => {
    if (y === 0 && hasRecent && useRecent) {
      setValue(val);
      return;
    }

    if (val === "bck") {
      setValue((prev) => prev.slice(0, -1));
    } else if (val === "esc") {
      onClose?.();
    } else if (val === "spc") {
      setValue((prev) => `${prev} `);
    } else if (val === "enter") {
      setValue((prev) => `${prev}\n`);
    } else if (val === "rshf" || val === "lshf") {
      setShift((prev) => !prev);
      return;
    } else if (val === "pst") {
      navigator.clipboard.readText().then(setValue);
    } else if (val === "clr") {
      setValue("");
    } else if (val === "done") {
      onChange?.(value);
    } else {
      setValue((prev) => prev + (shift ? val.toUpperCase() : val));
    }

    setShift(false);
  };

  return (
    <div>
      {!!recent?.length && (
        <div className="p-1 gap-2 flex flex-row justify-between w-full">
          {recent.map((val, i) => (
            <button
              type="button"
              key={val}
              className={clsx(
                "p-1 rounded-full min-w-[9vw] border",
                focused && y === 0 && x === i && "border-focus text-focus",
                !(focused && y === 0 && x === i) && "border-text text-text"
              )}
              onClick={() => {
                set(i, 0);
                handleButton(val);
              }}
            >
              <p className="line-clamp-1 text-xl">{val}</p>
            </button>
          ))}
        </div>
      )}
      {!hideInput && (
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
      )}
      <div className="flex flex-row">
        {keyRender[0].map((v, i) => (
          <button
            type="button"
            key={v}
            className={clsx("p-1 min-h-[75px] flex-[1_0_auto]")}
            onClick={() => {
              set(i, baseY + 0);
              handleButton(v);
            }}
          >
            <p
              className={clsx(
                "keyboard-button text-2xl",
                focused &&
                  y === baseY + 0 &&
                  x === i &&
                  "border border-focus m-[-1px]",
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
        {keyRender[1].map((v, i) => (
          <button
            type="button"
            key={v}
            className={clsx("p-1 min-h-[75px] flex-[1_0_auto]")}
            onClick={() => {
              set(i, baseY + 1);
              handleButton(v);
            }}
          >
            <p
              className={clsx(
                "keyboard-button text-2xl",
                focused &&
                  y === baseY + 1 &&
                  x === i &&
                  "border border-focus m-[-1px]"
              )}
            >
              {v}
            </p>
          </button>
        ))}
      </div>
      <div className="flex flex-row">
        {keyRender[2].map((v, i) => (
          <button
            type="button"
            key={v}
            className={clsx(
              "p-1 min-h-[75px]",
              v === "enter" && "flex-[1.5_0_auto]",
              v !== "enter" && "flex-[1_0_auto]"
            )}
            onClick={() => {
              set(i, baseY + 2);
              handleButton(v);
            }}
          >
            <p
              className={clsx(
                "keyboard-button text-2xl",
                v === "enter" && "bg-green-700",
                focused &&
                  y === baseY + 2 &&
                  x === i &&
                  "border border-focus m-[-1px]"
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
        {keyRender[3].map((v, i) => (
          <button
            type="button"
            // eslint-disable-next-line react/no-array-index-key
            key={`${v}-${i}`}
            className={clsx("p-1 min-h-[75px] flex-[1_0_auto]")}
            onClick={() => {
              set(i, baseY + 3);
              handleButton(v);
            }}
          >
            <p
              className={clsx(
                "keyboard-button text-2xl",
                focused &&
                  y === baseY + 3 &&
                  x === i &&
                  "border border-focus m-[-1px]",
                shift && v === "shf" && "bg-focus"
              )}
            >
              {v === "lshf" || v === "rshf" ? (
                <ArrowUpIcon width="1em" height="1em" />
              ) : (
                v
              )}
            </p>
          </button>
        ))}
      </div>
      <div className="flex flex-row">
        {Array.from(new Set(keyMap[4]).values()).map((v, i) => {
          const isActive = focused && y === baseY + 4 && x === i;

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
                set(i, baseY + 4);
                handleButton(v);
              }}
            >
              <p
                className={clsx(
                  "keyboard-button text-2xl",
                  v === "done" && "bg-green-700",
                  isActive && "border border-focus m-[-1px]"
                )}
              >
                {v === "spc" && "Space"}
                {v === "done" && "Done"}
                {v === "pst" && <ClipboardIcon width="1em" height="1em" />}
                {v === "clr" && "CLR"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Keyboard;

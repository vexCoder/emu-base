import Loading from "@components/Utils/Loading";
import {
  CircleStackIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import useNavigate from "@hooks/useNavigate";
import useSearchTGDB from "@hooks/useSearchTGDB";
import { useMainStore } from "@utils/store.utils";
import { useCounter, useInViewport, useMemoizedFn, useToggle } from "ahooks";
import clsx from "clsx";
import dayjs from "dayjs";
import _ from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";

type GameTGDBProps = BaseComponentProps<"div"> & {
  onClose: () => void;
  onKeyboard: (bool: boolean) => void;
  search: string;
  input: string;
};

const GameTGDB = ({
  onKeyboard,
  onClose,
  search,
  input,
  ...rest
}: GameTGDBProps) => {
  const store = useMainStore();
  const [loadingSave, toggle] = useToggle(false);
  const [parent, setParent] = useState<HTMLDivElement>();
  const { loading, data } = useSearchTGDB({
    console: store.console,
    keyword: search,
  });

  const onRefChange = useCallback((node: HTMLDivElement) => {
    if (node === null) {
      // DOM node referenced by ref has been unmounted
    } else {
      setParent(node);
      // DOM node referenced by ref has changed and exists
    }
  }, []);

  const results = data ?? [];

  const [selected, selectionActions] = useCounter(0, {
    min: 0,
    max: results.length,
  });

  const { setFocus, focused } = useNavigate("game-tgdb", {
    actions: {
      up: () => selectionActions.dec(),
      bottom: () => selectionActions.inc(),
      btnRight: () => {
        onClose?.();
        setFocus("game-troubleshoot");
      },
      btnBottom: () => {
        if (selected === 0) {
          onKeyboard(true);
        }
        if (selected > 0) {
          const sel = results[selected - 1];
          if (store.selected?.id && store.console && sel) {
            toggle.set(true);
            window.data
              .setGame(store.selected.id, store.console, {
                description: sel.description,
                publisher: sel.publisher,
                developer: sel.developer,
                released: sel.released,
                cover: sel.cover,
                ratings: sel.ratings,
                genre: sel.genre,
                screenshots: sel.screenshots,
              })
              .then((v) => {
                const lastConsole = store.console;
                store.set({ selected: v, console: undefined });
                setTimeout(() => {
                  store.set({ console: lastConsole });
                  toggle.set(false);
                  onClose?.();
                  setFocus("game-troubleshoot");
                }, 1500);
              });
          }
        }
      },
    },
  });
  return (
    <div {...rest}>
      <div className="h-stack items-center gap-3">
        <CircleStackIcon className="text-text" width="1.5em" height="1.5em" />
        <p className="font-bold text-text text-xl leading-[1em]">Search TGDB</p>
      </div>
      <div
        className={clsx(
          "h-stack gap-2 items-center py-2 px-4 rounded-full bg-secondary/10 mt-4",
          focused && selected === 0 && "border-2 border-focus",
          (!focused || selected !== 0) && "border-2 border-transparent"
        )}
      >
        <MagnifyingGlassIcon
          className={clsx("w-[1.5em] h-[1.5em] text-text")}
        />

        {input && input.length && (
          <p className="text-xl rounded-sm font-bold text-text leading-[1em]">
            {input}
          </p>
        )}

        {(!input || !input?.length) && (
          <p className="text-xl rounded-sm font-bold text-text/20 leading-[1em]">
            Enter Game Title
          </p>
        )}
      </div>

      {(!!loading || loadingSave) && (
        <div className="h-stack gap-3 mt-4">
          <Loading align="center" loading={loading || loadingSave} />
        </div>
      )}
      <div
        ref={onRefChange}
        className="v-stack mt-4 gap-3 max-h-[50vh] overflow-auto scroll1"
      >
        {!loading &&
          !loadingSave &&
          parent &&
          results.map((v, i) => (
            <Result
              key={v.id}
              item={v}
              focused={focused}
              selected={i === selected - 1}
              parent={parent}
              loading={loading}
            />
          ))}
      </div>
    </div>
  );
};

interface ResultProps {
  item: TGDBResult;
  focused: boolean;
  selected: boolean;
  parent: HTMLDivElement;
  loading: boolean;
}

const Result = ({ item, focused, selected, parent, loading }: ResultProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [, ratio] = useInViewport(ref, {
    root: parent,
    threshold: [0, 0.25, 0.5, 0.75, 1],
  });

  const scrollTo = useMemoizedFn(
    _.debounce((y: number) => {
      parent.scrollTo({
        top: y + -120,
        behavior: "smooth",
      });
    })
  );

  useEffect(() => {
    if (focused && selected && typeof ratio === "number" && ratio <= 0.85) {
      scrollTo(ref.current?.offsetTop ?? 0);
    }
  }, [focused, selected, ratio, scrollTo]);

  return (
    <div
      ref={ref}
      className={clsx(
        "relative p-2 rounded-xl overflow-hidden flex-[0_0_auto]",
        (!focused || !selected) && "border border-secondary/50",
        focused && selected && `border border-focus`
      )}
    >
      <Loading loading={loading && focused && selected} align="center" />
      <div
        className={clsx(
          "h-stack gap-3",
          loading && focused && selected && "blur-md"
        )}
      >
        <img
          className="w-[100px] h-auto flex-[0_0_100px] object-cover rounded-md"
          alt={`${item.name} thumbnail yt`}
          src={item.cover}
        />
        <div className="v-stack">
          <div className="h-stack justify-between">
            <p className="w-full text-text text-lg line-clamp-1 font-bold">
              {item.name}
            </p>
          </div>
          <div className="h-stack items-center w-full gap-3 flex-1">
            {item.genre.map((v) => (
              <div key={v}>
                <p className="px-2 rounded-xl bg-secondary font-bold">{v}</p>
              </div>
            ))}
          </div>
          <div className="h-stack w-full gap-2">
            <p className="text-text/60 text-md line-clamp-1">
              {item.developer}
            </p>
            <p className="text-text/60 text-md">•</p>
            <p className="text-text/60 text-md line-clamp-1">
              {item.publisher}
            </p>
            <p className="text-text/60 text-md">•</p>
            <p className="text-text/60 text-md line-clamp-1">
              {dayjs(item.released, "X").format("MMMM DD, YYYY")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameTGDB;

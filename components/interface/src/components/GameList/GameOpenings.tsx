import Loading from "@components/Utils/Loading";
import Spinner from "@elements/Spinner";
import YoutubeAudio from "@elements/YoutubeAudio";
import { MusicalNoteIcon } from "@heroicons/react/24/outline";
import useGetGameOpenings from "@hooks/useGetGameOpenings";
import useNavigate from "@hooks/useNavigate";
import { extractTag } from "@utils/helper";
import { useMainStore } from "@utils/store.utils";
import { useCounter, useInViewport, useMemoizedFn, useToggle } from "ahooks";
import clsx from "clsx";
import dayjs from "dayjs";
import _ from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";

type GameOpeningsProps = BaseComponentProps<"div"> & {
  onClose?: () => void;
};

const GameOpenings = ({ onClose, ...rest }: GameOpeningsProps) => {
  const [parent, setParent] = useState<HTMLDivElement>();
  const [loadingSave, toggle] = useToggle(false);
  const store = useMainStore();
  const { loading, data } = useGetGameOpenings({
    id: store.selected?.id,
    console: store.console,
  });

  const onRefChange = useCallback((node: HTMLDivElement) => {
    if (node === null) {
      // DOM node referenced by ref has been unmounted
    } else {
      setParent(node);
      // DOM node referenced by ref has changed and exists
    }
  }, []);

  const videos = data ?? [];

  const [selected, selectionActions] = useCounter(0, {
    min: 0,
    max: videos.length - 1,
  });

  const { setFocus, focused } = useNavigate("game-troubleshoot-opening", {
    actions: {
      up: () => selectionActions.dec(),
      bottom: () => selectionActions.inc(),
      btnRight: () => {
        if (loadingSave) return;
        onClose?.();
        setFocus("game-troubleshoot");
      },
      btnBottom: () => {
        if (loadingSave) return;
        const sel = videos[selected];
        if (store.selected && store.console && sel) {
          toggle.set(true);
          window.data
            .setGame(store.selected.id, store.console, {
              opening: sel.link,
            })
            .then((v) => {
              store.set({ selected: v });
              toggle.set(false);
              onClose?.();
              setFocus("game-troubleshoot");
            });
        }
      },
    },
  });

  return (
    <div {...rest}>
      {!!loading && (
        <div className="h-stack gap-3">
          <Spinner className="w-[1.5em] h-[1.5em] animate-spin text-gray-600 fill-green-400" />
          <span className="text-secondary">Loading...</span>
        </div>
      )}

      {!loading && (
        <div
          ref={onRefChange}
          className="v-stack gap-3 max-h-[50vh] overflow-auto scroll1"
        >
          <div className="h-stack items-center gap-3">
            <MusicalNoteIcon
              className="text-text"
              width="1.5em"
              height="1.5em"
            />
            <p className="font-bold text-text text-xl leading-[1em]">
              Game Openings
            </p>
          </div>
          {parent &&
            videos.map((v, i) => {
              return (
                <Opening
                  key={v.id}
                  item={v}
                  focused={focused}
                  selected={selected === i}
                  parent={parent}
                  loading={loading}
                />
              );
            })}
        </div>
      )}
    </div>
  );
};

interface OpeningProps {
  item: Video;
  focused: boolean;
  selected: boolean;
  parent: HTMLDivElement;
  loading: boolean;
}

const Opening = ({
  item,
  focused,
  selected,
  parent,
  loading,
}: OpeningProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [, ratio] = useInViewport(ref, {
    root: parent,
    threshold: [0, 0.25, 0.5, 0.75, 1],
  });

  const scrollTo = useMemoizedFn(
    _.debounce((y: number) => {
      parent.scrollTo({
        top: y - 20,
        behavior: "smooth",
      });
    })
  );

  useEffect(() => {
    if (focused && selected && typeof ratio === "number" && ratio <= 0.85) {
      scrollTo(ref.current?.offsetTop ?? 0);
    }
  }, [focused, selected, ratio, scrollTo]);

  const tag = extractTag(item.link);
  return (
    <div
      ref={ref}
      className={clsx(
        "relative p-2 mr-2 rounded-xl overflow-hidden flex-[0_0_auto]",
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
          alt={`${item.title} thumbnail yt`}
          src={item.thumbnail}
        />
        <div className="v-stack justify-between">
          <p className="w-full text-text text-md line-clamp-1 font-bold">
            {item.title}
          </p>
          <div className="h-stack w-full gap-3">
            <p className="text-text/20 text-md">{extractTag(item.link)}</p>
            <p className="justify-between text-text text-md line-clamp-2">
              {dayjs.duration(item.duration, "s").format("mm:ss")}
            </p>
          </div>
        </div>
      </div>
      {tag && focused && selected && <YoutubeAudio tag={tag} />}
    </div>
  );
};

export default GameOpenings;

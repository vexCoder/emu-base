import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DocumentIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import useNavigate from "@hooks/useNavigate";
import {
  useCounter,
  useDeepCompareEffect,
  useInViewport,
  useMount,
} from "ahooks";
import clsx from "clsx";
import _ from "lodash";
import { useEffect, useRef, useState } from "react";

type FilePickerProps = BaseProps &
  OpenPathOptions & {
    focusKey?: string;
    onClose?: () => void;
    onChange?: (p: FileItem) => void;
  };

const FilePicker = ({
  path,
  options,
  focusKey,
  onClose,
  onChange,
}: FilePickerProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const [pathSelected, pathActions] = useCounter(0, {});

  const [menuSelected, menuActions] = useCounter(0, {
    min: 0,
    max: 3,
  });

  const [selected, setSelected] = useState<FileItem>();

  useMount(() => {
    if (path) {
      setSelected({
        path,
        name: path,
        isDirectory: true,
      });
    }
  });

  const [recentIndex, setRecentIndex] = useState(0);
  const [recent, setRecent] = useState<(FileItem | undefined)[]>([]);

  const [files, setFiles] = useState<FileItem[]>([]);

  useDeepCompareEffect(() => {
    window.win.openPath({ path: selected?.path, options }).then((f) => {
      setFiles(f.map((v, i) => ({ ...v, selected: i === 0 })));
      pathActions.set(0);
      if (!selected?.path) {
        setRecent((r) => [...r, undefined]);
        setRecentIndex(recent.length);
      }
    });
  }, [selected, options]);

  const { focused } = useNavigate(focusKey ?? "file-picker", {
    onFocus: () => {
      pathActions.set(0);
      menuActions.set(0);
    },
    autoFocus: true,
    actions: {
      up() {
        pathActions.set((v) => _.clamp(v - 1, 0, files.length));
      },
      bottom() {
        pathActions.set((v) => _.clamp(v + 1, 0, files.length));
      },
      left() {
        if (pathSelected === 0) {
          menuActions.dec();
        }
      },
      right() {
        if (pathSelected === 0) {
          menuActions.inc();
        }
      },
      btnBottom() {
        if (pathSelected === 0) {
          if (menuSelected === 0) {
            const newIndex = _.clamp(recentIndex - 1, 0, recent.length - 1);
            const last = recent[newIndex];
            if (last) onChange?.(last);
            setSelected(last);
            setRecentIndex(newIndex);
          }
          if (menuSelected === 1) {
            const newIndex = _.clamp(recentIndex + 1, 0, recent.length - 1);
            const next = recent[newIndex];
            if (next) onChange?.(next);
            setSelected(next);
            setRecentIndex(newIndex);
          }
          if (menuSelected === 2) {
            const newPath = selected?.path.split("/").slice(0, -1).join("/");
            const fileItem: FileItem | undefined = newPath
              ? {
                  isDirectory: true,
                  name: newPath.split("/").slice(-1)[0],
                  path: newPath,
                }
              : undefined;

            if (fileItem) onChange?.(fileItem);
            if (newPath !== selected?.path) {
              setRecent((r) => [...r, fileItem]);
              setRecentIndex(recent.length);
              setSelected(fileItem);
            }
          }
        } else if (pathSelected >= 1) {
          const sel = files[pathSelected - 1];
          if (sel) {
            onChange?.(sel);
            setRecent((r) => [...r, sel]);
            setRecentIndex(recent.length);
            setSelected(sel);
          }
        }
      },
      ctrlRight() {
        if (options?.folderOnly) {
          if (selected) {
            onChange?.(selected);
            setRecent((r) => [...r, selected]);
            setRecentIndex(recent.length);
            setSelected(selected);
            onClose?.();
          }
        } else if (pathSelected >= 1) {
          const sel = files[pathSelected - 1];
          if (sel) {
            onChange?.(sel);
            setRecent((r) => [...r, sel]);
            setRecentIndex(recent.length);
            setSelected(sel);
            onClose?.();
          }
        }
      },
      btnRight() {
        onClose?.();
      },
    },
  });

  return (
    <div className="v-stack gap-2">
      {/* <div>{recentIndex}</div>
      <pre>{JSON.stringify(recent, null, 2)}</pre> */}
      <h6 className="text-text font-bold tracking-widest">
        {options?.folderOnly ? "Select Directory" : "Select File/Folder"}
      </h6>
      <div className="v-stack border border-gray-200 rounded-xl pb-2 pt-2">
        <div className="h-stack items-center gap-4 px-3 mb-2">
          <ChevronLeftIcon
            className={clsx(
              (menuSelected !== 0 || pathSelected !== 0) && "text-text",
              focused &&
                menuSelected === 0 &&
                pathSelected === 0 &&
                "text-focus"
            )}
            width="1.25em"
            height="1.25em"
          />
          <ChevronRightIcon
            className={clsx(
              (menuSelected !== 1 || pathSelected !== 0) && "text-text",
              focused &&
                menuSelected === 1 &&
                pathSelected === 0 &&
                "text-focus"
            )}
            width="1.25em"
            height="1.25em"
          />
          <ChevronUpIcon
            className={clsx(
              (menuSelected !== 2 || pathSelected !== 0) && "text-text",
              focused &&
                menuSelected === 2 &&
                pathSelected === 0 &&
                "text-focus"
            )}
            width="1.25em"
            height="1.25em"
          />
          <div className="w-full">
            <span
              className={clsx(
                "tracking-widest",
                (menuSelected !== 3 || pathSelected !== 0) && "text-text",
                focused &&
                  menuSelected === 3 &&
                  pathSelected === 0 &&
                  "text-focus"
              )}
            >
              {selected?.path ?? "/"}
            </span>
          </div>
        </div>
        <div ref={ref} className="v-stack max-h-[25vh] overflow-auto scroll2">
          <div>
            {files.map((v, i) => (
              <Item
                item={v}
                pathSelected={pathSelected}
                focused={focused}
                index={i}
                parent={ref.current}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ItemProps {
  item: FileItem;
  pathSelected: number;
  focused: boolean;
  index: number;
  parent: HTMLDivElement | null;
}

const Item = ({ item, pathSelected, focused, index: i, parent }: ItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [, ratio] = useInViewport(ref, {
    threshold: [0, 0.25, 0.5, 0.75, 1],
    root: () => parent,
  });

  useEffect(() => {
    if (
      focused &&
      pathSelected === i + 1 &&
      typeof ratio === "number" &&
      ratio < 1
    ) {
      ref.current?.scrollIntoView();
    }
  }, [focused, pathSelected, i, ratio]);

  return (
    <div ref={ref} key={item.path} className="h-stack gap-3 px-4">
      <div className="flex items-center">
        {item.isDirectory ? (
          <FolderIcon
            className={clsx(
              pathSelected !== i + 1 && "text-text",
              focused && pathSelected === i + 1 && "text-focus"
            )}
            width="1.25em"
            height="1.25em"
          />
        ) : (
          <DocumentIcon
            className={clsx(
              pathSelected !== i + 1 && "text-text",
              focused && pathSelected === i + 1 && "text-focus"
            )}
            width="1.25em"
            height="1.25em"
          />
        )}
      </div>
      <button type="button" className="flex items-center">
        <span
          className={clsx(
            "tracking-widest",
            pathSelected !== i + 1 && "text-text",
            focused && pathSelected === i + 1 && "text-focus"
          )}
        >
          {item.name}
        </span>
      </button>
    </div>
  );
};

export default FilePicker;

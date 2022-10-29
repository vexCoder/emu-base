import ConsoleIcon from "@elements/ConsoleIcon";
import FilePicker from "@elements/FilePicker";
import MenuItem from "@elements/MenuItem";
import Modal from "@elements/Modal";
import {
  ArrowsPointingOutIcon,
  BoltIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog8ToothIcon,
  FolderIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/outline";
import useNavigate from "@hooks/useNavigate";
import { cycleCounter } from "@utils/helper";
import {
  useCounter,
  useDebounceEffect,
  useMount,
  useSetState,
  useToggle,
} from "ahooks";
import clsx from "clsx";
import _ from "lodash";
import { useState } from "react";

interface SettingsProps {
  id?: string;
  onClose: () => void;
}

const Settings = ({ id, onClose }: SettingsProps) => {
  const [selectedPath, setSelectedPath] = useState<string>();
  const [windows, setWindows] = useState<Display[]>([]);
  const [fpOpen, toggleFp] = useToggle(false);

  const [selected, actions] = useCounter(0, {
    min: 0,
    max: 5,
  });

  const [windowSelected, windowActions] = useCounter(0, {
    min: 0,
    max: windows.length - 1,
  });

  const [toEdit, setToEdit] = useState<"backend" | "dump">();
  const [settings, setSettings] = useSetState<
    EditableConsoleSettings & { key?: string; name?: string }
  >({});
  const [global, setGlobal] = useSetState<Partial<AppSettings>>({});

  const refetch = () => {
    if (id) {
      window.data.getConsole(id).then((v) =>
        setSettings({
          key: v.key,
          name: v.name,
          showFps: !!v.retroarch.showFps,
          fullscreen: !!v.retroarch.fullscreen,
          mute: !!v.retroarch.mute,
          turboRate: v.retroarch.turboRate,
          volume: v.retroarch.volume ?? 4,
        })
      );
      window.data.getGlobalSettings().then(setGlobal);
    }
  };

  useMount(() => {
    refetch();
    window.win.getDisplays().then(setWindows);
  });

  const rates = _.range(10).map((v) => 0.5 * (v + 1));
  const volume = _.range(6).map((v) => v);

  useDebounceEffect(
    () => {
      if (id) {
        window.data.setConsoleSettings(id, {
          turboRate: settings.turboRate,
          fullscreen: settings.fullscreen,
          showFps: settings.showFps,
          mute: settings.mute,
          volume: settings.volume,
        });
      }
    },
    [settings],
    { wait: 500 }
  );

  const { focus, focused, setFocus } = useNavigate("game-settings", {
    actions: {
      up() {
        actions.dec();
      },
      bottom() {
        actions.inc();
      },
      btnBottom() {
        if (selected === 0) {
          toggleFp.set(true);
          setSelectedPath(global.pathing?.backend);
          setFocus("game-settings-file-picker");
          setToEdit("backend");
        }

        if (selected === 1) {
          toggleFp.set(true);
          setSelectedPath(global.pathing?.dump);
          setFocus("game-settings-file-picker");
          setToEdit("dump");
        }

        if (selected === 2) {
          const win = windows[windowSelected];
          if (win) {
            window.win.setDisplay(win.id).then(() => {
              window.data.getGlobalSettings().then(setGlobal);
            });
          }
        }

        if (selected === 4) {
          setSettings((prev) => ({ ...prev, mute: !prev.mute }));
        }

        if (selected === 5) {
          setSettings((prev) => ({ ...prev, showFps: !prev.showFps }));
        }

        if (selected === 6) {
          setSettings((prev) => ({ ...prev, fullscreen: !prev.fullscreen }));
        }
      },
      btnRight() {
        setFocus("game-header");
        onClose();
      },
      left() {
        if (!id) return;

        if (selected === 2) {
          windowActions.dec();
        }

        if (selected === 3) {
          const index = rates.indexOf(settings.turboRate ?? 1);
          setSettings({
            turboRate: rates[cycleCounter(index - 1, 0, rates.length - 1)],
          });
        }

        if (selected === 4) {
          const index = volume.indexOf(settings.volume ?? 0);
          setSettings({
            volume: volume[cycleCounter(index - 1, 0, volume.length - 1)],
          });
        }
      },
      right() {
        if (!id) return;

        if (selected === 2) {
          windowActions.inc();
        }

        if (selected === 3) {
          const index = rates.indexOf(settings.turboRate ?? 1);
          setSettings({
            turboRate: rates[cycleCounter(index + 1, 0, rates.length - 1)],
          });
        }

        if (selected === 4) {
          const index = volume.indexOf(settings.volume ?? 0);
          setSettings({
            volume: volume[cycleCounter(index + 1, 0, volume.length - 1)],
          });
        }
      },
    },
  });

  return (
    <>
      <Modal
        duration={0.3}
        open={fpOpen}
        handleClose={() => {
          toggleFp.set(false);
          focus();
        }}
      >
        <FilePicker
          path={selectedPath}
          focusKey="game-settings-file-picker"
          options={{ folderOnly: true }}
          onClose={() => {
            toggleFp.set(false);
            focus();
          }}
          onChange={async (p) => {
            await window.data.setGlobalSettings({
              ...(toEdit === "backend" && {
                backend: p.path,
              }),
              ...(toEdit === "dump" && {
                dump: p.path,
              }),
            });

            refetch();
          }}
        />
      </Modal>
      <div>
        <div className="h-stack items-center gap-3 mb-4">
          <Cog8ToothIcon className={clsx("w-[2em] h-[2em] text-text")} />
          <h6 className="font-bold text-text text-xl leading-[1em]">
            Global Settings
          </h6>
        </div>
        <div className="v-stack gap-3 mb-4">
          {/* <div
            className={clsx(
              "h-stack items-center gap-3 py-2 px-3 border rounded-xl justify-between",
              focused && "border-focus",
              !focused && !selected && "border-secondary/50",
              selected && !focused && "border-highlight"
            )}
          >
            <div className="h-stack items-center gap-3 flex-2">
              <FolderIcon
                width="1.5em"
                height="1.5em"
                className={clsx(
                  focused && "!text-focus",
                  !focused && "!text-text"
                )}
              />
              <p className="font-bold text-text text-sm">Backend Path</p>
            </div>
            <p className="text-text text-sm">{global.pathing?.backend}</p>
          </div> */}
          <MenuItem
            selected={selected === 0}
            focused={focused}
            label="Backend Path"
            icon={FolderIcon}
          >
            {global.pathing?.backend}
          </MenuItem>
          <MenuItem
            selected={selected === 1}
            focused={focused}
            label="Dump Path"
            icon={FolderIcon}
          >
            {global.pathing?.dump}
          </MenuItem>
          <div className="h-stack items-center justify-center gap-3 mt-4">
            {windows.map((v, i) => {
              const winSel = windowSelected === i && selected === 2;
              const isActive = v.id === global.display;
              return (
                <button
                  type="button"
                  className={clsx(
                    "v-stack items-center justify-center",
                    "border-2 rounded-md p-4",
                    "min-w-[140px] min-h-[100px]",
                    !winSel && isActive && "border-highlight",
                    !winSel &&
                      !isActive &&
                      !global.display &&
                      i === 0 &&
                      "border-highlight",
                    winSel && "border-focus",
                    !winSel && "border-text"
                  )}
                >
                  <p className="text-text text-xl line-clamp-1">{`Display ${i}`}</p>
                  <p className="text-text text-lg line-clamp-1">
                    {`${v.size.width}x${v.size.height}`}{" "}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
        {settings.key && (
          <>
            <div className="h-stack items-center gap-3 mb-4">
              <ConsoleIcon
                console={settings.key}
                size="2em"
                className="fill-text"
              />
              <h6 className="font-bold text-text text-xl leading-[1em]">
                Console Settings ({settings.name})
              </h6>
            </div>
            <div className="v-stack gap-3 mb-2">
              <MenuItem
                selected={selected === 3}
                focused={focused}
                label="Turbo Rate"
                icon={BoltIcon}
              >
                <div className="h-stack items-center gap-3">
                  <button type="button">
                    <ChevronLeftIcon
                      width="1em"
                      height="1em"
                      className="text-text"
                    />
                  </button>
                  <p className="text-text text-xl">
                    x{settings.turboRate ?? 1}
                  </p>
                  <button type="button">
                    <ChevronRightIcon
                      width="1em"
                      height="1em"
                      className="text-text"
                    />
                  </button>
                </div>
              </MenuItem>
              <MenuItem
                selected={selected === 4}
                focused={focused}
                label="Volume"
                icon={settings.mute ? SpeakerXMarkIcon : SpeakerWaveIcon}
              >
                <div className="h-stack ml-auto font-bold h-6 py-[0.1rem] gap-1 items-end">
                  {_.range(5).map((v) => (
                    <div
                      key={v}
                      className={clsx(
                        "w-2 bg-green-500",
                        (settings.volume ?? 0) <= v && "bg-red-400",
                        !!settings.mute && "bg-gray-400"
                      )}
                      style={{ height: `${v * 20 + 20}%` }}
                    />
                  ))}
                </div>
              </MenuItem>
              <MenuItem
                selected={selected === 5}
                focused={focused}
                label="Show FPS"
                icon={ChartBarIcon}
              >
                <button type="button">
                  <p
                    className={clsx(
                      "ml-auto font-bold text-xl",
                      settings?.showFps && "text-green-400",
                      !settings?.showFps && "text-red-400"
                    )}
                  >
                    {settings?.showFps ? "On" : "Off"}
                  </p>
                </button>
              </MenuItem>
              <MenuItem
                selected={selected === 6}
                focused={focused}
                label="Fullscreen"
                icon={ArrowsPointingOutIcon}
              >
                <button type="button">
                  <p
                    className={clsx(
                      "ml-auto font-bold text-xl",
                      settings?.fullscreen && "text-green-400",
                      !settings?.fullscreen && "text-red-400"
                    )}
                  >
                    {settings?.fullscreen ? "On" : "Off"}
                  </p>
                </button>
              </MenuItem>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Settings;

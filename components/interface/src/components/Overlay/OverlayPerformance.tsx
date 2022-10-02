import { useOverlayStore } from "@utils/store.utils";
import { useMount } from "ahooks";
import clsx from "clsx";
import { tail } from "ramda";
import { useRef, useState } from "react";

const OverlayPerformance = () => {
  const store = useOverlayStore();
  const recentFpsRef = useRef<number[]>([]);
  const [fps, setFps] = useState(0);
  const [refreshRate, setRefreshRate] = useState(0);

  useMount(() => {
    if (window.emulator) {
      window.emulator.onFPS((val) => {
        setFps(val?.fps ?? 0);
        setRefreshRate(val?.refreshRate ?? 0);
        const { length } = recentFpsRef.current;
        recentFpsRef.current = [
          ...(length > 10 ? tail(recentFpsRef.current) : recentFpsRef.current),
          val?.fps ?? 0,
        ];
      });
    }
  });

  const percent = (fps / refreshRate) * 100;
  const ave = recentFpsRef.current.length
    ? recentFpsRef.current.reduce((a, b) => a + b) / recentFpsRef.current.length
    : 0;

  if (!store.fps) return null;
  return (
    <div className="fixed bottom-0 left-0 w-full px-2 font-bold text-text rounded-xl z-[100]">
      {/* {store.route}
      <br />
      {store.focus}
      <br />
      {store.stateFocus}
      <br />
      {store.stateFocusDecide}
      <br /> */}
      <p className="h-stack gap-2 justify-between text-xs">
        <p className="text-text/20 font-normal">{store.id}</p>
        <p className="h-stack gap-2">
          <p>
            <span className="text-yellow-400/40">FPS</span>&nbsp;
            <span
              className={clsx(
                percent > 80 && "text-green-400/40",
                percent > 60 && "text-yellow-400/40",
                percent < 60 && "text-red-400/40"
              )}
            >
              {`${fps} (${percent.toFixed(0)}%)`}
            </span>
          </p>
          <p>
            <span className="text-yellow-400/40">AVE</span>&nbsp;
            <span className="text-text/40">{`${ave.toFixed(0)}`}</span>
          </p>
        </p>
      </p>
    </div>
  );
};

export default OverlayPerformance;

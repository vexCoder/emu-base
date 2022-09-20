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
    <div className="w-[250px] h-[75px] font-bold text-text rounded-xl z-[100]">
      <p className="text-xs">
        <span className="text-yellow-400">FPS</span>&nbsp;
        <span
          className={clsx(
            percent > 80 && "text-green-400",
            percent > 60 && "text-yellow-400",
            percent < 60 && "text-red-400"
          )}
        >
          {`${fps} (${percent.toFixed(0)}%)`}
        </span>
        <br />
        <span className="text-yellow-400">AVE</span>&nbsp;
        {`${ave.toFixed(0)}`}
      </p>
    </div>
  );
};

export default OverlayPerformance;

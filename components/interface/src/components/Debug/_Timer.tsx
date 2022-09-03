import { createTimer } from "@utils/helper";
import { useMount, useUpdate } from "ahooks";
import { useRef } from "react";

const TimerDebug = () => {
  const ref = useRef(0);
  const upd = useUpdate();

  useMount(() => {
    const stop = createTimer(() => {
      ref.current++;
      upd();
    });

    setTimeout(() => {
      stop();
    }, 5000);
  });

  return <h1>{ref.current}</h1>;
};

export default TimerDebug;

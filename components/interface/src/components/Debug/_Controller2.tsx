import useGamePad from "@hooks/useGamePad";
import { useLatest } from "ahooks";
import { useState } from "react";

const ControllerDebug = () => {
  const [state, setState] = useState(0);
  const latestRef = useLatest(state);
  useGamePad({
    events: {
      D_PAD_LEFT: () => {
        setState(latestRef.current - 1);
      },
      D_PAD_RIGHT: () => {
        setState(latestRef.current + 1);
      },
    },
  });

  return <div className="text-text">{state}</div>;
};

export default ControllerDebug;

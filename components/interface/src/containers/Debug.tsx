import useGamePad from "@hooks/useGamePad";
import { useInterval, useWhyDidYouUpdate } from "ahooks";
import { useState } from "react";

const Debug = () => {
  const [left, setLeft] = useState(0);
  const [top, setTop] = useState(0);
  const [speed, setSpeed] = useState(500);
  const [displace, setDisplacement] = useState({
    x: 0,
    y: 0,
  });

  const { connected, buttonState, gamepad, axisState } = useGamePad({
    deadZone: {
      JOYSTICK_RIGHT_HORIZONTAL: 0.5,
      JOYSTICK_RIGHT_VERTICAL: 0.5,
      JOYSTICK_LEFT_HORIZONTAL: 0.5,
      JOYSTICK_LEFT_VERTICAL: 0.5,
    },
    events: {
      D_PAD_LEFT: (pressed) => setLeft(pressed ? -1 : 0),
      D_PAD_RIGHT: (pressed) => setLeft(pressed ? 1 : 0),
      D_PAD_UP: (pressed) => setTop(pressed ? -1 : 0),
      D_PAD_DOWN: (pressed) => setTop(pressed ? 1 : 0),
      BUMPER_LEFT: () => setSpeed((prev) => prev - 100),
      BUMPER_RIGHT: () => setSpeed((prev) => prev + 100),
    },
  });

  useInterval(() => {
    setDisplacement((prev) => ({
      x: left !== 0 ? prev.x + (speed / 100) * left : prev.x,
      y: top !== 0 ? prev.y + (speed / 100) * top : prev.y,
    }));
  }, 100);

  useWhyDidYouUpdate("Debug", { buttonState });

  return (
    <div>
      <h1>{connected ? "Connected" : "Disconnected"}</h1>
      <h2>{gamepad?.id}</h2>
      <pre>{gamepad?.timestamp}</pre>
      <pre>{JSON.stringify(buttonState, null, 2)}</pre>
      <pre>{JSON.stringify(axisState, null, 2)}</pre>
      <div
        style={{
          width: 50,
          height: 50,
          position: "absolute",
          left: `calc(50% + ${displace.x}px)`,
          top: `calc(50% + ${displace.y}px)`,
          transition: "all 0.1s ease-in-out",
          transform: "translate(-50%, -50%)",
          background: "red",
        }}
      />
    </div>
  );
};

export default Debug;

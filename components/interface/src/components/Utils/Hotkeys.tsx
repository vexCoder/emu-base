import useGamePad from "@hooks/useGamePad-01";
import { useMemoizedFn, useToggle } from "ahooks";
import { head, move } from "ramda";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

export const Hotkeys = () => {
  const routesRef = useRef(["/", "/debug"]);
  const [show, actions] = useToggle(false);
  const navigate = useNavigate();

  const showHotkeyFn = useMemoizedFn((pressed) => {
    actions.set(!!pressed);
  });

  const moveNext = useMemoizedFn((pressed) => {
    if (pressed && routesRef.current) {
      const last = routesRef.current.length - 1;
      const cycleArr = move(0, last, routesRef.current);
      routesRef.current = cycleArr;
      navigate(head(cycleArr) ?? "/", {
        replace: true,
      });
    }
  });

  useGamePad({
    deadZone: {
      JOYSTICK_RIGHT_HORIZONTAL: 0.5,
      JOYSTICK_RIGHT_VERTICAL: 0.5,
      JOYSTICK_LEFT_HORIZONTAL: 0.5,
      JOYSTICK_LEFT_VERTICAL: 0.5,
    },
    events: {
      BUTTON_CONTROL_LEFT: showHotkeyFn,
      "TRIGGER_LEFT+TRIGGER_RIGHT": moveNext,
    },
  });

  if (!show) return null;
  return (
    <div className="absolute flex gap-1 top-10 left-10">
      <div>Test</div>
    </div>
  );
};

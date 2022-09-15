import MountSubscriber from "@providers/MountSubscriber";
import { useMount } from "ahooks";
import { useState } from "react";
import ReactDOM from "react-dom/client";
import "virtual:fonts.css";

const rootElement =
  document.getElementById("root") ?? document.createElement("body");

const root = ReactDOM.createRoot(rootElement);

const Overlay = () => {
  return (
    <MountSubscriber>
      <div className="w-full h-full bg-lime-500/40 p-4">
        <div className="w-[250px] h-[75px] bg-primary text-text rounded-xl p-4">
          Test <FPS />
        </div>
      </div>
    </MountSubscriber>
  );
};

const FPS = () => {
  const [fps, setFps] = useState(0);

  useMount(() => {
    if (window.data) {
      window.data.onFPS((val: any) => {
        setFps(val);
      });
    }
  });

  return (
    <p>
      {fps} {window.data.onFPS.length}
    </p>
  );
};

root.render(<Overlay />);

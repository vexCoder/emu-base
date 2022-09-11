import MountSubscriber from "@providers/MountSubscriber";
import ReactDOM from "react-dom/client";
import "virtual:fonts.css";

const rootElement =
  document.getElementById("root") ?? document.createElement("body");

const root = ReactDOM.createRoot(rootElement);

const Overlay = () => {
  return (
    <MountSubscriber>
      <div className="w-full h-full bg-transparent">
        <div className="w-[250px] h-[75px] bg-primary text-text">Test</div>
      </div>
    </MountSubscriber>
  );
};

root.render(<Overlay />);

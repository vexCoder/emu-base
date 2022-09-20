import Overlay from "@components/Overlay/Overlay";
import ReactDOM from "react-dom/client";
import "virtual:fonts.css";

const rootElement =
  document.getElementById("root") ?? document.createElement("body");

const root = ReactDOM.createRoot(rootElement);

root.render(<Overlay />);

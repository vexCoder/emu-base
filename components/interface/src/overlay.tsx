import Overlay from "@components/Overlay/Overlay";
import ReactDOM from "react-dom/client";
import "./base.css";
import "virtual:fonts.css";

const rootElement =
  document.getElementById("root") ?? document.createElement("body");

rootElement.style.width = "100vw";
rootElement.style.height = "100vh";

const root = ReactDOM.createRoot(rootElement);

root.render(<Overlay />);

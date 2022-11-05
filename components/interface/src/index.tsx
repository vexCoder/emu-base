import ReactDOM from "react-dom/client";
import "virtual:fonts.css";
import "./base.css";
import duration from "dayjs/plugin/duration";
import dayjs from "dayjs";
import App from "./App";

dayjs.extend(duration);

const rootElement =
  document.getElementById("root") ?? document.createElement("body");

const root = ReactDOM.createRoot(rootElement);

root.render(<App />);

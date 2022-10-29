import ReactDOM from "react-dom/client";
import "virtual:fonts.css";
import "./base.css";
import App from "./App";

const rootElement =
  document.getElementById("root") ?? document.createElement("body");

const root = ReactDOM.createRoot(rootElement);

root.render(<App />);

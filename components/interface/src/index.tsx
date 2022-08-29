import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "virtual:fonts.css";

const rootElement =
  document.getElementById("root") ?? document.createElement("body");

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

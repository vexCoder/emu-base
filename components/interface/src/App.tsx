/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/button-has-type */
import { Hotkeys } from "@components/Utils/Hotkeys";
import Debug from "@containers/Debug";
import Main from "@containers/Main";
import MountSubscriber from "@providers/MountSubscriber";
import { HashRouter, Route, Routes } from "react-router-dom";

const App = () => {
  return (
    <MountSubscriber>
      <HashRouter>
        <Hotkeys />
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/debug" element={<Debug />} />
        </Routes>
      </HashRouter>
    </MountSubscriber>
  );
};

export default App;

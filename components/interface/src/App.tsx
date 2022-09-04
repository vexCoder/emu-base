/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/button-has-type */
import ControllerDebug from "@components/Debug/_Controller";
import ControllerDebug2 from "@components/Debug/_Controller2";
import TimerDebug from "@components/Debug/_Timer";
import { Hotkeys } from "@components/Utils/Hotkeys";
import Debug from "@containers/Debug";
import Main from "@containers/Main";
import MountSubscriber from "@providers/MountSubscriber";
import { AnimatePresence } from "framer-motion";
import { HashRouter, Route, Routes } from "react-router-dom";

const App = () => {
  return (
    <MountSubscriber>
      <HashRouter>
        <Hotkeys />
        <AnimatePresence>
          <Routes>
            <Route path="/" element={<Main />} />
            <Route path="debug" element={<Debug />}>
              <Route path="controller" element={<ControllerDebug />} />
              <Route path="controller2" element={<ControllerDebug2 />} />
              <Route path="timer" element={<TimerDebug />} />
            </Route>
          </Routes>
        </AnimatePresence>
      </HashRouter>
    </MountSubscriber>
  );
};

export default App;

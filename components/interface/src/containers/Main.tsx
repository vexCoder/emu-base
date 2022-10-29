import GameList from "@components/GameList/GameList";
import Header from "@components/Header/Header";
import { useMainStore } from "@utils/store.utils";
import { useMount } from "ahooks";
import { AnimatePresence, motion } from "framer-motion";

const Main = () => {
  const store = useMainStore();

  useMount(() => {
    window.emulator.onDetach(() => {
      store.eject();
    });
  });

  return (
    <div className="bg-primary h-[100vh] flex flex-col items-start">
      <AnimatePresence>
        {store.disc && (
          <motion.div
            key="game-cover"
            className="fixed top-0 left-0 w-full h-full bg-black"
            initial={{ opacity: 0, zIndex: -1 }}
            animate={{ opacity: 1, zIndex: 999 }}
            exit={{ opacity: 0, zIndex: -1 }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!store.disc && (
          <motion.div
            key="game-main"
            className="h-full w-full flex flex-col items-start"
            initial={{ opacity: 0, zIndex: -1 }}
            animate={{ opacity: 1, zIndex: 0 }}
            exit={{ opacity: 0, zIndex: -1 }}
          >
            <Header />
            <GameList />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Main;

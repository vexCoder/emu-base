import GameList from "@components/GameList/GameList";
import { MainStore, useMainStore } from "@utils/store.utils";
import { AnimatePresence, motion } from "framer-motion";
import { pick } from "ramda";
import Play from "./Play";

const selector = (v: MainStore) => pick(["disc"], v);

const Main = () => {
  const store = useMainStore(selector);

  return (
    <div className="flex flex-col items-start">
      <AnimatePresence>
        {!store.disc && (
          <motion.div
            key="game-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: store.disc ? 0.5 : 0, duration: 0.5 }}
          >
            <GameList />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {store.disc && (
          <motion.div
            key="game-play"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: !store.disc ? 0.5 : 0, duration: 0.5 }}
          >
            <Play />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Main;

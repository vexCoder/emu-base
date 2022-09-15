import GameList from "@components/GameList/GameList";

const Main = () => {
  return (
    <div className="flex flex-col items-start">
      <GameList />
      {/* <AnimatePresence>
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
      </AnimatePresence> */}
    </div>
  );
};

export default Main;

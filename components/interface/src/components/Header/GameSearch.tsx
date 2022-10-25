import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useMainStore } from "@utils/store.utils";
import clsx from "clsx";

const GameSearch = () => {
  const store = useMainStore();

  return (
    <div className="h-stack gap-2 items-center z-40">
      <MagnifyingGlassIcon className={clsx("w-[1.5em] h-[1.5em] text-text")} />
      {store.search && store.search.length && (
        <p className="text-lg rounded-sm font-bold text-text leading-[1em]">
          {store.search}
        </p>
      )}

      {(!store.search || !store.search?.length) && (
        <p className="text-lg rounded-sm font-bold text-text/20 leading-[1em]">
          Enter Game Title
        </p>
      )}
    </div>
  );
};

export default GameSearch;

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

interface GameSearchProps {
  value?: string;
}

const GameSearch = ({ value }: GameSearchProps) => {
  return (
    <div className="h-stack gap-2 items-center z-40">
      <MagnifyingGlassIcon className={clsx("w-[1.5em] h-[1.5em] text-text")} />
      {value && value.length && (
        <p className="text-xl rounded-sm font-bold text-text leading-[1em]">
          {value}
        </p>
      )}

      {(!value || !value?.length) && (
        <p className="text-xl rounded-sm font-bold text-text/20 leading-[1em]">
          Enter Game Title
        </p>
      )}
    </div>
  );
};

export default GameSearch;

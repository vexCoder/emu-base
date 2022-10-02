import ConsoleIcon from "@elements/ConsoleIcon";
import { Cog8ToothIcon, XCircleIcon } from "@heroicons/react/24/outline";
import useNavigate from "@hooks/useNavigate";
import { useMainStore } from "@utils/store.utils";
import { useCounter } from "ahooks";
import clsx from "clsx";

const Header = () => {
  const store = useMainStore();
  const [btnSelected, navActions] = useCounter(0, {
    min: 0,
    max: 2,
  });

  const focused = useNavigate("game-header", {
    actions: {
      left() {
        navActions.dec();
      },
      right() {
        navActions.inc();
      },
      bottom(setFocus) {
        setFocus("game-list");
      },
    },
  });

  return (
    <div className="h-stack justify-between p-4 w-full">
      <button type="button">
        <ConsoleIcon
          console={store.console}
          size="3em"
          className={clsx(
            focused && btnSelected === 0 && "!fill-focus ",
            (!focused || btnSelected !== 0) && "!fill-text"
          )}
        />
      </button>

      <div className="h-stack gap-4">
        <button type="button">
          <Cog8ToothIcon
            className={clsx(
              "w-[3em] h-[3em] text-text",
              focused && btnSelected === 1 && "!text-focus ",
              (!focused || btnSelected !== 1) && "!text-text"
            )}
          />
        </button>
        <button type="button">
          <XCircleIcon
            className={clsx(
              "w-[3em] h-[3em] text-text",
              focused && btnSelected === 2 && "!text-focus ",
              (!focused || btnSelected !== 2) && "!text-text"
            )}
          />
        </button>
      </div>
    </div>
  );
};

export default Header;

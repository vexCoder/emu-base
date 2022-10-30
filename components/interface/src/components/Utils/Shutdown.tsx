import Modal from "@elements/Modal";
import Spinner from "@elements/Spinner";
import useGetShutdown from "@hooks/useGetShutdown";
import useNavigate from "@hooks/useNavigate";
import { useMainStore } from "@utils/store.utils";
import { useMount } from "ahooks";

type ShutdownProps = {
  lastFocused?: string;
  shutdown: boolean;
  onClose: () => void;
};

const ShutdownContent = ({ shutdown, onClose, lastFocused }: ShutdownProps) => {
  const { timeout } = useGetShutdown({
    pause: !shutdown,
  });

  useMount(() => {
    if (shutdown) {
      window.win.shutdown(10000);
    }
  });

  const handleClose = () => {
    setFocus(lastFocused ?? "game-list");
    onClose();
  };

  const { setFocus } = useNavigate("shutdown", {
    actions: {
      ctrlRight: () => {
        window.win.shutdown(undefined, true).then(handleClose);
      },
    },
  });

  return (
    <div className="h-stack items-center gap-4">
      <Spinner className="w-[2rem] h-[2rem] animate-spin text-gray-600 fill-green-400" />
      <div>
        <p className="text-2xl font-bold text-text leading-[1em]">
          Shutting Down in {timeout}s
        </p>
        <p className="text-md text-text/50 mt-2 leading-[1em]">
          Press <span>Start</span> to cancel
        </p>
      </div>
    </div>
  );
};

const Shutdown = () => {
  const { shutdown, set, lastFocused } = useMainStore();
  return (
    <Modal open={!!shutdown}>
      <ShutdownContent
        shutdown={!!shutdown}
        onClose={() => set({ shutdown: false })}
        lastFocused={lastFocused}
      />
    </Modal>
  );
};

export default Shutdown;

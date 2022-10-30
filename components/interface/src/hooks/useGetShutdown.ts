import { useRequest } from "ahooks";

interface UseGetShutdownParams {
  interval?: number;
  pause?: boolean;
}

const getShutdown = async () => {
  const d = await window.win.isShuttingDown();
  return d;
};

const useGetShutdown = ({ interval = 1000, pause }: UseGetShutdownParams) => {
  const res = useRequest(() => getShutdown(), {
    pollingInterval: pause ? undefined : interval,
  });

  return res.data ?? { abort: false, timeout: 0 };
};

export default useGetShutdown;

import { useRequest } from "ahooks";

interface UseGetGamesParams {
  serial: string;
}

const getDownloadProgress = async (serial: string) => {
  const d = await window.data.getDownloadProgress(serial);
  return d;
};

const useGetDownloadProgress = ({ serial }: UseGetGamesParams) => {
  const res = useRequest(() => getDownloadProgress(serial), {
    refreshDeps: [serial],
  });

  return res;
};

export default useGetDownloadProgress;

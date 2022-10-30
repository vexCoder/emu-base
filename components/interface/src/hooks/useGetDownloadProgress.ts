import { useRequest } from "ahooks";

interface UseGetGamesParams {
  serial: string;
  console: string;
  id: string;
}

const getDownloadProgress = async (
  serial: string,
  console: string,
  id: string
) => {
  const d = await window.data.getDownloadProgress(serial, console, id);
  return d;
};

const useGetDownloadProgress = ({ serial, console, id }: UseGetGamesParams) => {
  const res = useRequest(() => getDownloadProgress(serial, console, id), {
    refreshDeps: [serial],
  });

  return res;
};

export default useGetDownloadProgress;

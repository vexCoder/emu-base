import { useRequest } from "ahooks";

interface UseGetGamesParams {
  id?: string;
  console: string;
}

const getGameRegionSettings = async (id: string, cons: string) => {
  if (!cons) throw new Error("Please provide a console");
  const d = await window.data.getGameRegionSettings(id, cons);
  return d;
};

const useGetGameRegionSettings = ({ id, console: cons }: UseGetGamesParams) => {
  const res = useRequest(() => getGameRegionSettings(id ?? "", cons), {
    refreshDeps: [id, cons],
  });

  return res;
};

export default useGetGameRegionSettings;

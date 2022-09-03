import { useRequest } from "ahooks";

interface UseGetGamesParams {
  id?: string;
  console: string;
}

const getGameFiles = async (id: string, cons: string) => {
  if (!cons) throw new Error("Please provide a console");
  const d = await window.data.getGameFiles(id, cons);
  return d;
};

const useGetGameFiles = ({ id, console: cons }: UseGetGamesParams) => {
  const res = useRequest(() => getGameFiles(id ?? "", cons), {
    refreshDeps: [id, cons],
  });

  return res;
};

export default useGetGameFiles;

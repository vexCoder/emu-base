import { useRequest } from "ahooks";

interface UseGetGameParams {
  id?: string;
  console: string;
}

const getGame = async (id?: string, cons?: string) => {
  if (!cons) throw new Error("Please provide a console");
  if (!id) return null;
  const d = await window.data.getGame(id, cons);
  return d;
};

const useGetGame = ({ console: cons, id }: UseGetGameParams) => {
  const res = useRequest(() => getGame(id, cons), {
    refreshDeps: [id, cons],
  });

  return res;
};

export default useGetGame;

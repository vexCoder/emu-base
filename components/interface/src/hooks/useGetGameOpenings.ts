import { useRequest } from "ahooks";

interface UseGetGameOpeningsParams {
  id?: string;
  console: string;
}

const getGameOpenings = async (id?: string, cons?: string) => {
  if (!cons) throw new Error("Please provide a console");
  if (!id) return null;
  const d = await window.data.getOpenings(id, cons);
  return d;
};

const useGetGameOpenings = ({
  console: cons,
  id,
}: UseGetGameOpeningsParams) => {
  const res = useRequest(() => getGameOpenings(id, cons), {
    refreshDeps: [id, cons],
    cacheKey: `game-openings-${id}-${cons}`,
    cacheTime: 1000 * 60 * 60 * 24,
  });

  return res;
};

export default useGetGameOpenings;

import { useRequest } from "ahooks";

interface UseSearchTGDBParams {
  keyword?: string;
  console: string;
}

const searchTGDB = async (keyword?: string, cons?: string) => {
  if (!cons) throw new Error("Please provide a console");
  if (!keyword) return null;
  const d = await window.data.searchTGDB(keyword, cons);
  return d;
};

const useSearchTGDB = ({ console: cons, keyword }: UseSearchTGDBParams) => {
  const res = useRequest(() => searchTGDB(keyword, cons), {
    refreshDeps: [keyword, cons],
    cacheKey: `game-${keyword}-${cons}`,
    cacheTime: 1000 * 60 * 60 * 24,
  });

  return res;
};

export default useSearchTGDB;

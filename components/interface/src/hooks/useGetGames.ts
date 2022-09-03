import { useRequest } from "ahooks";

interface UseGetGamesParams {
  keyword: string;
  console: string;
  limit?: number;
  page?: number;
}

const getGames = async (
  keyword: string,
  cons: string,
  page: number,
  limit: number
) => {
  if (!cons) throw new Error("Please provide a console");
  const d = await window.data.getGames(keyword, cons, limit, page);
  return d;
};

const useGetGames = ({
  console: cons,
  keyword,
  limit = 5,
  page = 0,
}: UseGetGamesParams) => {
  const res = useRequest(() => getGames(keyword, cons, limit, page), {
    refreshDeps: [keyword, cons, limit, page],
  });

  return res;
};

export default useGetGames;

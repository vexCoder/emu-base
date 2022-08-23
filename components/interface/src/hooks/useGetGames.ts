import useApi from "./useApi";

interface UseGetGamesParams {
  keyword: string;
  console: string;
  limit?: number;
  page?: number;
}

const useGetGames = ({
  console: cns,
  keyword,
  limit,
  page,
}: UseGetGamesParams) => {
  const getGames = async () => {
    if (!cns) throw new Error("Please provide a console");
    const d = await window.data.getGames(keyword, cns, limit, page);
    return d;
  };

  const res = useApi(getGames, []);

  return res;
};

export default useGetGames;

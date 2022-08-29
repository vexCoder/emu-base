import { scoreMatchStrings } from "@utils/helper";
import { useEffect } from "react";
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
  limit = Infinity,
  page = 0,
}: UseGetGamesParams) => {
  // {
  //   keyword: "final fantasy",
  //   console: "ps1",
  //   limit: store.count + 4,
  //   page,
  // }

  const getGames = async () => {
    if (!cns) throw new Error("Please provide a console");
    const d = await window.data.getGames(cns);
    return d;
  };

  const res = useApi(getGames, []);

  useEffect(() => {
    if (res.data) {
      res.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cns]);

  const parsed = res.data;

  const filter = parsed.filter(({ official }) => {
    return scoreMatchStrings(official, keyword) > 0.5;
  });

  const arr: ConsoleGameData[] = filter.slice(page, page + limit);

  return { ...res, data: arr };
};

export default useGetGames;

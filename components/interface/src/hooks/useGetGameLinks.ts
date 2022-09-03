import { useRequest } from "ahooks";

interface UseGetGamesParams {
  keyword: string;
  tags: string[];
  console: string;
}

const getGameLinks = async (keyword: string, tags: string[], cons: string) => {
  if (!cons) throw new Error("Please provide a console");
  const d = await window.data.getGameLinks(keyword, tags, cons);
  return d;
};

const useGetGameLinks = ({
  keyword,
  tags,
  console: cons,
}: UseGetGamesParams) => {
  const res = useRequest(() => getGameLinks(keyword, tags, cons), {
    refreshDeps: [keyword, JSON.stringify(tags), cons],
  });

  return res;
};

export default useGetGameLinks;

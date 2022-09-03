import { useRequest } from "ahooks";
import { useState } from "react";

const setGameLinks = async (
  id: string,
  serials: string[],
  links: string[],
  cons: string
) => {
  if (!cons) throw new Error("Please provide a console");
  const d = await window.data.setGameLinks(id, serials, links, cons);
  return d;
};

const useSetGameLinks = () => {
  const [data, setData] = useState<ConsoleGameData>();
  const { loading, run: execute } = useRequest(setGameLinks, {
    manual: true,
    onSuccess: (result) => {
      if (result) setData(result);
    },
  });

  return [data, execute, loading] as [ConsoleGameData, typeof execute, boolean];
};

export default useSetGameLinks;

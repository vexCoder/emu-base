import { useRequest } from "ahooks";
import { useState } from "react";

const setGameLinks = async (
  id: string,
  serials: string[],
  links: ParsedLinks[],
  cons: string
) => {
  if (!cons) throw new Error("Please provide a console");
  const d = await window.data.setGameLinks(id, serials, links, cons);
  return d;
};

const useSetGameLinks = () => {
  const [data, setData] = useState<{ [key: string]: string }>();
  const { loading, run: execute } = useRequest(setGameLinks, {
    manual: true,
    onSuccess: (result) => {
      if (result) setData(result);
    },
  });

  return [data, execute, loading] as [
    { [key: string]: string },
    typeof execute,
    boolean
  ];
};

export default useSetGameLinks;

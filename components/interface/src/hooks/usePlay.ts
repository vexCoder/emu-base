import { useRequest } from "ahooks";
import { useState } from "react";

const playGame = async (serial: string, id: string, cons: string) => {
  if (!cons) throw new Error("Please provide a console");
  const d = await window.data.play(serial, id, cons);
  return d;
};

const usePlay = () => {
  const [data, setData] = useState<boolean>();
  const { loading, run: execute } = useRequest(playGame, {
    manual: true,
    onSuccess: (result) => {
      if (result) setData(result);
    },
  });

  return [data, execute, loading] as [boolean, typeof execute, boolean];
};

export default usePlay;

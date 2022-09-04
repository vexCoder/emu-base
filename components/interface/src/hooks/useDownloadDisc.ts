import { useRequest } from "ahooks";
import { useState } from "react";

const downloadDisc = async (serial: string, id: string, cons: string) => {
  if (!cons) throw new Error("Please provide a console");
  const d = await window.data.downloadDisc(serial, id, cons);
  return d;
};

const useDownloadDisc = () => {
  const [data, setData] = useState<boolean>();
  const { loading, run: execute } = useRequest(downloadDisc, {
    manual: true,
    onSuccess: (result) => {
      if (result) setData(result);
    },
  });

  return [data, execute, loading] as [boolean, typeof execute, boolean];
};

export default useDownloadDisc;

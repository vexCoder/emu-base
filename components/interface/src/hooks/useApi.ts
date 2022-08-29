import { useAsyncEffect, useToggle } from "ahooks";
import { useState } from "react";

type ExtractReturn<T extends () => Promise<any> | any> = InferPromise<
  ReturnType<T>
>;

const useApi = <T extends () => Promise<any> | any>(
  callback: T,
  initial: ExtractReturn<T>
) => {
  const [data, setData] = useState(initial);
  const [error, setError] = useState<Error>();
  const [loading, actions] = useToggle<boolean>();
  const [timestamp, setTimestamp] = useState(new Date().toISOString());
  // eslint-disable-next-line func-names
  const fetch = async function* () {
    try {
      actions.set(true);
      const res = await callback();
      yield;
      setData(res);
      actions.set(false);
    } catch (err) {
      setError(err as Error);
    }
  };

  useAsyncEffect(fetch, [timestamp]);

  return {
    data,
    refetch: () => setTimestamp(new Date().toISOString()),
    loading,
    error,
  };
};

export default useApi;

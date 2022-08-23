import {
  useAsyncAbortable,
  useMountEffect,
  useUnmountEffect,
} from "@react-hookz/web";

type ExtractReturn<T extends () => Promise<any> | any> = InferPromise<
  ReturnType<T>
>;

const useApi = <T extends () => Promise<any> | any>(
  callback: T,
  initial: ExtractReturn<T>
) => {
  const fetch = () => callback();

  const [state, actions] = useAsyncAbortable(fetch, initial);

  useMountEffect(() => {
    actions.execute();
  });

  useUnmountEffect(() => {
    actions.abort();
  });

  return {
    data: state.result,
    refetch: actions.execute,
    loading: state.status === "loading",
    error: state.error,
  };
};

export default useApi;

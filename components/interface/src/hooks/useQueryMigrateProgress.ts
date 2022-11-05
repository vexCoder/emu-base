import { useRequest } from "ahooks";

interface UseQueryMigrateProgressParams {
  path: string;
}

const queryMigrateProgress = async (path: string) => {
  const d = await window.data.queryMigrateProgress(path);
  return d;
};

const useQueryMigrateProgress = ({ path }: UseQueryMigrateProgressParams) => {
  const res = useRequest(() => queryMigrateProgress(path), {
    refreshDeps: [path],
  });

  return res;
};

export default useQueryMigrateProgress;

import { WinApi } from "./api/win";

const main = async () => {
  const resolver = new WinApi.Resolver();
  console.log(await resolver.getPathFilesAndFolder({}));
};

main();

import { compareTwoStrings } from "string-similarity";

const main = async () => {
  const str1 = "Suikoden V";
  const str2 = "Suikpden V";

  console.log(compareTwoStrings(str1, str2));
};

main();

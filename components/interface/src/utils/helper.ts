import * as R from "ramda";
import { findBestMatch } from "string-similarity";

export const scoreMatchStrings = (
  src: string,
  target: string
  // outliers: number = 0.25
) => {
  const keywords = R.pipe(
    R.toLower,
    R.split(" "),
    R.map(R.trim),
    R.map(R.replace(/([^a-z0-9])/g, ""))
  )(target);

  // const bestMatch = (src2: string) => R.curry(findBestMatch)(src2)(keywords);

  const split = R.pipe(
    R.split(" "),
    R.map(R.toLower),
    R.map(R.replace(/([^a-z0-9])/g, "")),
    R.map(R.trim),
    R.filter((v: string) => !!v.length)
  )(src);

  const intersected = R.intersection(split, keywords);

  // const ratings = R.pipe(
  //   R.map(bestMatch),
  //   R.map((m) => m.bestMatch.rating),
  //   (list) => R.reject((o: number) => o <= outliers, list)
  // )(intersected);

  // const averageScore = R.mean(ratings);

  return intersected.length / keywords.length;
};

export const scoreMatchStringsSc = (
  src: string[],
  target: string
  // outliers: number = 0.25
) => {
  const keywords = R.pipe(R.toLower, R.split(" "), R.map(R.trim))(target);
  const bestMatch = (src2: string) => R.curry(findBestMatch)(src2)(keywords);

  const check = src.some((v) => {
    const split = R.pipe(
      R.split(" "),
      R.map(R.replace(/([^a-z0-9])/g, "")),
      R.map(R.trim),
      R.map(R.toLower)
    )(v);

    const ratings = R.pipe(
      R.map(bestMatch),
      R.map((m) => m.bestMatch.rating),
      (list) => list.filter((o) => o > 0.5)
    )(split);

    const averageScore = R.mean(ratings);

    const match = averageScore > 0.7;

    return match;
  });

  return check;
};

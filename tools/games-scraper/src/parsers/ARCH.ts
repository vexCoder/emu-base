import pMap from "p-map";
import * as R from "rambda";
import * as R2 from "ramda";
import XRay from "x-ray";
import { extractMatches, extractString, generateId } from "../utils.js";

// eslint-disable-next-line import/prefer-default-export
export const compileLinks = async (parts: string[]) => {
  const x = XRay();

  const list = await pMap(parts, async (url) => {
    const result: ResultLinks[] = await x(
      url,
      "table.directory-listing-table tbody tr",
      [
        {
          title: `td:first-child a:first-child`,
          link: `td:first-child a:first-child@href`,
          lastModified: `td:nth-child(2)`,
          size: `td:last-child`,
        },
      ]
    );

    const z: ParsedLinks[] = R.pipe(
      R.map((res: ResultLinks) => {
        const matches = extractMatches(/\(([^)]+)\)/g, res.title, true);
        const tags = R.pipe(
          R.map((v: string) => v.replace(/\(|\)/g, "")),
          (arr) => arr.filter((v: string): v is string => !!v && v.length > 0)
        )(matches);

        const { host, protocol } = new URL(url);
        const link = new URL(`${protocol}//${host}${res.link}`).href;

        const sizeString =
          extractString(/([.\d]*)(?=M|G|K)/g, res.size, true) ?? "0";
        const isG = !!extractString(/([.\d]*)(?=G)/g, res.size, true);
        const size = parseInt(sizeString, 10) * (isG ? 1000 : 1);
        const fileName = decodeURI(link.split("/").pop() ?? "");

        const title =
          extractString(/^(.*)(?<!\((.*))/g, res.title, true) ?? res.title;

        const id = generateId(`${fileName}-${size}`);

        return {
          id,
          fileName,
          title,
          link,
          size,
          baseUrl: url,
          tags,
        };
      }),
      R.filter((nr) => !!nr.title && !!nr.size)
    )(result);

    return z;
  });

  const flatten = R2.flatten(list);

  return flatten;
};

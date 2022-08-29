/* eslint-disable no-promise-executor-return */
import { load } from "cheerio";
import { createHash } from "crypto";
import dayjs from "dayjs";
import got from "got";
import pMap from "p-map";
import * as R from "rambda";
import * as R2 from "ramda";
import { Dictionary } from "ramda";
import { Video, youtube } from "scrape-youtube";
import Xray from "x-ray";
import {
  extractMatches,
  extractString,
  getConsoleDump,
  scoreMatchStrings,
  scoreTitlesMusic,
} from "../utils.js";

function pad(num: string, size: number) {
  let num2 = num.toString();
  while (num2.length < size) num2 = `0${num2}`;
  return num2;
}

const validChar = /([^<>/a-zA-Z0-9-.,'";&()=~[\]?!<>+_*\\|{}@#$%^` \t\n])/g;

const checkRangeDashOrTilde = (v: string) => {
  const isDash = !!extractString(/-(?:.*)(-)/g, v, true);
  const isTilde = v.indexOf("~") !== -1;

  if (isDash) {
    const lastIndex = v.lastIndexOf("-");
    const a = v.slice(0, lastIndex);
    const b = v.slice(lastIndex + 1);

    const base = extractString(/(.+)(?:-[0-9]+)/g, a, true);
    const start = extractString(/([0-9]+)/g, a, true);

    if (!start) return v;

    const end = start.slice(0, -b.length) + b;
    return R.range(parseInt(start, 10), parseInt(end, 10) + 1).map(
      (o) => `${base}-${pad(`${o}`, start.length)}`
    );
  }

  if (isTilde) {
    const [a, b] = v.split("~");

    const base = extractString(/(.+)(?:-[0-9]+)/g, a, true);
    const start = extractString(/([0-9]+)/g, a, true);

    if (!start) return v;

    const end = start.slice(0, -b.length) + b;
    return R.range(parseInt(start, 10), parseInt(end, 10) + 1).map(
      (o) => `${base}-${pad(`${o}`, start.length)}`
    );
  }

  return v;
};

export const getLinks = async (parts: string[]) => {
  const x = Xray();

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
          extractString(/([.\d]*)(?=M)/g, res.size, true) ?? "0";
        const size = parseInt(sizeString, 10);
        const fileName = decodeURI(link.split("/").pop() ?? "");

        const title =
          extractString(/^(.*)(?<!\((.*))/g, res.title, true) ?? res.title;

        const id = createHash("SHA256")
          .update(`${fileName}-${size}`)
          .digest("base64");

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

export const getDescriptions = async (gc: GameConsole) => {
  const db = getConsoleDump(gc.name);
  await db.read();
  db.data ||= [];

  const x = Xray();

  const getDescription = (num: number) =>
    x(`a:nth-child(${num})@href`, {
      list: x("pre a:nth-child(n + 9)", [
        {
          title: "",
          link: "@href",
          games: x("a:nth-child(n + 9)@href", {
            titles: x("pre a:nth-child(n + 9)", ["@href"]),
          }),
        },
      ]),
    });

  const result: ResultDescriptions = await x(gc.gameDb, "pre", {
    J: getDescription(10),
    P: getDescription(12),
    U: getDescription(14),
  });

  const titles = await pMap(Object.keys(result), async (v) => {
    const { list } = result[v];
    const mapped = list.map((o) => o.games.titles);
    const t = R2.flatten(mapped).map((o) => ({
      url: o,
      serial: extractString(
        /((?:[A-Za-z]+)-(?:[0-9]+)(?:~?-?[0-9]+))+/g,
        o ?? "",
        true
      ),
    }));

    return t;
  });

  const flatten = R2.flatten(titles);
  // .filter((v) =>
  //   v.serial
  //     ? [
  //         "SCUS-94163",
  //         "SCUS-94221",
  //         "SCUS-94288",
  //         "SCUS-94156",
  //         "SLUS-01249",
  //         "SLUS-00219",
  //         "SLUS-01090",
  //       ].includes(v.serial)
  //     : false
  // );

  let serialsAdded: string[] = [];
  const counter = 0;
  // Might Ban Here Add Interval
  await pMap(
    flatten,
    async ({ url, serial }) => {
      if (!serial || (serial && serialsAdded.includes(serial)))
        return undefined;

      console.log(serialsAdded.slice(-10));
      const prefixObject = <T extends Dictionary<string>>(
        prefix: string,
        object: T
      ): T => {
        const z = R.map((v) => `${prefix} ${v}`, object);
        return z as T;
      };
      const query = {
        ...prefixObject(
          "table:nth-child(2) tbody tr:nth-child(2) td:nth-child(2) table tbody",
          {
            official: "tr:nth-child(1) td:nth-child(2)",
            common: "tr:nth-child(2) td:nth-child(2)::array::string::/",
            serial: "tr:nth-child(3) td:nth-child(2)::serials",
            region: "tr:nth-child(4) td:nth-child(2)",
            genre: "tr:nth-child(5) td:nth-child(2)::array::string::/",
            developer: "tr:nth-child(6) td:nth-child(2)",
            publisher: "tr:nth-child(7) td:nth-child(2)",
            released: "tr:nth-child(8) td:nth-child(2)::date",
          }
        ),
      };

      const res: string = await got(url).text();

      const htmlString = res.replace(validChar, "");
      const $ = load(htmlString ?? "");

      const mapped = R.map((v) => {
        if (v.includes("::")) {
          const [q, cnv, cnv2, delimiter] = v.split("::");
          let value: string | string[] = $(q).text().trim();

          if (cnv === "array") {
            value = value.split(delimiter ?? ",");
          } else if (cnv === "serials") {
            const serials = extractMatches(
              /((?:[A-Za-z]+)-(?:[0-9]+)(?:~?-?[0-9]+))+/g,
              value,
              true
            );

            const parsedSerials = serials.map(checkRangeDashOrTilde);

            const reduced = R.reduce(
              (p, c) => {
                if (Array.isArray(c)) return p.concat(c);
                return [...p, c];
              },
              [] as string[],
              parsedSerials
            );

            value = reduced;
          }

          const convert = (o: string) => {
            const type = cnv2 ?? cnv;

            if (type === "date" && o) {
              return dayjs(o).unix();
            }

            return o.trim();
          };

          return Array.isArray(value) ? value.map(convert) : convert(value);
        }

        if (v.includes("@")) {
          const [q, attr] = v.split("@");
          const value = $(q).attr(attr);

          if (attr === "src" && value) {
            return new URL(value, url).href;
          }

          return value;
        }

        return $(v).text().trim();
      }, query) as unknown as BasicDescription;

      console.log(
        `[${serialsAdded.length}/${flatten.length}] Fetching: ${mapped.official} (${url})`
      );

      const sc = "table#table20 tbody tr td table:nth-child(2) tbody";
      const scRows = $(sc)
        .contents()
        .map((_i, e) => {
          if (e.type === "tag" && e.name === "tr") {
            if (e.children?.length) {
              return e.children
                .map((c) =>
                  $(c)
                    .contents()
                    .map((_i2, e2) => {
                      const src = $(e2).attr("src");
                      if (e2.type === "tag" && e2.name === "img" && src) {
                        return new URL(src, url).href;
                      }

                      return null;
                    })
                    .get()
                )
                .filter((v) => !!v);
            }

            return $(e).text().trim();
          }

          return null;
        })
        .get()
        .filter((v) => !!v);

      const title = mapped.official ?? mapped.common;
      const unique = title
        .replace(/[^a-zA-Z0-9-]/g, " ")
        .toLowerCase()
        .split(" ")
        .filter((v) => v.length > 0)
        .join("-");

      const cover = "table#table2 tbody tr:nth-child(2) td:nth-child(1) img";
      const coverSrc: string | undefined = $(cover).attr("src");
      let coverURL: string | undefined;
      if (coverSrc) coverURL = new URL(coverSrc, url).href;

      const rating =
        // eslint-disable-next-line max-len
        "table#table2 tbody tr:nth-child(2) td:nth-child(2) table tbody tr:nth-child(5) td:nth-child(3) p img:nth-child(1)";
      const ratingSrc: string | undefined = $(rating).attr("src");
      const ratings = extractString(
        /(.*)(?=[.])/g,
        ratingSrc?.split("/").pop() ?? "",
        true
      );

      const screenshots: string[] = R2.flatten(scRows);

      const related =
        "table#table30 tbody tr td table:nth-child(2) tbody tr td";

      const relatedRows = $(related)
        .contents()
        .map((_i, e) => {
          if (e.type === "tag" && e.name === "font") {
            return { type: "font", value: $(e).text() };
          }

          if (e.type === "tag" && e.name === "ul") {
            return {
              type: "li",
              value: e.children
                .map((e2) => {
                  if (e2.type === "tag" && e2.name === "li") {
                    const raw = $(e2).text();
                    const trimmed = raw.trim();

                    const titleRelated = extractString(
                      /^([<>/a-zA-Z0-9-.'";&()=[\] ]+)(?: \[((?:[A-Za-z]+)-(?:[0-9]+)(?:~?-?[0-9]+))*)/g,
                      trimmed,
                      true
                    );

                    const serials = extractMatches(
                      /((?:[A-Za-z]+)-(?:[0-9]+)(?:~?-?[0-9]+))+/g,
                      trimmed,
                      true
                    );

                    const parsedSerials = serials.map(checkRangeDashOrTilde);

                    const reduced = R.reduce(
                      (p, c) => {
                        if (Array.isArray(c)) return p.concat(c);
                        return [...p, c];
                      },
                      [] as string[],
                      parsedSerials
                    );

                    return {
                      title: titleRelated,
                      serials: reduced,
                    };
                  }
                  return null;
                })
                .filter((v): v is { title: string; serials: string[] } => !!v),
            };
          }
          return null;
        })
        .get()
        .filter(
          (
            v
          ): v is {
            type: "font" | "li";
            value: string | { title: string; serials: string[] }[];
          } => !!v
        );

      const groupRelated = R2.reduce(
        (p, c) => ({
          ...p,
          ...(c.type === "font" &&
            typeof c.value === "string" && {
              current: c.value,
            }),
          ...(c.type === "li" &&
            !!p.current &&
            typeof c.value === "object" && {
              combined: [
                ...p.combined,
                ...c.value.map((o) => ({
                  ...o,
                  region: p.current!,
                })),
              ],
            }),
        }),
        {
          current: undefined as string | undefined,
          combined: [] as {
            title: string;
            serials: string[];
            region: string;
          }[],
        },
        relatedRows
      );

      // mapped
      const parsedMappedSerial = mapped.serial.map(checkRangeDashOrTilde);

      const reducedMappedSerial = R.reduce(
        (p, c) => {
          if (Array.isArray(c)) return p.concat(c);
          return [...p, c];
        },
        [] as string[],
        parsedMappedSerial
      );

      const find = groupRelated.combined.find(
        (o) =>
          R.intersection(reducedMappedSerial, o.serials).length ===
          mapped.serial.length
      );

      const flattenedSerials = R2.flatten(
        groupRelated.combined.map((o) => o.serials)
      );

      serialsAdded = [
        ...serialsAdded,
        ...flattenedSerials,
        ...reducedMappedSerial,
      ];

      if (!find) {
        groupRelated.combined.push({
          region: mapped.region,
          serials: reducedMappedSerial,
          title: mapped.official,
        });
      }

      if (counter % 25 === 0) {
        await db.write();
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 3000);
        });
      }

      const ommited = R.omit(["serial", "region"], mapped);

      const id = createHash("SHA256")
        .update(`${unique}-${mapped.released}`)
        .digest("base64");

      const search = `${mapped.official} ps1 music opening`;
      const search2 = `${mapped.official} ps1 ost`;
      const results = await youtube.search(search);
      const results2 = await youtube.search(search2);

      const openingVideo = R.pipe<
        [Video[]],
        { item: Video; score: number; scoreMatch: number }[],
        { item: Video; score: number; scoreMatch: number }[],
        { item: Video; score: number; scoreMatch: number }[],
        { item: Video; score: number; scoreMatch: number }[],
        { item: Video; score: number; scoreMatch: number }
      >(
        R.map((v) => ({
          item: v,
          score: 0,
          scoreMatch: scoreMatchStrings(v.title, mapped.official),
        })),
        R.filter((v) => v.scoreMatch >= 0.35 && v.item.duration < 300),
        R.map((v) => ({
          ...v,
          score: scoreTitlesMusic(v.item),
        })),
        R.sort((a, b) => b.score - a.score),
        R.head
      )(results.videos.concat(results2.videos));

      const opening = openingVideo
        ? R.path(["item", "link"])(openingVideo)
        : "";

      console.log(
        `${openingVideo?.item?.title} (${openingVideo?.item?.link}): ${openingVideo?.score}`
      );

      const description = $(
        "table:nth-child(5) tbody tr td table:nth-child(2) tbody tr td"
      )
        .contents()
        .map((_i, e) => {
          if (e.type === "text") {
            const cnt = $(e).text().trim();
            if (cnt.length) return `${cnt}<br/><br/>`;
          }
          if (e.type === "tag" && e.name === "u") {
            const cnt = $(e).text().trim();
            if (cnt.length) return `<strong>${cnt}</strong><br/><br/>`;
          }
          if (e.type === "tag" && e.name === "ul") {
            return $(e)
              .contents()
              .map((_i2, e2) => {
                if (e2.type === "tag" && e2.name === "li")
                  return `&nbsp;&nbsp;&nbsp;&nbsp;- ${$(e2)
                    .contents()
                    .text()
                    .trim()}<br/>`;
                return "";
              })
              .get()
              .join("");
          }
          return "";
        })
        .get()
        .map(R.replace(validChar, ""))
        .join("")
        .padStart(1, "<p>")
        .padEnd(1, "</p>");

      const data = {
        ...ommited,
        description,
        id,
        unique,
        ratings: ratings ?? "",
        cover: coverURL ?? "",
        screenshots,
        regions: groupRelated.combined,
        opening: opening ?? "",
      } as ConsoleGameData;

      db.data?.push(data);

      return data;
    },
    {
      concurrency: 1,
    }
  );
};

export default {
  getLinks,
  getDescriptions,
};

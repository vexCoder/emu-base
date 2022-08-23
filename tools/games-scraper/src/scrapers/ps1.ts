/* eslint-disable no-promise-executor-return */
import { load } from "cheerio";
import dayjs from "dayjs";
import got from "got";
import pMap from "p-map";
import * as R from "rambda";
import * as R2 from "ramda";
import { Dictionary } from "ramda";
import Xray from "x-ray";
import { createHash } from "crypto";
import { extractString } from "../utils.js";

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
        const matches = res.title.matchAll(/\((?<value>[\w\S]*)\)/g);
        const tags = R.pipe(
          R.map((v: RegExpMatchArray) => v?.groups?.value),
          (arr) => arr.filter((v): v is string => !!v && v.length > 0)
        )(Array.from(matches));

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

export const getDescriptions = async (db: string) => {
  const x = Xray();

  const getDescription = () =>
    x("a:nth-child(10)@href", {
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

  const result: ResultDescriptions = await x(db, "pre", {
    J: getDescription(),
    P: getDescription(),
    U: getDescription(),
  });

  const titles = await pMap(Object.keys(result), async (v) => {
    const { list } = result[v];
    const mapped = list.map((o) => o.games.titles);
    const t = R2.flatten(mapped).map((o) => ({
      url: o,
      serial: extractString(/(.*)(?=.html)/g, o.split("/").pop() ?? "", true),
    }));

    return t;
  });

  const flatten = R2.flatten(titles).slice(0, 20);
  console.log(flatten);

  // Might Ban Here Add Interval
  const descriptions = await pMap(
    flatten,
    async ({ url }, i) => {
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
            common: "tr:nth-child(2) td:nth-child(2)",
            serial: "tr:nth-child(3) td:nth-child(2)::array",
            region: "tr:nth-child(4) td:nth-child(2)",
            genre: "tr:nth-child(5) td:nth-child(2)::array::string::/",
            developer: "tr:nth-child(6) td:nth-child(2)",
            publisher: "tr:nth-child(7) td:nth-child(2)",
            released: "tr:nth-child(8) td:nth-child(2)::date",
          }
        ),
        description:
          "table:nth-child(5) tbody tr td table:nth-child(2) tbody tr td",
      };

      const res = await got(url).text();

      const htmlString = res.replace(/[^<>/a-zA-Z0-9-.'";&()= ]*/g, "");
      const $ = load(htmlString ?? "");

      const mapped = R.map((v) => {
        if (v.includes("::")) {
          const [q, cnv, cnv2, delimiter] = v.split("::");
          let value: string | string[] = $(q).text().trim();

          if (cnv === "array") {
            value = value.split(delimiter ?? ",");
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
        `[${i + 1}/${flatten.length}] Fetching: ${mapped.official} (${url})`
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
                    const extract =
                      /^(?<title>.*)\s(?<serial>(?:[A-Za-z]+)-(?:[a-zA-Z0-9]+))(?:.*)$/g.exec(
                        trimmed
                      );
                    return {
                      title: extract?.groups?.title,
                      serial: extract?.groups?.serial,
                    };
                  }
                  return null;
                })
                .filter((v): v is { title: string; serial: string } => !!v),
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
            value: string | { title: string; serial: string }[];
          } => !!v
        );

      const groupRelated = relatedRows.reduce(
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
                ...c.value.map((v) => ({
                  ...v,
                  region: p.current!,
                })),
              ],
            }),
        }),
        {
          current: undefined as string | undefined,
          combined: [] as { title: string; serial: string; region: string }[],
        }
      );

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 3000);
      });

      return {
        ...mapped,
        unique,
        ratings,
        cover: coverURL,
        screenshots,
        related: groupRelated.combined,
      };
    },
    {
      concurrency: 25,
    }
  );

  return descriptions;
};

export default {
  getLinks,
  getDescriptions,
};

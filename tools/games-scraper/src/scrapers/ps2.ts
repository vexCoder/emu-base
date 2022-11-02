/* eslint-disable no-promise-executor-return */
import pMap from "p-map";
import Xray from "x-ray";
import dayjs from "dayjs";
import * as R from "rambda";
import * as R2 from "ramda";
import { createHash } from "crypto";
import {
  extractMatches,
  extractString,
  getConsoleDump,
  searchMusicVideo,
  sleep,
} from "../utils.js";

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
          extractString(/([.\d]*)(?=M|G|K)/g, res.size, true) ?? "0";
        const isG = !!extractString(/([.\d]*)(?=G)/g, res.size, true);
        const size = parseInt(sizeString, 10) * (isG ? 1000 : 1);
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
  console.log(gc.name);
  const db = getConsoleDump(gc.name);
  await db.read();
  db.data ||= [];

  const x = Xray();
  const listingsURL = `https://psxdatacenter.com/psx2/ulist2.html`;

  interface ListItem {
    title: string;
    serial: string[];
    languages: string;
  }

  const list: Record<keyof ListItem, string>[] = await x(
    listingsURL,
    "body table.sectiontable tr",
    [
      {
        title: `td:nth-child(3)`,
        serial: `td:nth-child(2)@html`,
        languages: `td:nth-child(4)`,
      },
    ]
  );

  //   'E',  'F', 'G',  'I',
  //   'S',  'D', 'Du', 'Fi',
  //   'Nw', 'P', 'Pl', 'R',
  //   'Sw',  'J', 'K', 'R'

  const languageMappedList = list.map((item) => {
    const trimmed = item.title.trim();
    const match = extractString(/(.*)\s\[[0-9] DISCS\]/g, trimmed, true);

    return {
      ...item,
      title: match ?? trimmed,
      serial: item.serial.trim().split("<br>"),
      languages: extractMatches(/([A-Za-z]+)/g, item.languages, true),
    };
  }) as ListItem[];

  const validChar = /([^<>/a-zA-Z0-9-.,'";&()=~[\]?!<>+_*\\|{}@#$%^` \t\n])/g;

  let counter = 0;
  await pMap(
    languageMappedList,
    async (item) => {
      counter++;
      const url = `${gc.gameDb}?name=${item.title
        .trim()
        .replace(/\s/g, "+")
        .replace(validChar, "")}&platform_id[]=11`;

      console.log(
        `[${counter}/${languageMappedList.length}] Fetching: (${item.serial}) ${item.title} (${url})`
      );

      const results = await x(url, "div#display > div > div", ["a@href"]);
      const first = results[0];
      if (!first) return;

      const left = "div.container-fluid > div.row > div:first-child";
      const right = "div.container-fluid > div.row > div:last-child";

      let img = "";
      try {
        img = await x(first, `${left} > div.row > div.col > div a img@src`);
      } catch (error) {
        console.error(error);
      }

      const lSect = (await x(
        first,
        `${left} > div.row > div.col > div > div:last-child`,
        ["p"]
      )) as string[];

      const topSect: string[] = await x(
        first,
        `${right} > div.row:nth-child(1) > div.col > div > div.card-body`,
        ["p@html"]
      );

      const bottomSect: string[] = await x(
        first,
        `${right} > div.row:nth-child(2) > div.col > div > div.card-body > div.row > div`,
        ["a@href"]
      );

      type ImageKey = "fanart" | "screenshots" | "clearlogo";
      const images = R2.groupBy((v: string) => {
        const m1 = v.indexOf("fanart") > -1 || v.indexOf("fanarts") > -1;
        if (m1) return "fanart";
        const m2 =
          v.indexOf("screenshots") > -1 || v.indexOf("screenshot") > -1;
        if (m2) return "screenshots";
        const m3 = v.indexOf("clearlogo") > -1 || v.indexOf("clearlogos") > -1;
        if (m3) return "clearlogo";

        return "";
      }, bottomSect) as Record<ImageKey, string[]>;

      const parseField = <T = string>(
        text: string,
        mapValue?: (v: string) => T
      ): { key: string; value: T } => {
        const [key, value, ...rest] =
          text?.split(":").map((v) => v.trim()) ?? [];
        const val = [value, ...rest].join(":");
        return { key, value: (mapValue?.(val) ?? val) as T };
      };

      const fields = topSect.map((v) => parseField(v));
      const lFields = lSect.map((v) => parseField(v));

      const released = lFields.find(
        (v) => v.key.toLowerCase().indexOf("releasedate") > -1
      );
      const formattedRelease = released
        ? dayjs(released.value, "YYYY-MM-DD").unix()
        : dayjs().unix();

      const publisher = lFields.find(
        (v) => v.key.toLowerCase().indexOf("publisher") > -1
      );

      const publisherValue = publisher?.value?.split("|")[0] ?? "n/a";

      const developer = lFields.find(
        (v) => v.key.toLowerCase().indexOf("developer") > -1
      );
      const developerValue = developer?.value?.split("|")[0] ?? "n/a";

      const description = topSect[0];
      const genre = fields.find(
        (v) => v.key.toLowerCase().indexOf("genre") > -1
      );
      const ratings = fields.find(
        (v) => v.key.toLowerCase().indexOf("rating") > -1
      );

      const opening = fields.find(
        (v) => v.key.toLowerCase().indexOf("trailer") > -1
      );
      const openingUrl =
        extractString(/href="(.+)"/, opening?.value ?? "", true) ??
        (await searchMusicVideo(item.title, gc.name));

      const unique = item.title
        .replace(/[^a-zA-Z0-9-]/g, " ")
        .toLowerCase()
        .split(" ")
        .filter((v) => v.length > 0)
        .join("-");

      const id = createHash("SHA256")
        .update(`${unique}-${formattedRelease}`)
        .digest("base64");

      await sleep(Math.random() * 1000);
      const data = {
        id,
        unique,
        common: [item.title],
        official: item.title,
        description: description ?? "",
        publisher: publisherValue,
        developer: developerValue,
        released: formattedRelease,
        cover: img,
        ratings: ratings?.value ?? "n/a",
        genre: genre?.value?.split("|").map((v) => v.trim()) ?? "n/a",
        opening: openingUrl,
        screenshots: images.fanart,
        links: [],
        regions: [
          {
            region: "NTSC-U",
            title: item.title,
            serials: item.serial,
          },
        ],
      } as ConsoleGameData;
      db.data?.push(data);
      if (counter % 3 === 0) {
        await db.write();
      }
    },
    { concurrency: 1 }
  );

  await db.write();
};

export default {
  getLinks,
  getDescriptions,
};

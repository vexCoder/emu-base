import pMap from "p-map";
import XRay from "x-ray";
import * as R2 from "ramda";
import dayjs from "dayjs";
import parseUrl from "parse-url";

interface SearchTGDBParams {
  keyword: string;
  platform: number;
  firstOnly?: boolean;
}

const validChar = /([^<>/a-zA-Z0-9-.,'";&()=~[\]?!<>+_*\\|{}@#$%^` \t\n])/g;

export const search = async ({
  keyword,
  platform,
  firstOnly,
}: SearchTGDBParams) => {
  const x = XRay();

  const url = `https://thegamesdb.net/search.php?name=${keyword
    .trim()
    .replace(/\s/g, "+")
    .replace(validChar, "")}${platform ? `&platform_id[]=${platform}` : ""}`;

  let results = (await x(url, "div#display > div > div", [
    "a@href",
  ])) as string[];

  if (firstOnly) results = results[0] ? [results[0]] : [];
  if (!results.length) return { results: [], url };

  const games = await pMap(results, async (tgdbUrl) => {
    const { id } = parseUrl(tgdbUrl).query;

    if (!id) return null;

    const left = "div.container-fluid > div.row > div:first-child";
    const right = "div.container-fluid > div.row > div:last-child";

    let img = "";
    try {
      img = await x(tgdbUrl, `${left} > div.row > div.col > div a img@src`);
    } catch (error) {
      console.error(error);
    }

    const lSect = (await x(
      tgdbUrl,
      `${left} > div.row > div.col > div > div:last-child`,
      ["p"]
    )) as string[];

    const topSect: string[] = await x(
      tgdbUrl,
      `${right} > div.row:nth-child(1) > div.col > div > div.card-body`,
      ["p@html"]
    );

    const bottomSect: string[] = await x(
      tgdbUrl,
      `${right} > div.row:nth-child(2) > div.col > div > div.card-body > div.row > div`,
      ["a@href"]
    );

    const name: string = await x(
      tgdbUrl,
      `${right} > div.row:nth-child(1) > div.col > div > div.card-header`,
      "*@html"
    );

    type ImageKey = "fanart" | "screenshots" | "clearlogo";
    const images = R2.groupBy((v: string) => {
      const m1 = v.indexOf("fanart") > -1 || v.indexOf("fanarts") > -1;
      if (m1) return "fanart";
      const m2 = v.indexOf("screenshots") > -1 || v.indexOf("screenshot") > -1;
      if (m2) return "screenshots";
      const m3 = v.indexOf("clearlogo") > -1 || v.indexOf("clearlogos") > -1;
      if (m3) return "clearlogo";

      return "";
    }, bottomSect) as Record<ImageKey, string[]>;

    const parseField = <T = string>(
      text: string,
      mapValue?: (v: string) => T
    ): { key: string; value: T } => {
      const [key, value, ...rest] = text?.split(":").map((v) => v.trim()) ?? [];
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
    const genre = fields.find((v) => v.key.toLowerCase().indexOf("genre") > -1);
    const ratings = fields.find(
      (v) => v.key.toLowerCase().indexOf("rating") > -1
    );

    return {
      id: tgdbUrl.split("/").pop(),
      name,
      description: description ?? "",
      publisher: publisherValue,
      developer: developerValue,
      released: formattedRelease,
      cover: img,
      ratings: ratings?.value ?? "n/a",
      genre: genre?.value?.split("|").map((v) => v.trim()) ?? [],
      screenshots: images.fanart,
    };
  });

  return {
    results: games.filter((v): v is TGDBResult => !!v),
    url,
  };
};

export const tgdbToConsoleData = (tgdb: TGDBResult) => ({
  description: tgdb.description,
  publisher: tgdb.publisher,
  developer: tgdb.developer,
  released: tgdb.released,
  cover: tgdb.cover,
  ratings: tgdb.ratings,
  genre: tgdb.genre,
  screenshots: tgdb.screenshots,
});

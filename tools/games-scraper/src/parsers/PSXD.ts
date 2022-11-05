import XRay from "x-ray";
import { extractMatches, extractString } from "../utils.js";

export interface ListItem {
  title: string;
  serial: string[];
  languages: string;
}

export interface UlistOptions {
  max?: number;
  filter?: (item: ListItem) => boolean;
}

export const parseUlist = async (url: string, opts?: UlistOptions) => {
  const x = XRay();

  const list: Record<keyof ListItem, string>[] = await x(
    url,
    "body table.sectiontable tr",
    [
      {
        title: `td:nth-child(3)@html`,
        serial: `td:nth-child(2)@html`,
        languages: `td:nth-child(4)`,
      },
    ]
  );

  let languageMappedList = list.map((item) => {
    const trimmed = item.title
      .trim()
      .replace(/(&[^&;]+;)/g, "")
      .split("<br>");

    // const match = extractString(/(.*)\s\[[0-9] DISCS\]/g, trimmed[0], true);
    const match = extractString(/(.+\w|.{1}).*[0-9] DISCS/g, trimmed[0], true);

    return {
      ...item,
      title: match ?? trimmed[0],
      serial: item.serial
        .trim()
        .replace(/(&[^&;]+;)/g, "")
        .split("<br>"),
      languages: extractMatches(/([A-Za-z]+)/g, item.languages, true),
    };
  }) as ListItem[];

  if (opts?.max) languageMappedList = languageMappedList.slice(0, opts.max);
  if (opts?.filter) languageMappedList = languageMappedList.filter(opts.filter);
  return languageMappedList;
};

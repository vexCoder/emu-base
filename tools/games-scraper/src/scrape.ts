import pMap from "p-map";
import * as R2 from "rambda";
import * as R from "ramda";
import {
  CLISettings,
  getConfig,
  getConsoleDump,
  getConsoleLinks,
} from "./utils.js";

const scrape = async (cli: CLISettings) => {
  const { consoles, config } = await getConfig();
  const platforms = cli.flags.platform?.split(",");
  if (!platforms?.length) throw new Error("No platforms specified");

  await pMap(consoles, async (consoleName) => {
    const c = config.consoles[consoleName];
    const linksDb = getConsoleLinks(consoleName);
    const dumpDb = getConsoleDump(consoleName);

    await linksDb.read();
    await dumpDb.read();

    const scraper: Scraper = await import(`./scrapers/${consoleName}.js`);

    const links = await scraper.getLinks(c.parts);

    linksDb.data ||= links;
    await linksDb.write();

    const descriptions = await scraper.getDescriptions(c.gameDb);

    const matchTitles = (target: string, src: string) => {
      const str1 = target.replace(/[^a-zA-Z0-9]/g, " ").toLowerCase();
      const str2 = src.replace(/[^a-zA-Z0-9]/g, " ").toLowerCase();

      const intersect = R.intersection(str1.split(" "), str2.split(" ")).filter(
        (v) => v.length > 0
      );

      return intersect;
    };

    const mapped = R.map((v) => {
      const matches = R2.pipe(
        R2.map((o: ParsedLinks) => ({
          src: v.official,
          target: o,
          matches: matchTitles(o.title, v.official),
        })),
        R2.filter((o) => {
          const intersect = o.matches;
          return (
            intersect.length >= 1 && intersect.length <= o.src.split(" ").length
          );
        }),
        R2.sort((a, b) => b.matches.length - a.matches.length)
      )(links);

      const ids = matches.slice(0, 5).map((o) => o.target.id);

      return {
        ...v,
        links: ids,
      };
    }, descriptions);

    dumpDb.data ||= mapped;
    await dumpDb.write();
  });
};

export default scrape;

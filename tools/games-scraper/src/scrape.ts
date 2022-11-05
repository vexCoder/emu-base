import pMap from "p-map";
import { CLISettings, getConfig, getConsoleLinks } from "./utils.js";

const scrape = async (cli: CLISettings) => {
  const { consoles, config } = await getConfig();
  const platforms = cli.flags.platform?.split(",");
  const linkOnly = !!cli.flags.linkOnly;
  if (!platforms?.length) throw new Error("No platforms specified");

  await pMap(consoles, async (consoleName) => {
    const c = config.consoles[consoleName];
    if (!platforms.includes(c.name)) return;

    const linksDb = getConsoleLinks(consoleName);

    await linksDb.read();

    const scraper: Scraper = await import(`./scrapers/${consoleName}.js`);

    const links = await scraper.getLinks(c.parts);
    if (!linkOnly) await scraper.getDescriptions(c);

    linksDb.data ||= links;
    await linksDb.write();
  });
};

export default scrape;

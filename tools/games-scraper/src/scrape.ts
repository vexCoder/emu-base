import pMap from "p-map";
import chalk from "chalk";
import { performance } from "perf_hooks";
import dayjs from "dayjs";
import { CLISettings, getConfig, getConsoleLinks } from "./utils.js";
import * as PSXDTGDB from "./scrapers/psxd-tgdb.js";

const scrape = async (cli: CLISettings) => {
  const { consoles, config } = await getConfig();
  const platforms = cli.flags.platform?.split(" ");
  const linkOnly = !!cli.flags.linkOnly;
  if (!platforms?.length) throw new Error("No platforms specified");

  await pMap(
    consoles,
    async (consoleName) => {
      const c = config.consoles[consoleName];
      if (!platforms.includes(c.name)) return;
      performance.mark(`${consoleName}-start`);
      console.log(`${chalk.blue(`Scraping:`)} ${consoleName}`);
      console.log(`${chalk.blue(`Method:`)} ${c.scraper}`);

      const linksDb = getConsoleLinks(consoleName);

      await linksDb.read();

      if (c.scraper === "psxd-tgdb") {
        const links = await PSXDTGDB.getLinks({ console: c });
        linksDb.data = links;

        await linksDb.write();
        if (!linkOnly)
          await PSXDTGDB.getDescriptions({
            console: c,
          });
      }
      performance.mark(`${consoleName}-end`);

      const metric = performance.measure(
        consoleName,
        `${consoleName}-start`,
        `${consoleName}-end`
      );

      console.log(`\n${chalk.blue(`Scraping ${consoleName} took:`)} ${dayjs
        .duration(metric.duration, "ms")
        .format("mm:ss")}
      `);
    },
    { concurrency: 1 }
  );
};

export default scrape;

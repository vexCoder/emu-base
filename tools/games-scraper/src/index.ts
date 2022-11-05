import init from "./init.js";
import postprocess from "./postprocess.js";
import scrape from "./scrape.js";
import { getCli } from "./utils.js";

const main = async () => {
  const { cli, command } = getCli();

  await init();

  if (cli.flags.consoleOnly) return;

  switch (command) {
    case "scrape": {
      await scrape(cli);
      break;
    }

    case "migrate": {
      await postprocess(cli);
      break;
    }

    default: {
      console.log(cli.help);
      break;
    }
  }
};

main();

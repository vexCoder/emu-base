import { JsonDB } from "node-json-db";
import { Config } from "node-json-db/dist/lib/JsonDBConfig";
import { join } from "path";

class Db extends JsonDB {
  constructor(cns: string) {
    const base = join(__dirname, "dump", cns);
    super(new Config(join(base, "dump.json"), false, true));
  }
}

export default Db;

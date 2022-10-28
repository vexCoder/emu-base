import { app } from "electron";
import { writeFileSync } from "fs-extra";
import { join } from "path";
import { Application } from "./app";

Application.boot()
  .then(() => {
    console.log("Application started");
  })
  .catch((error) => {
    console.error(error);
    writeFileSync(join(app.getAppPath(), "test.txt"), error.message);
  });

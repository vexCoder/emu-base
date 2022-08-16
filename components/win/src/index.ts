import { Application } from "./app";

Application.boot()
  .then(() => {
    console.log("Application started");
  })
  .catch((error) => {
    console.error(error);
  });

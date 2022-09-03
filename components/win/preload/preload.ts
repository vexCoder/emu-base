import { bind } from "./make";

// bind("members", (h, i) => {
//   h("get", (id: string) => i(`members:get`, id));
//   h("search", (keyword: string, limit: number, offset: number) =>
//     i(`members:search`, keyword, limit, offset)
//   );
//   h("loans", (keyword: string, limit: number, offset: number) =>
//     i(`members:loans`, keyword, limit, offset)
//   );
// });

bind("win", (h, i) => {
  h("minimize", () => i(`win:minimize`));
  h("maximize", () => i(`win:maximize`));
});

bind("data", (h, i) => {
  h(
    "getGames",
    (keyword: string, console: string, page?: number, limit?: number) =>
      i(`data:getGames`, keyword, console, page, limit)
  );

  h("getImage", (path: string, url?: string) => i(`data:getImage`, path, url));

  h("getGameFiles", (id: string, console: string) =>
    i(`data:getGameFiles`, id, console)
  );

  h("getGameLinks", (keywords: string, tags: string[], console: string) =>
    i(`data:getGameLinks`, keywords, tags, console)
  );

  h(
    "setGameLinks",
    (id: string, serials: string[], links: string[], console: string) =>
      i(`data:setGameLinks`, id, serials, links, console)
  );
});

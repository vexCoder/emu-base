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

bind("core", (h, i) => {
  h("progression", () => i(`core:progression`));
});

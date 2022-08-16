import esbuild, { BuildOptions } from "esbuild";

const defaults: BuildOptions = {
  bundle: true,
  platform: "node",
  format: "cjs",
};

const makeEsbuild = async (
  entries: string[],
  outdir: string,
  override: BuildOptions = {}
) => {
  await esbuild.build({
    ...defaults,
    ...(override ?? {}),
    entryPoints: entries,
    outdir,
  });
};

export default makeEsbuild;

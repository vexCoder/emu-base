/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-regex-literals */
import { PluginBuild } from "esbuild";
import fs from "fs-extra";
import obfuscator, { ObfuscatorOptions } from "javascript-obfuscator";
import { resolve } from "path";

const obfuscateCode = (file: string, opts: ObfuscatorOptions) => {
  const source = fs.readFileSync(file, {
    encoding: "utf8",
  });

  const result = obfuscator.obfuscate(source, {
    compact: false,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    numbersToExpressions: true,
    stringArrayShuffle: true,
    splitStrings: true,
    stringArrayThreshold: 1,
    ...opts,
  });

  const contents = result.getObfuscatedCode();

  fs.writeFileSync(file, contents);
};

const makePlugin = (options: ObfuscatorOptions = {}) => ({
  name: "obfuscator",
  setup(build: PluginBuild) {
    build.onEnd(() => {
      const { outfile, outdir } = build.initialOptions;

      try {
        if (outfile) {
          obfuscateCode(resolve(outfile), options);
        } else if (outdir) {
          const files = fs.readdirSync(resolve(outdir));
          for (const file of files) {
            if (file.endsWith(".js")) {
              obfuscateCode(resolve(outdir, file), options);
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    });
  },
});

export default makePlugin;

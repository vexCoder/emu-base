const fs = require("fs-extra");
const { join } = require("path");

const copy = async () => {
  const args = process.argv.slice(2);
  const sourceDir = args[0];
  const targetDir = args[1];
  const base = sourceDir ?? join(__dirname, '..', '.artifacts', 'prebuilt')
  const files = await fs.readdir(base);

  for (const file of files) {
    if (file !== "copy.js") {
      const source = join(base, file);
      const destination = targetDir ?? join(
        __dirname,
        "..",
        "tools",
        "node-ovhook",
        "build",
        "Release",
      );

      const fileDest = join(destination, file);
      
      await fs.ensureDir(destination);
      try {
        await fs.copy(source, fileDest);
      } catch (error) {
        console.error(error);
      }
    }
  }
};

copy();
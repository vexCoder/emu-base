const fs = require("fs-extra");
const { join } = require("path");

const copy = async () => {
  const base = join(__dirname, '..', '.artifacts', 'prebuilt')
  const files = await fs.readdir(base);

  for (const file of files) {
    if (file !== "copy.js") {
      const source = join(base, file);
      const destination = join(
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
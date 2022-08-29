// @ts-nocheck
import { defineConfig, loadEnv, ConfigEnv } from "vite";
import react from "@vitejs/plugin-react";
import inspect from "vite-plugin-inspect";
import importer from "vite-plugin-imp";
import {VitePluginFonts as fonts} from "vite-plugin-fonts";

import path from "path";

export default ({ mode }: ConfigEnv) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  const isProd = mode === "production";

  const env: Record<string, string | undefined> = {};
  if (isProd) {
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("VITE_")) {
        env[`import.meta.env.${key}`] = process.env[key];
      }
    });
  }

  const plugins = [];

  plugins.push(react());
  plugins.push(
    importer({
      libList: [
        { libName: "lodash", libDirectory: "", camel2DashComponentName: false },
        { libName: "ramda", libDirectory: "", camel2DashComponentName: false },
        {
          libName: "ahooks",
          style: (name) => {
            return `ahooks/es/${name}`;
          },
          camel2DashComponentName: false,
        },
      ],
    })
  );

  plugins.push(fonts({
    custom: {
      families: [
        {
          name: 'JosefinSans',
          local: 'JosefinSans',
          src: './assets/fonts/JosefinSans-*.ttf'
        },
        {
          name: 'LibreBaskerville',
          local: 'LibreBaskerville',
          src: './assets/fonts/LibreBaskerville-*.otf'
        },
      ]
    }
  }))
  
  if (!isProd) plugins.push(inspect());

  return defineConfig({
    plugins,
    publicDir: "./public",
    ...(isProd && { define: env }),
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@hooks": path.resolve(__dirname, "src", "hooks"),
        "@api": path.resolve(__dirname, "src", "api"),
        "@providers": path.resolve(__dirname, "src", "providers"),
        "@components": path.resolve(__dirname, "src", "components"),
        "@utils": path.resolve(__dirname, "src", "utils"),
        "@elements": path.resolve(__dirname, "src", "elements"),
        "@containers": path.resolve(__dirname, "src", "containers"),
        "@svg": path.resolve(__dirname, "src", "svg"),
        "@css": path.resolve(__dirname, "src", "css"),
        "@root": path.resolve(__dirname, "src"),
      },
    },
    server: {
      port: 3001,
      host: true,
    },
    build: {
      chunkSizeWarningLimit: 2500,
    },
    optimizeDeps: {
      include: [],
    },
  });
};

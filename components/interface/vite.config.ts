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
  console.log(mode)

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

  if(!isProd) {
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
  }

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

  plugins.push({
    name: "middleware",
    apply: "serve",
    configureServer(viteDevServer) {
      return () => {
        viteDevServer.middlewares.use(async (req, res, next) => {
          if (req.originalUrl.startsWith("/overlay")) {
            req.url = "/overlay/index.html";
          }

          next();
        });
      };
    }
  })

  console.log(path.resolve(__dirname, "assets"))
  return defineConfig({
    plugins,
    ...(isProd && { define: env, base: './' }),
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
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "index.html"),
          overlay: isProd ? path.resolve(__dirname, "overlay.html") : path.resolve(__dirname, "overlay", "index.html"),
        }
      }
    },
    optimizeDeps: {
      include: [],
    },
  });
};

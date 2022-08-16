import electron from "electron";
import { BuildResult, PluginBuild } from "esbuild";
import execa from "execa";
import findProcess from "find-process";
import _ from "lodash";
import { join } from "path";
import readLine from "readline";

interface ElectronPlugin {
  dir?: string;
}

const plugin = (options?: ElectronPlugin) => {
  const { dir } = options ?? {};
  const electronPath = electron as unknown as string;
  const mainProcess = dir
    ? join(dir, "index.js")
    : join(process.cwd(), "dist", "index.js");

  const run = (restart?: boolean) => {
    const args = ["--no-warnings", "--trace-warnings", mainProcess];
    if (restart) args.push("--restart");
    return execa(electronPath, args, {
      shell: true,
      stdio: "inherit",
      env: process.env,
    });
  };

  let spawn: execa.ExecaChildProcess<string> | undefined;
  let restarted: boolean = false;

  interface Process {
    pid: number;
    ppid?: number | undefined;
    uid?: number | undefined;
    gid?: number | undefined;
    name: string;
    cmd: string;
  }

  interface GetElectronProcessesReturn {
    parent?: Process;
    children: Process[];
    extras: Process[];
  }

  const getElectronProcesses = async (
    id?: number
  ): Promise<GetElectronProcessesReturn> => {
    if (!id) {
      return {
        parent: undefined,
        children: [],
        extras: [],
      };
    }

    const processes = await findProcess("name", "electron");
    const parent = processes.find(
      (v) => v.ppid === id || v.cmd.indexOf(mainProcess) !== -1
    );

    const children: Process[] = processes.filter((v) => v.ppid === parent?.pid);

    const extras: Process[] = processes.filter(
      (v) => v.ppid === id || v.cmd.indexOf(mainProcess) !== -1
    );

    return {
      parent,
      children,
      extras,
    };
  };

  const killChromiumTree = async (id?: number) => {
    const { parent, children, extras } = await getElectronProcesses(id);

    children.forEach((child) => {
      try {
        process.kill(child.pid);
      } catch (error) {
        console.log(`Child ${child.pid} process is already dead`);
      }
    });

    if (parent) {
      try {
        process.kill(parent.pid);
      } catch (error) {
        console.log(`Parent ${parent.pid} process is already dead`);
      }
    }

    extras.forEach((extra) => {
      try {
        process.kill(extra.pid);
      } catch (error) {
        console.log(`Duplicate ${extra.pid} process is already dead`);
      }
    });
  };

  // To be able to listen for ctrl+c command in terminal
  if (process.platform === "win32") {
    const rl = readLine.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.on("SIGINT", () => {
      process.emit("SIGINT");
    });
  }

  // To be able to listen for ctrl+c command in terminal
  process.on("SIGINT", async () => {
    if (spawn && spawn.pid) {
      await killChromiumTree(spawn.pid);
    }

    process.exit();
  });

  // NOTE debounce so that only the last build will restart the client
  const restart = _.debounce(async () => {
    await killChromiumTree(spawn?.pid);
    spawn = run(restarted);
    restarted = true;
  }, 250);

  const makePlugin = () => ({
    name: "electron",
    setup(build: PluginBuild) {
      const isDev = process.env.NODE_ENV === "development";

      build.onEnd(async (result: BuildResult) => {
        if (isDev) restart();
        result.errors.forEach((error) => console.error(error));
      });
    },
  });

  return makePlugin();
};

export default plugin;

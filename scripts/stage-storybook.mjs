import { spawnSync } from "node:child_process";
import { access, cp, readFile, rename, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "storybook-static");
const published = join(root, "public/storybook");
const staging = join(root, ".storybook-publish");
const entrypoints = ["index.html", "iframe.html", "index.json"];

async function hasEntrypoints(directory) {
  try {
    await Promise.all(entrypoints.map((file) => access(join(directory, file))));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (
    process.argv.includes("--if-missing") &&
    (await hasEntrypoints(published))
  ) {
    console.log("Published Storybook is ready at /storybook/index.html.");
    return;
  }

  // Resolve the package's declared executable rather than relying on a global
  // Storybook installation or a platform-specific shell command.
  const require = createRequire(import.meta.url);
  const packagePath = require.resolve("storybook/package.json");
  const { bin } = JSON.parse(await readFile(packagePath, "utf8"));
  const cli = resolve(
    dirname(packagePath),
    typeof bin === "string" ? bin : bin.storybook,
  );
  const result = spawnSync(process.execPath, [cli, "build"], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `Storybook build failed (${result.signal ?? result.status}).`,
    );
  }
  if (!(await hasEntrypoints(output))) {
    throw new Error(
      "Storybook build did not produce its manager, iframe and story index.",
    );
  }

  // Keep the previous local publication available until the new build is ready.
  // Neither this temporary directory nor public/storybook is a staticDir input.
  await rm(staging, { recursive: true, force: true });
  await cp(output, staging, { recursive: true });
  await rm(published, { recursive: true, force: true });
  await rename(staging, published);
  console.log("Published Storybook staged at /storybook/index.html.");
}

await main();

import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const output = resolve(root, "dist");

const publicFiles = ["index.html", "favicon.svg"];
const publicDirectories = ["css", "js", "vendor"];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of publicFiles) {
  if (!existsSync(resolve(root, file))) {
    throw new Error(`Ficheiro público obrigatório não encontrado: ${file}`);
  }
  await cp(resolve(root, file), resolve(output, file), { recursive: true });
}

for (const directory of publicDirectories) {
  if (existsSync(resolve(root, directory))) {
    await cp(resolve(root, directory), resolve(output, directory), { recursive: true });
  }
}

console.log("Build concluído: apenas os recursos públicos foram copiados para dist/.");

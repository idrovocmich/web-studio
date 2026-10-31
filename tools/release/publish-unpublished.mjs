// Publishes every public workspace package whose current version is not on npm yet.
// Runs in .github/workflows/release.yml with npm trusted publishing (OIDC): no npm token exists.
// `pnpm pack` runs `prepack` (build) and rewrites workspace:/catalog: ranges; `npm publish` uploads
// the tarball and attaches provenance automatically on GitHub Actions.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: "utf8", stdio: "pipe", ...opts }).trim();

function isPublished(name, version) {
  try {
    return run("npm", ["view", `${name}@${version}`, "version"]) === version;
  } catch {
    return false; // npm exits non-zero for unknown packages/versions
  }
}

const published = [];
for (const dir of readdirSync("packages", { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const pkgDir = join("packages", dir.name);
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
  } catch {
    continue; // folders without package.json (e.g. mcp-server README only)
  }
  if (pkg.private) continue;

  if (isPublished(pkg.name, pkg.version)) {
    console.log(`= ${pkg.name}@${pkg.version} ya está en npm, se omite.`);
    continue;
  }

  const out = mkdtempSync(join(tmpdir(), "ws-pack-"));
  run("pnpm", ["pack", "--pack-destination", out], {
    cwd: pkgDir,
    stdio: ["ignore", "pipe", "inherit"],
  });
  const [tarball] = readdirSync(out).filter((f) => f.endsWith(".tgz"));
  if (!tarball) throw new Error(`pnpm pack no generó un .tgz para ${pkg.name}`);

  console.log(`↑ Publicando ${pkg.name}@${pkg.version}…`);
  execFileSync("npm", ["publish", join(out, tarball), "--access", "public"], { stdio: "inherit" });
  published.push(`${pkg.name}@${pkg.version}`);
}

for (const tag of published) {
  run("git", ["tag", tag]);
}
if (published.length > 0) {
  run("git", ["push", "origin", ...published.map((t) => `refs/tags/${t}`)]);
}
console.log(published.length ? `Publicado: ${published.join(", ")}` : "Nada nuevo que publicar.");

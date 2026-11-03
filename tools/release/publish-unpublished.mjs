// Publishes every public workspace package whose current version is not on npm yet.
// Runs in .github/workflows/release.yml with npm trusted publishing (OIDC): no npm token exists.
// `pnpm pack` runs `prepack` (build) and rewrites workspace:/catalog: ranges; `npm publish` uploads
// the tarball and attaches provenance automatically on GitHub Actions.
// Packages are published dependencies first, so a package never reaches npm before the
// workspace versions it depends on. `--plan` prints that order and exits without publishing.
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

function readPublicPackages() {
  const packages = new Map();
  for (const dir of readdirSync("packages", { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const pkgDir = join("packages", dir.name);
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
    } catch {
      continue; // folders without package.json (e.g. mcp-server README only)
    }
    if (!pkg.private) packages.set(pkg.name, { dir: pkgDir, pkg });
  }
  return packages;
}

// Depth-first topological sort over the dependencies that are themselves public workspace packages.
function publishOrder(packages) {
  const order = [];
  const state = new Map(); // name -> "visiting" | "done"
  const visit = (name, chain) => {
    if (state.get(name) === "done") return;
    if (state.get(name) === "visiting") {
      throw new Error(`Dependencia circular entre paquetes: ${[...chain, name].join(" → ")}`);
    }
    state.set(name, "visiting");
    const { pkg } = packages.get(name);
    const deps = {
      ...pkg.dependencies,
      ...pkg.peerDependencies,
      ...pkg.optionalDependencies,
    };
    for (const dep of Object.keys(deps).sort()) {
      if (packages.has(dep)) visit(dep, [...chain, name]);
    }
    state.set(name, "done");
    order.push(name);
  };
  for (const name of [...packages.keys()].sort()) visit(name, []);
  return order.map((name) => packages.get(name));
}

const ordered = publishOrder(readPublicPackages());

if (process.argv.includes("--plan")) {
  console.log("Orden de publicación:");
  for (const { pkg } of ordered) console.log(`  ${pkg.name}@${pkg.version}`);
  process.exit(0);
}

const published = [];
try {
  for (const { dir, pkg } of ordered) {
    if (isPublished(pkg.name, pkg.version)) {
      console.log(`= ${pkg.name}@${pkg.version} ya está en npm, se omite.`);
      continue;
    }

    const out = mkdtempSync(join(tmpdir(), "ws-pack-"));
    run("pnpm", ["pack", "--pack-destination", out], {
      cwd: dir,
      stdio: ["ignore", "pipe", "inherit"],
    });
    const [tarball] = readdirSync(out).filter((f) => f.endsWith(".tgz"));
    if (!tarball) throw new Error(`pnpm pack no generó un .tgz para ${pkg.name}`);

    console.log(`↑ Publicando ${pkg.name}@${pkg.version}…`);
    execFileSync("npm", ["publish", join(out, tarball), "--access", "public"], {
      stdio: "inherit",
    });
    published.push(`${pkg.name}@${pkg.version}`);
  }
} finally {
  // Tag whatever reached npm, even if a later package failed, so the tags match the registry.
  for (const tag of published) {
    run("git", ["tag", tag]);
  }
  if (published.length > 0) {
    run("git", ["push", "origin", ...published.map((t) => `refs/tags/${t}`)]);
  }
}
console.log(published.length ? `Publicado: ${published.join(", ")}` : "Nada nuevo que publicar.");

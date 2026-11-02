import { access, readFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { BrandValidationError, type BrandIssue } from "./errors.js";
import { resolveBrand, type ResolvedBrand } from "./resolve.js";

export interface LoadedBrand extends ResolvedBrand {
  /** Absolute directory that contains `brand.json`. */
  dir: string;
  /** Absolute path of every asset the brand declares. */
  assets: { logos: Record<string, string>; fonts: string[] };
}

const exists = (path: string): Promise<boolean> =>
  access(path).then(
    () => true,
    () => false,
  );

/**
 * Reads `<dir>/brand.json`, validates it and checks that every logo and font file exists.
 * Node-only entry point: `@idrovocmich/brand-contract/node`.
 */
export async function loadBrand(dir: string): Promise<LoadedBrand> {
  const root = isAbsolute(dir) ? dir : resolve(dir);
  const file = join(root, "brand.json");
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    const reason =
      (error as NodeJS.ErrnoException).code === "ENOENT" ? "no existe" : "no es un JSON válido";
    throw new BrandValidationError(`en ${root}`, [
      { path: "brand.json", message: `El archivo ${file} ${reason}.` },
    ]);
  }

  const resolved = await resolveBrand(raw);
  const { logos, typography } = resolved.brand;

  const logoFiles: Record<string, string> = { primary: join(root, logos.primary.file) };
  logos.variants.forEach((v, i) => (logoFiles[`${v.kind}-${i}`] = join(root, v.file)));
  const fontFiles = [typography.display, typography.body, typography.mono].flatMap((role) =>
    role?.source.kind === "self-hosted" ? role.source.files.map((f) => join(root, f.path)) : [],
  );

  const missing: BrandIssue[] = [];
  for (const [key, path] of Object.entries(logoFiles)) {
    if (!(await exists(path)))
      missing.push({ path: `logos.${key}`, message: `No se encuentra el archivo ${path}.` });
  }
  for (const path of fontFiles) {
    if (!(await exists(path)))
      missing.push({ path: "typography", message: `No se encuentra la fuente ${path}.` });
  }
  if (missing.length > 0) throw new BrandValidationError(`"${resolved.brand.id}"`, missing);

  return { ...resolved, dir: root, assets: { logos: logoFiles, fonts: fontFiles } };
}

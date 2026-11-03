import { parsePage, parseSite, type Page } from "@idrovocmich/content-schema";
import siteJson from "../content/site.json";
import { brand } from "./brand";

// Content is validated at build time; errors name the file and the exact field, in Spanish.
const parsedSite = parseSite(siteJson, '"src/content/site.json"');

/** Site settings; the demo content is shared by every brand, so the name comes from the brand. */
export const site = { ...parsedSite, name: brand.name };

const files = import.meta.glob<{ default: unknown }>("../content/pages/*.json", { eager: true });

export const pages: Page[] = Object.entries(files).map(([path, module]) =>
  parsePage(module.default, `"${path.replace("../", "src/")}"`),
);

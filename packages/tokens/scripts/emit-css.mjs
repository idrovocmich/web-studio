// Emits the engine's default CSS and DTCG JSON into dist/ after `tsc`. Fails on invalid tokens.
import { mkdir, writeFile } from "node:fs/promises";
import { buildTokens, createTokens, formatReport, validateTokens } from "../dist/index.js";

const tree = createTokens();
const report = validateTokens(tree);
if (!report.ok) {
  console.error(formatReport(report));
  process.exit(1);
}

const { tokensCss, themeCss } = await buildTokens(tree);
const dist = new URL("../dist/", import.meta.url);
await mkdir(new URL("css/", dist), { recursive: true });
await writeFile(new URL("css/tokens.css", dist), tokensCss);
await writeFile(new URL("css/theme.css", dist), themeCss);
await writeFile(new URL("tokens.json", dist), `${JSON.stringify(tree, null, 2)}\n`);
console.log(`tokens: ${report.contrast.length} pares de contraste AA verificados, CSS generado.`);

import { contrastRatio } from "./color.js";
import { flatten, refId, resolveValue, withMode, wsExtensions } from "./tree.js";
import type { ContrastUse, Mode, OklchColor, TokenTree, TokenValue } from "./types.js";

/** WCAG 2.x level AA minimums. */
export const AA_MINIMUM: Record<ContrastUse, number> = { text: 4.5, "large-text": 3, ui: 3 };

const USE_LABEL: Record<ContrastUse, string> = {
  text: "texto",
  "large-text": "texto grande",
  ui: "elemento de interfaz",
};

const MODE_LABEL: Record<Mode, string> = { light: "modo claro", dark: "modo oscuro" };

export interface ContrastResult {
  foreground: string;
  background: string;
  mode: Mode;
  use: ContrastUse;
  ratio: number;
  minimum: number;
  pass: boolean;
  message: string;
}

function asColor(value: TokenValue, id: string): OklchColor {
  if (typeof value === "object" && value !== null && "colorSpace" in value) return value;
  throw new Error(`${id} no es un color, no se puede medir su contraste.`);
}

/** Checks every foreground/background pair declared in `$extensions` in light and dark mode. */
export function checkContrast(tree: TokenTree): ContrastResult[] {
  const results: ContrastResult[] = [];
  for (const mode of ["light", "dark"] as const) {
    const modeTree = withMode(tree, mode);
    for (const { id, token } of flatten(modeTree)) {
      for (const { against, use } of wsExtensions(token)?.contrast ?? []) {
        const background = refId(against);
        const fg = asColor(resolveValue(modeTree, token.$value), id);
        const bg = asColor(resolveValue(modeTree, against), background);
        const ratio = Number(contrastRatio(fg, bg).toFixed(2));
        const minimum = AA_MINIMUM[use];
        const pass = ratio >= minimum;
        results.push({
          foreground: id,
          background,
          mode,
          use,
          ratio,
          minimum,
          pass,
          message: `${pass ? "Contraste correcto" : "Contraste insuficiente"} en ${MODE_LABEL[mode]}: ${id} sobre ${background} = ${ratio}:1 (mínimo AA para ${USE_LABEL[use]}: ${minimum}:1).`,
        });
      }
    }
  }
  return results;
}

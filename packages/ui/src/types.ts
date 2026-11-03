/** Spacing steps available to layout primitives (component tokens `--ws-flow-gap-*`). */
export type Gap = "3xs" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "section";

export const gapVar = (gap: Gap): string => `var(--ws-flow-gap-${gap})`;

/** Two-part split on a 12-column grid. "brand" follows the composition (`data-ws-split`). */
export type SplitRatio = "brand" | "6-6" | "7-5" | "8-4" | "5-7" | "4-8";

/** Media crop. "brand" follows the composition (`data-ws-media`). */
export type Crop = "brand" | "rect" | "rounded" | "organic";

/** Aspect ratios for frames and figures. */
export type Ratio = "1/1" | "4/3" | "3/2" | "16/9" | "3/4" | "4/5" | "21/9";

/** Surface treatment. "brand" follows the composition (`data-ws-surface`). */
export type Surface = "brand" | "tinted" | "outlined" | "raised" | "plain";

export type HeadingSize = "display" | "h1" | "h2" | "h3" | "h4";

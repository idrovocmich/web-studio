# @idrovocmich/motion

Entrance choreography driven by motion tokens and the brand's motion intensity.

Status: not published yet (planned for phase 3C). Components ship as `.astro` source.

```astro
---
import Reveal from "@idrovocmich/motion/Reveal.astro";
---

<Reveal>…</Reveal>
<!-- Staggers the children; with a single child (e.g. a Grid), staggers its children. -->
<Reveal mode="stagger">
  <Grid>…</Grid>
</Reveal>
```

The brand's `data-ws-reveal` attribute (from `resolveBrand().attributes`) picks the
choreography: `none`, `fade` (opacity only), `rise` (opacity and distance) or `choreographed`
(distance, scale and the expressive curve). Distance, stagger, scale and duration come from the
`--ws-reveal-*` component tokens.

Content is never hidden without the script, under `prefers-reduced-motion: reduce`, in
automated browsers (`navigator.webdriver`, so screenshots show the whole page) or when the
brand's motion is `none`. Elements already on screen are shown before anything is hidden, and
only the entrance is animated. The script is under 1 KB and uses `IntersectionObserver`.

Part of the public engine: it must never contain client brand data, assets or credentials.

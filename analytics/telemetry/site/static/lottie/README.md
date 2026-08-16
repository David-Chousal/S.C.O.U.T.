# Ambient animations (footer seaweed and critters)

Self-hosted so the site makes no external request.

- `lottie.min.js` — the `lottie-web` player, "light" SVG build (bodymovin) v5.12.2.
  MIT License, © Airbnb / Hernan Torrisi. https://github.com/airbnb/lottie-web
- `seaweed.json` — the footer animation, from the "Seaweed" dotLottie (LottieFiles). Pure
  vector, so nothing to inline.
- `jellyfish.json`, `submarine.json`, `crab.json`, `starfish.json`, `turtle.json` — the ambient
  footer and side critters.
- `init.js` — plays any element carrying a `data-lottie` path (the footer `.weed` containers and
  the footer/side critters). Honours `prefers-reduced-motion` and no-ops if the runtime is
  unavailable.

The runtime loads on **every page** (footer seaweed + critters). Everything is same-origin; no
page references an external host.

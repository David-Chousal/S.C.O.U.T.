# Ambient animations (hero fish, footer seaweed)

Self-hosted so the site makes no external request.

- `lottie.min.js` — the `lottie-web` player, "light" SVG build (bodymovin) v5.12.2.
  MIT License, © Airbnb / Hernan Torrisi. https://github.com/airbnb/lottie-web
- `fish.json` — the Home hero animation, from the "Fish Animation" dotLottie (LottieFiles).
  The dotLottie's PNG sprites are inlined as base64 so this one file is self-contained.
- `seaweed.json` — the footer animation, from the "Seaweed" dotLottie (LottieFiles). Pure
  vector, so nothing to inline.
- `fish2.json` — the roaming fish, from the "Fish" dotLottie (LottieFiles), sprites inlined.
- `init.js` — plays any element carrying a `data-lottie` path (the `#hero-fish` container and
  the footer `.weed` containers), and spawns a roaming fish at intervals anywhere in the
  viewport. Honours `prefers-reduced-motion` and no-ops if the runtime is unavailable.

The runtime loads on **every page** (footer seaweed and roaming fish everywhere; the hero fish
only on Home). Everything is same-origin; no page references an external host.

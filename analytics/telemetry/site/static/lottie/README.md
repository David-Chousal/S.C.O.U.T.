# Hero fish animation (Home only)

Self-hosted so the site makes no external request.

- `lottie.min.js` — the `lottie-web` player, "light" SVG build (bodymovin) v5.12.2.
  MIT License, © Airbnb / Hernan Torrisi. https://github.com/airbnb/lottie-web
- `fish.json` — the animation, exported from the "Fish Animation" dotLottie (LottieFiles).
  The dotLottie's PNG sprites are inlined as base64 so this one file is self-contained.
- `init.js` — initialises the animation into `#hero-fish` on the Home page, honouring
  `prefers-reduced-motion` and no-oping if the runtime is unavailable.

Only the Home page loads these. Every other page (Analytics included) stays script-free.

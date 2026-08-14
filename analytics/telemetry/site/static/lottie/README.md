# Ambient animations (hero fish, footer seaweed)

Self-hosted so the site makes no external request.

- `lottie.min.js` — the `lottie-web` player, "light" SVG build (bodymovin) v5.12.2.
  MIT License, © Airbnb / Hernan Torrisi. https://github.com/airbnb/lottie-web
- `fish.json` — the Home hero animation, from the "Fish Animation" dotLottie (LottieFiles).
  The dotLottie's PNG sprites are inlined as base64 so this one file is self-contained.
- `seaweed.json` — the footer animation, from the "Seaweed" dotLottie (LottieFiles). Pure
  vector, so nothing to inline.
- `init.js` — plays any element carrying a `data-lottie` path (the `#hero-fish` container and
  the footer `.weed` containers), honouring `prefers-reduced-motion` and no-oping if the runtime
  is unavailable.

The runtime loads on Home, Technology, Science and About (fish on Home, seaweed in every
footer). The **Analytics** page loads none of this and stays script-free and self-contained.

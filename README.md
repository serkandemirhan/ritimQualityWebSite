# Ritim Quality Marketing Site — V15.3 Device QA

## Structure

- `index.html` — semantic page markup + JSON-LD only
- `css/tokens.css` — design tokens
- `css/base.css` — global document/base styles
- `css/components.css` — shared components/default visuals
- `css/desktop.css` — desktop-only adaptive rules
- `css/mobile.css` — mobile/touch/responsive/reduced-motion rules
- `js/i18n.js` — Turkish / English / French translations
- `js/motion.js` — scroll/motion/pointer rendering
- `js/product-screens.js` — product screenshots, focus, lightbox, signature transition
- `js/mobile.js` — mobile story and mobile interactions
- `js/main.js` — startup, menu, observers and app bootstrap
- `assets/images/` — optimized product screenshots
- `assets/icons/` — Ritim Quality SVG mark/favicon

## Run locally

Do not open `index.html` only through a production assumption. A simple local server is recommended:

```bash
python -m http.server 8080
```

Then open:

`http://localhost:8080`

## Before public deployment

Add the real canonical URL and real social preview (`og:image`) once the final public domain is confirmed.


## V15.3 device breakpoints

- `≤ 820px`: adaptive mobile experience (compact hero, swipe product screens, lightbox)
- `821–1100px`: tablet mode (hamburger navigation + desktop cinematic story with tablet proportions)
- `> 1100px`: full desktop experience

V15.3 also makes the mobile hero single-CTA and normalizes older responsive rules so they cannot override the current mobile design.

# Java Lava — Brand & Redesign Spec

Source: https://www.javalava.rocks/ (current site, built on Wix). Goal: 2–3 modern,
interactive homepage concepts for client approval, then expand the winner to a full
multi-page site, then migrate to Wix (Studio preferred).

## Product facts
- **Name:** Java Lava Coffee Liqueur
- **Price:** $35.99 · **Volume:** 750ml · **ABV:** 20% (40 Proof)
- **Blend:** Ethically sourced Arabica coffee beans + Caribbean Rum + Blue Agave
- **Flavor profile:** Roast • Spice • Earth
- **Positioning:** Bold enough for cocktails, smooth enough to sip neat. Premium,
  born from "the volcanic soils of the world's most prestigious coffee regions."
- **Taglines:** "ignite THE FLOW" · "Johnny Rocks Spirits" · "GET INSPIRED"

## Nav (current)
Home · Shop · Store Locator · More
Future full site: Home · Shop · Our Story · Cocktails/Recipes · Store Locator · Contact

## Typography
- **Display / serif:** Cinzel Decorative (Google Fonts) — premium, editorial
- **Body / sans:** Josefin Sans (Google Fonts)

## Color tokens
| token            | hex       | use                                   |
|------------------|-----------|---------------------------------------|
| `--vol-black`    | #0A0806   | primary background                    |
| `--vol-coffee`   | #2A2010   | secondary dark / coffee brown         |
| `--vol-gold`     | #D4A017   | primary brand gold                    |
| `--vol-gold-lt`  | #F2E8D6   | gold highlight                        |
| `--vol-lava`     | #B8860B   | lava orange (energy / CTAs)           |
| `--vol-ember`    | #D4A017   | ember highlight                       |
| `--vol-cream`    | #F2E8D6   | light text / editorial bg             |
| `--vol-jungle`   | #8A7A60   | jungle green accent (from key visual) |

Gold gradient: `linear-gradient(135deg,#F2E8D6,#D4A017 45%,#8A7A60)`
Lava gradient: `linear-gradient(135deg,#D4A017,#B8860B 55%,#2A2010)`

## Assets (site/assets/)
- `img-58314d.png` (3000×1954) — **hero key visual**: volcano, lava-flowing stump,
  toucan, coffee plants, the bottle. The signature image.
- `bottle.png` (1800×1800) — bottle on a bar shelf (not isolated).
- `logo.png` (500×500) — gold ornate "Java Lava Coffee Liqueur" on black.
- `product-6cafc4.png` — gold logo, transparent bg.
- `hero-wide.png` — illustrated volcano-bean "Johnny Rocks Spirits" logo (cream/gold).
- `social-1/2/3.png` — Instagram / Facebook / TikTok icons.

## Concept directions (homepage)
- **A — Volcanic Cinematic:** full-bleed dark, parallax volcano, GSAP scroll-triggered
  lava/ember reveals, molten-gold typography, bottle reveal on scroll. Immersive.
- **B — Editorial Luxe:** magazine/boutique, ash white + obsidian black, generous whitespace, large
  Cinzel display, refined minimal motion. "Fine spirits" elegance.
- **C — Bold Nightlife:** cocktail-culture energy, neon lava gradients, marquee, bold
  type, interactive cocktail cards, playful micro-interactions. Social / younger.

## Wix migration note
Keep interactions to ones Wix Studio can reproduce (scroll reveals, parallax, sticky
sections, hover states, video bg). Prototype = visual approval + build reference.

## Stack (prototype)
Static HTML per concept + Tailwind (CDN) + GSAP/ScrollTrigger + Lenis smooth scroll.
Deployable as static files (Netlify/Vercel).

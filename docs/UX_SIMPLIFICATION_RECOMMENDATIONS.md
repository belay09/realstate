# UX Simplification Recommendations

**Product:** Habesha Real Estate Advisory (habesha-homes.com)  
**Audience:** Product owner / content ops (non-technical friendly, with concrete actions)  
**Scope:** Public buyer experience - Home → Apartments/Shops → location/project → listing detail → contact  
**Date:** July 2026  
**Codebase audited:** `frontend/src` routes, `PublicLayout`, public pages, i18n (`en`/`am`), home CMS cards, location browse merge

---

## Summary

- The **value proposition is clear and strong**: free buyer advisory, not a developer, compare Ayat + Temer, phone/WhatsApp always visible. That should stay front and center.
- The **journey feels complicated** because the site mixes three mental models: advisory marketplace, multi-developer catalogue, and Ayat sales-strategy calculator (Section 10 / Section 11 language).
- **Navigation is crowded**: Home, Apartments, Shops, Calculator, Ayat homes, Temer homes, Staff, phone, language, theme, and “Browse homes” - buyers see too many parallel doors to the same inventory.
- **Browse is location-first** (`/apartments` cards = Admin → Location pages), which is good for Addis, but **empty location cards** (0 homes) and admin-facing empty copy leak into the public UI.
- **Comparable sites** (AddisRealtor, Property Finder, Temer/Ayat official sites) put **one primary CTA** (browse or talk to an advisor) and keep developer branding secondary to the buyer job.
- **Biggest wins are copy + nav + CMS hygiene**, not a full redesign: hide Staff from public nav, simplify hero CTAs, demote Calculator, fix empty states, and make “Talk to us” the default next step after browsing.
- **Do not dilute** free advisory, dual-developer comparison, Amharic, or the sticky Call/WhatsApp strip (`+251962750710`).

---

## Current user journey (how it works today)

### Public routes (from `App.tsx` + `PublicLayout`)

| Step | Route | What the buyer sees |
|------|--------|---------------------|
| 1. Home | `/` | Full-bleed hero, free-advisory badge, CTAs to `/apartments` and Temer filter, advisory section, CMS home cards (or fallback developer cards), “How we work”, partner credibility stats |
| 2a. Apartments | `/apartments` (+ optional `?company_slug=ayat\|temer`) | Developer filter chips (All / Ayat / Temer), grid of **location** cards from Admin location pages |
| 2b. Shops | `/shops` | Ayat shop zones; CTA to `/calculator?kind=shop` |
| 3. Location / project | `/apartments/:projectSlug` | CMS hero + layouts (Ayat: section nav + embedded calculator; Temer: listing cards) |
| 3b. Shop zone | `/shops/:zoneId` | Floor rates + shop estimate calculator |
| 4. Listing detail | `/listings/:slug` | Gallery, tabs, Ayat embedded calculator or Temer “price on request”, enquiry form + Call/WhatsApp |
| Side path | `/calculator` | Full Ayat price calculator (apartment vs shop, many steps) |

### Happy path today (typical)

1. Land on Home → read “we are not a developer / free advice”.
2. Click **Explore locations** or **Browse homes** → `/apartments`.
3. Optionally filter Ayat vs Temer (also reachable from nav “Ayat homes” / “Temer homes”).
4. Open a location card → `/apartments/{slug}` → pick a layout → `/listings/{slug}`.
5. Call, WhatsApp, or submit the enquiry form.

### Parallel / competing paths

- Home secondary CTA jumps straight to **Temer only**.
- Nav and footer repeat Ayat/Temer as separate destinations **and** Apartments (all).
- Calculator is a top-level nav item; also embedded on Ayat location pages and listing detail.
- Shops are a separate top-level product line (Ayat commercial only).
- **Staff** link appears in public header (desktop + mobile) and footer.

### Content systems that drive public UX

- **Home cards CMS** (`/public/home-cards` → `HomeCmsCardsSection`): controls homepage inventory panels; empty → `HomeDevelopersSection` fallback.
- **Location pages CMS** (Admin): drives which cards appear on `/apartments` and `/shops` (`mergeApartmentBrowseGroups` / shop merge). Cards can show **0 homes** if the location is Active but has no listings.
- **Pricing / calculator config** (Admin → Pricing): powers `/calculator` and shop rates; public error strings sometimes mention Admin.

---

## Pain points (why it feels complicated)

### 1. Too many entry points to the same browse

Public nav currently offers: Home, Apartments, Shops, Calculator, Ayat homes, Temer homes, Staff, phone, Browse homes, language, theme.  
Buyers must decide: “Apartments vs Ayat homes vs Browse homes?” - they are largely the same inventory with different filters.

### 2. Developer-oriented language on a buyer site

Examples in i18n / UI:

- “Section 10 / Section 11”, “official strategy”, “Construction stage”, “Admin → Pricing / Location pages” in **public** empty/error copy (`shops.noLocations`, calculator rate-load errors).
- Hero stats like “2+ Partner developers” and “Years of Ayat experience” read like a B2B partner deck more than a first-time buyer guide.
- Footer: “Compare homes · Choose your developer” emphasizes brands over preferences (budget, bedrooms, area).

### 3. Location cards can feel empty or unfinished

`/apartments` only shows **active** Admin location pages. A published location with no residential listings still appears as **“0 homes”** (`ProjectLocationCard`). That looks broken to buyers (“why is this here?”).

### 4. Calculator complexity vs advisory simplicity

`/calculator` (`AyatPriceCalculator`) is a multi-step tool: apartment vs shop → area → bedrooms/finish → size → floor → down payment / plan. Useful for serious Ayat shoppers; intimidating as a primary nav item. It also repeats on Ayat project pages (`#location-calculator`), which is good - but top-nav promotion makes the whole site feel like a pricing engine.

### 5. Inconsistent depth: Ayat vs Temer

- Ayat location pages: rich hero, section nav, gallery, layouts, embedded calculator.
- Temer: simpler project page + “price on request” + external Temer calculator link.  
First-time buyers may think Temer is “less supported” rather than “ask us / ask Temer for price.”

### 6. Admin vs public confusion

- **Staff** in the public nav invites buyers into login.
- Public empty states teach Admin workflows (“In Admin → Location pages, create a shop…”).
- Theme toggle and dense header chrome add “app” feel rather than advisory storefront.

### 7. Homepage length and dual messaging

Home already states free advisory (hero + badge + `HomeAdvisorySection` + `BelayRoleSection` + credibility). Strong message, but **repeated three times** before inventory - some buyers never reach CMS cards. Hero CTAs split “Explore locations” vs “Browse Temer” instead of one clear “Find a home” + “Talk to us.”

### 8. Amharic / EN is a strength, but density hurts both

Language switcher is present (`LanguageSwitcher`). Long English technical phrases will be equally heavy in Amharic; simplifying EN copy first improves both locales.

---

## What comparable sites do better

Patterns below are from live site reviews (fetched July 2026). Use them as **buyer UX patterns**, not as a call to copy their brand or inventory model.

### AddisRealtor - [addisrealtor.com](https://addisrealtor.com/)

- **One sentence job:** help diaspora / buyers buy in Addis; **no buyer fees** called out early (closest positioning match).
- Homepage hierarchy: **identity → Browse homes / Speak to an agent** → simple filters (company, price, beds, size) → listings → “Book a strategy session.”
- Developers appear as **trusted partners**, not as competing primary nav tabs.
- Contact is framed as **advice session**, not staff login.

**Takeaway for Habesha:** Keep free advisory; make “Browse” and “Talk to us” the only primary actions; demote developer filters to chips on the browse page (already partly true on `/apartments`).

### Property Finder (UAE) - [propertyfinder.ae](https://www.propertyfinder.ae/)

- Hero: **“Your home search starts here”** + one search (Rent / Buy / New projects).
- Filters are buyer language: property type, beds/baths, price, amenities - not developer org charts.
- Secondary browse by **community/area** (similar to your location cards - a good pattern you already have).

**Takeaway:** Lead with **what / where / budget**, not **which company**. Keep location-first browse; add light preference filters later (beds, apartment vs shop).

### Rightmove-style portals - [rightmove.co.uk](https://www.rightmove.co.uk/) (help: start with area + For sale)

- Classic happy path: **area → for sale → filters (beds, price) → results → contact agent**.
- Tools (calculators, AI search) are **supporting**, not equal to primary browse.

**Takeaway:** Calculator should be “Estimate price” under Ayat locations / listing, not a peer of Apartments in the main menu.

### Ayat official - [ayatrealestate.com](https://ayatrealestate.com/)

- Clear **Residential / Commercial** split, phone CTAs, “Request callback,” register.
- Speaks as **the developer** (correct for them; wrong for Habesha to mirror fully).

**Takeaway:** Habesha should keep differentiating: “We help you choose among partners - including Ayat.” Avoid sounding like Ayat’s second website (calculator + Section 11 language currently risks that).

### Temer official - [temerproperties.com](https://temerproperties.com/)

- Project/area search (Sarbet, Aware, Ayat…), bedroom filters, **Call / Book a tour** on cards, WhatsApp-style chat.
- Inventory-first; heavy on projects and listings.

**Takeaway:** Match their **contact frictionlessness** (Call / WhatsApp / enquire). You already have sticky Call/WhatsApp - keep it; make listing/location CTAs equally obvious for Temer “price on request.”

### Realtor Ethiopia - [realtor.com.et](https://realtor.com.et/) (partially available in research)

- Preference-led allocation (budget, location, construction stage, optional developer).
- Positions as **independent of any one developer’s interest**.

**Takeaway:** A short “Tell us what you need” path (even WhatsApp prefill: beds + budget + area) would reinforce Habesha’s advisory brand beyond catalogue browsing.

---

## Recommended simplified journey (ideal happy path)

**Goal:** A first-time buyer should reach a human (call/WhatsApp) or a shortlist in under three decisions.

```text
Home
  ├─ Primary: “Find a home” → /apartments (all partners)
  └─ Secondary: “Call / WhatsApp free advice” → tel / wa.me

/apartments
  ├─ Optional chips: All | Ayat | Temer  (and later: bedrooms)
  ├─ Only show locations with something useful (homes OR clear “ask us”)
  └─ Tap location → /apartments/:slug

/apartments/:slug
  ├─ Photos + plain-language “who builds this” + layouts
  ├─ Soft: “Estimate Ayat price” (collapse or secondary) for Ayat
  └─ Tap layout → /listings/:slug  OR  Call/WhatsApp from location

/listings/:slug
  ├─ Photos, beds/size, developer badge
  ├─ Enquiry form OR one-tap WhatsApp with listing name prefilled
  └─ Call sticky strip always available

Side doors (not primary nav):
  /shops - “Commercial shops” from Home card or footer
  /calculator - linked from Ayat location / listing / shops note
```

**One-line product story on every key page:**  
“Free advice to compare Ayat and Temer - tell us your budget and area.”

---

## Prioritized suggestions

### P0 - Quick wins (1–2 weeks)

#### P0.1 - Slim the public navigation

| | |
|--|--|
| **Problem** | Too many links; Staff and Calculator compete with browse. |
| **Recommendation** | Public header: **Home · Apartments · Shops · Call · Language**. Move Calculator to footer + contextual links. Remove **Staff** from public header/footer (keep `/admin/login` bookmarkable, or a discreet footer “Staff” only on long-press / known URL). Remove duplicate “Ayat homes” / “Temer homes” from nav (filters already exist on `/apartments`). Keep one luxury CTA: **Browse homes** → `/apartments`. |
| **Why** | Matches AddisRealtor / Property Finder “few doors”; reduces wrong clicks into Admin. |
| **Scope** | Frontend: `PublicLayout.tsx`, `PublicFooter.tsx`. Copy: `nav.*` in `en.ts` / `am.ts`. |

#### P0.2 - Fix public empty / error copy (no Admin instructions)

| | |
|--|--|
| **Problem** | Buyers see “Admin → Location pages / Pricing” (`shops.noLocations`, calculator rate errors). |
| **Recommendation** | Public copy: “Shop locations coming soon - call or WhatsApp for availability.” Staff-facing detail stays in Admin UI or docs only. |
| **Why** | Trust and professionalism; Admin leakage is a classic CMS smell. |
| **Scope** | Copy/i18n primarily; optional tiny frontend if error components hardcode strings. |

#### P0.3 - Hide or label empty location cards

| | |
|--|--|
| **Problem** | Active CMS locations with 0 listings show “0 homes” on `/apartments`. |
| **Recommendation** | Either (a) **don’t list** locations with 0 homes unless CMS flag “Coming soon”, or (b) show **“Ask us about this area”** + Call/WhatsApp instead of “0 homes / tap for layouts”. Prefer (a) for P0. |
| **Why** | Empty catalogue cards kill confidence. |
| **Scope** | Frontend: `mergeApartmentBrowseGroups.ts` / `ApartmentsPage.tsx` / `ProjectLocationCard.tsx`. CMS: optional “Coming soon” or only activate when listings exist. |

#### P0.4 - Homepage: one primary browse CTA + one advice CTA

| | |
|--|--|
| **Problem** | Hero splits Explore locations vs Browse Temer; advisory message repeats below. |
| **Recommendation** | Hero CTAs: **Find a home** → `/apartments` and **Get free advice** → `tel:` / WhatsApp. Move Temer/Ayat into the inventory section / filter chips. Shorten or merge `HomeAdvisorySection` + `BelayRoleSection` into one “How free advice works” block. |
| **Why** | Clearer first viewport; less brand competition in the hero. |
| **Scope** | Frontend: `HomePage.tsx`, `HomeAdvisorySection.tsx`. Copy: `home.*`. CMS: ensure home cards point to `/apartments`, `/shops`, not calculator-first. |

#### P0.5 - Demote Calculator in IA; keep the tool

| | |
|--|--|
| **Problem** | `/calculator` as peer nav makes the site feel developer/pricing-heavy. |
| **Recommendation** | Remove from primary nav; keep route. Link from: Ayat location calculator section, listing embedded calculator, shops page note, footer “Price estimate”. Rename in UI to **“Estimate Ayat price”** (buyer language). |
| **Why** | Tool stays useful where Ayat pricing matters; journey stays advisory-first. |
| **Scope** | Frontend layout + i18n labels; no need to delete `AyatCalculatorPage`. |

---

### P1 - Next sprint

#### P1.1 - Buyer preference filters on `/apartments`

| | |
|--|--|
| **Problem** | Only developer filter; first-time buyers think in bedrooms/budget/area. |
| **Recommendation** | Add chips: **1 / 2 / 3+ beds** (client-side from grouped listings). Optional “Has published layouts” only. Budget can wait if prices are indicative/on-request. |
| **Why** | Rightmove / Property Finder core pattern; fits location-first model. |
| **Scope** | Frontend: `ApartmentsPage.tsx` + listing group data. |

#### P1.2 - Unify location page CTA bar (Ayat + Temer)

| | |
|--|--|
| **Problem** | Ayat gets calculator; Temer gets “price on request” with weaker visual parity. |
| **Recommendation** | Shared sticky or top CTA strip on every `/apartments/:slug`: **Call · WhatsApp · Enquire** with message prefilled with location name. Calculator remains secondary accordion for Ayat. |
| **Why** | Contact is the product; pricing tools are optional. |
| **Scope** | Frontend: `ProjectListingsPage.tsx`, possibly shared component with `SiteContactBanner`. |

#### P1.3 - Listing detail: WhatsApp-first, form-second

| | |
|--|--|
| **Problem** | Enquiry form is solid but slower than WhatsApp for Ethiopian buyers; “Schedule a showing” label may over-promise. |
| **Recommendation** | Put **WhatsApp** and **Call** above the form; shorten form (name + phone + optional message). Align label with advisory (“Request free advice”). Keep existing lead API. |
| **Why** | Matches Temer/Ayat market behavior; lowers drop-off. |
| **Scope** | Frontend: `ListingDetailLayout.tsx`. Copy: `listingDetail.*`. |

#### P1.4 - Homepage CMS cards quality bar

| | |
|--|--|
| **Problem** | Inventory section depends on CMS; weak cards or calculator-first links confuse. |
| **Recommendation** | Content checklist: each home card = one job (Ayat homes / Temer homes / Shops), buyer title, one CTA path. Avoid “Section 11” in card descriptions. |
| **Why** | Home is the brand moment; CMS is already the right lever (`HomeCmsCardsSection`). |
| **Scope** | CMS content ops + light copy guidelines (this doc). |

#### P1.5 - Softer calculator defaults / progressive disclosure

| | |
|--|--|
| **Problem** | Many steps and strategy jargon (`calculator` strings in `en.ts`). |
| **Recommendation** | On `/calculator`, start with apartment vs shop in plain words; collapse payment-plan detail until size/floor chosen; replace “Section 11” with “shop areas (Ledeta, Kazanchis, …)”. Keep accuracy disclaimers. |
| **Why** | Retains power users; helps first-timers. |
| **Scope** | Copy + UX tweaks in `AyatPriceCalculator.tsx` / i18n. |

---

### P2 - Later

#### P2.1 - “Tell us what you want” advisory mini-flow

Short WhatsApp deep-link builder: beds + area + budget band → opens WhatsApp with a filled message. Optional simple form posting to `/public/leads` without a listing slug (`source: advisory`).  
**Scope:** Frontend + small API/content. Positions Habesha closer to AddisRealtor “strategy session.”

#### P2.2 - Cross-developer compare view

Side-by-side 2–3 shortlisted layouts (beds, area, developer, indicative price).  
**Scope:** New UI; needs consistent price signals (harder for Temer on-request).

#### P2.3 - Map / area explainer for Addis newcomers

Light map or neighbourhood blurbs on location CMS (not a full GIS product).  
**Scope:** CMS fields + `LocationDetailSections`.

#### P2.4 - Hide theme toggle from primary chrome (optional)

Dark/light is nice for staff; buyers rarely need it in header. Move to footer settings.  
**Scope:** `PublicLayout.tsx`.

#### P2.5 - Analytics on funnel

Track: Home CTA clicks → location open → listing open → WhatsApp/tel/lead. Use to confirm simplification worked.  
**Scope:** Frontend analytics events.

---

## What NOT to change (keep these strengths)

| Strength | Where it lives | Why keep it |
|----------|----------------|-------------|
| Free advisory / no buyer fees / no commission | Hero badge, `HomeAdvisorySection`, SEO strings | Core differentiator vs developer sites |
| “We are not a developer” | Brand header note, belay role, footer | Prevents Ayat/Temer confusion |
| Dual partners on one site | `/apartments` filters, partner logos on cards | Reason to use Habesha vs going to one developer site |
| Phone `+251962750710` + WhatsApp | `siteContact.ts`, sticky `SiteContactStrip`, listing aside | Highest-converting actions in this market |
| Amharic + English | `LanguageSwitcher`, `am.ts` / `en.ts` | Local buyer access |
| Location-first browse | `/apartments` cards from CMS | Matches how Addis inventory is sold (by project/area) |
| Ayat calculator as a **supporting** tool | Embedded on location/listing | Real value for Ayat shoppers when not over-promoted |
| Admin CMS for locations & home cards | Admin listings / properties / home cards | Right ops model - improve content rules, don’t remove |

---

## Optional mock wireframe notes (text only)

### Home (first viewport)

```text
[ Habesha Real Estate Advisory · Free advisory · Not a developer ]

Homes that fit your budget and lifestyle.
100% free advice - no fees from you.

[ Find a home ]   [ WhatsApp / Call ]

(partner logos as quiet trust strip - not second CTAs)
```

### Below fold (one section each)

```text
1) How free advice works (3 short points + Call/WhatsApp)
2) Browse by area - CMS cards: Ayat homes | Temer homes | Shops
3) Footer: Apartments · Shops · Estimate Ayat price · Official partner sites
```

### Apartments (`/apartments`)

```text
Apartment locations
Compare Ayat and Temer in one place.

Filters: [ All ] [ Ayat ] [ Temer ]   later: [ 2 bed ] [ 3 bed ]

Grid of location cards (only with layouts or “Ask us”)
Sticky: Call · WhatsApp
```

### Location page

```text
← All locations
[Cover]
CMC / Project name · Built by Ayat
Short plain description

Layouts (cards) ……… [ Call ] [ WhatsApp ]
[ Estimate price ▾ ]  (Ayat only, collapsed by default on mobile)
```

### Listing detail

```text
Photos
Title · beds · size · Developer badge
[ WhatsApp about this home ] [ Call ]
Optional short enquiry form
```

---

## Implementation map (for engineers - optional)

| Change | Primary files |
|--------|----------------|
| Nav slim | `frontend/src/layout/PublicLayout.tsx`, `PublicFooter.tsx` |
| Home CTAs | `HomePage.tsx`, `HomeAdvisorySection.tsx`, `BelayRoleSection.tsx` |
| Empty locations | `mergeApartmentBrowseGroups.ts`, `ProjectLocationCard.tsx`, `ApartmentsPage.tsx` |
| Public copy | `frontend/src/i18n/locales/en.ts`, `am.ts` |
| Listing contact | `ListingDetailLayout.tsx` |
| Calculator IA | Links only initially; `AyatCalculatorPage.tsx` unchanged |
| Routes (keep) | `/`, `/apartments`, `/apartments/:projectSlug`, `/shops`, `/shops/:zoneId`, `/listings/:slug`, `/calculator` |

---

## Success criteria (simple)

After P0–P1, a new visitor should be able to answer:

1. **Who are you?** Free advisory - not a developer.  
2. **What do I do?** Browse locations or message you.  
3. **Who builds the home?** Ayat or Temer - shown on every card.  
4. **Do I pay you?** No.

If they can answer those without opening Staff, Calculator, or an empty “0 homes” card, the UX simplification succeeded.

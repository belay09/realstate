# Habesha Homes - Simple Listing UX Plan

**Product:** Habesha Real Estate Advisory (habesha-homes.com)  
**Status:** Phase 5 polish done (July 2026)  
**Date:** July 2026  
**Codebase audited:** `frontend/src` routes/layout/pages, calculator/pricing libs, `backend` public listings + pricing schemas, Admin Location pages / Pricing / home cards  
**Related:** [`UX_SIMPLIFICATION_RECOMMENDATIONS.md`](./UX_SIMPLIFICATION_RECOMMENDATIONS.md) (align where it matches; conflicts below)

---

## Goal (owner-clarified IA)

Buyers pick a **partner developer** (Ayat or Temer), then **Residential** or **Shops**, then a **location**. That location page is the **terminal page**: all media, description, layouts/units or shop info, floor m² rates, and Call/WhatsApp - **no further hop** to `/listings/:slug` in the happy path.

The site stays **simple but beautiful**. The **Admin CMS** follows the same mental model (developer → residential/shops → one location with content + rates), not “many listing pages + calculator.”

**Pause** the public price calculator; floor m² tables on the location page are enough. Keep calculator code restorable (feature flag / unlinked route). Staff login stays bookmarkable; hide it from public chrome.

---

## Target IA / user flow

```text
HOME  (/)
  Habesha Homes - free advisory
  [ Ayat ]     [ Temer ]
  Call / WhatsApp always available

DEVELOPER  (/:company  OR  /apartments?company_slug=…)
  Choose product type:
    [ Residential ]     [ Shops ]

RESIDENTIAL LOCATIONS  (…/residential  or filtered apartment list)
  Cards: CMC · Sarbet · … (that developer only)

SHOP LOCATIONS  (…/shops  or filtered shop list)
  Cards: Ledeta · Kazanchis · … (that developer only)

LOCATION DETAIL  - TERMINAL PAGE
  ┌─────────────────────────────────────────────┐
  │ Hero media · name · developer badge         │
  │ Description                                 │
  │                                             │
  │ Residential: layouts/homes summary          │
  │   + floor-band ETB/m² table                 │
  │                                             │
  │ Shops: shop info                            │
  │   + floor (GF / 1F / …) ETB/m² table        │
  │                                             │
  │ [ Call ]  [ WhatsApp ]  (+ optional enquire)│
  └─────────────────────────────────────────────┘
        ▲
        └── No /listings/:slug required after this

OUT OF HAPPY PATH (keep for deep links / SEO if needed):
  /listings/:slug - optional, not primary nav
  /calculator - paused / redirect
```

**What buyers never need for v1:** down-payment math, milestone schedules, multi-step calculator, or browsing “all apartments across all developers” as the primary door.

---

## Proposed public routes (least churn first)

Prefer **query + existing path prefixes** over inventing `/ayat/...` URL trees, unless a later PR wants pretty paths.

| Step | Suggested route | Reuse / notes |
|------|-----------------|---------------|
| Home | `/` | `HomePage` - primary CTAs become Ayat + Temer cards/buttons |
| Developer + kind picker | `/apartments?company_slug=ayat-real-estate` (and Temer slug) **or** dedicated intermediate on same page | Least churn: land on filtered browse with a clear **Residential \| Shops** choice before location grids |
| Residential locations | `/apartments?company_slug=…` (kind=apartment only) | Existing `ApartmentsPage` + `mergeApartmentBrowseGroups` |
| Shop locations | `/shops?company_slug=…` | Existing `ShopLocationsPage`; add company filter if missing |
| Residential location (terminal) | `/apartments/:projectSlug` | Evolve `ProjectListingsPage` into **all-in-one** page (layouts + rates + contact); stop pushing to `/listings/:slug` |
| Shop location (terminal) | `/shops/:zoneId` | Evolve `ShopLocationPage`: keep rate table; drop calculator; ensure full CMS body + contact |
| Legacy listing detail | `/listings/:slug` | Keep route; demote from cards (optional “more photos” later); not in happy path |
| Calculator | `/calculator` | Redirect to developer browse or soft “paused” stub |

**Optional later (more churn):** `/:company`, `/:company/residential`, `/:company/shops`, `/:company/residential/:slug` - only if query URLs feel wrong after Phase 2.

**Nav (slim):** Home · Call / WhatsApp · Language. Developer choice lives on Home (and maybe footer). No Calculator, Staff, or duplicate “Ayat homes / Temer homes / Apartments / Shops” cluster.

---

## What goes on the location page (terminal)

One page per location. No second detail page required.

### Shared

- Hero / gallery media  
- Location name + developer badge (Ayat / Temer)  
- Short plain-language description  
- Sticky or prominent **Call** + **WhatsApp** (prefill location name)  
- Optional short enquire form  
- Indicative-rate disclaimer (ETB/m²; final quote via Habesha advisor)

### Residential location

- Layouts / homes **summary on this page** (beds, size, photos as cards or sections - not links that force `/listings/:slug`)  
- Floor-band **ETB/m² table** (from Admin Pricing / `residentialPriceRows`)  
- Temer without rates: “price on request” + contact (no fake calculator)

### Shop location

- Shop / zone copy + media  
- Floor rate table: GF / 1F / 2F / 3F → ETB/m² (already largely on `ShopLocationPage`)  
- No size × payment-plan calculator

---

## Current state (brief)

### Public routes today (`App.tsx`)

| Route | Role today | Gap vs target IA |
|-------|------------|------------------|
| `/` | Short hero + Ayat / Temer cards only | Matches target IA; CMS inventory / advisory bloat removed |
| `/apartments` | All partners’ residential locations | Skip developer-first step; mixes companies |
| `/apartments/:projectSlug` | Layouts + **embedded calculator** (Ayat); cards → listings | Not terminal; calculator; listing hop |
| `/shops`, `/shops/:zoneId` | Shop list + rates + **calculator** | Not under developer choice; calculator |
| `/listings/:slug` | Full listing detail + calculator | Extra hop owner wants removed from happy path |
| `/calculator` | Multi-step pricing | Pause / hide |

### Admin today

Primary CMS nav matches the public 4-page flow: **Companies → Locations → Floor m² rates** (+ optional **Leads**). Dashboard is a short publish checklist. Properties, Promotions, legacy home cards, and payment-tier UI are gated behind `SHOW_ADMIN_ADVANCED = false` (files kept). Shop GF–3F rates stay on Floor m² rates.

### Alignment with `UX_SIMPLIFICATION_RECOMMENDATIONS.md`

| Earlier UX doc | This plan |
|----------------|-----------|
| Slim nav; hide Staff; Call/WhatsApp first | **Aligned** |
| Demote Calculator; keep as supporting tool | **Conflict** - owner: **hide/pause** calculator; m² tables only |
| Happy path: apartments → location → **listing detail** | **Conflict** - location page is **terminal** |
| Browse all locations first; developers as chips | **Conflict** - Home shows **Ayat + Temer** first, then Residential/Shops |
| Separate top-level `/shops` in primary nav | Soft conflict - shops live **under** a developer; `/shops` may remain as filtered URL |
| Empty “0 homes” / Admin copy in public UI | Still valid - fix in Phase 1–2 |
| Progressive payment-plan disclosure | **Conflict** - no public payment-plan calculator for now |

---

## What we disable / hide (calculator)

Do **not** delete calculator source if restore is easy - `SHOW_PUBLIC_CALCULATOR = false` (or equivalent).

| Item | Action |
|------|--------|
| Nav + footer Calculator | Remove |
| `/calculator` | Redirect or paused stub |
| Embedded calculators (location, listing, shop) | Remove / gate |
| Shop “Open shop calculator” CTA | Remove; keep rate table |
| Payment-plan / down-payment UI on public pages | Hide |
| Home cards CTAs to `/calculator` | Content ops: retarget to developer or location |
| Staff in public header/footer | Remove; `/admin/login` stays |

**Keep in Admin:** Pricing, calculator config, payment plans - staff tools for when calculator returns.

---

## Admin CMS simplification (same IA)

Editors should create **one location** with everything the public terminal page needs - not a scatter of listing pages + calculator mental model.

### Mental model

```text
Developer (Ayat | Temer)
  └─ Kind (Residential | Shops)
       └─ Location
            ├─ Content: title, media, description, visibility
            ├─ Rates: floor / floor-band ETB/m²
            └─ (Residential) optional layout summary blocks
                 - not “publish 12 listing URLs to make the page work”
```

### Screens to keep / merge / hide

| Screen | Direction |
|--------|-----------|
| **Location pages** | **Primary editor.** One form (or clear tabs) per location: content + link/edit rates + residential layout summary. Filter by company + kind to mirror public IA. |
| **Pricing** | Keep as rate source, but surface **from the location editor** (“Edit m² rates for this location”) so ops don’t hunt a separate calculator world. Simplify public-facing copy on Pricing page: “these rows power the location m² table.” |
| **Calculator config editor** | Keep for staff/restore; **de-emphasize** in nav copy (not the main content path). Shop zone rates stay editable; down-payment/milestones not required for public v1. |
| **Properties / listings** | **Demote** for public UX: optional deep content or internal inventory; **not required** to complete a public location page. Hide or collapse “must create listing to show on site” messaging. |
| **Home cards** | **Hidden** (`SHOW_ADMIN_ADVANCED`). Home uses **Companies** CMS. |
| **Dashboard** | Short publish checklist: Companies → Locations → Rates → Leads. |

### How an editor publishes one location

1. Pick company (Ayat/Temer) + kind (Residential/Shops).  
2. Create/edit Location page: title, photos, description, Active.  
3. Set floor m² rates (inline or deep-link into Pricing rows / commercial zone).  
4. Residential: add layout summary (beds/size/photos) on the same location record or a lightweight attached block - **without** needing `/listings/:slug` for the happy path.  
5. Preview public terminal URL.

---

## Phased implementation (step-by-step PRs)

### Phase 0: Plan (this doc)

- Owner IA locked: Home → developer → Residential/Shops → location terminal.  
- Calculator paused; CMS to follow same structure.  

**Acceptance:** Owner approves this document.

---

### Phase 1: Hide calculator + slim nav

**Status:** done (July 2026)

**Goal:** Site stops feeling like a pricing engine.

**Touch:** `PublicLayout`, `PublicFooter`, `App.tsx` (`/calculator`), `ProjectListingsPage`, `ListingDetailLayout`, `ShopLocationsPage`, `ShopLocationPage`, `GroupedLocationListingCards`, i18n, `featureFlags.ts`, soft Home CTA cleanup.

**Acceptance:**

- [x] No Calculator / Staff in public chrome  
- [x] `/calculator` does not expose the multi-step tool  
- [x] Shop/residential pages keep or show m² tables where data exists; no embedded calculator  
- [x] `/admin/login` still works  

**Out of scope:** New IA branching, terminal-page content merge, Admin redesign.

---

### Phase 2: Home → developer → Residential / Shops branching

**Status:** done (July 2026)

**Goal:** Primary happy path matches owner IA.

**Touch:**

- `HomePage` - primary doors: **Ayat** and **Temer** (plus Call/WhatsApp).  
- Intermediate kind picker (Residential | Shops) for that `company_slug`.  
- Residential list filtered to that company; shop list filtered to that company.  
- Slim nav already from Phase 1; footer partners ok.  
- Empty-state hygiene: no “0 homes” as only CTA.

**Suggested URLs (low churn):**

1. `/` → Ayat or Temer  
2. `/developers/:companySlug` kind picker → Residential | Shops  
3. `/apartments?company_slug=…` / `/shops?company_slug=…` location lists  

**Acceptance:**

- [x] Buyer can go Home → Ayat/Temer → Residential or Shops → location list in ≤3 clicks  
- [x] No all-developers-first primary CTA required  
- [x] No calculator reintroduced  

#### Home chrome trim (owner follow-up, July 2026)

Home is **only** a short hero + Ayat / Temer cards → `/developers/:slug`. Removed from Home: CMS inventory (`HomeCmsCardsSection`), long advisory multi-section, credibility stats, Belay role, partner marquee. Public header is Home + Call + language (no Apartments/Shops). Footer is contact + developer links (no explore menu for `/apartments` / `/shops`). Deep-link routes stay; they are not promoted as peer destinations.  

---

### Phase 3: Location terminal pages (all details in one)

**Status:** done (July 2026)

**Goal:** Location page is enough; no listing-detail hop in happy path.

**Touch:**

- `ProjectListingsPage` - layouts/homes summary **inline**; residential floor m² table; contact; remove/hide “open listing” as required next step.  
- `ShopLocationPage` - full CMS + rate table + contact; already mostly terminal.  
- Shared presentational `FloorRateTable` / `ResidentialFloorRateTable`.  
- Listing cards: if kept, expand inline or optional; do not require `/listings/:slug`.  
- Keep `/listings/:slug` for bookmarks/SEO but demote.

**Acceptance:**

- [x] Residential location shows media, summary, m² table, Call/WhatsApp without visiting `/listings/:slug`  
- [x] Shop location same for shops  
- [x] Temer without rates: contact, not broken table  

---

### Phase 4: Admin CMS aligned to IA

**Status:** done (July 2026) - **Phase 4+ slim:** admin primary nav is Companies / Locations / Floor m² rates / Leads only; advanced screens gated, not deleted.

**Goal:** Editors work developer → kind → location content + rates.

**Touch:**

- Admin Location pages: company + kind filters; clearer “this powers the public terminal page” helper text.  
- Inline or linked rate editing from location form.  
- Dashboard / nav: Location pages primary; Properties demoted → **hidden** via `SHOW_ADMIN_ADVANCED`.  
- Home cards: unused on public home → **hidden**; Companies is the home CMS.  
- Docs/helper copy: stop teaching “create many listings + open calculator.”

**Acceptance:**

- [x] New location can be published with content + rates without creating a public listing URL  
- [x] Admin filters mirror public company + kind  
- [x] Pricing still updates public m² tables  
- [x] Admin sidebar ~3–4 items matching public 4-page flow  

---

### Phase 5: Polish (simple but beautiful)

**Status:** done (July 2026)

**Goal:** Calm, branded, photo-led; not a dashboard.

**Touch:** Home first viewport (brand + one line + Ayat/Temer + contact); location hero consistency; mobile rate tables; EN/AM smoke; optional theme toggle to footer; trim repeated advisory sections.

**Acceptance:**

- [x] First viewport: who you are + Ayat/Temer next step  
- [x] Location terminal readable on phone  
- [x] EN + AM checked on Home → developer → location  

---

## Open questions (short)

1. **Temer rates:** Supply floor m² in Admin like Ayat, or “price on request” only?  
2. **`/calculator` bookmarks:** Silent redirect, or one-line “paused - call/WhatsApp”?  
3. **Pretty URLs later?** Stay on `?company_slug=` or add `/:company/...` after Phase 2?  
4. **Layout photos:** Always inline on location, or allow optional `/listings/:slug` for large galleries only?

---

## Recommended first PR after plan approval

**Title:** `Hide public calculator and slim browse navigation`

**Scope = Phase 1 only:**

1. `SHOW_PUBLIC_CALCULATOR = false` - gate all public `AyatPriceCalculator` mounts.  
2. Slim `PublicLayout` + `PublicFooter` (no Calculator / Staff / duplicate developer links).  
3. Redirect or pause `/calculator`.  
4. Remove shop/location/listing calculator sections; **keep** shop m² rate table.  
5. Soften Home CTAs toward partners + contact (full Ayat/Temer IA branching can wait for Phase 2).  
6. i18n for removed CTAs; **no** Admin schema changes.

**Out of scope for first PR:** Developer kind picker, terminal-page merge, Admin CMS restructure, visual redesign, deleting calculator source files.

**Test plan:**

- [x] Header/footer - no Calculator/Staff  
- [x] `/calculator` - redirect or paused  
- [x] Ayat location + shop zone - no calculator; rates still visible where seeded  
- [ ] `/admin/login` + `/admin/pricing` still work  
- [ ] Call/WhatsApp strip unchanged  

*(Manual smoke for admin login / contact strip left for local verify.)*

---

## Appendix - key file map

| Area | Paths |
|------|--------|
| Routes | `frontend/src/App.tsx` |
| Nav | `frontend/src/layout/PublicLayout.tsx`, `components/PublicFooter.tsx` |
| Home | `frontend/src/pages/HomePage.tsx` |
| Apartments browse | `pages/ApartmentsPage.tsx`, `lib/mergeApartmentBrowseGroups.ts` |
| Location (residential) | `pages/ProjectListingsPage.tsx`, `components/FloorRateTable.tsx`, `lib/residentialFloorRates.ts` |
| Shops | `pages/ShopLocationsPage.tsx`, `pages/ShopLocationPage.tsx`, `lib/shopLocations.ts` |
| Listing (legacy deep link) | `pages/ListingDetailPage.tsx`, `components/ListingDetailLayout.tsx` |
| Calculator | `pages/AyatCalculatorPage.tsx`, `components/AyatPriceCalculator.tsx`, `lib/ayatCalculator.ts`, `hooks/useCalculatorConfig.ts` |
| Admin CMS | `pages/admin/AdminListingsPage.tsx`, `AdminCompaniesPage.tsx`, `AdminPropertyListingsPage.tsx`, `AdminDashboardPage.tsx`, `layout/AdminLayout.tsx` |
| Admin rates | `pages/admin/AdminPricingPage.tsx`, `CalculatorConfigEditor.tsx` |
| Partners | `frontend/src/content/partners.ts` |
| API | `backend/app/api/v1/routes/public_listings.py` |
| Models | `backend/app/models/inventory.py` (`LocationContent`) |

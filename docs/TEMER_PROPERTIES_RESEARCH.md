# Temer Properties — scraped site documentation

> **Source:** [https://temerproperties.com](https://temerproperties.com)  
> **Scraped (UTC):** 2026-05-29T06:26:10.247804+00:00  
> **Purpose:** Reference for Belay Properties integration (listings, copy, contact, projects).  
> **Machine-readable export:** [`backend/data/temer_scraped.json`](../backend/data/temer_scraped.json)  
> **Refresh:** `python3 scripts/scrape_temer_properties.py`

---

## 1. Company profile

| Field | Value |
|-------|-------|
| Brand | Temer Properties |
| Suggested Belay slug | `temer-properties` |
| Website | https://temerproperties.com/ |
| Address | Sarbet to Kera Road, Woldemaryam Building, Addis Ababa, Ethiopia |
| Hotline | 6033 |
| Mobile | +251975666699, +251939555558 |
| Email | [info@temerproperties.com](mailto:info@temerproperties.com) |
| About page | https://temerproperties.com/about-us/ |
| Contact page | https://temerproperties.com/contact-us-2/ |
| Logo (full) | https://temerproperties.com/wp-content/uploads/2025/06/Temer-logo-png.png |

**Positioning (from contact page):** Temer is a real estate developer in Addis Ababa specializing in apartments, houses, and commercial space, with emphasis on quality and timely delivery.

**Tagline / hero:** “Make your next move with us” / “Real estate in Ethiopia”.

---

## 2. Site map & navigation

WordPress + Houzez theme. Public **REST API** (`/wp-json/`) returns 403 — data collected via **Yoast sitemaps** and HTML.

| Sitemap | Count | URL |
|--------|-------|-----|
| Properties (`estate_property`) | 32 | https://temerproperties.com/estate_property-sitemap.xml |
| Pages | 110 | https://temerproperties.com/page-sitemap.xml |
| Blog posts | 85 | https://temerproperties.com/post-sitemap.xml |
| Property areas | 6 | https://temerproperties.com/property_area-sitemap.xml |

### Main menu (public)

- Home
- **Projects** → Properties standard list, Half map list, Construction update (In progress / Delivered / Upcoming)
- About → [`/about-us/`](https://temerproperties.com/about-us/)
- Blog → [`/blog-list/`](https://temerproperties.com/blog-list/)
- **Our team** → Management, Sales officers, Sales agents, [Job portal](https://temerproperties.com/job-portal/)
- Book now / Contact → [`/contact-us-2/`](https://temerproperties.com/contact-us-2/)
- User accounts (login / register / reset password)

### Useful listing indexes

- [Properties standard list](https://temerproperties.com/properties-standard-list/)
- [Half map properties](https://temerproperties.com/half-map-properties-list/)
- [Construction update hub](https://temerproperties.com/construction-update/)
- [Delivered projects](https://temerproperties.com/deliverd-projects/)
- [Compare listings](https://temerproperties.com/compare-listings/)
- [Price calculator on Temer site](https://temerproperties.com/price-calculator/) — see **§6.1** below

### Lead capture on Temer site

- Call, WhatsApp, Hotline **6033** on every listing
- “Book a tour” / “Contact me” with 15-minute slots (07:00–19:45)
- Pop-up forms (“Let’s find your perfect home”) + Amharic chat widget
- Compare listings, favorites, CRM pages (internal)

---

## 3. Geographic areas

Search filters and archive pages use these **areas** (all in Addis Ababa):

### Properties listed in Aware

- **URL:** https://temerproperties.com/For-Sale/aware-area/
- **Description:** Aware Site is a modern mixed-use development located in a prime area of Addis Ababa. It features a variety of residential options, including one-, two-, and three-bedroom apartments, designed to provide comfort, convenience, and a stylish urban lifestyle. Combining residential and commercial spaces, Aware Site offers a vibrant and dynamic environment in one of the city’s most sought-after locations.

### Properties listed in Ayat

- **URL:** https://temerproperties.com/For-Sale/ayat-area/
- **Description:** The Ayat To Center project is a premium residential development by Temer Properties, situated in the Ayat area of Addis Ababa.

### Properties listed in Garment

- **URL:** https://temerproperties.com/For-Sale/garment-area/
- **Description:** Haile Garment is a modern residential apartment project by Temer Real Estate, located in a prime area of Addis Ababa. It offers quality homes with top amenities, ideal for comfortable urban living.

### Properties listed in Gelan

- **URL:** https://temerproperties.com/For-Sale/gelan-area/
- **Description:** Gelan Shopping Center is a modern commercial hub located in a prime area. Designed as a full-scale commercial center, it offers a variety of retail, office, and service spaces to meet the needs of businesses and shoppers alike. With its strategic location and vibrant layout, Gelan Shopping Center provides a dynamic environment that combines convenience, accessibility, and a premier shopping and business experience in one of the city’s most sought-after areas.

### Lycee 003 – Seken

- **URL:** https://temerproperties.com/For-Sale/piyassa-area/
- **Description:** Sumaletera is a centrally located neighborhood in Addis Ababa, Ethiopia, situated near the historic Piassa area.

### Sarbet Blue Point

- **URL:** https://temerproperties.com/For-Sale/sarbet/
- **Description:** Sarbet is a sought-after neighborhood in southwest Addis Ababa, known for its blend of tranquility and urban convenience.

---

## 4. Developments & projects

Homepage highlights 18+ named developments. Below: **primary project landing pages** (excluding monthly construction-update duplicates).

| Project (homepage) | Area | Project page |
|--------------------|------|--------------|
| Sarbet City Plus | Sarbet | https://temerproperties.com/project/sarbet-city-plus/ |
| Bulgaria | Sarbet | *(no dedicated page in scrape)* |
| Ayat 49 | Ayat | *(no dedicated page in scrape)* |
| Gelan Shopping Center | Gelan | https://temerproperties.com/gelan-commercial-center/ |
| Aware | Aware | https://temerproperties.com/aware-project/ |
| Lycee – Burat | Piyassa | https://temerproperties.com/lycee-burat-project/ |
| Sarbet – Blue Point | Sarbet | https://temerproperties.com/sarbet-blue-point-project/ |
| Lycee – NewRoad | Piyassa | https://temerproperties.com/lycee-newroad-project/ |
| Lycee – Seken | Piyassa | https://temerproperties.com/lycee-seken-project/ |
| Ayat Feres Bet | Ayat | https://temerproperties.com/ayat-feres-bet-project-2/ |
| Ayat To Center | Ayat | https://temerproperties.com/ayat-to-center-project/ |
| Achante | Ayat | https://temerproperties.com/achante-project/ |
| Sarbet-Seken | Sarbet | *(no dedicated page in scrape)* |
| Adwa – Ewket | Piyassa | https://temerproperties.com/ewket-project/ |
| Adwa – Empire | Piyassa | *(no dedicated page in scrape)* |
| Arada Site | Piyassa | *(no dedicated page in scrape)* |
| Haile Garment | Garment | https://temerproperties.com/haile-garment-site-update/ |
| Sarbet Au 1 | Sarbet | https://temerproperties.com/sarbet-au-project/ |

### Scraped project / construction pages

- [Achante](https://temerproperties.com/lycee-seken-project-temer-real-estate-in-ethiopia/)
- [Achante Project - Temer Real Estate Ethiopia](https://temerproperties.com/achante-project/)
- [Adwa 001 Project](https://temerproperties.com/ewket-project/)
- [Aware Project - Temer Real Estate Ethiopia](https://temerproperties.com/aware-project/)
- [Ayat Feres Bet Project](https://temerproperties.com/ayat-feres-bet-project/)
- [Ayat Feres Bet Project - Temer Real Estate Ethiopia](https://temerproperties.com/ayat-feres-bet-project-2/)
- [Ayat To Center Project](https://temerproperties.com/sarbet-seken-5/)
- [Ayat To Center Project - Temer Real Estate Ethiopia](https://temerproperties.com/ayat-to-center-project/)
- [Deliverd-projects - Temer Real Estate Ethiopia](https://temerproperties.com/deliverd-projects/)
- [Gelan Commercial Center - Temer Real Estate Ethiopia](https://temerproperties.com/gelan-commercial-center/)
- [Lycee Burat Project - Temer Real Estate Ethiopia](https://temerproperties.com/lycee-burat-project/)
- [Lycee NewRoad Project - Temer Real Estate Ethiopia](https://temerproperties.com/lycee-newroad-project/)
- [Lycee Seken Project - Temer Real Estate Ethiopia](https://temerproperties.com/lycee-seken-project/)
- [Lycee-Seken Project](https://temerproperties.com/lycee-seken/)
- [O and O Project - Temer Real Estate Ethiopia](https://temerproperties.com/o-and-o-project/)
- [Sarbet Au Project - Temer Real Estate Ethiopia](https://temerproperties.com/sarbet-au-project/)
- [Sarbet-Blue Point Project - Temer Real Estate Ethiopia](https://temerproperties.com/sarbet-blue-point-project/)
- [Temer Real Estate Ethiopia SAHIL- Project - Temer Real Estate Ethiopia](https://temerproperties.com/sahil-project/)

**Delivered projects** (marketing carousel): AGT-TRADING (Atena Tera), Maw (Ayat site), 2MA / SAHIL / Mohammed.s (Lebu), and others on [`/deliverd-projects/`](https://temerproperties.com/deliverd-projects/).

---

## 5. Property catalog (all 32 listings)

Complete inventory from `estate_property-sitemap.xml`. **List prices are rarely shown on listing pages** — sales via phone / office. Homepage/marketing sizes for key Sarbet City Plus units: 1BR **76 m²**, 2BR **99–100 m²**, 3BR **136–151 m²**; Blue Point 3BR **145 m²**; Aware 3BR **145 m²**, 1BR **80 m²**.

| # | Title | Beds | Baths | Size | Area | Delivery | Temer ID | Path |
|---|-------|------|-------|------|------|----------|----------|------|
| 1 | Aware – One BedRoom Apartment | 1 | 9 | — | aware-area | 36 Months | 25920 | `/apartment-for-sale/aware-one-bedroom-apartment-3/` |
| 2 | Aware – Three BedRoom Apartment | 3 | 2 | — | aware-area | 36 Months | 25934 | `/apartment-for-sale/aware-three-bedroom-apartment/` |
| 3 | Aware-4 Kilo,Three BedRoom Apartment | 3 | 2 | — | aware-area | — | 21243 | `/apartment-for-sale/aware-4-kilo-three-bedroom-apartment/` |
| 4 | Aware-4 kilo,Two BedRoom Apartment | 2 | 1 | — | aware-area | — | 21244 | `/apartment-for-sale/aware-4kilo-two-bedroom-apartment/` |
| 5 | Achantan,Three BedRoom Apartment | 3 | 2 | — | ayat-area | 30 Months | 21263 | `/apartment-for-sale/achantan-three-bedroom-apartment/` |
| 6 | Ayat Feres Bet,Three BedRoom Apartment | 3 | 2 | — | ayat-area | — | 21259 | `/apartment-for-sale/ayat-feres-betthree-bedroom-apartment/` |
| 7 | Ayat Feres Bet,Two BedRoom Apartment | 2 | 1 | — | ayat-area | 30 Months | 21261 | `/apartment-for-sale/ayatferesbet-two-bedroom-apartment/` |
| 8 | Ayat Lomiyad,Four BedRoom Apartment | 3 | 2 | — | ayat-area | — | 21247 | `/apartment-for-sale/ayat-lomiyad-four-bedroom-apartment/` |
| 9 | Ayat Lomiyad,Three BedRoom Apartment | 3 | 2 | — | ayat-area | — | 21246 | `/apartment-for-sale/ayat-lomiyad-three-bedroom-apartment-2/` |
| 10 | Ayat Lomiyad,Two BedRoom Apartment | 2 | 1 | — | ayat-area | — | 21245 | `/apartment-for-sale/ayatlomiyad-two-bedroom-apartment/` |
| 11 | Ayat To Center,Three BedRoom Apartment | 3 | 2 | — | ayat-area | 30 Months | 21349 | `/apartment-for-sale/ayat-to-center-three-bedroom-apartment-2/` |
| 12 | Haile Garment,Three BedRoom Apartment | 3 | 2 | — | garment-area | — | 21240 | `/apartment-for-sale/haile-garment-three-bedroom-apartment/` |
| 13 | Gelan Shopping Center | 7 | 9 | — | gelan-area | 30 Months | 25918 | `/apartment-for-sale/gelan-shopping-center/` |
| 14 | Adwa -ewket, Shops | 7 | 9 | — | piyassa-area | 16 Months | 21354 | `/apartment-for-sale/adwa-ewketshops-2/` |
| 15 | Adwa-empire, Shops | 7 | 9 | — | piyassa-area | — | 21355 | `/apartment-for-sale/adwa-empire-shops/` |
| 16 | Arada Site, Shops | 7 | 9 | — | piyassa-area | 16 Months | 21356 | `/apartment-for-sale/arada-site-shops-2/` |
| 17 | LYCEE Seken- One BedRoom Apartment | 1 | 1 | — | piyassa-area | 30 Months | 22257 | `/apartment-for-sale/lycee-003-one-bedroom-apartment/` |
| 18 | LYCEE Seken- Three BedRoom Apartment | 3 | 2 | — | piyassa-area | 30 Months | 22236 | `/apartment-for-sale/lycee-seken-seken-three-bedroom-2/` |
| 19 | LYCEE Seken- Two BedRoom Apartment | 2 | 1 | — | piyassa-area | 30 Months | 22250 | `/apartment-for-sale/lycee-003-seken-three-bedroom/` |
| 20 | Lycee Burat,One BedRoom Apartment | 1 | 1 | — | piyassa-area | — | 21234 | `/apartment-for-sale/lycee-burat-one-bedroom-apartment/` |
| 21 | Lycee Burat,Three BedRoom Apartment | 3 | 2 | — | piyassa-area | — | 21237 | `/apartment-for-sale/lycee-burat-three-bedroom-apartment/` |
| 22 | Lycee Burat,Two BedRoom Apartment | 2 | 1 | — | piyassa-area | — | 21236 | `/apartment-for-sale/lycee-burat-two-bedroom-apartment/` |
| 23 | Lycee NewRoad,Three BedRoom Apartment | 3 | 2 | — | piyassa-area | — | 21239 | `/apartment-for-sale/lycee-newroad-three-bedroom-apartment-2-2/` |
| 24 | Lycee NewRoad,Two BedRoom Apartment | 2 | 1 | — | piyassa-area | — | 21238 | `/apartment-for-sale/lycee-newroad-three-bedroom-apartment-2/` |
| 25 | SumaleTera,Three BedRoom Apartment | 3 | 2 | — | piyassa-area | — | 21248 | `/apartment-for-sale/sumaletera-three-bedroom-apartment/` |
| 26 | Sarbet -Au,Three BedRoom Apartment | 3 | 2 | — | sarbet | 30 months | 21653 | `/apartment-for-sale/sarbet-au-three-bedroom-apartment/` |
| 27 | Sarbet -Au,Two BedRoom Apartment | 3 | 2 | — | sarbet | 30 Months | 21654 | `/apartment-for-sale/sarbet-au-two-bedroom-apartment/` |
| 28 | Sarbet -Blue Point Three BedRoom Apartment | 3 | 2 | — | sarbet | 36 Months | 25947 | `/apartment-for-sale/sarbet-blue-point-three-bedroom-apartment/` |
| 29 | Sarbet -City Plus One BedRoom Apartment | 1 | 1 | — | sarbet | 36 Months | 28908 | `/apartment-for-sale/sarbet-city-plus-one-bedroom-apartment/` |
| 30 | Sarbet -City Plus Three BedRoom Apartment | 3 | 2 | — | sarbet | 36 Months | 28802 | `/apartment-for-sale/sarbet-city-plus-three-bedroom-apartment/` |
| 31 | Sarbet -City Plus Two BedRoom Apartment | 2 | 2 | — | sarbet | 36 Months | 28893 | `/apartment-for-sale/sarbet-city-plus-two-bedroom/` |
| 32 | Sarbet -Seken,Three BedRoom Apartment | 3 | 2 | — | sarbet | — | 21242 | `/apartment-for-sale/sarbet-three-bedroom-apartment-2/` |

### Per-listing details

#### Aware – One BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/aware-one-bedroom-apartment-3/
- **Slug:** `aware-one-bedroom-apartment-3`
- **Temer property ID:** 25920
- **Area:** aware-area · **Location label:** Aware
- **Bedrooms / bathrooms:** 1 / 9
- **Size:** —
- **Delivery:** 36 Months
- **Building Size:** 2B+G+20+T
- **Building Type:** Residential
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** Yes
- **Summary:** Start your real estate journey in Ethiopia with Temer Properties. Discover quality apartments for sale in Addis Ababa and beyond.
- **Images:** 12 URLs (see JSON)

#### Aware – Three BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/aware-three-bedroom-apartment/
- **Slug:** `aware-three-bedroom-apartment`
- **Temer property ID:** 25934
- **Area:** aware-area · **Location label:** Aware
- **Bedrooms / bathrooms:** 3 / 2
- **Size:** —
- **Delivery:** 36 Months
- **Building Size:** 2B+G+20+T
- **Building Type:** Residential
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** Yes
- **Summary:** Start your real estate journey in Ethiopia with Temer Properties. Discover quality apartments for sale in Addis Ababa and beyond.
- **Images:** 12 URLs (see JSON)

#### Aware-4 Kilo,Three BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/aware-4-kilo-three-bedroom-apartment/
- **Slug:** `aware-4-kilo-three-bedroom-apartment`
- **Temer property ID:** 21243
- **Area:** aware-area · **Location label:** —
- **Bedrooms / bathrooms:** 3 / 2
- **Size:** —
- **Delivery:** —
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Summary:** Real estate in Ethiopia starts here—with Temer Real Estate. Explore the Aware - 4 kilo Three-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Aware-4 kilo,Two BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/aware-4kilo-two-bedroom-apartment/
- **Slug:** `aware-4kilo-two-bedroom-apartment`
- **Temer property ID:** 21244
- **Area:** aware-area · **Location label:** —
- **Bedrooms / bathrooms:** 2 / 1
- **Size:** —
- **Delivery:** —
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Summary:** Real estate in Ethiopia starts here—with Temer Real Estate. Explore theAware - 4 kilo Two-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Achantan,Three BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/achantan-three-bedroom-apartment/
- **Slug:** `achantan-three-bedroom-apartment`
- **Temer property ID:** 21263
- **Area:** ayat-area · **Location label:** Ayat
- **Bedrooms / bathrooms:** 3 / 2
- **Size:** —
- **Delivery:** 30 Months
- **Building Size:** B+G+10+T
- **Building Type:** Residential
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** Yes
- **Summary:** Real estate in Ethiopia at its best—explore Achantan, a modern three-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Ayat Feres Bet,Three BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/ayat-feres-betthree-bedroom-apartment/
- **Slug:** `ayat-feres-betthree-bedroom-apartment`
- **Temer property ID:** 21259
- **Area:** ayat-area · **Location label:** —
- **Bedrooms / bathrooms:** 3 / 2
- **Size:** —
- **Delivery:** —
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Summary:** Real estate in Ethiopia starts here—with Temer Real Estate. Explore the Ayat Feres Bet three-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Ayat Feres Bet,Two BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/ayatferesbet-two-bedroom-apartment/
- **Slug:** `ayatferesbet-two-bedroom-apartment`
- **Temer property ID:** 21261
- **Area:** ayat-area · **Location label:** Ayat
- **Bedrooms / bathrooms:** 2 / 1
- **Size:** —
- **Delivery:** 30 Months
- **Building Size:** 2B+G+16+T
- **Building Type:** Residential
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** cement
- **Summary:** Real estate in Ethiopia starts here— with Temer Real Estate. Explore the Ayat Feres Bet two-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Ayat Lomiyad,Four BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/ayat-lomiyad-four-bedroom-apartment/
- **Slug:** `ayat-lomiyad-four-bedroom-apartment`
- **Temer property ID:** 21247
- **Area:** ayat-area · **Location label:** —
- **Bedrooms / bathrooms:** 3 / 2
- **Size:** —
- **Delivery:** —
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Summary:** Real estate in Ethiopia starts here—with Temer Real Estate. Explore the Ayat Lomiyad four-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Ayat Lomiyad,Three BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/ayat-lomiyad-three-bedroom-apartment-2/
- **Slug:** `ayat-lomiyad-three-bedroom-apartment-2`
- **Temer property ID:** 21246
- **Area:** ayat-area · **Location label:** —
- **Bedrooms / bathrooms:** 3 / 2
- **Size:** —
- **Delivery:** —
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Summary:** Real estate in Ethiopia starts here—with Temer Real Estate. Explore the Ayat Lomiyad three-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Ayat Lomiyad,Two BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/ayatlomiyad-two-bedroom-apartment/
- **Slug:** `ayatlomiyad-two-bedroom-apartment`
- **Temer property ID:** 21245
- **Area:** ayat-area · **Location label:** —
- **Bedrooms / bathrooms:** 2 / 1
- **Size:** —
- **Delivery:** —
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Summary:** Real estate in Ethiopia starts here—with Temer Real Estate. Explore the Ayat Lomiyad Two-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Ayat To Center,Three BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/ayat-to-center-three-bedroom-apartment-2/
- **Slug:** `ayat-to-center-three-bedroom-apartment-2`
- **Temer property ID:** 21349
- **Area:** ayat-area · **Location label:** Ayat
- **Bedrooms / bathrooms:** 3 / 2
- **Size:** —
- **Delivery:** 30 Months
- **Building Size:** 3B+G+15
- **Building Type:** Residential
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** yes
- **Summary:** Real estate in Ethiopia at its best—discover Ayat To Center, a spacious three-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Haile Garment,Three BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/haile-garment-three-bedroom-apartment/
- **Slug:** `haile-garment-three-bedroom-apartment`
- **Temer property ID:** 21240
- **Area:** garment-area · **Location label:** —
- **Bedrooms / bathrooms:** 3 / 2
- **Size:** —
- **Delivery:** —
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Summary:** Real estate in Ethiopia starts here—with Temer Real Estate. Explore the Haile-Garment Three-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Gelan Shopping Center

- **URL:** https://temerproperties.com/apartment-for-sale/gelan-shopping-center/
- **Slug:** `gelan-shopping-center`
- **Temer property ID:** 25918
- **Area:** gelan-area · **Location label:** Gelan
- **Bedrooms / bathrooms:** 7 / 9
- **Size:** —
- **Delivery:** 30 Months
- **Building Size:** G+7
- **Building Type:** Commercial
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** No
- **Summary:** Real estate in Ethiopia at its best—discover -Gelan Shops , modern and luxury shops for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Adwa -ewket, Shops

- **URL:** https://temerproperties.com/apartment-for-sale/adwa-ewketshops-2/
- **Slug:** `adwa-ewketshops-2`
- **Temer property ID:** 21354
- **Area:** piyassa-area · **Location label:** Piyassa
- **Bedrooms / bathrooms:** 7 / 9
- **Size:** —
- **Delivery:** 16 Months
- **Building Size:** 2B+G+5
- **Building Type:** Commercial
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Summary:** Real estate in Ethiopia at its best—discover Adwa 001-Shops, modern and luxury shops for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Adwa-empire, Shops

- **URL:** https://temerproperties.com/apartment-for-sale/adwa-empire-shops/
- **Slug:** `adwa-empire-shops`
- **Temer property ID:** 21355
- **Area:** piyassa-area · **Location label:** —
- **Bedrooms / bathrooms:** 7 / 9
- **Size:** —
- **Delivery:** —
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Summary:** Real estate in Ethiopia at its best—discover Adwa 002-Shops , modern and luxury shops for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Arada Site, Shops

- **URL:** https://temerproperties.com/apartment-for-sale/arada-site-shops-2/
- **Slug:** `arada-site-shops-2`
- **Temer property ID:** 21356
- **Area:** piyassa-area · **Location label:** Piyassa
- **Bedrooms / bathrooms:** 7 / 9
- **Size:** —
- **Delivery:** 16 Months
- **Building Size:** B+G+5
- **Building Type:** Residential
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Summary:** Real estate in Ethiopia at its best—discover Mehamud Muzika Bet Project, modern shops for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### LYCEE Seken- One BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/lycee-003-one-bedroom-apartment/
- **Slug:** `lycee-003-one-bedroom-apartment`
- **Temer property ID:** 22257
- **Area:** piyassa-area · **Location label:** Piyassa
- **Bedrooms / bathrooms:** 1 / 1
- **Size:** —
- **Delivery:** 30 Months
- **Building Size:** B+G+19+ T
- **Building Type:** Residential
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** Yes
- **Summary:** Start your real estate journey in Ethiopia with Temer Properties. Discover quality homes, apartments for sale in Addis Ababa and beyond.
- **Images:** 12 URLs (see JSON)

#### LYCEE Seken- Three BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/lycee-seken-seken-three-bedroom-2/
- **Slug:** `lycee-seken-seken-three-bedroom-2`
- **Temer property ID:** 22236
- **Area:** piyassa-area · **Location label:** Piyassa
- **Bedrooms / bathrooms:** 3 / 2
- **Size:** —
- **Delivery:** 30 Months
- **Building Size:** B+G+19+ T
- **Building Type:** Residential
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** Yes
- **Summary:** Real estate in Ethiopia at its best—discover LYCEE 003, a spacious one-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### LYCEE Seken- Two BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/lycee-003-seken-three-bedroom/
- **Slug:** `lycee-003-seken-three-bedroom`
- **Temer property ID:** 22250
- **Area:** piyassa-area · **Location label:** Piyassa
- **Bedrooms / bathrooms:** 2 / 1
- **Size:** —
- **Delivery:** 30 Months
- **Building Size:** B+G+19+ T
- **Building Type:** Residential
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** Yes
- **Summary:** Real estate in Ethiopia at its best—discover LYCEE 003, a spacious two-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Lycee Burat,One BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/lycee-burat-one-bedroom-apartment/
- **Slug:** `lycee-burat-one-bedroom-apartment`
- **Temer property ID:** 21234
- **Area:** piyassa-area · **Location label:** —
- **Bedrooms / bathrooms:** 1 / 1
- **Size:** —
- **Delivery:** —
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** cement
- **Summary:** Real estate in Ethiopia starts here—with Temer Real Estate. Explore the Lycee 001 one-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Lycee Burat,Three BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/lycee-burat-three-bedroom-apartment/
- **Slug:** `lycee-burat-three-bedroom-apartment`
- **Temer property ID:** 21237
- **Area:** piyassa-area · **Location label:** —
- **Bedrooms / bathrooms:** 3 / 2
- **Size:** —
- **Delivery:** —
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** cement
- **Summary:** Real estate in Ethiopia starts here—with Temer Real Estate. Explore the Lycee 001 Three-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Lycee Burat,Two BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/lycee-burat-two-bedroom-apartment/
- **Slug:** `lycee-burat-two-bedroom-apartment`
- **Temer property ID:** 21236
- **Area:** piyassa-area · **Location label:** —
- **Bedrooms / bathrooms:** 2 / 1
- **Size:** —
- **Delivery:** —
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** cement
- **Summary:** Real estate in Ethiopia starts here—with Temer Real Estate. Explore the Lycee 001 Two-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Lycee NewRoad,Three BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/lycee-newroad-three-bedroom-apartment-2-2/
- **Slug:** `lycee-newroad-three-bedroom-apartment-2-2`
- **Temer property ID:** 21239
- **Area:** piyassa-area · **Location label:** —
- **Bedrooms / bathrooms:** 3 / 2
- **Size:** —
- **Delivery:** —
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** cement
- **Summary:** Real estate in Ethiopia starts here—with Temer Real Estate. Explore the Lycee 002 Three-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Lycee NewRoad,Two BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/lycee-newroad-three-bedroom-apartment-2/
- **Slug:** `lycee-newroad-three-bedroom-apartment-2`
- **Temer property ID:** 21238
- **Area:** piyassa-area · **Location label:** —
- **Bedrooms / bathrooms:** 2 / 1
- **Size:** —
- **Delivery:** —
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** cement
- **Summary:** Real estate in Ethiopia starts here—with Temer Real Estate. Explore the Lycee 002 Two-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### SumaleTera,Three BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/sumaletera-three-bedroom-apartment/
- **Slug:** `sumaletera-three-bedroom-apartment`
- **Temer property ID:** 21248
- **Area:** piyassa-area · **Location label:** —
- **Bedrooms / bathrooms:** 3 / 2
- **Size:** —
- **Delivery:** —
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Summary:** Real estate in Ethiopia starts here—with Temer Real Estate. Explore theSumale Tera three-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Sarbet -Au,Three BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/sarbet-au-three-bedroom-apartment/
- **Slug:** `sarbet-au-three-bedroom-apartment`
- **Temer property ID:** 21653
- **Area:** sarbet · **Location label:** sarbet
- **Bedrooms / bathrooms:** 3 / 2
- **Size:** —
- **Delivery:** 30 months
- **Building Type:** Residential
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** yes
- **Summary:** Real estate in Ethiopia at its best—discover Sarbet Au, a spacious three-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Sarbet -Au,Two BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/sarbet-au-two-bedroom-apartment/
- **Slug:** `sarbet-au-two-bedroom-apartment`
- **Temer property ID:** 21654
- **Area:** sarbet · **Location label:** Sarbet
- **Bedrooms / bathrooms:** 3 / 2
- **Size:** —
- **Delivery:** 30 Months
- **Building Size:** 2B+G+20+T
- **Building Type:** Residential
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** Yes
- **Summary:** Real estate in Ethiopia at its best—discover Sarbet Au, a spacious two-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

#### Sarbet -Blue Point Three BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/sarbet-blue-point-three-bedroom-apartment/
- **Slug:** `sarbet-blue-point-three-bedroom-apartment`
- **Temer property ID:** 25947
- **Area:** sarbet · **Location label:** Sarbet
- **Bedrooms / bathrooms:** 3 / 2
- **Size:** —
- **Delivery:** 36 Months
- **Building Size:** B+G+21+T
- **Building Type:** Residential
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** No
- **Summary:** Start your real estate journey in Ethiopia with Temer Properties. Discover quality apartments for sale in Addis Ababa and beyond.
- **Images:** 12 URLs (see JSON)

#### Sarbet -City Plus One BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/sarbet-city-plus-one-bedroom-apartment/
- **Slug:** `sarbet-city-plus-one-bedroom-apartment`
- **Temer property ID:** 28908
- **Area:** sarbet · **Location label:** Sarbet
- **Bedrooms / bathrooms:** 1 / 1
- **Size:** —
- **Delivery:** 36 Months
- **Building Size:** 3B+G+23
- **Building Type:** Mixed Use
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** Yes
- **Summary:** Start your real estate journey in Ethiopia with Temer Properties. Discover quality apartments for sale in Addis Ababa and beyond.
- **Images:** 12 URLs (see JSON)

#### Sarbet -City Plus Three BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/sarbet-city-plus-three-bedroom-apartment/
- **Slug:** `sarbet-city-plus-three-bedroom-apartment`
- **Temer property ID:** 28802
- **Area:** sarbet · **Location label:** Sarbet
- **Bedrooms / bathrooms:** 3 / 2
- **Size:** —
- **Delivery:** 36 Months
- **Building Size:** 3B+G+23
- **Building Type:** Mixed Use
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** Yes
- **Summary:** Start your real estate journey in Ethiopia with Temer Properties. Discover quality apartments for sale in Addis Ababa and beyond.
- **Images:** 12 URLs (see JSON)

#### Sarbet -City Plus Two BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/sarbet-city-plus-two-bedroom/
- **Slug:** `sarbet-city-plus-two-bedroom`
- **Temer property ID:** 28893
- **Area:** sarbet · **Location label:** Sarbet
- **Bedrooms / bathrooms:** 2 / 2
- **Size:** —
- **Delivery:** 36 Months
- **Building Size:** 3B+G+23
- **Building Type:** Mixed Use
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Basement:** Yes
- **Summary:** Start your real estate journey in Ethiopia with Temer Properties. Discover quality apartments for sale in Addis Ababa and beyond.
- **Images:** 12 URLs (see JSON)

#### Sarbet -Seken,Three BedRoom Apartment

- **URL:** https://temerproperties.com/apartment-for-sale/sarbet-three-bedroom-apartment-2/
- **Slug:** `sarbet-three-bedroom-apartment-2`
- **Temer property ID:** 21242
- **Area:** sarbet · **Location label:** —
- **Bedrooms / bathrooms:** 3 / 2
- **Size:** —
- **Delivery:** —
- **Parking Type:** Private Parking
- **Garage Size:** 1 car
- **Summary:** Real estate in Ethiopia starts here—with Temer Real Estate. Explore the Sarbet -Seken Three-bedroom apartment for sale in Addis Ababa.
- **Images:** 12 URLs (see JSON)

---

## 6.1 Temer price calculator (on their site)

Temer runs its own calculator at [`/price-calculator/`](https://temerproperties.com/price-calculator/) (updated Feb 2026 per page metadata). It is **separate from Belay’s Ayat calculator**.

| Field | Options |
|-------|---------|
| **Site** | Gelan Shopping Center *(commercial)*, Aware-Zuhran *(residential)*, Sarbet Blue-Point *(residential)* |
| **Bedrooms** | 1–4 |
| **Floor** | 1–21 |

Pricing logic is loaded client-side (not in the public WordPress API). To mirror on Belay you would need Temer’s rate tables or to observe calculator network calls in the browser.

**Social profiles (from site schema):**

- Facebook: https://www.facebook.com/temerproperties  
- X: https://x.com/TemerProperties  
- YouTube: https://www.youtube.com/@TemerProperties  
- Instagram: https://www.instagram.com/temerproperties  
- TikTok: https://www.tiktok.com/@temer_properties  

---

## 6. Commercial & shops

| Listing | Area | Notes |
|---------|------|-------|
| Arada Site, Shops | piyassa-area | Real estate in Ethiopia at its best—discover Mehamud Muzika Bet Project, modern shops for sale in Addis Ababa.… |
| Adwa-empire, Shops | piyassa-area | Real estate in Ethiopia at its best—discover Adwa 002-Shops , modern and luxury shops for sale in Addis Ababa.… |
| Adwa -ewket, Shops | piyassa-area | Real estate in Ethiopia at its best—discover Adwa 001-Shops, modern and luxury shops for sale in Addis Ababa.… |
| Gelan Shopping Center | gelan-area | Real estate in Ethiopia at its best—discover -Gelan Shops , modern and luxury shops for sale in Addis Ababa.… |

---

## 7. Marketing, partnerships & blog

### Partnerships & promos

- **Ethiopian Airlines / ShebaMiles** — earn miles when buying with Temer ([blog](https://temerproperties.com/how-many-shebamiles-can-you-earn-with-temer-properties/))
- **Tour the World** travel promo ([blog](https://temerproperties.com/tour-the-world-for-free-with-temer-properties/))
- Site pop-ups mention Sarbet / diplomats village promos (e.g. “from 120,000 birr per m²”) — **verify with Temer before using on Belay**

### Value propositions (homepage)

Location, affordable pricing, quality construction, safety & security, investment potential, amenities; “10+ years” / Temer Standard messaging.

### Blog index (85 posts in sitemap)

Recent / notable:
- [Running Toward Excellence](https://temerproperties.com/https-temerrealestateplc-com-2025-04-28-temer-properties-shines-at-the-4th-arki-expo-at-skylight-hotel/)
- [4th Arki Expo at Skylight Hotel](https://temerproperties.com/temer-properties-shines-at-the-4th-arki-expo-at-skylight-hotel/)
- [Temer Properties Visits Babul Khair](https://temerproperties.com/temer-properties-visits-babul-khair-a-journey-of-giving-and-community-connection/)
- [Temer Real Estate Employees Give Back: Blood Donation](https://temerproperties.com/temer-real-estate-employees-give-back-blood-donation-drive-highlights-our-community-commitment/)
- [Investment In Real Estate](https://temerproperties.com/the-next-hot-neighborhoods-in-addis-ababa-for-real-estate-investment-2/)
- [Market Trends](https://temerproperties.com/ethiopian-property-market-trends-and-forecasts-2/)
- [The Great Ethiopian Mountain Trek](https://temerproperties.com/temer-real-estate-joins-the-great-ethiopian-mountain-trek-a-journey-of-endurance-and-community/)
- [Experience Exceptional Customer Service with Temer Properties](https://temerproperties.com/standing-together-for-change-2/)
- [Standing Together for Change](https://temerproperties.com/standing-together-for-change/)
- [Pedaling With Purpose](https://temerproperties.com/pedaling-with-purpose-2/)
- [From Condos to Modern Apartments: How Housing Is Evolving in Addis Ababa](https://temerproperties.com/how-housing-is-evolving-in-addis-ababa/)
- [Your Fast Track to a Real Estate in Ethiopia](https://temerproperties.com/your-fast-track-to-a-real-estate-in-ethiopia/)
- [Homes Have Personalities Too](https://temerproperties.com/experience-exceptional-customer-service-with-temer-properties/)
- [The History of Architecture and Engineering in Ethiopia](https://temerproperties.com/the-history-of-architecture-and-engineering-in-ethiopia/)
- [How Technology Is Making Real Estate In Ethiopia Easier To Buy](https://temerproperties.com/how-technology-is-making-real-estate-in-ethiopia-easier-to-buy/)
- [Celebrating Excellence at Temer Properties](https://temerproperties.com/celebrating-excellence-at-temer-properties/)
- [Proven Loyalty, Trusted Brand: The Temer Experience](https://temerproperties.com/proven-loyalty-trusted-brand-the-temer-experience/)
- [EXPERIENCE HOMES LIKE NEVER BEFORE](https://temerproperties.com/experience-homes-like-never-before/)
- [Kabod EXPO 2025 Proves Market Demand, Key Steps for a Better One](https://temerproperties.com/kabod-expo-2025-proves-market-demand-key-steps-for-a-better-one/)
- [Kabod Real Estate Expo: A Grand Opening at the Science Museum](https://temerproperties.com/kabod-real-estate-expo-a-grand-opening-at-the-science-museum/)

*…and 65 more — full list in `temer_scraped.json` → `blog_posts`.*

---

## 8. Legal & policies

- [Privacy policy](https://temerproperties.com/privacy-policy/)
- [Terms of use](https://temerproperties.com/terms-of-user/)

---

## 9. Data quality & exclusions

- WordPress REST API (/wp-json/) returns 403 — scrape uses Yoast sitemaps + HTML only.
- Public listing pages rarely show ETB prices; confirm pricing with Temer sales.
- Homepage may contain theme demo content (e.g. Elara Estates luxury USD listings) — excluded from properties sitemap.
- Some Temer projects use Ayat as a geographic area; not the same as Ayat Share Company partner data.

- **Theme demo content:** Homepage sections referencing “Elara Estates”, USD luxury villas ($1M+), and fake client names are **WordPress theme placeholders** — not Temer inventory.
- **Bathroom / bed counts:** Parsed from Houzez detail blocks; always cross-check listing page before seeding.
- **Sizes:** Often in `meta_description` (e.g. “76 m²”) when the detail field is empty.
- **Ayat name overlap:** Temer projects in the **Ayat** area are Temer developments, not Ayat Share Company (`ayat-real-estate`) unless you explicitly partner both.

---

## 10. Belay Properties — suggested next steps

1. Add `TEMER_PARTNER` in `frontend/src/content/partners.ts` (mirror Ayat).
2. Create `Company` row `temer-properties` + contacts (6033, mobiles, email).
3. Map each listing above → `projects` + `listings` (use Temer ID as external reference).
4. Obtain **official price lists** from Temer (site rarely shows ETB); optional `temer_production.json` like Ayat.
5. Decide calculator scope: Temer has their own [`/price-calculator/`](https://temerproperties.com/price-calculator/) — Belay may link out or build separate config later.
6. Re-run scraper periodically: `python3 scripts/scrape_temer_properties.py`.

# Libaas Kiraya — UI/UX Design Specification

| Field | Value |
|---|---|
| Document version | 1.0 (Draft for build) |
| Date | 21 October 2026 |
| Author | Saleh |
| Surfaces | Customer storefront (mobile-first), vendor portal (responsive), admin extensions (Medusa Admin UI) |
| Related docs | `PRD.md`, `Appflow.md`, `TRD.md` |

---

## 1. Design intent

**Subject.** Occasion-wear rental for Pakistani weddings and formal events. **Audience.** Brides, grooms and guests browsing on phones (often arriving from Instagram), and boutique owners managing stock between fittings. **Primary job.** Answer "is this outfit free on my date, and will it fit me?" faster and more honestly than a WhatsApp thread.

**The memorable thing.** Rental is about *time*, so time is the signature of the interface: the **availability ribbon**, a strip of day-cells shown on every listing card and expanded into the booking calendar. Everything else stays quiet so garments and dates carry the page.

### 1.1 Design principles

| Principle | What it means in the UI |
|---|---|
| Date first | The event date is asked before anything else and carried through search, cards, listing and checkout. |
| Garment first | Photography is large, sharp-cornered and uncluttered; chrome stays minimal. |
| Honest availability | Unavailable is shown clearly with a reason (booked, being prepared); never hidden or implied. |
| Money without surprises | Fee, deposit and cleaning are always itemized; the deposit is always labelled "refundable". |
| Calm after payment | Post-booking screens answer "what happens next, and when" with a timeline, not a dashboard. |
| Fair by design | Inspection and dispute screens show evidence side by side and deadlines in plain language. |

## 2. Design plan and critique

### 2.1 Token summary

| Area | Decision |
|---|---|
| Color | Mulberry primary, peacock teal for "free/available", zari gold highlights, cool-white page, plum-tinted ink. |
| Type | Bodoni Moda (display) with Instrument Sans (text). Noto Nastaliq Urdu reserved for Phase 2. |
| Layout | Left-aligned, photo-led grids; one sticky booking bar on mobile listing pages. |
| Signature | Availability ribbon (14 day-cells) on cards; same visual language in the full calendar. |

### 2.2 Review against generic defaults (what was changed and why)

| First instinct | Why it was rejected | Final choice |
|---|---|---|
| Warm cream background with gold accent | Reads as a stock "luxury wedding" template. | Cool-white `Chandni` background so saturated textile colors in photos pop; gold used only as a thread-like highlight on mulberry. |
| Playfair-style serif | The default fashion serif. | Bodoni Moda: high-contrast Didone with fashion-catalogue character, used large and sparingly. |
| Identical rounded cards with soft shadows | SaaS-kit look; flattens hierarchy. | Photos with 2 px corners (like a printed lookbook), no card chrome on listing tiles; rounded only on controls (10 px) and bottom sheets (20 px). |
| Small uppercase eyebrow labels above headings | Template tell. | None. Headings stand alone; metadata sits inline in sentence case. |
| Numbered 01/02/03 steps | Only valid for sequences. | Used **only** in checkout (a true sequence) and the booking timeline. |
| Hover/fade-in on every section | Generic motion. | One orchestrated moment (ribbon sweep after choosing a date) plus responses to user actions. |

## 3. Visual system

### 3.1 Color tokens

| Token | Hex | Role | Notes |
|---|---|---|---|
| `--shahtoot` (mulberry) | `#4A1634` | Primary: buttons, headings, selected state | 14.9:1 on `--chandni` |
| `--mor` (peacock) | `#0E6F6A` | Free / available / success | 5.8:1 on white |
| `--zari` (gold thread) | `#C99A2E` | Highlights, hold timer ring, focus accent | Use as a **fill** or on mulberry; never as text on light backgrounds |
| `--chandni` | `#F5F6F8` | Page background | Cool white, not cream |
| `--surface` | `#FFFFFF` | Sheets, forms, calendar | |
| `--syahi` (ink) | `#2B2230` | Body text | 14.1:1 on `--chandni` |
| `--dhundla` (muted text) | `#5F5666` | Secondary text | 6.2:1 on white |
| `--lakeer` (line) | `#DCD5DE` | Borders, dividers | 1 px |
| `--sang` (taken tint) | `#E9DDE5` | Booked cells (with hatch) | Never alone: pattern + label |
| `--khatra` (danger) | `#B3261E` | Errors, destructive actions | 6.6:1 on white |
| `--intezar` (amber) | `#8A5A00` | Warnings, overdue | 6.0:1 on white |

> Contrast values are design targets; verify final pairs with an automated checker before release.

```css
:root {
  --shahtoot:#4A1634; --mor:#0E6F6A; --zari:#C99A2E;
  --chandni:#F5F6F8; --surface:#FFFFFF; --syahi:#2B2230; --dhundla:#5F5666;
  --lakeer:#DCD5DE; --sang:#E9DDE5; --khatra:#B3261E; --intezar:#8A5A00;
  --radius-image:2px; --radius-control:10px; --radius-sheet:20px;
  --focus: 0 0 0 3px #fff, 0 0 0 5px var(--shahtoot);
}
```

### 3.2 Typography

| Role | Typeface | Weight | Size (mobile / desktop) | Line height | Use |
|---|---|---|---|---|---|
| Display | Bodoni Moda | 500 | 39 / 61 | 1.1 | Home hero question only |
| Heading 1 | Bodoni Moda | 500 | 31 / 39 | 1.15 | Page titles, listing name |
| Heading 2 | Bodoni Moda | 500 | 25 / 31 | 1.2 | Section titles |
| Heading 3 | Instrument Sans | 600 | 20 | 1.3 | Card and panel titles |
| Body | Instrument Sans | 400 | 16 | 1.5 | Default text |
| Small | Instrument Sans | 400 | 14 | 1.45 | Captions, helper text |
| Price | Instrument Sans (tabular figures) | 600 | 20 | 1.2 | All money, aligned in breakdowns |

Rules: line length ≤ 65 characters; sentence case everywhere; no all-caps labels; Urdu (Phase 2) uses Noto Nastaliq Urdu with +0.2 line-height and mirrored layout via logical CSS properties (`margin-inline`, `padding-inline`).

### 3.3 Spacing, layout and shape

- 4 px base unit; common steps 4, 8, 12, 16, 24, 32, 48, 72.
- Breakpoints: 360 (design baseline), 640, 1024, 1280. Content max width 1200.
- Listing grid: 2 columns on mobile, 3 at 640, 4 at 1024.
- Garment photos have a 4:5 ratio, 2 px corners, no border or shadow.
- Elevation: none by default; overlays (sheets, popovers) use a 1 px `--lakeer` border and a single soft shadow `0 8px 24px rgba(43,34,48,.12)`.
- Icons: 20 px outline set (Lucide), 1.5 px stroke, always paired with text where meaning matters.

### 3.4 Motion

- **Orchestrated moment:** after the customer chooses a date on the home or search page, ribbon cells on visible cards fill in left to right over 400 ms total.
- **Response motion:** bottom sheets slide in 200 ms; the hold timer ring depletes continuously; toasts fade 150 ms.
- `prefers-reduced-motion`: all motion replaced by instant state changes; the timer shows numbers only.

## 4. Information architecture

```
Storefront (customer)
├─ Home (date + city search)
├─ Search results
│   └─ Listing detail
│       └─ Vendor profile
├─ Cart and checkout (details → delivery → payment)
├─ Booking confirmation
├─ Account
│   ├─ My bookings → Booking detail (timeline, return, inspection, dispute, review)
│   ├─ Measurements
│   └─ Profile and sign-in
└─ Help (cancellation policy, deposit and inspection explained)

Vendor portal (/vendor)
├─ Today (actions due)
├─ Calendar (units × dates)
├─ Bookings (queue → detail → handover / return / inspection)
├─ Listings (list → editor → variants → units)
├─ Earnings (balances, ledger, payouts)
└─ Settings (profile, policies, staff)

Admin (Medusa Admin extensions)
├─ Vendors (review, approve, commission)
├─ Disputes (queue → evidence → resolution)
├─ Payouts (drafts → approve → mark paid)
├─ Operations dashboard
└─ Rental settings
```

## 5. Key components

| Component | Behavior and states |
|---|---|
| **DateField** | Single event date; opens a full-screen month sheet on mobile. Past dates disabled. Remembers last choice in session. |
| **AvailabilityRibbon** | 14 cells starting at the chosen date. States: `free` (teal fill), `selected` (mulberry fill + tick), `taken` (hatched `--sang`), `preparing` (light hatch, buffer days), `past` (muted). Each cell has an accessible name ("12 Dec, free"); a legend appears on first use. |
| **AvailabilityCalendar** | Month grid using the same cell states, size-specific (changes when the size changes). Range selection with a live summary ("3 days, 12–14 Dec"). Explains blocked days on tap ("Booked" or "Being prepared for the next customer"). |
| **SizeFitSelector** | Size chips plus the fit indicator for the selected measurement profile: "Fits your measurements", "Snug at the waist", "Check with the boutique". Icon + text, never color alone. Shows fit feedback summary ("Most renters say true to size"). |
| **PriceBreakdown** | Rows: Rental (3 days), Extra days, Cleaning, Refundable deposit, Total today. Deposit row has an info sheet: "Returned after the boutique checks the outfit." |
| **HoldTimer** | Persistent bar in cart and checkout: "Reserved for you for 12:34". Turns amber under 3 minutes; on expiry explains and offers "Reserve again" if still free. |
| **StatusTimeline** | Vertical steps with dates: Booked → Handover → Wear → Return → Check → Deposit back. Current step expanded with the next action and deadline. |
| **PhotoUploader** | Camera-first on mobile, drag-drop on desktop, min/max counts shown ("3 of 3 required photos"), client-side compression, per-photo retry. |
| **InspectionForm** | Outcome selector, deduction amount (validated against the deposit), notes, photos; late fee auto-filled and read-only; summary preview of what the customer will see. |
| **EvidenceCompare** | Side-by-side handover photos and return photos with synced zoom, used in dispute screens. |
| **LedgerTable** | Date, booking, type, amount (signed), status. Collapses to stacked rows on mobile. Totals for pending, available, paid. |
| **ConfirmSheet** | Bottom sheet for destructive or irreversible actions with explicit consequence text and the exact refund amount. |

## 6. Screen specifications

Wireframes are low fidelity (mobile, 360 px) to define structure and hierarchy.

### 6.1 Home

```
┌──────────────────────────────┐
│ Libaas Kiraya        ☰   👜 │
├──────────────────────────────┤
│  [ full-bleed garment photo ]│
│                              │
│  When is the wedding?        │  ← Display, left aligned
│  ┌────────────────────────┐  │
│  │ Event date    14 Dec ▾ │  │
│  ├────────────────────────┤  │
│  │ City      Rawalpindi ▾ │  │
│  └────────────────────────┘  │
│  [ Show what's free ]        │  ← primary button
├──────────────────────────────┤
│ Free on 14 Dec in Rawalpindi │
│ ┌────────┐ ┌────────┐        │
│ │ photo  │ │ photo  │        │
│ │▮▮▮▮▮▯▯▮│ │▮▮▮▮▮▮▮▮│ ← ribbon│
│ │Name    │ │Name    │        │
│ │PKR 18k │ │PKR 12k │        │
│ └────────┘ └────────┘        │
└──────────────────────────────┘
```

Notes: the hero question is the only Display text on the site. No stock gradient or stat band. Results appear on the same page after the first search so there is no dead hero.

### 6.2 Search results

```
┌──────────────────────────────┐
│ ‹  14 Dec · Rawalpindi   ⚙  │  ← sticky summary, tap to edit
├──────────────────────────────┤
│ [Size ▾][Price ▾][Fits me ▾] │  ← filter chips; "Filters" sheet for more
│ 42 outfits free on 14 Dec    │
│ ┌──────┐ ┌──────┐            │
│ │photo │ │photo │ …          │
│ │ribbon│ │ribbon│            │
│ └──────┘ └──────┘            │
└──────────────────────────────┘
```

Behavior: ribbon starts at the chosen date; "Fits me" appears only when a measurement profile exists, otherwise it opens a quick measurement sheet. Empty state: "Nothing is free on 14 Dec with these filters. Try nearby dates:" followed by date chips showing counts.

### 6.3 Listing detail (mobile)

```
┌──────────────────────────────┐
│ [ photo carousel, 4:5 ]      │
│ Emerald zari bridal lehenga  │  ← H1
│ By Saima Couture · Islamabad │
│ ★ 4.8 (23) · True to size    │
├──────────────────────────────┤
│ Size   (S) (M) (L) (Custom)  │
│ ✓ Fits your measurements     │
├──────────────────────────────┤
│ Dates  ▮▮▯▯▮▮▮▮▮▮▮▮▮▮        │  ← ribbon, tap → calendar sheet
│ 3 days · 13–15 Dec           │
├──────────────────────────────┤
│ Rental (3 days)    PKR 18,000│
│ Cleaning            PKR 1,500│
│ Refundable deposit  PKR 20,000│
│ Total today         PKR 19,500│
├──────────────────────────────┤
│ Description · Measurements   │
│ Cancellation: Standard       │
│ Reviews with fit feedback    │
└──────────────────────────────┘
┌──────────────────────────────┐
│ PKR 19,500   [ Reserve for 15 minutes ]│  ← sticky bar
└──────────────────────────────┘
```

Notes: "Total today" excludes the deposit if the deposit is held rather than charged; the row label adapts ("Deposit held, not charged" vs. "Deposit charged, refunded after the check"). The cancellation policy is a plain sentence plus a "See refund schedule" sheet.

### 6.4 Checkout

Three real steps, so numbering is appropriate.

```
┌──────────────────────────────┐
│ Reserved for you 12:34  ◔    │  ← HoldTimer
├──────────────────────────────┤
│ 1 Details  ─ 2 Delivery ─ 3 Payment │
├──────────────────────────────┤
│ (step content)               │
│ Order summary (collapsible)  │
│ [ Pay and confirm ]          │
└──────────────────────────────┘
```

- **Details:** name, phone (WhatsApp), email, event name (optional).
- **Delivery:** Pickup from boutique (address, hours) or Courier both ways (address form, fee); return instructions are previewed here.
- **Payment:** provider selection (card, wallet); deposit explanation shown once, above the button.
- Failure: "Payment didn't go through. Your outfit is still reserved for 6:12. Try another method."

### 6.5 Booking confirmation

Centered layout (an allowed exception): checkmark, "Booked for 13–15 Dec", booking reference, StatusTimeline preview, vendor contact (call / WhatsApp), "Add to calendar", and the cancellation terms in one sentence.

### 6.6 My bookings and booking detail

List groups: Upcoming, With you now, Waiting for the check, Past. Booking detail leads with the StatusTimeline and the one next action:

| Booking state | Primary message | Primary action |
|---|---|---|
| Confirmed | "Handover on 13 Dec" | Message the boutique |
| With you | "Return by 15 Dec" | Return instructions |
| Returned | "The boutique is checking your outfit (due in 36 h)" | — |
| Settling | "Deduction of PKR 3,000 proposed" | Accept / Dispute (with deadline) |
| Disputed | "Under review by our team" | Add evidence |
| Completed | "Deposit returned: PKR 17,000" | Leave a review |

### 6.7 Inspection result and dispute (customer)

```
┌──────────────────────────────┐
│ Check result: minor damage   │
│ Deduction  PKR 3,000         │
│ Deposit back  PKR 17,000     │
├──────────────────────────────┤
│ Boutique notes …             │
│ [ handover ] [ return ] ← EvidenceCompare
├──────────────────────────────┤
│ Decide by 17 Dec, 6:00 pm    │
│ [ Accept ]   [ Dispute ]     │
└──────────────────────────────┘
```

Dispute form: reason (required), photos, "What outcome do you expect?"; confirmation states the 3-day resolution target.

### 6.8 Measurements

One profile per card; unit toggle (in/cm); illustrated how-to-measure sheet with each measurement; live fit preview against a sample garment; default profile toggle. Inputs use numeric keyboards and validate ranges with helpful hints ("Waist is usually between 22 and 55 in").

### 6.9 Vendor portal

Desktop-first layout, fully responsive.

**Today:** a prioritized list of actions with due times: handovers today, returns due, inspections due, disputes needing evidence.

```
┌─────────────────────────────────────────────────────────┐
│ Today                                  Fri 12 Dec       │
├─────────────────────────────────────────────────────────┤
│ Hand over   LEH-014  Hira A.   13 Dec   [ Mark handed over ] │
│ Expect back LEH-009  Sana K.   due today [ Record return ]   │
│ Inspect     SHR-003  returned 20 h ago   [ Start check ]     │
└─────────────────────────────────────────────────────────┘
```

**Calendar:** rows = units, columns = dates (14 or 30 days). Booked cells show customer initials and status color + pattern; buffer days are hatched; drag to create a manual block; tap a cell for booking detail. Mobile shows one unit at a time.

**Listing editor:** stepped form (Photos → Details → Sizes and measurements → Pricing and deposit → Rules → Units). A live "customer view" preview and a publish checklist (3 photos, measurements, at least one unit).

**Booking detail:** timeline, customer contact, handover checklist with photo capture, return and inspection forms.

**Earnings:** three balance tiles (pending, available, paid), ledger table, payout history, a clear explanation "Earnings become available after the deposit is settled."

### 6.10 Admin extensions (Medusa Admin)

Built with Medusa UI components for consistency.

- **Vendors:** table with status filters; detail with KYC document viewer and commission field; Approve and Reject actions with reasons.
- **Disputes:** queue sorted by deadline; detail uses EvidenceCompare plus timeline; resolution form (customer, vendor, split, amount) with a settlement preview.
- **Payouts:** draft batches, per-vendor breakdown, approve and mark paid with reference.
- **Dashboard widgets:** bookings today, overdue returns, open disputes, GMV, take rate.

## 7. Content and microcopy

Voice: plain, specific, warm; sentence case; active voice; actions keep one name through the flow.

| Moment | Copy |
|---|---|
| Hero | When is the wedding? |
| Primary search action | Show what's free |
| Reserve | Reserve for 15 minutes |
| Pay | Pay and confirm |
| Hold expired | Your reservation ended. The outfit is still free for these dates. Reserve again |
| Unavailable | Booked on 13 Dec. Try 11–13 Dec or another size |
| Preparing day | Being cleaned and pressed for the next customer |
| Deposit info | A refundable deposit protects the boutique. You get it back after they check the outfit, usually within 2 days of return |
| Return reminder | Return LEH-014 to Saima Couture by 15 Dec |
| Late return | This outfit is 1 day late. A late fee of PKR 1,500 per day applies |
| Dispute confirmation | We've sent your evidence to our team. You'll hear back within 3 days |
| Empty bookings | You have no bookings yet. Find something free on your date |
| Network error | Couldn't load availability. Check your connection and try again |
| Vendor action names | Mark as handed over; Record return; Submit inspection; Approve payout |

Rules: errors say what happened and what to do next without apologizing; confirmations reuse the action's name ("Inspection submitted"); amounts always show the currency (`PKR 18,000`).

## 8. States and edge cases

| Scenario | Behavior |
|---|---|
| Loading | Skeletons matching the final layout; ribbons render as neutral cells until data arrives. |
| Hold expires during payment | Payment is blocked; the screen explains and offers to re-reserve; if the provider already captured, the system refunds automatically and the screen says so. |
| Someone else reserved the dates a moment ago | Calendar updates on focus; selecting a taken day explains why. |
| Customer has 3 active holds | Message: "You can hold 3 outfits at once. Release one to reserve another." |
| Slow or offline connection | Cached listing content stays readable; actions disabled with a clear banner. |
| Overdue return (vendor view) | Row turns amber with days late, the next booking flagged "at risk", one-tap message to the customer. |
| Settlement failed (ops flag) | Admin dashboard task with a retry action; customer sees "We're finalizing your deposit" (no technical text). |

## 9. Accessibility

Target: **WCAG 2.1 AA**.

- Keyboard: every interactive element reachable; visible focus ring (`--focus`); calendar supports arrow keys, Home/End, PageUp/PageDown, Enter to select.
- Screen readers: ribbon and calendar cells have text names and states; timeline uses an ordered list with `aria-current="step"`; the hold timer announces at 5, 2 and 1 minute marks (not every second).
- Color is never the only signal: hatching, icons, labels accompany state colors.
- Touch targets ≥ 44 × 44 px; spacing between adjacent targets ≥ 8 px.
- Forms: visible labels, programmatic error association, error summary on submit.
- Zoom: usable at 200% zoom and 320 px width without horizontal scroll (calendar and ledger scroll inside their own containers).
- Images: garment photos have meaningful alt text from listing titles; decorative images are hidden from assistive tech.

## 10. Responsive behavior

| Breakpoint | Storefront | Vendor portal |
|---|---|---|
| 360–639 | Single column, sticky booking bar, bottom sheets | Stacked lists, single-unit calendar |
| 640–1023 | Two-column listing detail (gallery + sticky booking panel) | Sidebar collapses to top tabs |
| 1024+ | Booking panel pinned right of gallery; filter sidebar on search | Full units × dates calendar, tables |

## 11. Design delivery

- Tokens defined once as CSS variables and mapped into the Tailwind theme (`colors`, `fontFamily`, `borderRadius`, `spacing`).
- Components built on Radix primitives with Storybook documenting states (default, hover, focus, disabled, loading, error).
- Figma (or equivalent) file mirrors the tokens; key flows prototyped: search → reserve → pay, return → inspect → settle.
- Visual regression via Playwright screenshots for core screens at 360 and 1280 widths.
- Usability check before release: five-user test of the date-first search and the deposit explanation; success is ≥ 4 of 5 correctly stating when they get the deposit back.

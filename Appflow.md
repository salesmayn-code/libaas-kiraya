# Libaas Kiraya — Application Flow

| Field | Value |
|---|---|
| Document version | 1.0 (Draft for build) |
| Date | 21 October 2026 |
| Author | Saleh |
| Related docs | `PRD.md` (rules), `TRD.md` (workflows, APIs), `Backend-Schema.md` (states), `UI-UX-Design.md` (screens) |

Diagrams use Mermaid and render on GitHub and most Markdown viewers. Status names match `Backend-Schema.md` §8.

---

## 1. Actors and surfaces

| Actor | Surface | Auth actor type |
|---|---|---|
| Customer (renter) | Storefront | `customer` |
| Vendor owner / staff | Vendor portal (`/vendor`) | `vendor` |
| Admin | Medusa Admin | `user` |
| System | Scheduled jobs, subscribers, webhooks | n/a |

## 2. System overview

```mermaid
flowchart LR
    A[Customer searches by date and city] --> B[Listing detail and calendar]
    B --> C[Reserve: 15-minute hold]
    C --> D[Checkout and payment]
    D --> E[Booking confirmed]
    E --> F[Handover or delivery]
    F --> G[Customer wears the outfit]
    G --> H[Return]
    H --> I[Vendor inspection]
    I --> J{Customer decision}
    J -->|Accept or silence| K[Deposit settled]
    J -->|Dispute| L[Admin arbitration]
    L --> K
    K --> M[Booking completed]
    M --> N[Vendor earnings become available]
    N --> O[Admin payout batch]
    M --> P[Customer review and fit feedback]
```

## 3. Customer flows

### 3.1 Discover and reserve

```mermaid
flowchart TD
    S([Open storefront]) --> H[Home: choose event date and city]
    H --> R[Search results with availability ribbons]
    R --> L[Open listing]
    L --> SZ[Choose size and see fit indicator]
    SZ --> CAL[Pick dates on calendar]
    CAL --> Q{Dates free for this size?}
    Q -->|No| ALT[Explain why; suggest nearby dates or other sizes]
    ALT --> CAL
    Q -->|Yes| LOGIN{Signed in?}
    LOGIN -->|No| AUTH[Sign in or register, then return to the same dates]
    AUTH --> RES
    LOGIN -->|Yes| RES[Reserve for 15 minutes]
    RES --> HOLDCHK{Unit still free and under 3 active holds?}
    HOLDCHK -->|No| ERR[Show reason: taken just now or hold limit]
    ERR --> CAL
    HOLDCHK -->|Yes| CART[Cart with HoldTimer]
```

### 3.2 Checkout and payment

```mermaid
sequenceDiagram
    autonumber
    actor C as Customer
    participant SF as Storefront
    participant API as Medusa API
    participant WF as Workflow engine
    participant PAY as Payment provider
    participant DB as PostgreSQL

    C->>SF: Add rental (variant, dates)
    SF->>API: POST /store/carts/:id/rentals
    API->>WF: add-rental-to-cart
    WF->>DB: Insert booking status=held (exclusion constraint guards overlap)
    DB-->>WF: OK (or 23P01 overlap, retry another unit)
    WF-->>API: Line item + booking_id + hold_expires_at
    API-->>SF: Cart with hold timer

    C->>SF: Pay and confirm
    SF->>API: Complete cart
    API->>WF: Cart completion hook validates holds
    WF->>PAY: Capture rental fee and cleaning fee; secure deposit
    alt Payment success
        PAY-->>WF: Success
        WF->>DB: Booking confirmed, deposit secured, ledger entries pending
        WF-->>API: Order created, event rental.booking.confirmed
        API-->>SF: Confirmation
    else Payment failure or hold expired
        PAY-->>WF: Failure
        WF->>DB: Compensate: keep hold if time remains, else expire; void/refund any captured amount
        WF-->>API: Error with next step
        API-->>SF: Show retry or re-reserve
    end
```

### 3.3 After booking: handover, wear, return

```mermaid
flowchart TD
    CONF([Booking confirmed]) --> REM1[Reminder the day before handover]
    REM1 --> FUL{Fulfillment mode}
    FUL -->|Pickup| PU[Customer collects from boutique]
    FUL -->|Courier| DL[Courier delivers to customer]
    PU --> HO[Vendor marks handed over, adds condition photos]
    DL --> HO
    HO --> WEAR[With customer]
    WEAR --> REM2[Return reminder on due date]
    REM2 --> RET[Customer returns: drop-off or courier]
    RET --> RECV[Vendor records return]
    RECV --> LATE{Returned after due date?}
    LATE -->|Yes| FEE[Late fee added to settlement; next booking flagged if at risk]
    LATE -->|No| INSP
    FEE --> INSP[Inspection window starts: 48 hours]
```

### 3.4 Inspection, dispute and settlement

```mermaid
flowchart TD
    RECV([Return recorded]) --> W48{Inspection filed within 48 hours?}
    W48 -->|No| AUTO[Deposit fully released automatically]
    AUTO --> DONE
    W48 -->|Yes| CALC[System computes deduction: damage + late fee, capped at deposit]
    CALC --> BIG{Deduction above 50 percent of deposit?}
    BIG -->|Yes| ADM1[Admin reviews before customer is asked]
    ADM1 --> NOTIFY
    BIG -->|No| NOTIFY[Customer notified with evidence and 72-hour deadline]
    NOTIFY --> DEC{Customer decision}
    DEC -->|Accept| SET
    DEC -->|No response in 72 hours| SET
    DEC -->|Dispute| DISP[Booking disputed; customer adds evidence]
    DISP --> ARB[Admin compares handover and return photos]
    ARB --> RES{Resolution}
    RES -->|Customer| R1[No deduction]
    RES -->|Vendor| R2[Full proposed deduction]
    RES -->|Split| R3[Adjusted deduction]
    R1 --> SET
    R2 --> SET
    R3 --> SET
    SET[Settle deposit: capture deduction, release remainder, ledger entries] --> DONE([Booking completed])
    DONE --> REV[Review invitation]
```

### 3.5 Cancellation

```mermaid
flowchart TD
    A([Customer taps Cancel]) --> B[Show exact refund based on vendor policy and days to handover]
    B --> C{Confirm?}
    C -->|No| Z([Stay booked])
    C -->|Yes| D[cancel-rental workflow]
    D --> E[Release dates and unit]
    E --> F[Refund rental fee per policy; release deposit in full]
    F --> G[Reverse pending ledger entries]
    G --> H[Notify customer and vendor]
    H --> I([Cancelled])
```

Vendor-initiated cancellation follows the same workflow with a 100% refund, a vendor penalty ledger entry, and an increment of the vendor's 90-day cancellation counter (auto-pause at 3).

### 3.6 Fit and measurements

```mermaid
flowchart LR
    M[Customer adds measurement profile] --> D[Set default profile]
    D --> F[Listing shows fit indicator per size]
    F --> B[Booking completed]
    B --> FB[Customer gives fit feedback]
    FB --> AGG[Listing fit summary updates]
    AGG --> F
```

## 4. Vendor flows

### 4.1 Onboarding

```mermaid
flowchart TD
    A([Vendor registers]) --> B[Business details and KYC documents uploaded to private storage]
    B --> C[Status: pending]
    C --> D[Admin reviews]
    D --> E{Decision}
    E -->|Approve| F[Status: active; commission set; welcome email]
    E -->|Request changes| B
    E -->|Reject| G[Status: rejected; reason sent]
    F --> H[Vendor creates first listing]
```

### 4.2 Listing and inventory

```mermaid
flowchart TD
    A[Create listing: photos, details] --> B[Add sizes with measurements]
    B --> C[Set pricing: base package, extra day, cleaning, deposit, late fee]
    C --> D[Set rules: buffers, min/max days, fulfillment modes, cancellation policy]
    D --> E[Add physical units with tag codes]
    E --> F{Publish checklist passed? 3 photos, measurements, at least one unit}
    F -->|No| A
    F -->|Yes| G[Listing active and searchable]
    G --> H[Manage calendar: manual blocks for maintenance or offline rentals]
```

### 4.3 Daily operations

```mermaid
flowchart TD
    T([Open Today]) --> L{Action type}
    L -->|Handover due| H[Mark handed over; capture condition photos]
    L -->|Return due| R[Record return]
    L -->|Inspection due| I[Open InspectionForm]
    L -->|Dispute needs evidence| D[Upload evidence]
    I --> OUT{Outcome}
    OUT -->|Clean| S[Submit: deposit released after customer window]
    OUT -->|Minor or major damage or loss| P[Add deduction, notes, photos required for major or loss]
    P --> S2[Submit inspection]
    S --> END([Done])
    S2 --> END
```

## 5. Admin and system flows

### 5.1 Payout cycle

```mermaid
flowchart TD
    J[Weekly job prepares draft payouts for vendors with available balance above minimum] --> A[Admin reviews drafts]
    A --> B{Approve?}
    B -->|Adjust| C[Add adjustment ledger entry]
    C --> A
    B -->|Approve| D[Payout approved]
    D --> E[Admin transfers money outside the system and enters reference]
    E --> F[Mark paid: ledger entries status paid, payout entry written]
    F --> G[Vendor notified]
```

### 5.2 Scheduled jobs and automated transitions

```mermaid
flowchart LR
    J1[Every minute: expire stale holds] --> S1[held -> expired]
    J2[Hourly: inspection deadline] --> S2[returned -> completed with full deposit release]
    J3[Hourly: auto-accept inspections after 72 h] --> S3[settling -> completed]
    J4[Daily 09:00 PKT: reminders] --> S4[Notifications]
    J5[Daily 10:00 PKT: overdue detector] --> S5[ops_flag overdue and at_risk]
    J6[Daily: renew deposit holds] --> S6[Re-authorize holds near expiry]
    J7[Weekly: payout candidates] --> S7[Draft payouts]
```

## 6. Booking state machine

```mermaid
stateDiagram-v2
    [*] --> held: Reserve (unit free)
    held --> confirmed: Payment succeeded
    held --> expired: Hold timeout
    held --> cancelled: Customer removes or payment failed
    confirmed --> with_customer: Vendor marks handed over
    confirmed --> cancelled: Cancellation (customer, vendor, admin)
    with_customer --> returned: Vendor records return
    returned --> settling: Inspection filed within 48 h
    returned --> completed: 48 h lapse, deposit released
    settling --> completed: Accepted, auto-accepted or admin approved
    settling --> disputed: Customer disputes within 72 h
    disputed --> completed: Admin resolves
    completed --> [*]
    cancelled --> [*]
    expired --> [*]
```

Occupying states (block the unit's calendar): `held`, `confirmed`, `with_customer`, `returned`, `settling`, `disputed`.

## 7. Compensation and failure flows

| Failure | Detected by | System response | User-visible outcome |
|---|---|---|---|
| Payment fails after hold | Payment provider response / webhook | Keep the hold if time remains; otherwise expire it; void or refund any partial capture | "Payment didn't go through. Still reserved for 6:12." |
| Hold expires before payment completes | Cart completion hook | Reject completion; refund if captured; no booking is created | "Your reservation ended. Reserve again." |
| Two customers reserve the last unit simultaneously | Exclusion constraint (`23P01`) | Loser retries another unit or gets `UNAVAILABLE` | "Booked a moment ago. Try these dates or another size." |
| Payment webhook arrives twice | Idempotency by event id | Second delivery ignored | None |
| Deposit capture fails at settlement | `settle-deposit` step | Compensate ledger entries; set `ops_flag = settlement_failed`; alert admin | "We're finalizing your deposit." |
| Notification provider down | Subscriber retry | Retry with backoff; never block the workflow | Delayed message |
| Vendor never inspects | `inspection-deadline` job | Auto-release deposit | "Deposit returned: full amount." |
| Courier status mismatch | Courier callback validation | Ignore invalid transitions; log | None |

## 8. Notification matrix

| Event | Customer | Vendor | Admin |
|---|---|---|---|
| Booking confirmed | Email (+ WhatsApp stub) | Email, portal alert | |
| Handover reminder (day before) | Email | Email | |
| Return reminder (due date) | Email | | |
| Return overdue | Email | Email, portal flag | Dashboard flag |
| Inspection submitted | Email (decision deadline) | Confirmation | |
| Dispute opened | Confirmation | Email | Queue item |
| Dispute resolved | Email | Email | |
| Booking completed | Email (deposit amount, review invite) | Email (earnings available) | |
| Payout paid | | Email | |
| Vendor submitted for approval | | | Queue item |

## 9. Permissions matrix

| Capability | Customer | Vendor owner | Vendor staff | Admin |
|---|---|---|---|---|
| Search and view listings | ✔ | ✔ | ✔ | ✔ |
| Reserve, pay, cancel own booking | ✔ | | | |
| Manage listings and units | | ✔ | ✔ | |
| Mark handed over / returned, file inspection | | ✔ | ✔ | |
| View earnings and payouts | | ✔ | | ✔ |
| Edit payout method | | ✔ | | |
| Open dispute, accept inspection | ✔ | | | |
| Resolve disputes | | | | ✔ |
| Approve vendors, set commission | | | | ✔ |
| Approve and mark payouts paid | | | | ✔ |

Vendor routes are always scoped to the authenticated vendor; cross-vendor access returns 404.

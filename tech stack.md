Here’s tech-doc style content you can drop into your CLOUD 101 document to describe the implementation from a **vibe coding** point of view.

***

## 1. Tech Stack & Architecture

CLOUD 101 is a mobile‑first PWA built with React + Vite and Tailwind, backed by Supabase for auth, data, and realtime multiplayer features. The app is optimized for fast iteration (HMR), offline‑friendly behavior, and real‑time updates to grids, connections, and Hunt sessions. [supabase](https://supabase.com/docs/guides/realtime)

- Frontend: React 18 + TypeScript, Vite, React Router v6, Tailwind CSS, shadcn/ui, Framer Motion.  
- State: Lightweight global stores via Zustand for auth session, bingo grid, connections, QR scanner, and Hunt mode.  
- Backend: Supabase (Postgres, Auth, Storage, Realtime channels and Postgres Changes). [supabase](https://supabase.com/docs/guides/realtime)
- PWA: vite-plugin-pwa for manifest + service worker, autoUpdate mode to transparently ship new builds. [davidschinteie.hashnode](https://davidschinteie.hashnode.dev/react-pwa-with-typescript-using-cra-or-vite)
- Realtime: Supabase Realtime Postgres Changes on `connections`, `bingo_grid`, and Hunt tables to push updates to all connected clients in a session. [supabase](https://supabase.com/docs/guides/realtime)

CLOUD 101 is designed as a single-page shell with feature routes (`/grid`, `/scan`, `/my-qr`, `/network`, `/hunt/...`), all sharing the same Supabase client and auth/session store.

***

## 2. Supabase Integration & Data Layer

The frontend uses a single Supabase client instance created in `lib/supabase.ts` and shared across hooks and stores. Auth state changes (login, logout, token refresh) feed into a Zustand store that exposes `user`, `profile`, and loading/error flags to the rest of the UI. [reddit](https://www.reddit.com/r/Supabase/comments/1fny59c/handling_session_state_with_zustand/)

### 2.1 Client Setup

- `lib/supabase.ts` initializes the client with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.  
- Auth is handled with Supabase’s JS client; on sign‑in, we load or create a `profiles` row, including a generated `connection_code`.  
- Realtime subscriptions are attached per feature:
  - Bingo/Connections: `postgres_changes` on `connections` and `bingo_grid`.  
  - Hunt: `postgres_changes` on `hunt_sessions`, `hunt_players`, `hunt_cards`, `hunt_board`.  

### 2.2 Data Access Hooks

Feature hooks encapsulate business logic and Supabase calls:

- `useProfile`  
  - Load current user’s profile from `profiles`.  
  - Upsert profile on save.  
  - Generate and persist `connection_code` if missing.  

- `useConnections`  
  - Fetch all connections for the current profile (both directions).  
  - Subscribe to inserts on `connections` with real‑time updates into a local list.  
  - Expose helpers like `addConnectionFromScan`, `addConnectionFromCode`, sorting and search.  

- `useBingoGrid`  
  - Fetch 25 slot states from `bingo_grid` for the current user.  
  - Attach to realtime changes and recalculate progress after any update.  
  - Provide `fillSlot`, `selectSlot`, and computed `bingoProgress`.  

- Hunt hooks (e.g., `useHuntSession`, `useHuntBoard`, `useHuntCards`)  
  - Wrap creation/joining of sessions, dealing cards via RPC, and reading the current board state.  
  - Track `currentHunterId`, impersonators, and game status, and compute derived flags (`isHunter`, `canAccuse`, win state).

***

## 3. State Management (Zustand Stores)

Zustand is used as a thin layer on top of Supabase to keep the UI snappy and optimistic. Each store mirrors backend state but allows immediate local updates. [codesandbox](https://codesandbox.io/s/react-zustand-materialui-supabase-ftd761)

### 3.1 Core Stores

- `authStore`  
  - Holds `user`, `session`, and `isLoading`.  
  - Listens to Supabase `onAuthStateChange` and syncs state whenever tokens refresh or user signs out. [supabase](https://supabase.com/docs/guides/realtime)

- `profileStore`  
  - Current profile `full_name`, `linkedin_url`, `profile_picture_url`, `connection_code`.  
  - Actions: `setProfile`, `updateProfile`, `resetProfile`.  

- `bingoStore` (from PRD)  
  - `grid: (Connection | null)[]` length 25.  
  - `selectedSlot`, `progress`.  
  - Actions: `setGrid`, `fillSlot`, `selectSlot`, `calculateProgress`.  

- `scannerStore`  
  - Flags for scanner: `isOpen`, `failedAttempts`, `lastScanError`.  
  - After 3 failed attempts, flips a `showManualCodeEntry` flag to open the fallback modal.  

- `networkStore`  
  - Holds the connections list, search term, sort options, and pagination cursor.  
  - Applies client‑side filters and sorts; fetches more on infinite scroll.  

- `huntStore`  
  - `session`, `players`, `cards`, `board`, `currentHunterId`, `status`, `responders`.  
  - Derived computed values: `architectureProgress`, `isImposter`, `isHunter`, `isCrew`, `canStart`, `result`.  

The pattern: Supabase is the source of truth, while Zustand caches and composes state for smooth transitions, optimistic updates, and animations.

***

## 4. Routing & Navigation Shell

The app uses React Router v6 with nested routes and a persistent layout that includes the header and bottom nav.

### 4.1 Route Map

- `/`  
  - Landing; if authenticated and profile exists, redirects to `/grid`, else `/profile/setup`.  

- `/profile/setup`  
- `/profile/edit`  

- `/grid` (Bingo main)  
- `/scan` (full‑screen QR scanner)  
- `/my-qr` (QR/code display + share)  
- `/network` (My Network list)  

- `/hunt` (Hunt home + rules)  
- `/hunt/select` (architecture selection)  
- `/hunt/session/:id` (lobby)  
- `/hunt/session/:id/play` (active game UI)  
- `/hunt/session/:id/results` (results + reveal)  

### 4.2 Layout

- `App.tsx` renders a `Layout` wrapper that includes:
  - `Header` with app name, user avatar, and quick access actions.  
  - `Outlet` for current route.  
  - `BottomNav` with `Grid`, `Network`, `QR Code`, and optionally `Hunt`.  

Bottom nav reads `connectionCount` from `networkStore` for the badge and highlights the active route based on location.

***

## 5. QR Scanner & Manual Code Fallback

### 5.1 QRScanner Implementation

`QRScanner.tsx` uses the `@zxing/browser` APIs to drive a `<video>` element and decode QR content in real time. [stackoverflow](https://stackoverflow.com/questions/78323874/how-to-implement-qr-code-scanning-in-reactjs-using-zxing)

- On mount, it requests camera permissions and starts decoding from the rear camera when available.  
- A gradient overlay plus animated scan line is drawn via CSS/Framer Motion on top of the video element.  
- On successful decode:
  - Parse JSON payload `{ userId, name, linkedinUrl, version }`.  
  - Call Supabase to create a connection and update relevant `bingo_grid` slot if triggered from a challenge.  
  - Trigger haptic feedback via the Web Vibration API on supported devices.  
  - Show `ConnectionConfirmModal` with user details and confetti animation using `canvas-confetti`.  

- Failure & retry:
  - If decoding throws or returns invalid JSON, increment a `failedAttempts` counter in `scannerStore`.  
  - After 3 failures, auto‑open `ManualCodeEntry` as a fallback path.  

Torch/flash toggle uses `track.applyConstraints({ advanced: [{ torch: true }] })` when supported by the camera track.

### 5.2 Manual Code Entry

`ManualCodeEntry.tsx` is a modal that takes an 8‑character `connection_code` and validates it via a Supabase RPC or SQL function.  

- Input behavior:
  - Auto‑uppercase, with formatting like `AB12-CD34` rendered via CSS while storing a contiguous 8‑char string.  
  - Real‑time format validation: only enable the "Connect" button when the pattern matches `[A-Z2-9]{8}` excluding ambiguous characters.  

- Submission flow:
  - Calls `validate_connection_code` function; handles outcomes:
    - Not found → "Code not recognized".  
    - Already connected → "You're already connected!".  
    - Self connection (matching current user) → "Cannot connect with yourself".  
  - On success, creates a new row in `connections` and updates bingo/grid state where applicable.  

The fallback is wired both from the QR scanner screen ("QR not working?" link) and auto‑trigger after repeated scan failures.

***

## 6. My QR Code & Sharing

`MyQRCode.tsx` composes:

- Profile header card.  
- `QRCodeDisplay` (using `react-qr-code`) that encodes `{userId, name, linkedinUrl, version}` into a QR payload. [npmjs](https://www.npmjs.com/package/react-zxing)
- `ConnectionCodeCard` displaying the 8‑character connection code, with a copy‑to‑clipboard button and subtle success animation.  

### 6.1 QR Generation

- `react-qr-code` renders the QR as an SVG or into a hidden `<canvas>` for download.  
- The encoded JSON includes a `version` field for future backward‑compatible changes.  

### 6.2 Sharing & Download

- "Save QR"  
  - Converts the QR canvas to a blob and triggers a download as `cloud101-qr.png`.  

- "Share" (Web Share API)  
  - Uses `navigator.share` when available, passing `title`, `text` that includes the connection code, and an image file generated from the QR canvas. [adueck.github](https://adueck.github.io/blog/caching-everything-for-totally-offline-pwa-vite-react/)
  - Gracefully falls back to copy‑to‑clipboard + toast when the Web Share API is not supported.  

***

## 7. My Network Page

`MyNetwork.tsx` surfaces the user’s social graph built through QR scans and manual codes.

- Network summary card:  
  - Displays total connections (`X/25`), progress ring, and color scale based on thresholds (0–8, 9–16, 17–24, 25).  
  - At 25, triggers a confetti animation and a celebratory toast.  

- Search & sort:  
  - Text search filters connections by name in `networkStore`.  
  - Sort dropdown switches between `Recent`, `Alphabetical`, and `Challenge #` strategies.  

- Empty state:  
  - Shows animated QR icon, copy explaining the concept, and a CTA "Go to Grid" that navigates to `/grid`.  

- Connections list:  
  - `ConnectionsList` renders `ConnectionCard` items with avatar, name, LinkedIn link, challenge badge, and human‑readable timestamps using `date-fns`.  
  - Infinite scroll uses a cursor from Supabase queries to fetch batches of connections.  

Realtime updates ensure that new connections appear in the list within a session without manual refresh.

***

## 8. Hunt Game Mode Architecture

Hunt mode layers a multiplayer social deduction game on top of the existing Supabase + Zustand stack.

### 8.1 Session Lifecycle

- Session creation (`/hunt/select` → `/hunt/session/:id`):
  - Organizer chooses architecture (1 or 2) and creates a `hunt_sessions` row.  
  - Players join using their existing profile via `hunt_players`.  

- Deal phase:
  - Backend (Supabase RPC or serverless function) runs `dealCards(sessionId, architectureId)`:
    - Select 1–2 random players as imposters.  
    - Load architecture components from `architectures`.  
    - Build deck with multiple crew copies per component plus imposter cards (no briefs).  
    - Shuffle and insert 3 `hunt_cards` rows per player.  

- Active play:
  - The current Hunter selects a component from a dropdown and broadcasts "Who has X?".  
  - Interested players tap "I have it" on their phone, opening `ResponderModal`.  
  - Crew see their `briefText` and a timer; imposters see no brief and can pick any component to bluff.  

- Acceptance & board update:
  - Hunter reviews responders in the `HunterPanel` and presses "Accept" on a chosen player.  
  - The chosen card is moved to `hunt_board` with `is_imposter_card` cached.  
  - Card status flips to `locked`.  

- Win detection:
  - After each placement, `checkWinCondition(sessionId)` runs:
    - If all required components are present and any `is_imposter_card` is true → Imposter win.  
    - If all placed components are crew and architecture is complete → Crew win.  
  - Hunter can accuse a player as imposter before completion; a correct accusation yields Crew win, incorrect yields Imposter win.  

### 8.2 Realtime UX

Supabase Realtime broadcasts changes to all clients in the session:

- `hunt_sessions`: status transitions `setup` → `active` → `complete` broadcast to lobby and game screens.  
- `hunt_players`: keep the lobby synced as new players join.  
- `hunt_cards` and `hunt_board`: drive live updates to player hands and the architecture board, with Framer Motion animations on new placements.  

Zustand’s `huntStore` subscribes to these change events and recomputes derived state, which drives the UI in `HuntGameScreen` and `HuntResultsScreen`.

***

## 9. PWA & Performance

CLOUD 101 is shipped as a PWA with an offline‑friendly shell and aggressive caching for static assets. [davidschinteie.hashnode](https://davidschinteie.hashnode.dev/react-pwa-with-typescript-using-cra-or-vite)

- `vite-plugin-pwa`:
  - Generates a service worker in `autoUpdate` mode, manifest with icons, theme color, and description. [adueck.github](https://adueck.github.io/blog/caching-everything-for-totally-offline-pwa-vite-react/)
  - Caches the main shell and static JS/CSS so the app can load even with flaky conference Wi‑Fi.  

- Performance techniques:
  - Code splitting with `React.lazy` and dynamic imports for heavier routes like `/scan` and `/hunt`.  
  - Lazy loading of QR scanner and Hunt modules only when those routes are accessed.  
  - Debounced search input on `MyNetwork` to avoid excessive renders.  
  - Virtualized list for large connection sets using windowing on the list component.  

***

## 10. Developer Vibe Workflow

The repo is structured to support fast iteration, AI‑assisted component generation, and clean separation between feature areas.

- Folder layout:
  - `components/profile`, `components/bingo`, `components/scanner`, `components/qr`, `components/network`, `components/hunt`, `components/layout`.  
  - `lib` for Supabase, stores, and shared utilities.  
  - `hooks` for per‑feature data access and business logic.  

- Workflow habits:
  - Keep components roughly under 200 lines; split out presentational subcomponents and hooks when they grow.  
  - Use shadcn/ui primitives for consistent buttons, dialogs, cards, inputs, toasts.  
  - Let AI tools (Cursor, Copilot) scaffold UI components based on the PRD prompts, then wire them into the stores and Supabase calls.  

This tech doc section gives a high‑level, implementation‑oriented view to guide vibe‑coding the full CLOUD 101 experience while staying aligned with the PRD.
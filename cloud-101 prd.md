PRODUCT REQUIREMENTS DOCUMENT (PRD)



1. PROJECT OVERVIEW

App Name: CLOUD 101
Tagline: "Learn. Connect. Bingo!"
Purpose: Gamified networking platform for tech events, conferences, and community gatherings using QR codes and manual code entry as fallback.

Target Platform: Progressive Web App (PWA) with mobile-first responsive design
Primary Framework: React + Vite (for instant HMR) or Next.js 14+ (App Router)
Styling: Tailwind CSS + shadcn/ui components
State Management: Zustand or Jotai (lightweight, vibe-friendly)
Backend: Supabase (PostgreSQL + Realtime + Auth + Storage)


2. CORE FEATURES BREAKDOWN

2.1 USER PROFILE SYSTEM

Components to Build:
- ProfileSetup.tsx
- ProfileAvatar.tsx
- ProfileForm.tsx
- ProfileCard.tsx

Vibe Code Instructions:
```
Create a ProfileSetup component with:
- Centered card layout with gradient background
- Three input fields:
  * Full Name (text input with character count)
  * LinkedIn URL (URL validation with visual feedback)
  * Profile Picture URL (optional, with image preview)
- Avatar component showing initials when no picture
- Green primary button "Save Profile"
- Form validation with inline error messages
- Auto-save to Supabase on successful validation
- Redirect to /grid on save

Data Schema (Supabase):
```sql
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  full_name text not null,
  linkedin_url text not null,
  profile_picture_url text,
  connection_code text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
```


2.2 BINGO GRID SYSTEM

Components to Build:
- BingoGrid.tsx
- BingoSlot.tsx
- ChallengeModal.tsx
- ProgressBar.tsx

Vibe Code Instructions:
```
Create a BingoGrid component with:
- 5x5 CSS Grid layout (gap-3, responsive)
- Each slot as a circular card (w-16 h-16 on mobile, w-20 h-20 on tablet)
- Empty state: dashed border ring with centered "+" icon
- Filled state: Avatar image with scale animation on load
- Hover state: Show challenge preview tooltip
- Click handler opens ChallengeModal when empty
- Click handler shows UserDetails when filled
- Top banner showing "X more to go bingo!" with animated progress bar
- Use Framer Motion for smooth animations
```

Challenge Data (challenges.json):
```json
[
  {
    "id": 1,
    "title": "Flutter Multi-Platform",
    "description": "Find someone who has published a Flutter app on both Android and iOS",
    "category": "mobile",
    "icon": "📱"
  },
  {
    "id": 2,
    "title": "Play Store Launch",
    "description": "Find someone who has launched a Flutter app on the Google Play Store",
    "category": "mobile",
    "icon": "🚀"
  },
  ... (25 total challenges)
]
```

State Management (Zustand):
```typescript
interface BingoStore {
  grid: (Connection | null)[];
  selectedSlot: number | null;
  progress: number;
  setGrid: (grid: (Connection | null)[]) => void;
  fillSlot: (slotIndex: number, connection: Connection) => void;
  selectSlot: (index: number) => void;
  calculateProgress: () => void;
}
```


2.3 QR CODE SCANNING SYSTEM

Components to Build:
- QRScanner.tsx
- ScanButton.tsx
- ScannerOverlay.tsx
- ConnectionConfirmModal.tsx

Vibe Code Instructions:
```
Create a QRScanner component using @zxing/browser:
- Full-screen camera view with gradient overlay
- Animated scan line moving up/down
- Auto-detect QR codes in real-time
- Decode QR data (JSON: {userId, name, linkedin})
- Show confirmation modal with user preview
- Flash/torch toggle button (top-right)
- "X" close button (top-left)
- Success animation (green checkmark with confetti)
- Error animation (red shake + error message)
- Haptic feedback on iOS/Android when QR detected
```

Packages Needed:
```bash
npm install @zxing/browser
npm install react-qr-code
npm install canvas-confetti
```


2.4 MANUAL CODE ENTRY SYSTEM [CRITICAL FALLBACK]

Components to Build:
- ManualCodeEntry.tsx
- CodeInput.tsx
- CodeValidator.tsx

Vibe Code Instructions:
```
Create a ManualCodeEntry modal component:
- Triggered by "QR not working? Enter code manually" link
- Also triggered after 3 failed scan attempts
- Modal with dark semi-transparent backdrop
- Title: "Enter Connection Code"
- 8-character input field with:
  * All caps automatic transformation
  * Visual character separators (AB12-CD34 style)
  * Real-time validation (green border when valid)
  * Copy-paste support
- "Connect" button (disabled until valid format)
- "Back to Scanner" link
- "Where do I find this code?" help text with tooltip
- Error states:
  * Invalid format: red border + "Code must be 8 characters"
  * Code not found: "Code not recognized. Please verify."
  * Already connected: "You're already connected!"
  * Self-connection: "Cannot connect with yourself"
```

Code Generation Logic:
```typescript
function generateConnectionCode(userId: string): string {
  // Base32 encoding without ambiguous characters (O, I, L, 0, 1)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  const hash = simpleHash(userId);
  for (let i = 0; i < 8; i++) {
    code += chars[hash[i] % chars.length];
  }
  return code;
}
```

Supabase Function for Code Validation:
```sql
create or replace function validate_connection_code(code text)
returns table (user_id uuid, full_name text, linkedin_url text) as $$
  select id, full_name, linkedin_url
  from profiles
  where connection_code = upper(code);
$$ language sql security definer;
```


2.5 MY QR CODE PAGE

Components to Build:
- MyQRCode.tsx
- QRCodeDisplay.tsx
- ConnectionCodeCard.tsx
- ShareButton.tsx

Vibe Code Instructions:
```
Create a MyQRCode page with:
- Top section: User profile card
  * Avatar with connection count badge
  * Full name
  * "Connections: X/25" with mini progress ring
- Middle section: QR Code Display
  * Heading: "Share this QR code with others"
  * Large QR code (300x300px) with green border/glow
  * "Secured & Verified" badge with checkmark icon
  * Generate QR using react-qr-code package
  * QR encodes: {userId, name, linkedinUrl, version}
- NEW: Connection Code Section
  * Heading: "Connection Code"
  * Large bold 8-char code in monospace font
  * "Copy Code" button with clipboard icon
  * Copy success animation (checkmark appears briefly)
  * Help text: "Share this code if QR scanning isn't working"
- Bottom actions:
  * "Edit Profile" button (secondary)
  * "Save QR" button (downloads QR as PNG)
  * "Share" button (native Web Share API)
```

Web Share API Integration:
```typescript
async function shareQRCode() {
  const canvas = document.getElementById('qr-canvas');
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], 'bingo101-qr.png', { type: 'image/png' });
  
  if (navigator.share) {
    await navigator.share({
      title: 'Connect with me on Bingo 101',
      text: `My connection code: ${connectionCode}`,
      files: [file]
    });
  }
}
```


2.6 MY NETWORK PAGE

Components to Build:
- MyNetwork.tsx
- ConnectionsList.tsx
- ConnectionCard.tsx
- EmptyState.tsx
- SearchBar.tsx

Vibe Code Instructions:
```
Create a MyNetwork page with:
- Top card showing network overview:
  * Network icon
  * "Your Network" heading
  * Progress: "X/25" with circular progress indicator
  * Color-coded progress:
    - 0-8: gray-400
    - 9-16: yellow-400
    - 17-24: orange-400
    - 25: green-500 with celebration animation
- Search bar with icon (filters by name)
- Sort dropdown: "Recent", "Alphabetical", "Challenge #"
- Empty state (when no connections):
  * QR code icon (large, animated)
  * "No connections yet"
  * "Start scanning QR codes to build your network"
  * CTA: "Go to Grid" button
- Connections list (when filled):
  * Each card shows:
    - Avatar
    - Full name
    - LinkedIn icon (clickable external link)
    - Challenge number badge
    - Timestamp ("2 hours ago" format)
  * Smooth fade-in animation for new connections
  * Infinite scroll or pagination
```


3. ROUTING & NAVIGATION

Routes (React Router v6 or Next.js App Router):
```
/                    → Landing/Home (redirects to /grid if authenticated)
/profile/setup       → ProfileSetup (first-time users)
/profile/edit        → Edit existing profile
/grid                → BingoGrid (main page)
/scan                → QRScanner full-screen
/my-qr               → MyQRCode page
/network             → MyNetwork page
/connect/:code       → Deep link for manual code entry
```

Bottom Navigation Component:
```tsx
const navItems = [
  { icon: Grid3x3, label: 'Grid', path: '/grid' },
  { icon: Users, label: 'Network', path: '/network', badge: connectionCount },
  { icon: QrCode, label: 'QR Code', path: '/my-qr' }
];
```


4. SUPABASE SCHEMA & REAL-TIME

Complete Database Schema:
```sql
-- Profiles table
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null unique,
  full_name text not null,
  linkedin_url text not null,
  profile_picture_url text,
  connection_code text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Connections table
create table connections (
  id uuid primary key default uuid_generate_v4(),
  user_a_id uuid references profiles(id) not null,
  user_b_id uuid references profiles(id) not null,
  challenge_id integer not null,
  connection_method text check (connection_method in ('qr_scan', 'manual_code')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  constraint unique_connection unique (user_a_id, user_b_id),
  constraint no_self_connection check (user_a_id != user_b_id)
);

-- Bingo grid state
create table bingo_grid (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) not null,
  slot_index integer not null check (slot_index >= 0 and slot_index < 25),
  challenge_id integer,
  connection_id uuid references connections(id),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  constraint unique_user_slot unique (user_id, slot_index)
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table connections enable row level security;
alter table bingo_grid enable row level security;

-- RLS Policies
create policy "Users can view all profiles"
  on profiles for select
  using (true);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = user_id);

-- Real-time subscriptions
alter publication supabase_realtime add table connections;
alter publication supabase_realtime add table bingo_grid;
```

Real-time Connection Listener:
```typescript
supabase
  .channel('connections')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'connections',
      filter: `user_a_id=eq.${userId}`
    },
    (payload) => {
      // Update local state with new connection
      handleNewConnection(payload.new);
    }
  )
  .subscribe();
```


5. STYLING & DESIGN SYSTEM

Tailwind Config:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6FFF5',
          100: '#CCFFEB',
          500: '#00FF88',  // Main green
          600: '#00CC6D',
          700: '#00995
        },
        secondary: {
          500: '#1A4D2E',  // Dark green background
          600: '#153D24',
          700: '#102D1B'
        },
        accent: {
          500: '#00E5FF',  // Cyan highlights
          600: '#00B8CC'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      animation: {
        'scan-line': 'scan 2s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'confetti': 'confetti 0.5s ease-out'
      }
    }
  },
  plugins: []
}
```

shadcn/ui Components to Use:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
```


6. PACKAGE.JSON & DEPENDENCIES

```json
{
  "name": "bingo-101",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@supabase/supabase-js": "^2.38.0",
    "zustand": "^4.4.6",
    "@zxing/browser": "^0.1.4",
    "react-qr-code": "^2.0.12",
    "canvas-confetti": "^1.9.0",
    "framer-motion": "^10.16.4",
    "lucide-react": "^0.292.0",
    "date-fns": "^2.30.0",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.3.5",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.17.0"
  }
}
```


7. VIBE CODE DEVELOPMENT WORKFLOW

Step 1: Project Setup
```bash
# Create Vite project
npm create vite@latest bingo-101 -- --template react-ts
cd bingo-101

# Install dependencies
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Add shadcn/ui
npx shadcn-ui@latest init

# Install all packages
npm install @supabase/supabase-js zustand @zxing/browser react-qr-code canvas-confetti framer-motion lucide-react date-fns react-hot-toast
```

Step 2: Supabase Setup
```bash
# Create .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Step 3: Folder Structure
```
src/
├── components/
│   ├── profile/
│   │   ├── ProfileSetup.tsx
│   │   ├── ProfileAvatar.tsx
│   │   └── ProfileForm.tsx
│   ├── bingo/
│   │   ├── BingoGrid.tsx
│   │   ├── BingoSlot.tsx
│   │   ├── ChallengeModal.tsx
│   │   └── ProgressBar.tsx
│   ├── scanner/
│   │   ├── QRScanner.tsx
│   │   ├── ManualCodeEntry.tsx
│   │   ├── CodeInput.tsx
│   │   └── ConnectionConfirmModal.tsx
│   ├── qr/
│   │   ├── MyQRCode.tsx
│   │   ├── QRCodeDisplay.tsx
│   │   └── ConnectionCodeCard.tsx
│   ├── network/
│   │   ├── MyNetwork.tsx
│   │   ├── ConnectionsList.tsx
│   │   └── ConnectionCard.tsx
│   └── layout/
│       ├── BottomNav.tsx
│       └── Header.tsx
├── lib/
│   ├── supabase.ts
│   ├── store.ts (Zustand)
│   └── utils.ts
├── hooks/
│   ├── useProfile.ts
│   ├── useConnections.ts
│   └── useBingoGrid.ts
├── data/
│   └── challenges.json
└── App.tsx
```

Step 4: Vibe Code Components (Priority Order)

Day 1: Core Setup
1. Supabase client setup
2. Zustand store structure
3. ProfileSetup page
4. Basic routing

Day 2: Bingo Grid
1. BingoGrid component
2. BingoSlot component
3. ChallengeModal
4. Progress tracking

Day 3: QR Scanning
1. QRScanner with @zxing/browser
2. Camera permissions
3. QR decode logic
4. Connection confirmation

Day 4: Manual Code Entry (NEW FEATURE)
1. ManualCodeEntry modal
2. CodeInput with validation
3. Code generation utility
4. Supabase code validation function
5. Error handling UI

Day 5: My QR Code
1. QRCodeDisplay page
2. react-qr-code integration
3. Connection code display
4. Copy & Share functionality

Day 6: My Network
1. MyNetwork page
2. ConnectionsList
3. Search & filter
4. LinkedIn deep linking

Day 7: Polish
1. Animations (Framer Motion)
2. Toast notifications
3. Loading states
4. Error boundaries


8. AI PROMPTS FOR VIBE CODING

Prompt 1: Profile Setup
"Create a React component called ProfileSetup using Tailwind CSS. It should have a centered card with a gradient background (from emerald-900 to teal-900). Include three input fields: Full Name (required, max 50 chars), LinkedIn URL (required, with URL validation), and Profile Picture URL (optional, with image preview). Add a circular avatar showing user initials when no picture is provided. Include a green primary button 'Save Profile' that's disabled until required fields are valid. Use shadcn/ui components where possible. Add smooth transitions and a success toast on save."

Prompt 2: Bingo Grid
"Create a BingoGrid component with a 5x5 CSS grid layout. Each slot should be a circular card (64px on mobile, 80px on tablet). Empty slots show a dashed border with a centered '+' icon. Filled slots display an avatar image. Add hover effects showing the challenge description in a tooltip. At the top, show a banner with 'X more to go bingo!' and an animated progress bar. Use Framer Motion for smooth fade-in animations when slots are filled. Make it responsive and mobile-first."

Prompt 3: QR Scanner
"Create a QRScanner component using @zxing/browser library. It should take up the full screen with a camera feed. Add a semi-transparent gradient overlay with an animated scan line moving up and down. Include a flash/torch toggle button in the top-right and a close button in the top-left. When a QR code is detected, decode the JSON data, show a confirmation modal with user details, and trigger confetti animation on successful connection. Add haptic feedback for mobile devices."

Prompt 4: Manual Code Entry (CRITICAL)
"Create a ManualCodeEntry modal component that opens when QR scanning fails or when user clicks 'Enter code manually'. The modal should have an 8-character input field that automatically converts to uppercase and shows visual separators (like AB12-CD34). Add real-time validation with green border when format is valid. Include a 'Connect' button (disabled until valid), 'Back to Scanner' link, and help text. Handle all error cases: invalid format, code not found, already connected, self-connection. Show appropriate error messages with red borders and icons."

Prompt 5: Connection Code Display
"Create a ConnectionCodeCard component for the My QR Code page. Display a large, bold 8-character connection code in a monospace font (JetBrains Mono). Add a 'Copy Code' button with a clipboard icon that shows a success animation (checkmark) when clicked. Include help text below: 'Share this code if QR scanning isn't working'. Use Tailwind for styling with a card background and subtle shadow. The code should be easily readable and selectable."


9. TESTING SCENARIOS

Manual Testing Checklist:

✅ Profile Setup
  - [ ] Create profile with valid data
  - [ ] Validate required fields
  - [ ] Test LinkedIn URL validation
  - [ ] Verify avatar initials generation
  - [ ] Test profile picture URL preview

✅ Bingo Grid
  - [ ] Verify 5x5 grid renders correctly
  - [ ] Click empty slot opens challenge modal
  - [ ] Click filled slot shows user details
  - [ ] Progress bar updates correctly
  - [ ] Responsive design on mobile/tablet

✅ QR Scanning
  - [ ] Camera permissions requested
  - [ ] QR code detected and decoded
  - [ ] Flash toggle works
  - [ ] Success animation plays
  - [ ] Connection added to grid

✅ Manual Code Entry
  - [ ] Modal opens from "QR not working" link
  - [ ] Auto-uppercase transformation works
  - [ ] Real-time format validation
  - [ ] Valid code connects successfully
  - [ ] Invalid code shows error
  - [ ] Already connected shows error
  - [ ] Self-connection prevented
  - [ ] Copy-paste works correctly

✅ My QR Code
  - [ ] QR code generates correctly
  - [ ] Connection code displays
  - [ ] Copy button works
  - [ ] Share functionality works
  - [ ] Save QR downloads image

✅ My Network
  - [ ] Empty state shows correctly
  - [ ] Connections list populated
  - [ ] Search filters work
  - [ ] Sort options work
  - [ ] LinkedIn links open correctly


10. DEPLOYMENT (PWA on Vercel)

Vite PWA Config:
```javascript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Bingo 101',
        short_name: 'Bingo101',
        description: 'Gamified networking platform',
        theme_color: '#00FF88',
        background_color: '#1A4D2E',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
}
```

Vercel Deployment:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```


11. PERFORMANCE OPTIMIZATION

- Code splitting with React.lazy()
- Image optimization with next/image or lazy loading
- Debounce search input
- Virtual scrolling for large connection lists
- Service worker caching
- Preload QR scanner when approaching scan button


12. ANTIGRAVITY VIBE TIPS

✨ Use Cursor AI or GitHub Copilot for component generation
🎯 Keep components under 200 lines - split if larger
⚡ Hot reload should work instantly - check Vite config
🎨 Use Tailwind JIT mode for instant styling
🔄 Test real-time features with multiple browser tabs
🧘 Take breaks every 90 minutes - peak vibe coding happens in flow states


2.7 HUNT GAME MODE (In-Person Imposter Game)

Overview: A social deduction game played in-person where players are dealt cards with AWS architecture components. One or more players are randomly assigned "Imposter" cards with no information. A Hunter player asks for specific components, and players holding those cards must convince the Hunter they're legitimate (crew) or bluff their way through (imposters). The game is won by either eliminating all imposters or successfully fooling the Hunter.

Play Setting: In-person at tech events, conferences, or meetups. Physical phone interaction for viewing briefs.

Game Mechanics:

Roles:
- Hunter: Active player asking for components (rotates each round)
- Crew: Players with legitimate component cards (have brief description)
- Imposter(s): Players with imposter cards (no brief, must bluff)

Architectures Available:
- Architecture-1 (Microservices): Amazon CloudFront, ALB, Amazon ECS, Amazon S3, Aurora (optional)
- Architecture-2 (Distributed Systems): Target Instances with SSM Agent, Amazon S3 Bucket, Target Server Document, Worker Node Document, Amazon EC2, Worker Instance, AWS Systems Manager

Card System:
- Crew: Receive 3 legitimate component cards (with briefs) at game start
- Cards show: Component name + isImposter flag (for system tracking only)
- Imposter: Receive only generic "imposter" cards with no component info. Can strategically choose to claim ANY component from the architecture during gameplay

- Crew cards include: brief text, icon, role in architecture
- Imposter cards: Only imposter cards (generic "mystery" cards with no component name). Imposters can claim ANY component from the architecture and bluff about it

Round Flow:

1. Setup Phase
   - Organizer selects Architecture-1 or Architecture-2
   - System generates and shuffles deck
   - 3 cards dealt per player
   - 1-2 random players assigned imposter role (system flag)
   - Board shows empty architecture slots (visual grid or list)
   - Randomly select first Hunter

2. Hunter Question Phase
   - Hunter picks any component from the selected architecture
   - Announces: "Who has [Component Name]?"
   - All players holding that component (willing to respond) press "I have it" button on their phone

3. Answer & Pitch Phase
   - Each responder gets 20-30 seconds to convince the Hunter
   - Crew: See brief on phone, read/summarize it naturally
- Imposter: Can claim ANY component from the architecture (not just from hand), and must bluff convincingly without any brief
   - Hunter can ask follow-up questions (informal, not game rules)

4. Acceptance Phase
   - Hunter decides which responder(s) to trust
   - Picks one player and accepts their card
   - Accepted card placed on architecture board as "locked in"
   - That player's card is removed from their hand

5. Victory Conditions (checked after each acceptance or after 3+ components placed)
   - Imposter Win: If architecture is completed (all required components placed) AND at least one card came from an imposter
   - Crew Win: If all placed components are from non-imposters (no imposters in final board)
   - OR: Hunter can accuse a specific player as imposter before completing architecture
     - If correct ⇒ Crew wins
     - If incorrect ⇒ Imposter wins (even if architecture incomplete)

UI/UX Flows:

Home Screen (/hunt):
- "Hunt Game" CTA button from main CLOUD 101 home
- Option to select Architecture-1 or Architecture-2
- Brief rules popup
- "Start New Session" button

Game Lobby (/hunt/session/:id):
- Show all connected players
- Display: Player name, avatar, role (if visible to them), connection status
- Organizer-only button: "Start Game"
- Waiting spinner with player count

Hunt Active Screen (/hunt/session/:id/play):
- Top banner: Architecture name + component progress "3/5 placed"
- Left column: Your cards (3 cards)
  - Each card shows component name + brief (if crew)
  - "View Brief" button for crew (disabled for imposter)
  - Card state: available, locked (used), or pending (being questioned)
- Center: Architecture board
  - Visual grid or flow diagram matching the architecture
  - Empty slots show as placeholder boxes
  - Filled slots show component icon + name + source player name
- Right column: Hunter panel (if you're the Hunter)
  - Dropdown: "Select component to ask for"
  - "Ask for [Component]" button
  - Below: Live responders list
    - Each responder shows: name, avatar, timestamp
    - "Accept" button, "Suspect" button

Responder Modal (triggered on phone when "Who has X?" broadcast):
- Title: "Hunter asks: Do you have [Component]?"
- If crew:
  - "Your Brief" section showing description
  - "Convince the Hunter" button (enables 20s timer)
  - When clicked: "You have 20 seconds - convince them!"
  - Timer counts down
  - "I'm ready" button to confirm pitch done
- If imposter:
  - Title only: "Hunter asks: Do you have [Component]?"
  - No brief shown
- "Choose Component & Bluff" dropdown showing all available components to claim, then "Pitch" button starts timer
  - Timer counts down
  - "I'm done
 pitching"
  - "I'm done" button
- Both show: timer display, responder position in queue

Win Screen (/hunt/session/:id/results):
- Show result: "Crew Victory!" or "Imposter Victory!"
- List all players with their role revealed
- Highlight imposter(s) if game completed
- Component breakdown showing which placed components were crew vs imposter
- "Play Again" or "Back to Hunt Home" button

Components to Build:
- HuntHome.tsx
- HuntLobby.tsx
- HuntGameScreen.tsx
- HuntArchitectureBoard.tsx
- ResponderModal.tsx
- HunterPanel.tsx
- HuntResultsScreen.tsx
- CardDisplay.tsx
- CountdownTimer.tsx

Vibe Code Instructions:

```typescript
// Card data structure
interface HuntCard {
  id: string;
  sessionId: string;
  playerId: string;
  architectureId: 1 | 2;
  componentId: string;  // e.g. 'cloudfront', 's3', 'alb'
  isImposter: boolean;
  briefText?: string;   // null/empty if imposter
  icon: string;
  status: 'available' | 'pending' | 'locked';
}

// Session state
interface HuntSession {
  id: string;
  architectureId: 1 | 2;
  players: Player[];
  currentHunterId: string;
  boardComponents: PlacedComponent[];
  status: 'setup' | 'active' | 'complete';
  imposters: string[]; // player IDs
  createdAt: timestamp;
  updatedAt: timestamp;
}

// Placed component tracking
interface PlacedComponent {
  componentId: string;
  cardId: string;
  playerId: string;  // who provided it
  acceptedAt: timestamp;
  isImposterCard: boolean; // cached for easy win calculation
}
```

Data Schema (Supabase):

```sql
-- Hunt sessions
create table hunt_sessions (
  id uuid primary key default uuid_generate_v4(),
  architecture_id smallint not null (1 or 2),
  organizer_id uuid references profiles(id),
  status text check (status in ('setup', 'active', 'complete')),
  current_hunter_id uuid references profiles(id),
  imposters_json jsonb, -- array of player uuids
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Hunt players (session participants)
create table hunt_players (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references hunt_sessions(id) on delete cascade,
  player_id uuid references profiles(id),
  is_imposter boolean default false,
  card_count integer default 3,
  created_at timestamp with time zone default now()
);

-- Hunt cards dealt
create table hunt_cards (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references hunt_sessions(id) on delete cascade,
  player_id uuid references profiles(id),
  component_id text not null, -- 'cloudfront', 's3', etc
  is_imposter boolean default false,
  brief_text text,             -- null if imposter
  status text check (status in ('available', 'pending', 'locked')) default 'available',
  created_at timestamp with time zone default now()
);

-- Hunt board (placed components)
create table hunt_board (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references hunt_sessions(id) on delete cascade,
  card_id uuid references hunt_cards(id),
  placed_by_player_id uuid references profiles(id),
  component_id text not null,
  is_imposter_card boolean,    -- cached from card at time of placement
  placement_order integer,
  created_at timestamp with time zone default now()
);

-- Architecture definitions
create table architectures (
  id smallint primary key,
  name text,
  description text,
  required_components jsonb,  -- array of {id, name, brief, icon, role}
  created_at timestamp with time zone default now()
);

insert into architectures (id, name, description, required_components) values
(1, 'Microservices', '...', '{"components": [{"id": "cloudfront", "name": "Amazon CloudFront", ...}, ...]}'::jsonb),
(2, 'Distributed Systems', '...', '{"components": [{"id": "s3", "name": "Amazon S3 Bucket", ...}, ...]}'::jsonb);
```

Realtime Subscriptions (Supabase):
- hunt_sessions: on status change, notify all players in session
- hunt_players: when new player joins
- hunt_board: when component is placed (broadcast to all in session)
- hunt_cards: on status change (if card goes pending, notify responders list)

Game Logic Functions:

```typescript
// Generate and deal cards
async function dealCards(sessionId: string, architectureId: 1 | 2) {
  const players = await getSessionPlayers(sessionId);
  const imposters = selectRandomImposters(players, count: 1-2);
  const architecture = await getArchitecture(architectureId);
  const components = architecture.required_components;
  
  // Generate deck: multiple crew cards per component + imposter cards
  const deck = [];
  components.forEach(comp => {
    deck.push({ ...comp, isImposter: false });
    deck.push({ ...comp, isImposter: false }); // 2nd crew copy
  });
  // Add imposter cards (blank, no brief)
  imposters.forEach(() => {
    components.forEach(comp => {
      deck.push({ componentId: comp.id, name: comp.name, isImposter: true, brief: null });
    });
  });
  
  // Shuffle and deal 3 per player
  const shuffled = shuffle(deck);
  let cardIndex = 0;
  for (const player of players) {
    for (let i = 0; i < 3; i++) {
      await createHuntCard({
        sessionId,
        playerId: player.id,
        ...shuffled[cardIndex++],
        status: 'available'
      });
    }
  }
}

// Check win condition
async function checkWinCondition(sessionId: string): boolean {
  const board = await getHuntBoard(sessionId);
  const session = await getHuntSession(sessionId);
  const architecture = await getArchitecture(session.architectureId);
  
  if (board.length === architecture.required_components.length) {
    // Architecture completed - check if any imposter in board
    const hasImpostor = board.some(item => item.is_imposter_card);
    if (hasImpostor) return 'IMPOSTOR_WIN';
    else return 'CREW_WIN';
  }
  return null; // Game continues
}
```

Routing:
- `/hunt` → HuntHome
- `/hunt/select` → ArchitectureSelector
- `/hunt/session/:id` → HuntLobby
- `/hunt/session/:id/play` → HuntGameScreen (active game)
- `/hunt/session/:id/results` → HuntResultsScreen

How Hunt Integrates with CLOUD 101:

1. New menu item under /grid landing:
   - "Try Hunt Mode (Cloud Architect Imposter Game)" link

2. Reuse existing patterns:
   - Zustand store for hunt game state (similar to bingoStore)
   - Supabase realtime for live updates
   - Shadcn modals for responder prompts
   - Tailwind grid layouts for component board
   - Connection code generation for players to join same session

3. Architecture data:
   - Can pull from new architectures.json or from Supabase
   - Briefs sourced from AWS service descriptions

4. Player data:
   - Use existing profiles table
   - Reuse avatar + name from profile

5. Navigation:
   - Add /hunt routes alongside /grid, /scan, /network
   - Bottom nav includes Hunt

===== END OF CLOUD 101 PRD =====

Ready to vibe code! 🚀🎉


```

Bingo 101 - Antigravity Vibe Code Edition
QR & Manual Code Networking Platform


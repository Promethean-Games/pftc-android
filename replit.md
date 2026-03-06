# Par for the Course - Billiards Training Game

## Overview

Par for the Course is a mobile-first billiards training card game designed for active gameplay. The app supports local multiplayer scoring with game save/load functionality. It uses a physical card deck system (16 course cards + 2 jokers) with 3D flip animation. A Stripe paywall gates cards 4-18 (first 3 cards are free). Built with a React frontend and Express backend, all game data is stored in browser localStorage — no database required. A standalone single HTML file version is maintained for GitHub Pages deployment.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **State Management**: React Context API for game state (`GameContext`) and unlock state (`UnlockContext`)
- **Data Fetching**: TanStack Query for server state management
- **Build Tool**: Vite with custom Replit plugins for development

The frontend follows a screen-based navigation pattern with four main screens: Splash, Player Setup, Game, and Summary. A bottom navigation bar provides quick access during gameplay. The UI prioritizes outdoor readability with high contrast, bold typography, and one-handed operation support.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Style**: RESTful endpoints under `/api/` prefix
- **No Database**: All game data lives in browser localStorage

The server only handles two Stripe endpoints for the paywall. Development uses Vite middleware for HMR, while production serves static files from the built output.

### Data Storage
- **Local Storage**: Game sessions, settings, device IDs, and unlock status persist in browser localStorage
- **Key localStorage entries**:
  - `currentGame` - Active game session data
  - `pftc_unlocked` - Set to `"true"` after Stripe payment to unlock all 18 holes
  - `appScreen`, `appActiveTab`, `appViewOnly` - UI state persistence

### Stripe Paywall
- **Free Tier**: Holes 1-3 are always playable for free
- **Paid Unlock**: Holes 4-18 require a one-time Stripe payment
- **Unlock Flow**:
  1. User reaches hole 4 and sees unlock overlay in GameScreen
  2. Clicking "Unlock All 18 Cards" calls `POST /api/create-checkout-session`
  3. User is redirected to Stripe Checkout
  4. On success, redirected back to `/?unlock=success&session_id={ID}`
  5. App verifies payment via `GET /api/check-unlock-status?session_id=xxx`
  6. On verification, sets `localStorage.pftc_unlocked = "true"`
- **Persistence**: Unlock persists permanently on the device via localStorage
- **Gating**: GameScreen shows overlay for locked holes; SummaryScreen shows lock icons for holes 4-18 data

### Game Analytics
- **Turn Timing**: Each player's turn is timed (start/end timestamps recorded in `turnTimes[]` array in GameState)
- **Accumulated Play Time**: `totalPlayTimeMs` in GameState tracks only active play time (when the game tab is visible and active). Timer pauses when switching tabs, navigating away, or when the browser tab is hidden (via `visibilitychange` API). This prevents inflated game times when saving/loading games across different days.
  - `pauseTimer()` / `resumeTimer()` methods in GameContext control the timer
  - App.tsx watches `screen`, `activeTab`, `isComplete`, and document visibility to auto-pause/resume
  - Same pause/resume logic implemented in standalone HTML
- **Analytics Component**: `GameAnalytics.tsx` renders post-game analytics in SummaryScreen using recharts:
  - Total game time and per-player time (uses `totalPlayTimeMs` when available, falls back to sum of turn times)
  - Line chart of turn durations by card (recharts)
  - Fastest/slowest card per player and group
  - Average turn time per player
  - Most consistent pace player
  - Best par-or-better streak
  - Scoring rate (strokes/minute)
- **Standalone**: Same analytics (except line chart) rendered in standalone HTML

### CueMaster Tools
- **Cueing Emulator**: Canvas-based billiards shot simulator accessible from the wrench icon dropdown on the splash screen
  - Top-down 9-foot pool table rendered on HTML5 Canvas with green felt, wood rails, 6 pockets, and diamond sights
  - Ball management: add/remove solid (yellow) and stripe (white with green band) balls; drag to reposition; tap to select
  - Snap-to-grid: enabled by default, snaps dragged balls to nearest grid line (X or Y independently) with 5px buffer; diamond grid from 8×4 divisions (12.5" spacing); subtle grid lines drawn on table when active; toggle button in toolbar
  - Move Cue Ball mode: toggle button switches cue ball between aim mode (drag to set shot direction) and move mode (drag to reposition); default is aim mode
  - Undo stack: each shot pushes pre-shot state onto a history stack; Undo button pops the last state, allowing backtracking all the way to the initial layout
  - Rail width: dynamically sized to encapsulate pocket circles (pocketRadius * scale + 4px, min 16px)
  - Aiming: drag from cue ball to set direction; thin aim line extends from cue ball
  - Real-time trajectory preview: trajectories update live as aim angle, speed, english, or physics settings change
  - Trajectories terminate at pockets (no trajectory extends beyond a pocket)
  - Colored path lines per ball type (cue=light blue, solids=yellow, stripes=green); each ball involved in a collision gets its own trajectory
  - Rail bounces: trajectory lines include angles off the rail
  - Settings via accordion panels:
    - Shot Speed: slider 1–10 (maps to initial cue ball velocity)
    - Fine-Tune Angle: slider ±5° with 0.1° steps
    - English (Spin): circular cue ball face diagram with crosshairs, 0.25-tip snap grid (diagram click snaps to nearest 0.25), cue tip circle overlay, and red dashed miscue limit ring; sliders allow fine-tuning at 0.05 steps (-1.5 to +1.5 tips); H: negative = left, positive = right; V: negative = follow/topspin (top of ball), positive = draw/backspin (bottom of ball)
    - Table Physics: segmented controls for Table Speed (Slow/Medium/Fast), Equipment (Dirty/Average/Clean), Rails (Soft/Medium/Firm)
  - Cut angle display: shows cut angle in hundredths of degrees for first object ball collision, with ball-hit summary (Full/3/4/1/2/1/4 ball); fullness = 1 - sin(cutAngle)
  - Settings sidebar: slide-out panel from right side (280px), toggled by gear icon button; replaces bottom accordion for better mobile UX
  - Physics engine: `client/src/lib/billiards-physics.ts` — pure TypeScript module based on Dr. Dave Alciatore's published research (Colorado State University)
    - Ball-ball collisions: 2D elastic with throw (friction at contact point)
    - Ball-rail collisions: reflection with restitution + running/reverse English effects (spin transfer 0.15, decay 0.7)
    - Cue ball squirt: side English offsets initial direction opposite the spin side (squirt coeff 0.006)
    - Cue ball swerve: side spin component perpendicular to velocity induces gradual lateral curve (swerve coeff 0.00012)
    - Friction model (Dr. Dave-based): slip-based sliding-to-rolling transition
      - Spin tracked as 2D vector; natural roll = spin equals velocity (in ωR units)
      - Slip = spin - velocity; friction acts to reduce slip
      - Sliding phase: when |slip| > threshold, friction pushes velocity toward spin (2/7 of force) and spin toward velocity (5/7 of force) — solid sphere moment of inertia ratios
      - Rolling phase: once slip ≈ 0, only rolling friction applies (much lower deceleration)
      - Draw/backspin (positive englishY): spin opposes velocity → friction decelerates forward motion AND accelerates backward → ball reverses direction after contact
      - Follow/topspin (negative englishY): spin exceeds velocity → friction accelerates ball forward
      - Side spin: perpendicular slip component produces swerve via applySwerve function
      - Spin initialization: rollFactor = topDrawFactor * 1.5 (ensures meaningful backspin at moderate english settings)
      - Simulation stop condition: checks both velocity AND spin magnitudes (prevents premature termination when ball has spin but near-zero velocity, e.g., draw after pocketing)
    - Rolling friction (μᵣ): slow/medium/fast = 0.015/0.010/0.005 (Dr. Dave range: 0.005–0.015)
    - Sliding friction (μₛ): slow/medium/fast = 0.30/0.20/0.15 (Dr. Dave range: 0.15–0.4)
    - Rail restitution (e): soft/medium/firm = 0.55/0.72/0.85 (Dr. Dave range: 0.6–0.9+)
    - Ball-ball throw factor: dirty/average/clean = 0.050/0.035/0.020 (dirty = chalk/grime at contact, clean = polished)
    - Squirt coefficient: 0.005 (~2.5° max deflection at full english, per Dr. Dave)
    - Swerve coefficient: 0.00015 (subtle lateral curve from side spin)
  - Implemented in both React (`CueingEmulator.tsx`) and standalone HTML
- **Table Leveler**: Uses the device's motion sensors (DeviceOrientationEvent API) to display a visual bubble/spirit level
  - Circular spirit level with animated bubble that moves based on device tilt
  - Color-coded feedback: green (level) → yellow (slightly off) → red (significantly tilted)
  - Numeric L/R and F/B tilt readouts in degrees
  - Three calibration presets: Home, League, Tournament — each saved independently to localStorage
  - iOS permission handling for motion sensor access
  - Accessible from the wrench icon dropdown on the splash screen
  - localStorage keys: `pftc_level_home`, `pftc_level_league`, `pftc_level_tournament`
  - Implemented in both React (`TableLeveler.tsx`) and standalone HTML

### Key Design Decisions
1. **Offline-First Local Games**: Single-device gameplay stores all data locally, no server required
   - **Page Persistence**: App screen (splash/setup/game/summary), active tab, and view-only mode are persisted to localStorage so page refresh returns users to the last screen they were visiting
2. **Device-Based Unlock**: Stripe unlock is per-device via localStorage
3. **18-Card Limit**: Games are strictly limited to 18 cards. Frontend enforces this limit. Game auto-completes after card 18.
4. **Roster Order**: At each new card, players are re-sorted by lowest score on the previous card (tiebreak: lowest total score, then alphabetical)
5. **Card Deck System**: 16 course cards (par 2-6) + 2 joker cards. Jokers let the player choose their own par. Cards are shuffled per game.

### API Endpoints
- `POST /api/create-checkout-session` - Creates Stripe Checkout Session for unlocking all 18 holes
- `GET /api/check-unlock-status?session_id=xxx` - Verifies a Stripe checkout session payment status

## External Dependencies

### UI Components
- **Radix UI**: Headless component primitives (dialog, dropdown, select, tabs, etc.)
- **shadcn/ui**: Pre-styled component library built on Radix
- **Lucide React**: Icon library

### Payments
- **Stripe**: Payment processing for the paywall (via `stripe` npm package)

### Development
- **Vite**: Build tool with React plugin
- **Replit Plugins**: Runtime error overlay, cartographer, and dev banner for Replit environment
- **esbuild**: Production server bundling

### Fonts
- Google Fonts CDN: DM Sans, Fira Code, Geist Mono, Architects Daughter

## Environment Variables Required
- `STRIPE_SECRET_KEY` - Stripe secret API key for creating checkout sessions
- `STRIPE_PRICE_ID` - Stripe Price ID for the "Unlock All 18 Cards" product
- `NODE_ENV=production` (for production builds)

## Build Commands
- `npm run dev` - Start development server (Express + Vite HMR)
- `npm run build` - Build frontend and backend
- `npm run start` - Start production server

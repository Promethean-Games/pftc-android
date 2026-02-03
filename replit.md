# Par for the Course - Mini-Golf Scoring App

## Overview

Par for the Course is a mobile-first mini-golf scoring application designed for outdoor use during active gameplay. The app supports local multiplayer scoring, tournament mode with live leaderboards, and game save/load functionality. It's built with a React frontend and Express backend, using PostgreSQL for tournament data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **State Management**: React Context API for game state (`GameContext`) and tournament state (`TournamentContext`)
- **Data Fetching**: TanStack Query for server state management
- **Build Tool**: Vite with custom Replit plugins for development

The frontend follows a screen-based navigation pattern with four main screens: Splash, Player Setup, Game, and Summary. A bottom navigation bar provides quick access during gameplay. The UI prioritizes outdoor readability with high contrast, bold typography, and one-handed operation support.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **API Style**: RESTful endpoints under `/api/` prefix
- **Session Management**: No authentication required - tournament rooms use PIN-based director access

The server handles tournament creation, player registration, score synchronization, and leaderboard calculations. Development uses Vite middleware for HMR, while production serves static files from the built output.

### Data Storage
- **Local Storage**: Game sessions, settings, and device IDs persist in browser localStorage
- **PostgreSQL**: Tournament data including rooms, players, and scores
- **Schema Design**: Five main tables:
  - `tournaments` - Tournament rooms with PIN-based director access
  - `tournament_players` - Players registered to tournaments with optional universal player linkage
  - `tournament_scores` - Per-hole scores for leaderboard calculation
  - `universal_players` - Persistent player identities across tournaments for handicap tracking
  - `player_tournament_history` - Completed tournament results for handicap calculation

### Handicapping System
- **Universal Player IDs**: Players can be linked to a persistent universal identity that tracks them across tournaments
- **Handicap Calculation**: Based on average strokes-over-par from last 5 completed tournaments, normalized to 18 holes
- **Provisional Handicap**: Players with fewer than 5 completed tournaments have a "provisional" flag
- **Tournament Completion Flow**: When director completes a tournament, results are saved to history and handicaps are recalculated for all linked players
- **Director UI Integration**: DirectorPortal has "Find Existing Player" search to link tournament players to universal identities

### Player Login System
- **Player Code + PIN Authentication**: Players can log in using their unique player code (e.g., PC7001) and a 4-digit PIN
- **First-Time PIN Setup**: New players can create a PIN, optionally with Tournament Director authorization
- **Profile Access**: Logged-in players can view their handicap, tournament history, and personal stats
- **PIN Management**: Players can change their PIN from the profile page
- **API Endpoints**:
  - `POST /api/player/login` - Verify player code + PIN
  - `POST /api/player/set-pin` - Set or update player PIN
  - `GET /api/player/:code/profile` - Get player profile (public info)
  - `GET /api/player/:code/has-pin` - Check if player has PIN set

### Key Design Decisions
1. **Offline-First Local Games**: Single-device gameplay stores all data locally, no server required
2. **Tournament Mode**: Optional server sync for multi-device tournaments with live leaderboards
3. **Device-Based Identity**: Devices get unique IDs stored in localStorage for player assignment
4. **Master Director PIN System**: Tournament directors authenticate with master PIN (3141) verified server-side, granting access to create/manage all tournaments
5. **Player Authentication**: Players authenticate with their unique code + 4-digit PIN for profile access

### Tournament Director Flow
- Access via Settings gear icon on splash screen
- Enter 4-digit master PIN (3141) - verified server-side via POST /api/director/verify
- TournamentManagementPage shows all tournaments with create/delete/backup/manage options
- DirectorPortal provides per-tournament dashboard with player management, groups, and start functionality
- All director endpoints require master PIN or tournament-specific PIN for authorization

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management
- **Neon Serverless**: PostgreSQL driver (`@neondatabase/serverless`)

### UI Components
- **Radix UI**: Headless component primitives (dialog, dropdown, select, tabs, etc.)
- **shadcn/ui**: Pre-styled component library built on Radix
- **Lucide React**: Icon library

### Development
- **Vite**: Build tool with React plugin
- **Replit Plugins**: Runtime error overlay, cartographer, and dev banner for Replit environment
- **esbuild**: Production server bundling

### Fonts
- Google Fonts CDN: DM Sans, Fira Code, Geist Mono, Architects Daughter

## Deployment

This app is fully portable and can be deployed outside of Replit.

### Quick Deploy to Render
1. Push code to GitHub
2. Connect repository to Render
3. Render auto-detects `render.yaml` and configures everything

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `NODE_ENV=production`

### Build Commands
- `npm run build` - Build frontend and backend
- `npm run start` - Start production server
- `npm run db:push` - Push schema to database

See `DEPLOYMENT.md` for full instructions.
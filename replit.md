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
- **Schema Design**: Three main tables - `tournaments`, `tournament_players`, `tournament_scores` with proper foreign key relationships

### Key Design Decisions
1. **Offline-First Local Games**: Single-device gameplay stores all data locally, no server required
2. **Tournament Mode**: Optional server sync for multi-device tournaments with live leaderboards
3. **Device-Based Identity**: Devices get unique IDs stored in localStorage for player assignment
4. **Director PIN System**: Tournament directors authenticate with a PIN to access management features

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
# CLAUDE.md

## Project Overview
P2P App Ecosystem - decentralized web store for creating, distributing, and purchasing apps via peer-to-peer network. Built on Bitcoin/Lightning, IPv6, PWA, L402 payments, front-end loaded for <1GB devices.

## Development Commands
**Frontend (client/):** `pnpm dev|build|lint`
**Server (server/):** `cargo run|build|test|check`
**Setup:** Create `server/.env` with `ANTHROPIC_API_KEY=key`

## Architecture
**Frontend:** React+TypeScript PWA (store, dashboard, code gen)
**Server:** Rust mini-server (API proxy, Host APIs, modular handlers)
**P2P:** Gossip protocol, local SQLite, Lightning payments
**Stack:** Jotai state, Tailwind CSS, Axum+Tokio

## File Structure
**client/:** `pages/` routes, `components/` UI, `libs/` utilities, `state.ts` Jotai
**server/:** `src/main.rs` entry point, modular handlers (`handlers/database.rs`, `handlers/apps.rs`)

## Development Patterns
**DB:** Server-side SQLite with RESTful JSON API, no local storage for apps
**State:** Jotai async atoms (`projectsAtom`, `projectByIdAtom` for server data)
**API:** Route through Rust server, use `libs/anthropic.ts`
**Files:** Always **kebab-case**
**Data Flow:** Server database → async atoms → React components
**Compilation:** After editing code, verify it compiles without errors using `pnpm build` in client/ and `cargo check` in server/
**File Size Limits:** Keep files under 300 LOC. Split into modules when exceeded:
- Server handlers: Split by domain (database.rs, apps.rs, auth.rs)
- Client components: Group by feature or UI pattern
- Use mod.rs or re-exports to maintain clean imports
**Route Structure:** Use `/[models]/[id]` pattern for detail pages (e.g., `/projects/[id]/` for project details)
**Code Duplication Prevention:**
- NEVER create duplicate components in different directories
- Consolidate shared components in a single location with clear imports
- Use relative imports `./component` for collocated components
- Remove unused/outdated files immediately after refactoring
- Verify imports and run `pnpm build` after moving components

## Specialized Agents
1. **p2p-app-builder** - P2P apps following ecosystem principles
2. **anthropic-api-integrator** - Secure API integration
3. **threejs-3d-ui-developer** - 3D UI (Node OS)
4. **ui-builder** - React/TypeScript UI components with Apple design consistency

## Guidelines
**Security:** API keys server-only, proxy all external calls
**Storage:** All app data server-side, use async atoms for state management
**Testing:** Check existing patterns, focus P2P/offline/Lightning flows
**Code:** Reuse 75%+ common functions, expand vs duplicate, use Shadcn UI
**Migration:** Local storage deprecated, use `projectsAtom` and server API

## Server Details
**Routes:** Health check, JS generation stream
**AI:** Claude 3 Haiku generates React components with hooks, Host API, Tailwind
**Stack:** Axum, Tokio, serde, reqwest, tracing

## Host APIs
**Base:** `localhost:10000/api/db` (dev), `node.local:443/api/db` (prod)
**CRUD:** `GET /api/db` (collections), `POST|GET|PUT|DELETE /api/db/{collection}[/{id}]`
**Features:** Schema-free JSON, auto-timestamps, UUID IDs, pagination (max 1000)

**JS Integration:** Use `HostAPI.db.{create,get,update,delete,list,collections}()` methods

## Config
**Server:** Port 10000, requires `ANTHROPIC_API_KEY`, <1GB RAM optimized
**AI:** Claude 3 Haiku, 4096 tokens, temp 1.0

## Task Assignment
**UI Components:** Use `ui-builder` subagent for all client/ React/TypeScript component work
**P2P Features:** Use `p2p-app-builder` for decentralized functionality
**API Integration:** Use `anthropic-api-integrator` for secure external API calls
**3D Interface:** Use `threejs-3d-ui-developer` for Three.js and WebXR features

## Rationale
**Bitcoin/Lightning:** Only scalable decentralized payments
**IPv6:** No domain gatekeepers, unlimited addresses
**PWA:** Native experience without app store censorship
**L402:** Native web micropayments via HTTP 402
**Front-loaded:** <1GB devices, browser processing
**3D UI:** Intuitive Three.js, WebXR-ready

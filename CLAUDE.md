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
**DB:** Server-side SQLite with RESTful JSON API
**State:** Jotai async atoms (`projectsAtom`, `projectByIdAtom`)
**Files:** Always **kebab-case**
**Data Flow:** Server database → async atoms → React components
**Compilation:** Verify with `pnpm build` (client) and `cargo check` (server)
**File Size:** <300 LOC, split by domain when exceeded
**Routes:** Use `/[models]/[id]` pattern for detail pages
**Code Duplication:** Consolidate shared components, use relative imports, remove unused files

## Always prefer Claude Subagents:

Automatically delegate tasks to specialized subagents for optimal efficiency:

**ui-builder:** ALL client/* work - triggers: client/, React, TypeScript, UI, components, styling, Tailwind - handles: React/TypeScript components, design system, Jotai state, PWA features
**rust-server-developer:** ALL server/* work - triggers: server/, Rust, API, database, handlers - handles: Rust code, Axum/Tokio, SQLite, API endpoints, performance optimization
**threejs-3d-ui-developer:** Specialized client/ work for immersive 3D interfaces - triggers: Three.js, WebGL, 3D UI - handles: 3D components, animations, spatial interactions
**anthropic-api-integrator:** Specialized server/ work for AI integration - triggers: Anthropic API, Claude, AI features - handles: API integration, prompt engineering, response handling

**Collaboration Flow:**
- Agents coordinate on API contracts and data structures
- Cross-reference between client/server for consistent implementation
- Shared documentation updates when interfaces change
- Always validate full-stack integration after changes

## Guidelines
**Security:** API keys server-only, proxy all external calls
**Storage:** Server-side only, use async atoms
**Code:** Reuse 75%+, use Shadcn UI, expand vs duplicate

## Host APIs
**Base:** `localhost:10000/api/db` (dev), `node.local:443/api/db` (prod)
**CRUD:** `GET /api/db` (collections), `POST|GET|PUT|DELETE /api/db/{collection}[/{id}]`
**Features:** Schema-free JSON, auto-timestamps, UUID IDs
**JS:** Use `HostAPI.db.{create,get,update,delete,list,collections}()` methods

## Config
**Server:** Port 10000, requires `ANTHROPIC_API_KEY`, <1GB RAM
**AI:** Claude 3 Haiku, 4096 tokens, temp 1.0

## Rationale
**Bitcoin/Lightning:** Only scalable decentralized payments
**IPv6:** No domain gatekeepers
**PWA:** Native experience without app store censorship
**L402:** Native web micropayments
**Front-loaded:** <1GB devices, browser processing

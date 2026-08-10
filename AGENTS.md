# Agent notes for votemap.net

Guidance for coding agents working on this repo.

## UI / landing page changes

Whenever you change visible UI (landing page layout, embeds, theme, motion, responsive behavior):

1. **Take screenshots** and save them under `/opt/cursor/artifacts/screenshots/` so the requester can review on desktop **or phone**.
2. Capture at least:
   - Desktop light mode
   - Desktop dark mode
   - Mobile (~390px) light mode
   - Mobile (~390px) dark mode
3. Prefer **clean full-page PNGs** of the site itself (no browser chrome / DevTools). Hide Next.js dev overlays when capturing.
4. Prefer frames that show the changed UI clearly (not only the hero).
5. Attach or embed those screenshots in the PR description (and leave the artifact files in place for phone viewing).
6. Respect existing **dark/light** (`next-themes`) and **effects** (footer magic-wand) toggles when adding animated or themed UI.

## Stack reminders

- Next.js App Router with `output: 'export'` (static export) — no server-only APIs at request time.
- Landing UI lives in `app/page.tsx` + `components/landing/*` (Chakra UI + framer-motion).
- Prefer free, keyless embeds (e.g. `react-tweet`) over paid APIs when embedding third-party content.

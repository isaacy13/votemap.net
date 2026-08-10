# Agent notes for votemap.net

Guidance for coding agents working on this repo.

## UI / landing page changes — screenshots are mandatory

**Do not consider a UI change done until fresh screenshots are captured and shown.**

After **every** visual change (including follow-ups like “remove X”, spacing tweaks, theme fixes):

1. **Re-capture screenshots immediately** — old artifacts are not enough. Overwrite files under `/opt/cursor/artifacts/screenshots/`.
2. Capture at least:
   - Desktop light mode
   - Desktop dark mode
   - Mobile (~390px) light mode
   - Mobile (~390px) dark mode
3. Prefer **clean full-page PNGs** of the site itself (no browser chrome / DevTools). Hide Next.js dev overlays when capturing.
4. Prefer frames that show the changed UI clearly (not only the hero).
5. **Show the screenshots in your reply to the user** (so they can review on phone) **and** embed them in the PR description.
6. Commit/push code first if needed, but **never skip screenshot refresh** on the same turn as a UI edit.
7. Respect existing **dark/light** (`next-themes`) and **effects** (footer magic-wand) toggles when adding animated or themed UI.

## Stack reminders

- Next.js App Router with `output: 'export'` (static export) — no server-only APIs at request time.
- Landing UI lives in `app/page.tsx` + `components/landing/*` (Chakra UI + framer-motion).
- Prefer free, keyless embeds (e.g. `react-tweet`) over paid APIs when embedding third-party content.

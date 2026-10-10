# Radix to Base UI project migration

Completed 2026-04-18 on branch `migrate/radix-to-base-ui`.

## Dependency and shadcn configuration

- Changed `web/components.json` from `radix-nova` to `base-nova`; `shadcn info --json` now reports `base: "base"` and Base UI component docs/registry paths.
- Added `@base-ui/react` 1.9.0 and removed the aggregate `radix-ui` dependency after all Radix wrappers were migrated. `web/pnpm-lock.yaml` is updated.
- Migrated all 12 wrappers that imported Radix: avatar, badge, breadcrumb, button, collapsible, dropdown-menu, label, scroll-area, separator, sheet, sidebar, and tooltip. Current derived count: **0 wrappers remain on Radix** (`rg -l 'from "radix-ui"|from "@radix-ui' web/src/components/ui`).
- Each wrapper has its own report in this directory. `button.md` also records the initial dependency/config update; `sidebar.md` records final Radix dependency removal.

## App-code sweep

- Replaced used `asChild` call sites with Base UI `render` in the button, collapsible, dropdown-menu, and sidebar consumers.
- Replaced Radix menu trigger open-state and trigger-width selectors with Base UI `data-popup-open` and `--anchor-width`.
- Replaced Radix positioning variables and state/keyframe selectors in migrated overlay/menu wrappers. Preserved the sidebar’s custom `data-state="expanded|collapsed"`, which is app-owned rather than a Radix primitive attribute.
- Did not migrate unrelated UI code that was not Radix-backed (including the custom Field system, input, textarea, card, skeleton, and third-party integrations).

## Behavior changes to review

- `asChild` is replaced by `render` for the migrated wrappers.
- Tooltip and sheet/menu overlays now use Base UI starting/ending-style transitions instead of Radix keyframe animations.
- Radix CheckboxItem/RadioItem menu selection closed menus by default; Base UI’s corresponding defaults differ. No app consumer uses those items; this delta is flagged in `dropdown-menu.md` rather than silently patched.
- Radix Separator’s `decorative` prop has no Base UI equivalent; no app caller passed it.
- The app has not had interactive browser QA in this migration. Follow each component report’s checklist before shipping.

## Verify

- `pnpm --dir web build`: **passes** (client and SSR builds). Existing TanStack `inputValidator()` deprecation warnings remain.
- `pnpm --dir web exec tsc --noEmit`: **fails on unrelated existing application typing/lint issues**: `app-sidebar.tsx` passes the session user to `NavUser` with the wrong `avatar` shape; `dashboard.tsx` has an unused `user`; `settings/sources.tsx` has an unused `and` import and two server-function serializability errors (`config: unknown`). No Base UI wrapper/call-site errors were reported.
- `pnpm --dir web test`: Vitest exits 1 because the repository currently contains no test files.
- Radix leftover scan: **0 UI wrappers and no Radix imports in `web/src` or the web manifest/lockfile**.

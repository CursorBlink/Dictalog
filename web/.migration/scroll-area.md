# scroll-area

2026-04-18, golden pair via shadcn CLI, regenerated the pristine ScrollArea wrapper from the Base UI registry.

## Changed

- `web/src/components/ui/scroll-area.tsx`: migrated wrapper anatomy and part names to `@base-ui/react/scroll-area`; retained registry styling. Leftover scan `grep -n "radix-ui\\|@radix-ui"` is clean.
- `web/src/routes/_authenticated/log.tsx`: inspected the only application consumer; it passes no Radix-only props, so its call site remains unchanged.

## Left alone

- The log-page content and layout remain untouched.
- No other ScrollArea API consumers exist.

## Behavior changes

- Base UI drops Radix’s `type` and `scrollHideDelay` props in favor of CSS-driven scrollbar visibility. The app consumer does not set either prop.

## Verify by hand

- Scroll the log conversation vertically and confirm the scrollbar appears and the viewport scrolls as expected.
- Test a narrow viewport and confirm the log composer remains outside the scrollable region.

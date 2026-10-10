# badge

2026-04-18, golden pair via shadcn CLI, regenerated the pristine Badge wrapper from the Base UI registry.

## Changed

- `web/src/components/ui/badge.tsx`: replaced Radix Slot/asChild polymorphism with Base UI `useRender` and `mergeProps`; registry classes and the existing public variant API are preserved. Leftover scan `grep -n "radix-ui\\|@radix-ui"` is clean.

## Left alone

- No application consumer uses `Badge asChild`; callers require no prop migration.
- No third-party UI wrappers are involved.

## Behavior changes

- `Badge asChild` is replaced by Base UI’s `render` prop. No current consumer depends on the old API.

## Verify by hand

- Check badges across the log page in default, secondary, and destructive variants.
- If rendering a link badge in the future, use `render={<a href="…" />}` and verify keyboard focus/activation.

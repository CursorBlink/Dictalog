# separator

2026-04-18, golden pair via registry + customized-wrapper replay, migrated the Radix single-part primitive to Base UI’s callable Separator while preserving local styling.

## Changed

- `web/src/components/ui/separator.tsx`: switched to `@base-ui/react/separator`, changed the primitive type to `SeparatorPrimitive.Props`, and retained orientation, data-slot, and project classes. Removed the unsupported `decorative` prop. Leftover scan `grep -n "radix-ui\\|@radix-ui"` is clean.

## Left alone

- Existing separator call sites need no API changes; none pass `decorative`.
- Other primitives remain on Radix until their component migration.

## Behavior changes

- Base UI Separator is always semantic; Radix’s `decorative` prop has no Base UI equivalent. Existing usages were checked and use the separator for semantic section boundaries.

## Verify by hand

- Check horizontal separators in fields and content sections and vertical separators in the dashboard/settings headers.
- Inspect accessibility output to confirm separators expose the expected semantic role and orientation.

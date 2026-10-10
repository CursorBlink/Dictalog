# label

2026-04-18, transformation engine (no Base UI Label primitive), replaced the Radix wrapper with a native `<label>` and kept its styling.

## Changed

- `web/src/components/ui/label.tsx`: removed the Radix Label dependency and renders a native label with the existing `data-slot`, classes, and native label props. Added a Biome note clarifying that control association is supplied at the call site. Leftover scan `grep -n "radix-ui\\|@radix-ui"` is clean.
- `web/src/components/ui/field.tsx`: inspected consumers; it continues to use the wrapper through native label-compatible props, so no consumer edits were required.

## Left alone

- The app’s custom Field system is not a Radix Form wrapper and remains unchanged.
- No `asChild` consumer exists for Label.

## Behavior changes

- Native labels no longer apply Radix-specific pointer-selection behavior; the wrapper already uses `select-none`, preserving the visible interaction.

## Verify by hand

- Click each form label and confirm its associated input receives focus.
- Confirm disabled field labels retain their muted styling.

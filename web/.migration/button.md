# button

2026-04-18, golden pair via registry + customized-wrapper replay, migrated the shadcn Button wrapper to Base UI while preserving the project’s variants and sizing.

## Changed

- `web/components.json`: switched the shadcn style from `radix-nova` to `base-nova` for this whole-project migration.
- `web/package.json`, `web/pnpm-lock.yaml`: added `@base-ui/react` 1.9.0 alongside Radix during the migration.
- `web/src/components/ui/button.tsx`: replaced the Radix Slot/asChild implementation with the real `@base-ui/react/button` primitive. Preserved project variant/size classes and `data-variant`/`data-size` attributes. Leftover scan `grep -n "radix-ui\\|@radix-ui"` is clean.
- `web/src/routes/_authenticated/jobs/s3-audio-analysis.tsx`: changed the only Button `asChild` consumer to Base UI’s `render` API.

## Left alone

- Button variant definitions and public `variant`/`size` props remain unchanged to preserve current UI.
- Other wrappers and their consumers are not yet migrated; Radix remains installed until the last wrapper is finalized.

## Behavior changes

- `Button asChild` is no longer supported; the consumer now supplies `render={<Link />}`. No other intentional behavior change.

## Verify by hand

- Visit Jobs → S3 Audio Analysis with no source configured; confirm the outlined Settings link navigates correctly and retains button styling.
- Tab to the button, activate it with Enter and Space, and verify the focus ring and disabled state.

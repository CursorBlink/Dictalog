# sheet

2026-04-18, golden pair via shadcn CLI + customized icon/import replay, migrated the Radix Dialog-backed Sheet wrapper to Base UI Dialog.

## Changed

- `web/src/components/ui/sheet.tsx`: switched to `@base-ui/react/dialog`, replaced Overlay/Content with Backdrop/Popup, changed parts to Base UI `.Props` types, and migrated Close composition to `render`. Preserved project side variants, Lucide close icon, and local Button import. Replaced keyframe state selectors with Base UI starting/ending-style transitions. Leftover scan `grep -n "radix-ui\\|@radix-ui"` is clean.
- `web/src/components/ui/sidebar.tsx`: inspected its mobile sheet composition; current `open`/`onOpenChange`, side, title, and description props remain compatible.

## Left alone

- Sidebar continues to use the Sheet wrapper for mobile navigation; its own Radix Slot wrappers are still pending migration.
- Did not change the Button wrapper while applying the Sheet registry update; its existing Base UI wrapper and custom data attributes remain intact.

## Behavior changes

- Sheet backdrop and side-panel motion now uses Base UI presence transitions. No app call site depended on Radix-specific autofocus or outside-interaction callbacks.

## Verify by hand

- Use a mobile viewport, open the sidebar sheet, and close it with the close button, Escape, and backdrop click.
- Confirm focus returns to the trigger and the sheet slides in from the right without blocking the page at desktop widths.

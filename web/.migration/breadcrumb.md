# breadcrumb

2026-04-18, golden pair via registry + customized-wrapper replay, migrated BreadcrumbLink’s Radix Slot composition to Base UI `useRender` while keeping the project’s Lucide icons.

## Changed

- `web/src/components/ui/breadcrumb.tsx`: replaced `Slot`/`asChild` with `useRender` and `mergeProps`, preserving the existing classes, `data-slot`, and Lucide chevron/ellipsis icons. Leftover scan `grep -n "radix-ui\\|@radix-ui"` is clean.
- `web/src/routes/_authenticated/dashboard.tsx`, `web/src/routes/_authenticated/jobs/s3-audio-analysis.tsx`, and `web/src/routes/_authenticated/settings/sources.tsx`: inspected call sites; each uses native `href` and needs no `render` conversion.

## Left alone

- Breadcrumb list/page/separator/ellipsis components and their app layout remain unchanged.
- Replaced neither the icon library nor its imports; the upstream placeholder icon module is not part of this app.

## Behavior changes

- `BreadcrumbLink asChild` is replaced with Base UI’s `render` prop; current consumers do not use `asChild`.

## Verify by hand

- Visit dashboard, Jobs → S3 Audio Analysis, and Settings → Sources; verify breadcrumb links navigate and current-page labels remain announced correctly.
- Confirm the default separator and ellipsis icons render as before.

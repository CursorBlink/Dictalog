# collapsible

2026-04-18, golden pair via shadcn CLI, migrated the wrapper and adapted its navigation consumer to Base UI’s `render` composition.

## Changed

- `web/src/components/ui/collapsible.tsx`: regenerated the pristine radix-nova wrapper as the base-nova Base UI wrapper. Leftover scan `grep -n "radix-ui\\|@radix-ui"` is clean.
- `web/src/components/nav-main.tsx`: replaced `asChild` on the Collapsible root and trigger with `render`; updated the trigger’s open selector to `data-panel-open` and composed the rendered trigger directly with `SidebarMenuAction`.

## Left alone

- `SidebarMenuButton` and `SidebarMenuSubButton` still use the sidebar wrapper’s `asChild` API; those are part of the pending sidebar migration.
- No other Collapsible consumers exist.

## Behavior changes

- The wrapper now exposes Base UI’s `render` API instead of Radix’s `asChild` API. Existing single-open-item state and default-open behavior remain unchanged.

## Verify by hand

- Open the app sidebar and expand/collapse a Platform navigation group with both mouse and keyboard.
- Confirm the chevron rotates when open and the nested links remain clickable.

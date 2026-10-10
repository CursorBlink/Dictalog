# sidebar

2026-04-18, transformation engine with Base UI `useRender`/`mergeProps`, migrated the customized sidebar’s Slot/asChild wrappers and completed the whole-project Radix removal.

## Changed

- `web/src/components/ui/sidebar.tsx`: removed Radix Slot and migrated SidebarGroupLabel, SidebarGroupAction, SidebarMenuButton, SidebarMenuAction, and SidebarMenuSubButton to `render` via Base UI `useRender`/`mergeProps`. Preserved custom classes, tooltip behavior, and state/data-slot attributes; changed the menu-button open hook to `data-popup-open`. Leftover scan `grep -n "radix-ui\\|@radix-ui"` is clean.
- `web/src/components/app-sidebar.tsx`, `web/src/components/nav-main.tsx`, `web/src/components/nav-projects.tsx`, and `web/src/components/nav-secondary.tsx`: changed sidebar `asChild` compositions to Base UI `render`.
- `web/package.json`, `web/pnpm-lock.yaml`: removed `radix-ui` only after all wrappers were migrated; `@base-ui/react` remains installed.

## Left alone

- Sidebar’s custom `data-state="expanded|collapsed"` and selectors using `data-state=collapsed` are application-owned state, not Radix attributes; they remain intentionally unchanged.
- Existing Sidebar state management, cookie behavior, keyboard shortcut, and mobile layout are unchanged.

## Behavior changes

- Sidebar wrappers that formerly exposed `asChild` now expose Base UI’s `render` API.
- Sidebar menu-button popup styling now keys off Base UI’s `data-popup-open` attribute.

## Verify by hand

- At desktop width, expand/collapse the sidebar, navigate primary and secondary links, and verify active/open styling and menu tooltips.
- Open the project overflow and user menus; test keyboard navigation, Escape dismissal, and focus return.
- At mobile width, open the sidebar sheet and close it with the close button, Escape, and backdrop click.

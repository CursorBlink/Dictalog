# dropdown-menu

2026-04-18, golden pair via shadcn CLI + customized icon/class replay, migrated DropdownMenu to Base UI Menu and swept its active consumers.

## Changed

- `web/src/components/ui/dropdown-menu.tsx`: replaced Radix DropdownMenu parts with `@base-ui/react/menu`, including Portal → Positioner → Popup, GroupLabel, SubmenuRoot/SubmenuTrigger, and distinct checkbox/radio indicators. Retained Lucide icons and wrapper variants; remapped Radix positioning variables and replaced keyframe/state animations with Base UI transition attributes. Leftover scan `grep -n "radix-ui\\|@radix-ui"` is clean.
- `web/src/components/nav-projects.tsx`, `web/src/components/nav-user.tsx`: changed DropdownMenuTrigger composition to Base UI `render`; updated NavUser’s open-state selector to `data-popup-open` and trigger-width variable to `--anchor-width`.

## Left alone

- Sidebar-specific `asChild` compositions remain for the pending sidebar wrapper migration.
- No app consumer uses CheckboxItem, RadioItem, or submenu parts.

## Behavior changes

- Radix CheckboxItem/RadioItem close-on-selection behavior differs from Base UI, whose `closeOnClick` default is false for those parts. No current consumer uses either part; this delta is flagged, not patched.
- Dropdown menu opening/closing motion uses Base UI transitions rather than Radix keyframe classes.

## Verify by hand

- Open the user menu and project overflow menus; verify keyboard navigation, Escape dismissal, focus return, and viewport-edge positioning.
- Confirm the NavUser open-state background and trigger-width sizing.
- If checkbox/radio menu items are added later, explicitly decide whether to set `closeOnClick`.

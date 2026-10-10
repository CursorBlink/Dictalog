# tooltip

2026-04-18, golden pair via registry + customized-wrapper replay, migrated tooltip parts to Base UI’s positioner/popup model and preserved the app’s tooltip styling.

## Changed

- `web/src/components/ui/tooltip.tsx`: changed the primitive import/types to `@base-ui/react/tooltip`, renamed provider `delayDuration` to `delay`, moved positioning props onto Positioner, and added Popup/Positioner structure. Replaced Radix state/keyframe animation hooks with Base UI starting/ending-style transitions and updated transform-origin/arrow positioning. Leftover scan `grep -n "radix-ui\\|@radix-ui"` is clean.
- `web/src/components/ui/sidebar.tsx`: changed its TooltipTrigger composition from `asChild` to Base UI `render` so the pending sidebar wrapper remains compatible.
- `web/src/routes/__root.tsx`: inspected provider usage; no props required migration.

## Left alone

- Tooltip callers still use the same Root/Content wrapper names and positioning options.
- Other Radix imports in `sidebar.tsx` are still pending the sidebar migration.

## Behavior changes

- Tooltip entry/exit motion now uses Base UI presence transitions rather than Radix delayed-open keyframe animations. The provider delay API is now `delay`; no app caller configures the previous delay prop.

## Verify by hand

- Collapse the sidebar and hover a menu button; check the tooltip opens, positions, and its arrow points at the trigger.
- Use keyboard focus on the same control and confirm the tooltip is announced and dismisses when focus moves away.
- Check tooltip placement near each viewport edge for collision handling.

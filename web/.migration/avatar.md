# avatar

2026-04-18, golden pair via registry + customized-wrapper replay, migrated Avatar parts to Base UI and preserved the project’s extra group/badge components.

## Changed

- `web/src/components/ui/avatar.tsx`: switched the primitive import to `@base-ui/react/avatar` and changed primitive prop types to Base UI `.Props` types. Existing Avatar size styling, `AvatarBadge`, `AvatarGroup`, and `AvatarGroupCount` remain. Leftover scan `grep -n "radix-ui\\|@radix-ui"` is clean.

## Left alone

- `web/src/components/nav-user.tsx` only uses the shared Avatar, Image, and Fallback parts with compatible props.
- No Avatar fallback delay prop is used by the app.

## Behavior changes

- None identified in current usage. Base UI’s fallback uses `delay` where Radix used `delayMs`; no consumer configures either.

## Verify by hand

- Check the sidebar user menu avatar with a loaded image and with the fallback displayed.
- Confirm the avatar remains correctly sized and clipped in both the menu trigger and menu content.

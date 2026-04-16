# Rank Badge System Guide

The rank badge system makes progression visible in places where players actually look: search results, profile rows, party lists, and leaderboard-adjacent UI.

This is not just visual polish. It is part of the retention loop. Players need to see status movement quickly and consistently.

## What It Does

- Resolves a user's current tier and level
- Renders a badge using configured assets or fallback styling
- Scales for compact and expanded UI contexts
- Supports optional tooltip context where space allows

## Where It Integrates

- Shared badge component: src/components/RankBadge.js
- Combined avatar, name, and rank display: src/components/UserDisplay.js
- Existing entry points include user search views, with extension points across chat, party, and profile surfaces

## Asset Model

Rank assets live under public/assets/ranks.

Expected files:

- bronze.png
- silver.png
- gold.png
- platinum.png
- diamond.png
- master.png

If an asset is missing, UI falls back gracefully instead of breaking layout.

## Practical Integration Pattern

Use RankBadge directly for simple placements.

Use UserDisplay when you want avatar, name, and rank as a single unit.

Keep badge sizes consistent per surface:

- Dense lists: smaller badges
- Profile cards and hero rows: larger badges

## Extension Strategy

When adding a new tier:

1. Add tier definition in badge configuration.
2. Add matching asset file.
3. Validate fallback behavior by temporarily removing the asset.
4. Verify readability in both dark and light contexts.

## Performance Notes

- Fetch as little tier data as possible per render path.
- Reuse already-loaded user data when available.
- Keep badge rendering cheap in list-heavy screens.

## Common Mistakes To Avoid

- Mixing multiple badge sizes in one row
- Relying on assets without fallback behavior
- Hiding critical context in hover-only UI for mobile-first surfaces
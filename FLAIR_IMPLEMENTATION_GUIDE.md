# Leaderboard Flair Implementation Guide

This feature places cosmetic flair where it has the most impact: next to rank placement on leaderboard rows.

That small positioning decision matters. Players read rank first, then identity. Putting flair near rank made status feel immediate instead of decorative.

## What Changed

- Flair moved from username column to rank column
- Rank cell layout updated for stable spacing and alignment
- Rendering flow cleaned up so flair lookup is predictable

## Data Flow

1. Read leaderboard data from userStats.
2. Pull user profile basics from users.
3. Pull equipped cosmetics from userCosmetics.
4. Resolve flair metadata via cosmetic lookup utility.
5. Render flair adjacent to rank indicator.

## Why This Design

- Keeps leaderboard rows easier to scan
- Preserves rank visibility while adding cosmetic identity
- Avoids clutter around usernames in dense lists

## Testing Notes

Validate with:

- Users with no equipped flair
- Users with known flair IDs
- Missing cosmetic metadata
- Mobile viewport compression

The UI should degrade gracefully if flair data is missing.

## Relevant Components

- Leaderboard rendering path (rank cell)
- CosmeticFlair component
- Cosmetic data resolver utilities

## Next Improvements

- Add stronger fallback visuals for unknown flair IDs
- Add visual regression tests for rank row alignment
- Add optional compact mode for very dense leaderboard variants

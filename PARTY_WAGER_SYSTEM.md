# Party Wager System

This system exists because 1v1 logic does not scale cleanly to team play.

In 1v1, readiness is binary. In party wagers, readiness is per-player, team composition is dynamic, and cancellation and refund behavior has more failure modes.

## What This System Solves

- Supports 2v2, 3v3, and 4v4 wager formats
- Preserves team boundaries when parties join and match state changes
- Tracks readiness per player, not per team
- Prevents coin flip and match start until every participant is ready
- Keeps non-party flow working without regression

## Core Model

Party wagers add fields on top of normal wager data:

- isPartyWager
- partyMembers and guestPartyMembers
- participants
- readyStatus keyed by userId

That gives one reliable source for readiness and participant count across party sizes.

## Lifecycle

1. Host party leader creates wager.
2. Joining party leader joins with their party.
3. System merges participants and initializes readyStatus for everyone.
4. Each player sets ready individually.
5. Match transitions to playing only after all ready checks pass.

This keeps the start gate strict and avoids half-ready starts.

## Key Decisions

- Ready state is stored by userId to avoid role-based edge cases.
- Team construction prioritizes explicit party arrays, then falls back to participant inference when needed.
- Shared utility checks are used for both party and non-party readiness so behavior stays predictable.

## Important Edge Cases

- Party member disconnects or leaves before ready
- Guest party partially joined
- Legacy non-party wagers without full party fields
- Duplicate ready updates from fast UI interactions

The implementation favors safety over speed in these paths. It is better to delay transition than start a broken match.

## Relevant Code Areas

- Create flow: src/components/CreateWagerModal.js
- Join flow: src/components/JoinWagerModal.js
- Ready UI and state checks: src/components/ReadyUpButton.js and src/pages/WagerMatch.js
- Utilities: src/utils/wagerUtils.js

## Next Improvements

- Add reconciliation jobs for rare stuck-ready states
- Add deterministic integration tests for party join and leave race conditions
- Expand event trail visibility for moderation tools

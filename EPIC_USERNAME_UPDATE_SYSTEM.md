# Epic Username Verification and Sync System

This system exists to keep Epic usernames consistent across our data model and external verification sources.

Yunite already performs daily username updates for verified users. Our layer focuses on verification, reconciliation, and auditability.

## What It Does

- Runs scheduled checks for linked Epic accounts
- Verifies current username state through Yunite integration
- Updates local records only when data changes
- Tracks update history with timestamps and source metadata

## Why It Is Built This Way

The platform needs stable player identity across wagers, disputes, and moderation actions.

A stale Epic username creates friction in support and can break trust in match records. This system reduces that drift.

## Sync Flow

1. Find users with linked Epic identity.
2. Query Yunite-backed verification data.
3. Compare returned username to current stored value.
4. Update only on change.
5. Append history entry for traceability.

## Operational Modes

- Scheduled verification checks (default path)
- Admin-triggered full verification run
- Admin-triggered single-user verification

## Data Tracking

Updates record:

- previous username
- new username
- update timestamp
- source or method metadata

That audit trail helps when investigating disputes or support tickets.

## File Map

- Core backend logic: functions/epicUsernameUpdater.js
- Function exports and wiring: functions/index.js
- Admin controls and UI entry points in frontend admin components

## Next Improvements

- Better retry strategy for transient API failures
- Alerting when verification error rates exceed threshold
- Optional manual override workflow for exceptional support cases

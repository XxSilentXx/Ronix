# Ronix: Fortnite Wager Platform

I built Ronix as a real multiplayer wager product, not a demo app.

The first version handled simple 1v1 wagers. The current version handles party formats, cancellations, refunds, payout rails, moderation workflows, and the edge cases that only appear once people actually use the system.

## What It Does

- Token wagers for 1v1 and party formats
- Full match lifecycle: open, ready, playing, submitting, completed, cancelled
- Refund and recovery logic for failed or cancelled matches
- Payment handling through PayPal, Square, and Coinbase
- Discord, Epic, and Twitch account linking
- Progression systems: stats, leaderboard behavior, cosmetics, and achievements
- Admin tooling for moderation and manual intervention

## Stack

- Frontend: React
- Backend: Firebase Cloud Functions (Node)
- Database: Firestore
- Auth: Firebase Authentication
- Integrations: Discord, Epic, PayPal, Square, Coinbase, Fortnite API

## System Shape

The frontend handles interaction-heavy game state and user flows.

Cloud Functions own sensitive operations: payment creation and verification, payout and refund paths, and third-party orchestration.

Firestore is the source of truth for users, wagers, transactions, and progression records.

## Why This Repo Is Useful In Interviews

This codebase shows production-style engineering decisions:

- Stateful flows that can fail halfway through
- Money-adjacent logic where consistency matters
- Recovery paths and fallback behavior
- Integration boundaries where external services are unreliable

It also keeps a bugfix archive so debugging history is visible, not hidden.

## Run Locally

Use [SETUP.md](SETUP.md) for full setup.

Quick path:

1. Install dependencies in root and functions directories.
2. Copy .env.example and set your local values.
3. Configure Firebase for your project.
4. Start frontend with npm start.

## Security Posture For Public Version

This public repo is intentionally sanitized.

- No live credentials are committed
- Sensitive operational details are reduced
- Environment templates are included so reviewers can still understand and run the project with their own keys

## Documentation Map

- Core feature docs stay in root for quick review.
- Structured technical docs are in [docs/](docs/README.md).
- Production fix history is in [docs/archive/bugfixes/](docs/archive/bugfixes/README.md).

## License

MIT

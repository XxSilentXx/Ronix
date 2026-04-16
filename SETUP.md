# Setup Guide (Local Development)

This repo is public-safe by design. Real credentials are intentionally excluded.

## Fast Start

1. Install prerequisites:
   - Node.js 18+
   - Firebase CLI
   - A Firebase project with Auth, Firestore, and Functions enabled
2. Install dependencies in root and functions folders.
3. Copy .env.example and set local values.
4. Run frontend with npm start.

## Install Commands

From repo root:

```bash
npm install
```

From functions:

```bash
cd functions
npm install
cd ..
```

## Environment Setup

- Keep client-side values in your local env file.
- Keep server secrets out of client env files.
- Use Firebase Functions config or Secret Manager for server-side secrets.

## Firebase Setup

```bash
firebase login
firebase use <project-id>
firebase deploy --only firestore:rules,firestore:indexes
```

## Run

Frontend:

```bash
npm start
```

Functions emulator (optional):

```bash
cd functions
npm run serve
```

## Common Failure Points

- OAuth callback mismatch: check authorized domains and redirect URIs.
- Firestore query and index errors: create missing composite indexes.
- Payment flow failures: verify server-side secret config, not client env.

## Public Repo Rules

- Never commit real secrets.
- Keep local env files out of source control.
- If any secret was exposed before, rotate it before production use.
# Setup Guide (Local Development)

This repo is public-safe by design. Real credentials are intentionally excluded.
## Fast Start

1. Install prerequisites:
   - Node.js 18+
   - Firebase CLI
   - A Firebase project with Auth, Firestore, and Functions enabled
2. Install dependencies in root and functions folders.
3. Copy .env.example and set local values.
4. Run frontend with npm start.

## Install Commands

From repo root:

```bash
npm install
```

From functions:

```bash
cd functions
npm install
cd ..
```

## Environment Setup

- Keep client-side values in your local env file.
- Keep server secrets out of client env files.
- Use Firebase Functions config or Secret Manager for server-side secrets.

## Firebase Setup

```bash
firebase login
firebase use <project-id>
firebase deploy --only firestore:rules,firestore:indexes
```

## Run

Frontend:

```bash
npm start
```

Functions emulator (optional):

```bash
cd functions
npm run serve
```

## Common Failure Points

- OAuth callback mismatch: check authorized domains and redirect URIs.
- Firestore query and index errors: create missing composite indexes.
- Payment flow failures: verify server-side secret config, not client env.

## Public Repo Rules

- Never commit real secrets.
- Keep local env files out of source control.
- If any secret was exposed before, rotate it before production use.

1. Install prerequisites:
   - Node.js 18+
   - Firebase CLI
   - A Firebase project with Auth, Firestore, and Functions enabled
2. Install dependencies in root and functions folders.
3. Copy .env.example and set local values.
4. Run frontend with npm start.
## Install Commands

From repo root:
```bash
npm install
```
From functions:

```bash
cd functions
npm install
cd ..
```
## Environment Setup

- Keep client-side values in your local env file.
- Keep server secrets out of client env files.
- Use Firebase Functions config or Secret Manager for server-side secrets.
## Firebase Setup

```bash
firebase login
firebase use <project-id>
firebase deploy --only firestore:rules,firestore:indexes
```
## Run

Frontend:

```bash
npm start
```
Functions emulator (optional):

```bash
cd functions
npm run serve
```
## Common Failure Points

- OAuth callback mismatch: check authorized domains and redirect URIs.
- Firestore query and index errors: create missing composite indexes.
- Payment flow failures: verify server-side secret config, not client env.
## Public Repo Rules

- Never commit real secrets.
- Keep local env files out of source control.
- If any secret was exposed before, rotate it before production use.
# Setup Guide (Local Development)

This repo is public-safe by design. Real credentials are intentionally excluded.

## Fast Start

1. Install prerequisites:
   - Node.js 18+
   - Firebase CLI
   - A Firebase project with Auth, Firestore, and Functions enabled
2. Install dependencies in root and functions folders.
3. Copy .env.example and set local values.
4. Run frontend with npm start.

## Install Commands

From repo root:

```bash
npm install
```

From functions:

```bash
cd functions
npm install
cd ..
```

## Environment Setup

- Keep client-side values in your local env file.
- Keep server secrets out of client env files.
- Use Firebase Functions config or Secret Manager for server-side secrets.

## Firebase Setup

```bash
firebase login
firebase use <project-id>
firebase deploy --only firestore:rules,firestore:indexes
```

## Run

Frontend:

```bash
npm start
```

Functions emulator (optional):

```bash
cd functions
npm run serve
```

## Common Failure Points

- OAuth callback mismatch: check authorized domains and redirect URIs.
- Firestore query and index errors: create missing composite indexes.
- Payment flow failures: verify server-side secret config, not client env.

## Public Repo Rules

- Never commit real secrets.
- Keep local env files out of source control.
- If any secret was exposed before, rotate it before production use.

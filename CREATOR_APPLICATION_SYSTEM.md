# Creator Application Review System

This system replaced ad hoc creator onboarding with a review workflow the admin team can actually manage.

Before this flow existed, creator access decisions were scattered across messages and manual checks. The current implementation centralizes submissions, status tracking, and reviewer notes.

## What It Does

- Gives users a dedicated application flow at /become-creator
- Stores each application in Firestore with a clear lifecycle
- Gives admins a review surface at /admin/creator-applications
- Supports approve and reject decisions with notes and reviewer metadata

## Data Model

Applications are stored in creatorApplications with fields like:

- user identity fields (uid, email, display name)
- reason and creator profile context
- social links and audience details
- status (pending, approved, rejected)
- submittedAt, reviewedAt, reviewedBy, reviewNotes

That structure keeps the process auditable and easy to filter in the admin UI.

## Workflow

1. User submits application.
2. Application is saved with pending status.
3. Admin reviews in dashboard.
4. Admin approves or rejects and leaves notes.
5. Review metadata is recorded for traceability.

## Security And Permissions

- Submissions require authenticated users.
- Review actions require admin privileges.
- Admin status is checked against existing user role fields.

## Where The Code Lives

- Applicant flow: src/pages/BecomeCreator.js
- Admin review page: src/pages/AdminCreatorApplications.js
- Route registration: src/App.js
- Admin entry point: src/pages/AdminDashboard.js

## Why This Matters

This system reduced ambiguity in creator onboarding and made moderation decisions easier to audit.

It also set up the platform for future automation, like auto-provisioning creator features after approval.

## Next Improvements

- Send status-change notifications to applicants
- Add review queues and assignment for larger teams
- Add lightweight analytics on approval rates and turnaround time

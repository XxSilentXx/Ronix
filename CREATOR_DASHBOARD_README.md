# Creator Dashboard System

The creator dashboard gives approved creators a clear view of referral performance, earnings, and payout history.

The goal was straightforward: creators should not need admin support just to understand how their codes are performing.

## What It Includes

- Creator-only dashboard at /creator-dashboard
- Key metrics: pending earnings, total earnings, referred users, active codes
- Code-level breakdowns: usage, payout rate, generated revenue
- Payout history with dates and status context

## Access Model

Access is based on creator eligibility from referral data.

- Eligible creators see Creator Dashboard in navigation
- Non-creators are routed toward become-creator flow
- Direct access attempts by non-creators are blocked

## Data Dependencies

The dashboard relies on existing referral backend logic, especially the callable that returns creator dashboard state and payout totals.

That keeps business logic centralized in backend functions while the page stays focused on presentation and interaction.

## File Map

- Dashboard page: src/pages/CreatorDashboard.js
- Application page: src/pages/BecomeCreator.js
- Navigation logic: src/components/Navbar.js
- Routes: src/App.js

## Practical Test Checklist

1. Creator account sees dashboard navigation and valid metrics.
2. Non-creator account sees onboarding path, not creator dashboard.
3. Code-level metrics match backend values.
4. Payout history renders without layout breaks on mobile and desktop.

## Next Improvements

- Exportable monthly summaries for creators
- Better payout status explanations in UI
- Creator-side alerts when referral performance spikes or drops

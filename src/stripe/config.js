// Stripe configuration
// Pull from env so no live keys are committed in source.
export const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '';

// This is just for frontend configuration
// IMPORTANT: Your Stripe secret key should NEVER be included in client-side code
// It should only be used in a secure server environment

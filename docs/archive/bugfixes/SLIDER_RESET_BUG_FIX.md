# Slider Reset Bug Fix

## Problem
When trying to set the sponsorship slider to 100% sponsor / 0% member (meaning the sponsor keeps all winnings), the slider would reset back to 70% sponsor / 30% member, preventing users from selecting the 100%/0% split.

## Root Cause
The issue was in the `SponsorshipModal.js` component on line 472:

```javascript
const sponsoredShare = sponsorship?.sponsoredShare || SPONSORSHIP_RULES.DEFAULT_SPONSORED_SHARE;
```

### The Problem with Logical OR (`||`)
- When `sponsoredShare` is `0` (meaning the sponsored player gets 0% of winnings)
- JavaScript treats `0` as a **falsy** value
- The `||` operator sees `0` as false and falls back to the default value
- `SPONSORSHIP_RULES.DEFAULT_SPONSORED_SHARE` is `30`
- So `0 || 30` evaluates to `30`, resetting the slider

### JavaScript Falsy Values
These values are considered falsy in JavaScript:
- `false`
- `0` ← **This was our problem**
- `-0`
- `0n` (BigInt)
- `""` (empty string)
- `null`
- `undefined`
- `NaN`

## Solution
Changed from logical OR (`||`) to nullish coalescing (`??`):

```javascript
// Before (buggy)
const sponsoredShare = sponsorship?.sponsoredShare || SPONSORSHIP_RULES.DEFAULT_SPONSORED_SHARE;

// After (fixed)
const sponsoredShare = sponsorship?.sponsoredShare ?? SPONSORSHIP_RULES.DEFAULT_SPONSORED_SHARE;
```

### How Nullish Coalescing (`??`) Works
- Only falls back to the default when the value is `null` or `undefined`
- Does **NOT** treat `0`, `false`, or `""` as reasons to use the default
- Perfect for cases where `0` is a valid value

### Examples
```javascript
// Logical OR (||) - BUGGY
0 || 30        // Returns 30 
false || 30    // Returns 30
"" || 30       // Returns 30
null || 30     // Returns 30
undefined || 30 // Returns 30

// Nullish coalescing (??) - CORRECT
0 ?? 30        // Returns 0 
false ?? 30    // Returns false 
"" ?? 30       // Returns "" 
null ?? 30     // Returns 30 
undefined ?? 30 // Returns 30 
```

## Files Modified
- `src/components/SponsorshipModal.js` - Line 472

## Testing
To verify the fix:

1. **Create a party** with a member who needs sponsorship
2. **Open sponsorship modal** during wager creation
3. **Enable sponsorship** for the member
4. **Move slider to 0%** for the sponsored member (100% for sponsor)
5. **Verify**: Slider stays at 0% and doesn't reset to 30%

## Impact
-  **Fixed**: Slider now allows 100% sponsor / 0% member splits
-  **Maintained**: All other slider functionality works correctly
-  **Improved**: More precise value handling throughout the component
-  **Future-proof**: Prevents similar issues with other falsy values

## Related Concepts
This is a common JavaScript gotcha that affects many applications. The nullish coalescing operator (`??`) was introduced in ES2020 specifically to solve this type of problem where `0`, `false`, or empty strings are valid values that shouldn't trigger fallbacks. 
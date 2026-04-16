# Rank Images Directory

This directory contains the rank badge images that appear next to user names throughout the application.

## Required Image Files

Place your custom rank images in this directory with these exact filenames:

- `bronze.png` - Bronze tier rank image
- `silver.png` - Silver tier rank image  
- `gold.png` - Gold tier rank image
- `platinum.png` - Platinum tier rank image
- `diamond.png` - Diamond tier rank image
- `master.png` - Master tier rank image

## Image Specifications

**Recommended Image Properties:**
- Format: PNG (supports transparency)
- Size: 64x64 pixels or larger (will be scaled down)
- Aspect Ratio: 1:1 (square) works best
- Background: Transparent preferred
- Style: High contrast, easily recognizable at small sizes

## Fallback System

If custom images are not provided or fail to load, the system will automatically fall back to colored circular badges with tier abbreviations:

- **Bronze**: BR (Bronze color)
- **Silver**: SI (Silver color)  
- **Gold**: GO (Gold color)
- **Platinum**: PL (Platinum color)
- **Diamond**: DI (Diamond color)
- **Master**: MA (Orange/Red color)

## Integration

The RankBadge component automatically:
- Detects user's current tier from their XP/level
- Loads the appropriate custom image
- Falls back to styled badges if images aren't available
- Shows tier and level information on hover
- Scales appropriately for different contexts

## Usage Examples

The rank badges will automatically appear in:
- User search results
- Leaderboards  
- Chat messages
- User profiles
- Any component that displays user names

You can customize the appearance by modifying the `RankBadge` component in `src/components/RankBadge.js`. 
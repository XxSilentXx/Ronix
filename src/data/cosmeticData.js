// Cosmetic data structure for the cosmetic system
const cosmeticData = {
  "cosmetics": {
    "nameplates": [
      {
        "id": "nameplate_fire",
        "name": "Flaming Frame",
        "type": "nameplate",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "crate_rare",
        "availableInShop": true,
        "price": 1.50,
        "description": "A fiery border that pulses with orange and red flames around your nameplate.",
        "effects": {
          "borderColor": "#ff4500",
          "glowColor": "#ff6b35",
          "animation": "flame-pulse",
          "intensity": "high",
          "borderWidth": "3px",
          "borderStyle": "solid"
        }
      },
      {
        "id": "nameplate_neon",
        "name": "Neon Glow",
        "type": "nameplate",
        "rarity": "rare",
        "icon": "",
        "asset": null,
        "unlockMethod": "wagerpass_tier10",
        "availableInShop": false,
        "price": 0,
        "description": "A sleek neon border with electric blue edges that pulse rhythmically.",
        "effects": {
          "borderColor": "#00bfff",
          "glowColor": "#4facfe",
          "animation": "neon-pulse",
          "intensity": "medium",
          "borderWidth": "2px",
          "borderStyle": "solid"
        }
      },
      {
        "id": "nameplate_gold",
        "name": "Golden Crown",
        "type": "nameplate",
        "rarity": "legendary",
        "icon": "",
        "asset": null,
        "unlockMethod": "leaderboard_top10",
        "availableInShop": false,
        "price": 0,
        "description": "An exclusive golden frame reserved ONLY for the top 10 players on the earnings leaderboard. Cannot be purchased - must be earned through skill!",
        "effects": {
          "borderColor": "#ffd700",
          "glowColor": "#ffed4e",
          "animation": "gold-shimmer",
          "intensity": "very-high",
          "borderWidth": "4px",
          "borderStyle": "double"
        }
      },
      {
        "id": "nameplate_ice",
        "name": "Frozen Edge",
        "type": "nameplate",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": false,
        "price": 0,
        "description": "Crystalline ice formations frame your name with a cool blue glow.",
        "effects": {
          "borderColor": "#87ceeb",
          "glowColor": "#b0e0e6",
          "animation": "ice-crystal",
          "intensity": "high",
          "borderWidth": "3px",
          "borderStyle": "dashed"
        }
      },
      {
        "id": "nameplate_rainbow",
        "name": "Prismatic Aura",
        "type": "nameplate",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 2.99,
        "description": "A stunning rainbow effect that cycles through all colors of the spectrum with a magical shimmer.",
        "effects": {
          "borderColor": "#ff00ff",
          "glowColor": "#00ffff",
          "animation": "rainbow-cycle",
          "intensity": "very-high",
          "borderWidth": "3px",
          "borderStyle": "solid"
        }
      },
      {
        "id": "nameplate_shadow",
        "name": "Shadow Wraith",
        "type": "nameplate",
        "rarity": "legendary",
        "icon": "",
        "asset": null,
        "unlockMethod": "crate_rare",
        "availableInShop": false,
        "price": 0,
        "description": "Dark energy swirls around your nameplate with an ominous purple-black aura that seems to absorb light.",
        "effects": {
          "borderColor": "#4b0082",
          "glowColor": "#2e1065",
          "animation": "shadow-pulse",
          "intensity": "very-high",
          "borderWidth": "4px",
          "borderStyle": "solid"
        }
      },
      {
        "id": "nameplate_electric",
        "name": "Lightning Storm",
        "type": "nameplate",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "achievement_hotstreak",
        "availableInShop": false,
        "price": 0,
        "description": "Electric bolts crackle around your nameplate with intense yellow-white lightning effects. Unlocked with a 10 win streak.",
        "effects": {
          "borderColor": "#ffff00",
          "glowColor": "#ffffff",
          "animation": "lightning-crackle",
          "intensity": "extreme",
          "borderWidth": "2px",
          "borderStyle": "solid"
        }
      },
      {
        "id": "nameplate_cosmic",
        "name": "Starfield",
        "type": "nameplate",
        "rarity": "legendary",
        "icon": "",
        "asset": null,
        "unlockMethod": "achievement_top_1_percent",
        "availableInShop": false,
        "price": 0,
        "description": "Twinkling stars and cosmic dust dance around your nameplate. Reserved for top 1% weekly earners.",
        "effects": {
          "borderColor": "#9932cc",
          "glowColor": "#ffd700",
          "animation": "cosmic-sparkle",
          "intensity": "very-high",
          "borderWidth": "3px",
          "borderStyle": "dotted"
        }
      },
      {
        "id": "nameplate_lava",
        "name": "Molten Core",
        "type": "nameplate",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 2.49,
        "description": "Molten lava bubbles and flows around the edges with intense red-orange heat effects.",
        "effects": {
          "borderColor": "#ff4500",
          "glowColor": "#ff8c00",
          "animation": "lava-bubble",
          "intensity": "high",
          "borderWidth": "4px",
          "borderStyle": "ridge"
        }
      },
      {
        "id": "nameplate_toxic",
        "name": "Toxic Waste",
        "type": "nameplate",
        "rarity": "rare",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 1.79,
        "description": "Radioactive green energy pulses with a dangerous toxic glow and bubbling effects.",
        "effects": {
          "borderColor": "#00ff00",
          "glowColor": "#32cd32",
          "animation": "toxic-pulse",
          "intensity": "high",
          "borderWidth": "3px",
          "borderStyle": "solid"
        }
      },
      {
        "id": "nameplate_crystal",
        "name": "Crystal Matrix",
        "type": "nameplate",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "achievement_50_coins",
        "availableInShop": false,
        "price": 0,
        "description": "Prismatic crystal formations create geometric patterns with brilliant multi-colored refractions.",
        "effects": {
          "borderColor": "#add8e6",
          "glowColor": "#87ceeb",
          "animation": "crystal-refract",
          "intensity": "very-high",
          "borderWidth": "3px",
          "borderStyle": "double"
        }
      },
      {
        "id": "nameplate_phoenix",
        "name": "Phoenix Flame",
        "type": "nameplate",
        "rarity": "mythic",
        "icon": "",
        "asset": null,
        "unlockMethod": "leaderboard_top3",
        "availableInShop": false,
        "price": 0,
        "description": "Legendary phoenix flames with golden-orange fire that seems to rise and regenerate. Top 3 exclusive.",
        "effects": {
          "borderColor": "#ff6347",
          "glowColor": "#ffd700",
          "animation": "phoenix-rise",
          "intensity": "extreme",
          "borderWidth": "4px",
          "borderStyle": "groove"
        }
      },
      {
        "id": "nameplate_void",
        "name": "Void Walker",
        "type": "nameplate",
        "rarity": "legendary",
        "icon": "",
        "asset": null,
        "unlockMethod": "battle pass completion",
        "availableInShop": false,
        "price": 0,
        "description": "Dark void energy with swirling portal effects. For players who've completed the battle pass.",
        "effects": {
          "borderColor": "#191970",
          "glowColor": "#4b0082",
          "animation": "void-swirl",
          "intensity": "extreme",
          "borderWidth": "5px",
          "borderStyle": "inset"
        }
      },
      {
        "id": "nameplate_plasma",
        "name": "Plasma Field",
        "type": "nameplate",
        "rarity": "rare",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 1.99,
        "description": "High-energy plasma with electric blue-purple energy that crackles and flows.",
        "effects": {
          "borderColor": "#8a2be2",
          "glowColor": "#00bfff",
          "animation": "plasma-flow",
          "intensity": "high",
          "borderWidth": "2px",
          "borderStyle": "solid"
        }
      },
      {
        "id": "nameplate_sakura",
        "name": "Cherry Blossom",
        "type": "nameplate",
        "rarity": "rare",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 1.69,
        "description": "Gentle pink petals float around your nameplate with a soft, peaceful spring aesthetic.",
        "effects": {
          "borderColor": "#ffb6c1",
          "glowColor": "#ffc0cb",
          "animation": "petal-drift",
          "intensity": "medium",
          "borderWidth": "2px",
          "borderStyle": "solid"
        }
      },
      {
        "id": "nameplate_matrix",
        "name": "Digital Rain",
        "type": "nameplate",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "achievement_25_snipes",
        "availableInShop": false,
        "price": 0,
        "description": "Green digital code rain falls around your nameplate. Matrix-style effect for precision players.",
        "effects": {
          "borderColor": "#00ff41",
          "glowColor": "#00cc33",
          "animation": "matrix-rain",
          "intensity": "high",
          "borderWidth": "2px",
          "borderStyle": "solid"
        }
      },
      {
        "id": "nameplate_glacier",
        "name": "Glacial Frost",
        "type": "nameplate",
        "rarity": "rare",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 1.49,
        "description": "Slow-moving ice crystals and frost patterns create a serene winter atmosphere.",
        "effects": {
          "borderColor": "#b0e0e6",
          "glowColor": "#e0ffff",
          "animation": "frost-spread",
          "intensity": "medium",
          "borderWidth": "3px",
          "borderStyle": "ridge"
        }
      }
    ],
    "profiles": [
      {
        "id": "profile_darkmatter",
        "name": "Dark Matter",
        "type": "profile",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "crate_legendary",
        "availableInShop": true,
        "price": 2.99,
        "description": "A mysterious cosmic background with swirling dark matter and distant stars.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)",
          "particleEffect": "cosmic-dust",
          "overlayPattern": "stars",
          "animation": "cosmic-drift"
        }
      },
      {
        "id": "profile_cyberpunk",
        "name": "Cyber Grid",
        "type": "profile",
        "rarity": "rare",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 1.99,
        "description": "Neon grid lines and holographic elements create a futuristic cyberpunk aesthetic.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(15, 52, 96, 0.85) 0%, rgba(233, 69, 96, 0.75) 100%)",
          "particleEffect": "digital-rain",
          "overlayPattern": "grid-lines",
          "animation": "cyber-pulse"
        }
      },
      {
        "id": "profile_candy",
        "name": "Candy Glow",
        "type": "profile",
        "rarity": "rare",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 1.49,
        "description": "Sweet pastel colors with a soft, dreamy glow perfect for a playful vibe.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(255, 154, 158, 0.7) 0%, rgba(254, 207, 239, 0.8) 50%, rgba(254, 207, 239, 0.8) 100%)",
          "particleEffect": "floating-hearts",
          "overlayPattern": "soft-clouds",
          "animation": "candy-float"
        }
      },
      {
        "id": "profile_champion",
        "name": "Champion's Glory",
        "type": "profile",
        "rarity": "legendary",
        "icon": "",
        "asset": null,
        "unlockMethod": "leaderboard_top3",
        "availableInShop": false,
        "price": 0,
        "description": "An exclusive golden background with trophy elements for top 3 players.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(255, 215, 0, 0.6) 0%, rgba(255, 237, 78, 0.7) 50%, rgba(255, 165, 0, 0.65) 100%)",
          "particleEffect": "golden-sparkles",
          "overlayPattern": "trophy-silhouettes",
          "animation": "champion-glow"
        }
      },
      {
        "id": "profile_neon_city",
        "name": "Neon Cityscape",
        "type": "profile",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 3.49,
        "description": "A vibrant cyberpunk cityscape with neon lights and towering skyscrapers at night.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(13, 13, 40, 0.9) 0%, rgba(25, 25, 112, 0.8) 30%, rgba(255, 20, 147, 0.6) 70%, rgba(0, 255, 255, 0.7) 100%)",
          "particleEffect": "neon-sparks",
          "overlayPattern": "city-silhouette",
          "animation": "neon-pulse"
        }
      },
      {
        "id": "profile_forest",
        "name": "Mystic Forest",
        "type": "profile",
        "rarity": "rare",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 2.29,
        "description": "A peaceful forest with ancient trees, soft sunlight filtering through leaves, and magical atmosphere.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(34, 139, 34, 0.8) 0%, rgba(0, 100, 0, 0.9) 30%, rgba(255, 255, 0, 0.3) 70%, rgba(50, 205, 50, 0.7) 100%)",
          "particleEffect": "floating-leaves",
          "overlayPattern": "tree-shadows",
          "animation": "nature-sway"
        }
      },
      {
        "id": "profile_ocean",
        "name": "Deep Ocean",
        "type": "profile",
        "rarity": "rare",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 2.19,
        "description": "Dive into the mysterious depths of the ocean with flowing water and marine life silhouettes.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(0, 31, 63, 0.9) 0%, rgba(0, 116, 217, 0.8) 40%, rgba(127, 219, 255, 0.6) 80%, rgba(58, 134, 255, 0.7) 100%)",
          "particleEffect": "floating-bubbles",
          "overlayPattern": "wave-ripples",
          "animation": "ocean-flow"
        }
      },
      {
        "id": "profile_volcano",
        "name": "Volcanic Eruption",
        "type": "profile",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 3.79,
        "description": "Intense volcanic landscape with flowing lava and ash clouds. Powerful and dramatic volcanic theme.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(139, 0, 0, 0.9) 0%, rgba(255, 69, 0, 0.8) 30%, rgba(255, 140, 0, 0.7) 60%, rgba(255, 215, 0, 0.6) 100%)",
          "particleEffect": "lava-sparks",
          "overlayPattern": "volcano-silhouette",
          "animation": "volcanic-eruption"
        }
      },
      {
        "id": "profile_arctic",
        "name": "Arctic Tundra",
        "type": "profile",
        "rarity": "rare",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 1.99,
        "description": "Frozen arctic landscape with snow-covered mountains and northern lights dancing in the sky.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(176, 224, 230, 0.8) 0%, rgba(135, 206, 235, 0.7) 30%, rgba(0, 191, 255, 0.6) 60%, rgba(224, 255, 255, 0.8) 100%)",
          "particleEffect": "snowfall",
          "overlayPattern": "mountain-range",
          "animation": "aurora-dance"
        }
      },
      {
        "id": "profile_desert",
        "name": "Desert Mirage",
        "type": "profile",
        "rarity": "rare",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 2.09,
        "description": "Hot desert sands with heat waves and ancient pyramid silhouettes in the distance.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(255, 218, 185, 0.8) 0%, rgba(255, 160, 122, 0.7) 30%, rgba(255, 69, 0, 0.6) 60%, rgba(255, 215, 0, 0.5) 100%)",
          "particleEffect": "sand-particles",
          "overlayPattern": "dune-silhouettes",
          "animation": "heat-shimmer"
        }
      },
      {
        "id": "profile_space",
        "name": "Cosmic Nebula",
        "type": "profile",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 4.29,
        "description": "Journey through a stunning nebula with swirling cosmic gas and distant galaxies. Premium space theme.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(25, 25, 112, 0.9) 0%, rgba(138, 43, 226, 0.8) 25%, rgba(255, 20, 147, 0.7) 50%, rgba(0, 0, 139, 0.8) 75%, rgba(72, 61, 139, 0.9) 100%)",
          "particleEffect": "cosmic-dust",
          "overlayPattern": "nebula-swirls",
          "animation": "cosmic-drift"
        }
      },
      {
        "id": "profile_matrix",
        "name": "Digital Matrix",
        "type": "profile",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 3.89,
        "description": "Enter the digital realm with cascading green code and matrix-style effects. Perfect for tech enthusiasts.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 17, 0, 0.9) 30%, rgba(0, 51, 0, 0.8) 60%, rgba(0, 85, 0, 0.7) 100%)",
          "particleEffect": "digital-rain",
          "overlayPattern": "code-streams",
          "animation": "matrix-cascade"
        }
      },
      {
        "id": "profile_rainbow",
        "name": "Prismatic Dreams",
        "type": "profile",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 3.99,
        "description": "A mesmerizing rainbow backdrop that shifts through all colors with dreamlike transitions.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(255, 0, 0, 0.6) 0%, rgba(255, 127, 0, 0.6) 16%, rgba(255, 255, 0, 0.6) 33%, rgba(0, 255, 0, 0.6) 50%, rgba(0, 0, 255, 0.6) 66%, rgba(139, 0, 255, 0.6) 83%, rgba(255, 0, 255, 0.6) 100%)",
          "particleEffect": "rainbow-sparkles",
          "overlayPattern": "prism-light",
          "animation": "rainbow-cycle"
        }
      },
      {
        "id": "profile_sakura",
        "name": "Cherry Blossom Garden",
        "type": "profile",
        "rarity": "rare",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 2.49,
        "description": "Peaceful Japanese garden with blooming cherry trees and falling petals in soft spring colors.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(255, 182, 193, 0.7) 0%, rgba(255, 192, 203, 0.8) 30%, rgba(255, 228, 225, 0.6) 60%, rgba(255, 240, 245, 0.7) 100%)",
          "particleEffect": "cherry-petals",
          "overlayPattern": "branch-silhouettes",
          "animation": "petal-fall"
        }
      },
      {
        "id": "profile_steampunk",
        "name": "Steampunk Workshop",
        "type": "profile",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 3.29,
        "description": "Victorian-era workshop with brass gears, steam pipes, and clockwork mechanisms.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(139, 69, 19, 0.8) 0%, rgba(160, 82, 45, 0.7) 30%, rgba(205, 133, 63, 0.6) 60%, rgba(218, 165, 32, 0.5) 100%)",
          "particleEffect": "steam-wisps",
          "overlayPattern": "gear-mechanisms",
          "animation": "clockwork-tick"
        }
      },
      {
        "id": "profile_lightning",
        "name": "Storm's Eye",
        "type": "profile",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 3.69,
        "description": "Center of a powerful thunderstorm with lightning bolts and swirling storm clouds. Electrifying theme.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(47, 79, 79, 0.9) 0%, rgba(105, 105, 105, 0.8) 30%, rgba(25, 25, 112, 0.7) 60%, rgba(72, 61, 139, 0.8) 100%)",
          "particleEffect": "lightning-bolts",
          "overlayPattern": "storm-clouds",
          "animation": "thunder-flash"
        }
      },
      {
        "id": "profile_void",
        "name": "Void Portal",
        "type": "profile",
        "rarity": "legendary",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 5.49,
        "description": "A swirling portal to the void with dark energy and mysterious cosmic forces. Premium mysterious theme.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(25, 25, 112, 0.8) 30%, rgba(75, 0, 130, 0.7) 60%, rgba(139, 0, 139, 0.6) 100%)",
          "particleEffect": "void-wisps",
          "overlayPattern": "portal-rings",
          "animation": "void-swirl"
        }
      },
      {
        "id": "profile_crystal",
        "name": "Crystal Cavern",
        "type": "profile",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 3.59,
        "description": "Magical underground cavern filled with glowing crystals and prismatic light reflections.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(75, 0, 130, 0.8) 0%, rgba(138, 43, 226, 0.7) 30%, rgba(186, 85, 211, 0.6) 60%, rgba(221, 160, 221, 0.5) 100%)",
          "particleEffect": "crystal-shards",
          "overlayPattern": "cave-formations",
          "animation": "crystal-gleam"
        }
      },
      {
        "id": "profile_sunset",
        "name": "Golden Sunset",
        "type": "profile",
        "rarity": "rare",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 1.89,
        "description": "Beautiful sunset over rolling hills with warm golden and orange hues painting the sky.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(255, 69, 0, 0.7) 0%, rgba(255, 140, 0, 0.8) 30%, rgba(255, 215, 0, 0.6) 60%, rgba(255, 228, 196, 0.5) 100%)",
          "particleEffect": "light-rays",
          "overlayPattern": "hill-silhouettes",
          "animation": "sunset-glow"
        }
      },
      {
        "id": "profile_toxic",
        "name": "Toxic Wasteland",
        "type": "profile",
        "rarity": "rare",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 2.39,
        "description": "Post-apocalyptic wasteland with radioactive green fog and industrial ruins.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(34, 139, 34, 0.8) 0%, rgba(0, 100, 0, 0.9) 30%, rgba(173, 255, 47, 0.6) 60%, rgba(50, 205, 50, 0.7) 100%)",
          "particleEffect": "radioactive-particles",
          "overlayPattern": "industrial-ruins",
          "animation": "toxic-pulse"
        }
      },
      {
        "id": "profile_phoenix",
        "name": "Phoenix Rising",
        "type": "profile",
        "rarity": "mythic",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 6.99,
        "description": "The legendary phoenix rising from ashes in a blaze of glory. Premium mythic theme with stunning effects.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(220, 20, 60, 0.9) 0%, rgba(255, 69, 0, 0.8) 25%, rgba(255, 140, 0, 0.7) 50%, rgba(255, 215, 0, 0.8) 75%, rgba(255, 255, 255, 0.6) 100%)",
          "particleEffect": "phoenix-flames",
          "overlayPattern": "phoenix-silhouette",
          "animation": "phoenix-rebirth"
        }
      },
      {
        "id": "profile_galaxy",
        "name": "Spiral Galaxy",
        "type": "profile",
        "rarity": "legendary",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 4.99,
        "description": "A magnificent spiral galaxy with billions of stars rotating in cosmic harmony. Premium galactic theme.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(25, 25, 112, 0.8) 20%, rgba(72, 61, 139, 0.7) 40%, rgba(138, 43, 226, 0.6) 60%, rgba(147, 0, 211, 0.7) 80%, rgba(75, 0, 130, 0.8) 100%)",
          "particleEffect": "star-clusters",
          "overlayPattern": "spiral-arms",
          "animation": "galactic-rotation"
        }
      }
    ],
    "callingCards": [
      {
        "id": "card_royal_decree",
        "name": "Royal Decree",
        "type": "callingCard",
        "rarity": "mythic",
        "icon": "",
        "asset": null,
        "unlockMethod": "achievement_rank_1",
        "availableInShop": false,
        "price": 0,
        "description": "The ultimate calling card reserved for the #1 player on the leaderboard. True royalty.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, #4B0082 0%, #8A2BE2 50%, #9932CC 100%)",
          "borderColor": "#FFD700",
          "textColor": "#FFD700",
          "iconColor": "#FF61E6",
          "animation": "royal-majesty",
          "pattern": "royal-crest"
        }
      },
      {
        "id": "card_phoenix_rising",
        "name": "Phoenix Rising",
        "type": "callingCard",
        "rarity": "mythic",
        "icon": "",
        "asset": null,
        "unlockMethod": "achievement_10_wins",
        "availableInShop": false,
        "price": 0,
        "description": "Rise from the ashes like a phoenix. Earned by achieving 10 total token wins.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(255, 69, 0, 0.8) 0%, rgba(255, 99, 71, 0.75) 30%, rgba(255, 215, 0, 0.7) 70%, rgba(255, 165, 0, 0.8) 100%)",
          "borderColor": "rgba(255, 0, 0, 0.8)",
          "textColor": "#FFFFFF",
          "iconColor": "rgba(255, 215, 0, 0.9)",
          "animation": "phoenix-flame",
          "pattern": "flame-wings"
        }
      },
      {
        "id": "card_champions_honor",
        "name": "Champion's Honor",
        "type": "callingCard",
        "rarity": "legendary",
        "icon": "",
        "asset": null,
        "unlockMethod": "achievement_top_10",
        "availableInShop": false,
        "price": 0,
        "description": "An exclusive calling card for top 10 leaderboard players showing their champion status.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(255, 215, 0, 0.75) 0%, rgba(255, 165, 0, 0.8) 50%, rgba(255, 140, 0, 0.85) 100%)",
          "borderColor": "#8B4513",
          "textColor": "#2C1810",
          "iconColor": "#654321",
          "animation": "champion-shine",
          "pattern": "trophy-crown"
        }
      },
      {
        "id": "card_snipers_mark",
        "name": "Sniper's Mark",
        "type": "callingCard",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "achievement_25_snipes",
        "availableInShop": false,
        "price": 0,
        "description": "Successfully hit 25 Snipes. Represents precision play and tactical mastery.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, #2C3E50 0%, #34495E 30%, #9B59B6 70%, #8E44AD 100%)",
          "borderColor": "#F1C40F",
          "textColor": "#ECF0F1",
          "iconColor": "#F39C12",
          "animation": "lightning-strike",
          "pattern": "electric-bolts"
        }
      },
      {
        "id": "card_high_roller",
        "name": "High Roller",
        "type": "callingCard",
        "rarity": "legendary",
        "icon": "",
        "asset": "token-logo.png",
        "unlockMethod": "achievement_high_roller",
        "availableInShop": false,
        "price": 0,
        "description": "Win 10 matches of 5+ coins. Big money success badge for the elite players.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(139, 0, 0, 0.85) 0%, rgba(255, 69, 0, 0.7) 50%, rgba(255, 215, 0, 0.6) 100%)",
          "borderColor": "rgba(255, 99, 71, 0.8)",
          "textColor": "#FFFFFF",
          "iconColor": "rgba(255, 215, 0, 0.9)",
          "animation": "flame-burst",
          "pattern": "dragon-scales"
        }
      },
      {
        "id": "card_unbreakable",
        "name": "Unbreakable",
        "type": "callingCard",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "achievement_unbreakable",
        "availableInShop": false,
        "price": 0,
        "description": "Go 5-0 in 1v1 matches without Wager Insurance. 'No crutches' flex for the fearless.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, #87CEEB 0%, #4682B4 50%, #1E90FF 100%)",
          "borderColor": "#B0E0E6",
          "textColor": "#FFFFFF",
          "iconColor": "#87CEEB",
          "animation": "ice-crystal",
          "pattern": "snowflakes"
        }
      },
      {
        "id": "card_veterans_edge",
        "name": "Veteran's Edge",
        "type": "callingCard",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "achievement_100_wagers",
        "availableInShop": false,
        "price": 0,
        "description": "Play at least 100 total matches. Long-term play reward for dedicated veterans.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #B22222 100%)",
          "borderColor": "#FFD700",
          "textColor": "#FFFFFF",
          "iconColor": "#FFD700",
          "animation": "battle-glow",
          "pattern": "crossed-swords"
        }
      },
      {
        "id": "card_coin_collector",
        "name": "Coin Collector",
        "type": "callingCard",
        "rarity": "rare",
        "icon": "",
        "asset": "token-logo.png",
        "unlockMethod": "achievement_50_coins",
        "availableInShop": false,
        "price": 0,
        "description": "Earn 50 total coins from matches. Lifetime grind track for consistent earners.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(255, 127, 80, 0.8) 0%, rgba(255, 99, 71, 0.75) 30%, rgba(255, 215, 0, 0.7) 70%, rgba(255, 165, 0, 0.8) 100%)",
          "borderColor": "rgba(255, 69, 0, 0.8)",
          "textColor": "#8B0000",
          "iconColor": "rgba(255, 99, 71, 0.9)",
          "animation": "sunset-glow",
          "pattern": "sun-rays"
        }
      },
      {
        "id": "card_tycoon",
        "name": "Tycoon",
        "type": "callingCard",
        "rarity": "legendary",
        "icon": "",
        "asset": null,
        "unlockMethod": "achievement_200_coins",
        "availableInShop": false,
        "price": 0,
        "description": "Earn 200+ total coins. Premium badge for the most successful players.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(15, 52, 96, 0.9) 0%, rgba(233, 69, 96, 0.7) 50%, rgba(83, 58, 123, 0.85) 100%)",
          "borderColor": "rgba(0, 255, 255, 0.8)",
          "textColor": "rgba(0, 255, 255, 0.9)",
          "iconColor": "rgba(255, 20, 147, 0.8)",
          "animation": "cyber-pulse",
          "pattern": "circuit-lines"
        }
      },
      {
        "id": "card_one_percent",
        "name": "One Percent",
        "type": "callingCard",
        "rarity": "mythic",
        "icon": "",
        "asset": null,
        "unlockMethod": "achievement_top_1_percent",
        "availableInShop": false,
        "price": 0,
        "description": "Top 1% earner this season. Auto-granted, rotated weekly for the elite few.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, #0B0C10 0%, #1F2833 30%, rgba(102, 252, 241, 0.6) 70%, rgba(69, 162, 158, 0.8) 100%)",
          "borderColor": "rgba(102, 252, 241, 0.7)",
          "textColor": "#C5C6C7",
          "iconColor": "rgba(102, 252, 241, 0.8)",
          "animation": "cosmic-drift",
          "pattern": "stars-nebula"
        }
      },
      {
        "id": "card_cyber",
        "name": "Cyber Elite",
        "type": "callingCard",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 2.49,
        "description": "A futuristic calling card with neon circuits and digital effects.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(15, 52, 96, 0.9) 0%, rgba(233, 69, 96, 0.7) 50%, rgba(83, 58, 123, 0.85) 100%)",
          "borderColor": "rgba(0, 255, 255, 0.8)",
          "textColor": "rgba(0, 255, 255, 0.9)",
          "iconColor": "rgba(255, 20, 147, 0.8)",
          "animation": "cyber-pulse",
          "pattern": "circuit-lines"
        }
      },
      {
        "id": "card_neon_vibe",
        "name": "Neon Vibe",
        "type": "callingCard",
        "rarity": "rare",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 1.49,
        "description": "Retro 80s aesthetic with vibrant neon colors and synthwave vibes.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(255, 0, 110, 0.7) 0%, rgba(131, 56, 236, 0.75) 50%, rgba(58, 134, 255, 0.8) 100%)",
          "borderColor": "rgba(255, 190, 11, 0.8)",
          "textColor": "#FFFFFF",
          "iconColor": "rgba(255, 190, 11, 0.9)",
          "animation": "neon-pulse",
          "pattern": "retro-grid"
        }
      },
      {
        "id": "card_ice",
        "name": "Frozen Legacy",
        "type": "callingCard",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 3.49,
        "description": "A crystalline calling card with ice formations and arctic winds.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, #87CEEB 0%, #4682B4 50%, #1E90FF 100%)",
          "borderColor": "#B0E0E6",
          "textColor": "#FFFFFF",
          "iconColor": "#87CEEB",
          "animation": "ice-crystal",
          "pattern": "snowflakes"
        }
      },
      {
        "id": "card_dragon",
        "name": "Dragon's Fury",
        "type": "callingCard",
        "rarity": "legendary",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 5.99,
        "description": "Unleash the power of the dragon with this fierce and intimidating design.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(139, 0, 0, 0.85) 0%, rgba(255, 69, 0, 0.7) 50%, rgba(255, 215, 0, 0.6) 100%)",
          "borderColor": "rgba(255, 99, 71, 0.8)",
          "textColor": "#FFFFFF",
          "iconColor": "rgba(255, 215, 0, 0.9)",
          "animation": "flame-burst",
          "pattern": "dragon-scales"
        }
      },
      {
        "id": "card_sakura",
        "name": "Cherry Blossom",
        "type": "callingCard",
        "rarity": "rare",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 1.79,
        "description": "Peaceful and elegant with falling cherry blossoms and soft pink hues.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(255, 182, 193, 0.75) 0%, rgba(255, 192, 203, 0.8) 50%, rgba(255, 204, 203, 0.8) 100%)",
          "borderColor": "rgba(255, 105, 180, 0.8)",
          "textColor": "#8B008B",
          "iconColor": "rgba(255, 20, 147, 0.9)",
          "animation": "petal-fall",
          "pattern": "cherry-blossoms"
        }
      },
      {
        "id": "card_matrix",
        "name": "Digital Rain",
        "type": "callingCard",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 2.29,
        "description": "Enter the matrix with cascading green code and digital effects.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, #000000 0%, #001100 50%, #003300 100%)",
          "borderColor": "#00FF00",
          "textColor": "#00FF00",
          "iconColor": "#00FF41",
          "animation": "matrix-rain",
          "pattern": "digital-code"
        }
      },
      {
        "id": "card_ocean",
        "name": "Ocean Depths",
        "type": "callingCard",
        "rarity": "rare",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 1.69,
        "description": "Dive into the mysterious depths of the ocean with flowing water effects.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, #001f3f 0%, #0074D9 50%, #7FDBFF 100%)",
          "borderColor": "#39CCCC",
          "textColor": "#FFFFFF",
          "iconColor": "#7FDBFF",
          "animation": "wave-flow",
          "pattern": "water-ripples"
        }
      },
      {
        "id": "card_sunset",
        "name": "Golden Hour",
        "type": "callingCard",
        "rarity": "rare",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 1.59,
        "description": "Capture the beauty of a perfect sunset with warm golden tones.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, rgba(255, 127, 80, 0.8) 0%, rgba(255, 99, 71, 0.75) 30%, rgba(255, 215, 0, 0.7) 70%, rgba(255, 165, 0, 0.8) 100%)",
          "borderColor": "rgba(255, 69, 0, 0.8)",
          "textColor": "#8B0000",
          "iconColor": "rgba(255, 99, 71, 0.9)",
          "animation": "sunset-glow",
          "pattern": "sun-rays"
        }
      },
      {
        "id": "card_stealth",
        "name": "Shadow Operative",
        "type": "callingCard",
        "rarity": "epic",
        "icon": "",
        "asset": "ninja-svgrepo-com.svg",
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 2.39,
        "description": "Move like a shadow with this tactical stealth-themed calling card.",
        "effects": {
          "backgroundColor": "linear-gradient(135deg, #1C1C1C 0%, #2F2F2F 50%, #0D0D0D 100%)",
          "borderColor": "#696969",
          "textColor": "#C0C0C0",
          "iconColor": "#808080",
          "animation": "shadow-fade",
          "pattern": "camo-digital"
        }
      },
      {
        id: "inferno_soldier",
        name: "Inferno Soldier",
        type: "callingCard",
        rarity: "epic",
        icon: "",
        asset: null, // or a logo if you want
        unlockMethod: "shop", // or "achievement_x" if you want it unlockable another way
        availableInShop: true,
        price: 2.99, // set your price
        description: "A masked soldier stands defiant in front of a raging explosion.",
        effects: {
          backgroundColor: "rgba(0,0,0,0.7)",
          borderColor: "#FF5C33",
          textColor: "#FFFFFF",
          iconColor: "#FF5C33",
          image: "/assets/cards/rGasmask.png"
        }
      }
    ],
    "flair": [
      {
        "id": "flair_fire",
        "name": " Fire Badge",
        "type": "flair",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "achievement_10_wins",
        "availableInShop": false,
        "price": 0,
        "description": "Awarded for winning 10 total matches. Shows your dedication and skill!",
        "effects": {
          "emoji": "",
          "color": "#ff4500",
          "animation": "bounce"
        }
      },
      {
        "id": "flair_sniper",
        "name": " Snipe King",
        "type": "flair",
        "rarity": "rare",
        "icon": "",
        "asset": null,
        "unlockMethod": "achievement_precision",
        "availableInShop": false,
        "price": 0,
        "description": "Earned by winning 50+ matches with high precision. Master marksman!",
        "effects": {
          "emoji": "",
          "color": "#4facfe",
          "animation": "pulse"
        }
      },
      {
        "id": "flair_shield",
        "name": " Undefeated",
        "type": "flair",
        "rarity": "legendary",
        "icon": "",
        "asset": null,
        "unlockMethod": "leaderboard_top100",
        "availableInShop": false,
        "price": 0,
        "description": "Exclusive to top 100 leaderboard players. Symbol of elite status.",
        "effects": {
          "emoji": "",
          "color": "#ffd700",
          "animation": "glow"
        }
      },
      {
        "id": "flair_crown",
        "name": " Royalty",
        "type": "flair",
        "rarity": "mythic",
        "icon": "",
        "asset": null,
        "unlockMethod": "leaderboard_top1",
        "availableInShop": false,
        "price": 0,
        "description": "The ultimate flair for the #1 player. True royalty of the leaderboard.",
        "effects": {
          "emoji": "",
          "color": "#ff61e6",
          "animation": "royal-glow"
        }
      },
      {
        "id": "flair_diamond",
        "name": " VIP Elite",
        "type": "flair",
        "rarity": "epic",
        "icon": "",
        "asset": null,
        "unlockMethod": "shop",
        "availableInShop": true,
        "price": 4.99,
        "description": "Premium VIP flair showing your elite status and support.",
        "effects": {
          "emoji": "",
          "color": "#b19cd9",
          "animation": "sparkle"
        }
      }
    ]
  },
  "rarities": {
    "common": {
      "name": "Common",
      "color": "#9e9e9e",
      "borderColor": "#757575",
      "glowIntensity": "low"
    },
    "rare": {
      "name": "Rare",
      "color": "#4facfe",
      "borderColor": "#2196f3",
      "glowIntensity": "medium"
    },
    "epic": {
      "name": "Epic",
      "color": "#9c27b0",
      "borderColor": "#7b1fa2",
      "glowIntensity": "high"
    },
    "legendary": {
      "name": "Legendary",
      "color": "#ff9800",
      "borderColor": "#f57c00",
      "glowIntensity": "very-high"
    },
    "mythic": {
      "name": "Mythic",
      "color": "#ff61e6",
      "borderColor": "#e91e63",
      "glowIntensity": "extreme"
    }
  }
};

// Helper functions for cosmetic data
export const findCosmeticById = (cosmeticId) => {
  const allCosmetics = [
    ...cosmeticData.cosmetics.nameplates,
    ...cosmeticData.cosmetics.profiles,
    ...cosmeticData.cosmetics.callingCards,
    ...cosmeticData.cosmetics.flair
  ];
  return allCosmetics.find(cosmetic => cosmetic.id === cosmeticId);
};

export const getCosmeticsByType = (type) => {
  return cosmeticData.cosmetics[type] || [];
};

export const getCosmeticsByUnlockMethod = (unlockMethod) => {
  const allCosmetics = [
    ...cosmeticData.cosmetics.nameplates,
    ...cosmeticData.cosmetics.profiles,
    ...cosmeticData.cosmetics.callingCards,
    ...cosmeticData.cosmetics.flair
  ];
  return allCosmetics.filter(cosmetic => cosmetic.unlockMethod === unlockMethod);
};

export const getShopCosmetics = () => {
  const allCosmetics = [
    ...cosmeticData.cosmetics.nameplates,
    ...cosmeticData.cosmetics.profiles,
    ...cosmeticData.cosmetics.callingCards,
    ...cosmeticData.cosmetics.flair
  ];
  return allCosmetics.filter(cosmetic => cosmetic.availableInShop);
};

export const getRarityInfo = (rarity) => {
  return cosmeticData.rarities[rarity] || cosmeticData.rarities.common;
};

export default cosmeticData; 
import { getCosmeticsByType } from '../data/cosmeticData';

// List of all animation keyframes we implemented
const implementedAnimations = [
  'cosmic-drift',
  'cyber-pulse', 
  'candy-float',
  'champion-glow',
  'nature-sway',
  'ocean-flow',
  'volcanic-eruption',
  'aurora-dance',
  'heat-shimmer',
  'nebula-swirls',
  'matrix-cascade',
  'rainbow-cycle',
  'petal-fall',
  'clockwork-tick',
  'thunder-flash',
  'void-swirl',
  'crystal-gleam',
  'sunset-glow',
  'toxic-pulse',
  'phoenix-rebirth',
  'galactic-rotation'
];

// Validate all profile animations are working
export const validateAnimations = () => {
  const profiles = getCosmeticsByType('profiles');
  const results = {
    totalProfiles: profiles.length,
    animatedProfiles: 0,
    missingAnimations: [],
    implementedButUnused: [...implementedAnimations],
    validAnimations: [],
    issues: []
  };

  profiles.forEach(profile => {
    const animation = profile.effects?.animation;
    
    if (animation && animation !== 'none') {
      results.animatedProfiles++;
      
      if (implementedAnimations.includes(animation)) {
        results.validAnimations.push({
          id: profile.id,
          name: profile.name,
          animation: animation,
          status: 'valid'
        });
        
        // Remove from unused list
        const index = results.implementedButUnused.indexOf(animation);
        if (index > -1) {
          results.implementedButUnused.splice(index, 1);
        }
      } else {
        results.missingAnimations.push({
          id: profile.id,
          name: profile.name,
          animation: animation,
          status: 'missing implementation'
        });
        results.issues.push(`${profile.name} uses "${animation}" but animation not implemented`);
      }
    }
  });

  return results;
};

// Test a specific animation by checking if it's in our implemented list
export const testAnimation = (animationName) => {
  return implementedAnimations.includes(animationName);
};

// Get all profiles with working animations
export const getWorkingAnimatedProfiles = () => {
  const profiles = getCosmeticsByType('profiles');
  return profiles.filter(profile => {
    const animation = profile.effects?.animation;
    return animation && animation !== 'none' && implementedAnimations.includes(animation);
  });
};

// Log animation validation results to console
export const logAnimationStatus = () => {
  const results = validateAnimations();
  
  return results;
};

export default {
  validateAnimations,
  testAnimation,
  getWorkingAnimatedProfiles,
  logAnimationStatus,
  implementedAnimations
}; 
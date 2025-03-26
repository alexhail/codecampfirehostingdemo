import * as THREE from 'three';

// Generate random positions within a ring (min to max distance from center)
export function generateRandomPositionsInRing(count, center, minRadius, maxRadius, exclusionZones = []) {
  const positions = [];
  
  for (let i = 0; i < count; i++) {
    let validPosition = false;
    let position;
    
    // Try to find a valid position outside exclusion zones
    let attempts = 0;
    while (!validPosition && attempts < 50) {
      // Random angle and radius
      const angle = Math.random() * Math.PI * 2;
      const radius = minRadius + Math.random() * (maxRadius - minRadius);
      
      // Calculate position
      position = new THREE.Vector3(
        center.x + Math.cos(angle) * radius,
        center.y,
        center.z + Math.sin(angle) * radius
      );
      
      // Check if position is valid (outside all exclusion zones)
      validPosition = !isInExclusionZones(position, exclusionZones);
      attempts++;
    }
    
    if (validPosition) {
      positions.push(position);
    }
  }
  
  return positions;
}

// Check if a position is inside any exclusion zone
function isInExclusionZones(position, exclusionZones) {
  for (const zone of exclusionZones) {
    const distance = position.distanceTo(zone.center);
    if (distance < zone.radius) {
      return true;
    }
  }
  return false;
}

// Define exclusion zones around objects to prevent overlapping
export function createExclusionZones(objects, radiusMultiplier = 1.5) {
  return objects.map(obj => {
    return {
      center: obj.getPosition(),
      radius: 2 * radiusMultiplier // Default exclusion radius
    };
  });
} 
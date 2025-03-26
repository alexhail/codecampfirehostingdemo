import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FirePit } from './components/FirePit.js';
import { Table } from './components/Table.js';
import { Chair } from './components/Chair.js';
import { Player } from './components/Player.js';
import { Tree } from './components/Tree.js';
import { Tent } from './components/Tent.js';
import { generateRandomPositionsInRing, createExclusionZones } from './utils/SceneUtils.js';

// Scene setup
const scene = new THREE.Scene();

// Add skybox with mountains
createSkybox();

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Control game state
let gameStarted = false;
let player = null;
const daytime = {
  current: 'sunset', // 'day', 'sunset', 'night'
  sunPosition: new THREE.Vector3(100, 30, 100),
  skyColor: new THREE.Color(0xffa07a), // Soft sunset orange
  fogColor: new THREE.Color(0xffd1a0),
  fogDensity: 0.003
};

// Create fog for depth and atmosphere
scene.fog = new THREE.FogExp2(daytime.fogColor, daytime.fogDensity);

// Initialize the game on clicking the start button
document.getElementById('start-button').addEventListener('click', function() {
  // Hide the overlay
  document.getElementById('start-overlay').style.display = 'none';
  
  // Start the game if not already started
  if (!gameStarted) {
    startGame();
  }
});

// Lighting
const ambientLight = new THREE.AmbientLight(0x8b7765, 0.7); // Warmer ambient light for sunset
scene.add(ambientLight);

// Directional light for the sun
const sunLight = new THREE.DirectionalLight(0xffb076, 1.0); // Softer sunset color
sunLight.position.copy(daytime.sunPosition);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048; 
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 500;
sunLight.shadow.camera.left = -75;
sunLight.shadow.camera.right = 75;
sunLight.shadow.camera.top = 75;
sunLight.shadow.camera.bottom = -75;
scene.add(sunLight);

// Add a slight warm-colored hemisphere light to simulate sky reflection
const hemisphereLight = new THREE.HemisphereLight(0xffecd6, 0x4b6584, 0.6);
scene.add(hemisphereLight);

// Ground plane
const groundGeometry = new THREE.PlaneGeometry(500, 500);

// Create a procedural grass texture
const textureSize = 1024;
const canvas = document.createElement('canvas');
canvas.width = textureSize;
canvas.height = textureSize;
const context = canvas.getContext('2d');

// Fill background with base green (slightly warmer for sunset)
context.fillStyle = '#3a7438';
context.fillRect(0, 0, textureSize, textureSize);

// Add grass detail
for (let i = 0; i < 5000; i++) {
  const x = Math.random() * textureSize;
  const y = Math.random() * textureSize;
  const size = 1 + Math.random() * 2;
  
  // Vary the color slightly for realism (warmer tones for sunset)
  const r = 45 + Math.random() * 20;
  const g = 100 + Math.random() * 30;
  const b = 30 + Math.random() * 20;
  
  context.fillStyle = `rgb(${r},${g},${b})`;
  context.fillRect(x, y, size, size);
}

const grassTexture = new THREE.CanvasTexture(canvas);
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(20, 20);

const groundMaterial = new THREE.MeshStandardMaterial({ 
  map: grassTexture,
  side: THREE.DoubleSide,
  roughness: 1
});

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Create distant mountains
createMountains();

// Add campground objects
const firePit = new FirePit(scene);
const table = new Table(scene);
const chair = new Chair(scene);

// Add tents
const tent1 = new Tent(scene, new THREE.Vector3(-5, 0, -3));
const tent2 = new Tent(scene, new THREE.Vector3(6, 0, -4));

// Create exclusion zones around existing objects
const existingObjects = [firePit, table, chair, tent1, tent2];
const exclusionZones = createExclusionZones(existingObjects, 2);

// Generate positions for trees
const center = new THREE.Vector3(0, 0, 0);
const treePositions = generateRandomPositionsInRing(20, center, 10, 30, exclusionZones);

// Add trees to the scene
const trees = [];
treePositions.forEach(position => {
  // Randomize tree scale
  const scale = 0.8 + Math.random() * 0.4;
  const tree = new Tree(scene, position, scale);
  trees.push(tree);
});

// Add trees in the forest area between campsite and mountains
addForestRing();

// Add a giant floating text billboard
addFloatingBillboard();

// Add floating platforms for jumping fun
addFloatingPlatforms();

// Create a skybox with a mountain panorama
function createSkybox() {
  // Create a large sphere for the sky
  const skyGeometry = new THREE.SphereGeometry(400, 60, 40);
  // Flip the geometry inside out so we can see it from inside
  skyGeometry.scale(-1, 1, 1);
  
  // Create a procedural sky texture
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 4096; // Double the resolution
  skyCanvas.height = 2048;
  const skyCtx = skyCanvas.getContext('2d');
  
  // Gradient for the sky (soft sunset colors)
  const skyGradient = skyCtx.createLinearGradient(0, 0, 0, skyCanvas.height);
  skyGradient.addColorStop(0, '#204080');    // Deeper blue at top
  skyGradient.addColorStop(0.3, '#5078b0');  // Mid blue
  skyGradient.addColorStop(0.5, '#d18893');  // Soft pink
  skyGradient.addColorStop(0.7, '#f0b07a');  // Gentle orange
  skyGradient.addColorStop(0.85, '#ffd6a0');  // Warm glow at horizon
  skyGradient.addColorStop(1, '#ffefd1');    // Softest horizon light
  
  // Fill the sky background
  skyCtx.fillStyle = skyGradient;
  skyCtx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);
  
  // Add soft clouds
  addSoftCloudsToSky(skyCtx, skyCanvas.width, skyCanvas.height);
  
  // Add gentle rolling mountain silhouettes
  addGentleMountainsToSky(skyCtx, skyCanvas.width, skyCanvas.height);
  
  // Create texture from canvas
  const skyTexture = new THREE.CanvasTexture(skyCanvas);
  
  // Add a small amount of color correction to make it warmer
  const skyMaterial = new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide,
  });
  
  // Create mesh and add to scene
  const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(skyMesh);
}

// Add soft clouds to the sky canvas
function addSoftCloudsToSky(ctx, width, height) {
  // Use a semi-transparent white with soft edges
  const cloudGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
  cloudGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
  cloudGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
  cloudGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  // Add some scattered soft clouds
  for (let i = 0; i < 25; i++) {
    const cloudX = Math.random() * width;
    const cloudY = 200 + Math.random() * 400; // Clouds throughout the sky
    const cloudSize = 120 + Math.random() * 180;
    
    // Save context to restore later
    ctx.save();
    
    // Move to cloud position
    ctx.translate(cloudX, cloudY);
    
    // Create a soft cloud with multiple overlapping circles
    for (let j = 0; j < 8; j++) {
      const offsetX = (Math.random() - 0.5) * cloudSize * 0.6;
      const offsetY = (Math.random() - 0.5) * cloudSize * 0.3;
      const radius = (0.3 + Math.random() * 0.7) * cloudSize * 0.5;
      
      ctx.beginPath();
      // Use the defined gradient pattern
      ctx.fillStyle = cloudGradient;
      // Move gradient to this specific cloud puff
      ctx.translate(offsetX, offsetY);
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      // Reset position for next puff
      ctx.translate(-offsetX, -offsetY);
    }
    
    // Restore context
    ctx.restore();
  }
}

// Add gentle rolling mountain silhouettes to the horizon
function addGentleMountainsToSky(ctx, width, height) {
  const horizonY = height * 0.85; // Position near bottom
  
  // Create 3 mountain ranges with different distances (silhouettes)
  const ranges = [
    { color: 'rgba(40, 45, 60, 0.95)', baseHeight: 100, variance: 60, segments: 20 },
    { color: 'rgba(60, 65, 85, 0.8)', baseHeight: 80, variance: 40, segments: 24 },
    { color: 'rgba(85, 90, 110, 0.6)', baseHeight: 60, variance: 30, segments: 30 }
  ];
  
  ranges.forEach(range => {
    // Create mountain range
    ctx.fillStyle = range.color;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    
    // Create points for the Bezier curve
    const points = [];
    const segmentWidth = width / range.segments;
    
    // Generate control points for smooth mountains
    for (let i = 0; i <= range.segments; i++) {
      const x = i * segmentWidth;
      // Using sine function for more natural rolling mountains
      const heightFactor = Math.sin(i * 0.5) * 0.3 + 0.7; // Variation in height
      const mountainHeight = (range.baseHeight + Math.random() * range.variance) * heightFactor;
      points.push({
        x: x,
        y: horizonY - mountainHeight
      });
    }
    
    // Start at the beginning
    ctx.moveTo(0, horizonY);
    ctx.lineTo(points[0].x, points[0].y);
    
    // Create smooth curve between points
    for (let i = 0; i < points.length - 1; i++) {
      const startPoint = points[i];
      const endPoint = points[i + 1];
      
      // Control point calculations for smooth curve
      const controlX = (startPoint.x + endPoint.x) / 2;
      const controlY = Math.min(startPoint.y, endPoint.y) - 
                      Math.random() * range.variance * 0.3;
      
      // Draw a quadratic curve for smoother mountains
      ctx.quadraticCurveTo(controlX, controlY, endPoint.x, endPoint.y);
    }
    
    // Complete the path
    ctx.lineTo(width, horizonY);
    ctx.lineTo(0, horizonY);
    ctx.closePath();
    ctx.fill();
  });
}

// Create 3D mountains in the distance
function createMountains() {
  // Use more natural colors and move mountains much further away
  const mountainRanges = [
    { distance: 200, count: 10, color: 0x4a5d75, minHeight: 100, maxHeight: 150 },
    { distance: 250, count: 15, color: 0x3a4a60, minHeight: 120, maxHeight: 180 },
    { distance: 180, count: 12, color: 0x2a3a50, minHeight: 90, maxHeight: 140 }
  ];
  
  // Create a smoother mountain shape function
  const createSmoothMountain = (radius, height, segments) => {
    // Use a hemisphere as the base shape for a smoother mountain
    const geometry = new THREE.SphereGeometry(radius, segments, segments, 0, Math.PI * 2, 0, Math.PI / 2);
    
    // Scale to make it the right height
    geometry.scale(1.0, height / radius, 1.0);
    
    // Add terrain-like noise
    const positions = geometry.attributes.position;
    const heights = [];
    
    // First pass - gather initial heights
    for (let i = 0; i < positions.count; i++) {
      heights.push(positions.getY(i));
    }
    
    // Second pass - apply terrain-like noise
    for (let i = 0; i < positions.count; i++) {
      // Don't modify the bottom vertices (y close to 0)
      if (heights[i] > 0.1) {
        // Subtract small amount for valleys, add for peaks
        const noise = (Math.random() - 0.2) * 5;
        positions.setY(i, heights[i] + noise);
      }
    }
    
    geometry.computeVertexNormals();
    return geometry;
  };
  
  mountainRanges.forEach(range => {
    const mountainGroup = new THREE.Group();
    
    // Create main mountains
    for (let i = 0; i < range.count; i++) {
      // Position in a circle around the scene
      const angle = (i / range.count) * Math.PI * 2;
      const distance = range.distance * (0.9 + Math.random() * 0.2);
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      // Create mountain geometry using our custom function
      const height = range.minHeight + Math.random() * (range.maxHeight - range.minHeight);
      // Make the mountains wider to match their height
      const radius = 40 + Math.random() * 40;
      const segments = 16 + Math.floor(Math.random() * 8);
      const mountainGeometry = createSmoothMountain(radius, height, segments);
      
      // Create material with subtle color variation for more realism
      const colorVariation = (Math.random() * 0.1) - 0.05;
      const mountainColor = new THREE.Color(range.color);
      mountainColor.r += colorVariation;
      mountainColor.g += colorVariation;
      mountainColor.b += colorVariation;
      
      const mountainMaterial = new THREE.MeshStandardMaterial({
        color: mountainColor,
        roughness: 0.9,
        metalness: 0.1
      });
      
      const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
      mountain.position.set(x, 0, z);
      mountain.rotation.y = Math.random() * Math.PI * 2;
      mountain.castShadow = true;
      mountain.receiveShadow = true;
      
      mountainGroup.add(mountain);
    }
    
    // Fill gaps with smaller mountains to create continuous range
    for (let i = 0; i < range.count * 1.5; i++) {
      const angle = ((i + 0.5) / range.count) * Math.PI * 2;
      const distance = range.distance * (0.85 + Math.random() * 0.3);
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      const height = range.minHeight * 0.6 + Math.random() * (range.maxHeight - range.minHeight) * 0.6;
      const radius = 30 + Math.random() * 30;
      const segments = 12 + Math.floor(Math.random() * 6); 
      const mountainGeometry = createSmoothMountain(radius, height, segments);
      
      // Slightly darker for background mountains
      const colorAdjustment = -0.05 - (Math.random() * 0.05);
      const mountainColor = new THREE.Color(range.color);
      mountainColor.r += colorAdjustment;
      mountainColor.g += colorAdjustment;
      mountainColor.b += colorAdjustment;
      
      const mountainMaterial = new THREE.MeshStandardMaterial({
        color: mountainColor,
        roughness: 0.9,
        metalness: 0.1
      });
      
      const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
      mountain.position.set(x, 0, z);
      
      // Position these connector mountains slightly differently to fill gaps
      mountain.position.x += (Math.random() - 0.5) * 30;
      mountain.position.z += (Math.random() - 0.5) * 30;
      
      mountain.rotation.y = Math.random() * Math.PI * 2;
      mountain.castShadow = true;
      mountain.receiveShadow = true;
      
      mountainGroup.add(mountain);
    }
    
    scene.add(mountainGroup);
  });
}

// Create a forest of trees between the campsite and the mountains
function addForestRing() {
  // Create three rings of trees at different distances
  const treeRings = [
    { innerRadius: 40, outerRadius: 70, count: 60 },
    { innerRadius: 80, outerRadius: 120, count: 120 },
    { innerRadius: 130, outerRadius: 170, count: 180 }
  ];
  
  treeRings.forEach(ring => {
    // Generate positions for each ring
    for (let i = 0; i < ring.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = ring.innerRadius + Math.random() * (ring.outerRadius - ring.innerRadius);
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      // Check if this position is clear (not too close to other trees)
      let isClear = true;
      const minDistanceToOtherTrees = 5; // Minimum distance between trees
      
      for (const existingTree of trees) {
        const existingPos = existingTree.getPosition();
        const distance = Math.sqrt(
          Math.pow(existingPos.x - x, 2) + Math.pow(existingPos.z - z, 2)
        );
        
        if (distance < minDistanceToOtherTrees) {
          isClear = false;
          break;
        }
      }
      
      if (isClear) {
        // Create a tree with varied scale
        // Trees get smaller as they get further away for better perspective
        const distanceFactor = 1.3 - (radius / ring.outerRadius * 0.3);
        const scale = (0.7 + Math.random() * 0.6) * distanceFactor;
        
        // Vary tree type based on distance (smaller, denser trees further away)
        const position = new THREE.Vector3(x, 0, z);
        const tree = new Tree(scene, position, scale);
        trees.push(tree);
      }
    }
  });
}

// Function to start the game
function startGame() {
  // Add player with controls
  player = new Player(scene, camera);
  
  // Register interactable objects
  setupInteractions();
  
  // Start animation
  gameStarted = true;
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Setup interactions for objects
function setupInteractions() {
  if (!player) return;
  
  // Make fire pit interactable
  if (firePit && firePit.mesh) {
    player.registerInteractable(firePit.mesh, {
      name: 'Fire Pit',
      action: 'add wood to',
      onInteract: (object) => {
        console.log('Added wood to fire pit');
        // Here we could add more wood or make the fire larger
      }
    });
  }
  
  // Make table interactable
  if (table && table.mesh) {
    player.registerInteractable(table.mesh, {
      name: 'Laptop',
      action: 'use',
      onInteract: (object) => {
        console.log('Using laptop on table');
        // Here we could open a UI for the laptop
      }
    });
  }
  
  // Make chair interactable
  if (chair && chair.mesh) {
    player.registerInteractable(chair.mesh, {
      name: 'Chair',
      action: 'sit on',
      onInteract: (object) => {
        console.log('Sitting on chair');
        // Here we could make the player sit
      }
    });
  }
  
  // Make tents interactable
  if (tent1 && tent1.mesh) {
    player.registerInteractable(tent1.mesh, {
      name: 'Tent',
      action: 'enter',
      onInteract: (object) => {
        console.log('Entering tent');
        // Here we could make the player enter the tent
      }
    });
  }
  
  if (tent2 && tent2.mesh) {
    player.registerInteractable(tent2.mesh, {
      name: 'Tent',
      action: 'enter',
      onInteract: (object) => {
        console.log('Entering tent');
        // Here we could make the player enter the tent
      }
    });
  }
}

// Animate the sunset - subtle changes in lighting and colors
function updateDaytime(deltaTime) {
  // In the future, we could implement a day/night cycle here
  // For now, just subtly animate the sunset colors
  
  // Oscillate the sun height very gently
  const sunHeight = 30 + Math.sin(Date.now() * 0.0001) * 1.5;
  sunLight.position.y = sunHeight;
  
  // Gently change sun color intensity
  const intensity = 1.1 + Math.sin(Date.now() * 0.0002) * 0.1;
  sunLight.intensity = intensity;
  
  // Update shadow camera to follow sun position
  sunLight.shadow.camera.updateProjectionMatrix();
}

// Animation loop
let lastTime = 0;
function animate(time = 0) {
  const deltaTime = (time - lastTime) * 0.001; // Convert to seconds
  lastTime = time;
  
  // Update daytime effects
  updateDaytime(deltaTime);
  
  // Only update player if game has started
  if (gameStarted && player) {
    // Update player controls
    player.update();
  }
  
  // Update fire particles
  firePit.update(deltaTime);
  
  // Update laptop screen
  table.update(time * 0.001); // Pass time in seconds
  
  // Render the scene
  renderer.render(scene, camera);
  
  // Loop the animation
  requestAnimationFrame(animate);
}

// Start the animation loop immediately
animate();

// Create a giant floating text billboard
function addFloatingBillboard() {
  // Load font
  const fontLoader = new FontLoader();
  
  // Create a colorful material for the text
  const textMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xff4f5e, emissive: 0x660000, roughness: 0.3 }), // Red
    new THREE.MeshStandardMaterial({ color: 0xff9f00, emissive: 0x663300, roughness: 0.3 }), // Orange
    new THREE.MeshStandardMaterial({ color: 0xffcf00, emissive: 0x665500, roughness: 0.3 }), // Yellow
    new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x006600, roughness: 0.3 }), // Green
    new THREE.MeshStandardMaterial({ color: 0x0088ff, emissive: 0x000066, roughness: 0.3 }), // Blue
    new THREE.MeshStandardMaterial({ color: 0x9400ff, emissive: 0x550066, roughness: 0.3 })  // Purple
  ];
  
  // Create the text geometry from a built-in font
  const textGroup = new THREE.Group();
  const message = "CODE CAMPFIRE ROCKS!";
  
  // Load the proper font and create the text
  fontLoader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', (font) => {
    // Create proper text with the loaded font
    const textGeometry = new TextGeometry(message, {
      font: font,
      size: 10,
      height: 2,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.5,
      bevelSize: 0.3,
      bevelOffset: 0,
      bevelSegments: 5
    });
    
    // Center the text
    textGeometry.computeBoundingBox();
    const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
    const centerOffset = -textWidth / 2;
    
    // Create the text mesh
    const textMesh = new THREE.Mesh(textGeometry, textMaterials);
    textMesh.position.set(centerOffset, 0, 0);
    textMesh.castShadow = true;
    textMesh.receiveShadow = true;
    
    // Add to the group
    textGroup.add(textMesh);
  });
  
  // Position the text high in the sky facing the campfire
  textGroup.position.set(0, 70, -100);
  textGroup.rotation.set(-Math.PI / 10, 0, 0); // Tilt slightly for better visibility
  
  // Add a subtle animation to the text
  const animateText = () => {
    textGroup.rotation.y = Math.sin(Date.now() * 0.0005) * 0.1;
    textGroup.position.y = 70 + Math.sin(Date.now() * 0.001) * 3;
    
    // Apply a slow color change to each material
    if (textMaterials.length > 0) {
      const t = Date.now() * 0.0002;
      textMaterials.forEach((material, index) => {
        const hue = (t + index / textMaterials.length) % 1;
        const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
        const emissiveColor = new THREE.Color().setHSL(hue, 0.8, 0.3);
        material.color.copy(color);
        material.emissive.copy(emissiveColor);
      });
    }
    
    requestAnimationFrame(animateText);
  };
  
  // Start animation
  animateText();
  
  // Add the text group to the scene
  scene.add(textGroup);
  
  // Add a glowing halo effect behind the text
  const haloGeometry = new THREE.PlaneGeometry(150, 40);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0xffcc44,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  
  const halo = new THREE.Mesh(haloGeometry, haloMaterial);
  halo.position.set(0, 70, -105);
  halo.rotation.set(-Math.PI / 10, 0, 0); // Match text rotation
  scene.add(halo);
  
  // Animate the halo
  const animateHalo = () => {
    halo.position.y = textGroup.position.y;
    halo.rotation.y = textGroup.rotation.y;
    
    // Pulse the halo
    const scale = 1 + Math.sin(Date.now() * 0.002) * 0.1;
    halo.scale.set(scale, scale, 1);
    
    // Change halo color
    const hue = (Date.now() * 0.0001) % 1;
    haloMaterial.color.setHSL(hue, 0.8, 0.6);
    
    requestAnimationFrame(animateHalo);
  };
  
  // Start halo animation
  animateHalo();
}

// Add floating platforms for jumping fun
function addFloatingPlatforms() {
  // Create a collection to store all collidable objects
  window.collidableObjects = window.collidableObjects || [];
  
  // Platform materials - with emissive properties for a glowing effect
  const platformMaterials = [
    new THREE.MeshStandardMaterial({ 
      color: 0x00aaff, 
      emissive: 0x003366, 
      emissiveIntensity: 0.5,
      roughness: 0.3 
    }),
    new THREE.MeshStandardMaterial({ 
      color: 0xff5500, 
      emissive: 0x661100, 
      emissiveIntensity: 0.5,
      roughness: 0.3 
    }),
    new THREE.MeshStandardMaterial({ 
      color: 0x00ff66, 
      emissive: 0x006622, 
      emissiveIntensity: 0.5,
      roughness: 0.3 
    }),
    new THREE.MeshStandardMaterial({ 
      color: 0xffcc00, 
      emissive: 0x664400, 
      emissiveIntensity: 0.5,
      roughness: 0.3 
    }),
  ];
  
  // Platform configurations in a path going upward
  const platformConfigs = [
    { position: new THREE.Vector3(10, 8, 0), scale: new THREE.Vector3(5, 0.5, 5) },
    { position: new THREE.Vector3(20, 15, -5), scale: new THREE.Vector3(4, 0.5, 4) },
    { position: new THREE.Vector3(15, 25, -15), scale: new THREE.Vector3(4, 0.5, 4) },
    { position: new THREE.Vector3(0, 35, -20), scale: new THREE.Vector3(6, 0.5, 6) },
    { position: new THREE.Vector3(-15, 45, -10), scale: new THREE.Vector3(4, 0.5, 4) },
    { position: new THREE.Vector3(-20, 55, 5), scale: new THREE.Vector3(4, 0.5, 4) },
    { position: new THREE.Vector3(-10, 65, 15), scale: new THREE.Vector3(4, 0.5, 4) },
    { position: new THREE.Vector3(0, 75, 0), scale: new THREE.Vector3(10, 0.5, 10) }, // Large platform at the top
  ];
  
  // Create platforms
  platformConfigs.forEach((config, index) => {
    const material = platformMaterials[index % platformMaterials.length];
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const platform = new THREE.Mesh(geometry, material);
    
    platform.position.copy(config.position);
    platform.scale.copy(config.scale);
    platform.castShadow = true;
    platform.receiveShadow = true;
    
    // Add collision data
    platform.userData.isCollidable = true;
    platform.userData.type = 'platform';
    
    // Create a collision box slightly larger than the platform
    platform.userData.collisionBox = new THREE.Box3().setFromObject(platform);
    
    // Add platform to scene
    scene.add(platform);
    
    // Add to collidable objects array
    window.collidableObjects.push(platform);
    
    // Add a simple animation to make platforms float up and down
    const animatePlatform = () => {
      const time = Date.now() * 0.0005; // Slower animation speed (half as fast)
      const offset = Math.sin(time + index) * 0.5; // Keep the same amplitude
      platform.position.y = config.position.y + offset;
      
      // Update collision box position
      platform.userData.collisionBox.setFromObject(platform);
      
      requestAnimationFrame(animatePlatform);
    };
    
    // Start animation
    animatePlatform();
  });
  
  // Add a special platform under the billboard
  const billboardPlatform = new THREE.Mesh(
    new THREE.BoxGeometry(30, 1, 10),
    new THREE.MeshStandardMaterial({ 
      color: 0xff00ff, 
      emissive: 0x660066,
      emissiveIntensity: 0.7,
      roughness: 0.3 
    })
  );
  
  billboardPlatform.position.set(0, 60, -100);
  billboardPlatform.castShadow = true;
  billboardPlatform.receiveShadow = true;
  
  // Add collision data
  billboardPlatform.userData.isCollidable = true;
  billboardPlatform.userData.type = 'platform';
  billboardPlatform.userData.collisionBox = new THREE.Box3().setFromObject(billboardPlatform);
  
  scene.add(billboardPlatform);
  window.collidableObjects.push(billboardPlatform);
  
  // Make mountains collidable
  makeMountainsCollidable();
}

// Make mountains collidable
function makeMountainsCollidable() {
  // We'll create simplified collision geometry for the mountains
  // Find all mountain meshes in the scene
  scene.traverse(object => {
    // Only process mountain meshes
    if (object instanceof THREE.Mesh && 
        object.userData.type !== 'platform' && 
        !object.userData.isCollidable) {
      
      // Check if the object is likely a mountain based on size and position
      const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
      const isMountain = size.y > 30 && object.position.y < 10 && 
                        Math.abs(object.position.x) > 100 || 
                        Math.abs(object.position.z) > 100;
      
      if (isMountain) {
        // Mark as collidable
        object.userData.isCollidable = true;
        object.userData.type = 'mountain';
        
        // Create a simplified collision box
        object.userData.collisionBox = new THREE.Box3().setFromObject(object);
        
        // Add to collidable objects
        window.collidableObjects.push(object);
      }
    }
  });
} 